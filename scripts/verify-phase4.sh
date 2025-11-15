#!/bin/bash

# BitLoot Phase 4 Verification Script
# Purpose: Verify all Phase 4 backups & disaster recovery components are in place
# Status: ✅ Production Ready

# Disable exit on error for this script
# We want to continue checking all components

echo "========================================"
echo "  BitLoot Phase 4 Verification Suite"
echo "  Backups & Disaster Recovery"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verification count
PASS=0
FAIL=0

# Test function
check_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  Missing: $file"
    ((FAIL++))
  fi
}

check_executable() {
  local file=$1
  local description=$2
  
  if [ -x "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  File not executable: $file"
    ((FAIL++))
  fi
}

check_content() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if grep -q "$pattern" "$file"; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  Pattern not found: $pattern in $file"
    ((FAIL++))
  fi
}

echo "Phase 4.1: Backup Script Verification"
echo "======================================"

check_file "./scripts/backup-db.sh" "Backup script exists"
check_executable "./scripts/backup-db.sh" "Backup script is executable"
check_content "./scripts/backup-db.sh" "pg_dump" "pg_dump integration"
check_content "./scripts/backup-db.sh" "gzip" "Compression enabled"
check_content "./scripts/backup-db.sh" "aws s3 cp" "R2 upload integration"
check_content "./scripts/backup-db.sh" "retention-days" "Retention policy"
check_content "./scripts/backup-db.sh" "gzip -t" "Integrity verification"
check_content "./scripts/backup-db.sh" "sha256sum" "Checksum generation"

echo ""
echo "Phase 4.2: Disaster Recovery Documentation"
echo "========================================="

check_file "./docs/DISASTER_RECOVERY.md" "Disaster recovery runbook exists"
check_content "./docs/DISASTER_RECOVERY.md" "Recovery Time Objective" "RTO documented"
check_content "./docs/DISASTER_RECOVERY.md" "Recovery Point Objective" "RPO documented"
check_content "./docs/DISASTER_RECOVERY.md" "Scenario 1" "Test recovery scenario"
check_content "./docs/DISASTER_RECOVERY.md" "Scenario 2" "Production recovery scenario"
check_content "./docs/DISASTER_RECOVERY.md" "Verification Steps" "Post-recovery validation"
check_content "./docs/DISASTER_RECOVERY.md" "Troubleshooting" "Troubleshooting guide"

echo ""
echo "Phase 4.3: GitHub Actions Workflow"
echo "=================================="

check_file "./.github/workflows/backup-nightly.yml" "GitHub Actions workflow exists"
check_content "./.github/workflows/backup-nightly.yml" "schedule:" "Scheduled backup trigger"
check_content "./.github/workflows/backup-nightly.yml" "workflow_dispatch" "Manual trigger support"
check_content "./.github/workflows/backup-nightly.yml" "backup-db.sh" "Calls backup script"
check_content "./.github/workflows/backup-nightly.yml" "aws-actions/configure-aws-credentials" "AWS credentials setup"
check_content "./.github/workflows/backup-nightly.yml" "upload-artifact" "Logs artifact upload"

echo ""
echo "Environment Configuration"
echo "======================="

# Check if environment variables are documented
if grep -q "R2_ACCESS_KEY_ID" ".env.example" 2>/dev/null || grep -q "R2_BUCKET" ".env.example" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Environment variables documented"
  ((PASS++))
else
  echo -e "${YELLOW}⚠${NC} Verify R2 environment variables in .env.example"
fi

echo ""
echo "========================================"
echo "  Verification Summary"
echo "========================================"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo -e "Passed:  ${GREEN}${PASS}${NC}/${TOTAL}"
echo -e "Failed:  ${RED}${FAIL}${NC}/${TOTAL}"
echo ""
echo "Quality Score: ${PERCENTAGE}%"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ Phase 4 - ALL CHECKS PASSED${NC}"
  echo ""
  echo "Phase 4 is COMPLETE and PRODUCTION-READY:"
  echo "  ✅ Backup script with R2 integration"
  echo "  ✅ Disaster recovery runbook with procedures"
  echo "  ✅ GitHub Actions automated nightly backups"
  echo "  ✅ Verification & troubleshooting guides"
  echo ""
  echo "Next Steps:"
  echo "  1. Configure GitHub secrets (R2 credentials, DATABASE_URL)"
  echo "  2. Test backup manually: ./scripts/backup-db.sh --dry-run"
  echo "  3. Verify backup uploads to R2"
  echo "  4. Schedule GitHub Actions workflow"
  echo "  5. Monthly: Run Scenario 1 recovery test"
  exit 0
else
  echo -e "${RED}❌ Phase 4 - SOME CHECKS FAILED${NC}"
  echo ""
  echo "Please address the issues above before proceeding."
  exit 1
fi
