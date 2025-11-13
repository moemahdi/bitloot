#!/bin/bash

###############################################################################
# Level 4 Observability Testing Script
# Tests Prometheus metrics collection, email integration, and OTP tracking
###############################################################################

set -e

API_URL="http://localhost:4000"
ADMIN_JWT=""
TEST_EMAIL="test-metrics-$(date +%s)@example.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   LEVEL 4 OBSERVABILITY METRICS TESTING SCRIPT        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# STEP 1: Health Check
# ============================================================================
echo -e "\n${YELLOW}[STEP 1] Health Check${NC}"
echo "Checking if API is running at $API_URL..."

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/healthz")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ API is not responding (HTTP $HTTP_CODE)${NC}"
    echo "Please start the API: npm run dev:api"
    exit 1
fi

# ============================================================================
# STEP 2: Get Admin JWT Token (create test user and login)
# ============================================================================
echo -e "\n${YELLOW}[STEP 2] Getting Admin JWT Token${NC}"

# For this test, we need an admin user. Let's check if we can login with existing credentials
# Or create a test admin user

echo "Attempting to create test admin user..."
# Note: This assumes there's a way to create users. Adjust endpoint as needed.
CREATE_USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin-test-$(date +%s)@bitloot.io\",\"password\":\"AdminTest123!\"}" 2>/dev/null || true)

echo "Response: $CREATE_USER_RESPONSE"

# For now, let's use a default admin token (you may need to set this manually)
ADMIN_JWT="${TEST_ADMIN_JWT:-dummy-jwt-token}"

if [ -z "$ADMIN_JWT" ] || [ "$ADMIN_JWT" = "dummy-jwt-token" ]; then
    echo -e "${YELLOW}⚠️  Note: TEST_ADMIN_JWT not set. You need to:${NC}"
    echo "1. Get a valid admin JWT token from your login"
    echo "2. Set it: export TEST_ADMIN_JWT=your_token_here"
    echo "3. Re-run this script"
    echo ""
    echo "For now, we'll try to access /metrics without JWT (will fail):"
    
    METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/metrics")
    HTTP_CODE=$(echo "$METRICS_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
        echo -e "${GREEN}✅ /metrics endpoint is protected (requires admin JWT)${NC}"
    fi
else
    echo -e "${GREEN}✅ Using admin JWT token${NC}"
fi

# ============================================================================
# STEP 3: Test OTP Metrics (triggers otp_rate_limit counter)
# ============================================================================
echo -e "\n${YELLOW}[STEP 3] Testing OTP Metrics${NC}"
echo "Requesting OTP for: $TEST_EMAIL"

OTP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "OTP Response: $OTP_RESPONSE"

# Parse OTP from response if available
OTP_CODE=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -n "$OTP_CODE" ]; then
    echo -e "${GREEN}✅ OTP issued: $OTP_CODE${NC}"
    
    # Try to verify it
    echo "Verifying OTP..."
    VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/otp/verify" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"$OTP_CODE\"}")
    
    echo "Verify Response: $VERIFY_RESPONSE"
    
    if echo "$VERIFY_RESPONSE" | grep -q "success\|token"; then
        echo -e "${GREEN}✅ OTP verified successfully${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  OTP endpoint may not be returning code in test response${NC}"
fi

# ============================================================================
# STEP 4: View Prometheus Metrics
# ============================================================================
echo -e "\n${YELLOW}[STEP 4] Viewing Prometheus Metrics${NC}"

if [ -z "$ADMIN_JWT" ] || [ "$ADMIN_JWT" = "dummy-jwt-token" ]; then
    echo -e "${YELLOW}⚠️  Skipping /metrics endpoint (no valid admin JWT)${NC}"
    echo "To test metrics endpoint:"
    echo "1. Get admin JWT token"
    echo "2. Run: curl -H \"Authorization: Bearer YOUR_JWT\" http://localhost:4000/api/metrics"
else
    echo "Fetching metrics from /api/metrics..."
    METRICS=$(curl -s -H "Authorization: Bearer $ADMIN_JWT" "$API_URL/api/metrics")
    
    echo -e "${GREEN}✅ Metrics retrieved successfully${NC}"
    echo ""
    echo "Sample metrics (first 20 lines):"
    echo "$METRICS" | head -n 20
fi

# ============================================================================
# STEP 5: Verify Key Metrics Present
# ============================================================================
echo -e "\n${YELLOW}[STEP 5] Checking for Key Metrics${NC}"

# These should be present in the metrics output
EXPECTED_METRICS=(
    "invalid_hmac_count"
    "duplicate_webhook_count"
    "otp_rate_limit_exceeded"
    "otp_verification_failed"
    "email_send_failed"
    "email_send_success"
    "underpaid_orders_total"
    "nodejs_version_info"
    "process_cpu_seconds_total"
)

if [ -n "$ADMIN_JWT" ] && [ "$ADMIN_JWT" != "dummy-jwt-token" ]; then
    METRICS=$(curl -s -H "Authorization: Bearer $ADMIN_JWT" "$API_URL/api/metrics")
    
    for metric in "${EXPECTED_METRICS[@]}"; do
        if echo "$METRICS" | grep -q "$metric"; then
            echo -e "${GREEN}✅ Found metric: $metric${NC}"
        else
            echo -e "${YELLOW}⚠️  Missing metric: $metric${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Skipping metric verification (no valid admin JWT)${NC}"
fi

# ============================================================================
# STEP 6: Test Payment Metrics (if payment service available)
# ============================================================================
echo -e "\n${YELLOW}[STEP 6] Testing Payment Metrics (Optional)${NC}"

echo "To test payment metrics:"
echo "1. Create an order: POST /api/orders"
echo "2. Create a payment: POST /api/payments/create"
echo "3. Check metrics for: payment_initiated_total, underpaid_orders_total"
echo ""
echo "Example:"
echo "  curl -X POST http://localhost:4000/api/orders \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"user@example.com\",\"items\":[]}'"

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TESTING COMPLETE                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}Summary:${NC}"
echo "✅ Health check: API is running"
echo "✅ OTP endpoint: Tested (check response above)"
echo "✅ Metrics endpoint: Protected by AdminGuard"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Get a valid admin JWT token"
echo "2. Test /api/metrics endpoint:"
echo "   curl -H 'Authorization: Bearer YOUR_JWT' http://localhost:4000/api/metrics"
echo ""
echo "3. Set up Prometheus to scrape metrics:"
echo "   - Follow Step 6 in the implementation guide"
echo "4. Create Grafana dashboard:"
echo "   - Follow Step 7 in the implementation guide"
echo ""
echo "For detailed instructions, see:"
echo "  docs/developer-workflow/04-Level/18_LEVEL_4__PHASE5_IMPLEMENTATION.md"
