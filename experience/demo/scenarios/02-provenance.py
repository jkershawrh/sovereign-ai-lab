#!/usr/bin/env python3
"""Scenario 02: Model provenance -- AIBOM, evaluation, promotion."""
import httpx, sys, os

API = os.environ.get("DEMO_API", "http://localhost:9099")

print("=== Scenario 02: Model Provenance ===\n")

aibom = httpx.get(f"{API}/api/model/aibom", timeout=10).json()
model = aibom["model"]
print(f"Model:           {model['name']} v{model['version']}")
print(f"Base model:      {model['base_model']['name']}")
print(f"License:         {model['base_model']['license']}")
print(f"Training data:   {model['adaptation']['training_data_sources'][0]['records']} records")
print(f"In-jurisdiction: {model['adaptation']['training_environment']['in_jurisdiction']}")
print(f"Provenance hash: {aibom['provenance_hash'][:24]}...")

print("\nEvaluation results:")
for b in model["evaluation"]["benchmarks"]:
    status = "PASS" if b["pass"] else "FAIL"
    comparator = "<=" if b.get("direction") == "max" else ">="
    metric = b.get("metric", "score")
    print(f"  {b['name']} ({metric}): {b['score']:.3f} {comparator} {b['threshold']} [{status}]")

promotion = httpx.get(f"{API}/api/model/promotion", timeout=10).json()
print(f"\nPromotion:       {promotion['decision'].upper()}")
print(f"Ledger entry:    {promotion['ledger_entry_hash'][:24]}...")
print(f"Ledger mode:     {promotion.get('ledger_status', 'recorded')}")

registry = httpx.get(f"{API}/api/model/registry", timeout=10).json()
print(f"\nRegistry status: {registry['status']}")
print(f"Serving at:      {registry['serving_endpoint']}")

print("\nScenario 02 PASSED")
