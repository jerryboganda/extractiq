# Security Architecture — MCQ Extraction Platform v2.0

## Document Purpose

This document defines the security architecture, threat model, authentication/authorization design, data protection strategy, and compliance considerations for the MCQ Extraction Platform.

---

## 1. Security Principles

1. **Defense in depth:** Multiple layers of security controls.
2. **Least privilege:** Users and services get only the permissions they need.
3. **Encrypt everything sensitive:** At rest and in transit.
4. **Zero trust internal:** Validate identity and authorization at every service boundary.
5. **Fail closed:** On security check failure, deny access by default.
6. **Audit everything:** All security-relevant actions are logged.

---

## 2. Threat Model (STRIDE)

| Threat Category | Threat | Asset at Risk | Likelihood | Impact | Mitigation |
|----------------|--------|--------------|------------|--------|------------|
| **Spoofing** | Stolen session token | User accounts | Medium | High | Secure httpOnly cookies, short session TTL, token rotation |
| **Spoofing** | Forged API key | Provider configs | Low | High | API keys encrypted at rest, never exposed in UI |
| **Tampering** | Modified MCQ records | Data integrity | Medium | High | Audit log on all mutations, record versioning |
| **Tampering** | Malicious PDF upload | Server integrity | High | Critical | ClamAV scanning, file type validation, sandboxed parsing |
| **Repudiation** | User denies review action | Audit trail | Medium | Medium | Immutable audit log with user ID, timestamp, action |
| **Information Disclosure** | Database leak | User data, MCQs | Medium | Critical | Encryption at rest (AES-256), column-level encryption for secrets |
| **Information Disclosure** | S3 bucket misconfiguration | Uploaded PDFs | Medium | High | Private buckets, signed URLs only, no public access |
| **Information Disclosure** | Log leakage of PII | User data | Medium | High | PII masking in structured logs |
| **Denial of Service** | Upload flood | System availability | High | High | Rate limiting, file size limits, queue backpressure |
| **Denial of Service** | Expensive AI queries | Cost, availability | Medium | High | Budget guardrails, per-user rate limiting |
| **Elevation of Privilege** | RBAC bypass | Authorization | Medium | Critical | Server-side RBAC enforcement on every endpoint |
| **Elevation of Privilege** | SQL injection | Database | Low | Critical | Parameterized queries via Drizzle ORM |

---

## 3. Authentication

### 3.1 Authentication Strategy

**Source document specifies:** Session-based authentication with plans for SSO integration.

| Aspect | Design |
|--------|--------|
| Primary auth | Email + password (bcrypt hashed, 12+ rounds) |
| Session management | httpOnly, Secure, SameSite=Strict cookies |
| Session storage | Redis (server-side sessions) |
| Token format | Opaque session ID (not JWT for browser sessions) |
| SSO | OAuth 2.0 / OIDC via configurable provider (Phase 2+) |
| MFA | TOTP-based (Phase 3+) |
| API access | Bearer token (for API/Integration Users) |

### 3.2 Session Security

| Control | Value |
|---------|-------|
| Session TTL | 24 hours (configurable) |
| Idle timeout | 2 hours |
| Cookie flags | httpOnly, Secure, SameSite=Strict |
| Session rotation | New session ID on login, privilege escalation |
| Concurrent sessions | Configurable limit (default: 5) |
| Session invalidation | Logout, password change, admin force-logout |

### 3.3 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Hash algorithm | bcrypt (cost factor 12) |
| Breach check | Check against HaveIBeenPwned API (optional) |
| Password reset | Time-limited token (1 hour), single-use |
| Rate limiting | 5 failed login attempts → 15-minute lockout |

---

## 4. Authorization (RBAC)

### 4.1 Role Hierarchy

```
Super Admin
  └── Workspace Admin
       ├── Operator
       ├── Reviewer / QA
       └── Analyst
API / Integration User (separate, scoped to API access)
```

### 4.2 Permission Matrix

| Permission | Super Admin | Workspace Admin | Operator | Reviewer/QA | Analyst | API User |
|-----------|:-----------:|:---------------:|:--------:|:-----------:|:-------:|:--------:|
| Manage workspaces | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create/manage projects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage workspace users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure providers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Trigger extraction | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View documents/MCQs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review/approve MCQs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Edit MCQ records | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export MCQ data | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View analytics | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Manage settings (global) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### 4.3 RBAC Implementation

- Permissions checked server-side on every API request via middleware.
- Workspace-scoped authorization: users can only access resources in their workspaces.
- Resource-level authorization: document/project ownership checks where applicable.
- Frontend hides UI elements based on role (but never relies on frontend-only enforcement).

---

## 5. Data Protection

### 5.1 Encryption at Rest

| Data | Encryption | Key Management |
|------|-----------|----------------|
| PostgreSQL | Managed DB encryption (AES-256) | Cloud provider KMS or self-managed |
| Provider API keys (in DB) | Application-level AES-256-GCM | Master key in env var or KMS |
| S3 objects | Server-side encryption (SSE-S3 or SSE-KMS) | S3-managed or KMS |
| Redis | Not encrypted at rest (ephemeral data) | N/A |
| Backups | Encrypted snapshots | Same KMS key as source |

### 5.2 Encryption in Transit

| Channel | Encryption | Certificate |
|---------|-----------|-------------|
| Browser → Web | TLS 1.2+ | Managed certificate (Let's Encrypt or cloud provider) |
| Web → API | TLS 1.2+ | Internal certificate or termination at reverse proxy |
| API → PostgreSQL | TLS (require mode) | Cloud provider managed |
| API → Redis | TLS (if managed cloud) | Cloud provider managed |
| API → S3 | HTTPS | S3 endpoint certificate |
| API → AI providers | HTTPS | Provider certificate |
| Worker → all services | Same as API | Same as API |

### 5.3 Data Classification

| Classification | Data Examples | Handling |
|---------------|---------------|---------|
| **Public** | API docs, marketing content | No restrictions |
| **Internal** | System configs, non-sensitive logs | Access controlled; not encrypted at field level |
| **Confidential** | User data, MCQ content, uploaded PDFs | Encrypted at rest; access-controlled; audit-logged |
| **Secret** | Provider API keys, passwords, session tokens | Application-level encryption; never logged; rotation required |

---

## 6. API Security

### 6.1 HTTP Security Headers

Applied via Helmet.js middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` | Prevent XSS |
| X-Content-Type-Options | `nosniff` | Prevent MIME sniffing |
| X-Frame-Options | `DENY` | Prevent clickjacking |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Force HTTPS |
| X-XSS-Protection | `0` (rely on CSP) | Browser XSS filter |
| Referrer-Policy | `strict-origin-when-cross-origin` | Control referrer leakage |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Restrict browser APIs |

### 6.2 CSRF Protection

- SameSite=Strict cookies prevent most CSRF.
- Double-submit cookie pattern or CSRF token for state-changing requests from browser.
- API access via Bearer token does not require CSRF protection.

### 6.3 Rate Limiting

| Endpoint Category | Rate Limit | Window | Action on Exceed |
|-------------------|-----------|--------|-----------------|
| Authentication (login) | 5 requests | 15 min | 429 + lockout |
| Upload endpoints | 10 requests | 1 min | 429 |
| Extraction triggers | 20 requests | 1 min | 429 |
| General API reads | 100 requests | 1 min | 429 |
| General API writes | 30 requests | 1 min | 429 |
| Export endpoints | 5 requests | 1 min | 429 |

Implementation: Redis-backed sliding window rate limiter (per user + per IP).

### 6.4 Input Validation

| Layer | Validation | Tool |
|-------|-----------|------|
| API request body | Schema validation | Zod schemas |
| API query params | Type + range validation | Zod schemas |
| File uploads | Type, size, virus scan | multer + ClamAV |
| Database inputs | Parameterized queries | Drizzle ORM |
| User-generated content | Sanitization before rendering | DOMPurify on frontend |

---

## 7. File Upload Security

| Control | Implementation |
|---------|---------------|
| File type validation | Check MIME type + magic bytes (not just extension) |
| File size limit | Configurable (default: 50 MB per file) |
| Virus scanning | ClamAV integration before processing |
| Storage | Private S3 bucket; no public access |
| Access | Signed URLs with short TTL (15 min) |
| Filename sanitization | Strip path traversal characters; generate UUID-based storage key |
| Content isolation | Parsing in sandboxed Python service container |

---

## 8. Signed URL Strategy

| Operation | URL Type | TTL | Scope |
|-----------|---------|-----|-------|
| PDF upload | PUT signed URL | 15 min | Per-file, per-user |
| PDF download | GET signed URL | 15 min | Per-file, per-user |
| Page image viewing | GET signed URL | 30 min | Per-image, per-user |
| Export download | GET signed URL | 60 min | Per-export, per-user |

All signed URLs are generated server-side after authorization check. No direct S3 credentials are exposed to the frontend.

---

## 9. Dependency Security

| Practice | Frequency | Tool |
|----------|-----------|------|
| Dependency audit | Every CI run | npm audit |
| Vulnerability scanning | Weekly + pre-release | Snyk or GitHub Dependabot |
| License compliance | Monthly | license-checker |
| Dependency pinning | Always | package-lock.json committed |
| Security updates | Within 48 hours for critical | Manual review + automated PR |

---

## 10. Audit Logging

### 10.1 Audited Events

| Event Category | Events |
|---------------|--------|
| Authentication | Login success/failure, logout, session expiry, password reset, MFA actions |
| Authorization | Access denied events, role changes |
| Data access | Document download, MCQ export, bulk data access |
| Data mutation | Document upload/delete, MCQ create/edit/delete, review actions |
| Configuration | Provider config changes, workspace settings changes, user management |
| System | API key creation/revocation, migration execution, system config changes |

### 10.2 Audit Log Schema

Each audit entry contains:
- `id` — Unique log entry ID
- `timestamp` — ISO 8601 timestamp
- `userId` — Acting user ID
- `action` — Action enum (e.g., `document.upload`, `mcq.approve`)
- `resourceType` — Entity type
- `resourceId` — Entity ID
- `workspaceId` — Workspace context
- `ipAddress` — Client IP
- `userAgent` — Client user agent
- `details` — JSON payload with before/after values (for mutations)
- `severity` — `info`, `warning`, `critical`

### 10.3 Audit Log Protection

- Audit logs are append-only (no update/delete via application API).
- Stored in a separate database table with restricted access.
- Retained for minimum 1 year (configurable).
- Exportable for compliance review.

---

## 11. Network Security

| Control | Implementation |
|---------|---------------|
| TLS termination | Reverse proxy (Nginx/Caddy) |
| Internal traffic | Private network; no public exposure for DB, Redis, S3 |
| VPC/network isolation | DB and Redis in private subnet |
| Firewall rules | Allow only necessary ports (443 externally; internal ports within VPC) |
| DDoS mitigation | Cloudflare or AWS Shield (if cloud) |
| DNS security | DNSSEC enabled |

---

## 12. Compliance Considerations

| Area | Requirement | Implementation Status |
|------|------------|----------------------|
| GDPR (if EU users) | Data minimization, right to deletion, consent | User deletion API; data retention policies; consent tracking (if needed) |
| SOC 2 (if enterprise) | Access controls, audit logging, encryption | RBAC + audit log + encryption cover most controls |
| Data residency | Data stays in specified region | Configurable S3 region; DB region selection |
| PII handling | Minimize PII in logs, exports | PII masking in logs; PII-free export options |

---

## 13. Security Testing

| Test Type | Scope | Frequency |
|-----------|-------|-----------|
| RBAC unit tests | Every permission check | Every PR |
| SQL injection tests | All DB-facing endpoints | Every PR (integration tests) |
| XSS tests | All user-input rendering | E2E tests |
| CSRF tests | State-changing endpoints | Integration tests |
| Auth flow tests | Login, session, password reset | Integration tests |
| OWASP ZAP scan | Full API surface | Weekly; pre-release |
| Secret scanning | Source code | Every commit |
| Dependency audit | All packages | Every CI run |

---

## 14. Incident Response Plan (Outline)

| Phase | Action |
|-------|--------|
| Detection | Alert from monitoring (failed auth spike, unusual data access, vulnerability report) |
| Triage | Assess severity, scope, and impact |
| Containment | Revoke compromised credentials; block attack vector; isolate affected service |
| Eradication | Patch vulnerability; update dependencies; fix configuration |
| Recovery | Restore from backup if needed; verify system integrity |
| Post-mortem | Root cause analysis; update security controls; communicate to stakeholders |

---

## 15. Open Security Questions

| # | Question | Impact |
|---|----------|--------|
| SEC-Q1 | Which SSO/OAuth provider will be used (Auth0, Clerk, custom)? | Auth architecture, session management |
| SEC-Q2 | Cloud provider choice affects available security services (KMS, WAF, Shield) | Encryption key management, DDoS |
| SEC-Q3 | Is SOC 2 / ISO 27001 compliance required for enterprise customers? | Audit, logging, access control depth |
| SEC-Q4 | Are there data residency requirements (specific countries/regions)? | Infrastructure topology |
| SEC-Q5 | What is the expected vulnerability response SLA? | Incident response, patch management |
| SEC-Q6 | Should API keys support IP allowlisting? | API security design |
| SEC-Q7 | Is client-side encryption of uploaded PDFs required before S3 upload? | Upload flow, performance |
