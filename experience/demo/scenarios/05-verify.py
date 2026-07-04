#!/usr/bin/env python3
"""Scenario 05: Full proof chain verification."""
import httpx, sys, os

API = os.environ.get("DEMO_API", "http://localhost:9099")

print("=== Scenario 05: Proof Chain Verification ===\n")

entries = httpx.get(f"{API}/api/ledger", timeout=10).json()
print(f"Total ledger entries: {len(entries)}")

writers = httpx.get(f"{API}/api/ledger/writers", timeout=10).json()
print("\nEntries by writer:")
for writer, count in sorted(writers["writers"].items()):
    print(f"  {writer}: {count}")

expected_writers = [
    "infra/tdx/attest.sh",
    "model-lifecycle/aibom/generate.py",
    "model-lifecycle/promote/promote.py",
    "semantic-router",
]
missing = [w for w in expected_writers if w not in writers["writers"]]
if missing:
    print(f"\nMissing writers: {missing}")

print("\nVerifying chain integrity...")
verify = httpx.get(f"{API}/api/ledger/verify", timeout=10).json()
chain_valid = verify.get("all_valid", False)
chain_count = len(verify.get("chains", []))

print(f"All chains valid: {chain_valid}")
print(f"Chain count:      {chain_count}")

if chain_valid and not missing:
    print("\n" + "=" * 50)
    print("  PROOF CHAIN INTACT")
    print(f"  {len(entries)} entries across {len(writers['writers'])} writers")
    print("=" * 50)
    print("\nScenario 05 PASSED")
    sys.exit(0)
else:
    if not chain_valid:
        print("\nFAIL: Chain verification failed")
    if missing:
        print(f"\nFAIL: Missing expected writers: {missing}")
    sys.exit(1)
