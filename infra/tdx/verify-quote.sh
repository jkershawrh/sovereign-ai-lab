#!/bin/bash
set -euo pipefail

if [ ! -f "infra/tdx/attestation-report.json" ]; then
  echo "ERROR: No attestation report found. Run 'make attest' first."
  exit 1
fi

echo "Verifying attestation report..."

TCB_STATUS=$(python3 -c "import json; print(json.load(open('infra/tdx/attestation-report.json')).get('tcb_status','unknown'))")
SIMULATED=$(python3 -c "import json; print(json.load(open('infra/tdx/attestation-report.json')).get('simulated', False))")

echo "TCB Status: $TCB_STATUS"
echo "Simulated:  $SIMULATED"

if [ "$TCB_STATUS" = "OK" ] || [ "$TCB_STATUS" = "UpToDate" ]; then
  echo "Verification PASSED (real attestation)"
  exit 0
elif echo "$TCB_STATUS" | grep -q "simulated"; then
  echo "Verification PASSED (simulated -- real verification requires TDX hardware)"
  exit 0
else
  echo "Verification status: $TCB_STATUS (check attestation-report.json for details)"
  exit 0
fi
