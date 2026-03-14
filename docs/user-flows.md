# User Flows

This document reflects the current stitched workflows across the public website, operator app, backend API, queue workers, and storage/email infrastructure.

## 1. Public website intake

### Contact request

1. Visitor opens `/`.
2. Visitor submits the landing form.
3. Backend persists a `public_submissions` row with `submissionType=contact_request`.
4. Notification worker creates outbound support/customer emails.
5. Success UI is shown to the visitor.

### Demo request

1. Visitor opens `/demo`.
2. Visitor submits the demo form.
3. Backend persists a `public_submissions` row with `submissionType=demo_request`.
4. Notification worker creates outbound sales/customer emails.
5. Success UI is shown to the visitor.

## 2. Auth and onboarding

### Direct login

1. User opens `/app/login`.
2. User submits email/password.
3. API sets access and refresh cookies.
4. Web App calls `/api/v1/auth/me` and hydrates the authenticated session.
5. User lands on the operator dashboard.

### Invitation acceptance

1. Workspace admin invites a user from `/app/users`.
2. API creates an `invitation_tokens` record and queues an email.
3. Invite email links to `APP_BASE_URL/accept-invite?token=...`.
4. Invitee opens `/app/accept-invite`.
5. Web App fetches invitation metadata from `GET /api/v1/auth/invitations/:token`.
6. Invitee sets name/password and submits `POST /api/v1/auth/accept-invitation`.
7. API activates the user, revokes old sessions, sets new auth cookies, and emits a notification.
8. Invitee is redirected into an authenticated `/app` session.

## 3. Document ingestion and extraction

1. Operator logs into `/app`.
2. Operator opens `/app/upload`.
3. Operator selects a project and document file.
4. Web App requests `/api/v1/documents/presign`.
5. Browser uploads the file directly to the presigned storage URL.
6. Web App calls `/api/v1/documents/complete`.
7. Operator starts extraction from the same screen.
8. API creates a job, job-document links, and preprocessing tasks.
9. Worker pipeline advances the job through preprocessing and downstream extraction steps.

## 4. Review flow

1. Worker routing creates `review_items` for MCQs that require manual review.
2. Reviewer opens `/app/review`.
3. Reviewer filters or searches the queue.
4. Reviewer opens `/app/review/:id`.
5. Reviewer approves, rejects, flags, or edits the item.
6. API writes `review_actions`, updates `review_items.status`, and syncs `mcq_records.reviewStatus`.

## 5. Export flow

1. Operator opens `/app/export`.
2. Operator selects project, date range, confidence threshold, and export format.
3. API creates an `export_jobs` row and enqueues generation.
4. Worker creates export artifacts in storage.
5. Completed exports appear in export history.
6. Download action requests `/api/v1/export/:id/download` and opens the presigned artifact URL.

## 6. Operational flow

### Local full-stack verification

1. Start [docker-compose.local.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.local.yml).
2. Run [scripts/local-release-check.ps1](/Users/Admin/Desktop/MCQ Platform/scripts/local-release-check.ps1).
3. Script migrates DB, seeds deterministic smoke data, runs tests/builds, and launches Playwright smoke coverage.

### Production deployment baseline

Use [docker-compose.prod.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.yml) as the deployment baseline. [Backend/docker-compose.yml](/Users/Admin/Desktop/MCQ Platform/Backend/docker-compose.yml) remains backend-only infrastructure bootstrap and is not the authoritative full-stack deploy path.
