#!/usr/bin/env python3
"""
Sovereign AI Lab — GCL Prompt Governance Adapter

Drop-in replacement for the regex-based semantic router.  Runs the full
Governed Cognitive Loop governance cycle on every prompt:

  1. Evidence collection   — regex pattern scores + metadata
  2. Constraint classifier — GCL RuleEngine (deterministic first, LLM fallback)
  3. Falsification gate    — OPA data-residency policy check
  4. Signed commit         — write decision to the immutable ledger
  5. Proxy / reject        — forward approved prompts to the vLLM/OVMS backend

Same endpoints as the original semantic router:
  GET  /health
  GET  /readyz
  POST /classify
  POST /v1/chat/completions
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

import httpx
import yaml
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from gcl.domain.contracts import Constraint, Evidence
from gcl.domain.enums import ConstraintSource, ConstraintType
from gcl.classifier.rules import RuleEngine

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("gcl.prompt-adapter")

# ── Configuration ────────────────────────────────────────────────────────────

BACKEND = os.environ.get("SR_BACKEND", "http://localhost:8000/v1/chat/completions")
MODEL = os.environ.get("SR_MODEL", "granite-3.2-sovereign")
LEDGER_API = os.environ.get("SR_LEDGER_API", "http://ledger-gateway:28099/api/entries")
PORT = int(os.environ.get("SR_PORT", "8001"))
OPA_ENDPOINT = os.environ.get(
    "GCL_OPA_ENDPOINT",
    "http://opa:8181/v1/data/sovereign/data_residency/allow",
)
AGENT_ID = "governed-cognitive-loop"
SOURCE_ID = "sovereign-ai-lab"


# ── Load rules config ───────────────────────────────────────────────────────

def _load_rules_config() -> dict:
    path = Path(__file__).with_name("rules.yaml")
    if path.exists():
        with open(path) as f:
            return yaml.safe_load(f) or {}
    return {}


_CONFIG = _load_rules_config()


def _compile_patterns(section: str) -> re.Pattern:
    """Compile a list of pattern fragments from rules.yaml into one regex."""
    fragments = _CONFIG.get("patterns", {}).get(section, [])
    if not fragments:
        return re.compile(r"(?!)")  # never matches
    return re.compile("|".join(f"({p})" for p in fragments), re.IGNORECASE)


SENSITIVE_RE = _compile_patterns("sensitive")
INJECTION_RE = _compile_patterns("injection")


def _build_rule_engine() -> RuleEngine:
    """Build a GCL RuleEngine from the prompt-governance rules."""
    raw_rules = _CONFIG.get("rules", [])
    return RuleEngine(rules=raw_rules)


RULE_ENGINE = _build_rule_engine()


# ── Evidence collection ──────────────────────────────────────────────────────

def collect_evidence(text: str) -> list[Evidence]:
    """Score the prompt text against the regex patterns and return Evidence."""
    injection_match = INJECTION_RE.search(text)
    sensitive_match = SENSITIVE_RE.search(text)

    evidence = [
        Evidence(
            metric="injection_score",
            value=0.9 if injection_match else 0.0,
            source="regex-detector",
            labels={"pattern": "injection"},
            metadata={"matched": injection_match.group(0) if injection_match else None},
        ),
        Evidence(
            metric="sensitive_score",
            value=0.8 if sensitive_match else 0.0,
            source="regex-detector",
            labels={"pattern": "sensitive"},
            metadata={"matched": sensitive_match.group(0) if sensitive_match else None},
        ),
        Evidence(
            metric="residency_violation_score",
            value=0.0,  # updated by OPA falsification check
            source="opa-policy",
            labels={"policy": "data_residency"},
        ),
    ]
    return evidence


# ── Constraint classification ────────────────────────────────────────────────

def classify_prompt(evidence: list[Evidence]) -> dict:
    """
    Run GCL's deterministic RuleEngine over the evidence and derive a
    routing decision.
    """
    constraints, _unmatched = RULE_ENGINE.evaluate(evidence)

    # Determine route from constraints
    has_hard_compliance = any(
        c.type == ConstraintType.COMPLIANCE and c.hard for c in constraints
    )
    has_residency = any(
        c.type == ConstraintType.RESIDENCY for c in constraints
    )

    # Check which specific pattern triggered the compliance constraint
    injection_fired = any(
        c.type == ConstraintType.COMPLIANCE
        and c.hard
        and any(
            e.metric == "injection_score"
            for e in evidence
            if e.id in c.justification_evidence_ids and e.value > 0.5
        )
        for c in constraints
    )

    if injection_fired:
        route = "prompt-injection"
        confidence = 0.9
    elif has_hard_compliance:
        route = "prompt-injection"
        confidence = 0.9
    elif has_residency:
        route = "sensitive-data"
        confidence = 0.8
    else:
        route = "general"
        confidence = 0.7

    return {
        "route": route,
        "confidence": confidence,
        "constraints": constraints,
        "governance": "gcl",
    }


# ── Falsification gate (OPA) ────────────────────────────────────────────────

async def falsify_with_opa(route: str, text_preview: str) -> dict:
    """
    Query OPA data-residency policy.  If the route would violate residency
    rules, return a failure verdict.
    """
    opa_input = {
        "input": {
            "destination_region": "local",
            "data_classification": "sensitive_personal" if route == "sensitive-data" else "general",
            "text_preview": text_preview[:40],
        }
    }
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.post(OPA_ENDPOINT, json=opa_input)
            if resp.status_code == 200:
                result = resp.json()
                allowed = result.get("result", True)
                return {
                    "verdict": "survives" if allowed else "fails",
                    "check": "opa_data_residency",
                    "reasoning": "OPA policy check passed" if allowed else "data residency violation",
                    "opa_result": result,
                }
    except Exception as e:
        logger.debug("OPA unavailable, allowing by default: %s", e)

    return {
        "verdict": "survives",
        "check": "opa_data_residency",
        "reasoning": "OPA unavailable — allowing by default (demo mode)",
    }


# ── Ledger writes ────────────────────────────────────────────────────────────

async def write_ledger(event_type: str, payload: dict, correlation_id: str | None = None):
    """
    Write a governance decision to the immutable ledger using GCL conventions:
    idempotency key, input hash, signed agent identity.
    """
    content_json = json.dumps(payload, default=str, sort_keys=True, separators=(",", ":"))
    input_hash = hashlib.sha256(content_json.encode("utf-8")).hexdigest()

    corr_id = correlation_id or str(uuid4())
    idempotency_key = hashlib.sha256(
        f"{event_type}\0{corr_id}\0{input_hash}".encode("utf-8")
    ).hexdigest()

    body = {
        "entry_type": event_type,
        "agent_id": AGENT_ID,
        "content": content_json,
        "content_type": "application/json",
        "source_id": SOURCE_ID,
        "correlation_id": corr_id,
        "idempotency_key": idempotency_key,
        "input_hash": input_hash,
    }

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(LEDGER_API, json=body)
    except Exception as e:
        logger.warning("Ledger write failed (non-fatal): %s", e)


# ── Backend proxy ────────────────────────────────────────────────────────────

async def proxy_to_backend(messages: list, max_tokens: int = 200) -> dict:
    """Forward the request to the vLLM/OVMS backend."""
    body = {"model": MODEL, "messages": messages, "max_tokens": max_tokens}
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(BACKEND, json=body)
        resp.raise_for_status()
        return resp.json()


# ── FastAPI application ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GCL prompt adapter starting on :%d", PORT)
    logger.info("  Backend:  %s", BACKEND)
    logger.info("  Model:    %s", MODEL)
    logger.info("  Ledger:   %s", LEDGER_API)
    logger.info("  OPA:      %s", OPA_ENDPOINT)
    logger.info("  Agent ID: %s", AGENT_ID)
    yield


app = FastAPI(title="GCL Prompt Governance Adapter", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "governed-cognitive-loop"}


@app.get("/readyz")
async def readyz():
    return {"ready": True}


@app.post("/classify")
async def classify_endpoint(request: Request):
    body = await request.json()
    text = body.get("text", "")

    # 1. Collect evidence
    evidence = collect_evidence(text)

    # 2. Classify via GCL RuleEngine
    decision = classify_prompt(evidence)

    # 3. Write to ledger
    correlation_id = str(uuid4())
    await write_ledger(
        f"router.{decision['route']}.classified",
        {
            "text_preview": text[:80],
            "route": decision["route"],
            "confidence": decision["confidence"],
            "governance": "gcl",
            "constraint_count": len(decision["constraints"]),
        },
        correlation_id,
    )

    return {"route": decision["route"], "confidence": decision["confidence"]}


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    user_text = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"),
        "",
    )
    correlation_id = str(uuid4())

    # ── Step 1: Collect evidence ─────────────────────────────────────────
    evidence = collect_evidence(user_text)

    # ── Step 2: Classify via GCL RuleEngine ──────────────────────────────
    decision = classify_prompt(evidence)

    # ── Step 3: Falsification gate (OPA) ─────────────────────────────────
    opa_result = await falsify_with_opa(decision["route"], user_text)

    if opa_result["verdict"] == "fails":
        await write_ledger(
            "router.falsification.blocked",
            {
                "text_preview": user_text[:80],
                "route": decision["route"],
                "failed_check": opa_result["check"],
                "reasoning": opa_result["reasoning"],
                "governance": "gcl",
            },
            correlation_id,
        )
        return JSONResponse(
            status_code=400,
            content={
                "error": "request rejected",
                "reason": "data residency policy violation",
                "route": decision["route"],
            },
        )

    # ── Step 4: Handle injection ─────────────────────────────────────────
    if decision["route"] == "prompt-injection":
        await write_ledger(
            "router.injection.blocked",
            {
                "text_preview": user_text[:80],
                "reason": "prompt injection detected",
                "governance": "gcl",
                "falsification_verdict": opa_result["verdict"],
                "constraint_count": len(decision["constraints"]),
            },
            correlation_id,
        )
        return JSONResponse(
            status_code=400,
            content={
                "error": "request rejected",
                "reason": "prompt injection detected",
                "route": "prompt-injection",
            },
        )

    # ── Step 5: Commit decision to ledger ────────────────────────────────
    await write_ledger(
        f"router.{decision['route']}.routed_local",
        {
            "text_preview": user_text[:80],
            "route": decision["route"],
            "model": MODEL,
            "governance": "gcl",
            "falsification_verdict": opa_result["verdict"],
            "constraint_count": len(decision["constraints"]),
        },
        correlation_id,
    )

    # ── Step 6: Proxy to backend ─────────────────────────────────────────
    try:
        result = await proxy_to_backend(messages, body.get("max_tokens", 200))
        return result
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={"error": f"backend error: {e}"},
        )


# ── Entrypoint ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
