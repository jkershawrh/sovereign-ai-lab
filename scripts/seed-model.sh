#!/bin/bash
# ── Seed model: download Granite and convert to OpenVINO INT4 ─────────────
# Aligned with infrastructure/oberon/convert-sovereign-model.yaml
# which uses optimum-intel OVModelForCausalLM for INT4 quantized export.
set -euo pipefail
source .env 2>/dev/null || true

MODEL_ID="ibm-granite/granite-3.2-2b-instruct"
FULL_MODEL_DIR="/tmp/granite-3.2-2b-full"
OUTPUT_DIR="inference/models/granite-3.2-2b-instruct-q4"

# ── Idempotency: skip if model already converted ─────────────────────────
if [ -d "$OUTPUT_DIR" ] && [ -f "$OUTPUT_DIR/openvino_model.xml" ]; then
  echo "OpenVINO model already present at $OUTPUT_DIR"
  exit 0
fi

# ── Step 1: Download full model from HuggingFace ─────────────────────────
if [ -d "$FULL_MODEL_DIR" ] && [ "$(ls -A "$FULL_MODEL_DIR" 2>/dev/null)" ]; then
  echo "Full model already cached at $FULL_MODEL_DIR"
else
  echo "Downloading $MODEL_ID from Hugging Face..."
  pip install huggingface_hub --quiet
  python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(
  repo_id='$MODEL_ID',
  local_dir='$FULL_MODEL_DIR',
  token='${HF_TOKEN:-}' or None
)
"
fi

# ── Step 2: Convert to OpenVINO INT4 ─────────────────────────────────────
echo "Converting to OpenVINO INT4 format..."
pip install optimum-intel[openvino] openvino openvino-tokenizers nncf --quiet

mkdir -p "$OUTPUT_DIR"

python3 -c "
import os
from optimum.intel import OVModelForCausalLM
from transformers import AutoTokenizer

src = '$FULL_MODEL_DIR'
dest = '$OUTPUT_DIR'

# Use HF hub ID as fallback if local dir is missing files
if not os.path.exists(os.path.join(src, 'config.json')):
    src = '$MODEL_ID'
    print(f'Local cache incomplete, using HF hub: {src}')

print(f'Converting {src} -> {dest} (INT4)...')
model = OVModelForCausalLM.from_pretrained(
    src, export=True,
    quantization_config={'bits': 4, 'sym': True}
)
tokenizer = AutoTokenizer.from_pretrained(src)
os.makedirs(dest, exist_ok=True)
model.save_pretrained(dest)
tokenizer.save_pretrained(dest)
print(f'DONE: OpenVINO INT4 model saved to {dest}')
"

echo "Base model ready at $OUTPUT_DIR"
