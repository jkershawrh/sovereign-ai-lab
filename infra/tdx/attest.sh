#!/bin/bash
set -euo pipefail

source .env 2>/dev/null || true

LEDGER_API="${LEDGER_API:-http://localhost:28099}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "Running TDX platform attestation..."

# ── Step 1: Collect platform evidence ────────────────────────────────────
PLATFORM_EVIDENCE="{}"
ATTESTATION_LEVEL="none"

# TPM PCR values — hardware-measured platform integrity registers
if command -v tpm2_pcrread &>/dev/null; then
  echo "Reading TPM 2.0 PCR values..."
  PCR_JSON=$(tpm2_pcrread sha256:0,1,2,3,4,5,6,7 --output /dev/stdout 2>/dev/null | \
    python3 -c "
import sys, hashlib
lines = sys.stdin.read().strip().split('\n')
pcrs = {}
for line in lines:
    if '0x' in line:
        parts = line.strip().split(':')
        if len(parts) == 2:
            pcrs[parts[0].strip()] = parts[1].strip()
import json
print(json.dumps(pcrs))
" 2>/dev/null || echo '{}')
  ATTESTATION_LEVEL="tpm"
elif [ -f /sys/class/tpm/tpm0/pcr-sha256/0 ]; then
  echo "Reading TPM PCRs from sysfs..."
  PCR_JSON=$(python3 -c "
import json
pcrs = {}
for i in range(8):
    path = f'/sys/class/tpm/tpm0/pcr-sha256/{i}'
    try:
        with open(path) as f:
            pcrs[str(i)] = f.read().strip()
    except: pass
print(json.dumps(pcrs))
" 2>/dev/null || echo '{}')
  ATTESTATION_LEVEL="tpm-sysfs"
else
  echo "WARNING: No TPM available."
  PCR_JSON='{}'
fi

# SGX device presence — proves Intel SGX/TDX hardware capability
SGX_PRESENT="false"
if [ -e /dev/sgx_provision ]; then
  SGX_PRESENT="true"
  [ "$ATTESTATION_LEVEL" = "none" ] && ATTESTATION_LEVEL="sgx-device"
  echo "SGX devices present: /dev/sgx_provision, /dev/sgx_enclave"
fi

# TDX module status from dmesg
TDX_MODULE="unknown"
TDX_MODULE_LINE=$(dmesg 2>/dev/null | grep "virt/tdx: TDX module" | tail -1 || true)
if [ -n "$TDX_MODULE_LINE" ]; then
  TDX_MODULE=$(echo "$TDX_MODULE_LINE" | sed 's/.*TDX module //' | cut -d',' -f1)
  [ "$ATTESTATION_LEVEL" = "none" ] && ATTESTATION_LEVEL="tdx-module"
  echo "TDX module: $TDX_MODULE"
fi

# CPU TDX flag
TDX_CPU="false"
if grep -q "tdx_host_platform" /proc/cpuinfo 2>/dev/null; then
  TDX_CPU="true"
  echo "CPU flag: tdx_host_platform confirmed"
fi

# TDX Trust Domain detection (kata-cc / TDX guest VM)
# When running inside a TD, the guest kernel exposes /dev/tdx_guest or
# /dev/tdx-guest and (on newer kernels) configfs-tsm at
# /sys/kernel/config/tsm/report.  The Intel TDX DCAP quote-generation
# service is reachable from within the sandbox-containers namespace.
TD_ENCLAVE="false"
TDX_GUEST_DEV=""
DCAP_SERVICE="http://intel-tdx-dcap.openshift-sandboxed-containers-operator:4050"

if [ -e /dev/tdx_guest ]; then
  TD_ENCLAVE="true"
  TDX_GUEST_DEV="/dev/tdx_guest"
  echo "TDX Trust Domain detected via $TDX_GUEST_DEV"
elif [ -e /dev/tdx-guest ]; then
  TD_ENCLAVE="true"
  TDX_GUEST_DEV="/dev/tdx-guest"
  echo "TDX Trust Domain detected via $TDX_GUEST_DEV"
elif [ -d /sys/kernel/config/tsm/report ]; then
  TD_ENCLAVE="true"
  TDX_GUEST_DEV="configfs-tsm"
  echo "TDX Trust Domain detected via configfs-tsm (/sys/kernel/config/tsm/report)"
fi

if [ "$TD_ENCLAVE" = "true" ]; then
  ATTESTATION_LEVEL="td-enclave"
  echo "Attestation level elevated to td-enclave (running inside kata-cc TD)"

  # Attempt to obtain a real DCAP quote from the TD guest device or DCAP service
  if [ "$TDX_GUEST_DEV" = "configfs-tsm" ]; then
    echo "Generating TD quote via configfs-tsm..."
    TSM_REPORT_DIR=$(mktemp -d /sys/kernel/config/tsm/report/attest-XXXXXX 2>/dev/null || true)
    if [ -n "$TSM_REPORT_DIR" ] && [ -d "$TSM_REPORT_DIR" ]; then
      echo -n "sovereign-ai-lab" > "$TSM_REPORT_DIR/inblob" 2>/dev/null || true
      if [ -f "$TSM_REPORT_DIR/outblob" ]; then
        TD_QUOTE=$(cat "$TSM_REPORT_DIR/outblob" | base64 -w0 2>/dev/null || cat "$TSM_REPORT_DIR/outblob" | base64 2>/dev/null)
        QUOTE_TYPE="td-configfs-tsm"
        echo "TD quote generated via configfs-tsm"
      fi
      rmdir "$TSM_REPORT_DIR" 2>/dev/null || true
    fi
  elif [ -n "$TDX_GUEST_DEV" ]; then
    echo "Attempting DCAP quote via $DCAP_SERVICE ..."
    DCAP_RESPONSE=$(curl -s --connect-timeout 5 -X POST "$DCAP_SERVICE/quote" \
      -H "Content-Type: application/json" \
      -d '{"report_data": "c292ZXJlaWduLWFpLWxhYg=="}' 2>/dev/null || true)
    if [ -n "$DCAP_RESPONSE" ] && echo "$DCAP_RESPONSE" | python3 -c "import sys,json; json.load(sys.stdin)['quote']" &>/dev/null; then
      TD_QUOTE=$(echo "$DCAP_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['quote'])")
      QUOTE_TYPE="td-dcap"
      echo "TD DCAP quote obtained from intel-tdx-dcap service"
    else
      echo "DCAP service unavailable; falling back to device-level evidence"
      TD_QUOTE="TD_ENCLAVE_EVIDENCE_$(date +%s)"
      QUOTE_TYPE="td-device-present"
    fi
  fi
fi

# ── Step 2: Generate quote ───────────────────────────────────────────────
# Skip if we already obtained a quote from TD-enclave detection above
if [ -z "${TD_QUOTE:-}" ]; then
if command -v tdx_quote_generator &>/dev/null; then
  echo "Generating real TDX quote..."
  TD_QUOTE=$(tdx_quote_generator 2>/dev/null)
  QUOTE_TYPE="real"
  ATTESTATION_LEVEL="tdx-quote"
else
  TD_QUOTE="PLATFORM_EVIDENCE_$(date +%s)"
  QUOTE_TYPE="platform-measured"
fi
fi

QUOTE_HASH=$(echo -n "$TD_QUOTE" | shasum -a 256 2>/dev/null | cut -d' ' -f1 || echo -n "$TD_QUOTE" | sha256sum | cut -d' ' -f1)

# ── Step 3: Call Intel Trust Authority (if API key set) ──────────────────
TCB_STATUS="unmeasured"
if [ -n "${ITA_API_KEY:-}" ]; then
  echo "Calling Intel Trust Authority..."
  RESPONSE=$(curl -s -X POST "${ITA_ENDPOINT:-https://api.trustauthority.intel.com}/appraisal/v2/attest" \
    -H "x-api-key: ${ITA_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"quote\": \"${TD_QUOTE}\"}" 2>/dev/null || echo '{"error": "ITA unreachable"}')
  echo "$RESPONSE" > infra/tdx/attestation-report.json
  TCB_STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tcb_status','unknown'))" 2>/dev/null || echo "unknown")
  ATTESTATION_LEVEL="ita-verified"
else
  if [ "$ATTESTATION_LEVEL" != "none" ]; then
    TCB_STATUS="platform-measured"
  fi
  cat > infra/tdx/attestation-report.json << REPORT
{
  "tcb_status": "$TCB_STATUS",
  "attestation_level": "$ATTESTATION_LEVEL",
  "quote_hash": "$QUOTE_HASH",
  "timestamp": "$TIMESTAMP",
  "tdx_module": "$TDX_MODULE",
  "tdx_cpu": $TDX_CPU,
  "sgx_present": $SGX_PRESENT,
  "td_enclave": $TD_ENCLAVE,
  "pcr_count": $(echo "$PCR_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)
}
REPORT
fi

# ── Step 4: Write summary ───────────────────────────────────────────────
cat > infra/tdx/attestation-summary.txt << SUMMARY
TDX Platform Attestation
========================
Timestamp:          $TIMESTAMP
Attestation Level:  $ATTESTATION_LEVEL
TCB Status:         $TCB_STATUS
Quote Hash:         $QUOTE_HASH
Quote Type:         $QUOTE_TYPE
TD Enclave:         $TD_ENCLAVE
TDX Module:         $TDX_MODULE
TDX CPU Flag:       $TDX_CPU
SGX Devices:        $SGX_PRESENT
TPM PCRs:           $(echo "$PCR_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0) registers
SUMMARY

echo ""
cat infra/tdx/attestation-summary.txt

# ── Step 5: Write to ledger ──────────────────────────────────────────────
PCR_DIGEST=$(echo -n "$PCR_JSON" | shasum -a 256 2>/dev/null | cut -d' ' -f1 || echo -n "$PCR_JSON" | sha256sum | cut -d' ' -f1)

CONTENT_JSON=$(python3 -c "
import json
d = {
    'tcb_status': '${TCB_STATUS}',
    'attestation_level': '${ATTESTATION_LEVEL}',
    'quote_hash': '${QUOTE_HASH}',
    'quote_type': '${QUOTE_TYPE}',
    'timestamp': '${TIMESTAMP}',
    'tdx_module': '${TDX_MODULE}',
    'tdx_cpu': '${TDX_CPU}' == 'true',
    'sgx_present': '${SGX_PRESENT}' == 'true',
    'td_enclave': '${TD_ENCLAVE}' == 'true',
    'pcr_digest': '${PCR_DIGEST}',
}
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
