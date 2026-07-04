"""
Sovereign Data MCP Server.
Serves jurisdiction-local documents as MCP tools.
No external calls. All data from local filesystem.
"""
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

DOCS_DIR = Path(os.environ.get("DOCS_DIR", "/docs"))
PORT = int(os.environ.get("MCP_PORT", "8090"))

TOOLS = [
    {
        "name": "get_health_policy",
        "description": "Returns the jurisdiction health data governance policy",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_procurement_guidelines",
        "description": "Returns AI procurement guidelines for government entities",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_data_residency_rules",
        "description": "Returns the data residency regulation text",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "search_documents",
        "description": "Keyword search across all jurisdiction documents",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search terms"}},
            "required": ["query"],
        },
    },
]

DOC_MAP = {
    "get_health_policy": "health-data-policy.md",
    "get_procurement_guidelines": "ai-procurement-guidelines.md",
    "get_data_residency_rules": "data-residency-regulation.md",
}


def load_document(name):
    path = DOCS_DIR / name
    if not path.exists():
        return f"Document not found: {name}"
    return path.read_text(encoding="utf-8")


def search_documents(query):
    query_lower = query.lower()
    results = []
    for doc in DOCS_DIR.glob("*.md"):
        text = doc.read_text(encoding="utf-8")
        if query_lower in text.lower():
            idx = text.lower().find(query_lower)
            start = max(0, idx - 100)
            excerpt = text[start : idx + 400]
            results.append({"document": doc.name, "excerpt": excerpt})
    return results


def call_tool(name, arguments):
    if name in DOC_MAP:
        return load_document(DOC_MAP[name])
    if name == "search_documents":
        query = arguments.get("query", "")
        results = search_documents(query)
        return json.dumps(results, indent=2) if results else "No results found."
    return f"Unknown tool: {name}"


class MCPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self._respond(200, {"status": "ok", "service": "sovereign-data-mcp"})
        elif self.path == "/tools":
            self._respond(200, {"tools": TOOLS})
        else:
            self._respond(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if self.path == "/tools/call":
            name = body.get("name", "")
            arguments = body.get("arguments", {})
            result = call_tool(name, arguments)
            self._respond(200, {"result": result})
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
    print(f"Sovereign Data MCP Server starting on :{PORT}")
    print(f"  Docs dir: {DOCS_DIR}")
    print(f"  Documents: {list(DOCS_DIR.glob('*.md'))}")
    server = HTTPServer(("0.0.0.0", PORT), MCPHandler)
    server.serve_forever()
