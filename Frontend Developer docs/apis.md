# API Design — MCQ Extraction Platform v2.0

## Document Purpose

This document specifies the API strategy, endpoint catalog, authentication approach, versioning, conventions, data contracts, and integration points for the MCQ Extraction Platform.

---

## 1. API Strategy Overview

The platform exposes a single REST API (Express) consumed by:
- The Next.js frontend (primary consumer)
- API/Integration users (programmatic access)
- Webhooks (outbound event delivery)

**Style:** RESTful JSON API over HTTPS.
**Base path:** `/api/v1`
**Auth:** Session-based (cookie) for browser clients; Bearer token for API consumers.
**Content-Type:** `application/json` for all request/response bodies.
**File uploads:** Direct-to-S3 via presigned URLs (not multipart to API).

---

## 2. Authentication and Authorization

### 2.1 Auth Mechanisms

| Client Type | Auth Method | Token Lifetime |
|-------------|-------------|----------------|
| Browser (frontend) | HTTP-only session cookie via NextAuth | Configurable (default 24h, sliding) |
| API consumer | Bearer token (API key) | Long-lived, manually rotated |
| Webhook receiver | HMAC signature verification | Per-request |

### 2.2 Authorization Enforcement

Every endpoint enforces:
1. **Authentication** — valid session/token required.
2. **Role check** — user role permits the operation (see RBAC matrix in backend.md).
3. **Resource scoping** — requested resource belongs to user's workspace.

Unauthorized requests receive `401` (not authenticated) or `403` (insufficient permissions).

---

## 3. Versioning Strategy

- **URL path versioning:** `/api/v1/...`
- No version bumps for additive changes (new fields, new endpoints).
- Version bump for breaking changes (field removals, type changes, renamed endpoints).
- Deprecation policy: old version supported for at least 3 months after new version release.
- Version negotiation via URL path, not headers (simplicity).

---

## 4. Common Conventions

### 4.1 Pagination

All list endpoints support cursor-based pagination:

```
GET /api/v1/documents?cursor=abc123&limit=25
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "def456",
    "has_more": true,
    "total_count": 1234
  }
}
```

- Default `limit`: 25. Maximum `limit`: 100.
- `total_count` included where performant (omitted for expensive counts).

### 4.2 Filtering

List endpoints accept filter query parameters:

```
GET /api/v1/review/items?status=unreviewed&severity=high&confidence_lt=50
```

Naming convention: `field_name` for equality, `field_name_lt`, `field_name_gt`, `field_name_gte`, `field_name_lte` for range comparisons.

### 4.3 Sorting

```
GET /api/v1/documents?sort_by=created_at&sort_order=desc
```

Default sort: `created_at DESC` for most list endpoints.

### 4.4 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "question_text",
        "message": "Must not be empty"
      }
    ],
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Standard HTTP status codes:
- `200` — Success
- `201` — Created
- `204` — No Content (successful delete)
- `400` — Validation error
- `401` — Not authenticated
- `403` — Not authorized
- `404` — Not found
- `409` — Conflict (duplicate, version mismatch)
- `429` — Rate limited
- `500` — Internal server error

### 4.5 Idempotency

Mutation endpoints (POST for creates) accept an optional `Idempotency-Key` header. If the same key is submitted within 24 hours, the original response is returned without re-processing.

Critical for:
- Job creation (prevent duplicate extraction runs)
- Export creation
- Review actions

---

## 5. Endpoint Catalog

### 5.1 Auth Domain (`/api/v1/auth`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| POST | `/auth/login` | Sign in with credentials | None | API-001 |
| POST | `/auth/logout` | Sign out current session | Auth | API-002 |
| GET | `/auth/session` | Get current session info | Auth | API-003 |
| POST | `/auth/api-keys` | Create API key for programmatic access | Admin | API-004 |
| DELETE | `/auth/api-keys/:id` | Revoke API key | Admin | API-005 |

### 5.2 Users Domain (`/api/v1/users`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/users` | List workspace users | Admin | API-010 |
| POST | `/users/invite` | Invite user with role | Admin | API-011 |
| GET | `/users/:id` | Get user details | Admin | API-012 |
| PATCH | `/users/:id` | Update user role | Admin | API-013 |
| DELETE | `/users/:id` | Remove user from workspace | Admin | API-014 |

### 5.3 Workspaces Domain (`/api/v1/workspaces`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/workspaces` | List user's workspaces | Auth | API-020 |
| POST | `/workspaces` | Create workspace | SuperAdmin | API-021 |
| GET | `/workspaces/:id` | Get workspace details | Admin | API-022 |
| PATCH | `/workspaces/:id` | Update workspace settings | Admin | API-023 |

### 5.4 Projects Domain (`/api/v1/projects`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/projects` | List projects in workspace | Auth | API-030 |
| POST | `/projects` | Create project | Admin, Operator | API-031 |
| GET | `/projects/:id` | Get project details | Auth | API-032 |
| PATCH | `/projects/:id` | Update project settings | Admin | API-033 |
| DELETE | `/projects/:id` | Archive project | Admin | API-034 |

### 5.5 Providers Domain (`/api/v1/providers`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/providers` | List configured providers | Admin | API-040 |
| POST | `/providers` | Add provider configuration | Admin | API-041 |
| POST | `/providers/test` | Test provider connection | Admin | API-042 |
| GET | `/providers/:id` | Get provider details (key masked) | Admin | API-043 |
| PATCH | `/providers/:id` | Update provider config | Admin | API-044 |
| DELETE | `/providers/:id` | Remove provider | Admin | API-045 |
| GET | `/providers/:id/benchmarks` | Get provider benchmark history | Admin | API-046 |
| GET | `/providers/:id/health` | Get provider health status | Admin | API-047 |

**Sample: POST /providers**

Request:
```json
{
  "name": "OpenAI GPT-4.1",
  "category": "llm",
  "provider_type": "openai",
  "api_key": "sk-...",
  "models": ["gpt-4.1"],
  "config": {
    "temperature": 0.1,
    "max_tokens": 4096
  },
  "is_default": true
}
```

Response (201):
```json
{
  "data": {
    "id": "uuid",
    "name": "OpenAI GPT-4.1",
    "category": "llm",
    "provider_type": "openai",
    "api_key_preview": "sk-...xxxx",
    "models": ["gpt-4.1"],
    "is_default": true,
    "health_status": "unknown",
    "created_at": "2026-03-08T10:00:00Z"
  }
}
```

### 5.6 Documents Domain (`/api/v1/documents`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/documents` | List documents (paginated, filterable) | Auth | API-050 |
| GET | `/documents/:id` | Get document details | Auth | API-051 |
| GET | `/documents/:id/pages` | List page metadata | Auth | API-052 |
| GET | `/documents/:id/preview/:page` | Get presigned URL for page image | Auth | API-053 |
| PATCH | `/documents/:id` | Update document metadata (tags, notes) | Operator | API-054 |
| DELETE | `/documents/:id` | Delete document and artifacts | Admin | API-055 |

### 5.7 Uploads Domain (`/api/v1/uploads`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| POST | `/uploads/presign` | Generate presigned upload URL | Operator | API-060 |
| POST | `/uploads/complete` | Notify upload completion | Operator | API-061 |
| GET | `/uploads/sessions` | List active upload sessions | Operator | API-062 |

**Sample: POST /uploads/presign**

Request:
```json
{
  "project_id": "uuid",
  "filename": "biology_set_01.pdf",
  "content_type": "application/pdf",
  "file_size": 15728640
}
```

Response (200):
```json
{
  "data": {
    "upload_id": "uuid",
    "presigned_url": "https://s3.../upload?...",
    "presigned_url_expiry": "2026-03-08T11:00:00Z",
    "s3_key": "workspace-uuid/doc-uuid/raw/biology_set_01.pdf"
  }
}
```

### 5.8 Jobs Domain (`/api/v1/jobs`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| POST | `/jobs` | Create extraction job | Operator | API-070 |
| GET | `/jobs` | List jobs (paginated) | Auth | API-071 |
| GET | `/jobs/:id` | Get job details with progress | Auth | API-072 |
| POST | `/jobs/:id/pause` | Pause job | Operator | API-073 |
| POST | `/jobs/:id/resume` | Resume paused job | Operator | API-074 |
| POST | `/jobs/:id/retry` | Retry failed job | Operator | API-075 |
| POST | `/jobs/:id/cancel` | Cancel job | Operator | API-076 |
| GET | `/jobs/:id/cost` | Get job cost breakdown | Operator | API-077 |
| GET | `/jobs/:id/tasks` | List job tasks with status | Auth | API-078 |

**Sample: POST /jobs**

Request:
```json
{
  "project_id": "uuid",
  "document_ids": ["uuid1", "uuid2"],
  "extraction_profile": {
    "ocr_provider_id": "uuid",
    "llm_provider_id": "uuid",
    "routing_mode": "balanced"
  }
}
```

Response (201):
```json
{
  "data": {
    "id": "uuid",
    "status": "queued",
    "total_documents": 2,
    "total_pages": null,
    "progress_percent": 0,
    "created_at": "2026-03-08T10:00:00Z"
  }
}
```

### 5.9 Review Domain (`/api/v1/review`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/review/items` | List review items (filtered, paginated) | Reviewer | API-080 |
| GET | `/review/items/:id` | Get review item detail with MCQ record | Reviewer | API-081 |
| POST | `/review/items/:id/approve` | Approve record | Reviewer | API-082 |
| POST | `/review/items/:id/reject` | Reject record | Reviewer | API-083 |
| POST | `/review/items/:id/edit` | Edit record fields | Reviewer | API-084 |
| POST | `/review/items/:id/reprocess` | Request re-extraction | Reviewer | API-085 |
| GET | `/review/items/:id/similar` | Find similar records | Reviewer | API-086 |
| GET | `/review/stats` | Review queue statistics | Reviewer | API-087 |

**Sample: POST /review/items/:id/edit**

Request:
```json
{
  "changes": {
    "question_text": "Corrected question text here",
    "correct_answer": "C"
  },
  "reviewer_notes": "Fixed misidentified correct answer"
}
```

Response (200):
```json
{
  "data": {
    "id": "uuid",
    "review_status": "edited",
    "version": 2,
    "updated_at": "2026-03-08T10:05:00Z"
  }
}
```

### 5.10 Exports Domain (`/api/v1/exports`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| POST | `/exports` | Create export job | Operator | API-090 |
| GET | `/exports` | List exports | Auth | API-091 |
| GET | `/exports/:id` | Get export status | Auth | API-092 |
| GET | `/exports/:id/download` | Get presigned download URL | Auth | API-093 |
| GET | `/exports/mappings` | List export column mappings | Admin | API-094 |
| POST | `/exports/mappings` | Create export column mapping | Admin | API-095 |

**Sample: POST /exports**

Request:
```json
{
  "project_id": "uuid",
  "format": "qti_2_1",
  "scope": {
    "status_filter": "approved",
    "document_ids": null,
    "tag_filter": null
  },
  "include_audit_bundle": true
}
```

### 5.11 Analytics Domain (`/api/v1/analytics`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/analytics/overview` | Dashboard overview metrics | Analyst | API-100 |
| GET | `/analytics/providers` | Provider performance comparison | Analyst | API-101 |
| GET | `/analytics/review` | Review productivity metrics | Analyst | API-102 |
| GET | `/analytics/quality` | Extraction quality metrics | Analyst | API-103 |
| GET | `/analytics/cost` | Cost analytics and breakdown | Analyst | API-104 |
| GET | `/analytics/hallucinations` | Hallucination rate analytics | Analyst | API-105 |

### 5.12 Semantic Domain (`/api/v1/semantic`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| POST | `/semantic/search` | Search extracted question text | Auth | API-110 |
| GET | `/semantic/duplicates/:recordId` | Find near-duplicate records | Auth | API-111 |
| GET | `/semantic/cluster/:projectId` | Topic-based clustering | Analyst | API-112 |

### 5.13 Notifications Domain (`/api/v1/notifications`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/notifications` | List user notifications | Auth | API-120 |
| POST | `/notifications/:id/read` | Mark notification as read | Auth | API-121 |
| POST | `/notifications/read-all` | Mark all as read | Auth | API-122 |
| GET | `/notifications/preferences` | Get notification preferences | Auth | API-123 |
| PATCH | `/notifications/preferences` | Update notification preferences | Auth | API-124 |

### 5.14 Health Domain (`/api/v1/health`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/health/live` | Liveness probe (is process running) | None | API-130 |
| GET | `/health/ready` | Readiness probe (DB/Redis connected) | None | API-131 |
| GET | `/health/status` | Detailed system status | Admin | API-132 |

### 5.15 Admin Domain (`/api/v1/admin`)

| Method | Path | Description | Auth | Req ID |
|--------|------|-------------|------|--------|
| GET | `/admin/audit-logs` | List audit log entries | Admin | API-140 |
| GET | `/admin/diagnostics` | System diagnostics bundle | SuperAdmin | API-141 |
| GET | `/admin/queues` | Queue health summary | Admin | API-142 |
| GET | `/admin/dead-letter` | Dead-letter queue items | Admin | API-143 |
| POST | `/admin/dead-letter/:id/retry` | Retry dead-letter job | Admin | API-144 |
| POST | `/admin/emergency-pause` | Pause all job processing | SuperAdmin | API-145 |

---

## 6. Third-Party Integration Analysis

### 6.1 OCR Provider APIs

| Provider | Protocol | Auth | Rate Limits | Retry Strategy | Timeout |
|----------|----------|------|-------------|----------------|---------|
| Google Document AI | REST (HTTPS) | Service account / API key | 300 QPM (default) | Exponential backoff, respect 429 | 60s |
| Azure AI Document Intelligence | REST (HTTPS) | Subscription key | Varies by tier | Exponential backoff | 60s |
| AWS Textract | AWS SDK | IAM / access key | Service quotas | AWS SDK built-in retry | 60s |
| Tesseract (local) | Subprocess / gRPC | None | CPU-bound | Retry on crash | 30s |

### 6.2 LLM Provider APIs

| Provider | Protocol | Auth | Rate Limits | Retry Strategy | Timeout |
|----------|----------|------|-------------|----------------|---------|
| OpenAI | REST (HTTPS) | Bearer token | Tier-dependent | Exponential backoff, respect 429 | 120s |
| Anthropic | REST (HTTPS) | API key header | Tier-dependent | Exponential backoff | 120s |
| Google Gemini | REST (HTTPS) | API key / OAuth | Tier-dependent | Exponential backoff | 120s |
| Mistral | REST (HTTPS) | Bearer token | Tier-dependent | Exponential backoff | 120s |
| DeepSeek | REST (HTTPS) | Bearer token | Tier-dependent | Exponential backoff | 120s |

### 6.3 VLM Provider APIs

Same providers as LLM but with image input capability. Key differences:
- Higher token consumption per request (2,000–3,000 tokens per image)
- Longer processing time
- Lower rate limits for image inputs on some providers
- Image size/resolution constraints per provider

### 6.4 Object Storage (S3)

| Operation | Protocol | Auth | Failure Handling |
|-----------|----------|------|------------------|
| Generate presigned URL | AWS SDK | IAM / access key | Retry on 5xx |
| Upload (client-side) | HTTPS PUT | Presigned URL | Client-side retry |
| Download | HTTPS GET | Presigned URL | Client-side retry |
| Delete | AWS SDK | IAM / access key | Retry; log on failure |

### 6.5 Email Service

| Provider | Protocol | Auth | SLA Assumption |
|----------|----------|------|----------------|
| AWS SES / Generic SMTP | SMTP / REST | API key | Best-effort delivery; retry on failure; non-critical path |

---

## 7. Observability Requirements

- **Request logging:** Every API call logged with method, path, status, latency, correlation ID.
- **Rate limit logging:** Log when rate limits are approached (80% threshold).
- **Provider call logging:** Log provider name, model, latency, cost, token usage, success/failure (sanitized — no request content).
- **Slow query detection:** Log API calls exceeding 500ms threshold.
- **Error rate monitoring:** Alert if error rate exceeds 5% over 5-minute window.

---

## 8. API Security

- All endpoints served over HTTPS (TLS 1.2+).
- Rate limiting on auth endpoints: 10 attempts per minute per IP.
- Rate limiting on API endpoints: configurable per workspace tier.
- API keys hashed in database (never stored in plaintext).
- CORS configured to allow only the frontend origin.
- Helmet.js security headers on all responses.
- Request body size limit: 1MB for JSON endpoints; file uploads go directly to S3.
- Input validation: Zod schemas on every request body and query parameter.

---

## 9. Unresolved Contract Questions

| Question | Impact | Recommendation |
|----------|--------|----------------|
| Should the API support GraphQL alongside REST? | Low | Not for MVP. Consider later if frontend query patterns become complex. |
| WebSocket vs polling for real-time job updates? | Medium | Start with polling (simpler). Add WebSocket/SSE if polling performance is insufficient. |
| Webhook payload schema for external consumers? | Medium | Define in Phase 3 with API/Integration user stories. |
| API versioning — header vs path? | Low | Path versioning chosen (/api/v1). Decision is final. |
| Batch API operations (e.g., approve 100 items in one call)? | Medium | Support batch endpoints for review actions. Limit batch size to 100. |
| How to handle very long-running export generation? | Medium | Return 202 Accepted with job ID; client polls for completion. |
| Should analytics endpoints support custom date ranges? | Low | Yes — accept `start_date` and `end_date` query params with sensible defaults. |
