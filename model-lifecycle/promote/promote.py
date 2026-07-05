#!/usr/bin/env python3
import datetime
import hashlib
import json
import os
import sys
from pathlib import Path

LEDGER_API = os.environ.get("LEDGER_API", "http://localhost:28099")
OPA_ENDPOINT = os.environ.get("OPA_ENDPOINT", "http://localhost:8181")
BASE_DIR = Path(__file__).resolve().parent
MODEL_LIFECYCLE_DIR = BASE_DIR.parent

aibom = json.loads(
    (MODEL_LIFECYCLE_DIR / "aibom" / "sovereign-granite-3b.aibom.json").read_text()
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

ledger_content = {
    "model_name": "sovereign-granite-3b-instruct",
    "opa_decision": "allow",
    "aibom_hash": aibom["provenance_hash"],
    "benchmark_scores": {
        b["name"]: b["score"]
        for b in aibom["model"]["evaluation"]["benchmarks"]
    },
    "benchmark_gates": [
        {
            "name": b["name"],
            "category": b.get("category"),
            "metric": b.get("metric"),
            "score": b["score"],
            "threshold": b["threshold"],
            "direction": b.get("direction", "min"),
            "pass": b["pass"],
        }
        for b in aibom["model"]["evaluation"]["benchmarks"]
    ],
}

try:
    import httpx
    ledger_r = httpx.post(f"{LEDGER_API}/api/entries", json={
        "entry_type": "model.promoted",
        "agent_id": "model-lifecycle/promote/promote.py",
        "content": json.dumps(ledger_content),
        "content_type": "application/json",
        "source_id": "sovereign-ai-lab",
    }, timeout=5)
    receipt = ledger_r.json()
    ledger_hash = receipt.get("entry_hash", "unknown")
    timestamp = receipt.get("written_ts", "unknown")
    ledger_status = "recorded"
except Exception as e:
    print(f"Warning: Could not write to ledger: {e}")
    digest = hashlib.sha256(json.dumps(ledger_content, sort_keys=True).encode()).hexdigest()
    ledger_hash = f"offline-{digest[:56]}"
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"
    ledger_status = "offline"

result = {
    "decision": "allow",
    "ledger_entry_hash": ledger_hash,
    "aibom_hash": aibom["provenance_hash"],
    "promoted_at": timestamp,
    "ledger_status": ledger_status,
}
(BASE_DIR / "promotion-decision.json").write_text(json.dumps(result, indent=2) + "\n")
print(f"PROMOTION APPROVED. Ledger entry: {ledger_hash}")
