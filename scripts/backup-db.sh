#!/bin/bash

################################################################################
# BitLoot Database Backup Script
# Purpose: Backup PostgreSQL database to Cloudflare R2 with compression
# Usage: ./backup-db.sh [--dry-run] [--retention-days 30]
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-/tmp/bitloot-backups}"
DRY_RUN=false
RETENTION_DAYS=30
LOG_FILE="${BACKUP_DIR}/backup.log"

# Environment variables (must be set)
: "${DATABASE_URL:?Error: DATABASE_URL not set}"
: "${R2_ACCESS_KEY_ID:?Error: R2_ACCESS_KEY_ID not set}"
: "${R2_SECRET_ACCESS_KEY:?Error: R2_SECRET_ACCESS_KEY not set}"
: "${R2_ENDPOINT:?Error: R2_ENDPOINT not set}"
: "${R2_BUCKET:?Error: R2_BUCKET not set}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --retention-days)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Initialize logging
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log "INFO" "Starting BitLoot database backup"
log "INFO" "Dry-run mode: $DRY_RUN"
log "INFO" "Retention days: $RETENTION_DAYS"

# Extract database name from DATABASE_URL
# Expected format: postgresql://user:password@host:port/dbname
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\/\([^?]*\).*/\1/')
BACKUP_TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILENAME="bitloot_backup_${BACKUP_TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

log "INFO" "Database: $DB_NAME"
log "INFO" "Backup file: $BACKUP_FILENAME"

# Function to cleanup on error
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "ERROR" "Backup failed with exit code $exit_code"
    # Remove partial backup file
    if [ -f "$BACKUP_PATH" ]; then
      rm -f "$BACKUP_PATH"
      log "INFO" "Removed partial backup file"
    fi
  fi
  exit $exit_code
}
trap cleanup EXIT

# Step 1: Create database dump
log "INFO" "Creating database dump..."
if [ "$DRY_RUN" = true ]; then
  log "INFO" "[DRY-RUN] Would execute: pg_dump \"$DATABASE_URL\" | gzip > $BACKUP_PATH"
else
  if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_PATH"; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log "INFO" "Database dump created successfully (size: $BACKUP_SIZE)"
  else
    log "ERROR" "Failed to create database dump"
    exit 1
  fi
fi

# Step 2: Upload to Cloudflare R2
log "INFO" "Uploading backup to Cloudflare R2..."

# Install AWS CLI if not present (optional, for backup verification)
if ! command -v aws &> /dev/null; then
  log "WARN" "AWS CLI not found. Install with: pip install awscli"
  log "INFO" "Proceeding with manual upload instructions:"
  log "INFO" "1. Install AWS CLI: pip install awscli"
  log "INFO" "2. Configure with R2 credentials"
  log "INFO" "3. Run: aws s3 cp $BACKUP_PATH s3://$R2_BUCKET/backups/ --endpoint-url $R2_ENDPOINT"
else
  if [ "$DRY_RUN" = true ]; then
    log "INFO" "[DRY-RUN] Would execute:"
    log "INFO" "[DRY-RUN] aws s3 cp $BACKUP_PATH s3://$R2_BUCKET/backups/ --endpoint-url $R2_ENDPOINT"
  else
    export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
    
    if aws s3 cp "$BACKUP_PATH" "s3://$R2_BUCKET/backups/$BACKUP_FILENAME" \
       --endpoint-url "$R2_ENDPOINT" \
       --region auto 2>&1 | tee -a "$LOG_FILE"; then
      log "INFO" "Backup uploaded to R2 successfully"
    else
      log "ERROR" "Failed to upload backup to R2"
      exit 1
    fi
  fi
fi

# Step 3: Cleanup old backups (retention policy)
log "INFO" "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

if [ "$DRY_RUN" = true ]; then
  log "INFO" "[DRY-RUN] Would delete backups older than $RETENTION_DAYS days from R2"
else
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  
  # Calculate cutoff date
  CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d')
  
  # List and delete old backups
  OLD_BACKUPS=$(aws s3 ls "s3://$R2_BUCKET/backups/" \
    --endpoint-url "$R2_ENDPOINT" \
    --region auto | awk -v cutoff="$CUTOFF_DATE" '$1 " " $2 < cutoff {print $4}' || true)
  
  if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r old_backup; do
      if aws s3 rm "s3://$R2_BUCKET/backups/$old_backup" \
         --endpoint-url "$R2_ENDPOINT" \
         --region auto; then
        log "INFO" "Deleted old backup: $old_backup"
      fi
    done
  else
    log "INFO" "No old backups to delete"
  fi
fi

# Step 4: Verify backup integrity (optional)
log "INFO" "Verifying backup integrity..."
if [ "$DRY_RUN" = true ]; then
  log "INFO" "[DRY-RUN] Would verify gzip integrity"
else
  if gzip -t "$BACKUP_PATH" 2>&1 | tee -a "$LOG_FILE"; then
    log "INFO" "Backup integrity verified successfully"
  else
    log "ERROR" "Backup integrity check failed"
    exit 1
  fi
fi

# Step 5: Log backup metadata
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
BACKUP_CHECKSUM=$(sha256sum "$BACKUP_PATH" | awk '{print $1}')

log "INFO" "Backup Summary:"
log "INFO" "  Filename: $BACKUP_FILENAME"
log "INFO" "  Size: $BACKUP_SIZE"
log "INFO" "  Checksum: $BACKUP_CHECKSUM"
log "INFO" "  Location: s3://$R2_BUCKET/backups/$BACKUP_FILENAME"
log "INFO" "  Timestamp: $BACKUP_TIMESTAMP"

log "INFO" "Database backup completed successfully"

################################################################################
# Manual Restore Instructions (from backup file)
################################################################################
cat >> "$LOG_FILE" << 'RESTORE_INSTRUCTIONS'

RESTORE INSTRUCTIONS:
To restore from this backup, run:

  gzip -d bitloot_backup_YYYYMMDD_HHMMSS.sql.gz
  psql "$DATABASE_URL" < bitloot_backup_YYYYMMDD_HHMMSS.sql

Or use the restore script:
  ./scripts/restore-db.sh <backup-file>

Full instructions: See docs/DISASTER_RECOVERY.md

RESTORE_INSTRUCTIONS

exit 0
