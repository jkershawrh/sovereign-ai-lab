#!/usr/bin/env python3
import json, sys, os
from pathlib import Path

LEDGER_API = os.environ.get("LEDGER_API", "http://localhost:28099")
OPA_ENDPOINT = os.environ.get("OPA_ENDPOINT", "http://localhost:8181")

aibom = json.loads(
    Path("../aibom/sovereign-granite-3b.aibom.json").read_text()
)

opa_input = {
    "input": {
        "model_name": "sovereign-granite-3b-instruct",
        "aibom_present": True,
        "aibom_hash": aibom["provenance_hash"],
        "training_in_jurisdiction": aibom["model"]["adaptation"]["training_environment"]["in_jurisdiction"],
        "all_benchmarks_pass": aibom["model"]["evaluation"]["all_pass"],
    }
}

try:
    import httpx
    r = httpx.post(
        f"{OPA_ENDPOINT}/v1/data/sovereign/model_promotion/allow",
        json=opa_input,
        timeout=5,
    )
    decision = r.json()
    allowed = decision.get("result", False)
except Exception as e:
    print(f"Warning: OPA not reachable ({e}). Using local evaluation.")
    allowed = (
        aibom["model"]["evaluation"]["all_pass"]
        and aibom["model"]["adaptation"]["training_environment"]["in_jurisdiction"]
    )

if not allowed:
    print("PROMOTION DENIED")
    sys.exit(1)

try:
    import httpx
    ledger_r = httpx.post(f"{LEDGER_API}/api/entries", json={
        "entry_type": "model.promoted",
        "agent_id": "model-lifecycle/promote/promote.py",
        "content": json.dumps({
            "model_name": "sovereign-granite-3b-instruct",
            "opa_decision": "allow",
            "aibom_hash": aibom["provenance_hash"],
            "benchmark_scores": {
                b["name"]: b["score"]
                for b in aibom["model"]["evaluation"]["benchmarks"]
            },
        }),
        "content_type": "application/json",
        "source_id": "sovereign-ai-lab",
    }, timeout=5)
    receipt = ledger_r.json()
    ledger_hash = receipt.get("entry_hash", "unknown")
    timestamp = receipt.get("written_ts", "unknown")
except Exception as e:
    print(f"Warning: Could not write to ledger: {e}")
    ledger_hash = "ledger-unreachable"
    timestamp = "unknown"

result = {
    "decision": "allow",
    "ledger_entry_hash": ledger_hash,
    "aibom_hash": aibom["provenance_hash"],
    "promoted_at": timestamp,
}
Path("promotion-decision.json").write_text(json.dumps(result, indent=2))
print(f"PROMOTION APPROVED. Ledger entry: {ledger_hash}")
