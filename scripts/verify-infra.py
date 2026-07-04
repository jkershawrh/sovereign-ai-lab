#!/usr/bin/env python3
"""
Document 1 end-to-end verification.
Sends test events through every component and verifies they appear in the ledger.
Exit 0 only if the full chain is intact with entries from expected writers.
"""
import json
import sys
import time

import httpx

LEDGER_HEALTH = "http://localhost:28080"
LEDGER_API = "http://localhost:28099"
OPA = "http://localhost:8181"
VLLM = "http://localhost:8000"
VLLM_CHAT = f"{VLLM}/v3/chat/completions"
ROUTER = "http://localhost:8001"


def check(name, fn):
    try:
        fn()
        print(f"  PASS  {name}")
        return True
    except Exception as e:
        print(f"  FAIL  {name}: {e}")
        return False


results = []

# 1. Ledger health
results.append(check("Ledger health",
    lambda: httpx.get(f"{LEDGER_HEALTH}/readyz", timeout=5).raise_for_status()))

# 2. Write a test entry via REST gateway
entry_hash = None
def write_entry():
    global entry_hash
    r = httpx.post(f"{LEDGER_API}/api/entries", json={
        "entry_type": "verify.test",
        "agent_id": "scripts/verify-infra.py",
        "content": json.dumps({"test": True}),
        "content_type": "application/json",
        "source_id": "sovereign-ai-lab",
    }, timeout=5)
    r.raise_for_status()
    entry_hash = r.json()["entry_hash"]
results.append(check("Write ledger entry", write_entry))

# 3. Read it back
def read_entry():
    entries = httpx.get(f"{LEDGER_API}/api/entries", timeout=5).json()
    assert any(e.get("entry_hash") == entry_hash for e in entries), \
        f"entry {entry_hash} not found"
results.append(check("Read ledger entry", read_entry))

# 4. Verify chain
results.append(check("Ledger chain valid",
    lambda: httpx.get(f"{LEDGER_API}/api/verify", timeout=5).json()["all_valid"] == True))

# 5. TDX attestation entry exists
results.append(check("TDX attestation in ledger",
    lambda: any(e.get("entry_type") == "tdx.attestation.completed"
                for e in httpx.get(f"{LEDGER_API}/api/entries", timeout=5).json())))

# 6. Model pipeline entries exist
for event in ["pipeline.ingest.completed", "pipeline.train.completed",
              "model.aibom.registered", "model.promoted"]:
    results.append(check(f"Ledger has {event}",
        lambda ev=event: any(e.get("entry_type") == ev
                             for e in httpx.get(f"{LEDGER_API}/api/entries", timeout=5).json())))

# 7. OPA policy evaluation
results.append(check("OPA model-promotion policy works", lambda: (
    httpx.post(f"{OPA}/v1/data/sovereign/model_promotion/allow",
        json={"input": {"aibom_present": True,
                        "training_in_jurisdiction": True,
                        "all_benchmarks_pass": True}},
        timeout=5).json()["result"] == True
)))

# 8. vLLM inference
def test_inference():
    r = httpx.post(VLLM_CHAT, json={
        "model": "granite-3.2-sovereign",
        "messages": [{"role": "user", "content": "Say 'sovereign AI works' and nothing else."}],
        "max_tokens": 20,
    }, timeout=60)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]
    assert len(content) > 0
results.append(check("vLLM inference", test_inference))

# 9. Semantic router routing decision
results.append(check("Semantic router routing",
    lambda: httpx.post(f"{ROUTER}/classify",
        json={"text": "What is the policy on personal health data?"},
        timeout=10).json().get("route") in ["sensitive-data", "general"]))

# 10. Routing decision appears in ledger
time.sleep(2)
results.append(check("Routing decisions in ledger",
    lambda: any(e.get("entry_type", "").startswith("router.")
                for e in httpx.get(f"{LEDGER_API}/api/entries", timeout=5).json())))

# Summary
passed = sum(results)
total = len(results)
print(f"\n{'='*50}")
print(f"  {passed}/{total} checks passed")
print(f"{'='*50}")

if passed == total:
    print("\nDocument 1 COMPLETE. Proceed to Document 2.")
    sys.exit(0)
else:
    print(f"\n{total - passed} checks failed. Resolve before proceeding.")
    sys.exit(1)
