#!/bin/bash
# ── Train stage: LoRA fine-tune Granite on sovereign QA data ──────────────
# Uses HuggingFace SFTTrainer with LoRA (PEFT) for parameter-efficient tuning.
# Falls back to a documented placeholder if dependencies cannot be installed.
# Input:  ../synth/output/synthetic-qa.jsonl
# Output: output/sovereign-granite-3b/  (LoRA adapter weights)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYNTH_FILE="${SCRIPT_DIR}/../synth/output/synthetic-qa.jsonl"
OUTPUT_DIR="${SCRIPT_DIR}/output/sovereign-granite-3b"
LEDGER_API="${LEDGER_API:-http://localhost:28099}"

# Model: prefer local cached weights, fall back to HF hub
LOCAL_MODEL="${SCRIPT_DIR}/../../inference/models/granite-3.2-2b-instruct-q4"
HF_MODEL="ibm-granite/granite-3.2-2b-instruct"

# ── Idempotency: skip if adapter already exists ───────────────────────────
if [ -d "$OUTPUT_DIR" ] && [ -f "$OUTPUT_DIR/adapter_config.json" ]; then
  echo "LoRA adapter already present at $OUTPUT_DIR. Skipping."
  exit 0
fi

# Verify input exists
if [ ! -f "$SYNTH_FILE" ] || [ "$(wc -l < "$SYNTH_FILE" | tr -d ' ')" -eq 0 ]; then
  echo "ERROR: No synthetic training data found at $SYNTH_FILE"
  echo "       Run the synth stage first."
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ── Attempt real training ─────────────────────────────────────────────────
echo "Installing training dependencies..."
DEPS_OK=true
pip install peft transformers datasets trl torch --quiet 2>/dev/null || DEPS_OK=false

if [ "$DEPS_OK" = true ]; then
  echo "Dependencies installed. Starting LoRA fine-tuning..."

  MODEL_PATH="$HF_MODEL"
  if [ -d "$LOCAL_MODEL" ] && [ "$(ls -A "$LOCAL_MODEL" 2>/dev/null)" ]; then
    MODEL_PATH="$LOCAL_MODEL"
    echo "  Using local model at $MODEL_PATH"
  else
    echo "  Using HuggingFace model: $MODEL_PATH"
  fi

  python3 - "$SYNTH_FILE" "$OUTPUT_DIR" "$MODEL_PATH" <<'PYEOF'
import json, sys, os
from pathlib import Path

synth_file = Path(sys.argv[1])
output_dir = sys.argv[2]
model_path = sys.argv[3]

# ── Load training data ───────────────────────────────────────────────────
print("Loading training data...")
qa_pairs = []
with open(synth_file) as f:
    for line in f:
        line = line.strip()
        if line:
            qa_pairs.append(json.loads(line))

print(f"  {len(qa_pairs)} QA pairs loaded")

if len(qa_pairs) == 0:
    print("ERROR: No training data found")
    sys.exit(1)

# ── Format as chat-style training examples ────────────────────────────────
def format_chat(qa):
    return (
        f"<|system|>\nYou are a sovereign AI assistant trained on jurisdiction-local policy documents.\n"
        f"<|user|>\n{qa['question']}\n"
        f"<|assistant|>\n{qa['answer']}\n"
    )

training_texts = [format_chat(qa) for qa in qa_pairs]

# ── Set up model and LoRA ─────────────────────────────────────────────────
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"  Device: {device}")
print(f"  Loading model from: {model_path}")

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(
    model_path,
    trust_remote_code=True,
)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Load model (use float32 on CPU, bfloat16 on GPU)
dtype = torch.bfloat16 if device == "cuda" else torch.float32
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=dtype,
    device_map=device,
    trust_remote_code=True,
)

# ── LoRA configuration ───────────────────────────────────────────────────
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# ── Prepare dataset ───────────────────────────────────────────────────────
dataset = Dataset.from_dict({"text": training_texts})

# ── Training ──────────────────────────────────────────────────────────────
try:
    from trl import SFTTrainer, SFTConfig

    sft_config = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=1,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        logging_steps=5,
        save_strategy="epoch",
        max_seq_length=512,
        fp16=False,
        bf16=(device == "cuda"),
        report_to="none",
        seed=42,
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        processing_class=tokenizer,
        args=sft_config,
    )
except (ImportError, TypeError):
    # Older trl versions use TrainingArguments directly
    from trl import SFTTrainer

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=1,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        logging_steps=5,
        save_strategy="epoch",
        fp16=False,
        bf16=(device == "cuda"),
        report_to="none",
        seed=42,
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        tokenizer=tokenizer,
        args=training_args,
        dataset_text_field="text",
        max_seq_length=512,
    )

print("\nStarting training...")
trainer.train()

# ── Save LoRA adapter ────────────────────────────────────────────────────
print(f"\nSaving LoRA adapter to {output_dir}")
model.save_pretrained(output_dir)
tokenizer.save_pretrained(output_dir)

# Write training metadata
metadata = {
    "status": "completed",
    "method": "sft_lora",
    "base_model": model_path,
    "lora_r": 16,
    "lora_alpha": 32,
    "target_modules": ["q_proj", "v_proj"],
    "epochs": 1,
    "max_seq_length": 512,
    "training_samples": len(qa_pairs),
    "device": device,
    "dtype": str(dtype),
}
Path(output_dir, "training-config.json").write_text(json.dumps(metadata, indent=2))
print("Training complete.")
PYEOF

  TRAIN_STATUS=$?
  if [ "$TRAIN_STATUS" -eq 0 ]; then
    echo "LoRA fine-tuning complete. Adapter saved to $OUTPUT_DIR"
  else
    echo "Training script failed (exit $TRAIN_STATUS). Creating fallback placeholder."
    DEPS_OK=false
  fi
fi

# ── Fallback: documented placeholder ──────────────────────────────────────
if [ "$DEPS_OK" = false ] || [ ! -f "$OUTPUT_DIR/adapter_config.json" ]; then
  echo "Training dependencies not available. Creating documented placeholder."
  cat > "$OUTPUT_DIR/training-config.json" <<PLACEHOLDER
{
  "status": "placeholder",
  "method": "sft_lora",
  "base_model": "ibm-granite/granite-3.2-2b-instruct",
  "lora_r": 16,
  "lora_alpha": 32,
  "target_modules": ["q_proj", "v_proj"],
  "epochs": 1,
  "max_seq_length": 512,
  "note": "Placeholder: install peft, transformers, datasets, trl, torch to run real LoRA training. The SFTTrainer from trl will fine-tune the Granite 2B model on sovereign QA data with LoRA (r=16, alpha=32) targeting q_proj and v_proj attention layers. On a CPU this takes ~30-60 min for 1 epoch on ~50 samples.",
  "commands_to_run": [
    "pip install peft transformers datasets trl torch",
    "cd model-lifecycle/train && bash run.sh"
  ]
}
PLACEHOLDER
fi

# ── Ledger entry ──────────────────────────────────────────────────────────
STATUS="completed"
if [ ! -f "$OUTPUT_DIR/adapter_config.json" ]; then
  STATUS="placeholder"
fi

python3 -c "
import json, urllib.request
body = json.dumps({
    'entry_type': 'pipeline.train.completed',
    'agent_id': 'model-lifecycle/train/run.sh',
    'content': json.dumps({'output_dir': '$OUTPUT_DIR', 'status': '$STATUS'}),
    'content_type': 'application/json',
    'source_id': 'sovereign-ai-lab',
}).encode()
req = urllib.request.Request('${LEDGER_API}/api/entries', data=body,
                             headers={'Content-Type': 'application/json'})
try:
    resp = json.loads(urllib.request.urlopen(req, timeout=5).read())
    print(f\"Ledger: {resp.get('entry_hash', 'unknown')}\")
except Exception as e:
    print(f'Ledger write failed (non-fatal): {e}')
"
