# Environment Variables Reference

> Auto-generated reference — see `Backend/packages/config/src/index.ts` (Zod schema) for authoritative validation.

## Required (no defaults — app will not start without these)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://mcq_user:mcq_password@localhost:5432/mcq_platform` |
| `JWT_SECRET` | JWT signing secret (min 32 chars, 64+ recommended) | `<random 64-char string>` |
| `ENCRYPTION_KEY` | AES encryption key for provider API keys (min 32 chars) | `<random 32-byte hex string>` |

## Application

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug` |

## API Server

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `4000` | HTTP listen port |
| `API_HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |

## Database (PostgreSQL)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(required)* | Full connection string |
| `DB_POOL_MIN` | `2` | Minimum pool connections |
| `DB_POOL_MAX` | `10` | Maximum pool connections |

## Redis

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string (used for BullMQ queues) |

## Object Storage (MinIO / S3)

| Variable | Default | Description |
|---|---|---|
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint |
| `S3_ACCESS_KEY` | `minioadmin` | Access key |
| `S3_SECRET_KEY` | `minioadmin` | Secret key |
| `S3_BUCKET` | `mcq-platform` | Bucket name |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_FORCE_PATH_STYLE` | `true` | Use path-style addressing (required for MinIO) |

## Authentication

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `JWT_EXPIRY` | `24h` | Access token TTL |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |

## Encryption

| Variable | Default | Description |
|---|---|---|
| `ENCRYPTION_KEY` | *(required)* | AES key for encrypting provider API keys at rest |

## AI Provider API Keys (all optional)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_AI_API_KEY` | Google AI API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `QWEN_VL_ENDPOINT` | Qwen-VL endpoint URL |
| `QWEN_VL_API_KEY` | Qwen-VL API key |
| `GLM_OCR_ENDPOINT` | GLM-OCR endpoint URL |
| `GLM_OCR_API_KEY` | GLM-OCR API key |

## Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_AUTH_MAX` | `5` | Max auth attempts per window |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `60000` | Auth rate limit window (ms) |
| `RATE_LIMIT_API_MAX` | `100` | Max API requests per window |
| `RATE_LIMIT_API_WINDOW_MS` | `60000` | API rate limit window (ms) |

## File Upload

| Variable | Default | Description |
|---|---|---|
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size in MB |
| `PRESIGNED_UPLOAD_TTL_SECONDS` | `900` | Upload presigned URL TTL (15 min) |
| `PRESIGNED_DOWNLOAD_TTL_SECONDS` | `3600` | Download presigned URL TTL (1 hour) |

## Docker Compose Infrastructure Defaults

The `Backend/docker-compose.yml` sets these for local development:

| Service | Variable | Value |
|---|---|---|
| PostgreSQL | `POSTGRES_USER` | `mcq_user` |
| PostgreSQL | `POSTGRES_PASSWORD` | `mcq_password` |
| PostgreSQL | `POSTGRES_DB` | `mcq_platform` |
| MinIO | `MINIO_ROOT_USER` | `minioadmin` |
| MinIO | `MINIO_ROOT_PASSWORD` | `minioadmin` |

These match the defaults in `.env.example`.
