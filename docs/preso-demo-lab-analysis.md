# Sovereign AI Lab: Presentation, Demo, and Lab Analysis

**Note:** This analysis was generated against commit 89c5b0c. Several findings have been addressed in subsequent commits. See git log for current state.

Repository analyzed: `sovereign-ai-lab/sovereign-ai-lab`
Checkout: `89c5b0c` on `main`
Submodules initialized:

- `ledger/are-immutable-ledger`: `a1b70fb`
- `gateway/praxis`: `8cd1059`
- `gateway/contextforge`: `01278c4`

## Executive Readout

This repo is a strong concept demo for "provable AI sovereignty": not just running a model locally, but proving hardware trust, model provenance, policy enforcement, governed routing, local data tools, and tamper-evident evidence.

The narrative is presentation-ready. The interactive frontend builds. The lab guide is coherent and already maps well to a hands-on workshop. The implementation is not yet turnkey from a fresh clone or for RHDPS/AgnosticV deployment. The main risks are deployment wiring, endpoint/name drift, missing local gateway compose, missing Helm chart, and some stale docs/commands.

Recommended positioning:

- Use it now as a guided demo with a known-good environment.
- Use it as a lab after fixing deployment automation and deep-link/doc drift.
- Do not present it as a production-ready reference architecture without explicitly naming the simulated/placeholder parts.

## Core Story

Suggested one-line thesis:

> Sovereign AI is not a location claim. It is an ownership, control, governance, and proof claim.

The repo demonstrates five verbs that work well in a talk:

- Possess: open-weight Granite model artifacts and AIBOM.
- Run: model serving on controlled infrastructure, with Intel TDX as the hardware-trust layer.
- Adapt: model lifecycle pipeline built around jurisdiction-local documents and synthetic QA.
- Govern: OPA policies, semantic routing, agent identity checks, and MCP tool control.
- Prove: every governance decision lands in a tamper-evident ledger.

The project is strongest when framed around the proof chain. The ledger is the connective tissue that turns separate technical controls into a single evidence story.

## Architecture Summary

| Layer | Repo surface | Demo purpose |
| --- | --- | --- |
| Hardware Trust | `infra/tdx/` | TDX trust domain creation and attestation, real when hardware and Intel Trust Authority are available, simulated otherwise. |
| Platform | `infrastructure/dev-cluster-1/`, `agnosticv/` | OpenShift deployment story for a tenant lab environment. |
| Models | `model-lifecycle/` | Ingest docs, generate synthetic QA, placeholder train/eval, create AIBOM, promote model, register model. |
| Data Governance | `infra/opa/policies/` | Deny-by-default data residency, model promotion, model access, and agent lifecycle policies. |
| Proof Chain | `ledger/are-immutable-ledger` plus `ledger/gateway.Dockerfile` | Hash-chained event store and REST gateway for demo integration. |
| Agent Control | `inference/semantic-router/` | Demo semantic classifier for sensitive data, prompt injection, and general routing. |
| Gateway | `gateway/config/`, `gateway/mcp-servers/sovereign-data/` | Praxis/ContextForge concept plus local MCP tools over jurisdiction documents. |
| Experience | `experience/frontend/`, `experience/demo/`, `content/` | React presentation/demo/lab UI, FastAPI integration, CLI scenarios, Antora lab guide. |

## Presentation Arc

The frontend already has a usable talk flow:

1. Sovereignty gap: global AI compute concentration.
2. API dependency as sovereignty decision.
3. Open weights argument.
4. Sovereignty means "you can prove it is yours."
5. Seven-layer stack reveal.
6. Live proof acts: stack, compute, model, agents, policies, proof chain.
7. Jurisdiction lab.

The external compute-share claim should be cited carefully. Epoch AI supports the high-level claim that the US had about three-quarters of tracked GPU cluster performance as of May 2025, and GeoCoded carries the 74.5 percent US, 14.1 percent China, 4.8 percent EU split used in the app. Mention the data coverage caveat: these datasets cover publicly tracked clusters and are not a complete census.

Sources to cite in slides:

- Epoch AI: https://epoch.ai/data-insights/ai-supercomputers-performance-share-by-country
- Epoch GPU clusters dataset: https://epoch.ai/data/gpu-clusters
- GeoCoded 2025 report: https://www.sanchez.vc/geocoded-special-reports/state-of-global-ai-compute-2025-edition

## Demo Flow

Best guided demo sequence:

1. Open the frontend and start in presentation mode.
2. Click through the story until the stack reveal.
3. Act 1, "The Stack": explain seven layers as proof-generating controls.
4. Act 2, "Your Compute": show attestation summary and state whether it is real TDX or simulated.
5. Act 3, "Your Model": show AIBOM, base model, training data source, evaluation score, and promotion decision.
6. Act 4, "Your Agents": run three prompts: sensitive data, general, injection attempt.
7. Act 5, "Your Policies": run OPA allow/deny examples.
8. Act 6, "Your Proof": verify the chain, then show writers and entry counts.
9. Enter the jurisdiction lab and let the audience pick EU, Gulf, Southeast Asia, Enterprise, or Individual.

Recommended talk track:

- "This is not a chatbot demo. The model response is the least interesting part."
- "Every control produces evidence."
- "The root of trust starts at hardware, but the proof becomes useful only when platform, model, data, policy, and agent decisions are chained together."
- "Simulation mode is still useful for lab mechanics; real TDX changes the attestation source, not the flow."

## Lab Design

The Antora content is already structured as a strong lab:

- Required path:
  - `01-setup.adoc`
  - `02-attestation.adoc`
  - `03-model-provenance.adoc`
  - `04-inference-routing.adoc`
- Choose-your-path:
  - `05-policy-enforcement.adoc`
  - `explore-jurisdiction.adoc`
  - `explore-mcp-tools.adoc`
  - `explore-proof-chain.adoc`
- Wrap-up:
  - `architecture.adoc`
  - `99-conclusion.adoc`

Recommended timing:

| Format | Duration | Path |
| --- | ---: | --- |
| Conference preso | 20-30 min | Slides plus 3 live acts: attestation, routing, proof chain. |
| Executive demo | 30-45 min | Full frontend act sequence plus one jurisdiction profile. |
| Technical lab | 75-90 min | Setup, attestation, AIBOM, routing, policy, proof-chain deep dive. |
| Half-day lab | 3-4 hr | Full Antora path plus deployment/debugging appendix. |

## What Works Well

- The story is coherent and differentiated: "sovereignty means provability" is much stronger than "we run a model locally."
- The proof chain gives the audience a concrete artifact to inspect.
- The OPA policies are simple enough to explain, but real enough for hands-on testing.
- The FastAPI facade gives the UI one clean integration layer.
- The frontend production build succeeds.
- Python lab-owned scripts compile.
- The jurisdiction personas make the lab relevant to different audiences.
- The Antora modules are already close to a workshop-ready shape.

## Verification Performed

Passed:

- `git submodule update --init --recursive`
- `python -m compileall` for lab-owned Python scripts
- `npm ci` in `experience/frontend`
- `npm run build` in `experience/frontend`
- `docker compose -f docker-compose.infra.yml config`

Failed or not ready:

- `npm run lint` fails with two lint errors:
  - `experience/frontend/src/App.tsx`: ternary expression used as a statement in click handler.
  - `experience/frontend/src/hooks/useProfile.ts`: React hooks lint flags synchronous `setLoading(true)` inside an effect.
- `docker compose -f docker-compose.gateway.yml config` fails because `docker-compose.gateway.yml` does not exist.

Not run:

- Full `make up-infra`; it would pull/build heavyweight containers and requires model artifacts that are absent in the fresh clone.
- OPA policy tests; no local `opa` binary was installed. Docker-based OPA tests are possible.
- OpenShift deployment; no cluster context was used.
- End-to-end verification scripts; they require the full stack running.

## Readiness Risks

### 1. Local gateway compose is missing

`Makefile` has `up-gateway` and `down-gateway` targets that reference `docker-compose.gateway.yml`, and `README.md` documents that file, but it is absent.

Impact: a fresh clone cannot run the documented local gateway path.

### 2. `make up` and `make verify` are documented but not implemented

The README and lab conclusion use `make verify` and/or `make up`, but the Makefile exposes `verify-infra`, `verify-gateway`, and `verify-experience`, with no aggregate `verify` or `up`.

Impact: workshop participants will hit immediate command failures.

### 3. Fresh local clone lacks model artifacts

`docker-compose.infra.yml` mounts `./inference/models`, and `scripts/preflight-infra.sh` expects `inference/models/granite-3.2-3b-instruct-q4`, but the repo does not contain `inference/models`.

Impact: local inference startup/preflight is not fresh-clone ready.

### 4. Semantic router local backend is miswired

`docker-compose.infra.yml` sets only `SR_CONFIG=/config/policy.yaml`. The router implementation does not read `SR_CONFIG`; it falls back to `http://localhost:8080/v3/chat/completions` inside the router container.

Impact: local routing will likely fail unless `SR_BACKEND` is explicitly set, likely to `http://vllm:8000/v1/chat/completions` for vLLM or to the OVMS `/v3` endpoint if using OVMS.

### 5. vLLM/OVMS and `/v1`/`/v3` endpoint drift

The local compose uses `vllm/vllm-openai`, while README and OpenShift manifests emphasize OVMS. Verification code calls `/v3/chat/completions`; vLLM OpenAI-compatible servers commonly expose `/v1/chat/completions`, while OVMS can expose `/v3`.

Impact: demo operators need a single declared local serving mode.

### 6. OpenShift deployment script has name drift and incomplete apply coverage

`infrastructure/dev-cluster-1/deploy.sh` waits for `convert-sovereign-granite-3b`, but the job manifest is named `convert-sovereign-granite`. It also waits for deployment/service names with `-3b`, while manifests use `ovms-sovereign-granite`.

The script applies namespace, storage, postgres, ledger, ledger-gateway, OPA, conversion job, OVMS, and semantic router. It does not apply the existing `praxis`, `contextforge`, `mcp-server`, `demo-api`, or `frontend` manifests, nor does it create their required ConfigMaps or OpenShift Routes.

Impact: `make deploy-cluster` does not currently match the README claim that it deploys all services.

### 7. Helm chart is missing

AgnosticV targets `infrastructure/helm`, and `docs/infra01-deployment-blockers.md` already identifies this as a high-priority blocker.

Impact: RHDPS tenant deployment is blocked until a Helm chart or compatible make target exists.

### 8. Frontend deep links are misleading

`main.tsx` wraps the app in `BrowserRouter`, and there are route page components under `src/pages`, but `App.tsx` does not define `Routes`. The active experience is an internal state machine: slides -> demo -> lab.

Impact: `/presentation`, `/demo`, `/showroom`, and `/leave-behind` can return HTTP 200 via SPA fallback but still render the default app entry state, not necessarily the named page.

### 9. Verification scripts include optimistic placeholders

`scripts/verify-experience.py` has a check named "npm run build succeeded" that is `lambda: True`, so it does not actually run the build. Some model lifecycle steps fall back to placeholder training/eval artifacts.

Impact: green checks may overstate readiness unless the operator knows what was simulated.

### 10. Deployment security needs demo/prod separation

OpenShift manifests use several `latest` images and demo secrets in plain YAML, especially ContextForge auth/JWT/encryption values.

Impact: fine for a controlled demo, but not acceptable as a production reference without pinning images and moving secrets to Kubernetes Secrets or platform secret management.

## Recommended Fix Plan

### Before a live preso

1. Decide the blessed demo mode:
   - OpenShift/dev-cluster-1 known-good environment, or
   - local compose simulation.
2. Write a one-page operator runbook with exact URLs, credentials, and reset commands.
3. Add visible labels for real TDX vs simulated attestation.
4. Fix frontend lint errors.
5. Validate the exact three demo prompts and expected outputs.
6. Pre-seed the ledger with platform, data governance, agent registration, model, and routing entries.

### Before a hands-on lab

1. Add `make up`, `make verify`, and `make down` aggregate targets.
2. Either add `docker-compose.gateway.yml` or remove/rename gateway targets and docs.
3. Make the local semantic router backend explicit.
4. Add a lightweight no-model demo mode or documented model download/seed path.
5. Turn `verify-experience.py` into a real build and endpoint smoke test.
6. Add a `make test-policies` target using Docker OPA if `opa` is not installed.
7. Fix frontend deep linking or remove unused route page components.
8. Make the Antora commands match the actual Makefile.

### Before RHDPS/AgnosticV

1. Build `infrastructure/helm` with values for namespace, image tags, model serving mode, TDX mode, resources, and routes.
2. Create ConfigMaps/Secrets for:
   - OPA policies
   - Postgres init SQL
   - Praxis config
   - jurisdiction profiles
   - model/AIBOM/promotion artifacts
   - sample documents
3. Decide model serving strategy:
   - per-tenant OVMS for full sovereignty story,
   - shared cluster OVMS for resource efficiency,
   - LiteLLM/prod-cluster-1 only if sovereignty caveat is acceptable.
4. Fix OpenShift name drift in `deploy.sh`.
5. Add route manifests or Helm templates for frontend, demo API, ledger gateway, and OPA where appropriate.
6. Pin all images by digest or immutable version tag.
7. Replace demo secrets with generated or platform-managed secrets.

## Suggested Demo Script

### 30-minute version

| Minute | Segment | Action |
| ---: | --- | --- |
| 0-3 | Problem | Compute concentration, API dependency, sovereignty gap. |
| 3-7 | Thesis | Sovereignty = possess, run, adapt, govern, prove. |
| 7-12 | Stack | Reveal seven layers and explain proof-producing controls. |
| 12-17 | Attestation + AIBOM | Show hardware trust and model provenance. |
| 17-22 | Routing + policy | Sensitive/general/injection prompts; OPA allow/deny. |
| 22-27 | Proof chain | Verify ledger, show writers, explain tamper evidence. |
| 27-30 | Lab handoff | Pick jurisdiction, invite audience into hands-on path. |

### 90-minute lab

| Segment | Duration | Output |
| --- | ---: | --- |
| Setup and health | 10 min | Participant confirms endpoints and chain validity. |
| Hardware trust | 10 min | Attestation event exists in ledger. |
| Model provenance | 15 min | Participant reads AIBOM and promotion proof. |
| Inference routing | 15 min | Three prompts generate routing/proof entries. |
| Policy enforcement | 15 min | Participant tests allow/deny OPA decisions. |
| Jurisdiction profile | 10 min | Participant compares EU/Gulf/SE Asia posture. |
| Proof-chain deep dive | 15 min | Participant maps entries by writer/layer and verifies chain. |

## Open Questions

- Is the canonical repo intended to be `sovereign-ai-lab/sovereign-ai-lab` or `example/sovereign-ai-lab`? Docs currently use `rhpds`.
- Is the canonical model 2B or 3B? The repo references both Granite 3.2 2B and 3B.
- Is local serving supposed to use vLLM, OVMS, or both?
- Should the lab be able to run without TDX and without real model serving, using a fully simulated "workshop mode"?
- Should the presentation be URL-routable (`/presentation`, `/demo`, `/lab`) or only state-machine driven?
- For RHDPS, is the target per-tenant model serving, shared model serving, or prod-cluster-1/LiteLLM?

## Bottom Line

This is a high-potential preso/demo/lab with a clear, memorable point of view: sovereignty must be provable. The materials and UI are close enough to be valuable now in a curated environment. The repo needs a deployment hardening pass before it can support self-service labs or RHDPS tenant provisioning.

The most important next move is not more features. It is choosing one blessed runtime path and making every doc, Make target, endpoint, manifest, and verification script tell the same story.
