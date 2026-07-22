#!/bin/bash
set -euo pipefail
# reattest-cron.sh — Periodic TDX re-attestation
# Designed to be called by cron, a Kubernetes CronJob, or a
# docker-compose loop service.  Runs the existing attest.sh and
# logs the outcome so the immutable ledger accumulates a continuous
# chain of hardware-trust proofs.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${LOG_DIR:-/var/log/sovereign-ai-lab}"
LOG_FILE="${LOG_DIR}/reattest.log"

# Source project .env if available (LEDGER_API, ITA_API_KEY, etc.)
source "${SCRIPT_DIR}/.env" 2>/dev/null || true

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_FILE"
}

log "Starting periodic TDX re-attestation"

cd "$SCRIPT_DIR"

if [ ! -f infra/tdx/attest.sh ]; then
  log "ERROR: infra/tdx/attest.sh not found in ${SCRIPT_DIR}"
  exit 1
fi

if bash infra/tdx/attest.sh 2>&1 | tee -a "$LOG_FILE"; then
  log "Re-attestation succeeded"
  exit 0
else
  EXIT_CODE=$?
  log "Re-attestation FAILED (exit code ${EXIT_CODE})"
  exit "$EXIT_CODE"
fi
