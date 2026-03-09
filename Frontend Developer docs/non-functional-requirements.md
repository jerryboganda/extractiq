# Non-Functional Requirements — MCQ Extraction Platform v2.0

## Document Purpose

This document specifies the non-functional requirements (NFRs) covering performance, scalability, reliability, availability, accessibility, usability, security, maintainability, and observability for the MCQ Extraction Platform.

**Note:** Many NFR targets are assumptions derived from the source document's architecture and technology choices, since explicit targets were not always specified. All targets marked with **(assumed)** must be validated with stakeholders.

---

## 1. Performance

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-P01 | API response time (read endpoints) | p50 < 200ms, p95 < 500ms, p99 < 1s **(assumed)** | Application metrics (OpenTelemetry) | P1 |
| NFR-P02 | API response time (write endpoints) | p50 < 300ms, p95 < 800ms **(assumed)** | Application metrics | P1 |
| NFR-P03 | Dashboard page load time | < 2s (initial), < 500ms (subsequent) **(assumed)** | Lighthouse, Real User Monitoring | P1 |
| NFR-P04 | MCQ table rendering (1000 rows) | < 1s with virtualization **(assumed)** | Frontend performance profiling | P2 |
| NFR-P05 | PDF upload throughput | ≥ 10 concurrent uploads without degradation **(assumed)** | Load testing (k6) | P1 |
| NFR-P06 | Single-page OCR processing time | < 30s per page (provider-dependent) | Job metrics | P1 |
| NFR-P07 | Single-document extraction (10 pages) | < 5 minutes end-to-end **(assumed)** | Job metrics | P1 |
| NFR-P08 | Export generation (500 MCQs to QTI) | < 30s **(assumed)** | Export job metrics | P3 |
| NFR-P09 | Search query response time | < 500ms for up to 100K MCQ records **(assumed)** | Database query metrics | P2 |
| NFR-P10 | Real-time status updates | < 2s latency for job status changes **(assumed)** | SSE/polling latency metrics | P1 |

---

## 2. Scalability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-S01 | Concurrent users | ≥ 50 concurrent users without degradation **(assumed)** | Load testing | P3 |
| NFR-S02 | Document volume | ≥ 1000 documents per workspace **(assumed)** | Database query performance at scale | P2 |
| NFR-S03 | MCQ record volume | ≥ 100,000 records per workspace **(assumed)** | Pagination + indexing performance | P2 |
| NFR-S04 | Worker horizontal scaling | Linear throughput increase with added workers | Queue throughput metrics | P1 |
| NFR-S05 | Queue depth handling | System stable with 500+ queued jobs **(assumed)** | Queue backpressure testing | P2 |
| NFR-S06 | Database connection pooling | Support 100+ connections via PgBouncer **(assumed)** | Connection pool metrics | P3 |
| NFR-S07 | S3 storage scalability | No application-level limits; governed by S3 service limits | S3 metrics | P1 |
| NFR-S08 | API rate limiting | Per-user limits enforced without shared-state bottleneck | Redis-backed rate limiter metrics | P1 |

---

## 3. Reliability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-R01 | Job completion rate | ≥ 99% of valid jobs complete successfully **(assumed)** | Job success/failure ratio | P1 |
| NFR-R02 | Data durability | Zero data loss for committed transactions | PostgreSQL durability guarantees | P0 |
| NFR-R03 | File durability | 99.999999999% (S3 standard tier) | S3 SLA | P0 |
| NFR-R04 | Queue reliability | No lost jobs; at-least-once delivery | BullMQ + Redis persistence | P0 |
| NFR-R05 | Graceful degradation | Provider failure does not crash the system; errors isolated | Error boundary + circuit breaker testing | P1 |
| NFR-R06 | Retry resilience | Failed jobs retry with exponential backoff (max 3 retries) | Job retry metrics | P1 |
| NFR-R07 | Database migration safety | Backward-compatible migrations; rollback tested | Migration testing in CI | P0 |

---

## 4. Availability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-A01 | Application uptime | ≥ 99.5% monthly **(assumed)** | Uptime monitoring (health checks) | P1 |
| NFR-A02 | Planned maintenance window | < 30 minutes per event **(assumed)** | Deployment logs | P1 |
| NFR-A03 | Zero-downtime deployment | Rolling updates with no user-visible downtime | Deployment process validation | P1 |
| NFR-A04 | Recovery Point Objective (RPO) | ≤ 1 hour **(assumed)** | Backup frequency verification | P1 |
| NFR-A05 | Recovery Time Objective (RTO) | ≤ 4 hours **(assumed)** | DR drill execution time | P1 |
| NFR-A06 | Health check endpoints | /health (liveness) and /ready (readiness) on all services | Automated monitoring | P0 |

---

## 5. Accessibility

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-ACC01 | WCAG compliance level | WCAG 2.1 Level AA **(assumed)** | Automated (axe-core) + manual audit | P1 |
| NFR-ACC02 | Keyboard navigation | All interactive elements reachable by keyboard | Manual testing + Playwright | P1 |
| NFR-ACC03 | Screen reader support | All content accessible via screen reader | Testing with NVDA/VoiceOver | P2 |
| NFR-ACC04 | Color contrast ratio | ≥ 4.5:1 for normal text, ≥ 3:1 for large text | Automated contrast checker | P1 |
| NFR-ACC05 | Focus management | Visible focus indicators on all interactive elements | Visual inspection + automated tests | P1 |
| NFR-ACC06 | ARIA labels | All non-text controls have accessible labels | axe-core audit | P1 |
| NFR-ACC07 | Form accessibility | All form fields have associated labels; errors announced | Manual + automated testing | P1 |
| NFR-ACC08 | Motion sensitivity | Respect `prefers-reduced-motion` media query | CSS/component testing | P1 |

---

## 6. Usability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-U01 | Time to first extraction | < 10 minutes from account creation to first MCQ result **(assumed)** | Onboarding flow timing | P1 |
| NFR-U02 | Error message clarity | All errors include actionable guidance | UX review | P1 |
| NFR-U03 | Loading states | Every async operation shows a loading indicator | Visual audit | P1 |
| NFR-U04 | Empty states | Meaningful empty state messages with CTAs | Visual audit | P1 |
| NFR-U05 | Responsive design | Usable on viewport widths ≥ 1024px **(assumed)** | Browser testing | P1 |
| NFR-U06 | Undo/redo for MCQ editing | Undo last edit action | Frontend state management | P2 |
| NFR-U07 | System feedback | User receives confirmation for all state-changing actions | UX review | P1 |

---

## 7. Security

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-SEC01 | Authentication | All endpoints authenticated except public health checks | Integration test suite | P0 |
| NFR-SEC02 | Authorization | RBAC enforced server-side on every request | RBAC integration tests | P0 |
| NFR-SEC03 | Data encryption at rest | AES-256 for database; SSE for S3 | Infrastructure audit | P0 |
| NFR-SEC04 | Data encryption in transit | TLS 1.2+ for all external connections | SSL Labs scan | P0 |
| NFR-SEC05 | Secret management | No secrets in source code, logs, or Docker images | Secret scanning in CI | P0 |
| NFR-SEC06 | Input validation | All inputs validated via Zod schemas | Unit + integration tests | P1 |
| NFR-SEC07 | File upload security | File type + size + virus scanning before processing | Integration tests with malicious files | P1 |
| NFR-SEC08 | Rate limiting | All endpoints rate-limited per user/IP | Load testing | P1 |
| NFR-SEC09 | Dependency security | No known critical vulnerabilities in dependencies | npm audit + Snyk in CI | P0 |
| NFR-SEC10 | Audit logging | All security-relevant events logged immutably | Audit log completeness audit | P1 |
| NFR-SEC11 | Session security | httpOnly, Secure, SameSite=Strict cookies | Security header scan | P0 |

---

## 8. Maintainability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-M01 | Code coverage | ≥ 70% overall; ≥ 80% for new code | CI coverage reports | P1 |
| NFR-M02 | TypeScript strict mode | `strict: true` in all tsconfig files | TypeScript compilation | P0 |
| NFR-M03 | Linting | Zero ESLint errors on main branch | CI lint stage | P0 |
| NFR-M04 | Formatting | Consistent formatting via Prettier | CI format check | P0 |
| NFR-M05 | Dependency management | Dependencies reviewed quarterly; automated security updates | Dependabot/Renovate | P1 |
| NFR-M06 | API documentation | All public API endpoints documented | OpenAPI/Swagger spec | P1 |
| NFR-M07 | Code modularity | Shared logic in packages/; no circular dependencies | Monorepo build graph validation | P0 |
| NFR-M08 | Database migrations | All schema changes via Drizzle migrations; never manual DDL | Migration audit | P0 |

---

## 9. Observability

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-O01 | Structured logging | All services emit JSON structured logs to stdout | Log format validation | P0 |
| NFR-O02 | Log correlation | Request ID propagated across all services for a single request | Distributed trace inspection | P1 |
| NFR-O03 | Metrics collection | Key metrics (latency, throughput, error rate, queue depth) collected | Prometheus/OTel scrape validation | P1 |
| NFR-O04 | Distributed tracing | End-to-end traces for API → worker → provider calls | Trace sampling validation | P2 |
| NFR-O05 | Alerting | Alerts for: service down, error rate > 5%, queue stalled, disk > 80% | Alerting rule validation | P1 |
| NFR-O06 | Dashboard visibility | Operational dashboards for key system metrics | Grafana/equivalent dashboard | P1 |
| NFR-O07 | Queue observability | BullMQ dashboard accessible with job inspection | bull-board deployment verification | P0 |

---

## 10. Compliance

| ID | Requirement | Target | Measurement | Phase |
|----|------------|--------|-------------|-------|
| NFR-C01 | Data retention | Configurable retention periods per workspace | Settings validation | P2 |
| NFR-C02 | Data deletion | Hard delete capability for user data (GDPR right to erasure) **(assumed)** | Deletion integration tests | P2 |
| NFR-C03 | Data export | Users can export their data in machine-readable format **(assumed)** | Export feature validation | P3 |
| NFR-C04 | Consent tracking | Record user consent for data processing **(if required)** | Consent flow audit | P3 |
| NFR-C05 | Audit trail | Immutable audit log with 1-year retention | Audit log integrity checks | P1 |

---

## 11. NFR Priority Matrix

| Priority | NFR IDs | Phase |
|----------|---------|-------|
| **Critical** (blocks launch) | NFR-SEC01–SEC05, NFR-R02–R04, NFR-A06, NFR-M02–M04, NFR-O01 | P0 |
| **High** (needed for MVP) | NFR-P01–P03, NFR-P06, NFR-R01, NFR-R05–R06, NFR-A01, NFR-A03, NFR-ACC01–ACC02, NFR-U01–U04, NFR-SEC06–SEC11, NFR-M01, NFR-O02–O03, NFR-O05–O07 | P1 |
| **Medium** (needed for quality) | NFR-P04–P05, NFR-P09–P10, NFR-S01–S05, NFR-A04–A05, NFR-ACC03–ACC08, NFR-U05–U07, NFR-O04, NFR-C01–C02, NFR-C05 | P2 |
| **Lower** (enhancement) | NFR-P07–P08, NFR-S06–S08, NFR-M05–M08, NFR-C03–C04 | P3+ |

---

## 12. NFR Gaps

| Gap | Description | Recommendation |
|-----|-------------|---------------|
| No explicit performance targets in source document | All performance targets are assumed | Conduct stakeholder workshop to set realistic targets |
| No concurrent user target | Infrastructure sizing depends on this | Define based on expected user base |
| No network bandwidth requirements | Affects upload experience, especially for large PDFs | Measure and set minimum requirements |
| No browser/OS compatibility matrix | Testing scope unclear | Define minimum supported browsers and OS |
| No internationalization (i18n) requirements | UI language support scope unknown | Clarify if UI must support multiple languages |
| No data sovereignty requirements | Cloud region selection depends on this | Clarify with legal/compliance team |
