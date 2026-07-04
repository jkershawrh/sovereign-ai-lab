#!/usr/bin/env python3
"""Scenario 01: TDX attestation and ledger proof."""
import httpx, sys, os

API = os.environ.get("DEMO_API", "http://localhost:9099")

print("=== Scenario 01: Hardware Trust ===\n")

r = httpx.get(f"{API}/api/attestation", timeout=10)
if r.status_code == 404:
    print("No attestation found. Refreshing...")
    r2 = httpx.post(f"{API}/api/attestation/refresh", timeout=60)
    r2.raise_for_status()
    print(r2.json().get("output", "")[:200])
    r = httpx.get(f"{API}/api/attestation", timeout=10)

data = r.json()
print(data["summary"])

entries = httpx.get(f"{API}/api/ledger", timeout=10).json()
attest_entries = [e for e in entries if e.get("entry_type") == "tdx.attestation.completed"]
if not attest_entries:
    print("FAIL: No attestation entry in ledger")
    sys.exit(1)

latest = attest_entries[-1]
print(f"\nLedger entry: {latest['entry_hash']}")
print(f"Agent:        {latest['agent_id']}")

chain = httpx.get(f"{API}/api/ledger/verify", timeout=10).json()
print(f"\nChain valid:  {chain['all_valid']}")
print("\nScenario 01 PASSED")
