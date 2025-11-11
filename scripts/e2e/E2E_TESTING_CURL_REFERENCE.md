# 🔧 Level 3 E2E Testing — Complete CURL Reference

**Status:** ✅ **COPY-PASTE READY**  
**Format:** Complete CURL commands with all parameters  
**Prerequisites:** API running on localhost:4000, valid environment variables

---

## 📋 Setup Commands

### 1. Export Environment Variables
```bash
export API_URL="http://localhost:4000"
export NOWPAYMENTS_IPN_SECRET="your_secret_from_env"
export KINGUIN_WEBHOOK_SECRET="your_secret_from_env"

# For admin endpoints (use mock JWT for testing)
export ADMIN_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFkbWluIiwiZW1haWwiOiJhZG1pbkBiaXRsb290LmlvIiwicm9sZSI6ImFkbWluIn0.test"
```

### 2. Verify Services Running
```bash
curl -s $API_URL/healthz | jq .
# Expected: {"ok":true,"timestamp":"..."}

docker ps
# Expected: postgres and redis containers running
```

---

## 🎯 Happy Path Commands

### Command 1: Create Order

```bash
# Create a test order
curl -s -X POST $API_URL/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 1
      }
    ]
  }' | jq .

# Save ORDER_ID for next steps
export ORDER_ID=$(curl -s -X POST $API_URL/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "items": [{"productId": "550e8400-e29b-41d4-a716-446655440000", "quantity": 1}]
  }' | jq -r '.id')

echo "Order ID: $ORDER_ID"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "email": "test@example.com",
  "totalCrypto": "0.00000000",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 1
    }
  ],
  "createdAt": "2025-11-10T12:00:00Z"
}
```

---

### Command 2: Create Payment

```bash
# Create payment invoice
curl -s -X POST $API_URL/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "priceAmount": "10.00",
    "priceCurrency": "EUR",
    "payCurrency": "BTC"
  }' | jq .

# Save INVOICE_ID for webhook
export INVOICE_ID=$(curl -s -X POST $API_URL/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "priceAmount": "10.00",
    "priceCurrency": "EUR",
    "payCurrency": "BTC"
  }' | jq -r '.invoiceId')

echo "Invoice ID: $INVOICE_ID"
```

**Expected Response:**
```json
{
  "invoiceId": "np-550e8400",
  "invoiceUrl": "https://nowpayments.io/payment/?iid=np-550e8400",
  "statusUrl": "https://nowpayments.io/status/",
  "payAddress": "1A1z7agoat8Bt51ZVD7sQ89YJtqKzkoxQQ",
  "priceAmount": "10.00",
  "payAmount": "0.00023456",
  "payCurrency": "BTC",
  "status": "created",
  "expirationDate": "2025-11-10T12:30:00Z"
}
```

---

### Command 3: Calculate NOWPayments Webhook HMAC

```bash
# Calculate HMAC-SHA512 signature
export NOWPAYMENTS_HMAC=$(node -e "
const crypto = require('crypto');
const rawBody = JSON.stringify({
  payment_id: '$INVOICE_ID',
  payment_status: 'finished',
  order_id: '$ORDER_ID',
  amount_received: '10.00',
  price_amount: '10.00',
  payment_currency: 'BTC'
});
const secret = process.env.NOWPAYMENTS_IPN_SECRET;
const hmac = crypto.createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');
console.log(hmac);
")

echo "HMAC Signature: $NOWPAYMENTS_HMAC"
```

---

### Command 4: Send NOWPayments IPN Webhook

```bash
# Send payment finished webhook
curl -s -X POST $API_URL/payments/ipn \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: $NOWPAYMENTS_HMAC" \
  -d '{
    "payment_id": "'$INVOICE_ID'",
    "payment_status": "finished",
    "order_id": "'$ORDER_ID'",
    "amount_received": "10.00",
    "price_amount": "10.00",
    "payment_currency": "BTC",
    "pay_currency": "BTC",
    "updated_at": "2025-11-10T12:05:00Z",
    "created_at": "2025-11-10T12:00:00Z"
  }' | jq .

echo "✅ Payment webhook sent"
sleep 2
```

**Expected Response:**
```json
{
  "ok": true
}
```

---

### Command 5: Verify Order Status (Payment Received)

```bash
# Check order status changed to 'paid'
curl -s -X GET $API_URL/orders/$ORDER_ID | jq '.status, .kinguinReservationId'

# Expected output:
# "paid"
# null  (will be set after reservation job runs)

# Wait a moment for background job to process
sleep 3
```

---

### Command 6: Verify Reservation Created

```bash
# Check if reservation ID was set
curl -s -X GET $API_URL/orders/$ORDER_ID | jq '.kinguinReservationId'

# Expected: "kinguin-res-550e8400-..." (UUID or reservation ID)
# Save for Kinguin webhook
export RESERVATION_ID=$(curl -s -X GET $API_URL/orders/$ORDER_ID | jq -r '.kinguinReservationId')

echo "Reservation ID: $RESERVATION_ID"
```

---

### Command 7: Calculate Kinguin Webhook HMAC

```bash
# Calculate HMAC-SHA512 for Kinguin webhook
export KINGUIN_HMAC=$(node -e "
const crypto = require('crypto');
const rawBody = JSON.stringify({
  reservationId: '$RESERVATION_ID',
  status: 'ready',
  key: 'ABC-DEF-GHI-JKL-MNO-PQR',
  orderId: '$ORDER_ID'
});
const secret = process.env.KINGUIN_WEBHOOK_SECRET;
const hmac = crypto.createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex');
console.log(hmac);
")

echo "Kinguin HMAC: $KINGUIN_HMAC"
```

---

### Command 8: Send Kinguin Webhook (Ready)

```bash
# Send Kinguin webhook: reservation is ready for delivery
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR",
    "orderId": "'$ORDER_ID'",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' | jq .

echo "✅ Kinguin webhook sent"
sleep 3
```

**Expected Response:**
```json
{
  "ok": true
}
```

---

### Command 9: Verify Order Fulfilled

```bash
# Check order status changed to 'fulfilled' and storageRef is set
curl -s -X GET $API_URL/orders/$ORDER_ID | jq '.status, .items[0].storageRef, .items[0].deliveredAt'

# Expected output:
# "fulfilled"
# "orders/ORDER_ID/ITEM_ID/key.bin"  (R2 storage reference)
# "2025-11-10T12:05:00Z"  (timestamp)

echo "✅ Order fulfillment complete!"
```

---

### Command 10: Reveal Key (Decrypt & Retrieve)

```bash
# Get decrypted key (requires JWT auth)
export ITEM_ID=$(curl -s -X GET $API_URL/orders/$ORDER_ID | jq -r '.items[0].id')

curl -s -X POST $API_URL/fulfillment/$ORDER_ID/reveal/$ITEM_ID \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }' | jq .

# Expected response:
# {
#   "key": "ABC-DEF-GHI-JKL-MNO-PQR",  (decrypted plaintext)
#   "expiresAt": "2025-11-10T12:35:00Z"
# }
```

---

## 🔐 Security Tests

### Test 1: Invalid HMAC Signature

```bash
# Send webhook with WRONG signature
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: invalid_signature_00000000000000000000" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR"
  }' | jq .

# Expected: 401 Unauthorized
# {"statusCode": 401, "message": "Invalid HMAC signature"}
```

---

### Test 2: Missing HMAC Signature

```bash
# Send webhook WITHOUT signature header
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR"
  }' | jq .

# Expected: 400 Bad Request
# {"statusCode": 400, "message": "Missing X-KINGUIN-SIGNATURE header"}
```

---

### Test 3: Idempotency (Duplicate Webhook)

```bash
# Send the SAME webhook twice (identical signature and body)

# First request:
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR"
  }' | jq .
# Response: {"ok": true}

sleep 1

# Second request (identical):
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "reservationId": "'$RESERVATION_ID'",
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR"
  }' | jq .
# Response: {"ok": true}  (idempotent - same response)

# Verify only 1 processed entry:
curl -s -X GET $API_URL/admin/webhook-logs -H "Authorization: Bearer $ADMIN_JWT" | jq '.data[] | select(.status == "processed") | length'
# Expected: Only 1
```

---

### Test 4: Malformed JSON (Validation Error)

```bash
# Send webhook with MISSING required field
curl -s -X POST $API_URL/kinguin/webhooks \
  -H "Content-Type: application/json" \
  -H "X-KINGUIN-SIGNATURE: $KINGUIN_HMAC" \
  -d '{
    "status": "ready",
    "key": "ABC-DEF-GHI-JKL-MNO-PQR"
  }' | jq .

# Expected: 400 Bad Request
# {
#   "statusCode": 400,
#   "message": "Validation failed",
#   "errors": [{"field": "reservationId", "message": "..."}]
# }
```

---

## 📊 Admin API Tests

### Test 1: List All Reservations

```bash
# Fetch all reservations (paginated)
curl -s -X GET "$API_URL/admin/reservations?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" | jq '.data'

# Expected:
# [
#   {
#     "id": "ORDER_ID",
#     "email": "test@example.com",
#     "kinguinReservationId": "RESERVATION_ID",
#     "status": "fulfilled",
#     "createdAt": "2025-11-10T12:00:00Z"
#   }
# ]
```

---

### Test 2: Filter Reservations by Status

```bash
# Filter reservations by status
curl -s -X GET "$API_URL/admin/reservations?status=fulfilled" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.data'
```

---

### Test 3: View Webhook Logs

```bash
# List all webhook logs
curl -s -X GET "$API_URL/admin/webhook-logs?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.data'

# Expected:
# [
#   {
#     "id": "LOG_ID",
#     "externalId": "RESERVATION_ID",
#     "webhookType": "kinguin",
#     "status": "processed",
#     "signatureValid": true,
#     "payload": {...},
#     "processedAt": "2025-11-10T12:05:00Z"
#   }
# ]
```

---

### Test 4: View Single Webhook Log

```bash
# Get details of specific webhook log
export LOG_ID=$(curl -s -X GET "$API_URL/admin/webhook-logs?page=1&limit=1" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq -r '.data[0].id')

curl -s -X GET "$API_URL/admin/webhook-logs/$LOG_ID" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq .
```

---

### Test 5: Replay Webhook

```bash
# Mark webhook for replay
curl -s -X POST "$API_URL/admin/webhook-logs/$LOG_ID/replay" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Expected: {"ok": true, "message": "Webhook marked for replay"}
```

---

### Test 6: View Key Audit Trail

```bash
# Get key access audit for an order
curl -s -X GET "$API_URL/admin/key-audit/$ORDER_ID" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.items[0].accesses'

# Expected:
# [
#   {
#     "revealedAt": "2025-11-10T12:05:00Z",
#     "ipAddress": "192.168.1.1",
#     "userAgent": "Mozilla/5.0 ...",
#     "status": "success"
#   }
# ]
```

---

## 🔍 Monitoring Commands

### Monitor Redis Queue

```bash
# Check for pending jobs in fulfillment queue
redis-cli LRANGE fulfillment 0 -1

# Check delayed jobs (retries)
redis-cli ZRANGE fulfillment:delayed 0 -1

# Check failed jobs (DLQ)
redis-cli LRANGE fulfillment:failed 0 -1

# Real-time monitoring
watch redis-cli LRANGE fulfillment 0 -1
```

---

### Monitor Database

```bash
# Connect to database
psql postgresql://user:password@localhost:5432/bitloot

# Check order statuses
SELECT id, status, kinguin_reservation_id, created_at FROM orders ORDER BY created_at DESC LIMIT 5;

# Check webhook logs
SELECT external_id, webhook_type, status, signature_valid, created_at FROM webhook_logs ORDER BY created_at DESC LIMIT 5;

# Check keys stored
SELECT order_item_id, storage_ref, viewed_at FROM keys ORDER BY created_at DESC LIMIT 5;
```

---

### View API Logs

```bash
# Watch real-time API logs
tail -f apps/api/.npm-logs/* | grep -E "(reserve|kinguin|webhook|fulfill)"

# Or in Docker:
docker logs -f bitloot-api | grep -E "(reserve|kinguin|webhook)"
```

---

## 🎯 Error Scenario Commands

### Scenario 1: Underpayment

```bash
# Create new order for underpayment test
export ORDER_ID_2=$(curl -s -X POST $API_URL/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","items":[{"productId":"550e8400-e29b-41d4-a716-446655440000","quantity":1}]}' \
  | jq -r '.id')

export INVOICE_ID_2=$(curl -s -X POST $API_URL/payments/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"'$ORDER_ID_2'","priceAmount":"10.00","priceCurrency":"EUR","payCurrency":"BTC"}' \
  | jq -r '.invoiceId')

# Send underpayment webhook
export UNDERPAY_HMAC=$(node -e "
const crypto = require('crypto');
const raw = JSON.stringify({payment_id:'$INVOICE_ID_2',payment_status:'underpaid',order_id:'$ORDER_ID_2'});
const secret = process.env.NOWPAYMENTS_IPN_SECRET;
console.log(crypto.createHmac('sha512', secret).update(raw).digest('hex'));
")

curl -s -X POST $API_URL/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: $UNDERPAY_HMAC" \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"'$INVOICE_ID_2'","payment_status":"underpaid","order_id":"'$ORDER_ID_2'","amount_received":"5.00","price_amount":"10.00"}' | jq .

# Verify order marked underpaid (terminal state)
curl -s -X GET $API_URL/orders/$ORDER_ID_2 | jq '.status'
# Expected: "underpaid"
```

---

### Scenario 2: Invalid Order ID

```bash
# Try to get non-existent order
curl -s -X GET $API_URL/orders/invalid-id-12345 | jq .

# Expected: 404 Not Found
# {"statusCode": 404, "message": "Order not found"}
```

---

## ✅ Complete Test Summary

```bash
# Quick summary check
echo "=== Level 3 E2E Test Summary ==="
echo "Order ID: $ORDER_ID"
echo "Reservation ID: $RESERVATION_ID"

curl -s -X GET $API_URL/orders/$ORDER_ID | jq '{
  status: .status,
  reservation: .kinguinReservationId,
  storageRef: .items[0].storageRef
}'

echo ""
echo "=== Webhook Logs ==="
curl -s -X GET "$API_URL/admin/webhook-logs" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.total, .data | length'

echo ""
echo "✅ E2E Test Complete!"
```

---

**Reference Complete** ✅

All commands are copy-paste ready. Modify `$API_URL`, `$ORDER_ID`, etc. as needed for your testing.
