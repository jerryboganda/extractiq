# Backend & API Developer Onboarding & Instructions

## For: MCQ Extraction Platform v2.0
## Audience: Backend & API Developer

---

## 1. Read These First

Read in this exact order before writing any code:

1. **executive-summary.md** — Understand what we're building and why
2. **architecture-design.md** — System topology, queue-driven async design, architecture decisions
3. **backend.md** — Your primary spec (apps, workers, queues, modules, RBAC, validation)
4. **apis.md** — The API contract you own (145 endpoints, conventions, error format)
5. **databases.md** — Full data model (25+ entities, indexes, migrations, ER diagram)
6. **security.md** — Authentication, authorization, encryption, audit logging
7. **integration-dependencies.md** — Provider adapter contracts, external service specs
8. **delivery-roadmap.md** — What to build per phase (don't build Phase 2 things in Phase 1)

---

## 2. Tech Stack (Non-Negotiable)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | **Node.js 20 LTS** | LTS only. No experimental features in production. |
| Language | **TypeScript (strict mode)** | `strict: true` in every tsconfig. No `any`. No `as` type assertions unless absolutely unavoidable with a comment explaining why. |
| API Framework | **Express.js** | With typed request/response wrappers. |
| ORM | **Drizzle ORM** | Type-safe SQL. No raw SQL queries unless Drizzle cannot express the query. |
| Database | **PostgreSQL 16+** | With `pg_trgm` (fuzzy search) and `pgvector` (embeddings, Phase 3+) extensions. |
| Queue | **BullMQ** | All async processing goes through BullMQ queues. Redis-backed. |
| Cache / Queue Backend | **Redis 7+** | Sessions, rate limiting, queue backend, caching. |
| Object Storage | **S3-compatible** | MinIO locally, S3 in production. Use `@aws-sdk/client-s3`. |
| Validation | **Zod** | Every API input validated by a Zod schema. Every provider response validated. |
| Logging | **pino** (recommended) or **winston** | Structured JSON to stdout. No `console.log`. |
| Testing | **Vitest** | Unit + integration tests. |
| Monorepo | **Turborepo** | `apps/` for deployable services; `packages/` for shared logic. |

---

## 3. System Architecture

```
                          ┌──────────────┐
                          │   Next.js    │
                          │   Frontend   │
                          └──────┬───────┘
                                 │ REST API (HTTPS)
                          ┌──────▼───────┐
                          │  Express API │ ← apps/api
                          │   Server     │
                          └──┬───┬───┬───┘
                             │   │   │
              ┌──────────────┘   │   └──────────────┐
              │                  │                   │
        ┌─────▼─────┐    ┌──────▼──────┐    ┌───────▼───────┐
        │ PostgreSQL │    │    Redis    │    │  S3 / MinIO   │
        │            │    │(queues,     │    │(PDFs, images, │
        └────────────┘    │ sessions,   │    │ artifacts)    │
                          │ rate limit) │    └───────────────┘
                          └──────┬──────┘
                                 │ BullMQ
                          ┌──────▼───────┐
                          │   Workers    │ ← apps/worker
                          │(OCR, LLM,   │
                          │ VLM, export) │
                          └──────┬───────┘
                                 │ HTTP
                          ┌──────▼───────┐
                          │Python Parser │ ← apps/parser (FastAPI)
                          │(PyMuPDF,     │
                          │ PaddleOCR)   │
                          └──────────────┘
```

### 3.1 Deployable Apps

| App | Path | Role | Port |
|-----|------|------|------|
| API Server | `apps/api` | HTTP REST API, auth, RBAC, CRUD, job enqueueing | 4000 |
| Worker | `apps/worker` | BullMQ job processing (OCR, LLM, VLM, validation, export) | N/A (no HTTP) |
| Parser | `apps/parser` | Python FastAPI service for PDF parsing (PyMuPDF) | 5000 |
| Orchestrator | `apps/orchestrator` | Multi-step pipeline orchestration (Phase 4 only) | 4200 |

### 3.2 Core Rule: API Server Does Not Do Heavy Work

```
✅ API Server responsibilities:
   - Receive HTTP requests
   - Validate input (Zod)
   - Check auth + RBAC
   - Read/write database (simple CRUD)
   - Enqueue BullMQ jobs
   - Generate signed S3 URLs
   - Return responses

❌ API Server must NEVER:
   - Call AI provider APIs directly
   - Parse PDF documents
   - Run OCR/LLM/VLM extraction
   - Generate export files
   - Run long-running computations (>2 seconds)

Everything slow goes through BullMQ → Worker processes it.
```

---

## 4. Monorepo Package Structure

```
packages/
├── shared-types/        # TypeScript type definitions shared across all apps
│   ├── src/
│   │   ├── entities/    # User, Document, MCQRecord, Job, etc.
│   │   ├── api/         # Request/response types per endpoint
│   │   ├── queue/       # Job payload types
│   │   └── enums/       # Status enums, role enums
│   └── package.json
│
├── db/                  # Drizzle ORM schema + migrations + query utilities
│   ├── src/
│   │   ├── schema/      # One file per entity (users.ts, documents.ts, etc.)
│   │   ├── migrations/  # Drizzle-generated migration files
│   │   ├── seed/        # Seed data for development
│   │   └── index.ts     # Drizzle client export
│   └── drizzle.config.ts
│
├── queue/               # BullMQ queue definitions + job types
│   ├── src/
│   │   ├── queues/      # One file per queue (ocr.queue.ts, llm.queue.ts, etc.)
│   │   ├── types/       # Job data types
│   │   └── index.ts     # Queue factory + connection
│   └── package.json
│
├── auth/                # Auth + RBAC middleware
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts         # Session validation
│   │   │   └── rbac.middleware.ts         # Role + permission check
│   │   ├── session.ts                    # Redis session management
│   │   └── password.ts                   # bcrypt hashing + verification
│   └── package.json
│
├── storage/             # S3 client wrapper
│   ├── src/
│   │   ├── s3-client.ts                  # Configured S3 client
│   │   ├── signed-urls.ts                # Generate signed PUT/GET URLs
│   │   └── lifecycle.ts                  # Bucket lifecycle rules
│   └── package.json
│
├── logger/              # Structured JSON logging
│   ├── src/
│   │   ├── logger.ts                     # Pino logger factory
│   │   └── pii-masking.ts               # PII redaction serializers
│   └── package.json
│
├── config/              # Environment-aware configuration
│   ├── src/
│   │   ├── config.ts                     # Zod-validated env vars
│   │   └── index.ts
│   └── package.json
│
├── validators/          # Zod schemas for API input + MCQ data validation
│   ├── src/
│   │   ├── api/         # One file per API domain (documents.schema.ts, etc.)
│   │   ├── mcq/         # MCQ field validation rules
│   │   └── pipeline.ts  # 8-stage validation pipeline
│   └── package.json
│
├── provider-adapters/   # AI provider adapter implementations
│   ├── src/
│   │   ├── interface.ts                  # ProviderAdapter interface
│   │   ├── adapters/
│   │   │   ├── ocr/
│   │   │   │   ├── google-vision.adapter.ts
│   │   │   │   ├── aws-textract.adapter.ts
│   │   │   │   └── tesseract.adapter.ts
│   │   │   ├── llm/
│   │   │   │   ├── openai.adapter.ts
│   │   │   │   ├── anthropic.adapter.ts
│   │   │   │   └── gemini.adapter.ts
│   │   │   └── vlm/
│   │   │       ├── openai-vision.adapter.ts
│   │   │       └── claude-vision.adapter.ts
│   │   ├── registry.ts                   # Provider registry (lookup by ID)
│   │   └── factory.ts                    # Create adapter from ProviderConfig
│   └── package.json
│
├── confidence/          # Composite confidence scoring
│   ├── src/
│   │   ├── scorer.ts                     # Multi-signal score calculation
│   │   ├── signals/                      # Individual signal extractors
│   │   └── calibration.ts                # Score calibration utilities
│   └── package.json
│
├── hallucination/       # Hallucination detection engine
│   ├── src/
│   │   ├── detector.ts                   # Main detection orchestrator
│   │   ├── tiers/
│   │   │   ├── model-tier.ts             # Tier 1: model self-consistency
│   │   │   ├── context-tier.ts           # Tier 2: source grounding
│   │   │   └── data-tier.ts              # Tier 3: statistical checks
│   │   └── types.ts
│   └── package.json
│
├── export-engine/       # LMS export format generators
│   ├── src/
│   │   ├── generators/
│   │   │   ├── qti-2.1.generator.ts
│   │   │   ├── qti-3.0.generator.ts
│   │   │   ├── scorm-1.2.generator.ts
│   │   │   ├── scorm-2004.generator.ts
│   │   │   ├── xapi.generator.ts
│   │   │   └── cmi5.generator.ts
│   │   ├── registry.ts                   # Format registry
│   │   └── types.ts
│   └── package.json
│
├── cost-intelligence/   # Cost tracking + budget management
│   ├── src/
│   │   ├── cost.service.ts
│   │   ├── budget.service.ts
│   │   └── types.ts
│   └── package.json
│
└── test-fixtures/       # Shared test data + mocks
    ├── src/
    │   ├── factories/   # createUser(), createDocument(), createMCQRecord()
    │   ├── providers/   # Mock provider responses (success, error, edge cases)
    │   ├── pdfs/        # Sample test PDFs
    │   └── golden/      # Golden dataset expected outputs
    └── package.json
```

---

## 5. API Design Rules

### 5.1 Route Structure

All routes follow this pattern: `/api/v1/<resource>`

```
apps/api/src/
├── server.ts                    # Express app setup, middleware registration
├── middleware/
│   ├── error-handler.ts         # Global error handler (catches all, formats response)
│   ├── request-id.ts            # Generate unique request ID per request
│   ├── rate-limiter.ts          # Redis-backed sliding window rate limiter
│   ├── cors.ts                  # CORS configuration
│   └── helmet.ts                # Security headers via Helmet.js
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts   # Route handlers
│   │   ├── auth.service.ts      # Business logic
│   │   ├── auth.schema.ts       # Zod schemas (request validation)
│   │   └── auth.routes.ts       # Express router with middleware
│   ├── documents/
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── documents.schema.ts
│   │   └── documents.routes.ts
│   ├── jobs/
│   ├── mcq-records/
│   ├── providers/
│   ├── review/
│   ├── exports/
│   ├── analytics/
│   ├── workspaces/
│   ├── projects/
│   ├── users/
│   └── notifications/
└── routes.ts                    # Register all module routes
```

### 5.2 Module Pattern (Follow for Every Module)

Every API module has exactly 4 files:

**routes.ts** — Route definitions with middleware chain:
```typescript
import { Router } from "express";
import { authenticate } from "@mcq/auth";
import { requirePermission } from "@mcq/auth";
import { validate } from "../middleware/validate";
import { documentSchemas } from "./documents.schema";
import { documentsController } from "./documents.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("documents:read"),
  validate(documentSchemas.list),
  documentsController.list
);

router.post(
  "/upload",
  authenticate,
  requirePermission("documents:upload"),
  validate(documentSchemas.upload),
  documentsController.upload
);

export { router as documentsRouter };
```

**schema.ts** — Zod validation schemas:
```typescript
import { z } from "zod";

export const documentSchemas = {
  list: {
    query: z.object({
      projectId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["uploaded", "processing", "completed", "failed"]).optional(),
      sortBy: z.enum(["createdAt", "name", "pageCount"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
  upload: {
    body: z.object({
      projectId: z.string().uuid(),
      fileName: z.string().min(1).max(255),
      fileSize: z.number().int().positive().max(52_428_800), // 50 MB
      mimeType: z.literal("application/pdf"),
    }),
  },
};
```

**controller.ts** — Thin layer: parse input → call service → send response:
```typescript
import { type Request, type Response, type NextFunction } from "express";
import { documentsService } from "./documents.service";

export const documentsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.list({
        workspaceId: req.user!.workspaceId,
        ...req.validatedQuery,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.initiateUpload({
        userId: req.user!.id,
        workspaceId: req.user!.workspaceId,
        ...req.validatedBody,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
```

**service.ts** — All business logic lives here:
```typescript
import { db } from "@mcq/db";
import { documents } from "@mcq/db/schema";
import { storage } from "@mcq/storage";
import { queues } from "@mcq/queue";
import { AppError } from "../errors";

export const documentsService = {
  async list(params: ListDocumentsParams) {
    // Query database via Drizzle
    // Apply cursor pagination
    // Return paginated result
  },

  async initiateUpload(params: InitiateUploadParams) {
    // 1. Create document record in DB (status: "pending_upload")
    // 2. Generate signed PUT URL for S3
    // 3. Return { documentId, uploadUrl, expiresAt }
    // Frontend uploads directly to S3 using signed URL
  },
};
```

### 5.3 Controller Rules

```
Controllers are THIN. They:
  ✅ Extract validated input from req (already validated by middleware)
  ✅ Call service methods
  ✅ Send response with correct status code
  ✅ Pass errors to next()

Controllers must NEVER:
  ❌ Contain business logic
  ❌ Access the database directly
  ❌ Call external APIs
  ❌ Determine authorization (middleware handles this)
  ❌ Validate input (middleware handles this)
```

### 5.4 Standard API Response Formats

**Success (single resource):**
```json
{
  "data": { ... },
  "meta": {}
}
```

**Success (list with cursor pagination):**
```json
{
  "data": [ ... ],
  "meta": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "total": 342
  }
}
```

**Error:**
```json
{
  "error": {
    "status": 422,
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds the 50MB limit.",
    "details": [
      { "field": "fileSize", "message": "Must be less than 52428800 bytes" }
    ],
    "requestId": "req_abc123"
  }
}
```

### 5.5 HTTP Status Codes

| Code | When |
|------|------|
| 200 | Successful read or update |
| 201 | Successful create |
| 202 | Job accepted (async processing started) |
| 204 | Successful delete (no body) |
| 400 | Malformed request (missing required field, wrong type) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized (RBAC denied) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state transition violation) |
| 422 | Validation error (input valid structurally but fails business rules) |
| 429 | Rate limited |
| 500 | Internal server error (unexpected, log full stack) |

### 5.6 Pagination (Cursor-Based Only)

```
❌ NEVER use offset-based pagination (SELECT ... OFFSET N)
   - Breaks with concurrent inserts/deletes
   - Gets slower as offset increases

✅ ALWAYS use cursor-based pagination
   - Cursor = base64-encoded { id, sortField } of the last item
   - Consistent performance at any depth
   - Works correctly with real-time data changes
```

### 5.7 Idempotency

All POST endpoints that create resources must support the `Idempotency-Key` header:

```typescript
// Middleware checks Redis for existing key
// If key exists: return cached response (don't re-execute)
// If key is new: execute handler, cache response with TTL (24 hours)
```

---

## 6. Database Rules

### 6.1 Drizzle ORM Practices

```typescript
// ✅ GOOD — Type-safe query with Drizzle
const docs = await db
  .select()
  .from(documents)
  .where(
    and(
      eq(documents.workspaceId, workspaceId),
      eq(documents.status, "completed")
    )
  )
  .orderBy(desc(documents.createdAt))
  .limit(20);

// ❌ BAD — Raw SQL (use only when Drizzle can't express it)
const docs = await db.execute(sql`SELECT * FROM documents WHERE ...`);

// ❌ BAD — String concatenation in queries (SQL injection risk)
const docs = await db.execute(`SELECT * FROM documents WHERE id = '${id}'`);
```

### 6.2 Migration Rules

| Rule | Details |
|------|---------|
| Generate migrations | `npx drizzle-kit generate` — never write migration SQL by hand |
| One migration per change | Don't batch unrelated schema changes |
| Backward-compatible only | New columns must be nullable or have defaults. Never rename/drop columns in a migration that's deployed with the old code. |
| Test rollback | Every migration must be reversible. Test `down` migration in dev before merging. |
| No data manipulation | Seed data goes in seed scripts, not in migrations |

### 6.3 Transaction Rules

```typescript
// Use transactions when multiple tables must be consistent:
await db.transaction(async (tx) => {
  const doc = await tx.insert(documents).values({ ... }).returning();
  await tx.insert(documentPages).values(
    pages.map(p => ({ documentId: doc.id, ...p }))
  );
  await tx.insert(jobs).values({
    documentId: doc.id,
    type: "ocr",
    status: "pending",
  });
});
// All succeed or all roll back.
```

### 6.4 Soft Delete

```
All user-facing entities use soft delete:
  - deletedAt: timestamp | null
  - All queries must filter: WHERE deleted_at IS NULL
  - Use Drizzle's .where(isNull(entity.deletedAt)) everywhere

Hard delete only for:
  - Session records (expired sessions)
  - Rate limiting records (expired)
  - Temp artifacts after processing
```

### 6.5 ID Strategy

```
Use UUIDs (v7 recommended) for all primary keys.
  - Time-ordered (sortable by ID = sorted by creation time)
  - No sequential IDs exposed externally (prevents enumeration attacks)
  - Generate in application code, not database default

Format: Use uuid prefix for readability in logs:
  usr_<uuid>  — users
  ws_<uuid>   — workspaces
  prj_<uuid>  — projects
  doc_<uuid>  — documents
  job_<uuid>  — jobs
  mcq_<uuid>  — MCQ records
  exp_<uuid>  — exports
```

---

## 7. Queue & Worker Architecture

### 7.1 Queue Definitions

| Queue Name | Purpose | Concurrency | Max Retries | Backoff |
|-----------|---------|-------------|-------------|---------|
| `document-parse` | PDF → page extraction via Parser service | 5 | 3 | Exponential (1s, 4s, 16s) |
| `ocr` | Page image → OCR text via provider | 10 | 3 | Exponential (2s, 8s, 32s) |
| `llm-extract` | OCR text → structured MCQ via LLM | 5 | 3 | Exponential (5s, 20s, 80s) |
| `vlm-extract` | Page image → structured MCQ via VLM (Phase 2) | 3 | 3 | Exponential (5s, 20s, 80s) |
| `validation` | MCQ → 8-stage validation pipeline | 10 | 2 | Fixed (5s) |
| `confidence-scoring` | MCQ → composite confidence score | 10 | 2 | Fixed (5s) |
| `hallucination-check` | MCQ → 3-tier hallucination detection (Phase 2) | 5 | 2 | Fixed (5s) |
| `export` | MCQ records → LMS file generation (Phase 3) | 3 | 3 | Exponential (5s, 20s, 80s) |
| `thumbnail` | Page image → thumbnail generation | 10 | 2 | Fixed (2s) |
| `notification` | Send email/in-app notifications | 5 | 3 | Exponential (2s, 8s, 32s) |
| `cost-tracking` | Record provider usage and costs | 10 | 2 | Fixed (2s) |
| `cleanup` | Scheduled cleanup of expired artifacts | 1 | 1 | Fixed (30s) |

### 7.2 Worker Pattern

```typescript
// apps/worker/src/processors/ocr.processor.ts
import { Worker } from "bullmq";
import { db } from "@mcq/db";
import { providerRegistry } from "@mcq/provider-adapters";
import { logger } from "@mcq/logger";
import { connection } from "@mcq/queue";

const ocrWorker = new Worker(
  "ocr",
  async (job) => {
    const { pageId, providerId, pageImageKey } = job.data;

    // 1. Update job task status
    await updateJobTaskStatus(job.data.jobTaskId, "processing");

    // 2. Get provider adapter
    const adapter = await providerRegistry.getAdapter(providerId);

    // 3. Download page image from S3
    const imageBuffer = await storage.download(pageImageKey);

    // 4. Execute OCR via provider
    const result = await adapter.execute({ image: imageBuffer });

    // 5. Store OCR artifact
    await db.insert(ocrArtifacts).values({
      pageId,
      providerId,
      rawText: result.text,
      confidence: result.confidence,
      metadata: result.metadata,
    });

    // 6. Update job task status
    await updateJobTaskStatus(job.data.jobTaskId, "completed");

    // 7. Record cost
    await queues.costTracking.add("record", {
      providerId,
      operation: "ocr",
      tokenCount: result.tokenCount,
      cost: adapter.estimateCost(result),
    });

    // 8. Chain: enqueue LLM extraction if all pages OCR'd
    await checkAndEnqueueLLMExtraction(job.data.jobId);

    return { pageId, success: true };
  },
  {
    connection,
    concurrency: 10,
    limiter: { max: 10, duration: 1000 }, // 10 jobs per second max
  }
);

ocrWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "OCR job failed");
});

ocrWorker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "OCR job stalled — will be retried");
});
```

### 7.3 Job Chaining Pattern

```
Upload → document-parse → (per page) thumbnail + ocr → (all pages done) llm-extract
                                                     → validation → confidence-scoring
                                                     → notification
```

Each worker checks: "Am I the last page to complete? If yes, enqueue the next stage."

```typescript
async function checkAndEnqueueLLMExtraction(jobId: string) {
  const pendingTasks = await db
    .select({ count: count() })
    .from(jobTasks)
    .where(
      and(
        eq(jobTasks.jobId, jobId),
        eq(jobTasks.type, "ocr"),
        ne(jobTasks.status, "completed")
      )
    );

  if (pendingTasks[0].count === 0) {
    // All OCR tasks done — enqueue LLM extraction
    await queues.llmExtract.add("extract", { jobId });
  }
}
```

### 7.4 Worker Rules

```
Workers must:
  ✅ Be idempotent (re-running the same job produces the same result)
  ✅ Update job/task status at start and end
  ✅ Handle errors gracefully (catch, log, update status, re-throw for retry)
  ✅ Record costs after provider calls
  ✅ Use structured logging with jobId in every log line
  ✅ Respect concurrency limits
  ✅ Implement graceful shutdown (drain current jobs before exit)

Workers must NEVER:
  ❌ Access the HTTP req/res objects (workers are not in the API process)
  ❌ Hold database connections open during provider API calls
  ❌ Retry infinitely (max retries are configured per queue)
  ❌ Log sensitive data (API keys, full MCQ content)
```

---

## 8. Provider Adapter System

### 8.1 Adapter Interface

```typescript
// packages/provider-adapters/src/interface.ts

export interface ProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly category: "ocr" | "llm" | "vlm" | "parser" | "embedding";

  /**
   * Quick health check — can we reach the provider?
   * Must complete within 5 seconds.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Full connection test — validate credentials + model access.
   * Used by "Test Connection" button in UI.
   * Must complete within 10 seconds.
   */
  testConnection(): Promise<TestConnectionResult>;

  /**
   * Execute the provider operation.
   * Timeout is provider-specific (30s–300s).
   * Must return normalized output regardless of provider-specific format.
   */
  execute(input: ProviderInput): Promise<ProviderOutput>;

  /**
   * Estimate cost before execution.
   * Synchronous — uses input size to estimate tokens/pages.
   */
  estimateCost(input: ProviderInput): CostEstimate;
}
```

### 8.2 Adapter Rules

```
Every adapter must:
  ✅ Normalize the provider's response to our standard ProviderOutput type
  ✅ Handle the provider's specific error codes and map to our AppError types
  ✅ Respect the provider's rate limits (return 429 → retry with backoff)
  ✅ Include request timeout (never wait forever)
  ✅ Log provider request/response metadata (NOT full content — costs, latency, tokens)
  ✅ Validate the provider's response with Zod before trusting it
  ✅ Be independently testable with MSW (HTTP-level mocking)
```

### 8.3 Adding a New Provider

1. Create `packages/provider-adapters/src/adapters/<category>/<name>.adapter.ts`
2. Implement the `ProviderAdapter` interface
3. Add mock responses to `packages/test-fixtures/providers/<name>/`
4. Register in `packages/provider-adapters/src/registry.ts`
5. Add integration tests (with MSW mocks)
6. Document in `integration-dependencies.md`

---

## 9. Authentication & Authorization

### 9.1 Session-Based Auth

```typescript
// Every authenticated request goes through this middleware chain:
// 1. auth.middleware.ts → validates session cookie → attaches req.user
// 2. rbac.middleware.ts → checks req.user.role against required permission

// req.user shape (set by auth middleware):
interface AuthenticatedUser {
  id: string;                  // usr_<uuid>
  email: string;
  role: UserRole;              // "super_admin" | "workspace_admin" | "operator" | "reviewer" | "analyst" | "api_user"
  workspaceId: string;         // Active workspace
  permissions: Permission[];   // Resolved from role
}
```

### 9.2 RBAC Middleware Usage

```typescript
// In routes:
router.post(
  "/upload",
  authenticate,                          // Must be logged in
  requirePermission("documents:upload"), // Must have this permission
  validate(documentSchemas.upload),      // Input must be valid
  documentsController.upload             // Handle request
);
```

### 9.3 Workspace Scoping

**Every query must be scoped to the user's workspace:**

```typescript
// ✅ GOOD — Always filter by workspaceId
const docs = await db
  .select()
  .from(documents)
  .where(
    and(
      eq(documents.workspaceId, req.user.workspaceId),  // ALWAYS
      eq(documents.projectId, projectId)
    )
  );

// ❌ VERY BAD — No workspace filter (data leak across workspaces!)
const docs = await db
  .select()
  .from(documents)
  .where(eq(documents.projectId, projectId));
```

---

## 10. Error Handling

### 10.1 Application Error Class

```typescript
// Standardized error class used everywhere
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Insufficient permissions") {
    return new AppError(403, "FORBIDDEN", message);
  }
  static notFound(resource: string) {
    return new AppError(404, "NOT_FOUND", `${resource} not found`);
  }
  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }
  static validationError(message: string, details?: unknown) {
    return new AppError(422, "VALIDATION_ERROR", message, details);
  }
  static tooManyRequests(retryAfter?: number) {
    return new AppError(429, "RATE_LIMITED", "Too many requests");
  }
}
```

### 10.2 Global Error Handler

```typescript
// Must be the LAST middleware registered
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    // Known application error — send structured response
    res.status(err.statusCode).json({
      error: {
        status: err.statusCode,
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
      },
    });
  } else if (err instanceof ZodError) {
    // Validation error from Zod
    res.status(422).json({
      error: {
        status: 422,
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.errors.map(e => ({ field: e.path.join("."), message: e.message })),
        requestId: req.id,
      },
    });
  } else {
    // Unknown error — log full stack, return generic message
    logger.error({ err, requestId: req.id }, "Unhandled error");
    res.status(500).json({
      error: {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        requestId: req.id,
      },
    });
  }
});
```

### 10.3 Error Rules

```
✅ DO:
  - Throw AppError with correct status code and a user-friendly message
  - Log the full error (including stack) for 500s
  - Include requestId in every error response
  - Return Zod validation details so the frontend can display field-level errors

❌ DON'T:
  - Expose internal error messages to users (e.g., "relation 'documents' does not exist")
  - Expose stack traces in non-development environments
  - Catch errors silently without logging (swallowing errors)
  - Return HTML error pages from the API
```

---

## 11. Security Implementation Checklist

| # | Rule | Implementation |
|---|------|---------------|
| 1 | **All inputs validated** | Zod schema on every endpoint. No unvalidated user input ever touches DB or external services. |
| 2 | **Parameterized queries** | Drizzle ORM handles this. Never use string concatenation for SQL. |
| 3 | **Helmet.js** | Register as first middleware. Configures CSP, HSTS, X-Frame-Options, etc. |
| 4 | **CORS** | Whitelist only the frontend origin. No `*` in production. |
| 5 | **Rate limiting** | Redis-backed sliding window. Per-user + per-IP. Different limits per endpoint category. |
| 6 | **Password hashing** | bcrypt with cost factor 12. Never store plaintext. |
| 7 | **Session cookies** | httpOnly, Secure, SameSite=Strict. Short TTL (24 hours). Rotate on login. |
| 8 | **Provider API keys** | Encrypted at rest in PostgreSQL using AES-256-GCM. Master key in environment variable. Never in logs. |
| 9 | **Signed URLs** | S3 objects are private. Generate short-lived signed URLs (15 min). |
| 10 | **File upload validation** | Check MIME type + magic bytes. Max 50MB. ClamAV scan before processing. |
| 11 | **Audit logging** | Log all auth events, data mutations, config changes. Append-only table. |
| 12 | **No secrets in code** | All secrets via environment variables or secrets manager. `.env` in `.gitignore`. |
| 13 | **Dependency security** | `npm audit` in CI. Block on critical vulnerabilities. |

---

## 12. Logging Standards

### 12.1 Logger Usage

```typescript
import { logger } from "@mcq/logger";

// Module-scoped child logger
const log = logger.child({ module: "documents.service" });

// ✅ GOOD — Structured, contextual
log.info({ documentId, userId, fileSize }, "Document upload initiated");
log.error({ err, jobId }, "OCR job failed after 3 retries");
log.warn({ queueDepth, threshold: 100 }, "Queue depth approaching threshold");

// ❌ BAD — Unstructured, no context
console.log("Upload started");
console.log("Error: " + err.message);
logger.info("Processing document " + documentId);  // String concat = bad
```

### 12.2 What to Log

| Event | Level | Required Fields |
|-------|-------|----------------|
| API request received | info | method, path, requestId, userId |
| API request completed | info | method, path, requestId, statusCode, durationMs |
| Job started | info | jobId, jobType, queueName |
| Job completed | info | jobId, jobType, durationMs |
| Job failed | error | jobId, jobType, error, attemptNumber |
| Provider API called | info | providerId, operation, durationMs, tokenCount |
| Provider API error | error | providerId, operation, errorCode, errorMessage |
| Auth failure | warn | ipAddress, reason (invalid credentials, expired session) |
| RBAC denied | warn | userId, requiredPermission, userRole |
| Database query slow (>1s) | warn | query, durationMs, table |

### 12.3 What to NEVER Log

- Passwords (plain or hashed)
- Full API keys (log only first 4 chars: `sk-a***`)
- Session tokens
- Full request/response bodies (log only metadata: size, content-type)
- Full MCQ content (log IDs only)
- PII beyond what's needed (mask emails: `jo***@example.com`)

---

## 13. Testing Requirements

### 13.1 Test Categories

| Category | Tool | What to Test | Coverage Target |
|----------|------|-------------|----------------|
| Unit | Vitest | Pure functions, validators, transformers, scoring, state machines | 80%+ |
| Integration | Vitest + Supertest + test containers | API routes with real DB/Redis, queue flows | 80%+ |
| Provider mocks | MSW (Mock Service Worker) | Adapter tests with recorded HTTP responses | Every adapter |

### 13.2 Integration Test Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/server";
import { db, migrate } from "@mcq/db";
import { createUser, createSession } from "@mcq/test-fixtures";

describe("POST /api/v1/documents/upload", () => {
  let sessionCookie: string;

  beforeAll(async () => {
    await migrate();
    const user = await createUser({ role: "operator" });
    sessionCookie = await createSession(user.id);
  });

  it("returns 201 with upload URL for valid PDF", async () => {
    const res = await request(app)
      .post("/api/v1/documents/upload")
      .set("Cookie", sessionCookie)
      .send({
        projectId: "prj_xxx",
        fileName: "exam.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("documentId");
    expect(res.body.data).toHaveProperty("uploadUrl");
  });

  it("returns 403 when user lacks upload permission", async () => {
    const analyst = await createUser({ role: "analyst" });
    const analystCookie = await createSession(analyst.id);

    const res = await request(app)
      .post("/api/v1/documents/upload")
      .set("Cookie", analystCookie)
      .send({ ... });

    expect(res.status).toBe(403);
  });

  it("returns 422 when file exceeds 50MB", async () => {
    const res = await request(app)
      .post("/api/v1/documents/upload")
      .set("Cookie", sessionCookie)
      .send({
        projectId: "prj_xxx",
        fileName: "huge.pdf",
        fileSize: 100_000_000, // 100MB
        mimeType: "application/pdf",
      });

    expect(res.status).toBe(422);
  });
});
```

### 13.3 Testing Rules

```
✅ DO:
  - Test the happy path AND at least 2 error paths per endpoint
  - Test RBAC (verify unauthorized roles get 403)
  - Test validation (verify bad input gets 422)
  - Test workspace isolation (user A can't see user B's data)
  - Use factory functions for test data (never hardcode UUIDs)
  - Clean up test data in afterAll/afterEach

❌ DON'T:
  - Mock the database in integration tests (use test containers)
  - Write tests that depend on execution order
  - Share mutable state between test files
  - Test framework behavior (Express routing, Zod parsing)
```

---

## 14. Configuration Management

```typescript
// packages/config/src/config.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // S3
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_REGION: z.string().default("us-east-1"),

  // Auth
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32), // For provider API key encryption

  // Parser service
  PARSER_SERVICE_URL: z.string().url().default("http://localhost:5000"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

// Validate at startup — fail fast if env is misconfigured
export const config = envSchema.parse(process.env);
```

**Rule: Application must crash on startup if required env vars are missing.** Do not use fallback defaults for secrets or connection strings.

---

## 15. Git Workflow

| Rule | Details |
|------|---------|
| Branch naming | `feature/BE-<id>-<description>` (e.g., `feature/BE-001-document-upload-api`) |
| Commit messages | Conventional commits: `feat(api): add document upload endpoint` |
| PR requirements | lint pass + typecheck pass + unit tests pass + integration tests pass + 1 approval |
| PR size | < 500 lines changed. Split larger work. |
| Migration PRs | Database migrations in separate PRs from feature code. Review by senior eng. |

---

## 16. Phase 1 Build Order

Build in this sequence — each step depends on the previous:

1. **Project scaffolding** — Turborepo with `apps/api`, `apps/worker`, `apps/parser`, and core `packages/`
2. **Config + Logger** — `packages/config` (Zod-validated env) + `packages/logger` (pino structured JSON)
3. **Database setup** — `packages/db` with Drizzle schema (User, Workspace, Project starters) + migrations
4. **Auth** — `packages/auth` with session middleware + RBAC middleware + login/register endpoints
5. **S3 integration** — `packages/storage` with MinIO locally + signed URL generation
6. **Workspace + Project CRUD** — API module for workspace and project management
7. **Document upload flow** — Upload API → signed URL → S3 → document record → parser queue
8. **Parser service** — Python FastAPI service with PyMuPDF page extraction
9. **Queue infrastructure** — `packages/queue` with BullMQ setup + bull-board dashboard
10. **OCR pipeline** — Worker processor + at least 2 OCR provider adapters
11. **LLM extraction pipeline** — Worker processor + at least 2 LLM provider adapters
12. **MCQ record CRUD** — API endpoints for listing, viewing, editing MCQ records
13. **Job monitoring** — Job and task status endpoints + SSE or polling for real-time updates
14. **Provider management** — CRUD for provider configs + test connection + encrypted key storage
15. **Basic review** — Review queue endpoints (approve, reject, list)
16. **User management** — Invite, role assignment, list users
17. **Basic analytics** — Dashboard stats aggregation queries
18. **Integration tests** — Test suite for all endpoints with real DB/Redis

**Don't build until Phase 2:** VLM pipeline, hallucination detection, confidence scoring, validation pipeline, notification system.
**Don't build until Phase 3:** Export engine, cost intelligence, semantic search, advanced analytics.

---

## 17. Communication with Frontend Developer

- Frontend developer has **apis.md** — that is the contract. Any deviation from it must be communicated and documented.
- If you need to change an endpoint's request/response shape, update **apis.md** AND notify the frontend developer.
- Implement API endpoints in the order the frontend needs them (coordinate on Phase 1 build order).
- Provide the frontend developer with a Postman/Insomnia collection or OpenAPI spec for testing.
- When a new endpoint is ready, deploy it to the dev environment and notify the frontend developer.
