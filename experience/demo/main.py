"""
Sovereign AI Lab — Demo API
FastAPI backend serving real data from all infrastructure components.
"""
import json
import os
import subprocess

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Sovereign AI Lab Demo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9001", "http://localhost:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LEDGER_GATEWAY = os.environ.get("LEDGER_GATEWAY", "http://ledger-gateway:28099")
OPA = os.environ.get("OPA_ENDPOINT", "http://opa:8181")
ROUTER = os.environ.get("ROUTER_ENDPOINT", "http://semantic-router:8001")
OVMS = os.environ.get("OVMS_ENDPOINT", "http://ovms-sovereign-granite:8080")
MCP = os.environ.get("MCP_ENDPOINT", "http://sovereign-data-mcp:8090")
WORKSPACE = os.environ.get("WORKSPACE", "/workspace")


async def _get(url):
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(url)
        r.raise_for_status()
        return r.json()


async def _post(url, body):
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(url, json=body)
        r.raise_for_status()
        return r.json()


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "demo-api"}


# ─── Attestation ─────────────────────────────────────────────────────────────

@app.get("/api/attestation")
async def get_attestation():
    from pathlib import Path
    summary_path = Path(f"{WORKSPACE}/infra/tdx/attestation-summary.txt")
    report_path = Path(f"{WORKSPACE}/infra/tdx/attestation-report.json")
    td_path = Path(f"{WORKSPACE}/infra/tdx/td-config.json")
    if not summary_path.exists():
        raise HTTPException(404, "No attestation found. Run 'make attest' first.")
    return {
        "summary": summary_path.read_text(),
        "report": json.loads(report_path.read_text()) if report_path.exists() else None,
        "td_config": json.loads(td_path.read_text()) if td_path.exists() else None,
    }


@app.post("/api/attestation/refresh")
async def refresh_attestation():
    result = subprocess.run(
        ["bash", f"{WORKSPACE}/infra/tdx/attest.sh"],
        capture_output=True, text=True, cwd=WORKSPACE,
    )
    if result.returncode != 0:
        raise HTTPException(500, f"Attestation failed: {result.stderr}")
    return {"success": True, "output": result.stdout}


# ─── Model provenance ───────────────────────────────────────────────────────

@app.get("/api/model/aibom")
async def get_aibom():
    from pathlib import Path
    path = Path(f"{WORKSPACE}/model-lifecycle/aibom/sovereign-granite-3b.aibom.json")
    if not path.exists():
        raise HTTPException(404, "AIBOM not found. Run 'make pipeline' first.")
    return json.loads(path.read_text())


@app.get("/api/model/promotion")
async def get_promotion():
    from pathlib import Path
    path = Path(f"{WORKSPACE}/model-lifecycle/promote/promotion-decision.json")
    if not path.exists():
        raise HTTPException(404, "Promotion decision not found.")
    return json.loads(path.read_text())


@app.get("/api/model/registry")
async def get_registry():
    from pathlib import Path
    path = Path(f"{WORKSPACE}/model-lifecycle/registry/registry.json")
    if not path.exists():
        raise HTTPException(404, "Registry entry not found.")
    return json.loads(path.read_text())


# ─── Inference routing ───────────────────────────────────────────────────────

@app.post("/api/route")
async def route_prompt(body: dict):
    prompt = body.get("prompt", "")
    max_tokens = body.get("max_tokens", 200)
    try:
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{ROUTER}/v1/chat/completions", json={
                "model": "granite-3.2-sovereign",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
            })
            result = r.json()
            if r.status_code == 400:
                return {"route": "rejected", "reason": result.get("reason", "rejected")}
            r.raise_for_status()
            return {
                "route": "completed",
                "response": result["choices"][0]["message"]["content"],
                "model": result.get("model"),
            }
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, str(e))
    except Exception as e:
        raise HTTPException(502, str(e))


@app.post("/api/classify")
async def classify_only(body: dict):
    return await _post(f"{ROUTER}/classify", {"text": body.get("prompt", "")})


# ─── OPA policies ───────────────────────────────────────────────────────────

@app.get("/api/policies")
async def get_policies():
    return await _get(f"{OPA}/v1/policies")


@app.post("/api/policies/evaluate")
async def evaluate_policy(body: dict):
    policy = body.get("policy", "sovereign/data_residency/allow")
    input_data = body.get("input", {})
    return await _post(f"{OPA}/v1/data/{policy}", {"input": input_data})


# ─── Ledger ──────────────────────────────────────────────────────────────────

@app.get("/api/ledger")
async def get_ledger():
    return await _get(f"{LEDGER_GATEWAY}/api/entries")


@app.get("/api/ledger/verify")
async def verify_ledger():
    return await _get(f"{LEDGER_GATEWAY}/api/verify")


@app.get("/api/ledger/writers")
async def get_writers():
    entries = await _get(f"{LEDGER_GATEWAY}/api/entries")
    writers = {}
    for entry in entries:
        w = entry.get("agent_id", "unknown")
        writers[w] = writers.get(w, 0) + 1
    return {"writers": writers, "total": len(entries)}


# ─── MCP tools ───────────────────────────────────────────────────────────────

@app.get("/api/mcp/tools")
async def get_mcp_tools():
    return await _get(f"{MCP}/tools")


@app.post("/api/mcp/call")
async def call_mcp_tool(body: dict):
    return await _post(f"{MCP}/tools/call", body)


# ─── Jurisdiction profiles ───────────────────────────────────────────────────

@app.get("/api/profiles")
async def get_profiles():
    from pathlib import Path
    profiles_dir = Path(f"{WORKSPACE}/experience/showroom/profiles")
    if not profiles_dir.exists():
        return {}
    profiles = {}
    for f in profiles_dir.glob("*.json"):
        profiles[f.stem] = json.loads(f.read_text())
    return profiles


@app.get("/api/profiles/{profile_id}")
async def get_profile(profile_id: str):
    from pathlib import Path
    path = Path(f"{WORKSPACE}/experience/showroom/profiles/{profile_id}.json")
    if not path.exists():
        raise HTTPException(404, f"Profile not found: {profile_id}")
    return json.loads(path.read_text())
