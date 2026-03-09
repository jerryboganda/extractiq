# QA & Testing Strategy — MCQ Extraction Platform v2.0

## Document Purpose

This document defines the testing philosophy, test pyramid, test categories, tooling, automation strategy, and quality gates for the MCQ Extraction Platform.

---

## 1. Testing Philosophy

- **Shift-left:** Catch defects as early as possible (type checking, linting, unit tests).
- **Automate everything repeatable:** Manual QA is reserved for exploratory testing and edge cases.
- **Golden dataset regression:** AI/ML extraction quality is validated against curated benchmark datasets.
- **Provider mocking:** External AI providers must be fully mockable to enable deterministic, fast CI tests.
- **Test isolation:** Every test must run independently; no shared mutable state between test cases.

---

## 2. Test Pyramid

```
         ┌───────────────┐
         │     E2E       │   Playwright
         │   (< 50)      │   Key user flows
         ├───────────────┤
         │  Integration  │   Vitest + test containers
         │  (200–400)    │   API routes, DB queries, queue flows
         ├───────────────┤
         │    Unit        │   Vitest
         │  (1000+)      │   Pure functions, utilities, validators,
         │               │   transformers, state reducers
         └───────────────┘
```

### 2.1 Test Count Targets (at steady state)

| Layer | Estimated Count | Run Time Target | Execution Context |
|-------|----------------|-----------------|-------------------|
| Unit | 1000+ | < 30 seconds | CI every PR |
| Integration | 200–400 | < 3 minutes | CI every PR |
| E2E | 30–50 | < 10 minutes | CI every merge to main; nightly full suite |
| Golden dataset regression | 10–30 scenarios | < 20 minutes | Nightly; before release |
| Performance/load | 5–10 scenarios | Variable | Weekly; before release |

---

## 3. Test Categories

### 3.1 Unit Tests

**Tool:** Vitest
**Scope:** Pure logic with no external dependencies.

| Domain | What to Test | Examples |
|--------|-------------|---------|
| Validation | Zod schemas, custom validators | MCQ field validation, upload file type checks |
| Transformers | Data mapping functions | Provider output → normalized MCQ format |
| Confidence scoring | Composite scoring algorithm | Multi-signal score calculation (FR-116 through FR-123) |
| Hallucination detection | Detection rule logic | Each tier's detection heuristics |
| Cost calculation | Token/page cost formulas | Provider cost computation |
| Export formatting | QTI/SCORM XML generation | XML structure correctness |
| State machines | Job and document state transitions | Valid transitions; rejection of invalid transitions |
| Utilities | String manipulation, date formatting | Slug generation, ID formatting, retry delay calculation |
| Frontend components | Render and interaction | Shallow renders of isolated components via @testing-library/react |
| Zustand stores | State transitions | Upload store, filter store, review queue state |

### 3.2 Integration Tests

**Tool:** Vitest + Supertest (API) + test containers (PostgreSQL, Redis)
**Scope:** Multi-component interaction with real databases but mocked external services.

| Domain | What to Test | Examples |
|--------|-------------|---------|
| API routes | Request → response with DB | POST /api/v1/documents (upload), GET /api/v1/mcq-records |
| Auth middleware | Authentication + RBAC | Token validation, role-based access denial |
| Database operations | Drizzle queries + transactions | Document creation with page records, MCQ upsert |
| Queue integration | Job enqueueing and processing | Enqueue OCR job → worker processes → DB updated |
| Provider adapters | Adapter contract compliance | Each adapter returns normalized output (mocked HTTP) |
| Webhook/callback flows | Async result delivery | Provider callback → job status update |
| Pagination/filtering/sorting | Query parameter handling | Cursor pagination, multi-field filtering |
| Idempotency | Duplicate request handling | Same Idempotency-Key → same response |
| Validation pipeline | End-to-end validation stages | 8-stage validation pipeline execution |
| Export pipeline | Document → export artifact | MCQ records → QTI 2.1 XML file generation |

**Integration Test Infrastructure:**

```
┌──────────────────────────────────┐
│         Test Runner (Vitest)     │
│                                  │
│  ┌──────┐ ┌───────┐ ┌────────┐  │
│  │ API  │ │Worker │ │ Mocked │  │
│  │routes│ │ logic │ │providers│  │
│  └──┬───┘ └──┬────┘ └───┬────┘  │
│     │        │           │       │
│  ┌──┴────────┴───────────┴──┐    │
│  │     Test Containers      │    │
│  │  PostgreSQL   |   Redis  │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### 3.3 End-to-End Tests

**Tool:** Playwright
**Scope:** Full user flows through the browser.

| Flow ID | User Flow | Phase |
|---------|-----------|-------|
| E2E-001 | Sign up / sign in → land on dashboard | P0 |
| E2E-002 | Create workspace → create project | P1 |
| E2E-003 | Upload PDF → document appears in list → processing starts | P1 |
| E2E-004 | View job progress → job completes → MCQ records visible | P1 |
| E2E-005 | Open review queue → approve MCQ → status changes | P2 |
| E2E-006 | Reject MCQ → provide reason → re-extract | P2 |
| E2E-007 | Configure provider → test connection → save | P1 |
| E2E-008 | Export MCQ records → download QTI file | P3 |
| E2E-009 | View analytics dashboard → charts render | P3 |
| E2E-010 | Admin: manage users → change role | P1 |
| E2E-011 | Bulk upload → bulk processing → batch review | P2 |
| E2E-012 | Search MCQ records → filter → sort → paginate | P2 |

### 3.4 Golden Dataset Regression Tests

**Purpose:** Validate AI extraction quality against known-correct MCQ data.

**Design:**
- Curate a "golden dataset" of PDFs with manually verified MCQ extractions.
- Each dataset entry: input PDF → expected MCQ records (correct answers, distractors, metadata).
- Run extraction pipeline against golden inputs.
- Compare output against expected using similarity/exact-match metrics.

**Metrics tracked:**
- **Extraction accuracy:** % of MCQs correctly extracted.
- **Field accuracy:** Per-field correctness (question text, options, correct answer, page reference).
- **Hallucination rate:** % of output MCQs that don't exist in the source.
- **Confidence calibration:** Correlation between confidence scores and actual accuracy.
- **Regression detection:** Any metric drop > 5% from previous run triggers alert.

**Dataset composition (recommendation):**
| Category | Count | Examples |
|----------|-------|---------|
| Clean digital PDFs | 5 | Standard academic exam papers |
| Scanned PDFs (good quality) | 3 | Clear scans of printed exams |
| Scanned PDFs (poor quality) | 2 | Low-res, skewed, or noisy scans |
| Multi-column layouts | 3 | Textbook-style MCQ pages |
| Tables/diagrams in questions | 2 | Science/medical MCQs with figures |
| Arabic/RTL content | 2 | If applicable per user base |
| Large documents (100+ pages) | 2 | Comprehensive question banks |
| Edge cases | 3 | Mixed content, partial pages, unusual formatting |

### 3.5 Provider Mock Strategy

All external AI providers must be mockable at two levels:

| Level | Mechanism | Use Case |
|-------|-----------|----------|
| HTTP mock | MSW (Mock Service Worker) | CI tests; deterministic responses |
| Adapter mock | Jest/Vitest mock of ProviderAdapter interface | Unit tests; contract testing |

**Mock data management:**
- Store mock responses in `packages/test-fixtures/providers/`.
- Each provider has representative success, error, and edge-case responses.
- Include realistic token counts and latency simulation for cost testing.

### 3.6 Security Testing

| Test Type | Tool | Frequency | Scope |
|-----------|------|-----------|-------|
| Dependency audit | npm audit + Snyk | Every CI run | Known vulnerabilities in dependencies |
| SAST (static analysis) | ESLint security plugin + CodeQL | Every PR | Code-level security issues |
| Secret scanning | GitGuardian or git-secrets | Every commit | Leaked secrets in source |
| OWASP ZAP scan | ZAP (DAST) | Weekly; pre-release | API attack surface |
| SQL injection testing | Automated via parameterized tests | Integration tests | All DB-facing endpoints |
| XSS testing | Playwright with XSS payloads | E2E tests | All user-input rendering |
| RBAC testing | Integration tests | Every PR | Role-based access enforcement |
| File upload security | Integration tests | Every PR | Malicious file rejection (ClamAV) |

### 3.7 Performance Testing

**Tool:** k6 (recommended) or Artillery

| Scenario | Target | Metric |
|----------|--------|--------|
| Single PDF upload + extraction | < 30s for 10-page PDF | End-to-end latency |
| Concurrent uploads (10 users) | No errors; < 60s/doc | Throughput, error rate |
| MCQ listing (1000+ records) | < 500ms response | API response time |
| Dashboard load | < 2s | Page load time |
| Queue saturation (100 jobs) | No stalled jobs; all complete | Queue throughput |
| Export generation (500 MCQs) | < 30s | Export time |
| Sustained load (1hr) | Stable memory, no leaks | Memory, CPU, latency |

---

## 4. Test Tooling Summary

| Purpose | Tool | Package |
|---------|------|---------|
| Unit + integration test runner | Vitest | Per-package devDependency |
| React component testing | @testing-library/react | apps/web devDependency |
| HTTP mocking | MSW (Mock Service Worker) | packages/test-fixtures |
| API testing | Supertest | apps/api devDependency |
| E2E testing | Playwright | apps/web devDependency |
| Coverage | Vitest c8/istanbul | Per-package devDependency |
| Performance testing | k6 | Separate test project |
| Security scanning | npm audit, Snyk, CodeQL | CI pipeline |
| Mutation testing | Stryker (optional, Phase 3+) | Per-package devDependency |

---

## 5. Test Data Management

### 5.1 Fixture Strategy

| Fixture Type | Location | Format |
|-------------|----------|--------|
| DB seed data | `packages/test-fixtures/db/` | TypeScript factory functions |
| Sample PDFs | `packages/test-fixtures/pdfs/` | PDF files (small, representative) |
| Provider responses | `packages/test-fixtures/providers/` | JSON |
| Expected MCQ outputs | `packages/test-fixtures/golden/` | JSON |
| Playwright data | `apps/web/e2e/fixtures/` | TypeScript |

### 5.2 Factory Functions

Use factory functions (e.g., `createUser()`, `createDocument()`, `createMCQRecord()`) that produce valid, randomized test data. Each factory should support overrides for specific fields.

---

## 6. Quality Gates

### 6.1 PR Quality Gate

| Check | Required | Threshold |
|-------|----------|-----------|
| Lint pass | Yes | 0 errors |
| Type check pass | Yes | 0 errors |
| Unit tests pass | Yes | 100% pass |
| Integration tests pass | Yes | 100% pass |
| Code coverage (new code) | Yes | ≥ 80% line coverage |
| Code coverage (overall) | Advisory | ≥ 70% line coverage |
| Security audit | Yes (block on critical) | 0 critical vulnerabilities |
| PR review approval | Yes | 1 approval minimum |

### 6.2 Release Quality Gate

| Check | Required | Threshold |
|-------|----------|-----------|
| All PR gates | Yes | Pass |
| E2E tests pass (staging) | Yes | 100% pass |
| Golden dataset regression | Yes | No regression > 5% |
| Performance baseline | Advisory | No degradation > 10% |
| OWASP ZAP scan | Advisory | No high-severity findings |
| Manual exploratory QA | Recommended | Sign-off by QA |

---

## 7. Test Coverage Strategy

### 7.1 Coverage Targets by Package

| Package | Target | Rationale |
|---------|--------|-----------|
| packages/validators | 95% | Core correctness logic |
| packages/provider-adapters | 90% | Contract compliance critical |
| packages/confidence | 95% | Scoring accuracy essential |
| packages/hallucination | 90% | Safety-critical |
| packages/export-engine | 90% | LMS compatibility critical |
| apps/api (routes) | 80% | Covered by integration tests |
| apps/worker (handlers) | 80% | Covered by integration tests |
| apps/web (components) | 60% | E2E covers interaction; unit covers logic |

### 7.2 Coverage Exclusions

- Auto-generated code (Drizzle migrations, OpenAPI types)
- Configuration files
- Third-party type declarations
- Debug/development-only code

---

## 8. Continuous Quality Monitoring

| Metric | Source | Alert |
|--------|--------|-------|
| Test pass rate trend | CI dashboards | < 95% weekly pass rate |
| Coverage delta per PR | CI | Coverage decrease > 2% |
| Golden dataset accuracy | Nightly CI | Regression > 5% |
| Flaky test count | CI analysis | > 3 flaky tests |
| E2E test duration | CI | Duration increase > 20% |
| Dependency vulnerabilities | Snyk/npm audit | New critical/high |

---

## 9. Gaps and Recommendations

| Gap | Recommendation | Priority |
|-----|---------------|----------|
| No chaos/resilience testing specified | Add fault injection tests for queue failures, DB timeouts, provider errors in Phase 2+ | Medium |
| No accessibility testing automation | Add axe-core to Playwright E2E tests | High |
| No visual regression testing | Consider Chromatic or Percy for UI component snapshots | Low |
| No contract testing for provider APIs | Add Pact or similar for provider adapter contracts | Medium |
| No load testing baselines defined | Establish baselines in Phase 1; track in Phase 2+ | High |
| Golden dataset size undefined | Curate minimum 20 PDFs with verified MCQs before Phase 2 | High |
| No data privacy test (PII detection) | Add tests for PII masking in exports and logs | High |
