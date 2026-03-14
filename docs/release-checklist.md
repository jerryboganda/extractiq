# Release Checklist

Use this checklist before promoting a build.

## Code and contract checks

- [ ] Backend tests pass: `npm --prefix Backend test`
- [ ] Backend typecheck passes: `npm --prefix Backend run typecheck`
- [ ] Web App tests pass: `npm --prefix "Web App" test -- --run`
- [ ] Web App build passes: `npm --prefix "Web App" run build`
- [ ] Website tests pass: `npm --prefix Website test -- --run`
- [ ] Website build passes: `npm --prefix Website run build`
- [ ] `docs/openapi.yaml` matches the current API envelopes and endpoints
- [ ] Environment docs reflect `APP_BASE_URL`, SMTP, and `S3_PUBLIC_ENDPOINT`

## Local stack rehearsal

- [ ] Run [scripts/local-release-check.ps1](/Users/Admin/Desktop/MCQ Platform/scripts/local-release-check.ps1)
- [ ] Confirm Brevo SMTP credentials are loaded and invite/public-form emails are delivered successfully
- [ ] Confirm `/api/v1/health/ready` returns all checks `ok`

## Workflow verification

- [ ] Website contact form on `/` submits successfully
- [ ] Website demo request form on `/demo` submits successfully
- [ ] Operator login works at `/app/login`
- [ ] Invite acceptance works at `/app/accept-invite`
- [ ] Upload flow in `/app/upload` completes and can start extraction
- [ ] Review queue/detail actions work for a seeded or staging review item
- [ ] Export history renders and completed downloads open correctly

## Production deployment

1. Take a database backup.
2. Validate [`.env`](/Users/Admin/Desktop/MCQ Platform/.env) and [`Backend/.env`](/Users/Admin/Desktop/MCQ Platform/Backend/.env) contain the required production values, especially `APP_BASE_URL`, `S3_PUBLIC_ENDPOINT`, JWT/encryption secrets, and SMTP settings.
3. Deploy with [`deploy/deploy.sh`](/Users/Admin/Desktop/MCQ Platform/deploy/deploy.sh). The script uses [docker-compose.prod.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.yml) and automatically layers [docker-compose.prod.proxy.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.proxy.yml) when the reverse-proxy network already exists.
4. Confirm the runtime migration reconciler completed successfully.
5. Check `/api/v1/health/ready`.
6. Re-run the workflow verification list against production or staging.

## Do not release if

- `/health/ready` reports `degraded`
- `APP_BASE_URL` still points to the wrong surface
- SMTP is unreachable while email delivery is enabled
- browser uploads fail because `S3_PUBLIC_ENDPOINT` is not reachable
- invite acceptance, public intake, review, or export workflows are broken
