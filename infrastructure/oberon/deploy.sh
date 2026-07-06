#!/bin/bash
set -euo pipefail

KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
NS="${NS:-sovereign-ai-lab}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONVERSION_JOB="convert-sovereign-granite"
OVMS_DEPLOYMENT="ovms-sovereign-granite"

export KUBECONFIG

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "=== Sovereign AI Lab -- dev-cluster-1 Deployment ==="
echo "Cluster: $(oc whoami --show-server 2>/dev/null || echo 'not logged in')"
echo "Namespace: $NS"
echo ""

apply_manifest() {
  local path="$1"
  sed "s/namespace: sovereign-ai-lab/namespace: ${NS}/g" "$path" | oc apply -f -
}

rollout() {
  local deployment="$1"
  local timeout="${2:-120s}"
  oc rollout status "deployment/${deployment}" -n "$NS" --timeout="$timeout"
}

create_configmaps() {
  echo "[3/12] Creating ConfigMaps..."

  oc create configmap postgres-init -n "$NS" \
    --from-file="$REPO_ROOT/infrastructure/postgres-init/" \
    --dry-run=client -o yaml | oc apply -f -

  oc create configmap opa-policies -n "$NS" \
    --from-file="$REPO_ROOT/infra/opa/policies/" \
    --dry-run=client -o yaml | oc apply -f -

  oc create configmap praxis-config -n "$NS" \
    --from-file=praxis.yaml="$REPO_ROOT/gateway/config/praxis.yaml" \
    --dry-run=client -o yaml | oc apply -f -

  oc create configmap sovereign-docs -n "$NS" \
    --from-file="$REPO_ROOT/model-lifecycle/ingest/sample-docs/" \
    --dry-run=client -o yaml | oc apply -f -

  oc create configmap jurisdiction-profiles -n "$NS" \
    --from-file="$REPO_ROOT/experience/showroom/profiles/" \
    --dry-run=client -o yaml | oc apply -f -

  prepare_workspace_artifacts
  oc create configmap workspace-artifacts -n "$NS" \
    --from-file="$TMP_DIR/workspace-artifacts/" \
    --dry-run=client -o yaml | oc apply -f -
}

prepare_workspace_artifacts() {
  local artifacts="$TMP_DIR/workspace-artifacts"
  local timestamp
  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  mkdir -p "$artifacts"

  if [ -f "$REPO_ROOT/infra/tdx/attestation-report.json" ]; then
    cp "$REPO_ROOT/infra/tdx/attestation-report.json" "$artifacts/attestation-report.json"
  else
    cat > "$artifacts/attestation-report.json" << REPORT
{
  "tcb_status": "UpToDate-simulated",
  "quote_hash": "demo-seeded-open-shift-attestation",
  "timestamp": "$timestamp",
  "simulated": true
}
REPORT
  fi

  if [ -f "$REPO_ROOT/infra/tdx/attestation-summary.txt" ]; then
    cp "$REPO_ROOT/infra/tdx/attestation-summary.txt" "$artifacts/attestation-summary.txt"
  else
    cat > "$artifacts/attestation-summary.txt" << SUMMARY
TDX Attestation Summary
=======================
Timestamp:   $timestamp
TCB Status:  UpToDate-simulated
Quote Hash:  demo-seeded-open-shift-attestation
Quote Type:  simulated
SUMMARY
  fi

  if [ -f "$REPO_ROOT/infra/tdx/td-config.json" ]; then
    cp "$REPO_ROOT/infra/tdx/td-config.json" "$artifacts/td-config.json"
  else
    cat > "$artifacts/td-config.json" << TDCONFIG
{
  "td_id": "demo-open-shift",
  "launched_at": "$timestamp",
  "platform": "simulated",
  "kernel": "openshift",
  "arch": "x86_64",
  "tdx_module_version": "simulated"
}
TDCONFIG
  fi

  cp "$REPO_ROOT/model-lifecycle/aibom/sovereign-granite-3b.aibom.json" "$artifacts/"
  cp "$REPO_ROOT/model-lifecycle/promote/promotion-decision.json" "$artifacts/"
  cp "$REPO_ROOT/model-lifecycle/registry/registry.json" "$artifacts/"
}

wait_for_conversion_job() {
  echo "[7/12] Converting Granite to OpenVINO format..."
  if oc get job "$CONVERSION_JOB" -n "$NS" >/dev/null 2>&1; then
    local succeeded
    succeeded="$(oc get job "$CONVERSION_JOB" -n "$NS" -o jsonpath='{.status.succeeded}' 2>/dev/null || true)"
    if [ "$succeeded" = "1" ]; then
      echo "  Model already converted (job completed)"
      return
    fi
    echo "  Conversion job exists; waiting for completion..."
  else
    apply_manifest "$SCRIPT_DIR/convert-sovereign-model.yaml"
    echo "  Conversion job started (takes 5-10 minutes)..."
  fi

  oc wait --for=condition=complete "job/${CONVERSION_JOB}" -n "$NS" --timeout=600s
}

create_route() {
  local name="$1"
  local service="$2"
  local port="$3"

  oc create route edge "$name" \
    --service="$service" \
    --port="$port" \
    -n "$NS" \
    --dry-run=client -o yaml | oc apply -f -
}

create_routes() {
  echo "[11/12] Creating OpenShift Routes..."
  create_route sovereign-ai-lab frontend 9001
  create_route demo-api demo-api 9099
  create_route ledger-gateway ledger-gateway 28099
  create_route opa opa 8181
}

print_endpoints() {
  echo ""
  echo "=== Routes ==="
  oc get route -n "$NS" || true

  echo ""
  echo "=== Pod status ==="
  oc get pods -n "$NS"

  echo ""
  echo "=== Deployment complete ==="
  echo ""
  echo "To check model readiness:"
  echo "  oc rollout status deployment/${OVMS_DEPLOYMENT} -n $NS --timeout=300s"
  echo ""
  echo "To port-forward for local verification:"
  echo "  oc port-forward svc/ledger-gateway 28099:28099 -n $NS &"
  echo "  oc port-forward svc/opa 8181:8181 -n $NS &"
  echo "  oc port-forward svc/${OVMS_DEPLOYMENT} 8000:8080 -n $NS &"
  echo "  oc port-forward svc/semantic-router 8001:8001 -n $NS &"
  echo "  oc port-forward svc/demo-api 9099:9099 -n $NS &"
  echo "  oc port-forward svc/frontend 9001:9001 -n $NS &"
}

echo "[1/12] Creating namespace..."
oc create namespace "$NS" --dry-run=client -o yaml | oc apply -f -

echo "[2/12] Creating model cache PVC..."
apply_manifest "$SCRIPT_DIR/model-cache-pvc.yaml"

create_configmaps

echo "[4/12] Deploying Postgres..."
apply_manifest "$SCRIPT_DIR/postgres.yaml"
rollout postgres 120s

echo "[5/12] Deploying ledger..."
apply_manifest "$SCRIPT_DIR/ledger.yaml"
rollout ledger 120s

echo "[6/12] Deploying ledger gateway and OPA..."
apply_manifest "$SCRIPT_DIR/ledger-gateway.yaml"
rollout ledger-gateway 60s
apply_manifest "$SCRIPT_DIR/opa.yaml"
rollout opa 60s

wait_for_conversion_job

echo "[8/12] Deploying OVMS..."
apply_manifest "$SCRIPT_DIR/ovms-sovereign-granite.yaml"
rollout "$OVMS_DEPLOYMENT" 300s

echo "[9/12] Deploying routing and gateway services..."
apply_manifest "$SCRIPT_DIR/semantic-router.yaml"
rollout semantic-router 60s
apply_manifest "$SCRIPT_DIR/praxis.yaml"
rollout praxis 120s
apply_manifest "$SCRIPT_DIR/contextforge.yaml"
rollout contextforge 180s
apply_manifest "$SCRIPT_DIR/mcp-server.yaml"
rollout sovereign-data-mcp 60s

echo "[10/12] Deploying demo API and frontend..."
apply_manifest "$SCRIPT_DIR/demo-api.yaml"
rollout demo-api 120s
apply_manifest "$SCRIPT_DIR/frontend.yaml"
rollout frontend 60s

create_routes

echo "[12/12] Checking final status..."
print_endpoints
