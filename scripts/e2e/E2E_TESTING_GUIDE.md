# 🧪 Level 3 E2E Testing Guide — Complete Reference

**Status:** ✅ **REFERENCE GUIDE FOR FULL IMPLEMENTATION**  
**Date:** November 10, 2025  
**Scope:** End-to-end testing from order creation through fulfillment completion  
**Complexity:** High (async coordination, webhooks, storage)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Flow](#architecture-flow)
3. [Test Prerequisites](#test-prerequisites)
4. [Happy Path E2E Test](#happy-path-e2e-test)
5. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
6. [Admin Dashboard Testing](#admin-dashboard-testing)
7. [Security & Idempotency Testing](#security--idempotency-testing)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Environment Setup

```bash
# 1. Start all services
docker-compose up -d postgres redis

# 2. Ensure API is running
npm run dev:api
# Expected output: "Listening on port 4000"

# 3. Ensure Web is running (new terminal)
npm run dev:web
# Expected output: "ready - started server on 0.0.0.0:3000"
```

### Configuration Checklist

Create `.env.api` in `apps/api/` with these variables (or add to existing `.env`):

```env
# NOWPayments (Level 2)
NOWPAYMENTS_API_KEY=your_sandbox_key
NOWPAYMENTS_IPN_SECRET=your_sandbox_secret
NOWPAYMENTS_BASE=https://api-sandbox.nowpayments.io

# Kinguin (Level 3)
KINGUIN_API_KEY=your_sandbox_api_key
KINGUIN_BASE_URL=https://sandbox.kinguin.net/api/v1
KINGUIN_WEBHOOK_SECRET=your_webhook_secret

# Cloudflare R2
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_BUCKET=bitloot-keys

# Database & Cache
DATABASE_URL=postgresql://user:password@localhost:5432/bitloot
REDIS_URL=redis://localhost:6379

# General
JWT_SECRET=your-jwt-secret-min-32-chars
NODE_ENV=development
API_BASE_URL=http://localhost:4000
```

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 3 E2E FLOW (Complete Order → Fulfillment → Delivery)     │
└─────────────────────────────────────────────────────────────────┘

1️⃣  FRONTEND: User starts checkout
    └─→ POST /orders (create order)
    └─→ POST /payments/create (create payment invoice)
    └─→ Navigate to NOWPayments to pay

2️⃣  PAYMENT: User pays in crypto (NOWPayments)
    └─→ Payment confirmed on blockchain
    └─→ NOWPayments sends webhook: POST /payments/ipn

3️⃣  BACKEND: Payment received
    └─→ PaymentsService.handleIpn() validates HMAC (Phase 2 ✅)
    └─→ Order status: created → paid
    └─→ ⚡ Enqueue fulfillment job: `reserve` (Level 3 starts here)

4️⃣  FULFILLMENT JOB: Process reservation
    └─→ FulfillmentProcessor picks up `reserve` job from BullMQ
    └─→ FulfillmentService.startReservation(orderId)
    └─→ Call Kinguin API: POST /orders (reserve inventory)
    └─→ Save reservation ID to order.kinguinReservationId

5️⃣  KINGUIN: Prepare order for delivery
    └─→ Kinguin processes reservation
    └─→ When ready: Kinguin sends webhook: POST /kinguin/webhooks
    └─→ Webhook payload: { reservationId, status: 'ready', key: '...' }

6️⃣  BACKEND: Kinguin webhook received
    └─→ KinguinController validates HMAC (X-KINGUIN-SIGNATURE)
    └─→ WebhookLog entry created (idempotency)
    └─→ ⚡ Enqueue job: `kinguin.webhook` with payload

7️⃣  FULFILLMENT JOB: Finalize delivery
    └─→ FulfillmentProcessor picks up `kinguin.webhook` job
    └─→ Check webhook payload status: `ready` or `delivered`
    └─→ FulfillmentService.finalizeDelivery(reservationId)
    └─→ 🔐 Encrypt key with AES-256-GCM
    └─→ 📤 Upload encrypted key to Cloudflare R2
    └─→ 🔗 Generate signed URL (15-min expiry)
    └─→ Update order items with storageRef
    └─→ 📧 Email customer with download link
    └─→ Mark order.status = 'fulfilled'

8️⃣  FRONTEND: Success page
    └─→ Customer sees "Order Fulfilled" status
    └─→ "Reveal Download Link" button available
    └─→ Customer downloads keys from signed URL

✅ END-TO-END FLOW COMPLETE
```

---

## 🔍 Test Prerequisites

### Services Running

```bash
# Terminal 1: Database & Cache
docker-compose up -d postgres redis

# Verify services
docker ps
# Expected: postgres and redis containers running

# Terminal 2: NestJS API
cd apps/api
npm run dev

# Expected output:
# [NestFactory] Starting Nest application...
# [InstanceLoader] DatabaseModule dependencies initialized
# [InstanceLoader] TypeOrmModule dependencies initialized
# [NestApplication] Nest application successfully started
# [NestApplication] Listening on port 4000
```

### API Verification

```bash
# Check API health
curl http://localhost:4000/healthz

# Expected response:
# {"ok":true,"timestamp":"2025-11-10T12:34:56Z"}
```

### Database Verification

```bash
# Connect to PostgreSQL
psql postgresql://user:password@localhost:5432/bitloot

# Run migrations (if not auto-run)
npm run migration:run

# Verify tables exist
\dt

# Expected tables:
# - orders
# - order_items
# - payments
# - webhook_logs
# - keys (new in Level 3)
```

### Kinguin Sandbox Setup

1. **Get Sandbox Credentials:**
   - Email: api@kinguin.net
   - Request: Sandbox merchant account activation
   - Receive: API Key + Webhook Secret

2. **Generate Bearer Token:**
   ```bash
   curl -X POST https://sandbox.kinguin.net/api/v1/auth/token \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": "your_client_id",
       "clientSecret": "your_client_secret"
     }'
   
   # Response:
   # {"accessToken": "eyJ0eX...", "expiresIn": 3600}
   ```

3. **Create Test Product:**
   ```bash
   curl -X POST https://sandbox.kinguin.net/api/v1/products \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Game Key",
       "type": "game_key",
       "region": "global"
     }'
   ```

---

## 🎯 Happy Path E2E Test

### Test Case 1: Complete Order → Payment → Fulfillment Flow

**Objective:** Verify complete end-to-end flow from order creation to key delivery

**Duration:** ~5-10 minutes

#### Step 1: Create Order

```bash
# Frontend action: Click "Checkout" on product page
# OR use curl to simulate:

curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 1
      }
    ]
  }'

# Expected response:
# {
#   "id": "order-123",
#   "status": "pending",
#   "email": "test@example.com",
#   "items": [...],
#   "totalCrypto": "0.00000000",
#   "createdAt": "2025-11-10T12:00:00Z"
# }

export ORDER_ID="order-123"
```

#### Step 2: Create Payment

```bash
curl -X POST http://localhost:4000/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "priceAmount": "10.00",
    "priceCurrency": "EUR",
    "payCurrency": "BTC"
  }'

# Expected response:
# {
#   "invoiceId": "np-456",
#   "invoiceUrl": "https://nowpayments.io/payment/?iid=np-456",
#   "payAddress": "1A1z7agoat8Bt51ZVD7sQ89YJtqKzkoxQQ",
#   "status": "created",
#   "expirationDate": "2025-11-10T12:30:00Z"
# }

export INVOICE_ID="np-456"
```

**Frontend Action:** Customer clicks the `invoiceUrl` and completes payment in NOWPayments.

#### Step 3: Simulate NOWPayments IPN Webhook

Once payment is complete in NOWPayments sandbox, they'll send a webhook. To simulate locally:

```bash
# Generate HMAC signature (use Node.js or your preferred tool)
# Raw body:
# {"payment_id":"np-456","payment_status":"finished","order_id":"order-123","..."}

# Calculate HMAC-SHA512 with your NOWPAYMENTS_IPN_SECRET
# For testing, use this helper:

node -e "
const crypto = require('crypto');
const rawBody = JSON.stringify({
  payment_id: 'np-456',
  payment_status: 'finished',
  order_id: '$ORDER_ID'
});
const secret = process.env.NOWPAYMENTS_IPN_SECRET;
const hmac = crypto.createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');
console.log('HMAC:', hmac);
"
```

Post the webhook:

```bash
export HMAC_SIGNATURE="your_calculated_hmac"
export RAW_BODY='{\"payment_id\":\"np-456\",\"payment_status\":\"finished\",\"order_id\":\"'$ORDER_ID'\"}'

curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: $HMAC_SIGNATURE" \
  -d "$RAW_BODY"

# Expected response:
# {"ok": true}
```

**Backend Action:** PaymentsService receives IPN, validates HMAC, enqueues `reserve` job

#### Step 4: Verify Order Status (Payment Received)

```bash
curl -X GET http://localhost:4000/orders/$ORDER_ID

# Expected response:
# {
#   "id": "order-123",
#   "status": "paid",
#   "kinguinReservationId": null,  # Will be filled after reservation
#   ...
# }
```

**Check:** Order status changed from `pending` → `paid` ✅

#### Step 5: Monitor Fulfillment Job

```bash
# Check Redis queue
redis-cli

# In redis-cli:
LRANGE fulfillment 0 -1
# Should see the `reserve` job

# Check BullMQ Dashboard (if available):
# http://localhost:3000/admin/queue (if Bull Board is set up)
```

**Wait:** BullMQ processor picks up the job (~1-5 seconds)

#### Step 6: Verify Reservation Created

```bash
# After FulfillmentProcessor processes the job:

curl -X GET http://localhost:4000/orders/$ORDER_ID

# Expected response:
# {
#   "id": "order-123",
#   "status": "paid",
#   "kinguinReservationId": "kinguin-res-789",  # ✅ Now populated
#   ...
# }

export RESERVATION_ID="kinguin-res-789"
```

**Check:** Order now has `kinguinReservationId` ✅

#### Step 7: Simulate Kinguin Webhook (Ready)

Kinguin will send a webhook when the reservation is ready. Simulate it:

```bash
# Calculate HMAC for Kinguin webhook
node -e "
const crypto = require('crypto');
const rawBody = JSON.stringify({
  reservationId: '$RESERVATION_ID',
  status: 'ready',
  key: 'ABC-DEF-GHI-JKL'
});
const secret = process.env.KINGUIN_WEBHOOK_SECRET;
const hmac = crypto.createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');
console.log('HMAC:', hmac);
"

export KINGUIN_HMAC="your_calculated_hmac"

curl -X POST http://localhost:4000/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL"
  }'

# Expected response:
# {"ok": true}
```

**Backend Action:** KinguinController receives webhook, validates HMAC, enqueues `kinguin.webhook` job

#### Step 8: Monitor Fulfillment Finalization Job

```bash
# Check Redis queue again
redis-cli LRANGE fulfillment 0 -1
# Should see the `kinguin.webhook` job

# Wait for processor to handle it (~1-5 seconds)
```

#### Step 9: Verify Order Fulfilled

```bash
curl -X GET http://localhost:4000/orders/$ORDER_ID

# Expected response:
# {
#   "id": "order-123",
#   "status": "fulfilled",  # ✅ Changed to fulfilled
#   "kinguinReservationId": "kinguin-res-789",
#   "items": [
#     {
#       "id": "item-456",
#       "productId": "...",
#       "quantity": 1,
#       "storageRef": "orders/order-123/item-456/key.bin",  # ✅ Key stored in R2
#       "deliveredAt": "2025-11-10T12:05:00Z"
#     }
#   ]
# }
```

**Check:** Order status is `fulfilled` AND items have `storageRef` ✅

#### Step 10: Reveal and Download Key

```bash
# Frontend: Customer clicks "Reveal Download Link"
# OR use curl:

curl -X POST http://localhost:4000/fulfillment/$ORDER_ID/reveal/item-456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.1", "userAgent": "Mozilla/5.0"}'

# Expected response:
# {
#   "key": "ABC-DEF-GHI-JKL",  # Decrypted plaintext key
#   "expiresAt": "2025-11-10T12:35:00Z"
# }
```

**Verify:** Decrypted key returned successfully ✅

### ✅ Happy Path Complete!

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 1 | Create order | Order created with `pending` status | ✅ |
| 2 | Create payment | Invoice URL returned | ✅ |
| 3 | Send NOWPayments IPN | HMAC verified, order → `paid` | ✅ |
| 4 | Verify order status | Status changed to `paid` | ✅ |
| 5 | Monitor fulfillment | Job enqueued and processed | ✅ |
| 6 | Verify reservation | `kinguinReservationId` populated | ✅ |
| 7 | Send Kinguin webhook | HMAC verified, job enqueued | ✅ |
| 8 | Monitor fulfillment | Job processed successfully | ✅ |
| 9 | Verify fulfillment | Status → `fulfilled`, key stored | ✅ |
| 10 | Reveal key | Decrypted key returned | ✅ |

---

## 🔧 Edge Cases & Error Scenarios

### Test Case 2: Idempotency (Duplicate Webhooks)

**Objective:** Verify duplicate webhooks don't create duplicate entries

```bash
# Send the same webhook TWICE

# First request:
curl -X POST http://localhost:4000/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL"
  }'
# Response: {"ok": true}

# Second request (identical):
curl -X POST http://localhost:4000/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL"
  }'
# Response: {"ok": true}

# Check webhook logs (should only have 1 processed entry):
curl -X GET http://localhost:4000/admin/webhook-logs

# Expected: WebhookLog with unique constraint on (externalId, webhookType, processed)
# Result: ✅ Only 1 entry processed, 2nd marked as duplicate
```

### Test Case 3: Invalid HMAC Signature

**Objective:** Verify invalid signatures are rejected

```bash
# Send webhook with WRONG signature

curl -X POST http://localhost:4000/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: invalid_signature_12345" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL"
  }'

# Expected response:
# {"statusCode": 401, "message": "Invalid HMAC signature"}

# ✅ Webhook rejected
```

### Test Case 4: Missing Required Fields

**Objective:** Verify validation rejects malformed requests

```bash
# Send webhook without required field (reservationId):

curl -X POST http://localhost:4000/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL"
  }'

# Expected response:
# {
#   "statusCode": 400,
#   "message": "Validation failed",
#   "errors": [{
#     "field": "reservationId",
#     "message": "reservationId must be a string"
#   }]
# }

# ✅ Validation error caught
```

### Test Case 5: Job Retry on Transient Failure

**Objective:** Verify failed jobs retry with exponential backoff

```bash
# Simulate transient failure by:
# 1. Kill R2 connection (stop minio/R2 service)
# 2. Send Kinguin webhook

# Expected behavior:
# - Job fails: Error logged in BullMQ
# - Retry 1: 1 second delay
# - Retry 2: 2 seconds delay
# - Retry 3: 4 seconds delay
# - Retry 4: 8 seconds delay
# - Retry 5: 16 seconds delay
# - Final failure: Moved to DLQ (dead-letter queue)

# Monitor with Redis:
redis-cli LRANGE fulfillment:failed 0 -1
# Should see job with retry count

# ✅ Retry logic working
```

### Test Case 6: Underpayment Detection

**Objective:** Verify underpaid orders are marked non-refundable

```bash
# Send NOWPayments IPN with underpayment status:

curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: $HMAC_SIGNATURE" \
  -d '{
    "payment_id": "np-999",
    "payment_status": "underpaid",
    "order_id": "'$ORDER_ID'",
    "amount_received": "5.00",
    "amount_required": "10.00"
  }'

# Check order status:
curl -X GET http://localhost:4000/orders/$ORDER_ID

# Expected:
# {
#   "status": "underpaid",  # Terminal state
#   "items": [
#     {
#       "status": "not_delivered",  # Key NOT generated
#       "storageRef": null
#     }
#   ]
# }

# ✅ Underpayment handled correctly (non-refundable)
```

---

## 📊 Admin Dashboard Testing

### Test Case 7: Admin Reservation Monitoring

**Objective:** Verify admin can view all reservations

```bash
# Login as admin (get JWT token)
export ADMIN_JWT="your_admin_token"

# Fetch all reservations:
curl -X GET http://localhost:4000/admin/reservations \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "data": [
#     {
#       "id": "order-123",
#       "email": "test@example.com",
#       "kinguinReservationId": "kinguin-res-789",
#       "status": "fulfilled",
#       "createdAt": "2025-11-10T12:00:00Z",
#       "updatedAt": "2025-11-10T12:05:00Z"
#     }
#   ],
#   "total": 1,
#   "page": 1,
#   "pageSize": 20,
#   "totalPages": 1
# }

# ✅ Reservations visible in admin dashboard
```

### Test Case 8: Admin Webhook Log Viewer

**Objective:** Verify admin can view webhook history

```bash
curl -X GET http://localhost:4000/admin/webhook-logs \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "data": [
#     {
#       "id": "log-456",
#       "externalId": "kinguin-res-789",
#       "webhookType": "kinguin",
#       "status": "processed",
#       "signatureValid": true,
#       "payload": {...},
#       "processedAt": "2025-11-10T12:04:00Z",
#       "createdAt": "2025-11-10T12:04:00Z"
#     }
#   ],
#   "total": 1,
#   "page": 1,
#   "pageSize": 20
# }

# ✅ Webhook logs visible
```

### Test Case 9: Webhook Replay

**Objective:** Verify admin can replay failed webhooks

```bash
# Mark webhook for replay:
curl -X POST http://localhost:4000/admin/webhook-logs/log-456/replay \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json"

# Expected response:
# {"ok": true, "message": "Webhook marked for replay"}

# Check webhook status:
curl -X GET http://localhost:4000/admin/webhook-logs/log-456 \
  -H "Authorization: Bearer $ADMIN_JWT"

# Expected status: "pending" (will be reprocessed)

# ✅ Replay capability working
```

### Test Case 10: Key Access Audit Trail

**Objective:** Verify admin can see who revealed keys

```bash
curl -X GET http://localhost:4000/admin/key-audit/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_JWT"

# Expected response:
# {
#   "orderId": "order-123",
#   "email": "test@example.com",
#   "items": [
#     {
#       "id": "item-456",
#       "accesses": [
#         {
#           "revealedAt": "2025-11-10T12:05:00Z",
#           "ipAddress": "192.168.1.1",
#           "userAgent": "Mozilla/5.0",
#           "status": "success"
#         }
#       ]
#     }
#   ]
# }

# ✅ Audit trail complete
```

---

## 🔐 Security & Idempotency Testing

### Test Case 11: HMAC Timing Attack Prevention

**Objective:** Verify timing-safe comparison is used

```bash
# This is a verification test (not a functional test)
# Check the code:
# apps/api/src/modules/kinguin/kinguin.service.ts

# Look for:
# crypto.timingSafeEqual(Buffer.from(...), Buffer.from(...))

# Expected: ✅ Timing-safe comparison used (not simple string comparison)
```

### Test Case 12: AES-256-GCM Encryption Verification

**Objective:** Verify keys are encrypted before R2 storage

```bash
# Get the storageRef from fulfilled order:
curl -X GET http://localhost:4000/orders/$ORDER_ID

# Expected storageRef: "orders/order-123/item-456/key.bin"

# Try to access the R2 object directly (should be encrypted):
# Note: Don't have direct R2 access in this test

# Instead, verify via:
# 1. Key is decryptable only with correct secret ✅
# 2. IV is random (checked in logs) ✅
# 3. Auth tag verification passes ✅

# ✅ Encryption working
```

---

## 🐛 Troubleshooting

### Issue: "Invalid HMAC signature" Error

**Symptom:**
```
POST /kinguin/webhooks → 401 Unauthorized
{"message": "Invalid HMAC signature"}
```

**Solution:**

1. **Verify webhook secret matches:**
   ```bash
   echo $KINGUIN_WEBHOOK_SECRET
   # Should match the one in .env
   ```

2. **Verify raw body is not JSON-stringified twice:**
   ```bash
   # WRONG:
   -d '"{\"reservationId\": \"...\"}"'  # Double-stringified
   
   # CORRECT:
   -d '{"reservationId": "..."}'  # Single layer
   ```

3. **Verify signature calculation includes full payload:**
   ```bash
   # Calculate HMAC on ENTIRE raw body, not just part
   const rawBody = JSON.stringify({...});  # Full object
   const hmac = crypto.createHmac('sha512', secret)
     .update(rawBody)
     .digest('hex');
   ```

### Issue: Order Status Stuck at "paid"

**Symptom:**
```
GET /orders/{id} → {"status": "paid", "kinguinReservationId": null}
# Status doesn't change to "fulfilling"
```

**Solution:**

1. **Check if BullMQ processor is running:**
   ```bash
   # In API terminal, look for:
   # [BullModule] Fulfillment queue initialized
   # [FulfillmentProcessor] Listening for jobs
   ```

2. **Check Redis connection:**
   ```bash
   redis-cli PING
   # Should return PONG
   ```

3. **Check job queue manually:**
   ```bash
   redis-cli LRANGE fulfillment 0 -1
   # Should contain jobs
   
   redis-cli ZRANGE fulfillment:delayed 0 -1
   # Check delayed jobs if any
   ```

4. **Check application logs for errors:**
   ```bash
   # Look for ERROR logs in API output
   # If found, check error message for root cause
   ```

### Issue: Kinguin Webhook Not Received

**Symptom:**
```
POST /kinguin/webhooks → Timeout or 404
```

**Solution:**

1. **Verify endpoint exists:**
   ```bash
   curl -X GET http://localhost:4000/api/docs
   # Search for "kinguin/webhooks" in Swagger
   ```

2. **Verify KinguinModule is imported in AppModule:**
   ```bash
   # Check: apps/api/src/app.module.ts
   # Should have: imports: [KinguinModule, ...]
   ```

3. **Use ngrok to test with real Kinguin:**
   ```bash
   # If testing against Kinguin sandbox:
   ngrok http 4000
   # Configure Kinguin webhook URL to: https://your-ngrok-url/kinguin/webhooks
   ```

### Issue: Keys Not Storing in R2

**Symptom:**
```
Order fulfilled but storageRef is null
```

**Solution:**

1. **Verify R2 credentials:**
   ```bash
   echo $R2_ACCESS_KEY_ID
   echo $R2_ENDPOINT
   echo $R2_BUCKET
   ```

2. **Test R2 connection:**
   ```bash
   # Use AWS SDK to test:
   node -e "
   const { S3Client } = require('@aws-sdk/client-s3');
   const client = new S3Client({...});
   client.send(new ListBucketsCommand()).then(console.log);
   "
   ```

3. **Check application logs for R2 errors:**
   ```bash
   # Look for: "R2 upload failed", "Storage service error"
   ```

### Issue: Database Migration Not Applied

**Symptom:**
```
Error: column "kinguinReservationId" does not exist
```

**Solution:**

1. **Run migrations manually:**
   ```bash
   npm run migration:run
   # Expected: 5 migrations executed
   ```

2. **Verify database state:**
   ```bash
   psql postgresql://...bitloot
   \dt  # List tables
   \d orders  # Describe orders table
   # Should show: kinguinReservationId column
   ```

3. **If migrations fail, debug:**
   ```bash
   npm run migration:show
   # Shows which migrations were run
   ```

---

## ✅ Test Checklist

Use this checklist to verify all E2E tests pass:

### Happy Path
- [ ] Create order successfully
- [ ] Create payment invoice
- [ ] Simulate NOWPayments IPN webhook
- [ ] Order status changes to `paid`
- [ ] Fulfillment job enqueued
- [ ] Order gets `kinguinReservationId`
- [ ] Simulate Kinguin webhook
- [ ] Order status changes to `fulfilled`
- [ ] Order items have `storageRef`
- [ ] Key is decryptable

### Idempotency
- [ ] Duplicate webhook doesn't create duplicate entries
- [ ] Second webhook returns 200 OK
- [ ] WebhookLog shows only 1 processed entry

### Security
- [ ] Invalid HMAC signature rejected (401)
- [ ] Missing signature rejected (400)
- [ ] Malformed JSON rejected (400)
- [ ] Keys are encrypted in R2
- [ ] Signed URLs have 15-min expiry

### Admin Features
- [ ] Admin can view reservations
- [ ] Admin can view webhook logs
- [ ] Admin can replay webhooks
- [ ] Admin can view key audit trail

### Edge Cases
- [ ] Underpaid orders marked non-refundable
- [ ] Failed jobs retry with backoff
- [ ] Job failures moved to DLQ

---

## 📞 Quick Reference Commands

```bash
# Check services
docker ps

# API logs
docker logs -f bitloot-api

# Database
psql postgresql://user:password@localhost:5432/bitloot

# Redis
redis-cli

# Queue status
redis-cli LRANGE fulfillment 0 -1

# Order status
curl http://localhost:4000/orders/{id}

# Admin reservations
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/admin/reservations

# Webhook logs
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/admin/webhook-logs
```

---

**E2E Testing Guide Complete** ✅

For questions or issues, refer to the troubleshooting section or check:
- `LEVEL_3_COMPLETE.md` - Implementation summary
- `LEVEL_3_EXECUTION_PLAN.md` - Architecture details
- Kinguin API docs: `kinguin-API-documentation.md`
