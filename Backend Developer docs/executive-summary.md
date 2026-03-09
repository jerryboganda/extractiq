# Executive Summary — MCQ Extraction Platform v2.0

## Document Purpose

This executive summary provides a high-level overview of the MCQ Extraction Web App project, its business context, technical implications, primary risks, and recommended immediate next actions. It is intended for stakeholders, engineering leads, and project sponsors.

---

## Project Overview

The MCQ Extraction Platform is a production-grade, multi-user web application designed to convert large PDF collections into reviewable, validated, LMS-ready structured data (primarily Multiple Choice Questions). The platform ingests PDF documents, applies OCR, Vision-Language Models (VLMs), and LLM-based extraction, validates results against strict anti-hallucination rules, routes uncertain records through human review, and exports clean datasets in industry-standard LMS formats.

**Document version analyzed:** Mega Master Plan v2.0 (Enhanced Edition), March 2026.

---

## Business Context

The global Intelligent Document Processing (IDP) market is projected to grow from $2.56B (2024) to $54.54B (2035). 63% of Fortune 250 companies already use IDP solutions. The platform targets the intersection of three converging trends:

1. Vision-Language Models reaching production maturity for document understanding.
2. Agentic AI orchestration moving from experimental to production-ready.
3. Growing demand for automated assessment content pipelines integrated with Learning Management Systems.

The product aims to evolve from a "PDF to MCQ JSON" tool into a broader document intelligence operations platform supporting extraction templates, configurable review workflows, analytics, cost intelligence, and multi-tenant workspaces.

---

## Primary Goals

| Priority | Goal |
|----------|------|
| P0 | Process large PDF batches safely and reliably via async background workers |
| P0 | Extract MCQs into a strict, evidence-backed JSON schema |
| P0 | Support multiple OCR, LLM, and VLM providers with abstraction layer |
| P0 | Minimize hallucination risk through tiered architecture (model, context, data) |
| P0 | Support human-in-the-loop review and correction workflow |
| P0 | Export LMS-ready datasets in QTI, SCORM, xAPI, and cmi5 formats |
| P1 | Provide cost intelligence with per-record attribution and budget guardrails |
| P1 | Support multiple workspaces and teams with RBAC |
| P1 | Provide analytics, quality scoring, and provider performance comparison |
| P2 | Implement semantic search and knowledge graph for question clustering |
| P2 | Support agentic document workflows for complex multi-step extraction |
| P2 | Enterprise features: SSO/SAML, tenant branding, private deployment |

---

## Target Users and Stakeholders

| Role | Primary Responsibility |
|------|----------------------|
| Super Admin | Global settings, billing, provider pools, secrets, workspace provisioning |
| Workspace Admin | Workspace configuration, project creation, provider profiles, export templates |
| Operator | Upload PDFs, launch extraction jobs, check statuses, resolve flags, export data |
| Reviewer / QA Specialist | Review uncertain records, edit extractions, approve/reject, side-by-side comparison |
| Analyst | View trends, quality metrics, provider comparison, cost analytics, hallucination rates |
| API / Integration User | Programmatic job triggering, export consumption, LMS sync, webhook reception |

---

## Core Capabilities

1. **Multi-source PDF ingestion** — drag-and-drop, folder upload, cloud drive import, URL ingestion, zip archives.
2. **Intelligent preprocessing** — page classification, text-layer detection, visual complexity scoring, language detection, OCR vs VLM routing decisions.
3. **Dual extraction pathway** — traditional OCR+LLM pipeline and direct VLM document understanding, with conditional routing per page.
4. **Provider abstraction** — swap OCR, LLM, VLM, parser, and embedding providers without pipeline changes. Supports 15+ providers.
5. **Tiered anti-hallucination** — model-tier (structured output, low temperature), context-tier (source excerpt validation, entity consistency), data-tier (golden dataset comparison, hallucination registry).
6. **Multi-layer validation** — schema, field, business rule, evidence sufficiency, semantic duplicate detection.
7. **Human review workflow** — confidence-based work queues, side-by-side source comparison, keyboard shortcuts, inline editing, audit trail.
8. **LMS-standard export** — QTI 2.1/3.0, SCORM 1.2/2004, xAPI, cmi5, plus JSON/JSONL/CSV.
9. **Cost intelligence** — per-record cost tracking, per-provider ROI, budget alerts, pathway cost comparison.
10. **Observability** — structured JSON logging, OpenTelemetry traces, queue health, provider health, alerting.

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query/Table, Zustand, Recharts, cmdk |
| Backend | Node.js, Express, TypeScript, Zod, Drizzle ORM |
| Queue/Workers | BullMQ, Redis |
| Database | PostgreSQL (pg_trgm, pgvector), optional Neo4j/Apache AGE |
| Storage | S3-compatible object storage |
| Infrastructure | Docker, Docker Compose, Turborepo monorepo, Nginx/Caddy, OpenTelemetry |
| AI Providers | OpenAI, Anthropic, Google, Mistral, DeepSeek, Qwen, LLaMA, Google Document AI, Azure AI, AWS Textract |
| Testing | Vitest, Playwright, ESLint, Prettier |

---

## Major Technical Implications

1. **Cross-language bridge required.** Document parsing tools (PyMuPDF, LlamaParse, PaddleOCR) are Python-based, but the backend is Node.js. This requires either a Python microservice, subprocess calls, or WASM bindings. This is not addressed in the planning document and is a significant architectural decision.

2. **Multi-provider orchestration complexity.** Supporting 15+ AI providers across 6 categories (OCR, Document AI, LLM, VLM, Parser, Embedding) with fallback chains, A/B testing, rate limiting, and circuit breakers introduces substantial integration complexity.

3. **Job state machine is complex.** The pipeline has 17+ states with conditional branching (OCR vs VLM pathway), retry logic, dead-letter queues, and human-in-the-loop checkpoints. This requires careful state machine design and extensive testing.

4. **LMS export standards are specification-heavy.** QTI, SCORM, xAPI, and cmi5 each have detailed XML/JSON schemas, packaging requirements, and compliance standards. Implementing them correctly requires deep domain expertise.

5. **VLM cost management.** Single high-resolution page images consume 2,000–3,000 text-equivalent tokens. At scale, VLM costs can dominate the cost structure. Cost intelligence and pathway routing must be robust from Phase 2.

6. **Multi-tenant data isolation.** Workspace-level data isolation across PostgreSQL, object storage, Redis queues, and provider configurations requires careful architectural enforcement.

---

## Delivery Implications

The roadmap defines 4 phases across 21+ weeks:

| Phase | Scope | Weeks |
|-------|-------|-------|
| Phase 0 — Foundation | Monorepo, auth, DB, storage, queue, provider framework | 1–3 |
| Phase 1 — MVP Core | Upload, OCR, LLM extraction, validation, review, JSON export | 4–8 |
| Phase 2 — VLM & Quality | VLM pathway, hallucination detection, cost tracking, QTI export | 9–14 |
| Phase 3 — LMS & Scale | SCORM/xAPI/cmi5, multi-workspace, semantic search, A/B testing | 15–20 |
| Phase 4 — Enterprise | SSO, agentic workflows, knowledge graph, policy engine | 21+ |

**Critical path:** Phase 0 → Phase 1 is the tightest dependency chain. The MVP cannot begin until auth, DB schema, queue infrastructure, and provider abstractions are in place.

---

## Top Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Python-to-Node bridge for document parsers is unspecified | High | Decide on microservice vs subprocess approach in Phase 0 |
| R2 | Provider rate limits cause pipeline stalls at scale | High | Implement circuit breakers and backpressure from Phase 1 |
| R3 | QTI/SCORM compliance requires deep LMS domain expertise | Medium | Engage LMS integration specialist or validate against reference LMS early |
| R4 | VLM costs at scale may exceed budget expectations | Medium | Implement cost projection during preprocessing; build guardrails in Phase 2 |
| R5 | Team size and skillset not defined — timeline may be unrealistic | High | Validate roadmap against actual team capacity before committing |
| R6 | Agentic orchestrator design is vague | Medium | Defer detailed design to Phase 4; avoid premature abstraction |
| R7 | Knowledge graph approach undecided (Neo4j vs pg_trgm vs Apache AGE) | Low | Start with pg_trgm + pgvector; evaluate Neo4j later if needed |
| R8 | No defined SLAs for job processing or review turnaround | Medium | Define NFR targets before Phase 1 begins |

---

## Top Assumptions

1. The team has access to all listed AI provider APIs and can secure necessary API keys and billing accounts.
2. PostgreSQL with pgvector and pg_trgm extensions is sufficient for MVP semantic and search features without Neo4j.
3. The primary deployment target is cloud-based (AWS/GCP/Azure) with Docker, not bare-metal or serverless.
4. A Python microservice or subprocess bridge will be used for document parsing tools.
5. The MVP will be deployed behind a reverse proxy with TLS termination.
6. File uploads will be capped at a configurable maximum (e.g., 200MB per file) for the MVP.
7. The initial user base is small enough that a single PostgreSQL instance and a small Redis cluster are sufficient.
8. LMS export compliance will be validated against at least one reference LMS (e.g., Moodle for QTI, SCORM Cloud for SCORM).

---

## Recommended Immediate Next Actions

1. **Confirm team composition and capacity** — validate whether the 21+ week roadmap is achievable with available resources.
2. **Decide on the Python integration strategy** — microservice, subprocess, or alternative Node.js-native libraries for document parsing.
3. **Set up the Turborepo monorepo scaffold** with all package stubs, CI basics, and shared configuration.
4. **Define the PostgreSQL schema v1** using Drizzle ORM with migrations for all Phase 0/1 entities.
5. **Build the provider abstraction interface** and implement adapters for 1 OCR and 1 LLM provider.
6. **Select and validate QTI reference implementation** — ensure exported QTI packages import correctly into at least one major LMS.
7. **Define NFR targets** (response time budgets, concurrent user targets, job throughput goals) before Sprint 1.
8. **Establish golden dataset** — curate 20–50 benchmark PDFs with known correct extraction results for regression testing.
9. **Set up local development environment** — Docker Compose stack with all services running locally.
10. **Create OpenAPI contract draft** for Phase 1 API endpoints to enable parallel frontend/backend development.
