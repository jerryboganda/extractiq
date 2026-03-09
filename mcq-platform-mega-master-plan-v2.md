# Mega Master Plan v2.0 — A–Z Implementation for the MCQ Extraction Web App

## Version
- **Document version:** 2.0 (Enhanced Edition)
- **Prepared for:** Web-based MCQ extraction platform
- **Primary stack:** **Next.js/React** frontend + **Node.js/Express** backend
- **Goal:** Build a production-grade, multi-user, provider-agnostic document intelligence platform that converts large PDF collections into reviewable, validated, LMS-ready JSON with strong anti-hallucination controls, agentic orchestration, and vision-language model support.

---

## 1. Executive Summary

This product will be a **web application** for high-volume PDF ingestion, OCR, MCQ extraction, validation, human review, and LMS export. It is designed for long-term scale, team collaboration, centralized management, auditability, and extensibility.

The v2.0 plan introduces **significant architectural upgrades** informed by the latest developments in document intelligence (2025–2026):

- **Vision-Language Model (VLM) integration** as a first-class extraction pathway, not just a fallback. VLMs like GPT-4.1 Vision, Gemini 2.5 Pro, Qwen 2.5 VL, and Claude's vision capabilities can now process document images directly, understanding layout, tables, and visual elements natively.
- **Agentic Document Workflows (ADW)** that go beyond simple pipeline orchestration. Specialized agents handle extraction, validation, cross-referencing, and quality scoring — coordinating through an explicit state machine.
- **Tiered anti-hallucination architecture** inspired by recent research, combining model-level, context-level, and data-level controls in a closed feedback loop.
- **LMS interoperability standards** including QTI (Question and Test Interoperability), SCORM, xAPI, cmi5, and LTI — not just raw JSON/CSV exports.
- **Knowledge graph–backed duplicate detection** and semantic question clustering for cross-project intelligence.
- **Cost intelligence** with per-record cost attribution, budget guardrails, and provider routing optimization.

The architecture separates:
- the **operator-facing web app**,
- the **API/backend orchestration layer**,
- the **background worker pipeline with agentic coordination**,
- the **provider abstraction layer** for OCR/LLM/VLM vendors,
- the **tiered validation and anti-hallucination system**,
- the **review/QA system**, and
- the **export/integration layer with LMS standards support**.

The platform will not promise "100% accuracy" or "0% hallucination." Instead, it will enforce:
- **evidence-only extraction**,
- **strict null-on-uncertainty behavior**,
- **tiered hallucination detection (model, context, data)**,
- **automatic validation rules**,
- **review queues for uncertain records**, and
- **complete traceability for every extracted field**.

---

## 2. Product Vision

### 2.1 Core Vision
Create a world-class document extraction platform that can:
- process very large PDFs reliably,
- support multiple OCR, LLM, and VLM vendors,
- extract MCQs into a consistent JSON schema,
- detect and isolate uncertain cases through tiered hallucination controls,
- enable human-in-the-loop correction,
- export clean LMS-ready data at scale in industry-standard formats (QTI, SCORM, xAPI),
- and leverage agentic workflows for intelligent multi-step document understanding.

### 2.2 Strategic Outcome
The platform should evolve from "PDF to MCQ JSON" into a broader **document intelligence operations platform** with:
- reusable extraction templates,
- configurable review workflows,
- analytics and cost intelligence,
- provider routing with A/B testing and shadow-mode comparison,
- tenant/workspace support,
- agentic document understanding pipelines,
- semantic search and knowledge graph integration,
- and future support for exams, assessments, worksheets, forms, and question banks.

### 2.3 Why Now: Market Context
The document intelligence market is undergoing a fundamental transformation. The global IDP market is projected to grow from $2.56B in 2024 to $54.54B by 2035. 63% of Fortune 250 companies already use Intelligent Document Processing. Meanwhile, VLMs have reached a maturity threshold where open-source models match commercial API performance on document understanding benchmarks, and agentic AI orchestration is shifting from experimental to production-ready. Building this platform now positions it at the intersection of these converging trends.

---

## 3. Why This Stack Is the Right Choice

### 3.1 Frontend: Next.js + React
**Why:**
- Excellent for modern admin dashboards and operations UIs.
- Supports hybrid rendering (SSR, SSG, ISR) and server integration via App Router.
- Strong TypeScript ecosystem with mature component libraries.
- Ideal for multi-user SaaS-style products with complex state.
- Easy to scale to role-based workflows, APIs, and internal admin tools.

### 3.2 Backend: Node.js + Express
**Why:**
- Flexible and proven for API layers.
- Strong middleware ecosystem for auth, validation, logging.
- Easy integration with queues, storage, auth providers, and vendor SDKs.
- Practical for orchestration-heavy systems with many I/O-bound operations.
- TypeScript-first support reduces type mismatches between frontend and backend.

### 3.3 Background Workers with Agentic Coordination
Heavy PDF/OCR/LLM/VLM processing must not run in the web request-response cycle. It should run in **asynchronous workers** backed by **BullMQ + Redis**, with an **agentic coordination layer** that manages multi-step workflows, handles conditional branching (e.g., route to VLM if OCR confidence is low), and maintains explicit workflow state.

**Key BullMQ Production Best Practices:**
- Set `maxRetriesPerRequest: null` for worker connections.
- Implement graceful shutdown on SIGINT/SIGTERM.
- Use `removeOnComplete: true` to prevent memory bloat.
- Namespace queues for multi-tenant architecture.
- Monitor Redis max memory and connection health.
- Use exponential backoff for retry strategies.
- Implement dead-letter queues for non-recoverable failures.

### 3.4 Long-Term Practicality
A web platform is better than a desktop app for:
- team collaboration,
- centralized operations,
- role-based access,
- remote review,
- cloud scaling,
- shared provider configuration,
- monitoring and analytics,
- LMS integration management,
- and agentic workflow orchestration.

---

## 4. Product Goals

### 4.1 Primary Goals
- Process large PDF batches safely and reliably.
- Extract MCQs and related data into strict JSON.
- Support multiple OCR, LLM, and VLM providers.
- Minimize hallucination risk through a tiered architecture (model, context, data).
- Support human review and correction.
- Export LMS-ready datasets in QTI, SCORM, xAPI, and cmi5 formats.
- Provide resumable jobs and operational transparency.

### 4.2 Secondary Goals
- Support multiple workspaces and teams.
- Support configurable extraction profiles.
- Support provider fallback, routing policies, and A/B testing.
- Provide analytics, quality scoring, cost intelligence, and productivity tooling.
- Enable future API access and automation.
- Implement semantic search and knowledge graph for question clustering.
- Support agentic document workflows for complex multi-step extraction.

### 4.3 Non-Goals
- Guaranteeing perfect model accuracy.
- Replacing human review for ambiguous visual content.
- Running huge extraction workloads synchronously in the UI.
- Coupling the platform to a single provider.
- Building a general-purpose chatbot or conversational AI interface.

---

## 5. Key Product Principles

1. **Evidence over confidence** — every extraction must cite its source.
2. **Deterministic validation over blind trust** — validate at schema, field, and business rule levels.
3. **Review-first design for uncertain records** — the review queue is a core product surface, not an afterthought.
4. **Async processing for all heavy workloads** — never block the UI on extraction.
5. **Modular provider abstraction** — swap OCR, LLM, or VLM vendors without pipeline changes.
6. **Traceability for every extracted item** — full audit chain from source page to export.
7. **Security by default** — TLS, encrypted secrets, RBAC, signed URLs.
8. **Scalability from the beginning** — horizontal worker scaling, queue-based architecture.
9. **Operational observability built in** — structured logs, metrics, alerting.
10. **Operator efficiency matters as much as AI quality** — keyboard shortcuts, bulk actions, fast filters.
11. **Tiered hallucination management** — detect and mitigate at model, context, and data tiers.
12. **Cost intelligence is a product feature** — per-record cost tracking, budget guardrails, ROI visibility.
13. **LMS interoperability by design** — support industry standards, not just raw file dumps.

---

## 6. User Roles

### 6.1 Super Admin
- Manages global settings.
- Billing, provider pools, secrets, usage policy.
- System health and observability.
- Workspace provisioning.

### 6.2 Workspace Admin
- Manages workspace settings.
- Creates projects and users.
- Configures provider profiles.
- Configures export templates and LMS mappings.
- Sets review policies and quality thresholds.

### 6.3 Operator
- Uploads PDFs.
- Launches jobs.
- Checks statuses.
- Resolves flags.
- Exports approved data.

### 6.4 Reviewer / QA Specialist
- Reviews uncertain records.
- Edits extracted values.
- Approves/rejects records.
- Compares output with source evidence (side-by-side).
- Uses keyboard shortcuts for high-throughput review.

### 6.5 Analyst
- Views trends and reports.
- Checks extraction quality metrics.
- Compares provider performance and cost.
- Monitors export volumes and issue patterns.
- Tracks hallucination rates and mitigation effectiveness.

### 6.6 API/Integration User
- Consumes export endpoints.
- Triggers jobs programmatically.
- Syncs approved records into LMS or third-party systems.
- Receives webhook notifications on job events.

---

## 7. High-Level Architecture

```text
[ Next.js Frontend (App Router) ]
      |
      v
[ API Gateway / BFF Layer in Next.js or Nginx ]
      |
      v
[ Express API Service ]
  |- Auth & RBAC
  |- Project / File APIs
  |- Review APIs
  |- Export APIs (QTI, SCORM, xAPI, cmi5)
  |- Provider Config APIs
  |- Analytics & Cost Intelligence APIs
  |- Agentic Workflow APIs
      |
      +------------------------------+------------------------------+
      |                              |                              |
      v                              v                              v
[ PostgreSQL ]                 [ Redis / BullMQ ]            [ Knowledge Graph ]
      |                              |                        (Neo4j / pg_trgm)
      |                              v                              |
      |                  [ Agentic Orchestrator ]                   |
      |                     |- Workflow State Machine               |
      |                     |- Agent Coordinator                   |
      |                     |- Conditional Router                  |
      |                              |                              |
      |                              v                              |
      |                  [ Worker Services ]                        |
      |                   |- Preprocessing Worker                  |
      |                   |- OCR Worker                            |
      |                   |- VLM Document Understanding Worker     |
      |                   |- Segmentation Worker                   |
      |                   |- LLM Extraction Worker                 |
      |                   |- Validation Worker                     |
      |                   |- Hallucination Detection Worker        |
      |                   |- Export Worker (QTI/SCORM/xAPI/cmi5)   |
      |                   |- Notification Worker                   |
      |                   |- Cost Attribution Worker               |
      |                   |- Semantic Indexing Worker               |
      |
      v
[ Object Storage (S3-compatible) ]
  |- Raw PDFs
  |- Page images (rendered)
  |- OCR artifacts
  |- VLM intermediate outputs
  |- JSON outputs
  |- Audit bundles
  |- Exports (QTI/SCORM/xAPI packages)
      |
      v
[ External Providers ]
  |- LLM Providers: OpenAI, Anthropic, Gemini, Mistral, DeepSeek, OpenRouter-compatible
  |- VLM Providers: GPT-4.1 Vision, Gemini 2.5 Pro, Claude Vision, Qwen 2.5 VL, LLaMA 3.2 Vision
  |- OCR Providers: Google Document AI, Azure AI Document Intelligence, AWS Textract
  |- Local: Tesseract, PaddleOCR, EasyOCR, Surya, self-hosted VLMs
  |- Document Parsers: PyMuPDF/PyMuPDF4LLM, LlamaParse, Reducto, Unstructured.io
```

---

## 8. Core Technical Decisions

### 8.1 Frontend
- **Next.js (App Router)** with React Server Components where appropriate.
- **React + TypeScript** for all UI components.
- **Tailwind CSS + shadcn/ui** for fast premium admin UI construction.
- **TanStack Query** for API state management with optimistic updates.
- **Zustand** for local UI state where needed.
- **React Hook Form + Zod** for robust forms.
- **TanStack Table** for review tables and audit tables.
- **Recharts** for dashboards and usage analytics.
- **cmdk** for command palette integration.

### 8.2 Backend
- **Node.js + Express + TypeScript**.
- **Zod** for schema validation at the boundary.
- **Drizzle ORM** (preferred for type safety and SQL control) or **Prisma** for Postgres access.
- **BullMQ + Redis** for queues and workers.
- **OpenTelemetry-compatible logging/metrics hooks**.
- **Structured JSON logging** with correlation IDs.

### 8.3 Storage
- **PostgreSQL** for relational system data.
- **S3-compatible object storage** for PDFs, images, artifacts, exports.
- **pg_trgm + GIN indexes** for full-text search on extracted content.
- **pgvector** (optional) for semantic embedding search later.
- Local storage only for dev mode.

### 8.4 Auth & Security
- **NextAuth/Auth.js** or enterprise auth provider.
- JWT/session strategy depending on deployment model.
- RBAC permissions with fine-grained resource scoping.
- Encrypted secrets management (e.g., Vault, AWS KMS, or encrypted at rest in DB).
- Helmet.js, CSRF protections, rate limiting.

### 8.5 Infra / Deployment
- Dockerized services.
- Deployable to AWS / GCP / Azure / self-hosted.
- Separate web, API, worker, Redis, Postgres, object storage containers.
- Horizontal worker scaling with BullMQ concurrency controls.
- Health check endpoints for each service.

### 8.6 NEW: Document Parsing Stack
- **PyMuPDF / PyMuPDF4LLM** for native text extraction with Markdown output.
- **LlamaParse** or **Reducto** for advanced layout-aware parsing.
- **Unstructured.io** for document classification and chunking.
- VLM-based parsing for visually complex documents.

### 8.7 NEW: Knowledge Graph / Semantic Layer
- **pg_trgm** for trigram-based fuzzy matching and deduplication.
- **pgvector** for embedding-based semantic similarity search.
- Optional **Neo4j** or **Apache AGE** for relationship-based question clustering.

---

## 9. Monorepo Structure

```text
mcq-platform/
├─ apps/
│  ├─ web/                        # Next.js frontend
│  ├─ api/                        # Express API server
│  ├─ worker/                     # background workers
│  ├─ orchestrator/               # agentic workflow coordinator
│  └─ admin-tools/                # optional scripts and internal utilities
├─ packages/
│  ├─ ui/                         # shared UI components (shadcn/ui based)
│  ├─ config/                     # tsconfig/eslint/prettier/shared config
│  ├─ types/                      # shared types and DTOs
│  ├─ schemas/                    # Zod/JSON schemas + QTI/SCORM schemas
│  ├─ provider-sdk/               # provider abstractions and adapters
│  │  ├─ ocr/                     # OCR provider adapters
│  │  ├─ llm/                     # LLM provider adapters
│  │  ├─ vlm/                     # VLM provider adapters
│  │  └─ parser/                  # document parser adapters
│  ├─ extraction-core/            # core extraction business logic
│  ├─ validation-core/            # validation/flagging rules
│  ├─ hallucination-core/         # tiered hallucination detection & mitigation
│  ├─ auth-core/                  # auth/RBAC helpers
│  ├─ export-core/                # export mapping and generation
│  │  ├─ qti/                     # QTI 2.1/3.0 export
│  │  ├─ scorm/                   # SCORM 1.2/2004 packaging
│  │  ├─ xapi/                    # xAPI statement generation
│  │  └─ csv-json/                # JSON/JSONL/CSV export
│  ├─ cost-intelligence/          # cost tracking and attribution
│  ├─ semantic-engine/            # embedding, similarity, clustering
│  └─ observability/              # logging/telemetry utilities
├─ drizzle/                       # Drizzle ORM schema and migrations
├─ docs/
│  ├─ architecture/
│  ├─ api/
│  ├─ runbooks/
│  ├─ prompts/
│  └─ product/
├─ infra/
│  ├─ docker/
│  ├─ k8s/
│  └─ terraform/                  # optional later
├─ scripts/
├─ fixtures/
│  ├─ golden-datasets/            # benchmark extraction datasets
│  └─ test-pdfs/                  # test documents
└─ tests/
   ├─ unit/
   ├─ integration/
   ├─ e2e/
   └─ regression/
```

---

## 10. Primary Product Modules

### 10.1 Authentication & User Management
- Sign in / sign out.
- SSO support later (SAML, OIDC).
- Invite users with role assignment.
- Workspace membership and team management.
- Audit log for critical actions.
- Session management with optional IP allowlist.

### 10.2 Workspace & Project Management
- Multiple workspaces with isolated data.
- Projects per workspace with project-specific extraction profiles.
- Document grouping, tags, and labels.
- Retention settings and quality thresholds per project.
- Project templates for common exam types.

### 10.3 Provider Configuration Center
- Add API keys securely (encrypted at rest, never exposed after creation).
- Validate and test connections.
- Choose default OCR, LLM, and VLM providers per workspace/project.
- Fallback chain configuration.
- Routing policies: accuracy mode, cost mode, speed mode, balanced mode.
- Model-specific parameters and temperature controls.
- Provider health checks and usage dashboards.
- Rate limit handling policies.
- **NEW: VLM provider configuration** with image resolution settings, token budget controls.
- **NEW: Provider A/B testing framework** for shadow-mode comparison.

### 10.4 File Ingestion Center
- Drag-and-drop upload with folder upload support.
- Multi-file upload with resumable uploads (using tus or presigned multipart).
- Upload progress indicators.
- Duplicate detection using checksum/fingerprint (SHA-256).
- Metadata extraction on upload (page count, file size, text layer detection).
- Document tags, notes, categories.
- **NEW: Upload from cloud drive sources** (Google Drive, OneDrive, S3).
- **NEW: URL-based ingestion** for downloading PDFs from web links.
- **NEW: Zip archive ingestion** with auto-extraction.

### 10.5 Preprocessing Module
- Page counting and text-layer detection.
- Scanned vs digital classification per page.
- Mixed-document detection.
- Page image generation (rendered at configurable DPI).
- Rotation detection and auto-correction.
- OCR necessity prediction per page.
- Low-quality page detection.
- Page-type classification: question page, answer-key page, explanation page, cover/index/irrelevant page.
- **NEW: Visual complexity scoring** — pages with tables, diagrams, or graphs are flagged for VLM routing.
- **NEW: Language detection** per page for multilingual document support.
- **NEW: Deskew candidate scoring** with auto-correction where safe.

### 10.6 OCR & Document AI Module
- Native text extraction first (PyMuPDF/PyMuPDF4LLM for Markdown output).
- OCR only where needed (scanned pages, poor text layers).
- Multiple OCR providers: Google Document AI, Azure AI Document Intelligence, AWS Textract, Tesseract, PaddleOCR.
- Fallback routing and quality comparison.
- Optional deskew/cleanup/rotation correction.
- Store OCR confidence and artifacts per page.
- Layout metadata preservation (bounding boxes, reading order).
- **NEW: Hybrid OCR + VLM pipeline** — when OCR confidence is low, route the page image to a VLM for direct visual understanding.
- **NEW: Table extraction** with structured output (rows, columns, cells).
- **NEW: Formula/equation detection** for STEM content.

### 10.7 NEW: Vision-Language Model (VLM) Document Understanding Module
This is a major addition to the v2.0 architecture. VLMs represent a fundamental shift from OCR+LLM pipelines to direct visual document understanding.

**When to use VLM pathway:**
- Pages with complex layouts (multi-column, nested tables).
- Image-dependent questions (diagrams, charts, graphs).
- Pages where OCR confidence is below threshold.
- Pages with mathematical formulas or special notation.
- Mixed-media pages with interleaved text and images.

**VLM Provider Support:**
- GPT-4.1 Vision / GPT-4o (OpenAI).
- Gemini 2.5 Pro / Gemma 3 (Google).
- Claude Vision (Anthropic).
- Qwen 2.5 VL (open-source, self-hostable).
- LLaMA 3.2 Vision (open-source, self-hostable).
- Kimi-VL (Moonshot AI).

**VLM Pipeline Steps:**
1. Render page to image at optimal resolution (typically 1024×1024 or higher).
2. Send page image + extraction prompt to VLM provider.
3. Receive structured JSON output with extracted MCQs.
4. Validate against schema and cross-reference with OCR text if available.
5. Calculate composite confidence score.

**Key Considerations:**
- Token cost: a single high-resolution image consumes 2,000–3,000 text-equivalent tokens.
- Batch sizing must account for VLM rate limits and cost.
- VLM outputs should still follow evidence-only extraction rules.
- Image resolution settings should be configurable per project.

### 10.8 Segmentation Module
- Identify MCQ boundaries from raw text or VLM output.
- Detect question number, stem, options, answer key references, explanations.
- Support different option styles (A/B/C/D, a/b/c/d, 1/2/3/4, i/ii/iii/iv).
- Support page-spanning questions.
- Support answer key pages separate from question pages.
- **NEW: Document template learning** — adapt segmentation heuristics per project based on recurring layouts.
- **NEW: Pattern memory** for recurring exam formats.
- **NEW: Visual segmentation fallback** using VLM for complex layouts.
- **NEW: Two-column and multi-column layout detection**.

### 10.9 LLM Extraction Module
- Provider-agnostic structured extraction.
- Prompt templates by question style and document type.
- Schema-locked JSON output (using structured output / function calling where available).
- Strict evidence-only instructions.
- Null for uncertain fields.
- Source excerpt requirement.
- Provider metadata recording (model, latency, cost, token usage).
- Batch sizing controls.
- **NEW: Prompt versioning system** with rollback support.
- **NEW: Extraction replay mode** for debugging and comparison.
- **NEW: Provider A/B testing** — run same content through two providers, compare quality.

### 10.10 Validation Module
- JSON schema validation.
- Field-level validation (non-empty question text, valid option labels, answer-option consistency).
- Business rule validation (at least 2 options for MCQ, source page present, non-trivial source excerpt).
- Evidence sufficiency checks.
- Duplicate checks (exact and near-duplicate using trigram similarity).
- Export readiness scoring (composite score 0–100).
- **NEW: Semantic duplicate detection** using embeddings across documents and projects.
- **NEW: Answer key mismatch analytics** — detect when answer keys conflict across sources.
- **NEW: Weak source evidence heatmap** — visual indicator of extraction reliability per page.
- **NEW: Policy engine** for client-specific validation rules.

### 10.11 NEW: Tiered Hallucination Detection & Mitigation Module
Inspired by recent research on hallucination management frameworks, this module implements a three-tier approach:

**Tier 1: Model Tier**
- Detect overconfident incorrect outputs using Expected Calibration Error (ECE) analysis.
- Compare outputs across providers (consensus voting) — if two providers disagree, flag for review.
- Use low-temperature settings for extraction (minimize randomness).
- Enforce structured output modes (function calling / JSON mode) to constrain generation.

**Tier 2: Context Tier**
- Validate that every extracted field has a corresponding source excerpt.
- Cross-reference extracted answers with answer key pages.
- Check for entity consistency (e.g., option labels mentioned in the question should exist in options list).
- Verify that question numbering is sequential and consistent.

**Tier 3: Data Tier**
- Compare extraction results against golden datasets for known document types.
- Track hallucination rates per provider, per document type, per question category.
- Feed validation failures back into prompt improvement cycles.
- Maintain a "hallucination registry" of known failure patterns per provider.

**Continuous Improvement Cycle:**
Detection → Diagnosis → Mitigation → Validation → Feedback → Detection.

### 10.12 Review Queue Module
- Review by flag type, severity, confidence.
- Page preview side-by-side with extracted JSON.
- Source excerpt comparison with highlighted matching.
- Inline correction with audit history.
- Approve / reject / edit / reprocess actions.
- Bulk actions for high-throughput review.
- Audit trail of every edit.
- Reviewer notes and comments.
- **NEW: Keyboard shortcuts** for every review action.
- **NEW: Confidence-based work queues** — highest-risk items surface first.
- **NEW: "Show similar records" helper** for consistency checking.
- **NEW: Disagreement review mode** — when multiple providers disagree.
- **NEW: Second-review requirement** for critical projects.
- **NEW: Reviewer productivity dashboard** with SLA metrics.

### 10.13 Export & LMS Integration Module
**Standard Exports:**
- JSON and JSONL export.
- CSV export with configurable column mapping.

**NEW: LMS-Standard Exports:**
- **QTI 2.1 / 3.0** (Question and Test Interoperability) — the IMS Global standard for exchanging assessment items. This is the most important format for LMS interoperability. QTI packages contain XML-based question definitions with metadata, scoring rules, and response processing. MCQs extracted by the platform will be exported as QTI `<assessmentItem>` elements with proper `<choiceInteraction>` markup.
- **SCORM 1.2 / 2004** — package extracted questions into SCORM-compliant content packages that any SCORM-compatible LMS can import. Include imsmanifest.xml, content organization, and sequencing.
- **xAPI (Tin Can API)** — generate xAPI statement templates for each question, enabling tracking of learner interactions beyond the LMS. Store in Learning Record Store (LRS) format.
- **cmi5** — combine SCORM's packaging with xAPI's rich tracking. Export as cmi5-compliant packages with Assignable Units and course structures.
- **LTI-compatible** content packages (later) — enable the question bank to be launched as an external tool from any LTI-compliant LMS.

**Export Modes:**
- All approved only.
- All export-ready (above confidence threshold).
- Include flagged if explicitly selected.
- Per project, per document, per tag/category.
- Versioned export schemas.

**Audit Bundle:**
Include optional downloadable bundle with:
- exported data,
- validation summary,
- issue summary,
- provider usage summary,
- review statistics,
- cost breakdown.

### 10.14 Analytics & Reporting Module
- Jobs per day/week/month.
- Provider usage by workspace.
- OCR vs VLM pathway distribution.
- Validation failure patterns.
- Review time per record.
- Approval rates (first-pass and after review).
- Export volumes.
- Confidence distributions.
- Duplicate rates.
- **NEW: Cost tracking by provider** — per-page, per-record, per-project.
- **NEW: Hallucination rate tracking** by provider and document type.
- **NEW: Provider ROI comparison** — quality per dollar.
- **NEW: VLM vs OCR+LLM quality comparison** dashboard.

### 10.15 Observability & Operations Module
- Queue health (BullMQ dashboard integration via bull-board or Taskforce.sh).
- Worker status (active, idle, stalled, crashed).
- Provider health (latency, error rate, auth status).
- Latency dashboards.
- Error dashboards with stack traces.
- Retry counters and dead-letter queue inspection.
- Storage consumption tracking.
- Incident audit trail.
- Downloadable diagnostic bundle.
- **NEW: OpenTelemetry traces** across the full extraction pipeline.

### 10.16 Notification Module
- In-app notifications.
- Email notifications.
- Slack/webhook integration later.
- Notify on job completion/failure.
- Notify when review queue crosses threshold.
- Notify on provider outage or auth failure.
- **NEW: Notify on budget threshold approach/breach**.
- **NEW: Notify on hallucination rate spike**.

---

## 11. Anti-Hallucination Architecture (Enhanced)

### 11.1 Non-Negotiable Rules
The platform must never behave like a free-form chatbot for extraction.

Mandatory rules:
1. Extract only from source evidence.
2. Never infer correct answers from world knowledge.
3. Preserve wording unless normalized fields are separate.
4. Use `null` when data is missing or unclear.
5. Add flags whenever ambiguity is detected.
6. Require review for high-risk records.
7. Never export silently broken records as "clean."
8. **NEW:** Never trust a single provider's output without validation.
9. **NEW:** Track and attribute every hallucination to its root cause tier.

### 11.2 Required Evidence Fields in Every Record
Each MCQ record must include:
- `source_pdf`
- `source_page`
- `source_page_end` (if applicable)
- `source_excerpt`
- `source_page_image_ref` (reference to rendered page image)
- `extraction_pathway` (ocr_llm, vlm_direct, hybrid)
- `provider_used`
- `model_used`
- `extraction_method`
- `confidence` (composite score 0–100)
- `confidence_breakdown` (ocr_confidence, segmentation_confidence, extraction_confidence, validation_confidence)
- `flags`
- `hallucination_risk_tier` (low, medium, high)
- `review_status`
- `schema_version`
- `cost_attribution` (estimated cost to extract this record)

### 11.3 Tiered Hallucination Detection (NEW)

**Model Tier Controls:**
- Enforce structured output modes (JSON schema, function calling).
- Use low temperature (0.0–0.2) for extraction tasks.
- Constrain max tokens to prevent runaway generation.
- Use chain-of-thought prompting for complex segmentation.
- Detect overconfident incorrect outputs via ECE monitoring.

**Context Tier Controls:**
- Require source excerpt for every extracted field.
- Cross-reference extracted data against multiple signals (OCR text, VLM output, answer key).
- Verify entity consistency within each record.
- Check sequential question numbering.
- Detect impossible option structures (e.g., 5 options when document uses 4-option format).

**Data Tier Controls:**
- Compare against golden datasets for known document types.
- Track per-provider hallucination rates over time.
- Feed validation failures back into prompt improvement.
- Maintain hallucination pattern registry.
- Use consensus voting when multiple providers are configured.

### 11.4 Mandatory Review Conditions
Force review when:
- OCR confidence is below threshold.
- VLM and OCR+LLM pathways disagree.
- Option structure is malformed.
- Answer key does not match available option labels.
- Question is image/table/graph-dependent.
- Segmentation is ambiguous.
- Duplicate candidate detected.
- Page text quality is poor.
- Source excerpt is too weak or incomplete.
- **NEW:** Hallucination risk tier is "high."
- **NEW:** Provider consensus check fails (providers disagree).
- **NEW:** Cost-per-record exceeds expected range (may indicate repeated retries).

### 11.5 Composite Confidence Model
Use a weighted composite confidence score (0–100) based on:
- OCR confidence (weight: 0.20)
- Segmentation certainty (weight: 0.15)
- Schema compliance (weight: 0.20)
- Answer-key consistency (weight: 0.15)
- Source evidence strength (weight: 0.15)
- Provider-specific quality signals (weight: 0.10)
- Duplicate confidence (weight: 0.05)

Weights should be configurable per project. Confidence guides prioritization but does not replace validation.

---

## 12. Data Model Overview

### 12.1 Core Entities
- User
- Workspace
- Project
- ProviderConfig
- ProviderBenchmark (NEW — tracks provider performance over time)
- UploadSession
- Document
- DocumentPage
- PageImage (NEW — rendered page images for VLM/review)
- Job
- JobTask
- WorkflowState (NEW — agentic workflow state machine)
- OCRArtifact
- VLMOutput (NEW — VLM extraction results)
- TextArtifact
- Segment
- MCQRecord
- MCQRecordHistory (NEW — version history for edited records)
- ReviewItem
- ReviewAction
- ExportJob
- ExportArtifact
- ValidationReport
- HallucinationEvent (NEW — tracks detected hallucinations)
- AuditLog
- Notification
- UsageMetric
- CostRecord (NEW — per-operation cost tracking)
- SemanticIndex (NEW — embeddings for similarity search)
- PromptVersion (NEW — versioned extraction prompts)

### 12.2 Example MCQ Record Schema (Enhanced)

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "project_id": "uuid",
  "document_id": "uuid",
  "source_pdf": "biology_set_01.pdf",
  "source_page": 154,
  "source_page_end": 154,
  "source_page_image_ref": "s3://bucket/page-images/doc-uuid/page-154.png",
  "question_number": "Q142",
  "question_text": "Which of the following is the correct definition of ...?",
  "options": [
    { "label": "A", "text": "Option A text here" },
    { "label": "B", "text": "Option B text here" },
    { "label": "C", "text": "Option C text here" },
    { "label": "D", "text": "Option D text here" }
  ],
  "correct_answer": "B",
  "explanation": null,
  "question_type": "single_choice",
  "subject": null,
  "topic": null,
  "difficulty": null,
  "language": "en",
  "source_excerpt": "Q142. Which of the following... Answer: B",
  "extraction_pathway": "ocr_llm",
  "extraction_method": "ocr+llm_structured_extraction",
  "provider_used": "openai",
  "model_used": "gpt-4.1",
  "confidence": 87,
  "confidence_breakdown": {
    "ocr_confidence": 92,
    "segmentation_confidence": 85,
    "extraction_confidence": 88,
    "validation_confidence": 90
  },
  "flags": [],
  "hallucination_risk_tier": "low",
  "review_status": "approved",
  "cost_attribution": {
    "ocr_cost_usd": 0.002,
    "llm_cost_usd": 0.015,
    "total_cost_usd": 0.017
  },
  "schema_version": "2.0.0",
  "created_at": "2026-03-08T10:00:00Z",
  "updated_at": "2026-03-08T10:05:00Z"
}
```

### 12.3 Review Item Schema
- Record ID.
- Severity (critical, high, medium, low).
- Flag types (array of specific flag codes).
- Reason summary.
- Reviewer assignment.
- Reviewer notes.
- Original values (snapshot before edit).
- Edited values (what was changed).
- Source preview URL (page image).
- Timestamps (created, assigned, resolved).

### 12.4 Validation Report Schema
- Job ID.
- Total records.
- Passed count.
- Flagged count (by severity).
- Failed count.
- Duplicate count.
- Weak OCR count.
- Missing answer count.
- VLM pathway count (NEW).
- Hallucination detections count (NEW).
- Export-ready count.
- Rule-level breakdown.
- Estimated total cost (NEW).

---

## 13. API Design Plan

### 13.1 API Domains
- `/auth`
- `/users`
- `/workspaces`
- `/projects`
- `/providers`
- `/documents`
- `/uploads`
- `/jobs`
- `/review`
- `/exports`
- `/analytics`
- `/cost` (NEW)
- `/notifications`
- `/health`
- `/admin`
- `/semantic` (NEW — search, similarity, clustering)

### 13.2 Example Endpoints

#### Auth
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session`

#### Providers
- `GET /providers`
- `POST /providers`
- `POST /providers/test`
- `PATCH /providers/:id`
- `DELETE /providers/:id`
- `GET /providers/:id/benchmarks` (NEW)

#### Documents
- `POST /documents/upload`
- `GET /documents`
- `GET /documents/:id`
- `GET /documents/:id/pages`
- `GET /documents/:id/preview/:page`

#### Jobs
- `POST /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/pause`
- `POST /jobs/:id/resume`
- `POST /jobs/:id/retry`
- `POST /jobs/:id/cancel`
- `GET /jobs/:id/cost` (NEW)

#### Review
- `GET /review/items`
- `GET /review/items/:id`
- `POST /review/items/:id/approve`
- `POST /review/items/:id/reject`
- `POST /review/items/:id/edit`
- `POST /review/items/:id/reprocess`
- `GET /review/items/:id/similar` (NEW — find similar records)

#### Exports
- `POST /exports`
- `GET /exports/:id`
- `GET /exports/:id/download`
- `GET /exports/mappings`
- `POST /exports/mappings`
- `POST /exports/qti` (NEW)
- `POST /exports/scorm` (NEW)
- `POST /exports/xapi` (NEW)

#### Analytics
- `GET /analytics/overview`
- `GET /analytics/providers`
- `GET /analytics/review`
- `GET /analytics/quality`
- `GET /analytics/cost` (NEW)
- `GET /analytics/hallucinations` (NEW)

#### Semantic (NEW)
- `POST /semantic/search` — search across extracted question text
- `GET /semantic/duplicates/:recordId` — find near-duplicates
- `GET /semantic/cluster/:projectId` — topic-based clustering

---

## 14. Upload & Ingestion Flow

### 14.1 Upload Stages
1. User selects project.
2. User uploads PDFs (drag-and-drop, folder, or cloud drive).
3. Server stores PDFs in object storage via presigned URL upload.
4. Backend creates document records.
5. Fingerprint/dedup logic runs (SHA-256 checksum).
6. Preprocessing job is queued.

### 14.2 Upload Features
- Resumable large file uploads (tus protocol or multipart presigned).
- Pre-signed URL uploads for direct-to-storage flow.
- Batch upload queue with progress indicators.
- File-level notes and tags.
- Checksum verification.
- MIME type validation.
- File size limits (configurable per workspace).
- **NEW: Cloud drive import** (Google Drive, OneDrive, Dropbox).
- **NEW: URL-based ingestion** from web links.
- **NEW: Zip archive auto-extraction**.
- **NEW: OCR estimate preview** before full run (cost/time estimate).

---

## 15. Preprocessing Pipeline Plan

### 15.1 Preprocessing Steps
1. Extract file metadata.
2. Detect page count.
3. Render page images at configurable DPI (for VLM and review).
4. Test for text layer presence per page.
5. Classify each page as text/scanned/mixed.
6. Estimate OCR necessity per page.
7. **NEW: Estimate visual complexity** per page (tables, diagrams, formulas).
8. Classify page type (question, answer-key, explanation, cover/index/irrelevant).
9. **NEW: Detect language** per page.
10. Create chunk plan for downstream workers.
11. **NEW: Route decision** — which pages go to OCR+LLM vs VLM pathway.

### 15.2 Output of Preprocessing
- Page metadata table.
- Text availability map.
- OCR-needed map.
- Visual complexity map (NEW).
- Page preview references (rendered images).
- Chunk plan for segmentation/extraction.
- Routing plan (OCR+LLM vs VLM per page) (NEW).
- Initial quality warnings.
- Estimated cost projection (NEW).

---

## 16. OCR & Document AI Strategy

### 16.1 Provider Routing Principles
- Prefer native text extraction when reliable (PyMuPDF/PyMuPDF4LLM).
- Use OCR only when necessary (scanned pages, weak text layers).
- **NEW: Route to VLM** when OCR confidence is low or page has high visual complexity.
- Allow workspace/project-level OCR profiles.
- Store normalized OCR result in common Markdown format.

### 16.2 Supported Provider Categories
- **Traditional OCR:** Tesseract, PaddleOCR, EasyOCR.
- **Document AI with layout extraction:** Google Document AI, Azure AI Document Intelligence, AWS Textract.
- **VLM-based document understanding (NEW):** GPT-4.1 Vision, Gemini 2.5 Pro, Claude Vision, Qwen 2.5 VL, LLaMA 3.2 Vision.
- **Document parsers (NEW):** PyMuPDF4LLM (Markdown), LlamaParse, Reducto, Unstructured.io.
- **Local OCR fallback:** Tesseract, Surya.

### 16.3 Recommended OCR Routing Modes
- **Accuracy-first:** strongest layout-aware provider, then VLM fallback.
- **Speed-first:** fastest acceptable provider.
- **Cost-first:** low-cost OCR first, VLM only on failure.
- **Balanced:** default profile.
- **VLM-first (NEW):** send page images directly to VLM, skip OCR entirely.

### 16.4 OCR Quality Controls
- Low OCR confidence flag.
- Excessive garbling detection.
- Broken line structure detection.
- Suspicious symbol density detection.
- Compare extracted options pattern success rate.
- **NEW: Auto-route to VLM** when confidence is below configurable threshold.

---

## 17. Segmentation Strategy

### 17.1 Goal
Convert raw page text/artifacts into well-bounded MCQ candidate blocks.

### 17.2 Hard Cases to Support
- Question spans multiple pages.
- Answer key appears in another section.
- Options break across lines.
- Inconsistent option markers.
- Mixed language documents.
- Two-column layouts.
- Image captions interfering with extraction.
- **NEW: Mathematical formulas within questions**.
- **NEW: Tables as part of question stems**.
- **NEW: Diagram/chart references**.

### 17.3 Added Features
- Document template learning per project.
- Pattern memory for recurring exam layouts.
- Visual segmentation fallback for complex layouts (via VLM).
- Project-specific regex heuristics library.

---

## 18. LLM Extraction Strategy

### 18.1 What the LLM Should Do
The LLM should not "solve" questions. It should only:
- parse segmented MCQ candidates,
- structure them into schema-valid output,
- flag ambiguity,
- preserve wording,
- and return `null` for uncertain fields.

### 18.2 Prompting Rules
Every extraction prompt must state:
- Do not infer missing information.
- Do not rewrite unless explicitly asked.
- Preserve source wording.
- Return strict JSON only (use structured output / function calling).
- Use `null` for missing data.
- Include flags.
- Include source excerpt.
- **NEW:** If confident answer is below threshold, flag rather than guess.
- **NEW:** Use chain-of-thought for complex segmentation, but extract final answer in structured format.

### 18.3 Prompt Management (Enhanced)
Store prompts as versioned assets:
- Prompt ID.
- Version number.
- Target provider family.
- Target task.
- Expected schema.
- Release notes.
- Rollback support.
- Performance metrics (accuracy, hallucination rate).
- A/B test group assignment.

### 18.4 Prompt Types
- `mcq_segmentation_v1`
- `mcq_normalization_v1`
- `answer_key_extraction_v1`
- `ambiguity_detection_v1`
- `visual_dependency_v1`
- `explanation_linking_v1`
- **NEW:** `vlm_direct_extraction_v1` — prompt for VLM to extract directly from page images.
- **NEW:** `consensus_reconciliation_v1` — reconcile conflicting outputs from multiple providers.

---

## 19. Validation Strategy (Enhanced)

### 19.1 Validation Layers
1. Schema validation (Zod schemas).
2. Field-level validation.
3. Business rule validation.
4. Evidence sufficiency checks.
5. Duplicate checks (exact + semantic).
6. Export-readiness checks.
7. **NEW: Hallucination risk scoring**.
8. **NEW: Cross-record consistency** (sequential numbering, option pattern consistency).

### 19.2 Core Validation Rules
- Question text cannot be empty.
- At least 2 options required for MCQ.
- Option labels must be unique.
- Answer must match an available option label if present.
- Source page must be present.
- Source excerpt must be non-trivial (minimum character length).
- Malformed records must be flagged.
- **NEW: Question text should not be identical to any option text**.
- **NEW: Options should be sufficiently different from each other** (minimum edit distance).

---

## 20. Review Queue Strategy

### 20.1 Review UX Requirements
- Fast filtering by issue type, severity, confidence.
- Source image + text + extracted JSON side by side.
- Inline edit with audit history.
- Keyboard shortcuts for all actions.
- Bulk actions (approve all, reject batch, reprocess batch).
- Reviewer assignment and load balancing.
- SLA metrics (time-to-review, backlog aging).
- **NEW: Confidence-based work queues** — highest-risk items surface first.
- **NEW: "Show similar records" helper** — find and review similar questions for consistency.
- **NEW: Compact/dense review mode** for power users.
- **NEW: Sticky side-by-side compare panel**.
- **NEW: Review hotkeys configurable per user**.

### 20.2 Review States
- `unreviewed`
- `in_review`
- `approved`
- `edited`
- `rejected`
- `reprocess_requested`

---

## 21. Export Strategy (Enhanced with LMS Standards)

### 21.1 Export Targets
- **JSON / JSONL** — raw structured data.
- **CSV** — with configurable column mapping.
- **QTI 2.1 / 3.0 (NEW)** — industry standard for question/test interchange. Each MCQ becomes an `<assessmentItem>` with `<choiceInteraction>`, proper `<responseDeclaration>`, and `<responseProcessing>`.
- **SCORM 1.2 / 2004 (NEW)** — content packages with imsmanifest.xml.
- **xAPI (Tin Can API) (NEW)** — statement templates for tracking learner interactions. Actor-Verb-Object structure for each question attempt.
- **cmi5 (NEW)** — combines SCORM packaging with xAPI tracking for next-generation LMS integration.

### 21.2 Export Modes
- All approved only.
- All export-ready.
- Include flagged if explicitly selected.
- Per project / per document / per tag.
- Versioned export schemas.
- **NEW: Preview before export** with validation summary.
- **NEW: Partial export resume** for large datasets.
- **NEW: Signed export bundle URLs** with expiration.

### 21.3 Audit Bundle
Include optional downloadable bundle with:
- Exported data.
- Validation summary.
- Issue summary.
- Provider usage summary.
- Review statistics.
- Cost breakdown (NEW).
- Hallucination detection summary (NEW).

---

## 22. Feature Expansion Ideas for a World-Class Product

### 22.1 Advanced Product Features
- Workspace billing and quota controls.
- Provider usage budgets and alerts.
- Cost-per-record analytics.
- Project templates.
- Saved extraction presets.
- Document taxonomy management.
- Multilingual support with language detection.
- Translation layer for extracted content.
- **Semantic search across extracted question banks** (using embeddings).
- **Duplicate question finder across years/editions** (using trigram + embedding similarity).
- **"Similar question" clustering** for exam analysis.
- Auto-topic classification.
- Difficulty estimation (later).
- Content moderation checks.
- Exam paper version comparison.
- Answer key conflict detection across sources.
- Differential exports by approval status.
- Webhooks for job completion.
- Public/internal API tokens.
- Tenant branding / white-label.
- Per-client data retention policy.
- Archive and restore.

### 22.2 AI Quality Features
- Provider evaluation lab.
- Benchmark suite per document type.
- Golden dataset testing.
- Prompt experiment tracking.
- Model routing experiments.
- Extraction quality leaderboard by provider.
- **VLM vs OCR+LLM pathway comparison analytics**.
- **Hallucination pattern analysis dashboard**.
- Self-check prompt layer only as advisory, never source of truth.

### 22.3 Team Collaboration Features
- Comments on review items.
- Mentions and task assignment.
- Activity timeline.
- Approval workflow levels.
- Project roles and permissions.
- Shared saved filters.

### 22.4 Enterprise Features
- SSO/SAML.
- SCIM user provisioning.
- Tenant isolation.
- Audit export.
- Data residency controls.
- Customer-managed encryption keys.
- Private deployment option.

### 22.5 NEW: Agentic Document Workflow Features
- Multi-step workflow orchestrator with visual pipeline editor.
- Conditional routing based on page characteristics.
- Agent-based quality scoring that adapts routing decisions over time.
- Cross-document reasoning (e.g., link answer keys to question pages across separate documents).
- Workflow templates for common exam formats.
- Human-in-the-loop checkpoints at configurable pipeline stages.

---

## 23. Security Plan

### 23.1 Core Security Controls
- TLS everywhere.
- Encrypted secrets storage (at rest and in transit).
- Role-based access control with resource-level scoping.
- Object storage access isolation (per-workspace prefixes).
- Signed URLs for private artifacts (with TTL).
- Secure session handling.
- CSRF protections.
- Rate limiting on auth and sensitive endpoints.
- Audit logs for admin actions.
- Secret redaction in logs.
- **NEW: Helmet.js** for HTTP security headers.
- **NEW: Input sanitization** at every API boundary.

### 23.2 Provider Key Security
- Store encrypted at rest (AES-256 or KMS-backed).
- Never expose full key after creation (show masked preview only).
- Test-connection flow without leaking secrets.
- Per-workspace key scoping.
- Key rotation tooling with zero-downtime swap.

### 23.3 Data Security
- File size limits and MIME validation.
- Checksum validation on upload.
- Antivirus/malware scan hook (ClamAV or cloud equivalent).
- Optional PII-aware masking mode.
- Data retention and purge jobs (configurable per workspace).

---

## 24. Performance & Scalability Plan

### 24.1 Core Rule
Never process huge PDFs synchronously through the web server.

### 24.2 Scale Strategy
- Queue-based job execution (BullMQ).
- Chunk-level tasks for parallel processing.
- Horizontal worker scaling.
- Bounded concurrency per queue.
- Provider-aware throttling (respect rate limits).
- Object storage for large artifacts.
- Caching for page previews, OCR artifacts, and repeated provider calls.
- **NEW: Priority queues** — premium workspaces or critical jobs get priority.
- **NEW: Backpressure controls** — slow down ingestion when workers are saturated.

### 24.3 Performance Features
- Resumable uploads (tus protocol).
- Streaming downloads for large exports.
- Incremental export generation.
- Lazy page preview loading.
- Pagination across all heavy grids.
- Worker autoscaling (K8s HPA or similar).
- **NEW: Connection pooling** for Redis and Postgres.
- **NEW: Query optimization** with proper indexing strategy.

---

## 25. Observability & Reliability Plan

### 25.1 Logging
- Structured JSON logs.
- Correlation IDs across the full pipeline.
- Job IDs and task IDs in every log entry.
- Provider request metadata (sanitized).
- Review action audit entries.

### 25.2 Metrics
- Uploads per hour.
- Pages processed per provider.
- OCR latency, VLM latency, LLM latency.
- Validation failure rate.
- Hallucination detection rate (NEW).
- Review backlog.
- Export success rate.
- Cost per job, cost per record.

### 25.3 Alerting
- Provider auth failures.
- Queue backlog spikes.
- Worker crash loops.
- Storage threshold alerts.
- Export failure alerts.
- Unusual validation spikes.
- **NEW: Hallucination rate spike**.
- **NEW: Cost anomaly detection**.
- **NEW: Provider latency degradation**.

### 25.4 Reliability Features
- Retry with exponential backoff.
- Idempotent task design.
- Dead-letter queue for irrecoverable failures.
- Partial result preservation.
- Resumable jobs after restart.
- Recovery dashboard.
- **NEW: Circuit breaker** for provider calls.
- **NEW: Graceful worker shutdown** on SIGINT/SIGTERM.

---

## 26. Frontend UX Plan

### 26.1 Main Screens
1. Sign in.
2. Workspace switcher.
3. Dashboard.
4. Projects.
5. Upload center.
6. Documents list.
7. Document detail view (with page previews).
8. Job detail view (with pipeline visualization).
9. Review queue.
10. Review detail pane (side-by-side compare).
11. Provider settings (with health/benchmark tabs).
12. Export center (with LMS format selection).
13. Analytics dashboard (with cost intelligence).
14. Notifications center.
15. Admin/security center.
16. Audit logs.
17. Diagnostics/status page.
18. **NEW: Semantic search** page.
19. **NEW: Prompt management** page.

### 26.2 Dashboard Widgets
- Active jobs.
- Review backlog.
- Provider health.
- Export-ready count.
- Flagged record trends.
- Cost/usage snapshot.
- Team productivity snapshot.
- **NEW: Hallucination rate trend**.
- **NEW: VLM vs OCR pathway distribution**.

### 26.3 UX Standards
- Fast filters.
- Keyboard shortcuts (configurable).
- Dark mode.
- Accessible contrast (WCAG 2.1 AA).
- Responsive layouts.
- Optimistic UI where safe.
- Empty states and error states designed well.
- Clear progress states for long-running jobs.
- **NEW: Command palette** (cmdk) for power users.
- **NEW: Saved views** per user.
- **NEW: Onboarding tours** for new users.

---

## 27. Background Job Design

### 27.1 Queue Types
- File preprocess queue.
- Page image rendering queue (NEW).
- OCR queue.
- VLM extraction queue (NEW).
- Segmentation queue.
- LLM extraction queue.
- Validation queue.
- Hallucination detection queue (NEW).
- Review sync queue.
- Export queue (JSON, QTI, SCORM, xAPI).
- Notification queue.
- Cost attribution queue (NEW).
- Semantic indexing queue (NEW).
- Cleanup/retention queue.

### 27.2 Job State Machine
- `queued`
- `preprocessing`
- `rendering_pages` (NEW)
- `routing` (NEW — deciding OCR vs VLM pathway)
- `awaiting_ocr`
- `ocr_processing`
- `awaiting_vlm` (NEW)
- `vlm_processing` (NEW)
- `segmenting`
- `extracting`
- `validating`
- `hallucination_checking` (NEW)
- `review_required`
- `export_ready`
- `completed`
- `failed`
- `paused`
- `canceled`

### 27.3 Retry Rules
- Retry transient provider/network errors with exponential backoff.
- Do not auto-retry invalid input endlessly (max 3 attempts).
- Send non-recoverable errors to dead-letter queue.
- Per-provider retry policy.
- **NEW: "Re-run only failed pages" mode**.
- **NEW: "Re-run only flagged items" mode**.
- **NEW: Emergency pause all jobs** button.

---

## 28. Provider Abstraction Plan

### 28.1 Provider Categories
- **OCR provider** (Tesseract, Google Document AI, Azure, AWS Textract, PaddleOCR).
- **Document AI provider** (Google Document AI, Azure AI Document Intelligence).
- **LLM structured extraction provider** (OpenAI, Anthropic, Gemini, Mistral, DeepSeek).
- **VLM document understanding provider (NEW)** (GPT-4.1 Vision, Gemini 2.5 Pro, Claude Vision, Qwen 2.5 VL, LLaMA 3.2 Vision).
- **Document parser provider (NEW)** (PyMuPDF4LLM, LlamaParse, Reducto, Unstructured.io).
- **Embedding provider (NEW)** (OpenAI embeddings, Cohere, local SentenceTransformers).

### 28.2 Common Provider Interface
```typescript
interface ProviderAdapter {
  name: string;
  category: 'ocr' | 'document_ai' | 'llm' | 'vlm' | 'parser' | 'embedding';
  models: string[];
  capabilities: string[];
  healthCheck(): Promise<HealthStatus>;
  estimateCost(input: CostEstimateInput): CostEstimate;
  execute(input: ProviderInput): Promise<ProviderOutput>;
  getRetryPolicy(): RetryPolicy;
  getRateLimits(): RateLimitConfig;
}
```

### 28.3 Added Features
- Provider benchmarking harness.
- Shadow-mode provider comparison (A/B testing).
- Auto-fallback chain builder.
- Capability matrix UI.
- **NEW: Cost-per-token and cost-per-page** tracking per provider.
- **NEW: Provider leaderboard** by accuracy, speed, and cost.

---

## 29. Search, Discovery, and Semantic Intelligence

### 29.1 Search Features
- Search projects.
- Search documents.
- Search extracted question text (full-text search with pg_trgm).
- Search flags and review notes.
- Search provider incidents.
- **NEW: Semantic search** across extracted question banks (using embeddings).

### 29.2 Discovery Features
- Similar question suggestions (embedding cosine similarity).
- Duplicate clustering (trigram + semantic).
- Cross-project search.
- Saved searches.
- **NEW: Topic-based question clustering** for curriculum analysis.
- **NEW: Difficulty distribution analysis** across question banks.

---

## 30. Analytics and Cost Intelligence Plan

### 30.1 Quality Analytics
- Records approved first-pass.
- Percentage requiring review.
- Top failure reasons.
- Provider comparison.
- Average reviewer edits per provider.
- **NEW: Hallucination rate by provider**.
- **NEW: VLM vs OCR+LLM quality comparison**.

### 30.2 Cost Analytics (Enhanced)
- OCR cost by project.
- LLM cost by provider/model.
- VLM cost by provider/model (NEW).
- Cost per page.
- Cost per export-ready record.
- Budget alerts.
- **NEW: Cost trend forecasting**.
- **NEW: Provider ROI comparison** (quality per dollar).
- **NEW: Pathway cost comparison** (OCR+LLM vs VLM).

### 30.3 Productivity Analytics
- Average review time.
- Backlog aging.
- Throughput per reviewer.
- Document turnaround time.

---

## 31. DevOps & Deployment Plan

### 31.1 Environments
- Local (Docker Compose).
- Development.
- Staging.
- Production.
- Enterprise/private deployment optionally later.

### 31.2 Deployment Shape
- Web app container (Next.js).
- API container (Express).
- Worker container(s) (horizontally scalable).
- Orchestrator container (NEW).
- PostgreSQL.
- Redis.
- Object storage (S3-compatible).
- Reverse proxy/load balancer.

### 31.3 CI/CD
- Lint (ESLint).
- Type check (TypeScript).
- Tests (Vitest, Playwright).
- Build.
- Security scan (npm audit, Snyk).
- Migration checks.
- Deploy pipeline.
- **NEW: Preview deployments** for PRs.
- **NEW: Migration rollback runbooks**.

---

## 32. Testing Strategy

### 32.1 Unit Tests
- Schemas and validators.
- Provider routers and adapters.
- Prompt builders.
- Export mappers (JSON, QTI, SCORM, xAPI).
- RBAC guards.
- Cost calculators.
- Hallucination detection rules.

### 32.2 Integration Tests
- Upload flow.
- Preprocess flow.
- OCR orchestration.
- VLM extraction flow (NEW).
- Extraction flow with mock providers.
- Review actions.
- Export generation (all formats).

### 32.3 End-to-End Tests
- Operator uploads files.
- Job completes.
- Review flagged items.
- Export approved items in QTI format.

### 32.4 Quality Regression Tests
- Golden dataset comparisons.
- OCR regression set.
- VLM extraction regression set (NEW).
- Duplicate detection regression.
- Answer key linking regression.
- Hallucination detection regression (NEW).

### 32.5 Performance Tests
- Large batch upload.
- High queue load.
- Massive review table paging.
- Export under load.

### 32.6 Security Tests
- Auth flows.
- RBAC checks.
- Secure upload validation.
- Secret exposure checks.

---

## 33. Delivery Roadmap

### Phase 0 — Foundation (Weeks 1–3)
- Repo setup with monorepo tooling (Turborepo).
- Design system basics (shadcn/ui + Tailwind).
- Auth skeleton (NextAuth/Auth.js).
- Database schema v1 (Drizzle + migrations).
- Object storage integration.
- Redis + BullMQ queue setup.
- Provider config framework with adapter interface.

### Phase 1 — MVP Core (Weeks 4–8)
- Upload center with drag-and-drop.
- Document registry.
- Preprocessing worker (page rendering, classification).
- OCR integration baseline (1–2 providers).
- LLM extraction worker baseline (1–2 providers).
- JSON schema v1.
- Validation rules v1.
- Review queue v1.
- Export JSON/JSONL v1.
- Basic analytics dashboard.
- Job progress UI.

### Phase 2 — VLM & Quality (Weeks 9–14)
- VLM document understanding pathway (NEW).
- VLM provider integration (2–3 providers).
- Answer-key linking improvements.
- Tiered hallucination detection (NEW).
- Review edit audit trail.
- Retries, dead-letter queue, diagnostics.
- Cost tracking and attribution (NEW).
- Provider health dashboards.
- CSV export with column mapping.
- QTI export v1 (NEW).
- Richer analytics.

### Phase 3 — LMS Standards & Scale (Weeks 15–20)
- SCORM export (NEW).
- xAPI export (NEW).
- cmi5 export (NEW).
- Multi-workspace maturity.
- Assignment workflows.
- Comments/mentions.
- Saved filters/views.
- Notifications.
- Semantic search and duplicate detection (NEW).
- Provider A/B testing framework.
- API/webhook integrations.

### Phase 4 — Enterprise & Intelligence (Weeks 21+)
- SSO/SAML.
- Audit export.
- Tenant branding.
- Policy engine for custom validation.
- Private deployment support.
- Advanced security controls.
- Agentic workflow orchestrator (NEW).
- Knowledge graph question clustering (NEW).
- Prompt management UI (NEW).

---

## 34. Suggested MVP Scope

The MVP should include:
- Authentication and RBAC.
- Projects and workspaces.
- PDF upload with preprocessing.
- OCR integration with 1–2 providers.
- LLM extraction with 1–2 providers.
- Validation rules v1.
- Review queue v1.
- JSON/JSONL export.
- Basic analytics.
- Provider config UI.
- Job progress UI.

Do **not** overload the MVP with:
- VLM pathway (add in Phase 2).
- QTI/SCORM/xAPI export (add in Phase 3).
- Agentic workflows (add in Phase 4).
- Semantic search (add in Phase 3).
- Multi-provider A/B testing (add in Phase 3).

---

## 35. Tech Stack Summary

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Recharts
- cmdk (command palette)
- Zustand (local state)

### Backend
- Node.js + Express + TypeScript
- Drizzle ORM
- BullMQ + Redis
- PostgreSQL
- Zod

### Document Processing
- PyMuPDF / PyMuPDF4LLM (native text extraction)
- LlamaParse / Reducto (advanced parsing)
- Tesseract / PaddleOCR (local OCR fallback)

### AI Providers
- OpenAI (GPT-4.1, GPT-4.1 Vision)
- Anthropic (Claude, Claude Vision)
- Google (Gemini 2.5 Pro, Gemma 3)
- Mistral
- DeepSeek
- Qwen 2.5 VL (self-hosted)
- LLaMA 3.2 Vision (self-hosted)
- Google Document AI
- Azure AI Document Intelligence
- AWS Textract

### LMS Export Standards
- QTI 2.1 / 3.0
- SCORM 1.2 / 2004
- xAPI (Tin Can API)
- cmi5
- LTI (future)

### Infra
- S3-compatible storage
- Docker + Docker Compose
- Reverse proxy (Nginx / Caddy)
- OpenTelemetry (observability)
- Turborepo (monorepo tooling)

### Quality / Tooling
- ESLint + Prettier
- Vitest (unit/integration)
- Playwright (E2E)
- OpenAPI docs (later)

---

## 36. Concrete Build Order

1. Define domain models and Zod schemas.
2. Set up monorepo with Turborepo and CI basics.
3. Build auth and RBAC.
4. Implement project/workspace model.
5. Implement upload and document registry.
6. Add preprocessing worker (page rendering, classification).
7. Add OCR orchestration (1–2 providers).
8. Add segmentation/extraction pipeline.
9. Add validation engine.
10. Add review queue UI.
11. Add export engine (JSON/JSONL/CSV).
12. Add analytics and diagnostics.
13. **Add VLM document understanding pathway.**
14. **Add tiered hallucination detection.**
15. **Add cost intelligence.**
16. **Add QTI/SCORM/xAPI export.**
17. **Add semantic search and duplicate detection.**
18. Harden observability and retries.
19. Add advanced provider routing and A/B testing.
20. **Add agentic workflow orchestration.**

---

## 37. Final Product Verdict

Your chosen stack — **Next.js/React frontend + Node.js/Express backend** — is a strong long-term choice for this product.

The v2.0 enhancements make this significantly more competitive:

- **VLM support** addresses the biggest limitation of traditional OCR+LLM pipelines: they fail on visually complex content. VLMs can understand tables, diagrams, and formulas directly from page images, dramatically improving extraction quality on hard documents.

- **Tiered hallucination architecture** moves beyond "hope the model doesn't hallucinate" to a systematic detection and mitigation framework at model, context, and data levels.

- **LMS standard exports** (QTI, SCORM, xAPI, cmi5) transform the platform from "export a JSON file" to "plug directly into any LMS in the world."

- **Cost intelligence** makes the platform operationally sustainable by giving teams visibility into what they're spending and where optimization opportunities exist.

- **Agentic workflows** position the platform for the 2026 trend of multi-agent orchestration, where specialized agents coordinate complex multi-step document understanding tasks.

The most important architectural decision remains:

> **Keep heavy document/OCR/VLM/LLM processing in background workers, not inside synchronous web requests.**

If you follow that principle and build around evidence-only extraction, tiered hallucination controls, validation, and review workflows, this can become a genuinely world-class document intelligence platform.

---

## 38. Recommended Next Deliverables After This Plan

1. **PRD.md** — Product Requirements Document.
2. **SYSTEM_ARCHITECTURE.md** — Technical Architecture Specification with diagrams.
3. **DATABASE_SCHEMA.md** — Full ERD with Drizzle schema definitions.
4. **API_CONTRACT.md** — OpenAPI spec draft for all endpoints.
5. **UI_WIREFRAMES.md** — Wireframe pack for key screens.
6. **JSON_SCHEMA_PACK.md** — Zod schemas for MCQ records, validation reports, exports.
7. **QTI_EXPORT_SPEC.md** — QTI 2.1/3.0 mapping specification (NEW).
8. **PROMPT_PACK.md** — Extraction prompts for all task types.
9. **PROVIDER_ADAPTER_SPEC.md** — Interface definitions for all provider categories.
10. **MONOREPO_SCAFFOLD** — Initial codebase with all packages.
11. **MVP_SPRINT_PLAN.md** — Sprint-by-sprint breakdown.
12. **GOLDEN_DATASET.md** — Benchmark dataset for quality regression testing (NEW).
13. **COST_MODEL.md** — Per-operation cost estimates for budgeting (NEW).

---

## 39. Key Differences: v1.0 vs v2.0

| Area | v1.0 | v2.0 (Enhanced) |
|------|------|-----------------|
| Document Understanding | OCR + LLM only | OCR + LLM + VLM (dual pathway) |
| Hallucination Control | Basic rules | Tiered 3-level architecture (model/context/data) |
| LMS Export | JSON/JSONL/CSV | + QTI, SCORM, xAPI, cmi5 |
| Cost Tracking | Not included | Per-record cost attribution + budgets |
| Duplicate Detection | Basic checksum | + Semantic similarity (embeddings) |
| Workflow Architecture | Simple pipeline | Agentic orchestration with conditional routing |
| Provider Management | Config + fallback | + A/B testing, shadow mode, benchmarking |
| Search | Basic text search | + Semantic search, question clustering |
| Confidence Model | Simple label | Composite 0–100 score with breakdown |
| Document Parsing | Generic text extraction | PyMuPDF4LLM Markdown + LlamaParse |

---

_End of document. Version 2.0 — March 2026._
