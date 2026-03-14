# ─── Backend Multi-stage Dockerfile ───
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ && corepack enable

# ─── Install dependencies ───
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/config/package.json packages/config/
COPY packages/logger/package.json packages/logger/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/queue/package.json packages/queue/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
RUN npm ci --omit=dev

# ─── Full source ───
FROM base AS source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ─── API service ───
FROM source AS api
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]

# ─── Worker service ───
FROM source AS worker
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node --import tsx scripts/check-worker-health.ts || exit 1
CMD ["node", "--import", "tsx", "apps/worker/src/index.ts"]
