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
EXPOSE 4000
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]

# ─── Worker service ───
FROM source AS worker
CMD ["node", "--import", "tsx", "apps/worker/src/index.ts"]
