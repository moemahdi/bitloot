# 🛒 BitLoot Checkout: All Customer Scenarios & System Responses

Based on the codebase analysis, here's every situation a customer may face during checkout:

---

## 📊 Order Status Flow Diagram

```
                              ┌─────────────┐
                              │   CREATED   │ ← Order created, waiting for payment
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │   EXPIRED   │          │ CONFIRMING  │          │   FAILED    │
    │ (abandoned) │          │  (partial)  │          │ (rejected)  │
    └─────────────┘          └──────┬──────┘          └─────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌───────────┐   ┌───────────┐   ┌───────────┐
             │ UNDERPAID │   │   PAID    │   │  FAILED   │
             │(no refund)│   │(confirmed)│   │ (network) │
             └───────────┘   └─────┬─────┘   └───────────┘
                                   │
                                   ▼
                            ┌───────────┐
                            │ FULFILLED │ ← Keys delivered
                            └───────────┘
```

---

## 🎯 SCENARIO 1: Happy Path (Perfect Customer Journey)

### Customer Action:
1. Browses products → Adds to cart
2. Enters email → Clicks "Pay with Crypto"
3. Receives payment address → Sends exact crypto amount
4. Payment confirmed → Keys delivered instantly
5. Reveals keys → Downloads/redeems

### System Response:

| Step | Order Status | Payment Status | System Action |
|------|--------------|----------------|---------------|
| 1. Order created | `created` | `created` | Order + Payment records created |
| 2. Widget opened | `created` | `waiting` | NOWPayments invoice generated |
| 3. Crypto sent | `confirming` | `confirming` | IPN webhook received (1+ confirmations) |
| 4. Payment confirmed | `paid` | `finished` | IPN webhook with `finished`, fulfillment job queued |
| 5. Keys fetched | `fulfilled` | `finished` | Kinguin/Custom keys uploaded to R2, signed URLs generated |
| 6. Email sent | `fulfilled` | `finished` | Completion email with "View Keys" link |

**Code Flow:**
```
Frontend → POST /orders → create() 
     → POST /payments → create() → NOWPayments API
     → IPN Webhook → processPaymentStatus() → fulfillmentQueue.add()
     → FulfillmentService.fulfillOrder() → KinguinClient / R2Storage
     → EmailsService.sendOrderCompletedEmail()
```

---

## ⏰ SCENARIO 2: Abandoned Checkout (User Never Pays)

### Customer Action:
1. Creates order
2. Opens payment widget
3. **Closes browser/tab without paying**
4. Never returns

### System Response:

| Timeline | Order Status | Payment Status | System Action |
|----------|--------------|----------------|---------------|
| 0 min | `created` | `waiting` | Order created, waiting for payment |
| 60 min | `expired` | `failed` | Cron job `OrphanOrderCleanupService` runs |

**What Happens:**
- The `OrphanOrderCleanupService` runs every **10 minutes**
- Orders in `created` status for more than **60 minutes** are marked `expired`
- Payment records are marked `failed`
- User can no longer complete this order

**Code:**
```typescript
// orphan-order-cleanup.processor.ts
const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 60 min
await this.ordersRepo.update(order.id, { status: 'expired' });
await this.paymentsRepo.update({ orderId: order.id }, { status: 'failed' });
```

**Customer Experience:**
- If they return after 60 min, they see "Order Expired"
- They must start a new checkout

---

## 💸 SCENARIO 3: Underpayment (Sent Less Than Required)

### Customer Action:
1. Order requires **0.001 BTC**
2. Customer sends only **0.0008 BTC** (80%)
3. Payment is short

### System Response:

| Event | Order Status | Payment Status | System Action |
|-------|--------------|----------------|---------------|
| IPN received | `underpaid` | `underpaid` | Order marked underpaid |
| Forever | `underpaid` | `underpaid` | **NO REFUND, NO KEYS** |

**Critical Business Logic:**
```typescript
case 'underpaid':
  // Non-refundable - customer loses funds
  order.status = 'underpaid';
  this.logger.warn(`[IPN] Payment underpaid for order ${order.id} (non-refundable)`);
  break;
```

**Customer Experience:**
- Order page shows "Underpaid - Payment Insufficient"
- **No refund is issued** (NOWPayments policy)
- Customer must contact support or lose funds
- Keys are **NOT delivered**

**Why No Refund?**
- Crypto transaction fees make micro-refunds impractical
- NOWPayments doesn't support automatic partial refunds
- BitLoot policy: underpaid = order failed

---

## ❌ SCENARIO 4: Payment Failed (Network Issue/Rejection)

### Customer Action:
1. Sends crypto payment
2. Transaction fails on blockchain (insufficient gas, rejected, etc.)

### System Response:

| Event | Order Status | Payment Status | System Action |
|-------|--------------|----------------|---------------|
| IPN: `failed` | `failed` | `failed` | Order marked failed |

**Code:**
```typescript
case 'failed':
  order.status = 'failed';
  this.logger.warn(`[IPN] Payment failed for order ${order.id}`);
  break;
```

**Customer Experience:**
- Order page shows "Payment Failed"
- Customer must create a new order
- Original funds returned to wallet (blockchain-level failure)

---

## ⏳ SCENARIO 5: Slow Blockchain Confirmation (Customer Anxious)

### Customer Action:
1. Sends payment
2. Waits 5-30+ minutes for confirmations
3. Keeps refreshing order page

### System Response:

| Step | Order Status | Payment Status | What Customer Sees |
|------|--------------|----------------|-------------------|
| Sent | `confirming` | `waiting` | "Waiting for payment..." |
| 1 confirmation | `confirming` | `confirming` | "Payment confirming..." |
| Full confirmations | `paid` | `finished` | "Payment confirmed!" |

**Frontend Polling:**
```typescript
// Frontend polls GET /orders/:id every few seconds
const { data } = await ordersClient.getOrder(orderId);
// Shows real-time status updates
```

**Cache Behavior:**
- After each IPN webhook, cache is invalidated: `invalidateOrderCache(orderId)`
- Frontend always gets fresh status on next poll

---

## 🔄 SCENARIO 6: Duplicate Order Creation (Double-Click Bug)

### Customer Action:
1. Clicks "Checkout" button twice rapidly
2. Two network requests fire

### System Response:

| Request | Result |
|---------|--------|
| First click | Order created, returns order ID |
| Second click | **Same order ID returned** (idempotency) |

**How It Works:**
```typescript
// OrdersService.create()
if (dto.idempotencyKey) {
  const cached = idempotencyCache.get(`${dto.email}:${dto.idempotencyKey}`);
  if (cached) {
    this.logger.log(`🔄 Idempotency hit: returning existing order ${cached.orderId}`);
    return await this.get(cached.orderId);
  }
}
```

**Customer Experience:**
- Only ONE order is created
- No duplicate charges
- Clean checkout flow

---

## 🏃 SCENARIO 7: Fast Kinguin Fulfillment (Race Condition)

### What Happens Internally:
1. IPN webhook marks order `paid`
2. Fulfillment job starts immediately
3. Kinguin delivers keys in 2-3 seconds
4. Order marked `fulfilled`
5. **Meanwhile:** Frontend polling calls `markPaid()` again

### System Response:

**Race Condition Guard:**
```typescript
// OrdersService.markPaid()
async markPaid(orderId: string): Promise<Order> {
  const order = await this.findOne(orderId);
  
  // Guard: Don't downgrade from 'fulfilled' to 'paid'
  if (order.status === 'fulfilled') {
    this.logger.debug(`⏭️ Order ${orderId} already fulfilled, skipping markPaid`);
    return order;
  }
  // ... proceed
}
```

**Customer Experience:**
- Order shows `fulfilled` (correct)
- Never flickers back to `paid`
- Keys available immediately

---

## 📧 SCENARIO 8: Multiple Email Triggers (Duplicate Email Prevention)

### What Could Happen:
1. IPN webhook triggers fulfillment
2. Fulfillment completes → Email sent
3. Payment polling also triggers fulfillment
4. **Should NOT send second email**

### System Response:

**Email Idempotency:**
```typescript
// EmailsService.sendOrderCompletedEmail()
if (order.completionEmailSent) {
  this.logger.debug(`[EMAIL] Already sent for ${order.id}, skipping`);
  return;
}

// After successful send
await this.ordersRepo.update({ id: order.id }, { completionEmailSent: true });
```

**Customer Experience:**
- Receives exactly **ONE** completion email
- No spam from duplicate webhooks

---

## 🔐 SCENARIO 9: Invalid/Fake Webhook Attack

### Attack Scenario:
1. Attacker sends fake IPN webhook
2. Claims payment is `finished`
3. Tries to steal keys

### System Defense:

**HMAC-SHA512 Verification:**
```typescript
private verifySignature(payload: Record<string, unknown>, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  
  // Sort payload alphabetically (NOWPayments requirement)
  const sortedPayload = this.sortObject(payload);
  const payloadStr = JSON.stringify(sortedPayload);
  
  // Generate expected HMAC
  const expectedHmac = crypto.createHmac('sha512', secret).update(payloadStr).digest('hex');
  
  // Timing-safe comparison (prevents timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
}
```

**Attack Result:**
- Webhook logged with `signatureValid: false`
- Order status **NOT updated**
- No fulfillment triggered
- Attacker gets nothing

---

## 🔁 SCENARIO 10: Duplicate Webhook (NOWPayments Retry)

### What Happens:
1. NOWPayments sends IPN webhook
2. Our server processes it
3. NOWPayments doesn't receive our 200 OK (network blip)
4. NOWPayments retries the same webhook

### System Response:

**Idempotency Check:**
```typescript
const existing = await this.checkIdempotency(String(payload.payment_id));
if (existing?.processed === true) {
  this.metrics.incrementDuplicateWebhook('nowpayments', 'ipn');
  this.logger.debug(`[IPN] Duplicate webhook (already processed)`);
  return { ok: true, processed: false, webhookId: existing.id };
}
```

**Result:**
- Second webhook is acknowledged but NOT processed
- No duplicate fulfillment
- No duplicate email
- Clean audit trail

---

## 🛍️ SCENARIO 11: Multi-Item Order (2+ Products)

### Customer Action:
1. Adds 3 different games to cart
2. Single checkout for all items

### System Response:

| Step | What Happens |
|------|--------------|
| Order creation | Single order with 3 `OrderItem` records |
| Payment | Single invoice for total amount |
| Fulfillment | All 3 keys fetched from Kinguin |
| Delivery | 3 separate signed URLs (one per item) |
| Email | Single email with links to all 3 keys |

**Key Matching Logic:**
```typescript
// FulfillmentService.fulfillOrderViaKinguin()
const allKeys = await this.kinguinClient.getKeysV2(reservationId);

for (const item of order.items) {
  // Match key by Kinguin productId
  const matchedKey = allKeys.find(k => k.productId === product.kinguinProductId);
  // Upload each key separately
  await this.r2StorageClient.uploadRawKey({ orderItemId: item.id, ... });
}
```

---

## 🏪 SCENARIO 12: Custom Product (Admin-Uploaded Key)

### Difference from Kinguin:
- Admin pre-uploads key to R2
- No external API call needed

### System Response:

```typescript
// FulfillmentService.fulfillOrderViaCustom()
const storageRef = `products/${item.productId}/key.json`;
const keyExists = await this.r2StorageClient.exists(storageRef);

if (!keyExists) {
  throw new BadRequestException(
    `Key not found for custom product. Admin must upload key first.`
  );
}

// Just generate signed URL for existing key
const signedUrl = await this.r2StorageClient.generateSignedUrlForPath({ path: storageRef });
```

**Customer Experience:**
- Identical to Kinguin products
- Instant key delivery
- Same email format

---

## 🔧 SCENARIO 13: Kinguin API Down (Fulfillment Failure)

### What Happens:
1. Payment confirmed
2. Fulfillment job starts
3. Kinguin API returns error

### System Response:

**BullMQ Retry Strategy:**
```typescript
await this.fulfillmentQueue.add('reserve', 
  { orderId, paymentId },
  {
    jobId: `fulfill-${orderId}`,
    attempts: 5,                              // Retry 5 times
    backoff: { type: 'exponential', delay: 1000 }, // 1s, 2s, 4s, 8s, 16s
  }
);
```

| Attempt | Delay | Total Wait |
|---------|-------|------------|
| 1 | 0s | 0s |
| 2 | 1s | 1s |
| 3 | 2s | 3s |
| 4 | 4s | 7s |
| 5 | 8s | 15s |

**Customer Experience:**
- May wait up to 15-30 seconds for fulfillment
- If all retries fail, order stays in `paid` status
- Admin must manually retry or investigate

---

## 📱 SCENARIO 14: Mobile User Leaves App

### Customer Action:
1. Starts checkout on mobile
2. Switches apps to crypto wallet
3. Sends payment
4. Returns to BitLoot

### System Response:
- Order persists in database
- IPN webhook still received (server-side)
- When customer returns, order shows current status
- WebSocket can push real-time updates

---

## 🔑 SCENARIO 15: Key Reveal (After Fulfillment)

### Customer Action:
1. Order is fulfilled
2. Customer clicks "Reveal Key" on order page

### System Response:

```typescript
// Each OrderItem has a signedUrl
const signedUrl = item.signedUrl; // https://r2.bitloot.io/...?signature=...&expires=...

// Signed URL expires after 3 hours
expiresInSeconds: 3 * 60 * 60
```

**Customer Experience:**
- Clicks reveal → Downloads key file (JSON/text)
- URL is time-limited (3 hours)
- Can request new URL if expired

---

## � NOWPayments Status Mapping

NOWPayments sends various statuses via IPN webhooks. Here's how BitLoot maps them:

| NOWPayments Status | Order Status | Payment Entity Status | Description |
|--------------------|--------------|----------------------|-------------|
| `waiting` | `confirming` | `waiting` | Invoice created, waiting for payment |
| `confirming` | `confirming` | `waiting` | Payment detected, awaiting confirmations |
| `sending` | `confirming` | `waiting` | Transaction broadcasting to blockchain |
| `confirmed` | `confirming` | `confirmed` | Blockchain confirmed, not yet finished |
| `finished` | `paid` | `finished` | ✅ Payment complete, fulfillment triggered |
| `partially_paid` | `underpaid` | `underpaid` | ⚠️ Customer sent less than required |
| `underpaid` | `underpaid` | `underpaid` | ⚠️ Equivalent to partially_paid |
| `expired` | `expired` | `failed` | Payment window expired |
| `refunded` | `failed` | `failed` | Admin-initiated refund (rare) |
| `failed` | `failed` | `failed` | Payment rejected/failed |

**Code Implementation:**
```typescript
// ipn-handler.service.ts - Status switch handling
case 'sending':
  order.status = 'confirming';
  break;

case 'partially_paid':
  order.status = 'underpaid';
  break;

case 'expired':
  order.status = 'expired';
  break;

// Payment entity mapping (constrained enum)
const statusMapping = {
  'confirming': 'waiting',      // Still waiting for confirmations
  'sending': 'waiting',          // Broadcasting tx, still waiting
  'partially_paid': 'underpaid', // Partial = underpaid
  'expired': 'failed',           // Expired = failed
  'refunded': 'failed',          // Refunded = failed
};
```

---

## �📊 Summary: All Order Statuses & Meanings

| Status | Meaning | Customer Action |
|--------|---------|-----------------|
| `created` | Order created, no payment started | Open payment widget |
| `waiting` | Payment widget opened | Send crypto |
| `confirming` | Crypto sent, awaiting confirmations | Wait 5-30 min |
| `paid` | Payment confirmed | Wait for fulfillment |
| `fulfilled` | Keys delivered | Reveal/download keys |
| `expired` | Abandoned for 60+ minutes | Create new order |
| `failed` | Payment rejected/failed | Create new order |
| `underpaid` | Sent less than required | **NO REFUND** - contact support |

---

## 🚨 Edge Cases Summary

| Scenario | System Behavior |
|----------|-----------------|
| Double-click checkout | Idempotency → Same order returned |
| Fake webhook | HMAC verification fails → Ignored |
| Duplicate webhook | Idempotency → Acknowledged, not processed |
| Fast fulfillment race | Guard prevents status downgrade |
| Multiple fulfillment triggers | Email sent only once |
| Abandoned order | Auto-expired after 60 min |
| Underpayment | No refund, no keys |
| Kinguin API failure | Exponential backoff retry (5 attempts) |
| Key reveal expired | Can request fresh signed URL |

---

This is the complete picture of how BitLoot handles every checkout scenario based on the actual code implementation! 🚀