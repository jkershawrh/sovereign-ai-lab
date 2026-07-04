#!/usr/bin/env python3
import json, datetime
from pathlib import Path

aibom = json.loads(
    Path("../aibom/sovereign-granite-3b.aibom.json").read_text()
)
promotion = json.loads(
    Path("../promote/promotion-decision.json").read_text()
)

entry = {
    "name": "sovereign-granite-3b-instruct",
    "version": "1.0.0",
    "status": "production",
    "aibom_path": "model-lifecycle/aibom/sovereign-granite-3b.aibom.json",
    "aibom_hash": aibom["provenance_hash"],
    "promotion_ledger_hash": promotion["ledger_entry_hash"],
    "serving_endpoint": "http://localhost:9000/v1",
    "registered_at": datetime.datetime.utcnow().isoformat() + "Z",
}

Path("registry.json").write_text(json.dumps(entry, indent=2))
print(f"Model registered: {entry['name']} v{entry['version']}")
print(f"AIBOM hash: {entry['aibom_hash'][:16]}...")
print(f"Promotion ledger: {entry['promotion_ledger_hash'][:16]}...")
