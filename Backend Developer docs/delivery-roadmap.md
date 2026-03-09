# Delivery Roadmap — MCQ Extraction Platform v2.0

## Document Purpose

This document defines the phased delivery plan, sprint structure, deliverables per phase, decision gates, critical path, risk-adjusted schedule, and recommended milestones for the MCQ Extraction Platform.

---

## 1. Phase Overview

```
Phase 0 (Foundation)     Phase 1 (MVP)          Phase 2 (VLM & Quality)    Phase 3 (LMS & Scale)     Phase 4 (Enterprise)
W1 ────── W3             W4 ────── W8           W9 ────── W14              W15 ────── W20             W21+ ──────
│ Monorepo setup         │ Upload & processing   │ VLM integration          │ LMS export               │ SSO/SCIM
│ CI/CD pipeline         │ OCR + LLM extraction  │ Hallucination detection  │ Advanced analytics       │ Multi-tenant billing
│ DB schema v1           │ Basic review queue     │ Confidence scoring       │ Performance optimization │ Agentic orchestrator
│ Auth scaffolding       │ Provider management    │ Side-by-side review      │ Cost intelligence        │ Knowledge graph
│ Docker Compose         │ Job queue system       │ Golden dataset tests     │ Bulk operations          │ Marketplace
│ Core packages          │ Basic analytics        │ Diff viewer              │ xAPI / cmi5 / SCORM      │ Plugin system
└─────────┘              └─────────┘              └──────────┘              └──────────┘               └──────────┘
```

---

## 2. Phase 0: Foundation (Weeks 1–3)

### 2.1 Objective

Establish the technical foundation so all subsequent phases can build on a stable, consistent, automated platform.

### 2.2 Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|------------|-------|-------------------|
| P0-001 | Turborepo monorepo structure | Engineering | `apps/` and `packages/` scaffold; `turbo build`, `turbo lint`, `turbo test` working |
| P0-002 | CI/CD pipeline | Engineering | Lint → typecheck → test → build → deploy-to-dev on merge to main |
| P0-003 | Docker Compose (local) | Engineering | All services start with `docker compose up`; hot reload working |
| P0-004 | PostgreSQL schema v1 | Engineering | Core entities (User, Workspace, Project, Document, DocumentPage, Job, JobTask) migrated via Drizzle |
| P0-005 | Redis + BullMQ setup | Engineering | Queue creation, basic enqueue/dequeue, bull-board accessible |
| P0-006 | Auth scaffolding | Engineering | Login/register, session management, RBAC middleware, role seeding |
| P0-007 | S3 integration | Engineering | MinIO in local; upload/download via signed URL working |
| P0-008 | Core packages | Engineering | `packages/shared-types`, `packages/db`, `packages/queue`, `packages/logger`, `packages/config` scaffolded |
| P0-009 | Frontend shell | Engineering | Next.js app with layout, routing, auth pages, shadcn/ui installed |
| P0-010 | Python parser service | Engineering | FastAPI service with health check; PyMuPDF-based page extraction working |
| P0-011 | Coding standards | Engineering | ESLint config, Prettier config, commit hooks (husky + lint-staged) |

### 2.3 Decision Gate P0→P1

| Decision | Required Answer |
|----------|----------------|
| Drizzle or Prisma? | Finalize ORM choice |
| Auth provider choice? | Built-in vs Auth0/Clerk |
| Cloud provider? | AWS / GCP / Azure / Self-hosted |
| CI/CD tool? | GitHub Actions / GitLab CI / other |

---

## 3. Phase 1: MVP (Weeks 4–8)

### 3.1 Objective

Deliver a working end-to-end extraction pipeline: upload PDF → OCR → LLM extraction → MCQ records → basic review → table view.

### 3.2 Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|------------|-------|-------------------|
| P1-001 | Document upload flow | Full-stack | Drag-and-drop upload → S3 storage → document record created → thumbnail generation |
| P1-002 | OCR pipeline | Backend | Queue job → OCR provider adapter → OCR artifact stored → status updates via SSE/polling |
| P1-003 | LLM extraction pipeline | Backend | OCR text → LLM prompt → structured MCQ JSON → MCQ records saved |
| P1-004 | Provider management UI | Front-end | Configure OCR/LLM providers, test connection, save encrypted API keys |
| P1-005 | Provider adapter framework | Backend | ProviderAdapter interface; at least 2 OCR + 2 LLM adapters implemented |
| P1-006 | Job monitoring | Full-stack | Job list with status, progress bar, real-time updates |
| P1-007 | MCQ record table | Front-end | TanStack Table with pagination, sorting, filtering; inline editing |
| P1-008 | Basic review queue | Full-stack | Approve/reject MCQ records; status transitions |
| P1-009 | Document detail view | Front-end | Page thumbnails, metadata, linked MCQ records |
| P1-010 | Dashboard v1 | Front-end | Overview stats: documents processed, MCQs extracted, jobs in progress |
| P1-011 | User management | Full-stack | Invite users, assign roles, list/deactivate users |
| P1-012 | Workspace/project management | Full-stack | Create/edit workspace plus project; project-level settings |
| P1-013 | Error handling | Full-stack | Graceful error display, retry failed jobs, error boundary components |
| P1-014 | Integration tests | QA | API route tests, queue integration tests, provider mock tests |
| P1-015 | E2E tests (P1 flows) | QA | Upload → process → view MCQs; login/register; provider config |

### 3.3 Decision Gate P1→P2

| Decision | Required Answer |
|----------|----------------|
| VLM provider selection | Which VLM providers to integrate first? |
| Review workflow depth | How complex should the review workflow be? |
| Confidence scoring model | Exact signals and weights for scoring? |
| Staging environment ready? | Deployed and accessible for QA? |

---

## 4. Phase 2: VLM & Quality (Weeks 9–14)

### 4.1 Objective

Add visual-language model extraction, hallucination detection, confidence scoring, and an enhanced review experience.

### 4.2 Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|------------|-------|-------------------|
| P2-001 | VLM extraction pipeline | Backend | Page images → VLM provider → structured MCQ output → merged with LLM output |
| P2-002 | Hallucination detection (Tier 1: Model) | Backend | Model self-consistency checks; confidence signals extracted |
| P2-003 | Hallucination detection (Tier 2: Context) | Backend | Source-grounding validation; cross-reference with OCR text |
| P2-004 | Hallucination detection (Tier 3: Data) | Backend | Statistical outlier detection; cross-document consistency |
| P2-005 | Composite confidence scoring | Backend | Multi-signal scoring (0–100); configurable weights |
| P2-006 | Side-by-side review UI | Front-end | PDF page image left, MCQ record right; inline editing |
| P2-007 | Diff viewer | Front-end | Track changes between MCQ versions; before/after comparison |
| P2-008 | Review queue enhancements | Full-stack | Filtering by confidence, assignment, priority; batch actions |
| P2-009 | MCQ record versioning | Backend | Full history of edits; version comparison |
| P2-010 | Golden dataset framework | QA | Curated test PDFs + expected MCQs; automated regression runner |
| P2-011 | Validation pipeline (8 stages) | Backend | All 8 validation stages implemented and tested |
| P2-012 | Segment management | Backend | Document segmentation; segment-to-MCQ linkage |
| P2-013 | Enhanced analytics | Front-end | Provider performance comparison; quality trends over time |
| P2-014 | Notification system | Full-stack | In-app notifications for job completion, review assignments |

### 4.3 Decision Gate P2→P3

| Decision | Required Answer |
|----------|----------------|
| LMS export formats priority | QTI 2.1 first? Which LMS for validation? |
| Scale targets | Concurrent users, document volume, queue throughput? |
| Knowledge graph approach | Neo4j vs pgvector vs Apache AGE? |
| Cost intelligence requirements | Per-provider, per-document, or per-workspace billing? |

---

## 5. Phase 3: LMS & Scale (Weeks 15–20)

### 5.1 Objective

Add LMS export capabilities, advanced analytics, cost intelligence, performance optimization, and bulk operations.

### 5.2 Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|------------|-------|-------------------|
| P3-001 | QTI 2.1 / 3.0 export | Backend | Generate valid QTI XML; import tested against reference LMS |
| P3-002 | SCORM 1.2 / 2004 export | Backend | Generate SCORM package; import tested |
| P3-003 | xAPI statement generation | Backend | Generate xAPI statements for MCQ interactions |
| P3-004 | cmi5 support | Backend | Generate cmi5-compliant packages |
| P3-005 | Export management UI | Front-end | Select records → choose format → configure options → download |
| P3-006 | Cost intelligence module | Full-stack | Per-provider cost tracking, per-workspace budgets, alerts |
| P3-007 | Advanced analytics dashboard | Front-end | Recharts dashboards; drill-down; custom date ranges; comparison charts |
| P3-008 | Bulk operations | Full-stack | Bulk upload, bulk re-extract, bulk approve, bulk export |
| P3-009 | Performance optimization | Backend | Database query optimization, caching, connection pooling (PgBouncer) |
| P3-010 | Horizontal scaling validation | DevOps | Load test with multiple worker instances; auto-scaling rules |
| P3-011 | Command palette (cmdk) | Front-end | Keyboard-driven navigation and actions |
| P3-012 | Keyboard shortcuts | Front-end | Review queue navigation, common actions |
| P3-013 | Performance testing suite | QA | k6 load tests; baseline established |

---

## 6. Phase 4: Enterprise (Weeks 21+)

### 6.1 Objective

Enterprise-grade features: SSO, multi-tenant billing, agentic orchestrator, knowledge graph, public API, plugin system.

### 6.2 Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|------------|-------|-------------------|
| P4-001 | SSO / OIDC integration | Backend | Login via SAML/OIDC; automatic user provisioning |
| P4-002 | SCIM user provisioning | Backend | Sync users from enterprise IdP |
| P4-003 | Multi-tenant billing | Full-stack | Usage-based billing per workspace; Stripe integration |
| P4-004 | Agentic orchestrator | Backend | Multi-step, LLM-driven pipeline orchestration with human-in-the-loop |
| P4-005 | Knowledge graph | Backend | Concept/topic graph for MCQ deduplication and enrichment |
| P4-006 | Public API v2 | Backend | Versioned public API with API key management; rate limiting; documentation |
| P4-007 | Plugin / extension system | Architecture | Plugin registry; sandboxed execution; community contributions |
| P4-008 | LTI integration | Full-stack | LTI 1.3 for direct MCQ delivery to LMS |
| P4-009 | Semantic search | Backend | pgvector-based search across MCQ content |
| P4-010 | White-label support | Full-stack | Custom branding, domains, and themes per workspace |

---

## 7. Critical Path Analysis

The critical path determines the minimum time to reach each phase's key milestone.

### 7.1 Phase 0 Critical Path

```
Monorepo setup → Docker Compose → PostgreSQL schema → Auth scaffolding → CI/CD pipeline
       │
       └→ Python parser service (parallel)
```

**Bottleneck risk:** If auth provider decision is delayed, phase cannot complete.

### 7.2 Phase 1 Critical Path

```
Provider adapter framework → OCR pipeline → LLM extraction → MCQ record storage
       │                                                            │
       └→ Upload flow (parallel) ──────────────────────────────────→│
                                                                    │
                                                                    └→ MCQ table + review queue
```

**Bottleneck risk:** Provider adapter complexity; first-time integration with OCR/LLM APIs.

### 7.3 Phase 2 Critical Path

```
VLM pipeline → Hallucination detection → Confidence scoring → Review UI
       │
       └→ Golden dataset curation (parallel, long lead time)
```

**Bottleneck risk:** Hallucination detection algorithm design; golden dataset curation effort.

### 7.4 Phase 3 Critical Path

```
QTI export engine → LMS validation testing → Export UI
       │
       └→ Cost intelligence (parallel)
       └→ Performance optimization (parallel)
```

**Bottleneck risk:** LMS compatibility testing; reference LMS availability.

---

## 8. Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint length | 2 weeks |
| Sprint planning | Monday of sprint start |
| Daily standup | Daily, 15 min |
| Sprint review/demo | Friday of sprint end |
| Sprint retro | Friday of sprint end (after review) |
| Release cadence | End of each phase; hotfixes as needed |

### 8.1 Phase-to-Sprint Mapping

| Phase | Weeks | Sprints |
|-------|-------|---------|
| Phase 0 | W1–W3 | Sprint 1 (partial), Sprint 2 |
| Phase 1 | W4–W8 | Sprints 2–4 |
| Phase 2 | W9–W14 | Sprints 5–7 |
| Phase 3 | W15–W20 | Sprints 8–10 |
| Phase 4 | W21+ | Sprints 11+ |

---

## 9. Risk-Adjusted Schedule

| Risk | Probability | Impact on Schedule | Mitigation |
|------|------------|-------------------|------------|
| Auth provider decision delay | Medium | 1–2 week slip in P0 | Set decision deadline at W1 end |
| OCR/LLM API integration difficulty | Medium | 1 week slip in P1 | Start provider research in P0; mock early |
| Hallucination detection complexity | High | 2 week slip in P2 | Start with simple heuristics; iterate |
| LMS compatibility testing | Medium | 1–2 week slip in P3 | Identify reference LMS early; use conformance test suites |
| Team size uncertainty | High | Phase duration scales with team | Define team composition in P0 |
| Python bridge complexity | Low | 1 week slip in P0 | FastAPI sidecar is well-understood pattern |
| Scope creep | Medium | All phases | Strict sprint scope; product owner approval for additions |

**Buffer recommendation:** Add 20% buffer to each phase timeline.

---

## 10. Staffing Assumptions

**Note:** Source document does not specify team size. All timelines above assume a team composition below. If the team differs, phase durations must be recalculated.

| Role | Count (minimum viable) | Responsibilities |
|------|----------------------|-----------------|
| Full-stack engineer | 2–3 | Frontend + Backend development |
| Backend / ML engineer | 1 | Provider integrations, extraction pipeline, confidence scoring |
| DevOps / Infrastructure | 0.5 (shared) | CI/CD, Docker, deployment, monitoring |
| QA engineer | 0.5 (shared) | Test strategy, E2E tests, golden dataset |
| Product owner | 1 | Requirements, prioritization, user story refinement |
| Designer | 0.5 (shared) | UI/UX for key screens |

**Total minimum viable team: 4.5–6 FTEs.**

---

## 11. Milestones and Success Criteria

| Milestone | Target Date | Success Criteria |
|-----------|------------|-----------------|
| M0: Development Ready | End of W3 | All P0 deliverables complete; CI green; dev environment stable |
| M1: MVP Demo | End of W8 | Upload → extract → review → view MCQs works end-to-end |
| M2: Quality Gate | End of W14 | Hallucination detection + confidence scoring live; golden tests pass |
| M3: LMS Ready | End of W20 | QTI export tested against reference LMS; performance benchmarks met |
| M4: Enterprise Beta | W24+ | SSO working; multi-tenant billing live; public API documented |

---

## 12. Dependencies (External)

| Dependency | Required By | Risk |
|-----------|-------------|------|
| AI provider API keys | Phase 1 start | Procurement delay |
| Reference LMS for QTI testing | Phase 3 | Availability, licensing |
| Cloud provider account | Phase 0 (for staging/prod) | Budget approval |
| Domain name + TLS certificate | Phase 1 (staging deploy) | DNS propagation |
| Design mockups | Phase 1 start | Designer availability |
| Golden dataset content | Phase 2 | Content creation effort |
