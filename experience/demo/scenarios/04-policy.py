#!/usr/bin/env python3
"""Scenario 04: OPA policy enforcement -- allow and deny paths."""
import httpx, sys, os

API = os.environ.get("DEMO_API", "http://localhost:9099")

print("=== Scenario 04: Policy Enforcement ===\n")

test_cases = [
    {
        "label": "Data residency -- local (expect: allow)",
        "policy": "sovereign/data_residency/allow",
        "input": {"destination_region": "local", "data_classification": "general"},
        "expect": True,
    },
    {
        "label": "Data residency -- foreign (expect: deny)",
        "policy": "sovereign/data_residency/allow",
        "input": {"destination_region": "us-east-1", "data_classification": "sensitive_personal"},
        "expect": False,
    },
    {
        "label": "Model promotion -- valid (expect: allow)",
        "policy": "sovereign/model_promotion/allow",
        "input": {"aibom_present": True, "training_in_jurisdiction": True, "all_benchmarks_pass": True},
        "expect": True,
    },
    {
        "label": "Model promotion -- no AIBOM (expect: deny)",
        "policy": "sovereign/model_promotion/allow",
        "input": {"aibom_present": False, "training_in_jurisdiction": True, "all_benchmarks_pass": True},
        "expect": False,
    },
]

all_passed = True
for tc in test_cases:
    r = httpx.post(f"{API}/api/policies/evaluate",
        json={"policy": tc["policy"], "input": tc["input"]}, timeout=10)
    result = r.json().get("result", False)
    passed = result == tc["expect"]
    status = "PASS" if passed else "FAIL"
    print(f"{tc['label']}")
    print(f"  Result: {result}, Expected: {tc['expect']} [{status}]")
    if not passed:
        all_passed = False
    print()

if not all_passed:
    print("\nScenario 04 FAILED")
    sys.exit(1)
print("Scenario 04 PASSED")
