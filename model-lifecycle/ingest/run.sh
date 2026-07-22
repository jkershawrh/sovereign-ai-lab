#!/bin/bash
# ── Ingest stage: extract text from jurisdiction-local documents ──────────
# Tries Docling (Docker) first, falls back to Python markdown/PDF parsing.
# Input:  sample-docs/*.md  or  sample-docs/*.pdf
# Output: output/<name>.json   per document
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT_DIR="${SCRIPT_DIR}/sample-docs"
OUTPUT_DIR="${SCRIPT_DIR}/output"
LEDGER_API="${LEDGER_API:-http://localhost:28099}"
DOCLING_IMAGE="ghcr.io/ds4sd/docling:latest"

# ── Idempotency: skip if output already exists ────────────────────────────
if [ -d "$OUTPUT_DIR" ] && [ "$(ls "$OUTPUT_DIR"/*.json 2>/dev/null | wc -l)" -gt 0 ]; then
  DOCS=$(ls "$OUTPUT_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
  echo "Ingest output already present ($DOCS documents). Skipping."
  exit 0
fi

mkdir -p "$OUTPUT_DIR"

# ── Helper: attempt Docling via Docker for PDF extraction ─────────────────
try_docling() {
  local file="$1"
  local name="$2"

  # Check Docker/Podman availability
  local engine=""
  if command -v podman &>/dev/null; then engine="podman";
  elif command -v docker &>/dev/null; then engine="docker";
  else return 1; fi

  echo "  Trying Docling ($engine) for $file ..."
  $engine run --rm \
    -v "${INPUT_DIR}:/input:ro" \
    -v "${OUTPUT_DIR}:/output" \
    "$DOCLING_IMAGE" \
    docling --input "/input/$(basename "$file")" --output /output --to json \
    2>/dev/null && return 0

  return 1
}

# ── Helper: Python-based extraction (markdown or PDF) ─────────────────────
python_extract() {
  local file="$1"
  local name="$2"
  local ext="${file##*.}"

  python3 - "$file" "$name" "$ext" "$OUTPUT_DIR" <<'PYEOF'
import json, sys
from pathlib import Path

file_path = Path(sys.argv[1])
name      = sys.argv[2]
ext       = sys.argv[3]
out_dir   = Path(sys.argv[4])

text = ""
page_count = 1

if ext == "md":
    text = file_path.read_text(encoding="utf-8", errors="replace")
    # Estimate pages from section headings
    page_count = max(1, text.count("\n## "))

elif ext == "pdf":
    # Try pypdf first
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n\n".join(pages)
        page_count = len(reader.pages)
    except ImportError:
        pass

    # Fall back to PyPDF2
    if not text:
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(str(file_path))
            pages = []
            for page in reader.pages:
                pages.append(page.extract_text() or "")
            text = "\n\n".join(pages)
            page_count = len(reader.pages)
        except ImportError:
            pass

    # Fall back to pdftotext CLI
    if not text:
        import subprocess
        try:
            result = subprocess.run(
                ["pdftotext", str(file_path), "-"],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                text = result.stdout
                page_count = max(1, text.count("\f") + 1)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

    if not text:
        print(f"  WARNING: Could not extract text from {file_path.name} (no PDF library available)")
        text = f"[extraction failed for {file_path.name}]"

elif ext == "txt":
    text = file_path.read_text(encoding="utf-8", errors="replace")

else:
    text = file_path.read_text(encoding="utf-8", errors="replace")

# Build structured output
doc = {
    "source": name,
    "filename": file_path.name,
    "text": text,
    "pages": page_count,
    "extraction_method": "python",
    "char_count": len(text),
}

out_file = out_dir / f"{name}.json"
out_file.write_text(json.dumps(doc, indent=2, ensure_ascii=False))
print(f"  Extracted {file_path.name} -> {name}.json ({len(text)} chars, {page_count} pages)")
PYEOF
}

# ── Main: process every document in sample-docs ───────────────────────────
DOCS=0
for file in "$INPUT_DIR"/*; do
  [ -f "$file" ] || continue
  name=$(basename "${file%.*}")  # strip extension

  # Try Docling for PDFs, fall back to Python extraction
  ext="${file##*.}"
  if [ "$ext" = "pdf" ]; then
    try_docling "$file" "$name" || python_extract "$file" "$name"
  else
    python_extract "$file" "$name"
  fi

  DOCS=$((DOCS + 1))
done

if [ "$DOCS" -eq 0 ]; then
  echo "WARNING: No documents found in $INPUT_DIR"
  exit 1
fi

echo "Ingested $DOCS document(s) into $OUTPUT_DIR"

# ── Ledger entry ──────────────────────────────────────────────────────────
python3 -c "
import json, urllib.request
body = json.dumps({
    'entry_type': 'pipeline.ingest.completed',
    'agent_id': 'model-lifecycle/ingest/run.sh',
    'content': json.dumps({'document_count': $DOCS, 'output_dir': '$OUTPUT_DIR'}),
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
