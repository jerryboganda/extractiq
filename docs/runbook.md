# Production Runbook — ExtractIQ MCQ Platform

## Quick Reference

| Service | Health Check | Logs |
|---------|-------------|------|
| API | `curl http://localhost:4100/api/v1/health` | `docker compose logs api` |
| Worker | `docker compose ps worker` | `docker compose logs worker` |
| PostgreSQL | `docker compose exec postgres pg_isready` | `docker compose logs postgres` |
| Redis | `docker compose exec redis redis-cli ping` | `docker compose logs redis` |
| MinIO | `curl http://localhost:9000/minio/health/live` | `docker compose logs minio` |
| Frontend | `curl -I http://localhost:4101` | Nginx access/error logs |

### Readiness Endpoint

```bash
curl http://localhost:4100/api/v1/health/ready
# Returns: { status: "ready"|"degraded", checks: { database, redis, storage } }
# HTTP 200 = all ok, HTTP 503 = one or more checks failed
```

---

## 1. Service Unresponsive

**Symptoms:** HTTP 502/503, health check failures, container restarts.

1. Check container status: `docker compose -f docker-compose.prod.yml ps`
2. Check readiness: `curl http://localhost:4100/api/v1/health/ready`
3. Review logs for the failing service: `docker compose logs --tail=200 <service>`
4. Check for OOM kills: `docker inspect <container_id> | grep -i oom`
5. Check host resources: `df -h && free -m && top -bn1 | head -20`
6. If unrecoverable, restart service: `docker compose -f docker-compose.prod.yml restart <service>`
7. If container keeps crashing, check recent code changes and consider rollback (see §7)
8. Verify recovery: `curl http://localhost:4100/api/v1/health/ready`

---

## 2. Queue Stalled / Jobs Not Processing

**Symptoms:** Jobs stuck in `active` or `waiting` state, no worker output.

1. Check worker container: `docker compose -f docker-compose.prod.yml ps worker`
2. Check worker logs: `docker compose logs --tail=100 worker`
3. Verify Redis connectivity: `docker compose exec redis redis-cli ping`
4. Check Redis memory: `docker compose exec redis redis-cli info memory | grep used_memory_human`
5. Check for stalled jobs in logs — look for repeated failures or provider errors
6. Restart worker (graceful drain): `docker compose -f docker-compose.prod.yml restart worker`
7. If Redis is unresponsive, restart Redis (queue state will recover from DB):
   ```bash
   docker compose -f docker-compose.prod.yml restart redis
   # Wait 10 seconds, then restart worker
   docker compose -f docker-compose.prod.yml restart worker
   ```
8. Verify jobs are processing: `docker compose logs --tail=50 -f worker`

---

## 3. Database Connection Exhaustion

**Symptoms:** API errors with "too many connections", slow queries, timeouts.

1. Check active connections:
   ```bash
   docker compose exec postgres psql -U postgres -d mcq_platform \
     -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   ```
2. Kill idle long-running connections:
   ```bash
   docker compose exec postgres psql -U postgres -d mcq_platform \
     -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"
   ```
3. Restart API to reset connection pool: `docker compose -f docker-compose.prod.yml restart api`
4. If persistent, check for connection leaks in recent code changes
5. Consider increasing `max_connections` in PostgreSQL config if load warrants it

---

## 4. High Provider Error Rate

**Symptoms:** MCQ extraction failures, provider timeout errors in worker logs.

1. Identify failing provider from worker logs: `docker compose logs worker | grep -i "provider.*error\|provider.*fail" | tail -20`
2. Check provider status pages (OpenAI, Anthropic, etc.)
3. Check if rate limits are being hit (look for 429 responses in logs)
4. If a provider is down, disable it via the admin UI or database:
   ```bash
   docker compose exec postgres psql -U postgres -d mcq_platform \
     -c "UPDATE providers SET is_active = false WHERE name = '<provider_name>';"
   ```
5. Retry failed jobs after provider recovery
6. Re-enable provider: `UPDATE providers SET is_active = true WHERE name = '<provider_name>';`

---

## 5. Storage (MinIO/S3) Issues

**Symptoms:** Upload failures, presigned URL errors, storage health check failing.

1. Check MinIO health: `curl http://localhost:9000/minio/health/live`
2. Check MinIO logs: `docker compose logs --tail=100 minio`
3. Verify bucket exists: `docker compose exec minio mc ls local/`
4. Check disk space on host: `df -h`
5. If MinIO is unresponsive, restart: `docker compose -f docker-compose.prod.yml restart minio`
6. If bucket is missing, recreate:
   ```bash
   docker compose exec minio mc mb local/${S3_BUCKET:-mcq-platform} --ignore-existing
   ```

---

## 6. Database Backup & Recovery

### Manual Backup

```bash
docker compose exec postgres pg_dump -U postgres mcq_platform | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup

```bash
# Stop API and worker first
docker compose -f docker-compose.prod.yml stop api worker

# Restore
gunzip -c backup_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U postgres mcq_platform

# Run migrations to ensure schema is current
cd /opt/extractiq/Backend
npx drizzle-kit migrate

# Restart services
docker compose -f docker-compose.prod.yml start api worker
```

---

## 7. Rollback Procedure

### Quick Rollback (< 15 minutes)

```bash
cd /opt/extractiq

# 1. Identify previous working commit
git log --oneline -5

# 2. Revert to previous commit
git checkout <previous_commit_hash>

# 3. Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build api worker

# 4. If frontend changes, rebuild
cd "Web App" && npm run build
cp -r dist/* /var/www/extractiq/webapp/

# 5. Verify
curl http://localhost:4100/api/v1/health/ready
```

### Database Migration Rollback

If a migration caused the issue, Drizzle ORM migrations are additive. Restore from backup if schema change is destructive (see §6).

---

## 8. Certificate / TLS Issues

**Symptoms:** HTTPS errors, browser security warnings.

1. Check Nginx configuration: `nginx -t`
2. Check certificate expiry: `echo | openssl s_client -connect extractiq.polytronx.com:443 2>/dev/null | openssl x509 -noout -dates`
3. Reload Nginx after certificate renewal: `systemctl reload nginx`

---

## 9. Emergency Contacts & Escalation

| Level | Action | SLA |
|-------|--------|-----|
| P1 (Service Down) | Page on-call engineer | 15 min ack, 1 hr resolution |
| P2 (Degraded) | Slack alert to engineering | 1 hr ack |
| P3 (Warning) | Slack notification | Next business day |

**Escalation:** On-call → Engineering Lead → CTO

---

## 10. Post-Incident

1. Ensure service is stable for 15+ minutes
2. Document timeline in incident channel
3. Schedule blameless post-mortem within 48 hours
4. Create action items to prevent recurrence
5. Update this runbook if applicable
