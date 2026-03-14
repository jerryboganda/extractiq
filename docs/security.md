# Security Architecture

This document reflects the implemented security posture of the current ExtractIQ codebase. Where a control is not implemented yet, it is called out explicitly instead of being treated as implied coverage.

## Security principles

1. Deny by default on authentication and authorization failures.
2. Keep secrets out of the UI and encrypt provider credentials at rest.
3. Use one clear source of truth for auth, upload, and tenant boundaries.
4. Prefer short-lived browser credentials plus revocable refresh state.
5. Document gaps plainly instead of treating roadmap items as active controls.

## Authentication model

The platform uses email-and-password authentication with JWT access tokens and refresh-token cookies.

| Area | Implemented behavior |
|---|---|
| Primary auth | Email + password |
| Password hashing | bcrypt |
| Browser auth | `access_token` and `refresh_token` httpOnly cookies |
| Cookie flags | `httpOnly`, `SameSite=Strict`, `Secure` in production |
| Access-token TTL | `JWT_EXPIRY` (default 24h) |
| Refresh-token TTL | 7 days |
| Refresh-token storage | SHA-256 hash stored in PostgreSQL with revocation support |
| Logout | Revokes the current refresh token and clears cookies |
| Invitation acceptance | Email-only flow; prior refresh tokens for that user are revoked |
| MFA / SMS OTP | Not implemented; first-party auth is email-only |
| Password reset | Not implemented |
| SSO | Not implemented |

## Password and auth validation

| Control | Current state |
|---|---|
| Registration password length | Minimum 12 characters |
| Invitation acceptance password length | Minimum 12 characters |
| Change-password length | Minimum 12 characters |
| Login password length validation | Minimum 8 characters |
| Character-class complexity rules | Not enforced in code today |
| Breach-password checking | Not implemented |
| Auth rate limiting | Controlled by `RATE_LIMIT_AUTH_MAX` and `RATE_LIMIT_AUTH_WINDOW_MS` |

## Authorization and tenant isolation

Server-side middleware enforces authenticated access, role checks, and workspace scoping. The frontend hides actions by role for usability, but backend enforcement remains the source of truth.

Current roles in code include:

- `super_admin`
- `workspace_admin`
- `operator`
- `reviewer`
- `analyst`
- `api_user`

Key protections:

- Workspace-scoped queries for user-facing resources.
- Project/document ownership checks in upload and processing flows.
- Role-based access around user management, review, providers, exports, and admin surfaces.

## API and browser security

| Control | Current state |
|---|---|
| CORS | Restricted by `CORS_ORIGIN` with credentials enabled |
| Helmet | Enabled on the API |
| Compression | Enabled |
| Trust proxy | Enabled in production |
| CSRF tokens | Not implemented |
| CSRF baseline | Relies on `SameSite=Strict` cookies for browser auth |
| Error envelopes | Standardized JSON error shape in API middleware |
| Rate limiting | Express rate-limiter configured from env for auth and general API traffic |

## Data protection

| Data type | Current state |
|---|---|
| Provider credentials | Application-level encryption before DB persistence |
| Refresh tokens | Hashed before persistence |
| Uploaded documents | Stored in private object storage bucket and accessed through signed URLs |
| Signed upload URLs | Short-lived and authorization-gated |
| Signed download URLs | Short-lived and authorization-gated |
| Sensitive logging | Secrets are not intentionally logged; operators should still avoid enabling verbose logs in production |

## Upload and storage controls

| Control | Current state |
|---|---|
| File-size limit | Enforced by config (`MAX_FILE_SIZE_MB`) |
| Upload TTL | Controlled by `PRESIGNED_UPLOAD_TTL_SECONDS` |
| Download TTL | Controlled by `PRESIGNED_DOWNLOAD_TTL_SECONDS` |
| Storage endpoint split | Internal `S3_ENDPOINT` for services, `S3_PUBLIC_ENDPOINT` for browsers |
| Filename/path sanitization | Shared schema helpers sanitize storage paths |
| Virus scanning | Not implemented |
| Content sandboxing | Not implemented as a separate sandbox service in this repo |

## Email and verification channels

All first-party verification and onboarding flows are email-based. The current system uses SMTP delivery, with Brevo configured as the production provider. There is no first-party SMS OTP path in the codebase.

Email-backed workflows include:

- user invitations
- invitation acceptance onboarding
- website contact requests
- website demo requests
- queued notification delivery

## Operational security expectations

For a production deployment, operators must provide:

- strong `JWT_SECRET`
- strong `ENCRYPTION_KEY`
- reachable `APP_BASE_URL`
- reachable `S3_PUBLIC_ENDPOINT`
- valid Brevo SMTP credentials
- private networking for Postgres, Redis, and object storage
- TLS termination at the reverse proxy or edge

## Known gaps

These items are not implemented today and should not be treated as active controls:

- password reset flow
- MFA
- SSO/OIDC
- CSRF token mechanism
- malware scanning on uploads
- automated secret rotation
- WAF / DDoS layer in repo-managed infrastructure
- formal vulnerability scanning pipeline beyond standard package/CI tooling

## Release stance

From a security-review standpoint, the current codebase is materially stronger than the earlier demo state, but it is only safe to call production-ready after:

1. staging validation with real domain/TLS/Brevo credentials,
2. full Dockerized release rehearsal,
3. confirmation that operator-visible workflows behave correctly under the configured reverse proxy and storage endpoints.
