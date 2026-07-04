#!/bin/bash
set -euo pipefail

KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config-dev-cluster-1}"
NS="sovereign-ai-lab"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export KUBECONFIG

echo "=== Sovereign AI Lab — dev-cluster-1 Deployment ==="
echo "Cluster: $(oc whoami --show-server 2>/dev/null || echo 'not logged in')"
echo "Namespace: $NS"
echo ""

# 1. Namespace
echo "[1/7] Creating namespace..."
oc apply -f "$SCRIPT_DIR/namespace.yaml"

# 2. Storage
echo "[2/7] Creating model cache PVC..."
oc apply -f "$SCRIPT_DIR/model-cache-pvc.yaml"

# 3. Postgres init scripts (ConfigMap from migration files)
echo "[3/7] Creating postgres init ConfigMap..."
oc create configmap postgres-init -n "$NS" \
  --from-file=01-init.sql=../../ledger/are-immutable-ledger/migrations/001_init.sql \
  --from-file=02-correlation-id.sql=../../ledger/are-immutable-ledger/migrations/002_correlation_id_text.sql \
  --from-file=03-permissions.sql=../../ledger/are-immutable-ledger/demo/postgres-init/03-permissions.sql \
  --from-file=04-hash-index.sql=../../ledger/are-immutable-ledger/migrations/003_hash_index.sql \
  --from-file=05-input-hash.sql=../../ledger/are-immutable-ledger/migrations/004_input_hash.sql \
  --from-file=06-writer-signature.sql=../../ledger/are-immutable-ledger/migrations/005_writer_signature.sql \
  --dry-run=client -o yaml | oc apply -f -

# 4. OPA policies (ConfigMap from rego files)
echo "[4/7] Creating OPA policies ConfigMap..."
oc create configmap opa-policies -n "$NS" \
  --from-file=../../infra/opa/policies/ \
  --dry-run=client -o yaml | oc apply -f -

# 5. Postgres + Ledger + Gateway + OPA
echo "[5/7] Deploying core infrastructure..."
oc apply -f "$SCRIPT_DIR/postgres.yaml"
oc rollout status deployment/postgres -n "$NS" --timeout=120s

oc apply -f "$SCRIPT_DIR/ledger.yaml"
oc rollout status deployment/ledger -n "$NS" --timeout=120s

oc apply -f "$SCRIPT_DIR/ledger-gateway.yaml"
oc rollout status deployment/ledger-gateway -n "$NS" --timeout=60s

oc apply -f "$SCRIPT_DIR/opa.yaml"
oc rollout status deployment/opa -n "$NS" --timeout=60s

# 6. Convert model (if not already done)
echo "[6/8] Converting Granite 3.2 3B to OpenVINO format..."
if oc get job convert-sovereign-granite-3b -n "$NS" &>/dev/null; then
  STATUS=$(oc get job convert-sovereign-granite-3b -n "$NS" -o jsonpath='{.status.conditions[0].type}')
  if [ "$STATUS" = "Complete" ]; then
    echo "  Model already converted (job completed)"
  else
    echo "  Conversion job exists but status=$STATUS — waiting..."
    oc wait --for=condition=complete job/convert-sovereign-granite-3b -n "$NS" --timeout=600s
  fi
else
  oc apply -f "$SCRIPT_DIR/convert-sovereign-model.yaml"
  echo "  Conversion job started (takes 5-10 minutes)..."
  oc wait --for=condition=complete job/convert-sovereign-granite-3b -n "$NS" --timeout=600s
fi

# 7. Sovereign model OVMS instance
echo "[7/9] Deploying sovereign Granite 3B OVMS..."
oc apply -f "$SCRIPT_DIR/ovms-sovereign-granite.yaml"
echo "  Waiting for model to load..."
oc rollout status deployment/ovms-sovereign-granite-3b -n "$NS" --timeout=300s

# 8. Semantic router
echo "[8/9] Deploying semantic router..."
oc apply -f "$SCRIPT_DIR/semantic-router.yaml"
oc rollout status deployment/semantic-router -n "$NS" --timeout=60s

# 9. Verify
echo "[9/9] Checking pod status..."
oc get pods -n "$NS"

echo ""
echo "=== Deployment complete ==="
echo ""
echo "To check model readiness:"
echo "  oc rollout status deployment/ovms-sovereign-granite-3b -n $NS --timeout=300s"
echo ""
echo "To port-forward for local testing:"
echo "  oc port-forward svc/ledger-gateway 28099:28099 -n $NS &"
echo "  oc port-forward svc/opa 8181:8181 -n $NS &"
echo "  oc port-forward svc/ovms-sovereign-granite-3b 8000:8080 -n $NS &"
echo "  # Then run: make preflight-infra"
