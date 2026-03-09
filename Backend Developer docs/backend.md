# Backend Design — MCQ Extraction Platform v2.0

## Document Purpose

This document specifies backend scope, service responsibilities, business logic domains, worker design, validation, auth, error handling, scaling, and module boundaries.

---

## 1. Backend Scope

The backend consists of three deployable applications sharing code through monorepo packages:

1. **API Server** (apps/api) — Express + TypeScript REST API handling all client-facing requests, authentication, authorization, CRUD, job orchestration, and export triggers.
2. **Worker Service** (apps/worker) — BullMQ workers processing background jobs: preprocessing, OCR, VLM, LLM extraction, validation, hallucination detection, export generation, notifications, cost attribution, semantic indexing.
3. **Orchestrator** (apps/orchestrator) — Agentic workflow coordinator managing multi-step pipeline state machines, conditional routing, and agent coordination (Phase 4; simple sequential pipelines in MVP).

---

## 2. Service Responsibilities

### 2.1 API Server

| Domain | Responsibilities |
|--------|-----------------|
| Auth | Sign in/out, session management, token issuance, RBAC enforcement |
| Users | User CRUD, role assignment, workspace membership |
| Workspaces | Workspace CRUD, settings, data isolation |
| Projects | Project CRUD, extraction profiles, quality thresholds |
| Providers | Provider CRUD, test connections, encrypted key management, health checks |
| Documents | Document registration, metadata, page listing, preview URLs |
| Uploads | Presigned URL generation, upload completion handling, checksum verification |
| Jobs | Job creation, status queries, pause/resume/cancel/retry |
| Review | Review item listing with filtering, approve/reject/edit/reprocess |
| Exports | Export job creation, format selection, download URL generation |
| Analytics | Pre-aggregated metrics, provider comparison, cost analytics |
| Cost | Cost reports, budget status, per-job cost breakdown |
| Notifications | Notification listing, mark-read, preference management |
| Semantic | Search, duplicate finder, cluster queries |
| Health | Liveness/readiness endpoints, service status |
| Admin | Audit logs, diagnostics, system configuration |

### 2.2 Worker Service

| Worker | Input | Output | External Dependencies |
|--------|-------|--------|-----------------------|
| Preprocessing | Document ID | Page metadata, images, classification, routing plan | S3 (write page images), Python parser service |
| Page Image Rendering | Document ID + page range | Rendered page images at configured DPI | Python parser service (PyMuPDF) |
| OCR | Page ID + routing config | OCR text, confidence, artifacts | OCR provider APIs |
| VLM Extraction | Page image + extraction prompt | Structured JSON MCQ output | VLM provider APIs |
| Segmentation | Raw text or VLM output per page | MCQ candidate blocks with boundaries | None (internal logic) |
| LLM Extraction | MCQ candidates + prompt | Structured JSON MCQ records | LLM provider APIs |
| Validation | MCQ records | Flagged records with validation results | PostgreSQL (duplicate checks) |
| Hallucination Detection | MCQ records + validation results | Hallucination risk scores, events | Golden datasets (DB), provider comparison |
| Export | Approved records + format config | Export artifacts (files/packages) | S3 (write exports) |
| Notification | Notification events | Delivered notifications | Email service, in-app DB writes |
| Cost Attribution | Job completion events | Per-record cost records | Provider cost data |
| Semantic Indexing | Approved MCQ records | Embedding vectors | Embedding provider APIs |
| Cleanup/Retention | Retention policy configs | Deleted expired data | S3, PostgreSQL |

### 2.3 Orchestrator (Phase 4)

- Maintains workflow state machine per job
- Routes pages to appropriate worker queues based on preprocessing results
- Handles conditional branching (OCR vs VLM pathway)
- Manages human-in-the-loop checkpoints
- Tracks aggregate job progress

**For MVP (Phases 0–1):** Simple sequential job flow without orchestrator. The API server enqueues the first pipeline step, and each worker enqueues the next step upon completion. This is a simpler chain pattern.

---

## 3. Business Logic Domains

### 3.1 Domain Map

| Domain | Package | Key Logic |
|--------|---------|-----------|
| Extraction | packages/extraction-core | Prompt management, prompt versioning, extraction schema definitions |
| Validation | packages/validation-core | Schema rules, field rules, business rules, evidence checks, duplicate detection, composite scoring |
| Hallucination | packages/hallucination-core | Model-tier checks, context-tier checks, data-tier checks, consensus voting, risk tier assignment |
| Export | packages/export-core | JSON/CSV mappers, QTI XML generation, SCORM packaging, xAPI statement generation, cmi5 packaging |
| Provider | packages/provider-sdk | Adapter interface, provider-specific implementations, fallback chains, rate limit management, cost estimation |
| Cost | packages/cost-intelligence | Per-operation cost calculation, per-record attribution, budget enforcement, cost reporting |
| Semantic | packages/semantic-engine | Embedding generation, similarity search, clustering, duplicate scoring |
| Auth | packages/auth-core | RBAC guards, permission checks, workspace scoping utilities |
| Observability | packages/observability | Structured logger, correlation ID middleware, OpenTelemetry integration |

### 3.2 Core Business Rules

1. **Evidence-only extraction** — every MCQ record must include source_pdf, source_page, source_excerpt.
2. **Null-on-uncertainty** — uncertain fields must be null, never guessed.
3. **Mandatory review triggers** — OCR confidence below threshold, VLM/OCR disagreement, malformed options, high hallucination risk.
4. **Export gating** — only approved or export-ready records can be exported. Flagged records excluded unless explicitly included.
5. **Provider key security** — keys encrypted at rest, never exposed in API responses after creation.
6. **Workspace isolation** — all queries scoped to workspace_id. Cross-workspace data access prohibited except for Super Admin.
7. **Idempotent operations** — job tasks must be safe to retry without duplication.

---

## 4. Workflow Processing

### 4.1 Job Pipeline (MVP — Chain Pattern)

```
API creates Job → enqueue(preprocess)
  → Preprocessing Worker completes → enqueue(ocr) per page that needs OCR
  → OCR Worker completes → enqueue(segment) per page group
  → Segmentation Worker completes → enqueue(extract) per MCQ candidate batch
  → LLM Extraction Worker completes → enqueue(validate) per record batch
  → Validation Worker completes → update Job status
      → If flags exist: create ReviewItems, set status = review_required
      → If clean: set status = export_ready
```

### 4.2 Job Pipeline (Phase 2+ — With VLM Routing)

After preprocessing, the routing decision determines per-page whether to queue OCR or VLM:

```
Preprocessing → for each page:
  if visual_complexity > threshold OR text_layer_missing:
    enqueue(vlm_extraction, page_image)
  else:
    enqueue(ocr, page)

Both pathways converge at Segmentation → Extraction → Validation → Hallucination Detection
```

### 4.3 Progress Tracking

- Each Job has `total_tasks` and `completed_tasks` counters.
- Workers update task completion atomically.
- Frontend polls `GET /jobs/:id` for progress percentage.
- Job status transitions are recorded in JobTask table.

---

## 5. Validation and Rule Enforcement

### 5.1 Validation Pipeline

```
Input: MCQ Record
  ↓
1. Schema Validation (Zod) — structural correctness
  ↓
2. Field Validation — non-empty question, valid labels, answer consistency
  ↓
3. Business Rule Validation — min 2 options, source page present, non-trivial excerpt
  ↓
4. Evidence Sufficiency — excerpt length check, page image reference check
  ↓
5. Duplicate Detection — exact (checksum), near (trigram), semantic (embedding, Phase 3)
  ↓
6. Cross-Record Consistency — sequential numbering, option pattern consistency
  ↓
7. Hallucination Risk Scoring — composite of model/context/data tier signals
  ↓
8. Export Readiness Score — weighted composite 0–100
  ↓
Output: Validated MCQ Record with flags[], confidence, hallucination_risk_tier
```

### 5.2 Validation Rule Registry

Rules should be implemented as composable functions registered in a rule engine:

```typescript
interface ValidationRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'schema' | 'field' | 'business' | 'evidence' | 'duplicate' | 'hallucination';
  validate(record: MCQRecord, context: ValidationContext): ValidationResult;
}
```

This enables the Phase 4 policy engine to add client-specific rules without modifying core logic.

---

## 6. Authentication and Authorization

### 6.1 Auth Flow

- NextAuth/Auth.js handles session management.
- API receives session token (cookie or Bearer) on every request.
- Auth middleware validates session and attaches user to request context.
- RBAC middleware checks user role against endpoint permission requirements.

### 6.2 Permission Model

| Permission | Super Admin | Workspace Admin | Operator | Reviewer | Analyst | API User |
|------------|:-----------:|:---------------:|:--------:|:--------:|:-------:|:--------:|
| Manage global settings | Yes | — | — | — | — | — |
| Provision workspaces | Yes | — | — | — | — | — |
| Manage workspace settings | Yes | Yes | — | — | — | — |
| Manage users | Yes | Yes | — | — | — | — |
| Configure providers | Yes | Yes | — | — | — | — |
| Create projects | Yes | Yes | Yes | — | — | — |
| Upload documents | Yes | Yes | Yes | — | — | Yes |
| Launch jobs | Yes | Yes | Yes | — | — | Yes |
| View job status | Yes | Yes | Yes | Yes | Yes | Yes |
| Review records | Yes | Yes | — | Yes | — | — |
| Export data | Yes | Yes | Yes | — | — | Yes |
| View analytics | Yes | Yes | — | — | Yes | — |
| View audit logs | Yes | Yes | — | — | — | — |

### 6.3 Resource Scoping

Every database query and API response must be scoped to the user's workspace(s). Implementation approach:

- Drizzle query builder middleware that automatically adds `WHERE workspace_id = ?`.
- API-level guard that validates the requested resource belongs to the user's workspace.
- Object storage paths prefixed by workspace ID.

---

## 7. Background Jobs and Workers

### 7.1 Queue Configuration

| Queue Name | Concurrency | Max Retries | Backoff | Priority |
|------------|-------------|-------------|---------|----------|
| preprocess | 5 | 3 | Exponential (1s base) | Normal |
| page-render | 10 | 3 | Exponential (1s base) | Normal |
| ocr | 3 | 3 | Exponential (2s base) | Normal |
| vlm-extraction | 2 | 3 | Exponential (5s base) | Normal |
| segmentation | 5 | 2 | Fixed (1s) | Normal |
| llm-extraction | 3 | 3 | Exponential (2s base) | Normal |
| validation | 5 | 2 | Fixed (1s) | Normal |
| hallucination-check | 3 | 2 | Fixed (2s) | Normal |
| export | 3 | 3 | Exponential (2s base) | Low |
| notification | 5 | 3 | Exponential (1s base) | Low |
| cost-attribution | 5 | 2 | Fixed (1s) | Low |
| semantic-indexing | 2 | 3 | Exponential (2s base) | Low |
| cleanup | 1 | 1 | None | Lowest |

### 7.2 Worker Production Configuration

```typescript
// BullMQ worker configuration (production)
const workerConfig = {
  connection: {
    maxRetriesPerRequest: null, // Required for BullMQ workers
  },
  removeOnComplete: { count: 1000 }, // Prevent Redis memory bloat
  removeOnFail: { count: 5000 },     // Keep some failed jobs for debugging
};
```

### 7.3 Graceful Shutdown

Workers must handle SIGINT/SIGTERM:
1. Stop accepting new jobs.
2. Wait for in-progress jobs to complete (with timeout).
3. Save partial progress for resumability.
4. Close connections cleanly.

### 7.4 Dead-Letter Queue

Jobs that exhaust all retries move to a dead-letter queue per worker type. Dead-letter jobs:
- Are visible in the admin diagnostics UI.
- Include full error context (stack trace, provider response, input summary).
- Can be manually retried or dismissed by admins.

---

## 8. Integration Responsibilities

### 8.1 Provider Integration

All provider integrations go through the ProviderAdapter interface:

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

Workers resolve the appropriate provider adapter from configuration, call `execute()`, handle errors via the adapter's retry policy, and record cost/latency/token usage metadata.

### 8.2 Python Parser Service Integration

**Inference:** The planning document specifies PyMuPDF/PyMuPDF4LLM and PaddleOCR (Python tools) but the backend is Node.js. A bridge is required.

**Recommended approach:** A lightweight Python FastAPI microservice deployed as a sidecar container:

- Exposes endpoints: `POST /parse/text` (native text extraction), `POST /parse/render` (page image rendering), `POST /parse/metadata` (file metadata)
- Called by the Preprocessing and Page Rendering workers via HTTP
- Health check endpoint for container orchestrator
- Scales independently of Node.js workers

### 8.3 Object Storage Integration

- PDF uploads: presigned PUT URLs generated by API, files uploaded directly from browser
- Page images: written by preprocessing worker, read by frontend (presigned GET URLs)
- OCR/VLM artifacts: written by workers, read by downstream workers
- Export artifacts: written by export worker, read by users (presigned GET URLs with TTL)
- Path convention: `{workspace_id}/{document_id}/{artifact_type}/{filename}`

---

## 9. Error Handling Strategy

| Error Type | Handling |
|------------|----------|
| Validation errors (client input) | Return 400 with Zod error details; structured error response |
| Authentication failures | Return 401; log attempt with IP |
| Authorization failures | Return 403; log attempt with user and resource |
| Resource not found | Return 404 |
| Provider API errors (4xx) | Return to worker for retry (if retryable) or dead-letter |
| Provider API errors (5xx) | Retry with exponential backoff; circuit breaker if persistent |
| Provider rate limiting (429) | Respect Retry-After header; queue-level throttling |
| Worker processing errors | Retry per policy; dead-letter on exhaustion; log with correlation ID |
| Database errors | Return 500; log with full context; alert on repeated failures |
| File storage errors | Retry; log with path and operation details |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [],
    "correlationId": "uuid"
  }
}
```

---

## 10. Logging and Monitoring

- **Logger:** Structured JSON logger (pino or winston) with correlation ID in every log entry.
- **Correlation ID:** Generated at API request entry point; propagated through queue job data to workers.
- **Log levels:** debug, info, warn, error, fatal.
- **Sensitive data:** Provider API keys, user passwords, and PII never logged. Secrets redacted by logger middleware.
- **Request logging:** Method, path, status code, latency, user ID (not request body for security).
- **Worker logging:** Queue name, job ID, task ID, provider used, latency, cost, success/failure.
- **Metrics emission:** OpenTelemetry-compatible metrics for queue depth, worker throughput, provider latency, error rates.

---

## 11. Performance Considerations

| Concern | Strategy |
|---------|----------|
| API response latency | PostgreSQL connection pooling; efficient queries; avoid N+1; paginate all list endpoints |
| Large file handling | Direct-to-S3 uploads; streaming downloads; never load full files into API memory |
| Database connection exhaustion | PgBouncer for connection pooling; bounded pool size |
| Queue depth under load | Backpressure controls: reject new job submissions when queue exceeds threshold |
| Provider latency variability | Timeout configurations per provider; circuit breaker for persistently slow providers |
| Review table performance | Database indexes on workspace_id, status, severity, confidence; cursor-based pagination |
| Analytics query performance | Pre-aggregate common metrics; materialized views or summary tables |
| Export generation | Streaming file writes; chunked processing; never build entire export in memory |

---

## 12. Concurrency Considerations

- **API server:** Runs behind a reverse proxy; Node.js event loop handles concurrent requests. Stateless — horizontally scalable.
- **Workers:** BullMQ handles job distribution across worker instances. Concurrency per worker configured per queue (see Section 7.1).
- **Database writes:** Use transactions for multi-record operations (e.g., batch validation result writes). Use `SELECT ... FOR UPDATE` only where necessary (e.g., job status transitions).
- **Optimistic vs pessimistic locking:** Use optimistic locking (version column) for review edits to prevent lost updates when two reviewers edit the same record.
- **Rate limit enforcement:** Per-provider rate limiting enforced at the worker level using a token bucket or sliding window counter in Redis.

---

## 13. Caching Opportunities

| Data | Cache Strategy | TTL |
|------|---------------|-----|
| Provider health status | Redis cache | 60 seconds |
| User session | Redis (NextAuth session store) | Session duration |
| Analytics aggregations | Redis cache | 5 minutes |
| Page image presigned URLs | Short-lived; regenerate on each request | No cache (15 min URL TTL) |
| Provider rate limit counters | Redis | Per-provider sliding window |
| Document metadata | TanStack Query (client-side) | 30 seconds |

---

## 14. Recommended Module Boundaries

```
apps/api/
├── src/
│   ├── server.ts                   # Express app setup
│   ├── config/                     # Environment config, constants
│   ├── middleware/
│   │   ├── auth.ts                 # Session validation
│   │   ├── rbac.ts                 # Role-based access guards
│   │   ├── workspace-scope.ts      # Workspace isolation middleware
│   │   ├── error-handler.ts        # Global error handler
│   │   ├── correlation-id.ts       # Correlation ID generation
│   │   ├── rate-limiter.ts         # Rate limiting
│   │   └── request-logger.ts       # Request logging
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── workspace.routes.ts
│   │   ├── project.routes.ts
│   │   ├── document.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── job.routes.ts
│   │   ├── review.routes.ts
│   │   ├── export.routes.ts
│   │   ├── provider.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── cost.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── semantic.routes.ts
│   │   ├── health.routes.ts
│   │   └── admin.routes.ts
│   ├── services/                   # Business logic per domain
│   ├── repositories/               # Database access per entity
│   └── validators/                 # Request-level Zod schemas

apps/worker/
├── src/
│   ├── index.ts                    # Worker startup, queue registration
│   ├── config/
│   ├── workers/
│   │   ├── preprocess.worker.ts
│   │   ├── page-render.worker.ts
│   │   ├── ocr.worker.ts
│   │   ├── vlm.worker.ts
│   │   ├── segmentation.worker.ts
│   │   ├── llm-extraction.worker.ts
│   │   ├── validation.worker.ts
│   │   ├── hallucination.worker.ts
│   │   ├── export.worker.ts
│   │   ├── notification.worker.ts
│   │   ├── cost.worker.ts
│   │   ├── semantic.worker.ts
│   │   └── cleanup.worker.ts
│   └── utils/
```

---

## 15. Backend Risks and Dependencies

| Risk | Severity | Mitigation |
|------|----------|------------|
| Python parser service availability | High | Health checks, retry on failure, fallback to Tesseract.js for basic text extraction |
| Redis single point of failure | High | Managed Redis with replication or Redis Sentinel |
| Provider API key rotation without downtime | Medium | Key versioning: new key added before old key retired |
| BullMQ memory leaks in long-running workers | Medium | `removeOnComplete`/`removeOnFail`; periodic worker restart; memory monitoring |
| Database migration failures | Medium | Migration rollback runbooks; test migrations against staging data copy |
| Cross-workspace data leaks | High | Mandatory workspace_id scoping; integration tests for isolation |
| Cost calculation accuracy | Medium | Log all provider responses with token counts; reconcile against provider invoices |
| Prompt versioning divergence | Low | Store prompts in DB with version history; association between records and prompt version used |
