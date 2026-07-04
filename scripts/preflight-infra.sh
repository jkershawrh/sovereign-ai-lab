#!/bin/bash
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0; FAIL=0; WARN=0

check() {
  local name="$1"; local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}  $name"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}  $name"
    FAIL=$((FAIL + 1))
  fi
}

warn_check() {
  local name="$1"; local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}  $name"
    PASS=$((PASS + 1))
  else
    echo -e "${YELLOW}WARN${NC}  $name (simulated OK)"
    WARN=$((WARN + 1))
    PASS=$((PASS + 1))
  fi
}

echo "=== Sovereign AI Lab -- Infrastructure Preflight ==="
echo ""

warn_check "TDX module loaded"       "dmesg 2>/dev/null | grep -qi tdx"
warn_check "ITA_API_KEY set"          "[ -n '${ITA_API_KEY:-}' ]"
check "Docker running"               "docker info"
check "Base model present"           "[ -d 'inference/models/granite-3.2-3b-instruct-q4' ]"
check "AIBOM present"                "[ -f 'model-lifecycle/aibom/sovereign-granite-3b.aibom.json' ]"
check "Promotion decision present"   "[ -f 'model-lifecycle/promote/promotion-decision.json' ]"
check "Ledger healthy"               "curl -sf http://localhost:28080/readyz"
check "Ledger gateway up"            "curl -sf http://localhost:28099/api/entries"
check "OPA healthy"                  "curl -sf http://localhost:8181/health"
check "OPA policies loaded"          "curl -sf http://localhost:8181/v1/policies | grep -q 'sovereign'"
check "vLLM healthy"                 "curl -sf http://localhost:8000/health | grep -q sovereign"
check "Semantic router healthy"      "curl -sf http://localhost:8001/health"

echo ""
echo "=== $PASS passed, $FAIL failed, $WARN warnings ==="

[ $FAIL -eq 0 ] && exit 0 || exit 1
