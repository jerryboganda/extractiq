# Traceability Matrix — MCQ Extraction Platform v2.0

## Document Purpose

This document maps business requirements to functional requirements, architecture components, implementation domains, test categories, and risks — enabling end-to-end traceability from business need to validated delivery.

---

## 1. Business Requirement → Functional Requirement Mapping

| Business Req | Description | Functional Requirements | Phase |
|-------------|-------------|------------------------|-------|
| BR-001 | Ingest PDF documents (single & bulk) | FR-001, FR-002, FR-003, FR-004, FR-005 | P1 |
| BR-002 | Extract MCQs using AI providers | FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026 | P1 |
| BR-003 | Support multiple AI providers (OCR, LLM, VLM) | FR-030, FR-031, FR-032, FR-033, FR-034, FR-035 | P1–P2 |
| BR-004 | Detect and score hallucinations | FR-040, FR-041, FR-042, FR-043, FR-044, FR-045, FR-046, FR-047 | P2 |
| BR-005 | Enable human review of extracted MCQs | FR-050, FR-051, FR-052, FR-053, FR-054, FR-055, FR-056, FR-057 | P1–P2 |
| BR-006 | Export MCQs to LMS-ready formats | FR-060, FR-061, FR-062, FR-063, FR-064, FR-065 | P3 |
| BR-007 | Track costs and usage across providers | FR-070, FR-071, FR-072, FR-073, FR-074, FR-075 | P2–P3 |
| BR-008 | Provide analytics and reporting | FR-080, FR-081, FR-082, FR-083, FR-084, FR-085 | P1–P3 |
| BR-009 | Multi-workspace, multi-project organization | FR-090, FR-091, FR-092, FR-093, FR-094 | P1 |
| BR-010 | Role-based access control | FR-100, FR-101, FR-102, FR-103, FR-104, FR-105 | P0–P1 |

---

## 2. Functional Requirement → Architecture Component Mapping

| FR Range | Domain | Architecture Components | Primary Service |
|----------|--------|------------------------|----------------|
| FR-001–FR-005 | Document Ingestion | Upload API, S3 Storage, Document Service, Parser Service | API + Parser |
| FR-020–FR-026 | MCQ Extraction | OCR Queue, LLM Queue, Provider Adapters, MCQ Service | Worker |
| FR-030–FR-035 | Provider Management | Provider Registry, Adapter Interface, Config API | API + Worker |
| FR-040–FR-047 | Hallucination Detection | Hallucination Engine, Confidence Scorer, Validation Pipeline | Worker |
| FR-050–FR-057 | Review Workflow | Review Queue API, Review UI State, MCQ Versioning | API + Web |
| FR-060–FR-065 | LMS Export | Export Engine, Format Generators (QTI, SCORM, xAPI, cmi5) | Worker |
| FR-070–FR-075 | Cost Intelligence | Cost Tracking Service, Budget Rules, Cost Analytics | API + Worker |
| FR-080–FR-085 | Analytics | Analytics API, Dashboard Components, Aggregation Queries | API + Web |
| FR-090–FR-094 | Organization | Workspace Service, Project Service, Membership Service | API |
| FR-100–FR-105 | Auth & RBAC | Auth Middleware, RBAC Middleware, User Service | API |

---

## 3. Architecture Component → Package/Module Mapping

| Architecture Component | Monorepo Package | Module/File Location |
|----------------------|-----------------|---------------------|
| Upload API | apps/api | src/modules/documents/upload.controller.ts |
| S3 Storage | packages/storage | src/s3-client.ts |
| Document Service | packages/document-service | src/document.service.ts |
| Parser Service | apps/parser (Python) | app/parser.py |
| OCR Queue | packages/queue | src/queues/ocr.queue.ts |
| LLM Queue | packages/queue | src/queues/llm.queue.ts |
| VLM Queue | packages/queue | src/queues/vlm.queue.ts |
| Provider Adapters | packages/provider-adapters | src/adapters/*.adapter.ts |
| Provider Registry | packages/provider-registry | src/registry.ts |
| MCQ Service | packages/mcq-service | src/mcq.service.ts |
| Hallucination Engine | packages/hallucination | src/detector.ts |
| Confidence Scorer | packages/confidence | src/scorer.ts |
| Validation Pipeline | packages/validators | src/pipeline.ts |
| Review Queue API | apps/api | src/modules/review/review.controller.ts |
| Export Engine | packages/export-engine | src/generators/*.generator.ts |
| Cost Tracking | packages/cost-intelligence | src/cost.service.ts |
| Analytics API | apps/api | src/modules/analytics/analytics.controller.ts |
| Workspace Service | apps/api | src/modules/workspaces/workspace.service.ts |
| Auth Middleware | packages/auth | src/middleware/auth.middleware.ts |
| RBAC Middleware | packages/auth | src/middleware/rbac.middleware.ts |

---

## 4. Functional Requirement → API Endpoint Mapping

| FR | Description | API Endpoints |
|----|-------------|---------------|
| FR-001 | Upload single PDF | API-001 (POST /documents/upload) |
| FR-002 | Bulk upload PDFs | API-002 (POST /documents/bulk-upload) |
| FR-003 | List documents | API-003 (GET /documents) |
| FR-004 | View document detail | API-004 (GET /documents/:id) |
| FR-005 | Delete document | API-005 (DELETE /documents/:id) |
| FR-020 | Trigger OCR extraction | API-020 (POST /jobs) |
| FR-021 | Trigger LLM extraction | API-020 (POST /jobs) |
| FR-022 | View extraction job status | API-021 (GET /jobs/:id) |
| FR-023 | Cancel extraction job | API-022 (POST /jobs/:id/cancel) |
| FR-024 | Retry failed job | API-023 (POST /jobs/:id/retry) |
| FR-030 | List providers | API-030 (GET /providers) |
| FR-031 | Add provider config | API-031 (POST /providers) |
| FR-032 | Test provider connection | API-032 (POST /providers/:id/test) |
| FR-033 | Update provider config | API-033 (PUT /providers/:id) |
| FR-050 | Get review queue | API-050 (GET /review/queue) |
| FR-051 | Approve MCQ record | API-051 (POST /review/:id/approve) |
| FR-052 | Reject MCQ record | API-052 (POST /review/:id/reject) |
| FR-053 | Get MCQ record detail | API-053 (GET /mcq-records/:id) |
| FR-054 | Edit MCQ record | API-054 (PUT /mcq-records/:id) |
| FR-060 | Create export job | API-060 (POST /exports) |
| FR-061 | Get export status | API-061 (GET /exports/:id) |
| FR-062 | Download export artifact | API-062 (GET /exports/:id/download) |
| FR-070 | Get cost summary | API-070 (GET /analytics/costs) |
| FR-080 | Get dashboard analytics | API-080 (GET /analytics/dashboard) |
| FR-090 | Create workspace | API-090 (POST /workspaces) |
| FR-091 | Create project | API-091 (POST /projects) |
| FR-100 | Login | API-100 (POST /auth/login) |
| FR-101 | Register | API-101 (POST /auth/register) |
| FR-102 | Get current user | API-102 (GET /auth/me) |

---

## 5. Functional Requirement → Database Entity Mapping

| FR Range | Domain | Primary Entities |
|----------|--------|-----------------|
| FR-001–FR-005 | Document Ingestion | Document, DocumentPage, PageImage |
| FR-020–FR-026 | MCQ Extraction | Job, JobTask, OCRArtifact, VLMOutput, MCQRecord |
| FR-030–FR-035 | Provider Management | ProviderConfig |
| FR-040–FR-047 | Hallucination Detection | HallucinationEvent, ValidationReport |
| FR-050–FR-057 | Review Workflow | ReviewItem, ReviewAction, MCQRecordHistory |
| FR-060–FR-065 | LMS Export | ExportJob, ExportArtifact |
| FR-070–FR-075 | Cost Intelligence | CostRecord |
| FR-080–FR-085 | Analytics | (Aggregated views over CostRecord, Job, MCQRecord) |
| FR-090–FR-094 | Organization | Workspace, Project |
| FR-100–FR-105 | Auth & RBAC | User, (membership via workspace_id + role) |

---

## 6. Business Requirement → Test Category Mapping

| Business Req | Unit Tests | Integration Tests | E2E Tests | Golden Dataset | Performance |
|-------------|:----------:|:-----------------:|:---------:|:--------------:|:-----------:|
| BR-001 | ✅ Validators | ✅ Upload API | ✅ E2E-003 | — | ✅ Upload load |
| BR-002 | ✅ Transformers | ✅ Queue flow | ✅ E2E-004 | ✅ Accuracy | ✅ Extraction throughput |
| BR-003 | ✅ Adapter contracts | ✅ Provider mocks | ✅ E2E-007 | ✅ Cross-provider | — |
| BR-004 | ✅ Scoring logic | ✅ Detection pipeline | — | ✅ Detection accuracy | — |
| BR-005 | ✅ State machine | ✅ Review API | ✅ E2E-005, E2E-006 | — | — |
| BR-006 | ✅ XML generators | ✅ Export pipeline | ✅ E2E-008 | — | ✅ Export speed |
| BR-007 | ✅ Cost calc | ✅ Cost tracking | — | — | — |
| BR-008 | — | ✅ Analytics queries | ✅ E2E-009 | — | ✅ Dashboard load |
| BR-009 | — | ✅ Workspace/project APIs | ✅ E2E-002 | — | — |
| BR-010 | ✅ RBAC rules | ✅ Auth middleware | ✅ E2E-010 | — | — |

---

## 7. Business Requirement → Risk Mapping

| Business Req | Associated Risks |
|-------------|-----------------|
| BR-001 | R1 (large file handling), R8 (storage costs) |
| BR-002 | R2 (extraction accuracy), R3 (provider reliability), R5 (Python bridge) |
| BR-003 | R3 (provider API stability), R4 (provider cost overruns) |
| BR-004 | R2 (hallucination detection effectiveness), R6 (false positive/negative rates) |
| BR-005 | R7 (review bottleneck at scale) |
| BR-006 | R8 (LMS compatibility across standards) |
| BR-007 | R4 (cost tracking accuracy with multiple providers) |
| BR-008 | R7 (analytics query performance at scale) |
| BR-009 | R1 (multi-tenant data isolation) |
| BR-010 | R1 (RBAC bypass = elevation of privilege) |

---

## 8. Risk Register Summary

| Risk ID | Risk Description | Likelihood | Impact | Mitigated By (BR/FR) |
|---------|-----------------|------------|--------|----------------------|
| R1 | Data isolation failure across workspaces | Low | Critical | FR-090 (workspace scoping), FR-100 (RBAC) |
| R2 | Poor AI extraction accuracy | Medium | High | FR-040–FR-047 (hallucination detection), golden dataset tests |
| R3 | Provider API instability/outage | Medium | High | FR-030 (multi-provider), adapter failover |
| R4 | Uncontrolled AI provider costs | Medium | High | FR-070–FR-075 (cost intelligence, budgets) |
| R5 | Python-Node.js bridge complexity | Low | Medium | AD-006 (FastAPI sidecar) |
| R6 | Confidence scoring calibration | Medium | Medium | FR-045 (calibration against golden dataset) |
| R7 | Review queue bottleneck at scale | Medium | Medium | FR-055 (batch review), FR-056 (auto-approve threshold) |
| R8 | LMS export format incompatibility | Medium | High | FR-060 (conformance testing against reference LMS) |

---

## 9. Phase → Deliverable → Requirement Traceability

| Phase | Key Deliverables | Requirements Covered |
|-------|-----------------|---------------------|
| P0 | Monorepo, CI/CD, DB schema, Auth, Docker | FR-100–FR-105, Infrastructure foundation |
| P1 | Upload, OCR, LLM, review, provider mgmt | FR-001–FR-005, FR-020–FR-026, FR-030–FR-035, FR-050–FR-054, FR-090–FR-094 |
| P2 | VLM, hallucination, confidence, review UX | FR-025–FR-026, FR-040–FR-047, FR-055–FR-057, FR-080–FR-082 |
| P3 | LMS export, cost intel, analytics, scale | FR-060–FR-065, FR-070–FR-075, FR-083–FR-085 |
| P4 | SSO, billing, orchestrator, knowledge graph | FR-105 (SSO), enterprise features |

---

## 10. Coverage Gaps

| Gap | Missing From | Recommendation |
|-----|-------------|---------------|
| No FR for user notification preferences | Requirements | Add FR for notification settings (email, in-app toggle) |
| No FR for API key management (Integration User) | Requirements | Add FR for API key CRUD and rate scoping |
| No FR for system health check endpoint | Requirements | Add FR for /health and /readiness endpoints |
| No FR for data export (user data, GDPR) | Requirements | Add FR for personal data export |
| No FR for system audit log viewing | Requirements | Implicit in BR-010 but needs explicit FR |
| No dedicated accessibility requirements | Requirements | Add accessibility FRs linked to WCAG 2.1 AA |
| No FR for graceful degradation (provider unavailable) | Requirements | Add FR for fallback behavior when all providers of a type fail |
