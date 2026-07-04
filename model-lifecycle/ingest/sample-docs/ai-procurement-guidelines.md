# Government AI Procurement Guidelines

## 1. Purpose

These guidelines establish the requirements for the procurement of artificial intelligence systems by government agencies within this jurisdiction. All AI systems acquired, developed, or deployed by government entities must comply with these guidelines, regardless of whether the system is procured from a commercial vendor, developed in-house, or obtained through open-source channels.

## 2. Model Evaluation Requirements

Before any AI model is deployed in a government context, it must undergo a formal evaluation that includes the following:

**Performance benchmarks.** The model must demonstrate acceptable performance on standardized benchmarks relevant to its intended use case. Minimum performance thresholds must be defined before evaluation begins, and the model must meet or exceed all thresholds. Results must be independently reproducible.

**Provenance documentation.** The procuring agency must obtain and verify an AI Bill of Materials (AIBOM) for any model under consideration. The AIBOM must document: the base model identity and license, all training data sources and their geographic origin, the fine-tuning methodology, the computational environment used for training, and all evaluation results. Models without a verifiable AIBOM are not eligible for government procurement.

**Security assessment.** The model must undergo adversarial testing for prompt injection, data extraction, and jailbreak attacks. The testing methodology must be documented, and the model must demonstrate resistance to all categories of attack above a defined threshold.

## 3. Bias Assessment

All AI models considered for government deployment must undergo a formal bias assessment. The assessment must evaluate the model's outputs across demographic categories relevant to the model's intended use case, including but not limited to: age, gender, ethnicity, language, disability status, and geographic location.

The bias assessment must produce a written report that includes the methodology used, the datasets employed for testing, the metrics applied, and the results. Models that demonstrate statistically significant bias on any protected dimension must not be deployed until the bias has been mitigated and the model has been re-evaluated.

## 4. Explainability Standards

Government AI systems that make or materially influence decisions affecting citizens must be able to provide explanations for their outputs. The level of explainability required depends on the impact of the decision:

**High-impact decisions** (affecting legal rights, benefits, or law enforcement) require full traceability from input to output, including the ability to identify which training data and model parameters contributed to the output.

**Medium-impact decisions** (affecting resource allocation, service prioritization, or administrative processes) require the ability to provide a natural-language explanation of the key factors that influenced the output.

**Low-impact decisions** (informational, advisory, or statistical) require documentation of the model's general decision-making process and known limitations.

## 5. Vendor Assessment

When procuring AI systems from commercial vendors, the procuring agency must evaluate:

**Data sovereignty.** Whether the vendor's model training, fine-tuning, and inference can occur entirely within this jurisdiction. Vendors that cannot guarantee in-jurisdiction processing for Tier 3 data are not eligible for contracts involving sensitive data.

**Model access.** Whether the procuring agency receives access to model weights, training methodology documentation, and evaluation results. API-only access without model weight access is acceptable only for low-impact use cases.

**Continuity.** Whether the procuring agency can continue to operate the AI system if the vendor relationship is terminated. Systems that depend entirely on vendor-hosted infrastructure without a viable self-hosting path receive a risk penalty in evaluation scoring.

## 6. Ongoing Monitoring

Deployed AI systems must be monitored for performance degradation, distribution drift, and emergent bias. Monitoring reports must be produced quarterly and submitted to the national AI oversight body. Any performance degradation below the original acceptance thresholds must trigger a re-evaluation before continued use.

---

*This document is a synthetic policy created for demonstration purposes. It does not represent the guidelines of any real jurisdiction.*
