# Observability & Operations — MCQ Extraction Platform v2.0

## Document Purpose

This document defines the observability architecture (logging, metrics, tracing, alerting), operational procedures (health checks, incident response, runbooks), and operational readiness criteria for the MCQ Extraction Platform.

---

## 1. Observability Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Applications                               │
│  ┌─────┐  ┌─────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Web │  │ API │  │ Worker │  │ Parser │  │ Orch.  │          │
│  └──┬──┘  └──┬──┘  └───┬────┘  └───┬────┘  └───┬────┘          │
│     │        │         │           │           │                  │
│     └────────┴─────────┴───────────┴───────────┘                 │
│              │              │              │                      │
│         Structured     OpenTelemetry   OpenTelemetry              │
│         JSON Logs      Metrics         Traces                    │
└──────────┬──────────────┬──────────────┬─────────────────────────┘
           │              │              │
     ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
     │  Log       │  │ Metrics │  │  Trace    │
     │  Aggregator│  │ Backend │  │  Backend  │
     │ (Loki/CW)  │  │(Prom/CW)│  │(Jaeger/  │
     └─────┬─────┘  └────┬────┘  │ Tempo/XR) │
           │              │       └─────┬─────┘
           └──────────────┴─────────────┘
                          │
                    ┌─────▼─────┐
                    │  Grafana  │
                    │ Dashboards│
                    │ + Alerts  │
                    └───────────┘
```

---

## 2. Structured Logging

### 2.1 Log Format

All services emit structured JSON logs to stdout. Container runtime collects and ships logs.

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "service": "api",
  "requestId": "req_abc123",
  "traceId": "trace_def456",
  "message": "Document uploaded successfully",
  "context": {
    "userId": "usr_789",
    "workspaceId": "ws_012",
    "documentId": "doc_345",
    "fileSize": 2048576,
    "mimeType": "application/pdf"
  }
}
```

### 2.2 Log Levels

| Level | Usage | Examples |
|-------|-------|---------|
| error | Errors requiring attention | Unhandled exceptions, provider failures, DB connection errors |
| warn | Potential issues | Rate limit approaching, deprecated API usage, high queue depth |
| info | Normal operations | Request completed, job started/completed, user login |
| debug | Development diagnostics | SQL queries, HTTP request/response details, queue events |

### 2.3 Log Fields (Standard)

| Field | Required | Description |
|-------|----------|-------------|
| timestamp | Yes | ISO 8601 with milliseconds |
| level | Yes | error, warn, info, debug |
| service | Yes | api, worker, parser, web, orchestrator |
| requestId | Yes (API) | Unique per HTTP request |
| traceId | When available | OpenTelemetry trace ID |
| message | Yes | Human-readable message |
| context | When applicable | Structured metadata (userId, resourceId, etc.) |
| error | On errors | Error message, stack trace |
| duration | On completions | Operation duration in milliseconds |

### 2.4 PII Masking

| Data Type | Masking Rule | Example |
|-----------|-------------|---------|
| Email | Show first 2 chars + domain | `jo***@example.com` |
| IP address | Hash or mask last octet | `192.168.1.***` |
| API keys | Show first 4 chars | `sk-a***` |
| User names | Never logged in production | — |
| MCQ content | Never logged (log IDs only) | `mcqId: "mcq_123"` |

---

## 3. Metrics

### 3.1 Application Metrics

| Metric | Type | Labels | Service |
|--------|------|--------|---------|
| `http_requests_total` | Counter | method, path, status_code | API |
| `http_request_duration_seconds` | Histogram | method, path | API |
| `http_active_connections` | Gauge | — | API |
| `queue_jobs_total` | Counter | queue_name, status (completed/failed) | Worker |
| `queue_job_duration_seconds` | Histogram | queue_name | Worker |
| `queue_depth` | Gauge | queue_name | Worker |
| `queue_stalled_jobs` | Gauge | queue_name | Worker |
| `provider_requests_total` | Counter | provider_id, category, status | Worker |
| `provider_request_duration_seconds` | Histogram | provider_id, category | Worker |
| `provider_cost_total` | Counter | provider_id, category | Worker |
| `documents_processed_total` | Counter | status | Worker |
| `mcq_records_created_total` | Counter | source (ocr, llm, vlm) | Worker |
| `confidence_score_distribution` | Histogram | — | Worker |
| `hallucination_detections_total` | Counter | tier (model, context, data) | Worker |
| `export_jobs_total` | Counter | format, status | Worker |
| `active_sessions` | Gauge | — | API |
| `auth_failures_total` | Counter | reason | API |

### 3.2 Infrastructure Metrics

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| CPU utilization | Container runtime | > 80% for 5 min |
| Memory utilization | Container runtime | > 85% for 5 min |
| Disk usage | Host/volume | > 80% |
| PostgreSQL connections | pg_stat_activity | > 80% of max_connections |
| PostgreSQL replication lag | pg_stat_replication | > 1 minute |
| Redis memory usage | Redis INFO | > 80% of maxmemory |
| Redis connected clients | Redis INFO | > 80% of maxclients |
| S3 request errors | S3/MinIO metrics | > 1% error rate |

### 3.3 Business Metrics

| Metric | Type | Purpose |
|--------|------|---------|
| Documents uploaded per day | Counter (aggregated) | Usage tracking |
| MCQs extracted per day | Counter (aggregated) | Throughput tracking |
| MCQ approval rate | Gauge (computed) | Quality indicator |
| Average confidence score | Gauge (computed) | Extraction quality |
| Provider cost per document | Gauge (computed) | Cost efficiency |
| Time from upload to review-ready | Histogram | Pipeline efficiency |
| Review items per reviewer per hour | Gauge (computed) | Reviewer productivity |

---

## 4. Distributed Tracing

### 4.1 Trace Propagation

| Hop | Propagation Method |
|-----|--------------------|
| Browser → API | W3C Trace Context header (`traceparent`) |
| API → Worker (via BullMQ) | Trace context in job data payload |
| Worker → Parser | W3C Trace Context header |
| Worker → External AI | Trace context NOT propagated (external service) |

### 4.2 Key Trace Spans

| Span | Service | Parent | Purpose |
|------|---------|--------|---------|
| `http.request` | API | Root | Full HTTP request lifecycle |
| `db.query` | API/Worker | HTTP/Job | Database query execution |
| `queue.enqueue` | API | HTTP | Job enqueueing |
| `queue.process` | Worker | Root | Job processing lifecycle |
| `provider.execute` | Worker | Queue process | AI provider API call |
| `parser.extract` | Parser | Queue process | Document parsing |
| `s3.upload` / `s3.download` | API/Worker | Parent | S3 operations |
| `validation.pipeline` | Worker | Queue process | MCQ validation pipeline |
| `export.generate` | Worker | Queue process | Export file generation |

### 4.3 Sampling Strategy

| Environment | Sampling Rate | Rationale |
|-------------|--------------|-----------|
| Local | 100% | Full visibility for development |
| Development | 100% | Full visibility for debugging |
| Staging | 50% | Reasonable visibility; reduced storage |
| Production | 10% (error traces: 100%) | Cost management; always capture errors |

---

## 5. Health Checks

### 5.1 Endpoints

| Service | Liveness | Readiness |
|---------|----------|-----------|
| API | GET /health → 200 | GET /ready → 200 (checks DB + Redis + S3) |
| Worker | Process alive check | Queue connection active + DB accessible |
| Parser | GET /health → 200 | GET /ready → 200 (checks PyMuPDF available) |
| Web | GET / → 200 | Same as liveness (static assets served) |

### 5.2 Readiness Check Components

| Component | Check | Timeout | Failure Action |
|-----------|-------|---------|---------------|
| PostgreSQL | `SELECT 1` | 3s | Service not ready; don't route traffic |
| Redis | `PING` → `PONG` | 2s | Service not ready |
| S3 | `HeadBucket` | 5s | Service not ready |
| Parser (from Worker) | `GET /health` | 3s | Don't process parsing jobs |

### 5.3 Health Check Schedule

| Checker | Interval | Timeout | Failure Threshold |
|---------|---------|---------|-------------------|
| Container orchestrator liveness | 10s | 3s | 3 consecutive failures → restart |
| Container orchestrator readiness | 5s | 3s | 1 failure → stop routing traffic |
| External uptime monitor | 60s | 10s | 3 failures → alert |

---

## 6. Alerting

### 6.1 Alert Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Service down | Health check fails for > 2 min | Critical | PagerDuty/Slack/Email |
| High error rate | API 5xx rate > 5% for 5 min | Critical | PagerDuty/Slack |
| Queue stalled | Queue depth increasing + processing rate = 0 for 10 min | Critical | Slack |
| High queue depth | Queue depth > 200 for 15 min | Warning | Slack |
| Database connections exhausted | Active connections > 90% of max | Critical | PagerDuty/Slack |
| Database replication lag | Lag > 5 min | Warning | Slack |
| Redis memory high | Usage > 85% of maxmemory | Warning | Slack |
| Disk usage high | > 80% | Warning | Slack |
| Disk usage critical | > 90% | Critical | PagerDuty |
| Provider error spike | Provider error rate > 20% for 10 min | Warning | Slack |
| Auth failure spike | > 50 failed logins in 5 min | Warning | Slack/Security |
| Certificate expiry | TLS cert expires within 14 days | Warning | Email |
| Extraction accuracy drop | Golden dataset regression > 5% | Warning | Slack |
| Budget threshold | Provider costs > 80% of workspace budget | Warning | Slack/Email |

### 6.2 Alert Routing

| Severity | Routing | Response Time |
|----------|---------|--------------|
| Critical | PagerDuty (page on-call) + Slack #incidents | < 15 min acknowledgment |
| Warning | Slack #alerts | < 1 hour review |
| Info | Slack #monitoring (low priority) | Next business day |

---

## 7. Operational Dashboards

### 7.1 Dashboard Catalog

| Dashboard | Audience | Key Panels |
|-----------|----------|------------|
| System Overview | Engineering/Ops | Service health, error rate, request rate, queue depth |
| API Performance | Engineering | Latency percentiles, throughput, error breakdown by endpoint |
| Queue Operations | Engineering/Ops | Queue depth per queue, processing rate, stalled jobs, retry rate |
| Provider Performance | Engineering | Per-provider latency, error rate, cost, throughput |
| Database Performance | DBA/Engineering | Query latency, connection pool, replication lag, cache hit ratio |
| Business Metrics | Product/Management | Documents processed, MCQs extracted, approval rate, cost per MCQ |
| Security | Security/Ops | Auth failures, rate limit hits, blocked requests, audit events |

### 7.2 System Overview Dashboard Panels

| Panel | Visualization | Data Source |
|-------|--------------|-------------|
| Service health status | Status indicator (green/yellow/red) | Health check endpoints |
| Request rate (RPM) | Line chart | `http_requests_total` |
| Error rate (%) | Line chart with threshold line | `http_requests_total` filtered by status |
| p50/p95/p99 latency | Line chart | `http_request_duration_seconds` |
| Queue depth by queue | Stacked area chart | `queue_depth` |
| Active workers | Gauge | Worker process count |
| CPU / Memory utilization | Line chart per service | Container metrics |
| Recent errors | Log table | Error-level logs |

---

## 8. Operational Runbooks

### 8.1 Runbook: Service Unresponsive

| Step | Action |
|------|--------|
| 1 | Check health endpoint: `curl https://api.mcq-platform.example/health` |
| 2 | Check container status: `docker ps` or `kubectl get pods` |
| 3 | Check logs: filter by service + level=error for last 15 min |
| 4 | If OOM: increase memory limit; restart container |
| 5 | If crash loop: check recent deployment; consider rollback |
| 6 | If dependency failure: check PostgreSQL, Redis, S3 connectivity |
| 7 | Restart service: `docker compose restart <service>` or `kubectl rollout restart` |
| 8 | Verify recovery: check health endpoint and error rate |

### 8.2 Runbook: Queue Stalled

| Step | Action |
|------|--------|
| 1 | Open bull-board dashboard |
| 2 | Check stalled jobs: identify queue and job IDs |
| 3 | Check worker logs for errors or hangs |
| 4 | If worker OOM: increase memory; restart worker |
| 5 | If Redis connectivity issue: check Redis health, reconnect |
| 6 | If provider timeout: check provider status page; increase timeout |
| 7 | Move stalled jobs to failed: `queue.clean(1000, 'stalled')` |
| 8 | Retry failed jobs if appropriate |
| 9 | Monitor queue depth returns to normal |

### 8.3 Runbook: Database Connection Exhaustion

| Step | Action |
|------|--------|
| 1 | Check active connections: `SELECT count(*) FROM pg_stat_activity` |
| 2 | Identify heavy connection consumers: `SELECT application_name, count(*) FROM pg_stat_activity GROUP BY 1` |
| 3 | Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '5 minutes'` |
| 4 | If PgBouncer deployed: check PgBouncer pool stats |
| 5 | If persistent: increase `max_connections` or add PgBouncer |
| 6 | Check for connection leaks in application code (connections not released) |

### 8.4 Runbook: High Provider Error Rate

| Step | Action |
|------|--------|
| 1 | Identify failing provider from `provider_requests_total` metrics |
| 2 | Check provider status page (e.g., status.openai.com) |
| 3 | Check error details in logs (filter by provider ID) |
| 4 | If rate limited (429): reduce concurrency; check budget |
| 5 | If auth error (401/403): verify API key validity |
| 6 | If provider outage: switch to backup provider if configured |
| 7 | If persistent: disable provider in admin; notify users |

### 8.5 Runbook: Database Recovery

| Step | Action |
|------|--------|
| 1 | Assess damage: check database accessibility and data integrity |
| 2 | If managed DB: initiate point-in-time recovery via cloud console |
| 3 | If self-hosted: restore from latest pg_dump backup + WAL replay |
| 4 | Verify data integrity: run consistency checks |
| 5 | Update application configs if DB endpoint changed |
| 6 | Run database migrations to ensure schema is current |
| 7 | Restart application services |
| 8 | Verify end-to-end functionality |
| 9 | Post-incident: review backup schedule and recovery time |

---

## 9. On-Call Procedures

| Aspect | Policy |
|--------|--------|
| Rotation | Weekly rotation among engineering team |
| Escalation | On-call → Engineering lead → CTO/VP Eng |
| Response SLA | Critical: 15 min ack / 1 hour resolution; Warning: 1 hour ack |
| Communication | Slack #incidents channel; status page update for user-facing issues |
| Post-incident | Blameless post-mortem within 48 hours; action items tracked |

---

## 10. Operational Readiness Checklist

| Category | Requirement | Status |
|----------|------------|--------|
| **Logging** | Structured JSON logs from all services | Phase 0 |
| **Logging** | Log aggregation deployed | Phase 1 |
| **Logging** | PII masking verified | Phase 1 |
| **Metrics** | Application metrics exported via OpenTelemetry | Phase 1 |
| **Metrics** | Infrastructure metrics collected | Phase 1 |
| **Metrics** | Dashboards created (system overview, API, queues) | Phase 1 |
| **Tracing** | Trace propagation across services | Phase 2 |
| **Tracing** | Trace backend deployed | Phase 2 |
| **Alerting** | Critical alerts configured and tested | Phase 1 |
| **Alerting** | Alert routing to on-call verified | Phase 1 |
| **Health** | Health check endpoints on all services | Phase 0 |
| **Health** | External uptime monitoring | Phase 1 |
| **Runbooks** | Core runbooks written and accessible | Phase 1 |
| **Backup** | Database backup verified with restore test | Phase 1 |
| **DR** | Disaster recovery plan documented | Phase 2 |
| **DR** | DR drill executed successfully | Phase 3 |
| **On-call** | On-call rotation established | Phase 1 |
| **Incidents** | Incident response process documented | Phase 1 |
