# Provable Sovereign AI

## A Reference Architecture for Owned, Governed, and Verifiable AI

Sovereign AI is often described as a place where inference runs. That definition is too small for real procurement, public-sector use, regulated enterprise deployment, or national AI strategy. A model can run inside a jurisdiction and still depend on a vendor-controlled platform, opaque model lineage, foreign-hosted tools, uninspected agent behavior, or unverifiable governance claims.

This paper defines sovereign AI as an operating capability:

1. Possess the model, data, policies, and runtime dependencies.
2. Run the system on infrastructure controlled by the operator or jurisdiction.
3. Adapt the model with documented data, methods, and evaluation gates.
4. Govern model, data, and agent behavior through enforceable policy.
5. Prove the state of the system with cryptographic, policy, and ledger evidence.

The Sovereign AI Lab implements that capability as a demo-ready reference stack using Intel TDX, OpenShift AI, Granite open-weight models, Open Policy Agent, a semantic router, gateway controls, and a tamper-evident ledger. The lab is designed for presentation, demonstration, and hands-on exercises. It is not a claim that every control is production-complete; rather, it shows how the required controls fit together and where simulated evidence must be replaced by production evidence.

## Why Sovereignty Became a Systems Problem

AI sovereignty is no longer only about where data is stored. Modern AI systems join compute, model weights, retrieval data, policy engines, tool gateways, agent identities, observability, and audit records. Any one of those layers can create dependency or jurisdiction risk.

The compute layer is especially concentrated. Epoch AI reported that, as of May 2025, the United States contained about three quarters of global GPU cluster performance, with China second at about 15 percent. That concentration does not make sovereign AI impossible, but it makes clear that sovereignty must be engineered deliberately rather than assumed from cloud region selection.

Regulatory pressure is moving in the same direction. The NIST AI Risk Management Framework emphasizes govern, map, measure, and manage functions for AI risk. The EU Artificial Intelligence Act establishes a risk-based regulatory structure for AI systems. Across regimes, the common pattern is evidence: who trained the model, what data was used, what risk class applies, what controls were enforced, and what proof exists after the system runs.

## The Sovereign AI Definition Used by This Lab

The lab treats sovereignty as a control plane, not a slogan.

| Capability | Question | Lab Evidence |
| --- | --- | --- |
| Possession | Can the operator hold and inspect the model and artifacts? | Open-weight Granite model references, AIBOM, registry metadata |
| Runtime control | Does inference run in controlled infrastructure? | Local vLLM path and OpenShift/dev-cluster-1 OVMS path |
| Data jurisdiction | Can policy deny disallowed movement or use? | OPA residency policies and jurisdiction profiles |
| Model provenance | Can the model lifecycle be explained and audited? | Ingest, synth, train, eval, AIBOM, promotion, registry artifacts |
| Agent governance | Can prompts and tool calls be classified and controlled? | Semantic router, SPIFFE-oriented policy model, Praxis, ContextForge, MCP |
| Proof | Can claims be independently checked after the fact? | TDX attestation, OPA decisions, ledger entries, chain verification |

## Reference Architecture

The lab is organized as seven layers.

### 1. Hardware Trust

Intel TDX provides the hardware-trust story for the dev-cluster-1 path. In a production deployment, attestation should prove that the workload is running inside an expected trust domain on expected hardware, with expected measurements. The lab can also run in simulation mode, where attestation artifacts are representative rather than cryptographic production evidence.

### 2. Platform

OpenShift is the canonical guided-demo platform. The local Docker Compose path is useful for development and dry runs, but the presentation-grade path is `make deploy-cluster`. OpenShift provides namespace isolation, service wiring, persistent storage, routes, and a realistic path to confidential container operations.

### 3. Models

The model lifecycle creates and records:

- jurisdiction-local source documents
- synthetic QA output
- training output metadata
- evaluation results
- an AI Bill of Materials
- a promotion decision
- a registry entry

The AIBOM is the model's supply-chain artifact. It documents base model identity, license, adaptation method, training data source, jurisdiction, evaluation gates, and a provenance hash.

### 4. Data Governance

OPA policies implement deny-by-default governance. The lab includes jurisdiction profiles for EU, Gulf, Southeast Asia, enterprise, and individual perspectives. The point is not that one policy file can represent every jurisdiction. The point is that residency and use rules become executable controls rather than slideware.

### 5. Proof Chain

The ledger provides tamper-evident proof of lifecycle and governance events. The lab records representative events such as ingestion completion, synthetic data generation, training completion, evaluation completion, AIBOM registration, model promotion, and policy decisions. The final proof is not any single event. It is the chain that connects model origin, runtime control, policy enforcement, and user-visible behavior.

### 6. Agent Control

The semantic router classifies prompts and routes requests. The local path points to vLLM at `/v1/chat/completions`; the OpenShift path points to OpenVINO Model Server at `/v3/chat/completions`. This distinction matters because demo failures often come from mixing local and cluster inference APIs.

### 7. Gateway

Praxis and ContextForge represent gateway control and federation. MCP tools are treated as governed surfaces, not invisible side channels. A sovereign AI runtime must control model calls and tool calls because agent behavior can move data, trigger external systems, or bypass intended policy.

## Benchmark and Assurance Model

The project benchmark file is `model-lifecycle/eval/thresholds.json`. It now defines a project-wide gate set rather than a single MMLU score.

| Gate | Category | Metric | Direction | Demo Threshold |
| --- | --- | --- | --- | --- |
| `mmlu` | foundation quality | `acc` | min | 0.55 |
| `sovereign_policy_qa` | domain quality | `acc` | min | 0.80 |
| `data_residency_qa` | domain quality | `acc` | min | 0.85 |
| `prompt_injection_resistance` | security | `pass_rate` | min | 0.90 |
| `pii_routing_recall` | governance | `recall` | min | 0.95 |
| `aibom_completeness` | provenance | `score` | min | 1.00 |
| `ledger_proof_integrity` | proof chain | `pass_rate` | min | 1.00 |
| `semantic_router_latency_p95_ms` | runtime | `p95_ms` | max | 3000 |

This is intentionally broader than model quality alone. A sovereign AI gate must include model capability, policy behavior, security posture, provenance completeness, proof-chain integrity, and runtime viability.

In a production program, these gates should be replaced or extended with representative domain datasets, red-team suites, bias and fairness tests, robustness tests, jurisdiction-specific controls, real load testing, and independent reproducibility requirements. The lab benchmark outputs are demo fixtures unless the operator runs the full measurement harness with production datasets.

## Demo and Lab Walkthrough

The recommended demo sequence is:

1. Show the architecture and the claim: sovereign AI means owned, governed, and provable.
2. Deploy the OpenShift path with `NS=sovereign-ai-lab make deploy-cluster`.
3. Open the frontend route and walk through slides, demo, and lab.
4. Show attestation as either real TDX evidence or explicitly simulated evidence.
5. Open the AIBOM and show benchmark gates, provenance hash, and promotion decision.
6. Trigger routing and policy examples from the frontend.
7. Verify the ledger chain and explain why proof after the fact matters.
8. Use the jurisdiction lab to change the governing perspective.

The local simulation path remains useful:

```bash
make up
make pipeline
make verify
```

The local path is not the same as the OpenShift path. Local inference uses vLLM-compatible `/v1/chat/completions`. OpenShift inference uses OVMS `/v3/chat/completions`.

## What Is Real, Simulated, and Next

The lab is honest about the boundary between demonstration and production.

| Area | Demo State | Production Expectation |
| --- | --- | --- |
| TDX attestation | Real on compatible dev-cluster-1 hardware, simulated elsewhere | Hardware-backed quote verification and policy-bound measurements |
| Model training | Placeholder or pre-generated artifact path | Reproducible SFT or adaptation job with signed outputs |
| Benchmarks | Demo gate fixtures with schema support | Independent benchmark harness and audited datasets |
| Ledger | Tamper-evident event chain | Availability, backup, key management, retention, and external audit integration |
| Routes | Demo routes for frontend and API | TLS, auth, network policy, and environment-specific exposure rules |
| Gateway controls | Representative Praxis, ContextForge, MCP path | Complete tool inventory, identity, least privilege, and monitoring |
| Helm/RHDPS | Deferred | Packaged, repeatable deployment path |

## Production Hardening Path

The next phase should focus on repeatability and evidence quality:

1. Package the OpenShift deployment as Helm or Kustomize.
2. Replace demo benchmark fixtures with real benchmark runners and datasets.
3. Add signed artifact generation for AIBOM, promotion decisions, and registry entries.
4. Bind OPA policy decisions to attested workload identity.
5. Add network policy and route exposure profiles for demo, lab, and production modes.
6. Add CI that runs Python compile checks, frontend build and lint, compose config validation, shell syntax checks, and benchmark threshold checks.
7. Create an operator-facing runbook for incident response, benchmark refresh, policy updates, and ledger verification.

## Conclusion

Sovereign AI is not achieved by moving a model into a private subnet. It is achieved when an operator can own the model path, govern the runtime path, and prove the decision path.

The Sovereign AI Lab gives that story a working shape. It shows the audience where sovereignty lives in the stack: hardware trust, platform, models, data governance, proof chain, agent control, and gateway. It also gives practitioners a lab they can run, break, inspect, and extend.

The central message for a presentation or hands-on lab is simple: the future of governed AI will not be won by unverifiable assurances. It will be won by systems that can show their work.

## References

- Epoch AI, [The US hosts the majority of GPU cluster performance, followed by China](https://epoch.ai/data-insights/ai-supercomputers-performance-share-by-country)
- Epoch AI, [Trends in AI supercomputers](https://epoch.ai/publications/trends-in-ai-supercomputers)
- NIST, [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- European Union, [Regulation (EU) 2024/1689 Artificial Intelligence Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng)
