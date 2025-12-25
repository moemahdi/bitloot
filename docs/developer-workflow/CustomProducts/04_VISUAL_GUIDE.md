# Visual Architecture: Custom vs Kinguin

---

## Current System (What You Have)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Browse Products → Add to Cart → Checkout                    │
│  2. Enter Email → Accept Terms → Pay Crypto                     │
│  3. Payment Confirmed (NOWPayments webhook)                     │
│  4. Order Status Page (polling every 1s)                        │
│  5. "Your key is being prepared..."                             │
│  6. Download Link Appears → Click → Download Key                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR BACKEND (NestJS)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PaymentsService (Listens for NOWPayments IPN)                  │
│  ↓                                                                │
│  BullMQ Queue: fulfillmentQueue                                 │
│  ↓                                                                │
│  FulfillmentService:                                            │
│  • ✅ YOU MANUALLY UPLOAD KEY TO R2 (external step)             │
│  • Encrypt key                                                   │
│  • Generate signed URL                                           │
│  • Send email                                                    │
│  • Mark fulfilled                                                │
│  ↓                                                                │
│  Cloudflare R2 (Encrypted key storage)                          │
│  ↓                                                                │
│  EmailsService (Send link to customer)                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Summary:** You upload key to R2. System encrypts, sends email, marks fulfilled.

---

## New System: Adding Kinguin

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│  Same flow... → 6. Download Link Appears Faster                │
│  (Kinguin auto-delivers within seconds)                         │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR BACKEND (NestJS)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PaymentsService (IPN webhook)                                  │
│  ↓                                                                │
│  BullMQ Queue: fulfillmentQueue                                 │
│  ↓                                                                │
│  FulfillmentService.fulfillOrder()                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ if (order.sourceType === 'kinguin') {    ✨ NEW BRANCH  │   │
│  │   fulfillOrderViaKinguin()                               │   │
│  │ } else {                                                 │   │
│  │   fulfillOrderViaCustom()   ✅ UNCHANGED                │   │
│  │ }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                                    ↓                    │
│  ┌────────────────────┐            ┌──────────────────────┐     │
│  │ Kinguin Path       │            │ Custom Path          │     │
│  │ ✨ NEW             │            │ ✅ UNCHANGED         │     │
│  │                    │            │                      │     │
│  │ 1. Call Kinguin    │            │ 1. You upload key    │     │
│  │    API             │            │ 2. Encrypt           │     │
│  │ 2. Poll for key    │            │ 3. Send email        │     │
│  │    (or webhook)    │            │ 4. Mark fulfilled    │     │
│  │ 3. Encrypt key     │            │                      │     │
│  │ 4. Upload to R2    │            │                      │     │
│  │ 5. Send email      │            │                      │     │
│  │ 6. Mark fulfilled  │            │                      │     │
│  └────────┬───────────┘            └──────────┬───────────┘     │
│           ↓                                    ↓                  │
│           └────────────┬───────────────────────┘                  │
│                        ↓                                          │
│           ┌────────────────────────┐                            │
│           │ Cloudflare R2         │                            │
│           │ (Encrypted key store) │                            │
│           └────────────┬───────────┘                            │
│                        ↓                                          │
│           ┌────────────────────────┐                            │
│           │ EmailsService          │                            │
│           │ "Your key is here"     │                            │
│           └────────────────────────┘                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    KINGUIN (Optional)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Kinguin Webhook (for Kinguin products only)                   │
│  Event: order.ready with key                                   │
│  → Your handler verifies signature                              │
│  → Updates order with key                                       │
│  (Automatic - no manual step)                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Change:** The `if` statement branches to:
1. **Kinguin Path** (automatic, fast)
2. **Custom Path** (manual, same as before)

---

## Code Flow Comparison

### Custom Product (Existing)
```
CREATE ORDER
  ↓
PAYMENT CONFIRMED
  ↓
fulfillOrder('order-123')
  ↓
if (order.sourceType === 'custom') { ← matches
  // 1. You upload key to R2
  // 2. Encrypt
  // 3. Generate URL
  // 4. Send email
  // 5. Mark fulfilled
}
  ↓
CUSTOMER DOWNLOADS KEY
```

### Kinguin Product (New)
```
CREATE ORDER
  ↓
PAYMENT CONFIRMED
  ↓
fulfillOrder('order-123')
  ↓
if (order.sourceType === 'kinguin') { ← matches
  // 1. kinguin.createOrder('offer-id')
  //    → returns { id, status: 'pending' }
  // 2. Poll for key (max 10 attempts)
  //    → key arrives
  // 3. Encrypt
  // 4. Upload to R2
  // 5. Send email
  // 6. Mark fulfilled
}
  ↓
CUSTOMER DOWNLOADS KEY
```

**Difference:** Kinguin handles step 1 automatically.

---

## Database Changes (Minimal)

### Before
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  retailPrice DECIMAL(20,8),
  costUsd DECIMAL(20,8),
  status ENUM('active', 'inactive'),
  createdAt TIMESTAMP
);
```

### After
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  retailPrice DECIMAL(20,8),
  costUsd DECIMAL(20,8),
  status ENUM('active', 'inactive'),
  
  ✨ sourceType ENUM('custom', 'kinguin') DEFAULT 'custom',
  ✨ kinguinOfferId VARCHAR(255) NULLABLE,
  
  createdAt TIMESTAMP
);
```

**Impact:** Just 2 new columns. Zero data deleted.

---

## Kinguin Order Fulfillment Flow

```
Your Backend              Kinguin API
════════════════════════════════════════════════════════

POST /v1/orders
{
  "offerId": "12345-67890",
  "quantity": 1,
  "autoDeliver": true
}
                ────────────→
                             Returns:
                             {
                               "id": "kinguin-order-xyz",
                               "status": "pending"
                             }
                ←────────────

[Polling every 2 seconds...]

GET /v1/orders/kinguin-order-xyz
                ────────────→
                             [Still pending...]
                ←────────────

GET /v1/orders/kinguin-order-xyz
                ────────────→
                             Returns:
                             {
                               "id": "kinguin-order-xyz",
                               "status": "ready",
                               "key": "ABCD-EFGH-IJKL"
                             }
                ←────────────

[Encrypt + Upload to R2]
[Send Email]
Order marked fulfilled ✓
```

---

## Deployment Phases

### Phase 1: Deploy with Feature Flag OFF
```
Production Server
┌──────────────────────────┐
│ KINGUIN_ENABLED = false  │ ← Hidden
│                          │
│ All orders → custom path │
│ Zero impact on users     │
└──────────────────────────┘
```

### Phase 2: Gradual Rollout
```
Week 1: Internal testing
┌──────────────────────────┐
│ KINGUIN_ENABLED = true   │
│ Hidden from customers    │
│ Team tests end-to-end    │
└──────────────────────────┘
     ↓
Week 2: 10% of catalog
┌──────────────────────────┐
│ 90% custom, 10% Kinguin  │
│ Monitor success rate     │
│ (Target: 99%+)           │
└──────────────────────────┘
     ↓
Week 3: 50% of catalog
┌──────────────────────────┐
│ 50% custom, 50% Kinguin  │
│ Still monitoring         │
└──────────────────────────┘
     ↓
Week 4: 100% of catalog
┌──────────────────────────┐
│ Both custom + Kinguin    │
│ Fully rolled out         │
└──────────────────────────┘
```

---

## Webhook Signature Verification

```
Kinguin Server             Your Webhook Handler
═════════════════════════════════════════════════════

Generates:
  raw = JSON.stringify(payload)
  signature = HMAC-SHA512(raw, webhookSecret)

POST /webhooks/kinguin
  Body: payload
  Header: x-kinguin-signature: signature
                    ────────────→
                                 Extract signature
                                 ↓
                                 Compute expected:
                                 expected = HMAC-SHA512(
                                   raw,
                                   webhookSecret
                                 )
                                 ↓
                                 Timing-safe compare
                                 ↓
                                 if (signature === expected) {
                                   Process ✓
                                   Return 200
                                 } else {
                                   Reject ✗
                                   Return 401
                                 }
```

---

## What Changes, What Stays

```
┌──────────────────────────────────────────────────────┐
│                      UNCHANGED                        │
├──────────────────────────────────────────────────────┤
│ ✅ Payment pipeline (NOWPayments)                    │
│ ✅ Custom product fulfillment                       │
│ ✅ R2 encryption & storage                          │
│ ✅ Email service                                    │
│ ✅ BullMQ job queue                                 │
│ ✅ Authentication (OTP, JWT)                        │
│ ✅ All existing data                                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                     NEW / ADDED                       │
├──────────────────────────────────────────────────────┤
│ ✨ Kinguin API client                               │
│ ✨ Kinguin webhook handler                          │
│ ✨ Fulfillment dispatcher                           │
│ ✨ Product sourceType field                         │
│ ✨ Admin UI updates                                 │
│ ✨ 100+ tests                                       │
└──────────────────────────────────────────────────────┘
```

---

## File Structure Impact

```
apps/api/src/
├── modules/
│   ├── fulfillment/
│   │   ├── kinguin.client.ts              ✨ NEW
│   │   ├── kinguin.client.spec.ts         ✨ NEW
│   │   ├── fulfillment.service.ts         MODIFY
│   │   ├── fulfillment.module.ts          MODIFY
│   │   └── ...
│   │
│   ├── webhooks/
│   │   ├── kinguin-webhook.controller.ts  ✨ NEW
│   │   └── ...
│   │
│   ├── catalog/
│   │   ├── product.entity.ts              MODIFY
│   │   └── ...
│   │
│   └── ... (payments, storage, emails: UNCHANGED)
│
└── database/migrations/
    └── [timestamp]-add-kinguin.ts         ✨ NEW
```

**Total Changes:**
- New code: ~350 lines
- Modified code: ~100 lines
- Deleted code: 0 lines

---

## Summary

You're adding Kinguin alongside your existing system, not replacing it. Both flows coexist peacefully:

```
Products
├─ Custom (100+)      → Manual fulfillment (you control)
└─ Kinguin (1000s)    → Auto fulfillment (API-driven)

Same R2 storage
Same email service
Same encryption
Same user experience
Different backend path

Feature flag protects everything
Rollback available at any time
```

**This is the right way to do it.** 🚀
