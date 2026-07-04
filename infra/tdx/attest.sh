#!/bin/bash
set -euo pipefail

source .env 2>/dev/null || true

LEDGER_API="${LEDGER_API:-http://localhost:28099}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "Running TDX attestation..."

if command -v tdx_quote_generator &>/dev/null; then
  echo "Generating real TDX quote..."
  TD_QUOTE=$(tdx_quote_generator 2>/dev/null)
  QUOTE_TYPE="real"
else
  echo "WARNING: tdx_quote_generator not found. Using simulated quote."
  TD_QUOTE="SIMULATED_QUOTE_$(date +%s)"
  QUOTE_TYPE="simulated"
fi

QUOTE_HASH=$(echo -n "$TD_QUOTE" | shasum -a 256 | cut -d' ' -f1)

if [ "$QUOTE_TYPE" = "real" ] && [ -n "${ITA_API_KEY:-}" ]; then
  echo "Calling Intel Trust Authority..."
  RESPONSE=$(curl -s -X POST "${ITA_ENDPOINT:-https://api.trustauthority.intel.com}/appraisal/v2/attest" \
    -H "x-api-key: ${ITA_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"quote\": \"${TD_QUOTE}\"}")
  echo "$RESPONSE" > infra/tdx/attestation-report.json
  TCB_STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tcb_status','unknown'))" 2>/dev/null || echo "unknown")
else
  echo "Using simulated attestation report."
  TCB_STATUS="UpToDate-simulated"
  cat > infra/tdx/attestation-report.json << REPORT
{
  "tcb_status": "$TCB_STATUS",
  "quote_hash": "$QUOTE_HASH",
  "timestamp": "$TIMESTAMP",
  "simulated": true
}
REPORT
fi

cat > infra/tdx/attestation-summary.txt << SUMMARY
TDX Attestation Summary
=======================
Timestamp:   $TIMESTAMP
TCB Status:  $TCB_STATUS
Quote Hash:  $QUOTE_HASH
Quote Type:  $QUOTE_TYPE
SUMMARY

echo "Attestation report written to infra/tdx/attestation-report.json"
cat infra/tdx/attestation-summary.txt

CONTENT_JSON=$(python3 -c "
import json
d = {'tcb_status': '${TCB_STATUS}', 'quote_hash': '${QUOTE_HASH}', 'timestamp': '${TIMESTAMP}', 'quote_type': '${QUOTE_TYPE}'}
print(json.dumps(json.dumps(d)))
")

LEDGER_RESPONSE=$(curl -s -X POST "${LEDGER_API}/api/entries" \
  -H "Content-Type: application/json" \
  -d "{
    \"entry_type\": \"tdx.attestation.completed\",
    \"agent_id\": \"infra/tdx/attest.sh\",
    \"content\": ${CONTENT_JSON},
    \"content_type\": \"application/json\",
    \"source_id\": \"sovereign-ai-lab\"
  }" 2>/dev/null || echo '{"error": "ledger not reachable"}')

LEDGER_HASH=$(echo "$LEDGER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entry_hash','ledger-unreachable'))" 2>/dev/null || echo "parse-error")
echo "Ledger entry written: $LEDGER_HASH"
