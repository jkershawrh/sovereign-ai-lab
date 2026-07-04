#!/usr/bin/env python3
import json, hashlib, datetime, os
from pathlib import Path

LEDGER_API = os.environ.get("LEDGER_API", "http://localhost:28099")

eval_results = json.loads(
    Path("../eval/output/results.json").read_text()
)
thresholds = json.loads(Path("../eval/thresholds.json").read_text())

benchmarks = []
for task, threshold in thresholds.items():
    task_data = eval_results.get("results", {}).get(task, {})
    score = task_data.get("acc,none", task_data.get("acc", 0))
    benchmarks.append({
        "name": task,
        "score": round(score, 4),
        "threshold": threshold,
        "pass": score >= threshold,
    })

synth_path = Path("../synth/output/synthetic-qa.jsonl")
record_count = sum(1 for _ in open(synth_path)) if synth_path.exists() else 0

aibom = {
    "aibom_version": "1.0",
    "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    "model": {
        "name": "sovereign-granite-3b-instruct",
        "version": "1.0.0",
        "base_model": {
            "name": "ibm-granite/granite-3.2-3b-instruct",
            "source": "https://huggingface.co/ibm-granite/granite-3.2-3b-instruct",
            "license": "Apache-2.0",
        },
        "adaptation": {
            "method": "Training Hub SFT",
            "training_data_sources": [{
                "name": "synthetic-sovereign-docs",
                "description": "Synthetic QA pairs from jurisdiction-local documents",
                "generation_method": "SDG Hub",
                "jurisdiction": "in-jurisdiction",
                "pii_screened": True,
                "records": record_count,
            }],
            "training_environment": {
                "platform": "sovereign-ai-lab single node",
                "node_type": "Intel Xeon TDX",
                "in_jurisdiction": True,
            },
        },
        "evaluation": {
            "framework": "lm-eval",
            "benchmarks": benchmarks,
            "all_pass": all(b["pass"] for b in benchmarks),
        },
    },
}

content = json.dumps(aibom, sort_keys=True).encode()
aibom["provenance_hash"] = hashlib.sha256(content).hexdigest()

Path("sovereign-granite-3b.aibom.json").write_text(
    json.dumps(aibom, indent=2)
)
print(f"AIBOM written. Provenance hash: {aibom['provenance_hash']}")

try:
    import httpx
    r = httpx.post(f"{LEDGER_API}/api/entries", json={
        "entry_type": "model.aibom.registered",
        "agent_id": "model-lifecycle/aibom/generate.py",
        "content": json.dumps({
            "model_name": "sovereign-granite-3b-instruct",
            "provenance_hash": aibom["provenance_hash"],
            "all_benchmarks_pass": aibom["model"]["evaluation"]["all_pass"],
        }),
        "content_type": "application/json",
        "source_id": "sovereign-ai-lab",
    }, timeout=5)
    entry = r.json()
    aibom["ledger_entry"] = entry.get("entry_hash")
    Path("sovereign-granite-3b.aibom.json").write_text(json.dumps(aibom, indent=2))
    print(f"Ledger entry: {entry.get('entry_hash')}")
except Exception as e:
    print(f"Warning: Could not write to ledger: {e}")
