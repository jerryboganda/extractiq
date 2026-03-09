# DevOps & Infrastructure — MCQ Extraction Platform v2.0

## Document Purpose

This document specifies the DevOps scope, environment strategy, CI/CD pipeline, containerization, deployment flow, configuration management, scaling, backup, and operational concerns for the MCQ Extraction Platform.

---

## 1. DevOps Scope

DevOps covers:
- Environment provisioning and management (local, dev, staging, production)
- CI/CD pipeline design and automation
- Container orchestration (Docker Compose for dev; Docker Compose or K8s for production)
- Infrastructure-as-code (optional Terraform for cloud resources)
- Secrets management
- Deployment flows and rollback procedures
- Monitoring infrastructure (logging, metrics, tracing backends)
- Backup and disaster recovery
- Cost management for infrastructure

---

## 2. Environment Strategy

### 2.1 Environment Matrix

| Environment | Purpose | Infrastructure | Data | Access |
|-------------|---------|----------------|------|--------|
| Local | Developer workstation | Docker Compose (all services) | Seed/fixture data | Individual developer |
| Development | Shared integration testing | Docker Compose on dev server or cloud | Synthetic test data | Engineering team |
| Staging | Pre-production validation | Mirrors production topology | Anonymized production-like data | Engineering + QA |
| Production | Live system | Managed cloud services or self-hosted | Real data | Operations team |

### 2.2 Local Development Setup

Docker Compose stack with:
- Next.js (hot reload via volume mount)
- Express API (hot reload via volume mount + nodemon/tsx)
- Worker (hot reload)
- PostgreSQL 16+
- Redis 7+
- MinIO (S3-compatible)
- Python parser service (FastAPI)
- bull-board (BullMQ dashboard)

```yaml
# docker-compose.yml service list
services:
  web:          # Next.js frontend (port 3000)
  api:          # Express API (port 4000)
  worker:       # BullMQ workers
  parser:       # Python FastAPI parser service (port 5000)
  postgres:     # PostgreSQL 16 (port 5432)
  redis:        # Redis 7 (port 6379)
  minio:        # MinIO S3-compatible (port 9000, console 9001)
  bull-board:   # Queue dashboard (port 4100)
```

### 2.3 Environment Parity

- All environments use the same Docker images (different config via environment variables).
- Database schema is always consistent (same Drizzle migrations applied).
- MinIO in local/dev; S3 in staging/production.
- Redis standalone in local/dev; Redis with replication in staging/production.
- PostgreSQL standalone in local/dev; managed PostgreSQL (RDS, Cloud SQL) in staging/production.

---

## 3. CI/CD Pipeline

### 3.1 Pipeline Stages

```
┌─────────┐  ┌──────────┐  ┌───────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐
│  Lint   │→│TypeCheck │→│ Test  │→│  Build   │→│  Security │→│  Deploy   │
│         │  │          │  │       │  │          │  │   Scan    │  │          │
└─────────┘  └──────────┘  └───────┘  └──────────┘  └───────────┘  └──────────┘
```

### 3.2 Pipeline Details

| Stage | Tool | Scope | Failure Action |
|-------|------|-------|----------------|
| Lint | ESLint + Prettier | All packages | Block merge |
| Type check | TypeScript (`tsc --noEmit`) | All packages | Block merge |
| Unit tests | Vitest | All packages | Block merge |
| Integration tests | Vitest + test containers | API, workers | Block merge |
| Build | Turborepo build | All apps | Block merge |
| Security scan | npm audit + Snyk | Dependencies | Warn (block on critical) |
| Migration check | Drizzle migration dry-run | Database | Block merge (staging+ deploys) |
| Docker build | Docker | All app images | Block deploy |
| E2E tests | Playwright | Web app against staging | Block production deploy |
| Deploy | Docker push + K8s apply or docker-compose up | Target environment | Manual rollback if failed |

### 3.3 CI Tooling

**Source document does not specify CI tool.** Recommended options:
- **GitHub Actions** — if repository is on GitHub (most likely scenario)
- **GitLab CI** — if repository is on GitLab
- **Choice must be made in Phase 0.**

### 3.4 Branch Strategy

**Recommendation:** Trunk-based development with feature branches.

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code | Staging (auto), Production (manual approval) |
| `feature/*` | Feature development | Preview environment (optional) |
| `hotfix/*` | Production fixes | Staging → Production (fast-tracked) |

- PRs require: lint pass, type check pass, tests pass, 1 approval.
- No long-lived branches.
- Feature flags for incomplete features in production.

---

## 4. Containerization

### 4.1 Docker Images

| Image | Base | Build Context | Notes |
|-------|------|---------------|-------|
| mcq-web | node:20-alpine | apps/web + packages/* | Multi-stage build (build → serve) |
| mcq-api | node:20-alpine | apps/api + packages/* | Multi-stage build |
| mcq-worker | node:20-alpine | apps/worker + packages/* | Multi-stage build |
| mcq-orchestrator | node:20-alpine | apps/orchestrator + packages/* | Phase 4 |
| mcq-parser | python:3.12-slim | Python service with PyMuPDF, etc. | Separate Dockerfile |

### 4.2 Multi-stage Build Pattern

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN npm ci --workspace=apps/api
RUN npx turbo build --filter=api

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### 4.3 Image Tagging

- `latest` — latest successful build from `main`
- `sha-<commit>` — immutable tag per commit
- `v1.2.3` — semantic version tag for releases

---

## 5. Configuration and Secrets Management

### 5.1 Configuration Sources

| Source | Scope | Examples |
|--------|-------|---------|
| Environment variables | Per-deployment | DATABASE_URL, REDIS_URL, S3_ENDPOINT, NODE_ENV |
| Workspace settings (DB) | Per-workspace | File size limits, retention days, quality thresholds |
| Provider configs (DB) | Per-provider | API keys (encrypted), model params |

### 5.2 Secret Handling

| Secret | Storage | Access |
|--------|---------|--------|
| Database URL | Environment variable | API, worker, orchestrator |
| Redis URL | Environment variable | API, worker, orchestrator |
| S3 credentials | Environment variable | API, worker |
| Provider API keys | Encrypted in PostgreSQL | Worker (decrypted at runtime) |
| Auth session secret | Environment variable | Web, API |
| Encryption key (for provider keys) | Environment variable or KMS | API, worker |

**Production secrets management options:**
- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- Kubernetes Secrets (if K8s)
- Docker Secrets (if Docker Swarm)

**Principle:** Secrets never in source code, Docker images, or CI logs.

---

## 6. Deployment Flow

### 6.1 Standard Deployment

```
1. PR merged to main
2. CI pipeline runs (lint → typecheck → test → build → security)
3. Docker images built and pushed to registry
4. Staging deployment (automatic)
   - Pull new images
   - Run database migrations
   - Rolling restart of services
   - Run smoke tests
5. Production deployment (manual approval gate)
   - Pull new images
   - Run database migrations (with rollback plan)
   - Rolling restart:
     a. Workers stop accepting new jobs (graceful shutdown)
     b. New worker containers start
     c. API containers restart (behind load balancer)
     d. Web containers restart
   - Run smoke tests
   - Monitor for 15 minutes (alerts)
```

### 6.2 Zero-Downtime Deployment

- Load balancer health checks ensure only healthy containers receive traffic.
- Rolling updates: at least 1 instance of each service is always running.
- Database migrations must be backward-compatible (additive only).
- Workers drain current jobs before shutdown.

### 6.3 Rollback Strategy

| Severity | Rollback Method |
|----------|----------------|
| Minor issue | Deploy previous image tag (revert PR + redeploy) |
| Database migration issue | Run down migration; redeploy previous image |
| Critical issue | Emergency: point load balancer to previous containers; run down migrations if needed |

**Rollback SLA target:** Production rollback executable within 15 minutes.

---

## 7. Infrastructure Assumptions

### 7.1 Compute

| Service | Min Instances | CPU | Memory | Notes |
|---------|---------------|-----|--------|-------|
| Web (Next.js) | 2 | 1 vCPU | 1 GB | Behind load balancer |
| API (Express) | 2 | 1 vCPU | 1 GB | Behind load balancer |
| Worker | 2–N | 2 vCPU | 2 GB | Horizontally scalable |
| Parser (Python) | 1–2 | 2 vCPU | 2 GB | CPU-intensive |
| Orchestrator | 1 | 1 vCPU | 512 MB | Phase 4 |

### 7.2 Data Services

| Service | Specification | Notes |
|---------|--------------|-------|
| PostgreSQL | 16+, 4 vCPU, 16 GB RAM (production) | Managed recommended (RDS, Cloud SQL) |
| Redis | 7+, 2 GB RAM (production) | Managed recommended (ElastiCache) |
| S3 | Standard tier | Lifecycle rules for cost management |

### 7.3 Networking

- Reverse proxy (Nginx or Caddy) terminates TLS.
- Internal services communicate over private network (no TLS between containers within same host/cluster).
- S3 access via VPC endpoint (no public internet egress for S3 traffic).

---

## 8. Monitoring Infrastructure

### 8.1 Logging Stack

**Option A (managed):** CloudWatch Logs (AWS), Cloud Logging (GCP), Azure Monitor
**Option B (self-hosted):** Loki + Grafana

All services write structured JSON logs to stdout. Container runtime ships logs to the aggregation backend.

### 8.2 Metrics Stack

**Option A (managed):** CloudWatch Metrics, Datadog, New Relic
**Option B (self-hosted):** Prometheus + Grafana

Services expose metrics via OpenTelemetry SDK. Prometheus scrapes metrics endpoints.

### 8.3 Tracing Stack

**Option A (managed):** AWS X-Ray, Datadog APM
**Option B (self-hosted):** Jaeger or Tempo

OpenTelemetry SDK in all services for distributed tracing.

### 8.4 Queue Monitoring

- bull-board or Taskforce.sh for BullMQ dashboard.
- Metrics: queue depth, processing rate, error rate, stalled jobs.

---

## 9. Scaling Strategy

| Scaling Dimension | Trigger | Action |
|-------------------|---------|--------|
| API instances | CPU > 70% or request latency > 500ms | Add API container instance |
| Worker instances | Queue depth > 100 or processing lag > 5 min | Add worker container instance |
| Parser instances | Parser request latency > 10s | Add parser container instance |
| PostgreSQL | Connection count > 80% of max | Increase max_connections or add PgBouncer |
| PostgreSQL read load | Analytics queries impacting primary | Add read replica |
| Redis | Memory usage > 80% | Increase maxmemory or add replica |
| S3 | N/A (auto-scaling) | Implement lifecycle policies for cost |

**K8s HPA (if using Kubernetes):**
- Metric: CPU utilization, custom metrics (queue depth via Prometheus adapter)
- Min replicas: 2 (API, web), 2 (workers)
- Max replicas: configurable per environment

---

## 10. Backup and Disaster Recovery

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| PostgreSQL | Automated snapshots (managed) or pg_dump | Daily + WAL continuous | 30 days |
| Redis | AOF persistence; not critical (queue data) | Continuous | N/A |
| S3 | Versioning enabled; cross-region replication (optional) | Continuous | Per lifecycle policy |
| Docker images | Container registry retention | Per tag | Keep last 50 images |
| Config/secrets | Version controlled (non-secret) or secrets manager history | Per change | Indefinite |

**Disaster recovery plan:**
1. Restore PostgreSQL from latest backup/snapshot.
2. Deploy application containers from registry.
3. Redis starts fresh (BullMQ jobs reconstructed from DB state).
4. S3 data is durable (no restoration needed unless region failure).

---

## 11. Cost Considerations

| Resource | Cost Driver | Optimization |
|----------|-------------|-------------|
| Compute (containers) | Instance hours | Right-size; use spot/preemptible for workers |
| PostgreSQL (managed) | Instance size + storage | Start small; scale up on evidence |
| Redis (managed) | Instance size | Use smallest viable instance |
| S3 | Storage volume + requests | Lifecycle rules; Glacier for old data |
| AI provider APIs | Token/page consumption | Cost intelligence module; budget guardrails |
| Container registry | Image storage | Prune old images; keep last 50 |
| Data transfer | Egress from cloud | Minimize; serve from CDN where applicable |

---

## 12. Release Governance

| Gate | Required For | Approvers |
|------|-------------|-----------|
| PR approval | All merges to main | 1 engineering peer |
| Staging deployment | Automatic on main | CI pipeline |
| Production deployment | Manual trigger | Engineering lead or designated deployer |
| Database migration (production) | Included in deploy | Review by DBA or senior engineer |
| Emergency hotfix | Expedited PR + deploy | Engineering lead + on-call |
| Feature flag toggle | Feature activation | Product owner or engineering lead |

---

## 13. Operational Risks and Dependencies

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cloud provider outage | High | Multi-AZ deployment; runbooks for failover |
| Database corruption | High | Point-in-time recovery; tested restore procedures |
| Docker registry unavailable | Medium | Cache images locally; use multiple registries |
| Secrets manager unavailable | High | Local fallback encrypted config; alerting |
| CI pipeline failure | Medium | Ability to deploy manually from local build |
| Python parser service crash | Medium | Health checks + auto-restart; container orchestrator liveness probe |
| Redis out of memory | High | Monitor aggressively; set eviction policy; maxmemory config |
| Uncontrolled S3 growth | Medium | Lifecycle policies; storage monitoring; budget alerts |
