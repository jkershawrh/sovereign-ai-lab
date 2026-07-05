from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class BenchmarkSpec:
    name: str
    category: str
    metric: str
    threshold: float
    direction: str
    description: str


def normalize_spec(name: str, raw_spec: Any) -> BenchmarkSpec:
    if isinstance(raw_spec, (int, float)):
        return BenchmarkSpec(
            name=name,
            category="foundation_quality",
            metric="acc",
            threshold=float(raw_spec),
            direction="min",
            description="Legacy accuracy threshold.",
        )

    if not isinstance(raw_spec, dict):
        raise ValueError(f"{name}: threshold must be a number or object")

    if "threshold" not in raw_spec:
        raise ValueError(f"{name}: threshold object must include 'threshold'")

    direction = str(raw_spec.get("direction", "min"))
    if direction not in {"min", "max"}:
        raise ValueError(f"{name}: direction must be 'min' or 'max'")

    return BenchmarkSpec(
        name=name,
        category=str(raw_spec.get("category", "uncategorized")),
        metric=str(raw_spec.get("metric", "acc")),
        threshold=float(raw_spec["threshold"]),
        direction=direction,
        description=str(raw_spec.get("description", "")),
    )


def extract_score(task_data: dict[str, Any], metric: str) -> float | None:
    keys = [metric, f"{metric},none"]
    if metric == "acc":
        keys.extend(["acc,none", "acc"])

    for key in keys:
        if key in task_data:
            return float(task_data[key])
    return None


def passed(score: float | None, threshold: float, direction: str) -> bool:
    if score is None:
        return False
    if direction == "max":
        return score <= threshold
    return score >= threshold


def evaluate_benchmark(name: str, raw_spec: Any, results: dict[str, Any]) -> dict[str, Any]:
    spec = normalize_spec(name, raw_spec)
    task_data = results.get("results", {}).get(name, {})
    score = extract_score(task_data, spec.metric)
    benchmark = {
        "name": spec.name,
        "category": spec.category,
        "metric": spec.metric,
        "score": round(score if score is not None else 0.0, 4),
        "threshold": spec.threshold,
        "direction": spec.direction,
        "pass": passed(score, spec.threshold, spec.direction),
        "description": spec.description,
    }
    if score is None:
        benchmark["missing"] = True
    return benchmark


def evaluate_all(thresholds: dict[str, Any], results: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        evaluate_benchmark(name, raw_spec, results)
        for name, raw_spec in thresholds.items()
    ]
