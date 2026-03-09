# Open Questions & Assumptions — MCQ Extraction Platform v2.0

## Document Purpose

This document catalogs all open questions, unresolved decisions, explicit assumptions, and implicit assumptions identified across the planning document. Each item is tagged by domain, severity, and the phase by which it must be resolved.

---

## 1. Open Questions

### 1.1 Product & Business

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-P01 | What is the target team size and composition? | Phase duration, feature scope per sprint | Phase 0 (W1) | All timeline estimates depend on this |
| OQ-P02 | What is the project budget (infrastructure, AI API costs, tooling)? | Cloud provider choice, AI provider selection, managed vs self-hosted | Phase 0 (W1) | Affects every deployment decision |
| OQ-P03 | Who is the primary target user persona? | UI/UX priorities, workflow design | Phase 0 | Academic institutions? Training companies? Publishers? |
| OQ-P04 | What are file size and page count limits? | Upload UX, queue sizing, S3 cost | Phase 1 | Source doc says "up to 200 pages" in one place but no firm limit |
| OQ-P05 | Is this a SaaS product or an on-premises deployment? | Multi-tenancy, billing, infrastructure | Phase 0 | Affects architecture fundamentally |
| OQ-P06 | What languages must MCQ content support? | OCR model selection, LLM prompt design, RTL layout | Phase 1 | Arabic mentioned in context; full language list needed |
| OQ-P07 | What is the expected document volume (daily, monthly)? | Infrastructure sizing, queue capacity, cost projections | Phase 0 | No volume targets in source doc |

### 1.2 Architecture

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-A01 | Drizzle ORM or Prisma? | DX, migration strategy, query complexity | Phase 0 (W1) | Source says "Drizzle (preferred)" — needs final decision |
| OQ-A02 | How will the Python parser service communicate with Node.js backend? | API design, deployment, error handling | Phase 0 (W2) | Recommended: FastAPI HTTP sidecar (AD-006) |
| OQ-A03 | Neo4j vs pgvector vs Apache AGE for knowledge graph? | Infrastructure cost, query patterns, operational complexity | Phase 3 | Source mentions all three options |
| OQ-A04 | Will the orchestrator (Phase 4) be a separate service or part of the worker? | Service topology, deployment complexity | Phase 4 | Currently specified as separate app |
| OQ-A05 | Is real-time collaboration needed (e.g., multiple reviewers on same document)? | WebSocket infrastructure, conflict resolution | Phase 2 | Not mentioned in source doc |
| OQ-A06 | What is the target RPO and RTO for disaster recovery? | Backup strategy, replication, failover | Phase 1 | Assumed RPO 1hr / RTO 4hr in databases.md |

### 1.3 Frontend

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-F01 | Design system — are design mockups / Figma files available? | UI development speed, consistency | Phase 0 | If not, frontend team needs to design from spec |
| OQ-F02 | Should the review UI support touch/tablet devices? | Responsive design scope, interaction patterns | Phase 1 | Not specified |
| OQ-F03 | Is offline or progressive web app functionality needed? | Service worker, caching strategy | Phase 3+ | Not mentioned |
| OQ-F04 | What accessibility standard is targeted (WCAG 2.1 AA vs AAA)? | UI complexity, testing effort | Phase 0 | Assumed AA |
| OQ-F05 | What visualization library for analytics? | Chart components, learning curve | Phase 1 | Recharts specified; confirm |

### 1.4 Backend

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-B01 | What are the exact concurrency limits per queue? | Worker resource allocation, rate limiting | Phase 1 | Source doc provides initial values; need validation |
| OQ-B02 | What happens when a provider's API key expires or is revoked mid-job? | Error handling, retry strategy, user notification | Phase 1 | Not fully specified |
| OQ-B03 | Should extraction support custom prompts per project or per document? | Prompt management UI, storage, versioning | Phase 2 | Prompt versioning mentioned but scope unclear |
| OQ-B04 | Is there a maximum number of MCQs expected per document? | Array sizing, pagination, memory | Phase 1 | Not specified |
| OQ-B05 | What is the expected provider response time SLA? | Timeout configuration, user expectations | Phase 1 | Source specifies some timeouts (30s–120s) |

### 1.5 API

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-API01 | Should the API support GraphQL in addition to REST? | API layer complexity, frontend querying | Phase 2+ | Not mentioned; REST only assumed |
| OQ-API02 | What is the API versioning strategy (URL-based vs header-based)? | Routing, backward compatibility | Phase 1 | URL-based (/api/v1) assumed |
| OQ-API03 | Is webhook delivery to external consumers needed? | Webhook infrastructure, retry logic | Phase 3 | Not specified for external consumers |
| OQ-API04 | Rate limiting thresholds — are the defaults acceptable? | Security, fairness | Phase 1 | Defaults proposed in security.md; need review |
| OQ-API05 | Should the public API (Phase 4) support batch operations? | API design, request complexity | Phase 4 | Not detailed |

### 1.6 Database

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-D01 | Will PostgreSQL need read replicas? | Read scalability, cost | Phase 3 | Depends on query volume |
| OQ-D02 | Should PgBouncer or similar be deployed from the start? | Connection management, Pool sizing | Phase 1 | Recommended for production |
| OQ-D03 | What is the data retention policy for processed artifacts? | S3 costs, compliance | Phase 1 | 90 days assumed; needs confirmation |
| OQ-D04 | Is soft delete sufficient or is hard delete required for GDPR? | Schema design, compliance | Phase 1 | Soft delete assumed |
| OQ-D05 | Maximum expected database size in 12 months? | Disk provisioning, backup strategy | Phase 0 | No volume estimates in source |

### 1.7 DevOps

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-DO01 | Cloud provider selection (AWS / GCP / Azure / self-hosted)? | All infrastructure decisions | Phase 0 (W1) | Critical decision; blocks staging deployment |
| OQ-DO02 | Docker Compose or Kubernetes for production? | Operational complexity, scaling capability | Phase 1 | Docker Compose simpler; K8s for scale |
| OQ-DO03 | Is a CDN required for static assets / page images? | Performance, cost | Phase 2 | Not specified |
| OQ-DO04 | CI/CD tool selection (GitHub Actions / GitLab CI / other)? | Pipeline configuration | Phase 0 (W1) | Depends on code hosting |
| OQ-DO05 | Container registry choice? | Image storage, CI integration | Phase 0 | Docker Hub, ECR, GCR, GitHub Container Registry |

### 1.8 Security

| ID | Question | Impact | Resolve By | Notes |
|----|----------|--------|-----------|-------|
| OQ-S01 | SSO/OAuth provider (Auth0, Clerk, custom)? | Auth implementation, cost | Phase 0 | Built-in for MVP; SSO for Phase 4 |
| OQ-S02 | SOC 2 / ISO 27001 compliance required? | Audit depth, logging, access controls | Phase 3 | If enterprise customers expected |
| OQ-S03 | Data residency requirements? | Cloud region, DB region | Phase 1 | Affects deployment topology |
| OQ-S04 | Vulnerability response SLA target? | Incident response process | Phase 1 | Not specified |

---

## 2. Explicit Assumptions (Stated in Source Document)

| ID | Assumption | Source Section | Risk if Wrong |
|----|-----------|----------------|---------------|
| EA-01 | Turborepo monorepo is the right structure | Section 4 | Low — well-understood pattern |
| EA-02 | BullMQ + Redis is sufficient for job management | Section 14 | Medium — may need dedicated workflow engine for complex orchestration |
| EA-03 | PostgreSQL handles all data storage needs | Section 17 | Low — pg extensions cover vector/text search |
| EA-04 | Provider adapter pattern enables easy provider swapping | Section 8 | Low — well-proven interface pattern |
| EA-05 | Queue-driven architecture is the right async model | Section 14 | Low — standard for batch processing |
| EA-06 | 6 user roles cover all access patterns | Section 5 | Medium — enterprise may need custom roles |
| EA-07 | 4-phase delivery is realistic | Section 33 | High — depends on team size |
| EA-08 | Drizzle ORM is preferred over Prisma | Section 17 | Low — but needs definitive decision |

---

## 3. Implicit Assumptions (Inferred from Analysis)

| ID | Assumption | Where Identified | Risk if Wrong | Recommendation |
|----|-----------|-----------------|---------------|----------------|
| IA-01 | English is the primary language; other languages are secondary | No language specification | High — OCR/LLM model selection, prompt design, UI layout all affected | Clarify language requirements in Phase 0 |
| IA-02 | Users have reliable internet connectivity | No offline mode mentioned | Medium — affects UX for large uploads | Consider resumable uploads (tus protocol) |
| IA-03 | AI provider APIs are stable and backward-compatible | No API versioning handling for providers | Medium — breaking changes could disrupt extraction | Pin provider API versions; add adapter versioning |
| IA-04 | Docker is available in all deployment environments | Docker Compose is the deployment model | Low — standard in modern infrastructure | Confirm with operations team |
| IA-05 | Single geographic region deployment | No multi-region mentioned | Medium — data residency, latency | Confirm with product owner |
| IA-06 | Browser support is modern evergreen browsers | No browser matrix specified | Low — Next.js + shadcn/ui targets modern browsers | Confirm minimum browser versions |
| IA-07 | 50 MB file size limit is acceptable | No firm limit in source | Medium — some exam banks are >100 MB | Validate with user research |
| IA-08 | Team has TypeScript, React, Express, PostgreSQL experience | Full TypeScript stack chosen | High — learning curve affects velocity | Staff accordingly |
| IA-09 | AI extraction accuracy > 80% is "good enough" for MVP | No accuracy target specified | High — user expectations determine product viability | Define acceptance threshold |
| IA-10 | Concurrent users at MVP < 20 | No concurrent user targets | Medium — affects infrastructure sizing | Gather usage projections |

---

## 4. Assumptions from Generated Documentation

These assumptions were made during documentation generation where the source document was ambiguous or silent.

| ID | Assumption | Made In | Needs Validation |
|----|-----------|---------|-----------------|
| DA-01 | RPO 1 hour, RTO 4 hours for database | databases.md | Yes — must align with business requirements |
| DA-02 | Session TTL 24 hours, idle timeout 2 hours | security.md | Yes — may need adjustment for user experience |
| DA-03 | Rate limits (5 login, 100 read, 30 write per minute) | security.md | Yes — may be too restrictive for heavy users |
| DA-04 | 90-day data retention for processed artifacts | databases.md | Yes — compliance and cost implications |
| DA-05 | 30-day backup retention | devops.md | Yes — align with DR requirements |
| DA-06 | Minimum viable team 4.5–6 FTEs | delivery-roadmap.md | Yes — critical for timeline validity |
| DA-07 | 2-week sprint cadence | delivery-roadmap.md | Yes — confirm with team |
| DA-08 | WCAG 2.1 AA accessibility target | frontend.md | Yes — AAA may be required |
| DA-09 | Python FastAPI sidecar for document parsing | architecture-design.md | Yes — alternative: WASM, child_process, gRPC |

---

## 5. Summary Matrix

| Category | Open Questions | Explicit Assumptions | Implicit Assumptions | Doc Assumptions |
|----------|---------------|---------------------|---------------------|----------------|
| Product & Business | 7 | 2 | 3 | 1 |
| Architecture | 6 | 5 | 2 | 2 |
| Frontend | 5 | 0 | 1 | 1 |
| Backend | 5 | 0 | 0 | 0 |
| API | 5 | 0 | 0 | 1 |
| Database | 5 | 1 | 0 | 2 |
| DevOps | 5 | 0 | 2 | 1 |
| Security | 4 | 0 | 0 | 1 |
| **Total** | **42** | **8** | **10** | **9** |

---

## 6. Resolution Priority

### Must Resolve in Phase 0 (Critical Blockers)

1. **OQ-P01** — Team size and composition
2. **OQ-P02** — Project budget
3. **OQ-DO01** — Cloud provider selection
4. **OQ-A01** — Drizzle vs Prisma finalization
5. **OQ-DO04** — CI/CD tool selection
6. **OQ-S01** — Auth provider for MVP
7. **OQ-P05** — SaaS vs on-premises deployment model
8. **OQ-P07** — Expected document volume

### Should Resolve Before Phase 1

9. **OQ-P04** — File size and page count limits
10. **OQ-P06** — Supported languages
11. **OQ-F01** — Design mockups availability
12. **IA-09** — Extraction accuracy acceptance threshold
13. **DA-01** — RPO/RTO validation

### Should Resolve Before Phase 2

14. **OQ-A05** — Real-time collaboration needs
15. **OQ-B03** — Custom prompt scope
16. **DA-06** — Team size validation against timeline
