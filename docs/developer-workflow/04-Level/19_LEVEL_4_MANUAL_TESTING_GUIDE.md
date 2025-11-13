# 🧪 Level 4 Observability - Manual Testing Guide

**Purpose:** Step-by-step instructions to test and verify Level 4 metrics collection locally

**Status:** Ready for implementation  
**Date:** November 12, 2025

---

## 📋 Prerequisites

Before starting, ensure:
- ✅ API is running on `http://localhost:4000`
- ✅ Database is connected (PostgreSQL running)
- ✅ Redis is running
- ✅ `.env` has all Level 4 variables set

```bash
# Quick check
curl http://localhost:4000/healthz
# Expected response: {"ok":true,"timestamp":"..."}
```

---

## 🎯 Test Scenarios

### TEST 1: Health Check & API Readiness

**Objective:** Verify API is running and metrics module is loaded

**Steps:**

```bash
# 1. Check API health
curl http://localhost:4000/api/healthz

# Expected response:
# {"ok":true,"timestamp":"2025-11-12T10:00:00.000Z"}

# 2. Check for metrics module in startup logs
npm run dev:api 2>&1 | grep -i "metrics\|observability"

# Expected: MetricsModule loaded/registered
```

---

### TEST 2: OTP Metrics (otp_rate_limit_exceeded counter)

**Objective:** Trigger OTP rate limiting and verify metric counter increments

**Steps:**

```bash
# 1. Request OTP for email
TEST_EMAIL="test-$(date +%s)@example.com"
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}"

# Response: {"success":true,"message":"OTP sent","expiresIn":600}

# 2. Request OTP again (should succeed, but rate limit counter doesn't increment until limit reached)
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}"

# 3. Request OTP 3 more times in quick succession (should trigger rate limit)
for i in {1..3}; do
  curl -X POST http://localhost:4000/api/auth/otp/request \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}"
  sleep 0.5
done

# Expected on 4th+ request: {"error":"Too many requests"}
# This triggers: metrics.incrementOtpRateLimit('issue')

# 4. Check logs for metric increment
npm run dev:api 2>&1 | grep -i "otp_rate_limit"
```

---

### TEST 3: Email Metrics (email_send_success & email_send_failed)

**Objective:** Trigger email sending and verify counters

**Steps:**

```bash
# 1. Create an order (will trigger order confirmation email)
ORDER_RESPONSE=$(curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email":"customer@example.com",
    "items":[
      {"productId":"test-product-1","quantity":1}
    ]
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "Order created: $ORDER_ID"

# 2. Check Resend service logs for email metrics
# Look in console output for: "email_send_success: order_created" or "email_send_failed: order_created"

# 3. If email sending failed (e.g., invalid RESEND_API_KEY)
# The counter increments: metrics.incrementEmailSendFailed('payment_created')
```

---

### TEST 4: Access Metrics Endpoint

**Objective:** Fetch Prometheus metrics via admin-protected endpoint

**Prerequisites:**
- Need a valid JWT token with admin role

**Steps:**

```bash
# 1. Get admin JWT token (create admin user first if needed)
# Option A: Use existing admin credentials
ADMIN_TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitloot.io","password":"your_password"}' | jq -r '.accessToken')

# 2. Access /api/metrics endpoint
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics

# Expected output: Prometheus text format
# HELP invalid_hmac_count Total number of webhook...
# TYPE invalid_hmac_count counter
# invalid_hmac_count{provider="nowpayments"} 0

# 3. Verify all expected metrics are present
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics | grep -E "otp_rate_limit|email_send|invalid_hmac|underpaid"

# Expected: 5+ lines with metrics
```

---

### TEST 5: Webhook Metrics (invalid_hmac_count & duplicate_webhook_count)

**Objective:** Trigger webhook validation and verify counters

**Steps:**

```bash
# 1. Send webhook with invalid HMAC signature
curl -X POST http://localhost:4000/api/webhooks/nowpayments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: invalid_signature_here" \
  -d '{
    "payment_id":"test-payment-1",
    "order_id":"order-123",
    "status":"finished",
    "amount":"0.01",
    "amount_received":"0.009"
  }'

# Expected response: 401 Unauthorized
# This triggers: metrics.incrementInvalidHmac('nowpayments')

# 2. Check metrics for invalid_hmac_count increment
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics | grep invalid_hmac

# Expected: invalid_hmac_count{provider="nowpayments"} 1
```

---

### TEST 6: Verify Structured Logging

**Objective:** Confirm structured logs appear in JSON format

**Steps:**

```bash
# 1. Check that STRUCTURED_LOG_FORMAT is set
grep STRUCTURED_LOG_FORMAT .env

# Expected: STRUCTURED_LOG_FORMAT=json

# 2. Start API and trigger events
npm run dev:api

# 3. Make a request and watch console output
curl http://localhost:4000/api/healthz

# Expected console output (JSON format):
# {
#   "timestamp":"2025-11-12T10:00:00.000Z",
#   "level":"info",
#   "service":"HealthController",
#   "message":"Health check performed"
# }
```

---

### TEST 7: Email Headers Verification

**Objective:** Verify X-Priority and other Level 4 email headers

**Steps:**

```bash
# 1. Set up a mock email service to capture headers
# Option: Use curl with verbose mode to capture raw email response

# 2. Trigger OTP email
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 3. Check Resend API logs for email headers
# Expected headers in email:
# X-Priority: 1 (for transactional OTP)
# List-Unsubscribe: <...>
# Idempotency-Key: <uuid>

# 4. Verify headers in code (if using test SDK)
# Look for: generateEmailHeaders() call in emails.service.ts
```

---

### TEST 8: OTP Verification Counter

**Objective:** Trigger OTP verification failures and verify metrics

**Steps:**

```bash
# 1. Request OTP
TEST_EMAIL="test-otp-verify@example.com"
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}"

# 2. Try to verify with wrong code
curl -X POST http://localhost:4000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"code\":\"000000\"}"

# Expected: {"error":"Invalid OTP code"}
# This triggers: metrics.incrementOtpVerificationFailed('invalid_code')

# 3. Check metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics | grep otp_verification_failed

# Expected: otp_verification_failed{reason="invalid_code"} 1
```

---

### TEST 9: Payment Failure Metrics

**Objective:** Trigger payment failures and verify underpaid counter

**Steps:**

```bash
# 1. Create a payment with underpayment amount
curl -X POST http://localhost:4000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"order-underpay-123",
    "amount":"0.00000001",
    "asset":"btc"
  }'

# 2. Simulate IPN webhook with underpayment status
curl -X POST http://localhost:4000/api/webhooks/nowpayments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: valid_hmac_here" \
  -d '{
    "payment_id":"payment-underpay-123",
    "order_id":"order-underpay-123",
    "status":"underpaid",
    "amount":"0.01",
    "amount_received":"0.005"
  }'

# 3. Check metrics for underpaid_orders_total
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics | grep underpaid_orders_total

# Expected: underpaid_orders_total{asset="btc"} 1
```

---

## 📊 Metrics Verification Checklist

After running all tests, verify these metrics are present:

```bash
# Get all metrics
METRICS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/metrics)

# Check each counter
echo "Checking metrics..."

# 1. HMAC Verification
echo "$METRICS" | grep "invalid_hmac_count" && echo "✅ HMAC metrics present" || echo "❌ Missing"

# 2. OTP Metrics
echo "$METRICS" | grep "otp_rate_limit_exceeded" && echo "✅ OTP rate limit metrics present" || echo "❌ Missing"
echo "$METRICS" | grep "otp_verification_failed" && echo "✅ OTP verification metrics present" || echo "❌ Missing"

# 3. Email Metrics
echo "$METRICS" | grep "email_send_failed" && echo "✅ Email failure metrics present" || echo "❌ Missing"
echo "$METRICS" | grep "email_send_success" && echo "✅ Email success metrics present" || echo "❌ Missing"

# 4. Payment Metrics
echo "$METRICS" | grep "underpaid_orders_total" && echo "✅ Payment metrics present" || echo "❌ Missing"

# 5. Node.js Metrics
echo "$METRICS" | grep "nodejs_version_info" && echo "✅ Node.js metrics present" || echo "❌ Missing"
echo "$METRICS" | grep "process_cpu_seconds_total" && echo "✅ Process metrics present" || echo "❌ Missing"
```

---

## 🐛 Troubleshooting

### Issue: /metrics endpoint returns 401

**Cause:** Invalid or missing JWT token  
**Solution:**
```bash
# Get valid JWT from login
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitloot.io","password":"..."}' | jq -r '.accessToken')

# Try again
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/metrics
```

### Issue: Metrics show as 0 for all counters

**Cause:** Counters haven't been incremented yet  
**Solution:**
1. Run the test scenarios above to trigger events
2. Wait a few seconds for metrics to be recorded
3. Access /metrics endpoint again
4. Check console logs for metric increment calls

### Issue: No structured logs appearing

**Cause:** STRUCTURED_LOG_FORMAT not set or wrong value  
**Solution:**
```bash
# Check .env
grep STRUCTURED_LOG_FORMAT .env

# Should be:
# STRUCTURED_LOG_FORMAT=json

# Update if needed and restart API
echo "STRUCTURED_LOG_FORMAT=json" >> .env
npm run dev:api
```

---

## 📈 Expected Results Summary

| Test | Metric | Expected Value | Status |
|------|--------|-----------------|--------|
| **OTP Rate Limit** | `otp_rate_limit_exceeded{operation="issue"}` | 1+ | ⏳ Run test |
| **OTP Verify Fail** | `otp_verification_failed{reason="invalid_code"}` | 1+ | ⏳ Run test |
| **Invalid HMAC** | `invalid_hmac_count{provider="nowpayments"}` | 1+ | ⏳ Run test |
| **Email Failure** | `email_send_failed{type="otp"}` | 0+ | ⏳ Run test |
| **Email Success** | `email_send_success{type="otp"}` | 1+ | ⏳ Run test |
| **Underpaid** | `underpaid_orders_total{asset="btc"}` | 0+ | ⏳ Run test |
| **Node.js Metrics** | `nodejs_version_info` | Present | ✅ Always present |
| **Process Metrics** | `process_cpu_seconds_total` | Present | ✅ Always present |

---

## ✅ Sign-Off Checklist

- [ ] API is running on port 4000
- [ ] Health check passes
- [ ] OTP metrics tested
- [ ] Email metrics tested
- [ ] /metrics endpoint accessible with admin JWT
- [ ] All 6 custom counters visible in metrics output
- [ ] Node.js default metrics present
- [ ] Structured logging enabled
- [ ] Email headers verified
- [ ] All 8 test scenarios completed successfully

---

**Once ALL items above are checked, Level 4 Observability testing is COMPLETE!** ✅

Next steps:
1. Set up Prometheus (see Step 6 in implementation guide)
2. Configure Grafana dashboards (see Step 7)
3. Deploy to staging/production
