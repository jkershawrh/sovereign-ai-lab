#!/bin/bash
set -euo pipefail

echo "Resetting sovereign AI lab infrastructure..."

docker compose -f docker-compose.infra.yml down -v 2>/dev/null || true

rm -f infra/tdx/.td-running
rm -f infra/tdx/attestation-report.json
rm -f infra/tdx/attestation-summary.txt

echo "Infrastructure reset complete. Run 'make up-infra' to restart."
