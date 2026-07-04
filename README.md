# Sovereign AI Lab

**Provable AI governance on Intel hardware.**

A demonstration platform proving that sovereign AI means more than local deployment — it means possessing, running, adapting, governing, and *proving* your AI infrastructure is truly yours. Every governance decision is recorded in a tamper-evident hash chain. The root hash proves the full audit trail.

## What This Is

Seven layers of sovereign AI running on a single Intel Xeon node:

| Layer | Component | What It Proves |
|-------|-----------|---------------|
| Hardware Trust | Intel TDX | Your compute is yours — cryptographic attestation from the CPU |
| Platform | OpenShift AI | Your platform is yours — confidential containers, no code changes |
| Models | Granite (open weights) | Your model is yours — open weights, AIBOM provenance, OPA promotion gate |
| Data Governance | OPA + Residency Policies | Your data stays here — deny-by-default per jurisdiction (GDPR, Gulf, PDPA) |
| Proof Chain | are-immutable-ledger | Every decision is provable — tamper-evident hash chain |
| Agent Control | Semantic Router + SPIFFE | Your agents are governed — identity, classification, injection detection |
| Gateway | Praxis + ContextForge | Your gateway is controlled — filter pipeline, MCP federation |

## Quick Start

### Prerequisites

- TDX-enabled Intel Xeon (for real attestation; simulation mode works on any hardware)
- Docker/Podman with compose support
- Python 3.11+
- Git with LFS

### One-Command Setup (Local)

```bash
git clone https://github.com/rhpds/sovereign-ai-lab
cd sovereign-ai-lab
cp .env.example .env   # fill in ITA_API_KEY, HF_TOKEN
make up-infra           # start ledger, OPA, vLLM, semantic router
make attest             # run TDX attestation
make pipeline           # run model lifecycle pipeline
make verify-infra       # verify everything (13 checks)
```

### Deploy to OpenShift (dev-cluster-1)

```bash
make deploy-dev-cluster-1      # deploys all services to sovereign-ai-lab namespace
```

## Port Map

| Port | Service | Layer |
|------|---------|-------|
| 28080 | Ledger health | Infrastructure |
| 28099 | Ledger REST gateway | Infrastructure |
| 8181 | OPA | Policy |
| 8080 | OVMS (Granite 3.2 2B) | Models |
| 8001 | Semantic router | Agent Control |
| 9000 | Praxis | Gateway |
| 4444 | ContextForge | Gateway |
| 8090 | Sovereign data MCP | Data |
| 9099 | Demo API (FastAPI) | Integration |
| 9001 | Frontend | Experience |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                    :9001       │
│  Slides → Demo → Lab                                    │
├─────────────────────────────────────────────────────────┤
│  Demo API (FastAPI)                         :9099       │
├────────────────────┬────────────────────────────────────┤
│  Praxis            │  ContextForge          :9000/:4444 │
│  (filter pipeline) │  (MCP/A2A gateway)                 │
├────────────────────┴────────────────────────────────────┤
│  Semantic Router        OPA Policies        :8001/:8181 │
│  (classify/route)       (deny-by-default)               │
├─────────────────────────────────────────────────────────┤
│  OVMS Granite 3.2 2B (INT4, CPU)            :8080       │
├─────────────────────────────────────────────────────────┤
│  are-immutable-ledger (gRPC + REST)     :28080/:28099   │
│  PostgreSQL                                             │
├─────────────────────────────────────────────────────────┤
│  Intel TDX Trust Domain                                 │
│  Intel Xeon 6767P                                       │
└─────────────────────────────────────────────────────────┘
```

## Verification Gates

```bash
make verify-infra       # 13 checks — Doc 1 (infrastructure)
make verify-gateway     # 6 checks  — Doc 2 (gateway + demo API)
make verify-experience  # 13 checks — Doc 3 (frontend + lab)
make verify             # all three
```

## Jurisdiction Profiles

The lab supports five sovereignty perspectives:

- 🇪🇺 **European Union** — GDPR, EU AI Act, GAIA-X, SecNumCloud
- 🌙 **Gulf States** — National AI Strategy, data localization, data classification
- 🌏 **Southeast Asia** — PDPA, government cloud policy, data sovereignty
- 🏢 **Enterprise** — IP protection, audit trail, vendor independence
- 👤 **Individual** — Data ownership, right to explanation, local processing

## OPA Policies

Seven deny-by-default Rego policies with full test coverage (30/30):

- `data-residency.rego` — generic data residency enforcement
- `data-residency-gdpr.rego` — EU GDPR Article 44
- `data-residency-gulf.rego` — Gulf data localization
- `data-residency-seasia.rego` — PDPA cross-border rules
- `model-access.rego` — agent identity required
- `model-promotion.rego` — AIBOM + jurisdiction + benchmarks
- `agent-lifecycle.rego` — SPIFFE identity for agent actions

## Repository Structure

```
sovereign-ai-lab/
├── Makefile                    # all orchestration targets
├── docker-compose.infra.yml   # local: ledger + OPA + inference
├── docker-compose.gateway.yml # local: gateway services
├── .env.example
├── ledger/                    # are-immutable-ledger submodule
├── gateway/                   # praxis + contextforge submodules + config
├── infra/                     # TDX scripts + OPA policies
├── model-lifecycle/           # pipeline: ingest → synth → train → eval → AIBOM → promote
├── inference/                 # vLLM/OVMS config + semantic router
├── experience/
│   ├── frontend/              # React + Vite (slides → demo → lab)
│   ├── demo/                  # FastAPI demo API + 5 CLI scenarios
│   ├── showroom/              # jurisdiction profiles (JSON)
│   └── leave-behind/          # PDF generation
├── infrastructure/dev-cluster-1/     # OpenShift k8s manifests
├── content/                   # Antora showroom content for RHDPS
├── scripts/                   # preflight, verify, pipeline, proof writers
└── site.yml                   # Antora playbook for local preview
```

## Hardware

Developed and tested on:
- **dev-cluster-1** — Intel Xeon 6767P, 128 cores, 503 GiB RAM, TDX enabled
- **Mac** — simulation mode (no TDX, no real attestation)

## License

Apache 2.0

## Attribution

- **Red Hat** — OpenShift AI, Praxis, OPA integration
- **Intel** — TDX, Intel Trust Authority, Xeon hardware
- **IBM Research** — Granite models, ContextForge, SDG Hub
- **Open Source** — are-immutable-ledger, vLLM Semantic Router, OpenVINO Model Server
