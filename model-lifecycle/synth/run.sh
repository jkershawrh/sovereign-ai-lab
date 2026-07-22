#!/bin/bash
# ── Synth stage: generate synthetic QA pairs from ingested documents ──────
# Tries vLLM endpoint first, falls back to extractive sentence pairing.
# Input:  ../ingest/output/*.json
# Output: output/synthetic-qa.jsonl
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INGEST_DIR="${SCRIPT_DIR}/../ingest/output"
OUTPUT_DIR="${SCRIPT_DIR}/output"
OUTPUT_FILE="${OUTPUT_DIR}/synthetic-qa.jsonl"
LEDGER_API="${LEDGER_API:-http://localhost:28099}"
VLLM_ENDPOINT="${VLLM_ENDPOINT:-http://localhost:8000/v1/chat/completions}"
VLLM_MODEL="${VLLM_MODEL:-ibm-granite/granite-3.2-2b-instruct}"

# ── Idempotency: skip if output already exists ────────────────────────────
if [ -f "$OUTPUT_FILE" ] && [ "$(wc -l < "$OUTPUT_FILE" | tr -d ' ')" -gt 0 ]; then
  SAMPLES=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
  echo "Synth output already present ($SAMPLES QA pairs). Skipping."
  exit 0
fi

# Verify input exists
if [ ! -d "$INGEST_DIR" ] || [ "$(ls "$INGEST_DIR"/*.json 2>/dev/null | wc -l)" -eq 0 ]; then
  echo "ERROR: No ingested documents found in $INGEST_DIR"
  echo "       Run the ingest stage first."
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ── Generate QA pairs ────────────────────────────────────────────────────
python3 - "$INGEST_DIR" "$OUTPUT_FILE" "$VLLM_ENDPOINT" "$VLLM_MODEL" <<'PYEOF'
import json, sys, os, re, textwrap
from pathlib import Path

ingest_dir   = Path(sys.argv[1])
output_file  = Path(sys.argv[2])
vllm_url     = sys.argv[3]
vllm_model   = sys.argv[4]

# ── Load and chunk documents ─────────────────────────────────────────────
def chunk_text(text, max_chars=1500, overlap=200):
    """Split text into overlapping chunks at paragraph boundaries."""
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) > max_chars and current:
            chunks.append(current.strip())
            # Keep last part for overlap
            words = current.split()
            overlap_words = words[-overlap // 5:] if len(words) > overlap // 5 else []
            current = " ".join(overlap_words) + "\n\n" + para
        else:
            current = current + "\n\n" + para if current else para
    if current.strip():
        chunks.append(current.strip())
    return chunks

documents = []
for doc_file in sorted(ingest_dir.glob("*.json")):
    try:
        data = json.loads(doc_file.read_text())
        text = data.get("text", "")
        if len(text) > 100:
            documents.append({
                "source": data.get("source", doc_file.stem),
                "text": text,
                "chunks": chunk_text(text),
            })
    except (json.JSONDecodeError, KeyError) as e:
        print(f"  WARNING: Skipping {doc_file.name}: {e}")

print(f"Loaded {len(documents)} documents with {sum(len(d['chunks']) for d in documents)} chunks total")

# ── Try vLLM for LLM-generated QA pairs ─────────────────────────────────
def try_vllm_qa(chunk, source):
    """Generate QA pairs using vLLM chat completions endpoint."""
    import urllib.request

    prompt = textwrap.dedent(f"""\
        Generate 3 question-answer pairs about the following text.
        Return ONLY a JSON array of objects, each with "question" and "answer" fields.
        Do not include any other text or explanation.

        Text:
        {chunk}
    """)

    payload = json.dumps({
        "model": vllm_model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that generates question-answer pairs from policy documents. Always respond with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 1024,
    }).encode()

    req = urllib.request.Request(
        vllm_url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())

    content = result["choices"][0]["message"]["content"]

    # Extract JSON array from response (handle markdown code blocks)
    json_match = re.search(r'\[.*\]', content, re.DOTALL)
    if json_match:
        qa_list = json.loads(json_match.group())
    else:
        qa_list = json.loads(content)

    pairs = []
    for item in qa_list:
        if "question" in item and "answer" in item:
            pairs.append({
                "question": item["question"].strip(),
                "answer": item["answer"].strip(),
                "source": source,
                "synthetic": True,
                "method": "vllm",
            })
    return pairs

# ── Extractive fallback: derive QA from structure ────────────────────────
def extractive_qa(chunk, source):
    """Generate QA pairs by extracting key sentences and forming questions."""
    pairs = []
    sentences = re.split(r'(?<=[.!?])\s+', chunk)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 40]

    for i, sentence in enumerate(sentences[:6]):
        # Create question from bold headings if present
        bold_match = re.search(r'\*\*(.+?)\*\*', sentence)
        if bold_match:
            topic = bold_match.group(1).rstrip('.')
            question = f"What does the policy say about {topic}?"
        elif sentence.lower().startswith(("all ", "any ", "every ")):
            question = f"What is required regarding: {sentence[:60]}...?"
        elif "must" in sentence.lower():
            question = f"What must be done regarding: {sentence[:60]}...?"
        else:
            # Use the beginning of the sentence as a topic prompt
            question = f"What does the document state about: {sentence[:70]}...?"

        answer = sentence
        # Include the next sentence for context if available
        if i + 1 < len(sentences):
            answer = sentence + " " + sentences[i + 1]

        pairs.append({
            "question": question,
            "answer": answer[:500],
            "source": source,
            "synthetic": True,
            "method": "extractive",
        })

        if len(pairs) >= 3:
            break

    return pairs

# ── Main generation loop ─────────────────────────────────────────────────
vllm_available = False
qa_pairs = []

# Test vLLM availability
try:
    test_result = try_vllm_qa("Test: AI models must be evaluated.", "test")
    if test_result:
        vllm_available = True
        print(f"vLLM endpoint available at {vllm_url}")
except Exception as e:
    print(f"vLLM not available ({e}). Using extractive fallback.")

for doc in documents:
    source = doc["source"]
    for chunk_idx, chunk in enumerate(doc["chunks"]):
        if vllm_available:
            try:
                pairs = try_vllm_qa(chunk, source)
                qa_pairs.extend(pairs)
                print(f"  {source} chunk {chunk_idx}: {len(pairs)} QA pairs (vLLM)")
                continue
            except Exception as e:
                print(f"  {source} chunk {chunk_idx}: vLLM failed ({e}), using extractive")

        pairs = extractive_qa(chunk, source)
        qa_pairs.extend(pairs)
        print(f"  {source} chunk {chunk_idx}: {len(pairs)} QA pairs (extractive)")

# Write output
with open(output_file, "w") as f:
    for qa in qa_pairs:
        f.write(json.dumps(qa, ensure_ascii=False) + "\n")

method = "vLLM" if vllm_available else "extractive"
print(f"\nGenerated {len(qa_pairs)} synthetic QA pairs ({method} method)")
PYEOF

SAMPLES=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
echo "Synth output: $SAMPLES QA pairs in $OUTPUT_FILE"

# ── Ledger entry ──────────────────────────────────────────────────────────
python3 -c "
import json, urllib.request
body = json.dumps({
    'entry_type': 'pipeline.synth.completed',
    'agent_id': 'model-lifecycle/synth/run.sh',
    'content': json.dumps({'sample_count': $SAMPLES, 'output_file': '$OUTPUT_FILE'}),
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
