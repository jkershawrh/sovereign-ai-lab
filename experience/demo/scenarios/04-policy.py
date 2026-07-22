#!/usr/bin/env python3
"""Scenario 04: OPA policy enforcement -- allow and deny paths."""
import httpx, sys, os

API = os.environ.get("DEMO_API", "http://localhost:9099")

print("=== Scenario 04: Policy Enforcement ===\n")

test_cases = [
    # Generic data residency
    {
        "label": "Data residency -- local (expect: allow)",
        "policy": "sovereign/data_residency/allow",
        "input": {"destination_region": "local", "data_classification": "general"},
        "expect": True,
    },
    {
        "label": "Data residency -- foreign sensitive (expect: deny)",
        "policy": "sovereign/data_residency/allow",
        "input": {"destination_region": "us-east-1", "data_classification": "sensitive_personal"},
        "expect": False,
    },
    # GDPR-specific: sensitive data within EU requires adequacy decision
    {
        "label": "GDPR -- health data to EU with adequacy (expect: allow)",
        "policy": "sovereign/data_residency_gdpr/allow",
        "input": {"destination_region": "DE", "data_classification": "health", "adequacy_decision": True},
        "expect": True,
    },
    {
        "label": "GDPR -- health data to EU without adequacy (expect: deny)",
        "policy": "sovereign/data_residency_gdpr/allow",
        "input": {"destination_region": "DE", "data_classification": "health"},
        "expect": False,
    },
    {
        "label": "GDPR -- health data to US (expect: deny)",
        "policy": "sovereign/data_residency_gdpr/allow",
        "input": {"destination_region": "US", "data_classification": "health", "adequacy_decision": True},
        "expect": False,
    },
    {
        "label": "GDPR -- general data to EU (expect: allow)",
        "policy": "sovereign/data_residency_gdpr/allow",
        "input": {"destination_region": "FR", "data_classification": "general"},
        "expect": True,
    },
    # Gulf data residency
    {
        "label": "Gulf -- general data stays in UAE (expect: allow)",
        "policy": "sovereign/data_residency_gulf/allow",
        "input": {"destination_region": "AE", "data_classification": "general"},
        "expect": True,
    },
    {
        "label": "Gulf -- national ID to US (expect: deny)",
        "policy": "sovereign/data_residency_gulf/allow",
        "input": {"destination_region": "US", "data_classification": "national_id"},
        "expect": False,
    },
    # SE Asia data residency
    {
        "label": "PDPA -- general data to Singapore (expect: allow)",
        "policy": "sovereign/data_residency_seasia/allow",
        "input": {"destination_region": "SG", "data_classification": "general"},
        "expect": True,
    },
    {
        "label": "PDPA -- government data to US (expect: deny)",
        "policy": "sovereign/data_residency_seasia/allow",
        "input": {"destination_region": "US", "data_classification": "government"},
        "expect": False,
    },
    # Model governance
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
    {
        "label": "Model promotion -- foreign trained (expect: deny)",
        "policy": "sovereign/model_promotion/allow",
        "input": {"aibom_present": True, "training_in_jurisdiction": False, "all_benchmarks_pass": True},
        "expect": False,
    },
    # Agent identity
    {
        "label": "Agent lifecycle -- named agent (expect: allow)",
        "policy": "sovereign/agent_lifecycle/allow",
        "input": {"agent_identity": "sovereign-granite-3b", "action": "start"},
        "expect": True,
    },
    {
        "label": "Agent lifecycle -- anonymous (expect: deny)",
        "policy": "sovereign/agent_lifecycle/allow",
        "input": {"agent_identity": "", "action": "invoke_tool"},
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
