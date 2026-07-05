#!/usr/bin/env python3
"""
Sovereign AI Lab — Semantic Router

Classifies prompts into: sensitive-data, prompt-injection, general.
Routes to the configured vLLM/OVMS backend.
Writes routing decisions to the immutable ledger.

Lightweight implementation for the demo — replace with
vllm-project/semantic-router for production.
"""
import json
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request

BACKEND = os.environ.get("SR_BACKEND", "http://localhost:8000/v1/chat/completions")
MODEL = os.environ.get("SR_MODEL", "granite-3.2-sovereign")
LEDGER_API = os.environ.get("SR_LEDGER_API", "http://ledger-gateway:28099/api/entries")
PORT = int(os.environ.get("SR_PORT", "8001"))

SENSITIVE_PATTERNS = re.compile(
    r"(health\s+record|patient|medical|diagnosis|prescription|"
    r"financial|bank\s+account|credit\s+card|social\s+security|"
    r"personal\s+data|biometric|genetic|disability|"
    r"retention\s+rule|data\s+residency|cross.border|pii)",
    re.IGNORECASE,
)
INJECTION_PATTERNS = re.compile(
    r"(ignore\s+(all\s+)?previous|system\s+prompt|"
    r"disregard\s+instructions|override|jailbreak|"
    r"you\s+are\s+now|act\s+as\s+if|pretend\s+you|"
    r"output\s+your\s+(system|initial)|reveal\s+your)",
    re.IGNORECASE,
)


def classify(text: str) -> dict:
    if INJECTION_PATTERNS.search(text):
        return {"route": "prompt-injection", "confidence": 0.9}
    if SENSITIVE_PATTERNS.search(text):
        return {"route": "sensitive-data", "confidence": 0.8}
    return {"route": "general", "confidence": 0.7}


def write_ledger(event_type: str, payload: dict):
    try:
        body = json.dumps({
            "entry_type": event_type,
            "agent_id": "semantic-router",
            "content": json.dumps(payload),
            "content_type": "application/json",
            "source_id": "sovereign-ai-lab",
        }).encode()
        req = urllib.request.Request(
            LEDGER_API,
            data=body,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass


def proxy_to_backend(messages: list, max_tokens: int = 200) -> dict:
    body = json.dumps({
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(
        BACKEND,
        data=body,
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=120)
    return json.loads(resp.read())


class RouterHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self._respond(200, {"status": "ok", "service": "semantic-router"})
        elif self.path == "/readyz":
            self._respond(200, {"ready": True})
        else:
            self._respond(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if self.path == "/classify":
            text = body.get("text", "")
            result = classify(text)
            write_ledger(f"router.{result['route']}.classified", {
                "text_preview": text[:80],
                "route": result["route"],
                "confidence": result["confidence"],
            })
            self._respond(200, result)

        elif self.path == "/v1/chat/completions":
            messages = body.get("messages", [])
            user_text = next(
                (m["content"] for m in reversed(messages) if m.get("role") == "user"),
                "",
            )
            decision = classify(user_text)

            if decision["route"] == "prompt-injection":
                write_ledger("router.injection.blocked", {
                    "text_preview": user_text[:80],
                    "reason": "prompt injection detected",
                })
                self._respond(400, {
                    "error": "request rejected",
                    "reason": "prompt injection detected",
                    "route": "prompt-injection",
                })
                return

            write_ledger(f"router.{decision['route']}.routed_local", {
                "text_preview": user_text[:80],
                "route": decision["route"],
                "model": MODEL,
            })

            try:
                result = proxy_to_backend(messages, body.get("max_tokens", 200))
                self._respond(200, result)
            except Exception as e:
                self._respond(502, {"error": f"backend error: {e}"})

        else:
            self._respond(404, {"error": "not found"})

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    print(f"Semantic router starting on :{PORT}")
    print(f"  Backend: {BACKEND}")
    print(f"  Model: {MODEL}")
    print(f"  Ledger: {LEDGER_API}")
    server = HTTPServer(("0.0.0.0", PORT), RouterHandler)
    server.serve_forever()
