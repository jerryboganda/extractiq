# Requirements Analysis — MCQ Extraction Platform v2.0

## Document Purpose

This document provides a comprehensive requirements analysis derived from the Mega Master Plan v2.0. It decomposes business objectives, stakeholder needs, functional requirements, non-functional requirements, and identifies gaps, ambiguities, and risks. Requirements are assigned traceable IDs for downstream use in architecture, testing, and delivery planning.

---

## 1. Project Purpose

Build a production-grade, multi-user, provider-agnostic web application that converts large PDF collections into reviewable, validated, LMS-ready structured MCQ data. The platform must support multiple extraction pathways (OCR+LLM, VLM direct), enforce evidence-only extraction with tiered anti-hallucination controls, enable human-in-the-loop review, and export in industry-standard LMS formats.

---

## 2. Problem Statement

Educational institutions, assessment providers, and content publishers hold large volumes of MCQ content in PDF format. Manually digitizing this content is labor-intensive, error-prone, and unscalable. Existing OCR+LLM solutions struggle with visually complex documents (tables, diagrams, formulas), lack structured validation, and produce hallucinated content without detection. There is no widely available platform that combines multi-provider extraction, tiered hallucination controls, human review workflows, and LMS-standard export in a single integrated product.

**Source Basis:** Section 1 (Executive Summary), Section 2 (Product Vision), Section 2.3 (Market Context).
**Confidence:** High — the problem statement is strongly implied throughout the document.

---

## 3. Business Objectives

| ID | Objective | Source |
|----|-----------|--------|
| BR-001 | Enable high-volume PDF batch processing with reliable MCQ extraction | Section 4.1, Principle 4 |
| BR-002 | Minimize hallucination risk through systematic tiered controls | Section 4.1, Section 11 |
| BR-003 | Support human-in-the-loop review for quality assurance | Section 4.1, Principle 3 |
| BR-004 | Export Clean LMS-ready data in industry standards (QTI, SCORM, xAPI, cmi5) | Section 4.1, Section 10.13 |
| BR-005 | Support multi-provider vendor flexibility (OCR, LLM, VLM) | Section 4.1, Principle 5 |
| BR-006 | Provide operational cost visibility and budget controls | Section 4.2, Section 30 |
| BR-007 | Enable multi-workspace team collaboration with RBAC | Section 4.2, Section 6 |
| BR-008 | Provide analytics and quality scoring for continuous improvement | Section 4.2, Section 10.14 |
| BR-009 | Evolve platform toward broader document intelligence operations | Section 2.2 |
| BR-010 | Position product at intersection of IDP market growth, VLM maturity, and agentic AI | Section 2.3 |

---

## 4. Stakeholder Analysis

| Stakeholder | Interest | Influence | Key Concerns |
|-------------|----------|-----------|--------------|
| Product Owner / Sponsor | Product-market fit, ROI, competitive positioning | High | Time to MVP, feature completeness, cost efficiency |
| Engineering Team | Implementability, maintainability, clear specifications | High | Architecture clarity, scope creep, tech debt |
| Operators (end users) | Upload ease, job reliability, clear status feedback | Medium | UI responsiveness, error recovery, bulk operations |
| Reviewers / QA | Fast review workflow, accurate source comparison | Medium | Keyboard shortcuts, side-by-side view, audit trail |
| Analysts | Actionable metrics, trend visibility | Low-Medium | Dashboard completeness, export of analytics |
| LMS Administrators | Import compatibility, standard compliance | Low | QTI/SCORM correctness, metadata completeness |
| API Consumers | Stable contracts, authentication, webhooks | Low-Medium | API documentation, versioning, reliability |

---

## 5. User Needs

### 5.1 Operator Needs
- Upload hundreds of PDFs at once with progress indicators.
- Launch extraction jobs and monitor real-time progress.
- See clear status of every document across the pipeline.
- Resolve flagged items or delegate to reviewers.
- Export approved records in desired format.
- Understand estimated cost before launching large jobs.

### 5.2 Reviewer Needs
- Quickly assess flagged records with side-by-side source comparison.
- Edit, approve, or reject records with keyboard shortcuts.
- See similar records for consistency checking.
- Track review progress and SLA metrics.
- Add notes and comments per record.

### 5.3 Admin Needs
- Configure provider API keys securely.
- Set extraction profiles per project.
- Manage team members with role assignments.
- Set quality thresholds and review policies.
- Monitor system health and provider status.
- Control costs with budget limits and alerts.

### 5.4 Analyst Needs
- View extraction quality trends over time.
- Compare provider performance and cost.
- Monitor hallucination detection rates.
- Track review productivity and backlog aging.

---

## 6. Scope

### 6.1 In Scope

- Multi-user web application with RBAC.
- PDF upload, preprocessing, page rendering.
- OCR integration with multiple providers.
- VLM-based document understanding pathway (Phase 2+).
- LLM-based structured MCQ extraction.
- Tiered validation engine.
- Tiered hallucination detection and mitigation.
- Human review queue with inline editing.
- Export in JSON, JSONL, CSV, QTI, SCORM, xAPI, cmi5.
- Provider configuration and health monitoring.
- Cost tracking and attribution.
- Analytics and reporting dashboards.
- Notification system (in-app, email).
- Background job processing with BullMQ.
- Object storage for PDFs, images, artifacts.
- Semantic search and duplicate detection (Phase 3+).
- Agentic workflow orchestration (Phase 4+).

### 6.2 Out of Scope (Explicit)

- Guaranteeing perfect model accuracy (Section 4.3).
- Replacing human review for ambiguous visual content (Section 4.3).
- Running large extraction workloads synchronously in the UI (Section 4.3).
- Coupling the platform to a single provider (Section 4.3).
- Building a general-purpose chatbot or conversational AI interface (Section 4.3).

### 6.3 Out of Scope (Inferred)

- Mobile application or mobile-responsive design (not mentioned).
- Real-time collaborative editing (not mentioned, distinct from review workflow).
- Built-in LMS hosting or learner-facing assessment delivery (export only).
- Payment processing or subscription billing (billing mentioned only for super admin context).
- Content authoring or question creation from scratch (extraction only).

---

## 7. Functional Requirements

### 7.1 Authentication and User Management

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-001 | Users must be able to sign in and sign out | Must | 0 |
| FR-002 | Super admins must be able to invite users with role assignment | Must | 0 |
| FR-003 | System must enforce RBAC with resource-level scoping | Must | 0 |
| FR-004 | Workspace membership and team management must be supported | Must | 1 |
| FR-005 | Session management with configurable security policies | Should | 1 |
| FR-006 | SSO support (SAML, OIDC) | Could | 4 |
| FR-007 | Audit log for critical authentication and admin actions | Must | 1 |
| FR-008 | IP allowlist for sessions (optional) | Could | 4 |

### 7.2 Workspace and Project Management

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-010 | Multiple workspaces with isolated data | Must | 1 |
| FR-011 | Projects per workspace with extraction profiles | Must | 1 |
| FR-012 | Document grouping via tags, labels, categories | Should | 1 |
| FR-013 | Retention settings and quality thresholds per project | Should | 2 |
| FR-014 | Project templates for common exam types | Could | 3 |

### 7.3 Provider Configuration

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-020 | Add API keys with encryption at rest (never exposed after creation) | Must | 0 |
| FR-021 | Test provider connections from the UI | Must | 0 |
| FR-022 | Choose default OCR, LLM, VLM providers per workspace/project | Must | 1 |
| FR-023 | Configure fallback chains for provider failure | Must | 1 |
| FR-024 | Routing policies: accuracy, cost, speed, balanced modes | Should | 2 |
| FR-025 | Provider health checks and usage dashboards | Should | 2 |
| FR-026 | Rate limit handling policies per provider | Should | 2 |
| FR-027 | VLM provider configuration with image resolution and token budget | Should | 2 |
| FR-028 | Provider A/B testing framework (shadow-mode comparison) | Could | 3 |
| FR-029 | Provider benchmarking harness | Could | 3 |

### 7.4 File Ingestion

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-030 | Drag-and-drop upload with folder upload support | Must | 1 |
| FR-031 | Multi-file upload with resumable uploads (tus protocol or presigned multipart) | Must | 1 |
| FR-032 | Upload progress indicators | Must | 1 |
| FR-033 | Duplicate detection via SHA-256 checksum | Must | 1 |
| FR-034 | Metadata extraction on upload (page count, file size, text layer detection) | Must | 1 |
| FR-035 | Document tags, notes, categories on upload | Should | 1 |
| FR-036 | MIME type validation and file size limits | Must | 1 |
| FR-037 | Cloud drive import (Google Drive, OneDrive, S3) | Could | 3 |
| FR-038 | URL-based PDF ingestion | Could | 3 |
| FR-039 | Zip archive auto-extraction | Could | 3 |

### 7.5 Preprocessing

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-040 | Page counting and text-layer detection per page | Must | 1 |
| FR-041 | Classify each page as text/scanned/mixed | Must | 1 |
| FR-042 | Render page images at configurable DPI | Must | 1 |
| FR-043 | Rotation detection and auto-correction | Should | 1 |
| FR-044 | OCR necessity prediction per page | Must | 1 |
| FR-045 | Page-type classification (question, answer-key, explanation, cover/index) | Should | 1 |
| FR-046 | Visual complexity scoring for VLM routing | Should | 2 |
| FR-047 | Language detection per page | Could | 2 |
| FR-048 | Routing decision output (OCR+LLM vs VLM per page) | Must | 2 |
| FR-049 | Estimated cost projection from preprocessing | Should | 2 |

### 7.6 OCR and Document AI

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-050 | Native text extraction via PyMuPDF/PyMuPDF4LLM | Must | 1 |
| FR-051 | OCR fallback for scanned/poor-quality pages | Must | 1 |
| FR-052 | Support multiple OCR providers (at least 2 at MVP) | Must | 1 |
| FR-053 | Store OCR confidence and artifacts per page | Must | 1 |
| FR-054 | Layout metadata preservation (bounding boxes, reading order) | Should | 2 |
| FR-055 | Hybrid OCR+VLM pipeline (route to VLM on low confidence) | Must | 2 |
| FR-056 | Table extraction with structured output | Should | 2 |
| FR-057 | Formula/equation detection for STEM content | Could | 3 |

### 7.7 Vision-Language Model (VLM) Extraction

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-060 | Render pages to images at optimal resolution for VLM input | Must | 2 |
| FR-061 | Send page images + extraction prompts to VLM providers | Must | 2 |
| FR-062 | Receive structured JSON output from VLMs | Must | 2 |
| FR-063 | Cross-reference VLM output with OCR text where available | Should | 2 |
| FR-064 | Support 2-3 VLM providers (GPT-4.1 Vision, Gemini 2.5 Pro, Claude Vision) | Must | 2 |
| FR-065 | Self-hosted VLM support (Qwen 2.5 VL, LLaMA 3.2 Vision) | Could | 4 |
| FR-066 | Configurable image resolution settings per project | Should | 2 |

### 7.8 Segmentation

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-070 | Identify MCQ boundaries from raw text or VLM output | Must | 1 |
| FR-071 | Detect question number, stem, options, answer references, explanations | Must | 1 |
| FR-072 | Support different option styles (A/B/C/D, a/b/c/d, 1/2/3/4, i/ii/iii/iv) | Must | 1 |
| FR-073 | Support page-spanning questions | Must | 1 |
| FR-074 | Support separate answer key pages | Must | 1 |
| FR-075 | Document template learning per project | Could | 3 |
| FR-076 | Two-column and multi-column layout detection | Should | 2 |

### 7.9 LLM Extraction

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-080 | Provider-agnostic structured extraction via adapter interface | Must | 1 |
| FR-081 | Prompt templates by question style and document type | Must | 1 |
| FR-082 | Schema-locked JSON output (structured output / function calling) | Must | 1 |
| FR-083 | Strict evidence-only extraction instructions in prompts | Must | 1 |
| FR-084 | Null for uncertain fields, flags for ambiguity | Must | 1 |
| FR-085 | Source excerpt required in every extraction output | Must | 1 |
| FR-086 | Provider metadata recording (model, latency, cost, token usage) | Must | 1 |
| FR-087 | Prompt versioning system with rollback support | Should | 2 |
| FR-088 | Extraction replay mode for debugging | Could | 3 |
| FR-089 | Provider A/B testing for extraction quality | Could | 3 |

### 7.10 Validation

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-090 | JSON schema validation via Zod schemas | Must | 1 |
| FR-091 | Field-level validation (non-empty question text, valid option labels, answer consistency) | Must | 1 |
| FR-092 | Business rule validation (min 2 options, source page present, non-trivial excerpt) | Must | 1 |
| FR-093 | Evidence sufficiency checks | Must | 1 |
| FR-094 | Exact and near-duplicate detection (trigram similarity) | Must | 1 |
| FR-095 | Export readiness scoring (composite 0–100) | Must | 1 |
| FR-096 | Semantic duplicate detection using embeddings | Should | 3 |
| FR-097 | Answer key mismatch analytics | Should | 2 |
| FR-098 | Policy engine for client-specific validation rules | Could | 4 |

### 7.11 Hallucination Detection

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-100 | Model-tier controls: structured output, low temperature, constrain max tokens | Must | 1 |
| FR-101 | Context-tier controls: source excerpt validation, entity consistency, sequential numbering | Must | 1 |
| FR-102 | Data-tier controls: golden dataset comparison, per-provider hallucination rates | Should | 2 |
| FR-103 | Consensus voting when multiple providers are configured | Should | 2 |
| FR-104 | Hallucination event tracking and registry | Should | 2 |
| FR-105 | Force review when hallucination risk tier is "high" | Must | 2 |

### 7.12 Review Queue

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-110 | Filter by flag type, severity, confidence | Must | 1 |
| FR-111 | Page preview side-by-side with extracted JSON | Must | 1 |
| FR-112 | Source excerpt comparison with highlighted matching | Should | 1 |
| FR-113 | Inline correction with audit history | Must | 1 |
| FR-114 | Approve / reject / edit / reprocess actions | Must | 1 |
| FR-115 | Bulk actions (approve all, reject batch, reprocess batch) | Must | 1 |
| FR-116 | Audit trail of every edit | Must | 1 |
| FR-117 | Keyboard shortcuts for all review actions | Must | 2 |
| FR-118 | Confidence-based work queues (highest-risk first) | Should | 2 |
| FR-119 | "Show similar records" helper | Should | 3 |
| FR-120 | Reviewer assignment and load balancing | Should | 3 |
| FR-121 | Second-review requirement for critical projects | Could | 3 |
| FR-122 | Reviewer productivity dashboard with SLA metrics | Should | 3 |

### 7.13 Export

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-130 | JSON/JSONL export | Must | 1 |
| FR-131 | CSV export with configurable column mapping | Should | 2 |
| FR-132 | QTI 2.1/3.0 export (assessmentItem with choiceInteraction) | Must | 2 |
| FR-133 | SCORM 1.2/2004 content package export | Should | 3 |
| FR-134 | xAPI statement template export | Should | 3 |
| FR-135 | cmi5 package export | Could | 3 |
| FR-136 | Export modes: approved only, export-ready, per project/document/tag | Must | 1 |
| FR-137 | Audit bundle with validation summary, cost breakdown, review statistics | Should | 2 |
| FR-138 | Preview before export with validation summary | Should | 3 |
| FR-139 | Signed export bundle URLs with expiration | Should | 2 |

### 7.14 Analytics and Reporting

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-140 | Job metrics: per day/week/month | Must | 1 |
| FR-141 | Provider usage by workspace | Should | 2 |
| FR-142 | Validation failure patterns | Should | 2 |
| FR-143 | Review time per record | Should | 2 |
| FR-144 | Approval rates (first-pass and after review) | Should | 2 |
| FR-145 | Cost tracking by provider (per-page, per-record, per-project) | Must | 2 |
| FR-146 | Hallucination rate tracking by provider and document type | Should | 2 |
| FR-147 | Provider ROI comparison (quality per dollar) | Could | 3 |
| FR-148 | VLM vs OCR+LLM quality comparison dashboard | Could | 3 |

### 7.15 Notifications

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-150 | In-app notifications | Must | 3 |
| FR-151 | Email notifications | Should | 3 |
| FR-152 | Notify on job completion/failure | Must | 3 |
| FR-153 | Notify when review queue crosses threshold | Should | 3 |
| FR-154 | Notify on provider outage or auth failure | Should | 3 |
| FR-155 | Notify on budget threshold approach/breach | Should | 3 |
| FR-156 | Webhook integration for external consumers | Could | 3 |

### 7.16 Semantic Search and Intelligence

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-160 | Full-text search on extracted question text (pg_trgm) | Should | 2 |
| FR-161 | Semantic search across question banks (embedding-based) | Could | 3 |
| FR-162 | Near-duplicate finder across documents and projects | Should | 3 |
| FR-163 | Topic-based question clustering | Could | 4 |

### 7.17 Agentic Workflows

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-170 | Multi-step workflow orchestrator with state machine | Could | 4 |
| FR-171 | Conditional routing based on page characteristics | Could | 4 |
| FR-172 | Cross-document reasoning (link answer keys across documents) | Could | 4 |
| FR-173 | Workflow templates for common exam formats | Could | 4 |
| FR-174 | Human-in-the-loop checkpoints at configurable stages | Could | 4 |

---

## 8. Non-Functional Requirements Summary

(Detailed in non-functional-requirements.md)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | UI response < 200ms for standard operations |
| NFR-002 | Performance | Job queuing acknowledged within 1 second |
| NFR-003 | Scalability | Support horizontal worker scaling |
| NFR-004 | Reliability | Resumable jobs after system restart |
| NFR-005 | Security | TLS everywhere, encrypted secrets at rest |
| NFR-006 | Availability | 99.5% uptime for API layer (assumption) |
| NFR-007 | Observability | Structured JSON logging with correlation IDs |
| NFR-008 | Accessibility | WCAG 2.1 AA compliance |
| NFR-009 | Maintainability | TypeScript-first, monorepo with shared types |

---

## 9. Feature Decomposition by Module

| Module | Features (count) | Phase Range |
|--------|-----------------|-------------|
| Auth & User Management | 8 | 0–4 |
| Workspace & Project Management | 5 | 1–3 |
| Provider Configuration | 10 | 0–3 |
| File Ingestion | 10 | 1–3 |
| Preprocessing | 10 | 1–2 |
| OCR & Document AI | 8 | 1–3 |
| VLM Extraction | 7 | 2–4 |
| Segmentation | 7 | 1–3 |
| LLM Extraction | 10 | 1–3 |
| Validation | 9 | 1–4 |
| Hallucination Detection | 6 | 1–2 |
| Review Queue | 13 | 1–3 |
| Export | 10 | 1–3 |
| Analytics & Reporting | 9 | 1–3 |
| Notifications | 7 | 3 |
| Semantic Search | 4 | 2–4 |
| Agentic Workflows | 5 | 4 |

**Total identified functional requirements: 138**

---

## 10. Requirement Risks

| Risk | Affected Requirements | Impact | Mitigation |
|------|-----------------------|--------|------------|
| Python/Node bridge complexity | FR-050, FR-055 | High | Decide architecture early; build integration tests |
| QTI/SCORM compliance depth | FR-132, FR-133 | High | Engage domain expert; validate against reference LMS |
| VLM cost unpredictability | FR-060–FR-066 | Medium | Cost projection in preprocessing; configurable budget limits |
| Agentic workflow vagueness | FR-170–FR-174 | Low to Phase 4 | Defer detailed design; prototype in isolation |
| Semantic search accuracy | FR-161, FR-162 | Medium | Start with pg_trgm; add pgvector incrementally |
| Multi-tenant data isolation | FR-010 | High | Enforce workspace-level query filters at ORM level |
| Provider rate limit variation | FR-026 | Medium | Build provider-specific rate limit configs; implement circuit breakers |

---

## 11. Requirement Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No specific file size limits defined | Medium | Define per-workspace configurable limits (suggest 200MB default) |
| No concurrent user or throughput targets | High | Define NFR targets before Phase 1 |
| No mobile/responsive requirements | Low | Confirm if responsive design is needed |
| No offline capabilities mentioned | Low | Confirm if offline mode is needed (likely not) |
| No data migration or import from v1 | Medium | Clarify if there is legacy data to migrate |
| No internationalization requirements beyond language detection | Low | Confirm if the UI needs to support multiple languages |
| No specific LMS targets for validation | High | Choose reference LMS(s) for compliance testing |
| No webhook payload schema defined | Medium | Define webhook schema in Phase 3 |
| No batch operation limits defined | Medium | Define max batch sizes for upload, review, export |

---

## 12. Requirement Ambiguities

| Ambiguity | Source | Resolution Needed |
|-----------|--------|-------------------|
| "SSO support later" — no timeline or provider specified | Section 10.1 | Confirm SSO priority and target providers (Okta, Azure AD, etc.) |
| "Drizzle ORM (preferred) or Prisma" — which one? | Section 8.2 | Make definitive ORM choice before Phase 0 |
| "Optional Neo4j or Apache AGE" — when to decide? | Section 8.7 | Start with pg_trgm; defer graph DB decision to Phase 4 |
| "Enterprise/private deployment optionally later" — scope unclear | Section 31.1 | Define what "private deployment" means architecturally |
| Document parser stack is Python, backend is Node.js | Sections 8.6, 8.2 | Explicitly design cross-language integration |
| "Local storage only for dev mode" — how is local dev S3 simulated? | Section 8.3 | Use MinIO for local S3-compatible storage |
| Confidence weight configurability — who configures, via what UI? | Section 11.5 | Decide if this is admin UI or config file |

---

## 13. Recommended Clarifications

1. Confirm team size and composition to validate the 21+ week roadmap.
2. Decide Drizzle vs Prisma definitively.
3. Define the Python-to-Node integration architecture for document parsers.
4. Set specific NFR targets (latency, throughput, concurrent users, uptime SLA).
5. Select reference LMS platforms for QTI/SCORM compliance testing.
6. Define maximum file size, batch size, and page count limits.
7. Clarify whether the frontend needs mobile-responsive design.
8. Define webhook payload schemas for integration consumers.
9. Clarify data retention and GDPR/privacy compliance requirements.
10. Define the criteria for when consensus voting across providers is triggered.
