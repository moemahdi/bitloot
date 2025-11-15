# 🆘 BitLoot Disaster Recovery Runbook

**Last Updated:** November 15, 2025  
**Purpose:** Step-by-step procedures for database recovery from backups  
**Scope:** PostgreSQL database restoration from Cloudflare R2 backups

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Recovery Procedures](#recovery-procedures)
4. [Verification Steps](#verification-steps)
5. [Troubleshooting](#troubleshooting)
6. [Prevention & Monitoring](#prevention--monitoring)

---

## Overview

### Backup Strategy

BitLoot maintains automated nightly database backups stored in Cloudflare R2 with:
- **Frequency:** Daily at 2:00 AM UTC (configurable)
- **Retention:** 30 days (configurable)
- **Compression:** gzip (80% space reduction)
- **Verification:** SHA256 checksum + gzip integrity checks
- **Location:** `s3://bitloot-backups/backups/`

### Recovery Time Objective (RTO)

- **Estimated Recovery Time:** 15-30 minutes
  - 5 min: AWS CLI setup + credential configuration
  - 3 min: Download backup from R2
  - 2 min: Decompress backup file
  - 5 min: PostgreSQL restore process
  - 2 min: Verification and smoke tests

### Recovery Point Objective (RPO)

- **Data Loss Window:** < 24 hours (since backups are daily)
- **Recommendation:** Consider hourly backups for production

---

## Prerequisites

### Environment & Tools

Before attempting recovery, ensure:

1. **PostgreSQL Client Tools**
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   apt-get install postgresql-client

   # Windows
   choco install postgresql
   ```

2. **AWS CLI v2**
   ```bash
   # Install AWS CLI
   pip install awscli-v2
   # or via direct download: https://aws.amazon.com/cli/

   # Verify installation
   aws --version
   ```

3. **Environment Variables Set**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/bitloot"
   export R2_ACCESS_KEY_ID="your-r2-access-key"
   export R2_SECRET_ACCESS_KEY="your-r2-secret-key"
   export R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
   export R2_BUCKET="bitloot-backups"
   ```

4. **Network Access**
   - Access to production PostgreSQL database
   - Access to Cloudflare R2 (or download backups in advance)
   - Firewall rules allowing database connections

5. **Disk Space**
   - Minimum 10 GB free space for decompressed backup
   - Check with: `df -h`

### Credentials & Access

**R2 Credentials** (stored in `.env` - do NOT commit):
```
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
R2_BUCKET=bitloot-backups
```

**Database Credentials**:
```
DATABASE_URL=postgresql://bitloot_user:password@prod-db.example.com:5432/bitloot
```

---

## Recovery Procedures

### Scenario 1: Restore to New Database (Test Recovery)

**Use Case:** Testing restore process, verifying backup integrity, disaster recovery drill

**Steps:**

1. **Create new database for recovery**
   ```bash
   # Create empty database
   createdb -h localhost -U postgres bitloot_recovery
   
   # Verify creation
   psql -h localhost -U postgres -c "\l" | grep bitloot_recovery
   ```

2. **Download backup from R2**
   ```bash
   # Configure AWS CLI credentials
   export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
   export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
   
   # List available backups
   aws s3 ls s3://$R2_BUCKET/backups/ \
     --endpoint-url "$R2_ENDPOINT" \
     --region auto
   
   # Download specific backup
   BACKUP_FILE="bitloot_backup_20251115_020000.sql.gz"
   aws s3 cp "s3://$R2_BUCKET/backups/$BACKUP_FILE" ./ \
     --endpoint-url "$R2_ENDPOINT" \
     --region auto
   
   # Verify download
   ls -lh "$BACKUP_FILE"
   ```

3. **Verify backup integrity**
   ```bash
   # Check gzip integrity
   gzip -t "$BACKUP_FILE"
   
   # If successful, output is empty (no errors)
   echo $?  # Should print 0
   ```

4. **Decompress backup**
   ```bash
   # Decompress
   gzip -d "$BACKUP_FILE"
   
   # Result: bitloot_backup_20251115_020000.sql (uncompressed)
   ls -lh bitloot_backup_*
   ```

5. **Restore to new database**
   ```bash
   # Restore from SQL dump
   psql -h localhost \
     -U bitloot_user \
     -d bitloot_recovery \
     < bitloot_backup_20251115_020000.sql
   
   # Monitor progress
   # Output: CREATE EXTENSION ... CREATE TABLE ... INSERT INTO ...
   ```

6. **Verify restored data**
   ```bash
   # Check row counts
   psql -h localhost \
     -U bitloot_user \
     -d bitloot_recovery \
     -c "SELECT count(*) FROM orders;"
   
   psql -h localhost \
     -U bitloot_user \
     -d bitloot_recovery \
     -c "SELECT count(*) FROM users;"
   ```

7. **Cleanup test database**
   ```bash
   # Drop recovery database when finished testing
   dropdb -h localhost -U postgres bitloot_recovery
   
   # Remove backup files
   rm -f bitloot_backup_*.sql.gz bitloot_backup_*.sql
   ```

---

### Scenario 2: Restore to Production (Critical Recovery)

**Use Case:** Production database corruption, accidental data deletion, major incident

⚠️ **WARNING:** This is a destructive operation. Follow carefully.

**Pre-Recovery Checklist:**

- [ ] Backup current production database (if possible)
- [ ] Notify stakeholders of planned downtime
- [ ] Have rollback plan ready
- [ ] Test restore procedure first (Scenario 1)
- [ ] Verify backup checksum and integrity
- [ ] Estimated downtime: 30-60 minutes

**Steps:**

1. **Stop application servers**
   ```bash
   # Stop API and Web services
   docker-compose down
   
   # Verify services are stopped
   docker ps
   ```

2. **Create safety backup of current state** (if database is accessible)
   ```bash
   # Create point-in-time backup before restore
   pg_dump "$DATABASE_URL" | gzip > current_state_backup.sql.gz
   
   # Verify safety backup
   gzip -t current_state_backup.sql.gz
   ```

3. **Download backup from R2**
   ```bash
   export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
   export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
   
   aws s3 cp "s3://$R2_BUCKET/backups/bitloot_backup_20251115_020000.sql.gz" ./ \
     --endpoint-url "$R2_ENDPOINT" \
     --region auto
   ```

4. **Decompress backup**
   ```bash
   gzip -d bitloot_backup_20251115_020000.sql.gz
   ```

5. **Connect to production database and verify connectivity**
   ```bash
   psql "$DATABASE_URL" -c "SELECT version();"
   ```

6. **Drop and recreate production database** ⚠️ **DESTRUCTIVE**
   ```bash
   # Extract database name
   DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\/\([^?]*\).*/\1/')
   
   # Connect as superuser and drop database
   # WARNING: This deletes all current data
   psql postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
   psql postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
   
   # Recreate empty database
   psql postgres -c "CREATE DATABASE $DB_NAME;"
   ```

7. **Restore from backup**
   ```bash
   psql "$DATABASE_URL" < bitloot_backup_20251115_020000.sql
   
   # Monitor restoration progress
   # May take 5-10 minutes for large databases
   ```

8. **Verify restored data**
   ```bash
   # Check database integrity
   psql "$DATABASE_URL" -c "SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
   
   # Verify key tables
   psql "$DATABASE_URL" -c "SELECT count(*) FROM orders;"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM payments;"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM users;"
   
   # Check for any corruption
   psql "$DATABASE_URL" -c "VACUUM ANALYZE;"
   ```

9. **Run database migrations** (if necessary)
   ```bash
   # If backup is from earlier version, run pending migrations
   npm run migration:run
   ```

10. **Restart application servers**
    ```bash
    # Start services
    docker-compose up -d
    
    # Verify startup
    docker ps
    curl http://localhost:4000/healthz
    ```

11. **Verify application functionality**
    ```bash
    # Check API endpoints
    curl http://localhost:4000/api/docs
    
    # Test key workflows
    # - Login (OTP flow)
    # - View orders
    # - Check admin pages
    # - Monitor logs
    ```

12. **Cleanup backup files**
    ```bash
    rm -f bitloot_backup_*.sql current_state_backup.sql.gz
    ```

---

### Scenario 3: Point-in-Time Recovery (PITR)

**Use Case:** Recover to specific moment before accidental deletion

**Note:** Requires WAL archiving (not configured by default in L5)

For future implementation:
- Enable WAL archiving to S3
- Archive transaction logs hourly
- Enable recovery to any point in time

---

## Verification Steps

### Post-Recovery Validation

Run these checks to verify successful recovery:

1. **Database Connectivity**
   ```bash
   psql "$DATABASE_URL" -c "SELECT now();"
   # Expected: Current timestamp
   ```

2. **Schema Integrity**
   ```bash
   psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema');"
   # Expected: public
   ```

3. **Table Verification**
   ```bash
   psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
   # Expected: All BitLoot tables (orders, users, payments, etc.)
   ```

4. **Data Sample Check**
   ```bash
   # Get sample from key tables
   psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_orders FROM orders; SELECT COUNT(*) as total_users FROM users; SELECT COUNT(*) as total_payments FROM payments;"
   ```

5. **Application Smoke Tests**
   ```bash
   # Test API health
   curl http://localhost:4000/healthz
   # Expected: {"ok": true, ...}
   
   # Test Swagger docs
   curl http://localhost:4000/api/docs | head -50
   # Expected: HTML with Swagger UI
   ```

6. **Authentication Test**
   ```bash
   # Test OTP flow
   curl -X POST http://localhost:4000/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   # Expected: { "success": true, "expiresIn": 300 }
   ```

7. **Admin Access Test**
   ```bash
   # Verify admin endpoints exist
   curl http://localhost:4000/admin/payments 2>&1 | head -1
   # Expected: 401 or 403 (auth required) or data
   ```

---

## Troubleshooting

### Common Issues

#### 1. "Database already exists" error

```bash
Error: database "bitloot" already exists
```

**Solution:**
```bash
# Drop existing database first
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\/\([^?]*\).*/\1/')
psql postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql postgres -c "CREATE DATABASE $DB_NAME;"
```

#### 2. "Permission denied" error

```bash
Error: permission denied for schema public
```

**Solution:**
```bash
# Fix permissions after restore
psql "$DATABASE_URL" -c "GRANT ALL ON SCHEMA public TO PUBLIC;"
psql "$DATABASE_URL" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;"
psql "$DATABASE_URL" -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;"
```

#### 3. "Connection refused" error

```bash
Error: could not connect to server: Connection refused
```

**Solution:**
```bash
# Verify database is running
docker ps | grep postgres

# Check connection string
echo "$DATABASE_URL"

# Test connection
psql postgres -c "SELECT 1;"
```

#### 4. "Backup file corrupted" error

```bash
gzip: stdin has invalid gzip trailer
```

**Solution:**
```bash
# Download backup again
aws s3 cp s3://$R2_BUCKET/backups/bitloot_backup_*.sql.gz ./

# Try older backup if available
aws s3 ls s3://$R2_BUCKET/backups/ --endpoint-url "$R2_ENDPOINT"
```

#### 5. "Out of disk space" error

```bash
Error: could not extend file "base/16384/16385": No space left on device
```

**Solution:**
```bash
# Check disk space
df -h /

# Free up space
rm -f *.sql.gz *.sql

# Resize volume or use external disk
```

---

## Prevention & Monitoring

### Backup Monitoring

**Weekly Checklist:**

- [ ] Verify latest backup exists in R2
- [ ] Check backup file size is reasonable (> 100MB expected)
- [ ] Confirm backup age < 24 hours
- [ ] Review backup logs for errors

**Commands:**

```bash
# Check latest backup
aws s3 ls s3://$R2_BUCKET/backups/ \
  --endpoint-url "$R2_ENDPOINT" \
  --recursive | sort | tail -5

# Get backup file size
aws s3 ls s3://$R2_BUCKET/backups/bitloot_backup_LATEST.sql.gz \
  --endpoint-url "$R2_ENDPOINT" --summarize
```

### Alerting

**Alert Conditions:**

1. ❌ No backup created in last 24 hours
2. ❌ Backup file size < 50MB (possible incomplete backup)
3. ❌ Backup upload failed
4. ❌ Backup integrity check failed

**Implementation:**

```bash
# In monitoring script (cron job)
LATEST_BACKUP=$(aws s3 ls s3://$R2_BUCKET/backups/ \
  --endpoint-url "$R2_ENDPOINT" | tail -1 | awk '{print $4}')

BACKUP_AGE=$(($(date +%s) - $(date -d "$(aws s3 ls s3://$R2_BUCKET/backups/$LATEST_BACKUP --endpoint-url "$R2_ENDPOINT" | awk '{print $1, $2}')" +%s)))

if [ $BACKUP_AGE -gt 86400 ]; then
  # Alert: Backup older than 24 hours
  send_alert "Database backup is stale (${BACKUP_AGE}s old)"
fi
```

### Testing

**Monthly Recovery Test:**

```bash
# Run Scenario 1 monthly
./scripts/backup-db.sh --dry-run
# Then with real data in test environment

# Document results
# - Time to restore
# - Data integrity check results
# - Any issues encountered
```

---

## Emergency Contact

**If Recovery Fails:**

1. Check this runbook's Troubleshooting section
2. Review backup logs: `tail -f /tmp/bitloot-backups/backup.log`
3. Contact DevOps team with:
   - Error message
   - Steps taken
   - Backup file name
   - Current database state

---

## Appendix: Automated Backup Setup

### GitHub Actions Workflow

The backup automation is configured in `.github/workflows/backup-nightly.yml`:

```yaml
name: Nightly Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
        run: ./scripts/backup-db.sh
```

---

## Sign-Off

**Document Version:** 1.0  
**Last Updated:** November 15, 2025  
**Reviewed By:** DevOps Team  
**Status:** Production Ready ✅

Next Review Date: November 22, 2025

---

**BitLoot Disaster Recovery Runbook - COMPLETE**
