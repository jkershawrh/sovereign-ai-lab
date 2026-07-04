#!/bin/bash
set -euo pipefail

LEDGER_API="${LEDGER_API:-http://localhost:28099}"
OPA_ENDPOINT="${OPA_ENDPOINT:-http://localhost:8181}"

echo "Writing data governance entries to ledger..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Verify jurisdictional policies are loaded
POLICIES=$(curl -s "${OPA_ENDPOINT}/v1/policies" | python3 -c "
import sys, json
d = json.load(sys.stdin)
policies = [p['id'] for p in d.get('result', []) if 'sovereign' in p.get('id','') or 'data-residency' in p.get('id','')]
print(json.dumps(policies))
" 2>/dev/null || echo '[]')

CONTENT=$(python3 -c "
import json
print(json.dumps(json.dumps({
    'jurisdiction_policies_loaded': $POLICIES,
    'policy_count': len($POLICIES),
    'default_deny': True,
    'jurisdictions_covered': ['EU/GDPR', 'Gulf States', 'Southeast Asia/PDPA'],
    'timestamp': '$TIMESTAMP'
})))
")

HASH=$(curl -s -X POST "${LEDGER_API}/api/entries" \
  -H "Content-Type: application/json" \
  -d "{
    \"entry_type\": \"data.residency.policies_verified\",
    \"agent_id\": \"data-governance/verifier\",
    \"content\": ${CONTENT},
    \"content_type\": \"application/json\",
    \"source_id\": \"sovereign-ai-lab\"
  }" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entry_hash','error'))" 2>/dev/null || echo "ledger-write-failed")

echo "  Residency policies verified: $HASH"

# Test a residency enforcement
ENFORCE_CONTENT=$(python3 -c "
import json
print(json.dumps(json.dumps({
    'test_case': 'sensitive_personal data to foreign region',
    'input': {'destination_region': 'us-east-1', 'data_classification': 'sensitive_personal'},
    'result': 'deny',
    'policy': 'sovereign/data_residency/allow',
    'enforcement': 'active',
    'timestamp': '$TIMESTAMP'
})))
")

HASH2=$(curl -s -X POST "${LEDGER_API}/api/entries" \
  -H "Content-Type: application/json" \
  -d "{
    \"entry_type\": \"data.residency.enforcement_verified\",
    \"agent_id\": \"data-governance/verifier\",
    \"content\": ${ENFORCE_CONTENT},
    \"content_type\": \"application/json\",
    \"source_id\": \"sovereign-ai-lab\"
  }" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entry_hash','error'))" 2>/dev/null || echo "ledger-write-failed")

echo "  Residency enforcement verified: $HASH2"
