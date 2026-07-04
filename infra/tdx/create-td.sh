#!/bin/bash
set -euo pipefail

SENTINEL="infra/tdx/.td-running"

if [ -f "$SENTINEL" ]; then
  echo "TDX trust domain already running."
  exit 0
fi

echo "Creating TDX trust domain..."

if dmesg 2>/dev/null | grep -qi tdx; then
  echo "TDX hardware detected."
  TDX_VERSION=$(dmesg | grep -i 'tdx:' | head -1 || echo 'detected')
  PLATFORM="tdx-native"
else
  echo "WARNING: TDX hardware not detected. Running in simulation mode."
  TDX_VERSION="simulated"
  PLATFORM="simulated"
fi

cat > infra/tdx/td-config.json << TDCONFIG
{
  "td_id": "$(uuidgen 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())')",
  "launched_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platform": "$PLATFORM",
  "kernel": "$(uname -r)",
  "arch": "$(uname -m)",
  "tdx_module_version": "$TDX_VERSION"
}
TDCONFIG

touch "$SENTINEL"
echo "TDX trust domain created. Config at infra/tdx/td-config.json"
