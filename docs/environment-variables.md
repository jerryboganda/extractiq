# Environment Variables Reference

`Backend/packages/config/src/index.ts` is the authoritative validator for backend runtime configuration. This document reflects the current production surface and the root deployment files: [docker-compose.local.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.local.yml) and [docker-compose.prod.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.yml).

## Runtime baseline

- Supported Node.js baseline for CI and production: `20.x`
- Local developer helpers: [.nvmrc](/Users/Admin/Desktop/MCQ Platform/.nvmrc), [.node-version](/Users/Admin/Desktop/MCQ Platform/.node-version)

## Required secrets

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://mcq_user:mcq_password@localhost:5432/mcq_platform` |
| `JWT_SECRET` | JWT signing secret, minimum 32 characters | `<64-char random secret>` |
| `ENCRYPTION_KEY` | Provider secret encryption key, minimum 32 characters | `<32+ char random secret>` |
| `S3_ACCESS_KEY` | S3/MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | S3/MinIO secret key | `minioadmin` |

## Application and routing

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, or `debug` |
| `API_HOST` | `0.0.0.0` | API bind host |
| `API_PORT` | `4000` | API bind port |
| `CORS_ORIGIN` | `http://localhost:8080` | Browser origin allowed to call the API |
| `APP_BASE_URL` | `http://localhost:8080/app` | Operator app base URL used for invite links and deep links |

## Database and queues

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `DB_POOL_MIN` | `2` | Minimum DB pool size |
| `DB_POOL_MAX` | `10` | Maximum DB pool size |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL used by BullMQ |

## Object storage

| Variable | Default | Description |
|---|---|---|
| `S3_ENDPOINT` | `http://localhost:9000` | Internal S3-compatible endpoint for API/worker access |
| `S3_PUBLIC_ENDPOINT` | `http://localhost:9000` | Browser-safe endpoint used in presigned URLs |
| `S3_BUCKET` | `mcq-platform` | Bucket name |
| `S3_REGION` | `us-east-1` | AWS region label |
| `S3_FORCE_PATH_STYLE` | `true` | Required for MinIO path-style addressing |

`S3_PUBLIC_ENDPOINT` should point at a host that browser clients can actually reach. In local compose that is `http://localhost:9000`, while API and worker containers still use `http://minio:9000`.

## Authentication and passwords

| Variable | Default | Description |
|---|---|---|
| `JWT_EXPIRY` | `24h` | Access-token TTL |
| `BCRYPT_ROUNDS` | `12` | Password hash cost |

## Email delivery

| Variable | Default | Description |
|---|---|---|
| `SMTP_HOST` | `127.0.0.1` | SMTP host used by notification delivery |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_USER` | empty | SMTP username, if required |
| `SMTP_PASS` | empty | SMTP password, if required |
| `SMTP_SECURE` | `false` | Use SMTPS/TLS transport |
| `SMTP_FROM_NAME` | `ExtractIQ Document Intelligence` | Display name shown in the inbox sender header |
| `SMTP_FROM` | `noreply@extractiq.local` | Default sender address |
| `SALES_NOTIFICATION_EMAIL` | `sales@extractiq.local` | Recipient for website demo requests |
| `SUPPORT_NOTIFICATION_EMAIL` | `support@extractiq.local` | Recipient for website contact requests |
| `ENABLE_EMAIL_DELIVERY` | `true` | Skip actual email sends when `false` |

Brevo is the default SMTP provider for all email-based flows in this project:

| Variable | Brevo value |
|---|---|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |

Set `SMTP_USER` to the Brevo SMTP login and `SMTP_PASS` to the Brevo SMTP key for the target environment. Local compose uses the same SMTP configuration as the rest of the stack; it no longer swaps in a separate sandbox mail server automatically.

## AI provider keys

All provider keys remain optional and can be configured later through the operator UI:

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `MISTRAL_API_KEY`, `QWEN_VL_ENDPOINT`, `QWEN_VL_API_KEY`, `GLM_OCR_ENDPOINT`, `GLM_OCR_API_KEY`

## File handling and throttling

| Variable | Default | Description |
|---|---|---|
| `MAX_FILE_SIZE_MB` | `50` | Maximum accepted upload size |
| `PRESIGNED_UPLOAD_TTL_SECONDS` | `900` | Upload URL TTL |
| `PRESIGNED_DOWNLOAD_TTL_SECONDS` | `3600` | Download URL TTL |
| `RATE_LIMIT_AUTH_MAX` | `5` | Authentication request cap per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `60000` | Auth rate-limit window |
| `RATE_LIMIT_API_MAX` | `100` | General API request cap per window |
| `RATE_LIMIT_API_WINDOW_MS` | `60000` | General API rate-limit window |

## Deployment sources of truth

- Use [docker-compose.local.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.local.yml) for local verification.
- Use [docker-compose.prod.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.yml) for production deployment.
- Use [docker-compose.prod.proxy.yml](/Users/Admin/Desktop/MCQ Platform/docker-compose.prod.proxy.yml) only when you need to join an existing reverse proxy network such as Nginx Proxy Manager.
- [Backend/docker-compose.yml](/Users/Admin/Desktop/MCQ Platform/Backend/docker-compose.yml) is backend-only infrastructure bootstrap and should not be treated as the primary full-stack deployment file.
