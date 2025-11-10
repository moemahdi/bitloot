# 🚀 Phase 5 E2E Testing — Quick Start

**Current Status:** Task 8 Testing Ready ✅

---

## ⚡ 60-Second Setup

### Terminal 1: API

```bash
npm run dev:api
```

### Terminal 2: Web

```bash
npm run dev:web
```

### Terminal 3: ngrok (if not running)

```bash
ngrok http 4000 --region=eu
```

### Terminal 4: Monitor Webhooks

```bash
open http://localhost:4040/inspect/http
```

---

## 🧪 5-Minute Test Flow

### 1. Create Order

```bash
ORDER_ID=$(curl -s -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productId":"demo"}' | jq -r '.id')

echo "Order: $ORDER_ID"
```

### 2. Create Payment

```bash
curl -X POST http://localhost:4000/payments/create \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"priceAmount\":\"1.00\",\"priceCurrency\":\"usd\",\"payCurrency\":\"btc\"}"
```

### 3. Send Webhook (with valid HMAC)

```bash
PAYLOAD='{"payment_id":"123456789","payment_status":"finished","price_amount":1.00,"price_currency":"usd","pay_amount":0.025,"pay_currency":"btc","order_id":"'$ORDER_ID'"}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "ipn_secret_xxxxx" -hex | cut -d' ' -f2)

curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"
```

### 4. Verify Order Updated

```bash
curl http://localhost:4000/orders/$ORDER_ID | jq '.status'
# Expected: "fulfilled"
```

### 5. Check Admin Dashboards

- Orders: http://localhost:3000/admin/orders
- Payments: http://localhost:3000/admin/payments
- Webhooks: http://localhost:3000/admin/webhooks

---

## 🎯 What You're Testing

✅ Order creation  
✅ Payment initiation  
✅ Webhook reception via ngrok  
✅ HMAC signature verification  
✅ Idempotency (duplicate webhooks)  
✅ Order state transitions  
✅ Key delivery & signed URLs  
✅ Admin dashboard functionality  
✅ Error handling (invalid signatures, underpayment)  
✅ Audit logging & compliance

---

## 📊 Success Criteria

After testing:

- [ ] Order status → `created` → `fulfilled`
- [ ] Payment status → `created` → `finished`
- [ ] Webhook logged with `processed=true`
- [ ] Item has `signedUrl` after webhook
- [ ] ngrok inspector shows requests
- [ ] Admin dashboards display data
- [ ] Success page loads with fulfilled order
- [ ] All error tests return expected status codes

---

## 🔗 Key URLs

| Purpose         | URL                                                   |
| --------------- | ----------------------------------------------------- |
| ngrok Tunnel    | https://homofermentative-lienal-pinkie.ngrok-free.dev |
| ngrok Inspector | http://localhost:4040                                 |
| API Health      | http://localhost:4000/healthz                         |
| Swagger Docs    | http://localhost:4000/api/docs                        |
| Admin Orders    | http://localhost:3000/admin/orders                    |
| Admin Payments  | http://localhost:3000/admin/payments                  |
| Admin Webhooks  | http://localhost:3000/admin/webhooks                  |

---

## 📝 Full Guide

**See:** `docs/developer-workflow/02-Level/TASK8_E2E_TESTING_GUIDE.md` (1000+ lines)

Contains:

- 4 complete test scenarios
- Error handling tests
- Troubleshooting section
- Complete checklist
- Expected outputs

---

## ⏭️ After Testing

1. **Pass:** → Task 9 (Quality Validation)

   ```bash
   npm run quality:full
   ```

2. **Fail:** → Check troubleshooting section in full guide

---

**Ready to test? Let's verify the full flow! 🚀**

# 🧪 Task 8 — End-to-End (E2E) Testing Guide

**Status:** ✅ **TASK 8 IN PROGRESS**  
**Date:** November 8, 2025  
**Scope:** Complete webhook flow testing (Order → Payment → Fulfillment → Delivery)  
**Duration:** 30-45 minutes for full manual test

---

## 🎯 Overview

This guide walks you through the **complete order-to-delivery workflow** with real NOWPayments webhooks forwarded through ngrok. You'll verify:

1. ✅ Order creation
2. ✅ Payment initiation
3. ✅ Webhook receipt via ngrok
4. ✅ Order status transitions
5. ✅ Key delivery & revelation
6. ✅ Error handling & retry logic

---

## ✅ Prerequisites (Verify Before Starting)

### 1. Services Running

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Web App
npm run dev:web

# Terminal 3: ngrok Tunnel (should already be running)
ngrok http 4000 --region=eu
```

**Expected Output:**

- ✅ API on `http://localhost:4000` ✓
- ✅ Web on `http://localhost:3000` ✓
- ✅ ngrok tunnel showing `https://homofermentative-lienal-pinkie.ngrok-free.dev` (or your URL) ✓

### 2. Database Ready

```bash
# Start docker services
docker compose up -d

# Verify postgres & redis running
docker compose ps
```

**Expected:**

```
NAMES           STATUS
bitloot-db      healthy
bitloot-redis   healthy
```

### 3. Environment Configured

**Verify `.env` has these values:**

```properties
WEBHOOK_BASE_URL=https://homofermentative-lienal-pinkie.ngrok-free.dev
NOWPAYMENTS_IPN_SECRET=ipn_secret_xxxxx
NOWPAYMENTS_API_KEY=sk_test_xxxxx
```

**Note:** Replace with your actual NOWPayments sandbox credentials if available.

### 4. ngrok Inspector Available

- Open: http://localhost:4040
- This shows all webhook requests received via ngrok
- **Keep this tab open during testing**

---

## 🧪 Test Scenario 1: Basic Order → Payment Flow

### Step 1: Create Order via API

**Using curl:**

```bash
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "productId": "demo-product"
  }'
```

**Expected Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "status": "created",
  "total": "1.00",
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "productId": "demo-product",
      "signedUrl": null
    }
  ],
  "createdAt": "2025-11-08T15:30:00.000Z",
  "updatedAt": "2025-11-08T15:30:00.000Z"
}
```

**Save:** `ORDER_ID` and `ITEM_ID` for next steps

### Step 2: Verify Order in Admin Dashboard

**URL:** http://localhost:3000/admin/orders

**Verify:**

- ✅ Order appears in list
- ✅ Status shows as `created`
- ✅ Email shows `test@example.com`
- ✅ Total shows `1.00`

### Step 3: Create Payment

**Using curl:**

```bash
curl -X POST http://localhost:4000/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "priceAmount": "1.00",
    "priceCurrency": "usd",
    "payCurrency": "btc"
  }'
```

**Expected Response:**

```json
{
  "invoiceId": 123456789,
  "invoiceUrl": "https://nowpayments.io/invoice/?iid=123456789",
  "statusUrl": "https://nowpayments.io/status/?iid=123456789",
  "payAddress": "1A1z7agoat2ywQAWVgqbr2Wmj4outiB98V",
  "priceAmount": "1.00",
  "payAmount": "0.025",
  "payCurrency": "btc",
  "status": "created",
  "expirationDate": "2025-11-08T16:30:00.000Z"
}
```

**Save:** `invoiceId` and `payAddress`

### Step 4: Check Admin Payments Dashboard

**URL:** http://localhost:3000/admin/payments

**Verify:**

- ✅ Payment appears with status `created`
- ✅ External ID matches NOWPayments invoiceId
- ✅ Price amount shows `1.00 USD`
- ✅ Pay currency shows `btc`

---

## 🔔 Test Scenario 2: Webhook Reception & Processing

### Step 5: Simulate Payment Confirmation

**Using curl to POST IPN webhook:**

```bash
# First, generate HMAC signature
# Payload (copy this exactly):
PAYLOAD='{"payment_id":"123456789","payment_status":"finished","price_amount":1.00,"price_currency":"usd","pay_amount":0.025,"pay_currency":"btc","order_id":"550e8400-e29b-41d4-a716-446655440000"}'

# Generate signature (requires openssl):
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "ipn_secret_xxxxx" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected Response:**

```json
{
  "ok": true
}
```

**Status Code:** 200 OK

### Step 6: Monitor Webhook via ngrok Inspector

**URL:** http://localhost:4040

**You should see:**

- POST request to `/payments/ipn`
- Status: 200
- Headers include: `X-NOWPAYMENTS-SIGNATURE`
- Request body matches your payload

**Navigate** → Click request → **Inspect request/response**

### Step 7: Verify Order Status Updated

**Using curl:**

```bash
curl http://localhost:4000/orders/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "status": "fulfilled",  ← Changed from "created" to "fulfilled"!
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "productId": "demo-product",
      "signedUrl": "https://r2-mock.example.com/orders/550e8400-.../keys.json?token=...&expires=..."
    }
  ]
}
```

**Verify:**

- ✅ Status changed to `fulfilled`
- ✅ Item has `signedUrl` (no longer null)
- ✅ signedUrl includes expiry timestamp

### Step 8: Check Admin Webhooks Log

**URL:** http://localhost:3000/admin/webhooks

**Verify:**

- ✅ Webhook appears in list
- ✅ External ID: `123456789`
- ✅ Provider: `nowpayments_ipn`
- ✅ Status: `processed`
- ✅ Timestamp shows recent
- ✅ Source IP displays (ngrok IP)

### Step 9: Verify Webhook Log Entry

**Using curl:**

```bash
# Query webhook logs (if admin endpoint available)
curl http://localhost:4000/admin/webhooks?limit=10
```

**Or check database directly:**

```bash
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT * FROM webhook_logs ORDER BY createdAt DESC LIMIT 1;"
```

**Expected fields:**

- ✅ externalId: `123456789`
- ✅ webhookType: `nowpayments_ipn`
- ✅ status: `processed`
- ✅ signatureValid: `true`
- ✅ processed: `true`
- ✅ paymentStatus: `finished`

---

## 🔑 Test Scenario 3: Key Revelation & Delivery

### Step 10: Access Success Page

**URL:** http://localhost:3000/orders/550e8400-e29b-41d4-a716-446655440000/success

**Verify:**

- ✅ Page loads without 404
- ✅ "Payment Successful! 🎉" heading visible
- ✅ Order ID displayed (truncated)
- ✅ Email: `test@example.com`
- ✅ Status: **FULFILLED** (in green)
- ✅ "Your link will expire in 15 minutes" message
- ✅ **"Reveal Key" button** visible and clickable

### Step 11: Reveal Key

**Action:** Click "Reveal Key" button

**Expected Behavior:**

- ✅ Button shows loading state
- ✅ Opens mock signed URL in new tab
- ✅ URL format: `https://r2-mock.example.com/...?token=...&expires=...`
- ✅ JSON file contains mock key data

### Step 12: Check Delivery Audit Trail

**Using curl (if endpoint available):**

```bash
curl http://localhost:4000/admin/deliveries?orderId=550e8400-e29b-41d4-a716-446655440000
```

**Expected fields:**

- ✅ orderId
- ✅ revealedAt: recent timestamp
- ✅ ipAddress: user's IP
- ✅ userAgent: browser info
- ✅ expiresAt: 15 minutes from now

---

## ❌ Test Scenario 4: Error Handling

### Test 4.1: Duplicate Webhook (Idempotency)

**Send the same webhook twice:**

```bash
PAYLOAD='{"payment_id":"123456789",...}'
SIGNATURE=$(...)

# First request
curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"

# Second request (identical)
curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected:**

- ✅ Both return 200 OK
- ✅ Order status does NOT change to "fulfilled" twice
- ✅ Webhook log shows second as `duplicate` or `already_processed`
- ✅ No duplicate email sent

### Test 4.2: Invalid Signature

```bash
PAYLOAD='{"payment_id":"123456789",...}'
INVALID_SIG="invalid_signature_0000000000000000"

curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $INVALID_SIG" \
  -d "$PAYLOAD"
```

**Expected:**

- ✅ Returns 401 Unauthorized
- ✅ Response: `{"error":"Invalid HMAC signature"}`
- ✅ Order status does NOT change
- ✅ Webhook NOT logged as processed

### Test 4.3: Underpayment

```bash
PAYLOAD='{
  "payment_id":"999999999",
  "payment_status":"underpaid",
  "price_amount":1.00,
  "pay_amount":0.010,
  "price_currency":"usd",
  "pay_currency":"btc",
  "order_id":"550e8400-e29b-41d4-a716-446655440000"
}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "ipn_secret_xxxxx" -hex | cut -d' ' -f2)

curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected:**

- ✅ Returns 200 OK
- ✅ Order status changes to `underpaid`
- ✅ Item signedUrl remains null (no key delivered)
- ✅ Admin display shows "Non-refundable" warning
- ✅ Customer email indicates payment insufficient

### Test 4.4: Payment Failed

```bash
PAYLOAD='{
  "payment_id":"888888888",
  "payment_status":"failed",
  "order_id":"550e8400-e29b-41d4-a716-446655440000"
}'

SIGNATURE=$(...)

curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Expected:**

- ✅ Returns 200 OK
- ✅ Order status changes to `failed`
- ✅ Item signedUrl remains null
- ✅ Customer notified of payment failure
- ✅ Can create new order/payment

---

## 📊 Admin Dashboard Verification

### Orders Page (`/admin/orders`)

**Verify all orders created during testing:**

| Order ID  | Email            | Status                     | Total | Action |
| --------- | ---------------- | -------------------------- | ----- | ------ |
| 550e84... | test@example.com | fulfilled                  | 1.00  | View   |
| (others)  | ...              | created\|failed\|underpaid | ...   | ...    |

**Filters should work:**

- ✅ Status filter (created, fulfilled, failed, underpaid)
- ✅ Date range filter
- ✅ Search by email
- ✅ Pagination (if 50+ orders)

### Payments Page (`/admin/payments`)

**Verify payment records:**

| Invoice ID | Order     | Status          | Amount | Currency  | Action |
| ---------- | --------- | --------------- | ------ | --------- | ------ |
| 123456789  | 550e84... | finished        | 1.00   | USD → BTC | View   |
| (others)   | ...       | created\|failed | ...    | ...       | ...    |

**Verify:**

- ✅ Status matches order status
- ✅ Payment data displays correctly
- ✅ View button shows full payment details

### Webhooks Page (`/admin/webhooks`)

**Verify webhook history:**

| External ID | Provider        | Status            | IP      | Timestamp | Action  |
| ----------- | --------------- | ----------------- | ------- | --------- | ------- |
| 123456789   | nowpayments_ipn | processed         | 1.2.3.4 | 15:30:45  | Inspect |
| (others)    | ...             | processed\|failed | ...     | ...       | ...     |

**Features:**

- ✅ Raw webhook payload visible
- ✅ Signature verification result shown
- ✅ Processing result/error displayed
- ✅ Retry/replay button available

---

## 🚨 Troubleshooting

### Issue: Webhook not received (404 on ngrok inspector)

**Diagnosis:**

1. Check ngrok tunnel is running: `ngrok http 4000 --region=eu`
2. Check `.env` WEBHOOK_BASE_URL matches ngrok public URL
3. Verify tunnel URL is accessible: `curl https://[your-ngrok-url]/healthz`

**Fix:**

```bash
# Restart ngrok
ngrok http 4000 --region=eu

# Update .env with new URL (if it changed)
# Restart API server
npm run dev:api
```

### Issue: Signature verification fails (401)

**Diagnosis:**

1. Check HMAC secret: `echo $NOWPAYMENTS_IPN_SECRET`
2. Verify exact payload format (no extra spaces)
3. Check signature generation command

**Fix:**

```bash
# Verify secret is set correctly
grep NOWPAYMENTS_IPN_SECRET .env

# Test signature generation
PAYLOAD='{"test":"data"}'
echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "your_secret" -hex
```

### Issue: Order status not updating

**Diagnosis:**

1. Check webhook was received: look at ngrok inspector
2. Check signature valid: should show 200 OK (not 401)
3. Check database: `docker compose exec db psql -U bitloot -d bitloot -c "SELECT * FROM orders WHERE id='[ORDER_ID]'"`

**Fix:**

```bash
# View API logs for errors
npm run dev:api  # Look for error messages

# Check webhook_logs for processing errors
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT * FROM webhook_logs WHERE externalId='123456789';"
```

### Issue: Duplicate webhook processed twice

**Diagnosis:**

- Check webhook_logs for duplicate entries with same externalId
- Verify unique constraint exists on (externalId, webhookType)

**Fix:**

```bash
# Run migrations (should create unique constraint)
npm --workspace apps/api run build
npx typeorm migration:run -d apps/api/dist/database/data-source.js
```

---

## 📋 Complete Test Checklist

**Use this checklist to verify all functionality:**

### Phase 1: Setup Verification (5 min)

- [ ] API running on http://localhost:4000
- [ ] Web running on http://localhost:3000
- [ ] ngrok tunnel active with public URL
- [ ] ngrok Inspector available at http://localhost:4040
- [ ] Database services healthy (postgres, redis)
- [ ] `.env` configured with WEBHOOK_BASE_URL

### Phase 2: Order Creation (5 min)

- [ ] Create order via API (POST /orders)
- [ ] Verify order created in database
- [ ] Order appears in admin/orders dashboard
- [ ] Order status shows as `created`
- [ ] Item has null signedUrl

### Phase 3: Payment & Webhooks (10 min)

- [ ] Create payment via API (POST /payments/create)
- [ ] Payment appears in admin/payments dashboard
- [ ] Send webhook via curl with valid HMAC
- [ ] Webhook appears in ngrok inspector
- [ ] Webhook logged in admin/webhooks page
- [ ] Order status changed to `fulfilled`
- [ ] Item now has signedUrl

### Phase 4: Delivery & Key Reveal (5 min)

- [ ] Success page loads without error
- [ ] Page shows "FULFILLED" status
- [ ] "Reveal Key" button present and clickable
- [ ] Click button opens signed URL
- [ ] Delivery logged with IP/User-Agent
- [ ] Audit trail visible in admin dashboard

### Phase 5: Error Handling (10 min)

- [ ] Duplicate webhook returns 200 OK (idempotent)
- [ ] Invalid signature returns 401
- [ ] Underpayment processed and marked non-refundable
- [ ] Failed payment processed and marked failed
- [ ] All errors logged appropriately

### Phase 6: Admin Dashboards (5 min)

- [ ] Orders page displays all test orders
- [ ] Payments page shows payment records
- [ ] Webhooks page shows webhook history
- [ ] Filters and search work correctly
- [ ] Details/inspect buttons functional

---

## 📊 Expected Test Results Summary

After completing all scenarios, you should have:

✅ **1 Order** → fulfilled status with signed URL  
✅ **1 Payment** → finished status  
✅ **2+ Webhooks** → (1 initial + 1 duplicate for idempotency test)  
✅ **1 Delivery Log** → showing key revelation  
✅ **3 Error Tests** → all handled correctly  
✅ **Admin Dashboards** → all data visible and searchable

---

## 🎯 Next Steps After Testing

1. **If all tests pass:** Proceed to Task 9 (Quality Validation)
   - Run `npm run quality:full`
   - Verify all tests passing
   - Confirm zero errors

2. **If tests fail:** Consult troubleshooting section or:
   - Check API logs: `npm run dev:api` console output
   - Check database: `docker compose exec db psql -U bitloot -d bitloot -c "SELECT * FROM webhook_logs"`
   - Check ngrok: http://localhost:4040/inspect/http
   - Review error messages carefully

3. **After Phase 5 Complete:**
   - Merge to `main` branch
   - Tag release: `git tag v2.5.0`
   - Proceed to Phase 6 (Admin Dashboard & Reporting)

---

## 🔗 Useful Commands Reference

### View Real-Time Logs

```bash
# API logs
npm run dev:api 2>&1 | grep -E "IPN|webhook|payment"

# Database query
docker compose exec db psql -U bitloot -d bitloot
```

### Reset Test State

```bash
# Delete all test orders
docker compose exec db psql -U bitloot -d bitloot -c \
  "DELETE FROM order_items; DELETE FROM orders WHERE email LIKE '%@example.com';"

# Delete webhook logs
docker compose exec db psql -U bitloot -d bitloot -c \
  "DELETE FROM webhook_logs;"
```

### Monitor ngrok Tunnel

```bash
# View all requests in real-time (terminal)
curl http://localhost:4040/api/requests/http

# View specific webhook request
curl http://localhost:4040/api/requests/http/[REQUEST_ID]
```

---

**Status: ✅ READY FOR TESTING**

**Time to Complete:** 30-45 minutes for full manual test  
**Next Task:** Task 9 — Phase 5 Quality Validation

**Good luck! 🚀**
