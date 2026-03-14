# Production Runbook

This runbook assumes deployment through [docker-compose.prod.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.yml). If you need to join an existing reverse proxy network, layer [docker-compose.prod.proxy.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.proxy.yml) on top of the base stack. The local rehearsal path is [scripts/local-release-check.ps1](/Users/Admin/Desktop/MCQ Platform/scripts/local-release-check.ps1) plus [docker-compose.local.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.local.yml).

## Deployment source of truth

- Preferred production deployment entrypoint: [deploy/deploy.sh](/Users/Admin/Desktop/MCQ Platform/deploy/deploy.sh)
- Production application root on the VPS: `/root/extractiq`
- Reverse-proxy attachment is optional and auto-detected by the deploy script when `nginx-proxy-manager_default` exists
- Host-level static file copy and legacy `/var/www/extractiq` deployment are no longer the supported release path

## Health endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | Basic liveness |
| `GET /api/v1/health/ready` | Dependency readiness for database, Redis, queue access, storage, and email transport |
| `GET /api/v1/health/queues` | Queue depth snapshot |

`/health/ready` now returns:

- `status`: `ready` or `degraded`
- `checks`: `database`, `redis`, `queue`, `storage`, `email`
- `reasons`: human-readable degraded reasons

## First-response checklist

1. Check stack state: `docker compose -f docker-compose.prod.yml ps`
   With reverse proxy attachment: `docker compose -f docker-compose.prod.yml -f docker-compose.prod.proxy.yml ps`
2. Check readiness: `curl http://localhost:4100/api/v1/health/ready`
3. Check API and worker logs: `docker compose -f docker-compose.prod.yml logs --tail=200 api worker`
4. Check email transport if invites or website forms are failing:
   `docker compose -f docker-compose.prod.yml logs --tail=100 worker | Select-String email`
5. Check queue depth if jobs are stalled:
   `curl http://localhost:4100/api/v1/health/queues`

## Common incidents

### API degraded

Symptoms: `/health/ready` returns `503`, UI shows auth failures, uploads stop, or export/download requests fail.

1. Inspect `checks` and `reasons` from `/health/ready`.
2. If `database` is failing, verify Postgres and connection limits.
3. If `redis` or `queue` is failing, inspect Redis and restart `worker` after Redis recovers.
4. If `storage` is failing, verify MinIO bucket existence and host disk capacity.
5. If `email` is failing, confirm SMTP reachability and credentials before retrying invites or website form follow-up.

### Invitation flow broken

Symptoms: users receive invites but cannot complete onboarding.

1. Confirm `APP_BASE_URL` points at the operator app, not just the site origin.
2. Open the invite link and verify it lands on `/app/accept-invite`.
3. Confirm `GET /api/v1/auth/invitations/:token` returns `pending`.
4. Check worker logs for invitation email delivery failure.
5. Verify the configured Brevo SMTP login/key are valid for the active environment.
6. If needed, reissue the invite from `/app/users`.

### Website form intake broken

Symptoms: public demo/contact forms show errors or sales/support never receive follow-up.

1. Submit a test request through `/` and `/demo`.
2. Verify records appear in `public_submissions`.
3. Verify corresponding `email_deliveries` rows are created.
4. Check Brevo SMTP reachability, credentials, and worker notification logs.

### Uploads fail from the browser

Symptoms: presign succeeds but direct upload fails from the Web App.

1. Verify `S3_PUBLIC_ENDPOINT` is browser reachable.
2. Confirm bucket CORS allows the frontend origin.
3. Verify MinIO responds on the public endpoint.
4. Retry from `/app/upload` after storage health is restored.

## Recovery commands

| Action | Command |
|---|---|
| Restart API | `docker compose -f docker-compose.prod.yml restart api` |
| Restart worker | `docker compose -f docker-compose.prod.yml restart worker` |
| Restart Redis | `docker compose -f docker-compose.prod.yml restart redis` |
| Restart MinIO | `docker compose -f docker-compose.prod.yml restart minio` |

## Migration operations

- Preferred runtime migration command: `npm --prefix Backend run db:migrate:runtime`
- Inside the deployed API environment: `npm run db:migrate:runtime`
- The runtime migration reconciler is production-safe for both:
  - fresh databases with no schema yet
  - existing databases that already contain the baseline schema but are missing the Drizzle journal
- Do not use ad hoc `drizzle-kit migrate` directly against production unless you have separately verified the migration journal state.
- The deploy script executes the runtime migration command after the API service is live and before the release is considered healthy.

## Release validation

Before and after a deployment, validate:

1. `/app/login` works.
2. Invite acceptance works from a real emailed link.
3. `/` contact form and `/demo` request form persist and queue email delivery.
4. `/app/upload` can upload and create a job.
5. `/app/review` and `/app/export` reflect seeded or live data correctly.

## Rollback trigger

Roll back if any of the following persist beyond the initial verification window:

- `/health/ready` remains `degraded`
- invite acceptance is broken
- website public forms fail
- uploads cannot complete
- job creation or review actions fail for authenticated users
