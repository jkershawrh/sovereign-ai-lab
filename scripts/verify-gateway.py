#!/usr/bin/env python3
"""
Document 2 end-to-end verification.
All five scenarios must pass. Ledger must have entries from multiple writers.
"""
import os
import subprocess
import sys

import httpx

API = os.environ.get("DEMO_API", "http://localhost:9099")


def run_scenario(path):
    env = {**os.environ, "DEMO_API": API}
    result = subprocess.run(["python3", path], capture_output=True, text=True, env=env)
    return result.returncode == 0, result.stdout, result.stderr


results = []
scenarios = [
    "experience/demo/scenarios/01-attestation.py",
    "experience/demo/scenarios/02-provenance.py",
    "experience/demo/scenarios/03-routing.py",
    "experience/demo/scenarios/04-policy.py",
    "experience/demo/scenarios/05-verify.py",
]

print("=== Document 2 Verification ===\n")
print("Running five demo scenarios...")

for s in scenarios:
    name = s.split("/")[-1]
    passed, out, err = run_scenario(s)
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}")
    if not passed:
        print(f"    stdout: {out[-200:]}")
        print(f"    stderr: {err[-200:]}")
    results.append(passed)

writers = httpx.get(f"{API}/api/ledger/writers", timeout=10).json()
writer_count = len(writers["writers"])
min_writers = 4
writers_ok = writer_count >= min_writers
print(f"\n  [{'PASS' if writers_ok else 'FAIL'}] "
      f"Ledger writers: {writer_count} (need {min_writers})")
for w, c in sorted(writers["writers"].items()):
    print(f"    {w}: {c} entries")
results.append(writers_ok)

passed = sum(results)
total = len(results)
print(f"\n{'=' * 50}")
print(f"  {passed}/{total} checks passed")
print(f"{'=' * 50}")

if passed == total:
    print("\nDocument 2 COMPLETE. Proceed to Document 3.")
    sys.exit(0)
else:
    print(f"\n{total - passed} checks failed. Resolve before proceeding.")
    sys.exit(1)
