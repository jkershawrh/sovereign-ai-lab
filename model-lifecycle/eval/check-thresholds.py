#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from benchmark_utils import evaluate_all

BASE_DIR = Path(__file__).resolve().parent
THRESHOLDS = json.loads((BASE_DIR / "thresholds.json").read_text())


def resolve_results_path(path: str) -> Path:
    candidate = Path(path)
    if candidate.exists():
        return candidate
    return BASE_DIR / path


if len(sys.argv) != 2:
    print("Usage: check-thresholds.py <results.json>")
    sys.exit(2)

results = json.loads(resolve_results_path(sys.argv[1]).read_text())
benchmarks = evaluate_all(THRESHOLDS, results)

failures = []
for benchmark in benchmarks:
    comparator = "<=" if benchmark["direction"] == "max" else ">="
    status = "PASS" if benchmark["pass"] else "FAIL"
    print(
        "  {name} [{category}/{metric}]: {score:.3f} "
        "({comparator} {threshold}) -- {status}".format(
            comparator=comparator,
            status=status,
            **benchmark,
        )
    )
    if benchmark.get("missing"):
        failures.append(f"{benchmark['name']}: missing metric {benchmark['metric']}")
    elif not benchmark["pass"]:
        failures.append(
            "{name}: {score:.3f} {comparator} {threshold} expected".format(
                comparator=comparator,
                **benchmark,
            )
        )

if failures:
    print(f"\nFAIL: {len(failures)} benchmark(s) below threshold:")
    for failure in failures:
        print(f"  {failure}")
    sys.exit(1)

print(f"\nAll {len(benchmarks)} benchmarks passed.")
