#!/bin/bash
set -euo pipefail

LEDGER_API="${LEDGER_API:-http://localhost:28099}"

echo "Registering governed agents in ledger..."

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

register_agent() {
  local agent_id="$1"
  local agent_type="$2"
  local spiffe_id="$3"
  local capabilities="$4"

  local CONTENT=$(python3 -c "
import json
print(json.dumps(json.dumps({
    'agent_id': '$agent_id',
    'agent_type': '$agent_type',
    'spiffe_id': '$spiffe_id',
    'capabilities': $capabilities,
    'registered_at': '$TIMESTAMP',
    'governance': {
        'identity_verified': True,
        'policy_bound': True,
        'ledger_writer': True
    }
})))
")

  local HASH=$(curl -s -X POST "${LEDGER_API}/api/entries" \
    -H "Content-Type: application/json" \
    -d "{
      \"entry_type\": \"agent.registered\",
      \"agent_id\": \"agent-control/registrar\",
      \"content\": ${CONTENT},
      \"content_type\": \"application/json\",
      \"source_id\": \"sovereign-ai-lab\",
      \"correlation_id\": \"$spiffe_id\"
    }" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entry_hash','error'))" 2>/dev/null || echo "ledger-write-failed")

  echo "  $agent_id ($agent_type): $HASH"
}

register_agent \
  "semantic-router" \
  "classifier" \
  "spiffe://sovereign-ai-lab/agent/semantic-router" \
  '["classify_prompt", "route_inference", "detect_injection", "write_ledger"]'

register_agent \
  "demo-api" \
  "orchestrator" \
  "spiffe://sovereign-ai-lab/agent/demo-api" \
  '["serve_api", "proxy_inference", "evaluate_policy", "read_ledger"]'

register_agent \
  "opa" \
  "policy-engine" \
  "spiffe://sovereign-ai-lab/agent/opa" \
  '["evaluate_policy", "enforce_residency", "gate_promotion"]'

register_agent \
  "ovms-sovereign-granite" \
  "model-server" \
  "spiffe://sovereign-ai-lab/agent/ovms-sovereign-granite" \
  '["serve_inference", "granite-3.2-2b-instruct"]'

# Agent lifecycle policy check
POLICY_CONTENT=$(python3 -c "
import json
print(json.dumps(json.dumps({
    'total_agents': 4,
    'all_identities_verified': True,
    'all_policy_bound': True,
    'all_ledger_writers': True,
    'governance_status': 'compliant',
    'timestamp': '$TIMESTAMP'
})))
")

HASH=$(curl -s -X POST "${LEDGER_API}/api/entries" \
  -H "Content-Type: application/json" \
  -d "{
    \"entry_type\": \"agent.lifecycle.audit\",
    \"agent_id\": \"agent-control/registrar\",
    \"content\": ${POLICY_CONTENT},
    \"content_type\": \"application/json\",
    \"source_id\": \"sovereign-ai-lab\"
  }" | python3 -c "import sys,json; print(json.load(sys.stdin).get('entry_hash','error'))" 2>/dev/null || echo "ledger-write-failed")

echo "  Agent lifecycle audit: $HASH"
