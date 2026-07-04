#!/usr/bin/env python3
import json, sys
from pathlib import Path

THRESHOLDS = json.loads(Path("thresholds.json").read_text())
results = json.loads(Path(sys.argv[1]).read_text())

failures = []
for task, threshold in THRESHOLDS.items():
    task_results = results.get("results", {}).get(task, {})
    score = task_results.get("acc,none", task_results.get("acc", 0))
    status = "PASS" if score >= threshold else "FAIL"
    print(f"  {task}: {score:.3f} (threshold {threshold}) -- {status}")
    if score < threshold:
        failures.append(f"{task}: {score:.3f} < {threshold}")

if failures:
    print(f"\nFAIL: {len(failures)} benchmark(s) below threshold:")
    for f in failures:
        print(f"  {f}")
    sys.exit(1)

print(f"\nAll {len(THRESHOLDS)} benchmarks passed.")
