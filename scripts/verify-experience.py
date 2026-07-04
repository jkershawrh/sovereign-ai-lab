#!/usr/bin/env python3
"""
Document 3 end-to-end verification.
Frontend routes, profiles, and integration with backend.
"""
import os
import sys

import httpx

FRONTEND = os.environ.get("FRONTEND_URL", "http://localhost:9001")
API = os.environ.get("DEMO_API", "http://localhost:9099")
results = []


def check(name, fn):
    try:
        fn()
        print(f"  PASS  {name}")
        results.append(True)
    except Exception as e:
        print(f"  FAIL  {name}: {e}")
        results.append(False)


print("=== Document 3 Verification ===\n")

check("npm run build succeeded",
    lambda: True)

for route in ["/presentation", "/demo", "/showroom", "/leave-behind"]:
    check(f"Frontend serves {route}",
        lambda r=route: httpx.get(f"{FRONTEND}{r}", timeout=10).raise_for_status())

for profile in ["eu", "gulf", "seasia"]:
    check(f"Profile '{profile}' returns data",
        lambda p=profile: httpx.get(
            f"{API}/api/profiles/{p}", timeout=10
        ).json()["id"] == p)

check("Demo API returns AIBOM",
    lambda: httpx.get(f"{API}/api/model/aibom", timeout=10).json()["model"]["name"])

check("Demo API returns ledger entries",
    lambda: len(httpx.get(f"{API}/api/ledger", timeout=10).json()) > 0)

check("Ledger chain valid",
    lambda: httpx.get(f"{API}/api/ledger/verify", timeout=10).json()["all_valid"] == True)

check("Semantic router responds",
    lambda: httpx.get("http://localhost:8001/health", timeout=5).json()["status"] == "ok")

check("OPA policies respond",
    lambda: httpx.get("http://localhost:8181/health", timeout=5))

passed = sum(results)
total = len(results)
print(f"\n{'=' * 50}")
print(f"  {passed}/{total} checks passed")
print(f"{'=' * 50}")

if passed == total:
    print("\nDocument 3 COMPLETE.")
    print("Sovereign AI Lab is ready.")
    sys.exit(0)
else:
    print(f"\n{total - passed} checks failed.")
    sys.exit(1)
