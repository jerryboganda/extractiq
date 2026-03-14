# API Surface Summary

Base path: `/api/v1`

Browser clients use cookie-based auth. Public website endpoints remain unauthenticated. All successful responses use `{ data: ... }`.

## Auth

| Method | Path | Notes |
|---|---|---|
| `POST` | `/auth/register` | Creates workspace + admin session |
| `POST` | `/auth/login` | Returns `{ data: { user, token } }` and auth cookies |
| `POST` | `/auth/refresh` | Refreshes access cookie |
| `POST` | `/auth/logout` | Clears auth cookies |
| `GET` | `/auth/me` | Returns `{ data: { user } }` |
| `GET` | `/auth/invitations/:token` | Returns invite metadata and token status |
| `POST` | `/auth/accept-invitation` | Activates invited user and signs them in |
| `POST` | `/auth/change-password` | Authenticated password change |

## Public website intake

| Method | Path | Notes |
|---|---|---|
| `POST` | `/public/contact-request` | Persists public contact request and queues emails |
| `POST` | `/public/demo-request` | Persists public demo request and queues emails |

## Documents and jobs

| Method | Path | Notes |
|---|---|---|
| `POST` | `/documents/presign` | Returns `{ data: { uploadUrl, documentId, s3Key, expiresIn } }` |
| `POST` | `/documents/complete` | Marks uploaded document complete and returns `{ data: document }` |
| `POST` | `/jobs` | Creates job + preprocessing task graph |
| `POST` | `/jobs/:id/retry` | Requeues preprocessing tasks for linked documents |
| `POST` | `/jobs/:id/cancel` | Marks job cancelled |

## Review and export

| Method | Path | Notes |
|---|---|---|
| `GET` | `/review/queue` | Paginated queue data for the operator UI |
| `GET` | `/review/:id` | Detail payload flattened for the review screen |
| `GET` | `/review/:id/navigation` | Returns `ids`, `previousId`, `nextId`, `currentIndex`, `totalCount` |
| `POST` | `/review/:id/approve` | Approves review item |
| `POST` | `/review/:id/reject` | Rejects review item |
| `POST` | `/review/:id/flag` | Flags review item |
| `PATCH` | `/review/:id/edit` | Writes MCQ edit history and syncs review state |
| `POST` | `/export` | Creates export job |
| `GET` | `/export/:id/download` | Returns `{ data: { downloadUrl, filename, expiresIn } }` |

## Users and readiness

| Method | Path | Notes |
|---|---|---|
| `GET` | `/users` | Returns paginated `{ data: { items, total, page, limit, totalPages } }` |
| `POST` | `/users/invite` | Returns invited user summary plus `invitationUrl` |
| `GET` | `/health/ready` | Returns dependency checks for DB, Redis, queue, storage, and email |
