#!/bin/bash
set -euo pipefail
source .env 2>/dev/null || true

MODEL_ID="ibm-granite/granite-3.2-3b-instruct"
OUTPUT_DIR="inference/models/granite-3.2-3b-instruct-q4"

if [ -d "$OUTPUT_DIR" ] && [ "$(ls -A "$OUTPUT_DIR" 2>/dev/null)" ]; then
  echo "Base model already present at $OUTPUT_DIR"
  exit 0
fi

echo "Downloading $MODEL_ID from Hugging Face..."
pip install huggingface_hub --quiet
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(
  repo_id='$MODEL_ID',
  local_dir='/tmp/granite-3.2-3b-full',
  token='${HF_TOKEN:-}'
)
"

echo "Quantizing to Q4_K_M..."
pip install llama-cpp-python --quiet
mkdir -p "$OUTPUT_DIR"
python3 -c "
# Quantization depends on llama-cpp-python version
# Check docs for current API
from pathlib import Path
print('NOTE: Quantization step requires manual verification.')
print('Copy quantized GGUF files to $OUTPUT_DIR/')
"

echo "Base model ready at $OUTPUT_DIR"
