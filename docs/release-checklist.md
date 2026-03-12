# Release Checklist — ExtractIQ MCQ Platform

Use this checklist before every production deployment.

---

## Pre-Release

- [ ] All PRs merged and approved (1+ peer review)
- [ ] Feature branch deleted after merge
- [ ] `main` branch is green in CI

### Code Quality

- [ ] TypeScript strict mode passes: `npx tsc --noEmit` (backend + frontend)
- [ ] Linting passes: `npm run lint` (all packages)
- [ ] No `// @ts-ignore` or `// @ts-expect-error` added without justification

### Testing

- [ ] Backend tests pass: `cd Backend && npx vitest run` (284+ tests)
- [ ] Frontend tests pass: `cd "Web App" && npx vitest run` (35+ tests)
- [ ] No skipped tests (`.skip`) without linked issue
- [ ] Manual smoke test on staging (login, upload document, extract MCQs, review, export)

### Database

- [ ] Migrations are backward-compatible (additive only — no column drops or renames)
- [ ] Migration files committed: `npx drizzle-kit generate` output reviewed
- [ ] Migration tested on staging database
- [ ] Backup taken before production migration

### Security

- [ ] No secrets or API keys in code (check `.env.example` only has placeholders)
- [ ] Dependencies audited: `npm audit` — no critical/high vulnerabilities
- [ ] CORS origin configured correctly for production
- [ ] Rate limiting enabled on all public endpoints

---

## Deployment

### 1. Backup

```bash
# Database backup
docker compose exec postgres pg_dump -U postgres mcq_platform | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 2. Deploy

```bash
cd /opt/extractiq
git pull origin main

# Backend
docker compose -f docker-compose.prod.yml up -d --build api worker

# Migrations
cd Backend && npx drizzle-kit migrate

# Frontend (if changed)
cd "../Web App" && npm ci --omit=dev && npm run build
cp -r dist/* /var/www/extractiq/webapp/
```

### 3. Verify

```bash
# Health checks
curl http://localhost:4100/api/v1/health
curl http://localhost:4100/api/v1/health/ready

# Container status
docker compose -f docker-compose.prod.yml ps

# Check logs for errors
docker compose logs --tail=50 api worker
```

---

## Post-Release

- [ ] Health endpoint returns `{ status: "ready" }` with all checks `ok`
- [ ] All containers running and healthy: `docker compose ps`
- [ ] No error spikes in logs (monitor for 15 minutes)
- [ ] Key user flows verified: login, document upload, MCQ extraction
- [ ] Notify team in Slack channel
- [ ] Tag release: `git tag -a v<VERSION> -m "Release v<VERSION>"` and `git push --tags`

---

## Rollback Trigger Criteria

Initiate rollback immediately if any of the following occur within 15 minutes of deployment:

- Health endpoint returns `503` or `degraded`
- Error rate exceeds 5% of requests
- Any container in crash loop
- Database migration failure

See [runbook.md](runbook.md) §7 for rollback procedure.
