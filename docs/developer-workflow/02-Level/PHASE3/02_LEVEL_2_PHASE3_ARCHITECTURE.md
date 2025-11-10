# 🏗️ Level 2 Phase 3: Architecture & Integration Map

**Date:** November 8, 2025  
**Phase:** Phase 3 - Kinguin Fulfillment & Cloudflare R2 Integration

---

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BITLOOT PAYMENT SYSTEM                         │
│                                                                         │
│  ┌────────────────────┐     ┌──────────────────┐     ┌──────────────┐ │
│  │  Customer (Web)    │     │  NOWPayments IPN │     │  Kinguin API │ │
│  │  Frontend (React)  │────▶│  Webhook Handler │────▶│  Integration │ │
│  └────────────────────┘     └──────────────────┘     └──────────────┘ │
│         │                            │                      │          │
│         │                            │                      │          │
│         └──────────────┬─────────────┘                      │          │
│                        ▼                                     │          │
│              ┌──────────────────────┐                       │          │
│              │  PaymentsService     │◀──────────────────────┘          │
│              │  (Phase 2 ✅)        │                                  │
│              ├──────────────────────┤                                  │
│              │ • handleIpn()        │                                  │
│              │ • createInvoice()    │                                  │
│              │ • verify HMAC        │                                  │
│              └────────┬─────────────┘                                  │
│                       │                                                │
│                       ▼ [Phase 3 STARTS]                              │
│              ┌──────────────────────────────────────┐                 │
│              │   BullMQ Job Queue                  │                 │
│              │   'fulfillOrder'                    │                 │
│              └────────┬─────────────────────────────┘                 │
│                       │                                               │
│                       ▼                                               │
│        ┌──────────────────────────────────────────┐                  │
│        │   FulfillmentService                    │                  │
│        │   (Task 6 - Orchestrator)              │                  │
│        ├──────────────────────────────────────────┤                  │
│        │ • fulfillOrder(orderId)                │                  │
│        │ • getOrderStatus()                     │                  │
│        │ • handleKinguinWebhook()               │                  │
│        └────┬──────────────────────────┬────────┘                  │
│             │                          │                            │
│    ┌────────▼─────┐         ┌──────────▼──────┐                    │
│    │ KinguinClient│         │R2StorageService │                    │
│    │  (Task 2)    │         │  (Task 7)       │                    │
│    ├──────────────┤         ├─────────────────┤                    │
│    │createOrder() │         │storeKey()       │                    │
│    │getStatus()   │         │getSignedUrl()   │                    │
│    │getKey()      │         │verifyAccess()   │                    │
│    └────┬─────────┘         └────┬────────────┘                    │
│         │                        │                                  │
│    ┌────▼─────────┐   ┌─────────▼────────┐     ┌───────────────┐  │
│    │ Kinguin API  │   │ EncryptKey()     │     │R2StorageClient│  │
│    │ (External)   │   │ (Task 5)         │     │   (Task 4)    │  │
│    │              │   │                  │     │               │  │
│    │• createOrder │   │AES-256-GCM       │     │AWS SDK v3     │  │
│    │• getStatus   │   │Encryption        │     │               │  │
│    │• getKey      │   │                  │     │• uploadKey()  │  │
│    └──────────────┘   └──────────────────┘     │• genSignedUrl │  │
│                                                │• deleteKey()  │  │
│                                                └────┬──────────┘  │
│                                                     │              │
│                                                     ▼              │
│                                          ┌────────────────────┐   │
│                                          │ Cloudflare R2      │   │
│                                          │ (External Storage) │   │
│                                          │                    │   │
│                                          │ Encrypted keys     │   │
│                                          │ (15-min expiry)    │   │
│                                          └────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

                              ▼ [Customer Access]
                    ┌──────────────────────┐
                    │  Customer Downloads  │
                    │  Encrypted Key       │
                    │  from Signed URL     │
                    │  (15-min expiry)     │
                    └──────────────────────┘
```

---

## 🔄 Data Flow: Order to Delivery

```
1. PAYMENT CONFIRMED (Phase 2 ✅)
   ├─ PaymentsService.handleIpn()
   ├─ Order status: created → paid
   └─ Queue fulfillment job

2. FULFILLMENT BEGINS (Phase 3)
   ├─ FulfillmentService.fulfillOrder()
   ├─ 1. Create Kinguin order
   │  └─ KinguinClient.createOrder()
   │     └─ POST https://kinguin.net/api/v1/orders
   │        └─ Returns: { id, status, key (if sync) }
   │
   ├─ 2. Poll for key from Kinguin
   │  └─ KinguinClient.getOrderStatus()
   │     └─ GET https://kinguin.net/api/v1/orders/{id}
   │        └─ Retry until key ready (max 10 attempts)
   │
   ├─ 3. Encrypt key locally
   │  └─ encryptKey(licenseKey, encryptionSecret)
   │     └─ AES-256-GCM with random IV
   │        └─ Returns: base64(iv || authTag || encrypted)
   │
   ├─ 4. Upload encrypted key to R2
   │  └─ R2StorageService.storeKey()
   │     └─ R2StorageClient.uploadEncryptedKey()
   │        └─ PUT s3://bucket/orders/{orderId}/key.bin
   │           ├─ Metadata: customer email, timestamp
   │           └─ Returns: object key
   │
   ├─ 5. Store delivery log (audit trail)
   │  └─ KeyDeliveryLog entity
   │     ├─ orderId, customerEmail, objectKey
   │     ├─ status: 'stored'
   │     ├─ expiresAt: now + 15 minutes
   │     └─ Save to PostgreSQL
   │
   ├─ 6. Mark order fulfilled
   │  └─ OrdersService.markFulfilled()
   │     └─ Update: order.status = 'fulfilled'
   │
   ├─ 7. Queue delivery email
   │  └─ BullMQ job: 'sendDeliveryEmail'
   │     ├─ To: customer email
   │     ├─ Subject: Your BitLoot Order is Ready
   │     └─ Body: Download link only (not key)
   │
   └─ Done: Order fulfilled ✅

3. CUSTOMER DOWNLOADS (Frontend)
   ├─ Customer opens email
   ├─ Clicks "Download Your Key" link
   ├─ Frontend calls: GET /fulfillment/{orderId}/download-link
   │  ├─ Auth: JWT token (ownership verification)
   │  └─ Returns: KeyResponseDto with signedUrl
   │
   ├─ Frontend generates signed URL
   │  └─ R2StorageService.retrieveSignedUrl()
   │     └─ R2StorageClient.generateSignedUrl()
   │        └─ AWS SDK generates presigned GET URL
   │           └─ Valid for 15 minutes
   │
   ├─ Browser downloads from signed URL
   │  └─ GET https://r2-bucket.s3.amazonaws.com/...?X-Amz-Signature=...
   │     └─ R2 returns encrypted key file
   │
   ├─ Frontend decrypts key (optional)
   │  └─ decryptKey(encryptedData, encryptionSecret)
   │     └─ AES-256-GCM decryption with auth tag
   │        └─ Returns: plaintext key
   │
   ├─ Frontend displays key to customer
   │  └─ Copy to clipboard option
   │
   └─ Delivery complete ✅
```

---

## 📦 Task Dependency Graph

```
LAYER 1: Foundation (External Clients)
│
├─ Task 2: KinguinClient
│  ├─ Input: API key, base URL
│  └─ Output: createOrder(), getOrderStatus(), getKey()
│
├─ Task 3: Kinguin DTOs
│  ├─ Depends on: Task 2
│  └─ Output: CreateOrderDto, OrderStatusDto, etc.
│
├─ Task 4: R2StorageClient
│  ├─ Input: AWS credentials, bucket name
│  └─ Output: uploadEncryptedKey(), generateSignedUrl()
│
└─ Task 5: EncryptionUtil
   ├─ Input: plaintext key, encryption secret
   └─ Output: encryptKey(), decryptKey()

LAYER 2: Services (Orchestration)
│
├─ Task 6: FulfillmentService
│  ├─ Depends on: Tasks 2, 4, 5
│  ├─ Input: orderId (from PaymentsService)
│  └─ Output: fulfillOrder(), getOrderStatus()
│
└─ Task 7: R2StorageService
   ├─ Depends on: Tasks 4, 5
   ├─ Input: orderId, encrypted key
   └─ Output: storeKey(), retrieveSignedUrl()

LAYER 3: Integration (Update Existing)
│
└─ Task 8: Update PaymentsService
   ├─ Depends on: Task 6 (FulfillmentService)
   ├─ Modify: handleIpn() method
   └─ Change: Call FulfillmentService instead of inline

LAYER 4: API Endpoints
│
├─ Task 9: Fulfillment Controller
│  ├─ Depends on: Tasks 6, 7
│  ├─ Endpoints: GET /fulfillment/{id}/status
│  │            GET /fulfillment/{id}/download-link
│  └─ Output: FulfillmentStatusDto, KeyResponseDto
│
├─ Task 10: Kinguin Webhook Handler
│  ├─ Depends on: Task 6
│  ├─ Endpoint: POST /webhooks/kinguin
│  └─ Handles: Key ready, order failed, etc.
│
└─ Task 11: Admin Payment Endpoints
   ├─ Depends on: Tasks 6, 7
   ├─ Endpoints: GET /admin/payments (paginated)
   │            GET /admin/payments/{id}
   │            GET /admin/orders/{id}/fulfillment
   └─ Output: Payment details with audit trail

LAYER 5: Testing
│
├─ Task 12: FulfillmentService Tests
│  ├─ Depends on: Tasks 6, 8
│  ├─ Coverage: 15+ test scenarios
│  └─ Mock: KinguinClient, R2StorageClient
│
└─ Task 13: R2 Integration Tests
   ├─ Depends on: Task 7
   ├─ Coverage: 10+ test scenarios
   └─ Mock: AWS S3 API

LAYER 6: Documentation
│
└─ Task 14: Phase 3 Summary & Verification
   ├─ Depends on: All tasks 2-13
   ├─ Output: LEVEL_2_PHASE3_FINAL.md
   └─ Sign-off: All 14 tasks complete
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
│                                                             │
│ INPUT VALIDATION (Front Layer)                             │
│ ├─ JWT authentication on all user-scoped endpoints         │
│ ├─ Admin guard on admin endpoints                          │
│ ├─ HMAC verification on all webhooks                       │
│ └─ Rate limiting on key endpoints                          │
│                                                             │
│ ENCRYPTION (Data Layer)                                    │
│ ├─ AES-256-GCM encryption for keys at rest in R2           │
│ ├─ TLS 1.3 for all API communications                      │
│ ├─ HTTPS only for all endpoints                            │
│ └─ Signed URLs with 15-minute expiry                       │
│                                                             │
│ AUDIT TRAIL (Logging Layer)                                │
│ ├─ KeyDeliveryLog tracks all key access                    │
│ ├─ Webhook logs track all IPN events                       │
│ ├─ User ID logged on every operation                       │
│ └─ Timestamp on all entries                                │
│                                                             │
│ ACCESS CONTROL (Authorization Layer)                        │
│ ├─ Ownership verification (JWT user = order user)          │
│ ├─ Admin override capability (with logging)                │
│ ├─ Role-based endpoint access (user vs admin)              │
│ └─ Resource-scoped pagination (user only sees own)         │
│                                                             │
│ ERROR HANDLING (Safety Layer)                              │
│ ├─ No plaintext keys in error messages                     │
│ ├─ No secrets in logs                                      │
│ ├─ Generic error responses to users                        │
│ └─ Detailed error logging server-side only                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Key Security Guarantees:
✅ No plaintext key anywhere (encrypted at rest, in transit, never logged)
✅ Short-lived access (15-min signed URLs, no permanent links)
✅ Ownership verified (JWT + database check)
✅ Audit trail for all operations (who, what, when)
✅ Webhook deduplication (prevent replay attacks)
✅ HMAC verification (prevent tampering)
✅ Rate limiting (prevent abuse)
✅ Error messages safe (no info leakage)
```

---

## 🗄️ Database Schema (Phase 3 Additions)

```sql
-- KeyDeliveryLog Entity (New - Task 13)
CREATE TABLE "key_delivery_logs" (
  "id" UUID PRIMARY KEY,
  "orderId" UUID NOT NULL (FK -> orders.id),
  "customerEmail" VARCHAR(320) NOT NULL,
  "objectKey" VARCHAR NOT NULL,  -- s3 object path
  "status" ENUM('stored', 'accessed', 'expired', 'deleted'),
  "expiresAt" TIMESTAMP NOT NULL,
  "lastAccessedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX "idx_key_delivery_logs_order_status"
  ON "key_delivery_logs" ("orderId", "status");
CREATE INDEX "idx_key_delivery_logs_expires"
  ON "key_delivery_logs" ("expiresAt");

-- Audit Trail View (for admin dashboard)
CREATE VIEW delivery_audit_trail AS
  SELECT
    kdl.orderId,
    kdl.customerEmail,
    kdl.status,
    kdl.expiresAt,
    kdl.lastAccessedAt,
    kdl.createdAt,
    o.email as order_owner_email,
    COUNT(*) as access_count
  FROM key_delivery_logs kdl
  JOIN orders o ON kdl.orderId = o.id
  GROUP BY kdl.id, o.id;
```

---

## 🔄 State Transitions

### Order Status Machine (Phase 2 + Phase 3)

```
Phase 2: Payment States
┌─────────────────────────────────────────┐
│                                         │
created ──→ waiting ──→ confirming ──┐    │
                                    │    │
                                    ↓    │
                            ┌──────────────┤
                            │              │
                         paid/         underpaid/
                      fulfilled        failed
                            │
                            ↓
                        Terminal ✓

Phase 3: Fulfillment States (for order.fulfillmentStatus)
┌───────────────────────────────────────┐
│                                       │
pending ──→ processing ──→ fulfilled     │
    │           ↓                        │
    │         failed ───────→ Terminal   │
    │           ↑                        │
    └───────────┘                        │
         (retry)                         │
│                                       │
└───────────────────────────────────────┘
```

---

## 📊 Task Completion Checklist (Phase 3)

When **Phase 3 is complete**, all items should be ✅:

- [ ] Task 2: KinguinClient (type-safe, 0 errors, 8 tests)
- [ ] Task 3: Kinguin DTOs (validation, Swagger docs)
- [ ] Task 4: R2StorageClient (S3 wrapper, 0 errors)
- [ ] Task 5: EncryptionUtil (AES-256-GCM, 10 tests)
- [ ] Task 6: FulfillmentService (orchestration, 15 tests)
- [ ] Task 7: R2StorageService (storage logic, tested)
- [ ] Task 8: Update PaymentsService (queue integration)
- [ ] Task 9: Fulfillment Controller (3 endpoints, 0 errors)
- [ ] Task 10: Kinguin Webhook (IPN handler, verified)
- [ ] Task 11: Admin Endpoints (3+ endpoints, tested)
- [ ] Task 12: FulfillmentService Tests (15+ scenarios passing)
- [ ] Task 13: R2 Integration Tests (10+ scenarios passing)
- [ ] Task 14: Phase 3 Documentation (complete, signed off)

**Final Checks:**

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run test` → 60+/60+ passing
- [ ] End-to-end flow: Payment → Kinguin → R2 → Email ✓
- [ ] Security checklist: 8/8 verified
- [ ] Database migrations: executed successfully
- [ ] All environment variables configured

---

## 🎯 Success Criteria

**Phase 3 is successful when:**

1. **All 14 tasks implemented** ✅
2. **60+ tests passing** ✅
3. **0 type errors** ✅
4. **0 lint violations** ✅
5. **Full end-to-end flow working** ✅
   - Payment confirmed → Kinguin order → Key encrypted → R2 stored → Email sent
6. **Security verified** ✅
   - 8/8 security checklist items
   - No plaintext keys anywhere
   - Ownership verified on all endpoints
   - Audit trail complete
7. **Documentation complete** ✅
   - Architecture diagrams
   - Code examples
   - Security guarantees
   - Phase 4 readiness

---

NOW
**Phase 3 Architecture Complete ✅**

Ready to begin implementation!
