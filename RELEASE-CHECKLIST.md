# Production Release Checklist — ExtractIQ MCQ Platform

## Pre-Release

### Infrastructure
- [ ] PostgreSQL 16 provisioned with pgvector extension
- [ ] Redis 7 provisioned (used by BullMQ + rate limiter)
- [ ] MinIO / S3-compatible storage provisioned
- [ ] DNS records configured for API and frontend domains
- [ ] SSL/TLS certificates provisioned (Let's Encrypt or custom)
- [ ] Nginx Proxy Manager configured with SSL termination

### Environment Configuration
- [ ] Copy `Backend/.env.production.template` to `.env` on server
- [ ] Set `DATABASE_URL` with production PostgreSQL credentials
- [ ] Set `REDIS_URL` with production Redis credentials
- [ ] Set `JWT_SECRET` (minimum 32 characters, cryptographically random)
- [ ] Set `ENCRYPTION_KEY` (minimum 32 characters, cryptographically random)
- [ ] Set `S3_*` credentials for MinIO/S3
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Set `NODE_ENV=production`
- [ ] Configure at least one AI provider API key (OpenAI/Anthropic/etc.)

### Database
- [ ] Run database migrations: `cd Backend && npx drizzle-kit push`
- [ ] Verify all tables created: `\dt` in psql
- [ ] Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] Verify composite indexes exist (9 custom indexes added)

### Security
- [ ] Helmet middleware enabled (auto in production)
- [ ] CORS restricted to production frontend origin only
- [ ] Cookie `secure: true` enforced in production
- [ ] Rate limiting active on auth endpoints (5 req/min)
- [ ] Rate limiting active on API endpoints (100 req/min)
- [ ] All passwords hashed with bcrypt (cost factor 12)
- [ ] JWT tokens use RS256 or HS256 with ≥32-char secret
- [ ] Refresh tokens stored as SHA-256 hashes in DB
- [ ] File upload size limited to 50MB
- [ ] MIME type whitelist enforced (PDF, images, DOCX)
- [ ] Path traversal prevention in filename validation

## Build & Deploy

### Backend
- [ ] `cd Backend && npm ci --production`
- [ ] `npm run build` (TypeScript compilation)
- [ ] All 152 tests pass: `npx vitest run`
- [ ] Docker image builds: `docker build -t extractiq-api .`

### Frontend
- [ ] `cd "Web App" && npm ci`
- [ ] All 23 tests pass: `npx vitest run`
- [ ] TypeScript compiles: `npx tsc --noEmit` (strict mode, zero errors)
- [ ] Production build succeeds: `npx vite build`
- [ ] Build output in `dist/` — deploy to static hosting or Nginx

### Docker Compose
- [ ] `docker compose -f docker-compose.prod.yml up -d`
- [ ] Verify all containers healthy: `docker compose ps`
- [ ] API healthcheck responding: `curl http://localhost:4000/api/v1/health`
- [ ] Readiness check passing: `curl http://localhost:4000/api/v1/health/ready`
- [ ] Resource limits applied (API: 512M/1CPU, Worker: 1G/2CPU)

## Post-Deploy Verification

### API
- [ ] Health endpoint returns `{ "status": "ok" }`
- [ ] Ready endpoint returns `{ "status": "ready", "checks": { "database": "ok" } }`
- [ ] Registration endpoint works (create first admin user)
- [ ] Login returns JWT tokens in cookies
- [ ] Protected endpoints return 401 without auth
- [ ] Rate limiter returns 429 after threshold

### Frontend
- [ ] Login page loads and renders correctly
- [ ] Authentication flow works (login → dashboard)
- [ ] Skip-to-content link visible on focus (Tab key)
- [ ] All 15 pages load without errors
- [ ] Form validation works (Login, Projects, Users)
- [ ] Dark/light theme toggle works
- [ ] Responsive layout on mobile/tablet/desktop

### Observability
- [ ] Request logging shows method, URL, status, duration, correlation-id
- [ ] Error handler returns structured errors (not stack traces in production)
- [ ] PII masking in logs (email addresses, IP addresses, API keys)
- [ ] Correlation ID propagated through request lifecycle

## Architecture Summary

### Backend Stack
- **Runtime**: Node.js 20+ / TypeScript 5
- **Framework**: Express.js with Turborepo monorepo
- **Database**: PostgreSQL 16 + Drizzle ORM (29 tables, 9 composite indexes)
- **Cache/Queue**: Redis 7 + BullMQ (12 specialized queues)
- **Storage**: MinIO/S3 with presigned URLs
- **Auth**: JWT (access + refresh tokens), bcrypt, RBAC (6 roles)

### Frontend Stack
- **Framework**: React 18 + Vite 5 + SWC
- **UI**: shadcn/ui (Radix) + Tailwind CSS
- **State**: TanStack React Query v5
- **Forms**: react-hook-form + zod validation
- **Routing**: React Router v6, code-split with lazy loading

### Test Coverage
- **Backend**: 152 tests across 10 test files
  - Auth: JWT (15), passwords (8), permissions (23)
  - Middleware: authenticate (6), authorize (5), validate (6), error-handler (7)
  - Shared types: 57 schema validation tests
  - Logger: PII masking (13)
  - Queue: config validation (12)
- **Frontend**: 23 tests across 4 test files
  - Login: form validation, auth flow, accessibility (7)
  - Projects: dialog validation, filtering (7)
  - Users: invite dialog validation, filtering (8)
  - Example: baseline (1)

### Security Features
- Helmet security headers
- CORS with whitelist
- Rate limiting (auth + API)
- Input validation (Zod schemas on all endpoints)
- CSRF protection via SameSite cookies
- Password hashing (bcrypt, cost 12)
- Token refresh with hash storage
- File upload restrictions (size + MIME type)
- Path traversal prevention
- PII masking in logs
