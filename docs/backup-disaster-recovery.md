# Backup and Disaster Recovery

This document outlines the backup and recovery procedures for the MCQ Platform.

## Backup Strategy

### Database Backups (PostgreSQL)

#### Automated Daily Backups

```bash
# Configure in crontab or use a backup service
0 2 * * * /path/to/scripts/backup-db.sh
```

The backup script (`scripts/backup-db.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-mcq_platform}"
DB_USER="${POSTGRES_USER:-mcq_user}"
DB_HOST="${POSTGRES_HOST:-postgres}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/backup_$DATE.dump"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "backup_*.dump" -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump"
```

#### Backup Retention

- **Daily backups**: Keep for 30 days
- **Weekly backups**: Keep for 12 weeks  
- **Monthly backups**: Keep for 12 months

#### Offsite Backup

Upload backups to S3/MinIO:
```bash
aws s3 cp "$BACKUP_DIR/backup_$DATE.dump" s3://your-backup-bucket/postgres/
```

### Object Storage Backups (MinIO/S3)

MinIO data should be backed up using:

1. **Versioning**: Enable versioning on the bucket
2. **Lifecycle Policies**: Move older objects to cold storage
3. **Cross-region replication**: Replicate to another region

Configure lifecycle policy in `deploy/s3-lifecycle.json`:
```json
{
  "Rules": [
    {
      "ID": "MoveToGlacier",
      "Status": "Enabled",
      "Filter": "",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### Redis Backup

Redis contains queue data which is ephemeral. However, for data integrity:

```bash
# Configure RDB snapshots in redis.conf
save 900 1
save 300 10
save 60 10000
```

### Configuration Backup

Backup environment files and secrets:
```bash
# Backup .env files (exclude secrets in production)
cp Backend/.env Backend/.env.backup
```

## Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery

1. Stop the API and worker:
```bash
docker-compose stop api worker
```

2. Restore from backup:
```bash
pg_restore -h postgres -U mcq_user -d mcq_platform -c backup_20240115_020000.dump
```

3. Start services:
```bash
docker-compose start api worker
```

#### Full Database Rebuild

If the database is completely lost:

1. Ensure PostgreSQL is running
2. Run migrations:
```bash
cd Backend && npm run db:migrate:runtime
```

3. Restore data from backup:
```bash
pg_restore -h postgres -U mcq_user -d mcq_platform -c backup_20240115_020000.dump
```

### Object Storage Recovery

#### Recover from MinIO

1. List deleted objects:
```bash
mc ls --recursive mcq-platform/ | grep DELETED
```

2. Restore:
```bash
mc restore --recursive mcq-platform/workspaces/
```

#### Recover from S3 Backup

```bash
aws s3 sync s3://backup-bucket/ s3://mcq-platform/
```

## Disaster Recovery Scenarios

### Scenario 1: Complete Infrastructure Loss

1. Provision new infrastructure
2. Deploy Docker containers
3. Restore database from latest backup
4. Verify object storage integrity
5. Update DNS/health checks

**RTO (Recovery Time Objective)**: 2 hours
**RPO (Recovery Point Objective)**: 24 hours

### Scenario 2: Database Corruption

1. Stop write operations
2. Identify last known good backup
3. Restore database
4. Verify data integrity
5. Resume operations

**RTO**: 1 hour
**RPO**: 1 hour (with hourly backups)

### Scenario 3: Accidental Data Deletion

1. Identify scope of deletion
2. Point-in-time recovery to before deletion
3. Export affected data
4. Re-insert into current database
5. Document lessons learned

## Monitoring

### Backup Verification

Add backup verification to monitoring:

```bash
# Check latest backup age
LATEST=$(ls -t /backups/postgres/backup_*.dump | head -1)
AGE=$(($(date +%s) - $(stat -c %Y "$LATEST")))
if [ $AGE -gt 86400 ]; then
  echo "ALERT: Last backup is older than 24 hours"
fi
```

### Health Checks

- Verify backup scripts are running
- Check backup file sizes are reasonable
- Test restore procedures quarterly

## Testing Backup Restore

Quarterly, test the backup restore process:

1. Spin up a staging environment
2. Restore latest backup
3. Verify:
   - API endpoints respond
   - Authentication works
   - Job processing works
   - Data integrity checks pass

## Emergency Contacts

| Role | Contact |
|------|---------|
| DBA On-Call | [DBA_TEAM_EMAIL] |
| DevOps Lead | [DEVOPS_LEAD_EMAIL] |
| Infrastructure | [INFRA_TEAM_EMAIL] |
