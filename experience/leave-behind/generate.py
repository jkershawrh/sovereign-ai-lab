#!/usr/bin/env python3
"""
Sovereign AI Lab — Leave-Behind Document Generator

Generates a jurisdiction-specific leave-behind document from profile data,
AIBOM provenance, and ledger verification state.
"""
import argparse
import json
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
TEMPLATE_PATH = Path(__file__).resolve().parent / "template.md"
OUTPUT_DIR = Path(__file__).resolve().parent / "output"
REPO_URL = "https://github.com/jkershawrh/sovereign-ai-lab"


def load_profile(profile_id: str) -> dict:
    path = ROOT / "experience" / "showroom" / "profiles" / f"{profile_id}.json"
    if not path.exists():
        print(f"ERROR: Profile not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def load_aibom() -> dict:
    path = ROOT / "model-lifecycle" / "aibom" / "sovereign-granite-3b.aibom.json"
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)


def fetch_ledger_verify() -> dict:
    """Try to get ledger verification data. Returns empty dict on failure."""
    try:
        req = urllib.request.Request(
            "http://localhost:28099/api/verify", method="GET"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return {}


def format_compliance_labels(labels: list) -> str:
    lines = []
    for label in labels:
        lines.append(f"- **{label['name']}** ({label['layer']}): {label['description']}")
    return "\n".join(lines)


def format_opa_policies(policies: list) -> str:
    return "\n".join(f"- `{p}`" for p in policies)


def format_recommended_models(models: list) -> str:
    lines = []
    for m in models:
        lines.append(f"- **{m['name']}** — {m['reason']}")
    return "\n".join(lines)


def format_aibom_requirements(requirements: list) -> str:
    return "\n".join(f"- {r}" for r in requirements)


def generate(profile_id: str) -> Path:
    profile = load_profile(profile_id)
    aibom = load_aibom()
    ledger = fetch_ledger_verify()

    template = TEMPLATE_PATH.read_text()

    filled = template.format(
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        jurisdiction=profile.get("name", profile_id),
        key_concern=profile.get("key_concern", ""),
        compliance_labels=format_compliance_labels(profile.get("compliance_labels", [])),
        opa_policies=format_opa_policies(profile.get("opa_policies", [])),
        recommended_models=format_recommended_models(profile.get("recommended_models", [])),
        aibom_requirements=format_aibom_requirements(profile.get("aibom_requirements", [])),
        aibom_hash=aibom.get("provenance_hash", "not available"),
        root_hash=ledger.get("root_hash", "not available — ledger offline"),
        entry_count=ledger.get("entry_count", "N/A"),
        repo_url=REPO_URL,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    md_path = OUTPUT_DIR / f"{profile_id}-leave-behind.md"
    md_path.write_text(filled)
    print(f"Markdown written: {md_path}")

    # Try PDF conversion via pandoc
    pdf_path = OUTPUT_DIR / f"{profile_id}-leave-behind.pdf"
    try:
        subprocess.run(
            [
                "pandoc", str(md_path),
                "-o", str(pdf_path),
                "--pdf-engine=xelatex",
                "-V", "geometry:margin=1in",
                "-V", "mainfont=DejaVu Sans",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"PDF written: {pdf_path}")
    except FileNotFoundError:
        print("pandoc not found — skipping PDF generation", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"PDF generation failed: {e.stderr}", file=sys.stderr)

    return md_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate a sovereign AI leave-behind document"
    )
    parser.add_argument(
        "profile",
        nargs="?",
        default="eu",
        help="Jurisdiction profile ID (default: eu)",
    )
    args = parser.parse_args()
    generate(args.profile)


if __name__ == "__main__":
    main()
