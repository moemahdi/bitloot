# 🚀 Level 3 Execution Plan — From Stub to Real Kinguin Fulfillment

**Status:** 📋 Ready to Implement  
**Date:** November 10, 2025  
**Duration (Est.):** 6-8 hours  
**Complexity:** High (async coordination, webhooks, storage)

---

## 📊 Quick Overview

Level 3 transforms BitLoot's fulfillment from **stub/demo** to **real Kinguin integration**, with:

- ✅ Real crypto payment → automatic fulfillment pipeline
- ✅ Kinguin API integration (reserve/give/delivered)
- ✅ Secure webhook handling with HMAC-like verification
- ✅ Asynchronous job queuing (BullMQ)
- ✅ Cloudflare R2 key storage with signed URLs
- ✅ Admin dashboards for monitoring
- ✅ Idempotency & retry resilience

**Key Principle:** Payment is fast (Phase 1–2), fulfillment is queued (Phase 3).

---

## 🎯 Task Breakdown (44 Tasks, 13 Phases)

### Phase 1: Database Foundation (5 Tasks)
**Goal:** Add tables and columns for Kinguin reservations and key tracking

- **Task 1.1** ✅ Create `keys.entity.ts` 
- **Task 1.2** ✅ Create database migration (`add-keys-reservation.ts`)
- **Task 1.3** ✅ Extend `order.entity.ts` with `kinguinReservationId`
- **Task 1.4** ✅ Register Key entity in `data-source.ts`
- **Task 1.5** ✅ Run migration and verify schema

**Deliverable:** Orders can link to Kinguin reservations; keys are tracked per order item.

---

### Phase 2: Kinguin Module (4 Tasks)
**Goal:** Create API client and webhook receiver for Kinguin

- **Task 2.1** ✅ Create `kinguin.module.ts`
- **Task 2.2** ✅ Implement `kinguin.service.ts` (reserve/give/getDelivered)
- **Task 2.3** ✅ Implement `kinguin.controller.ts` (webhook endpoint)
- **Task 2.4** ✅ Create Kinguin DTOs (request/response/webhook)

**Deliverable:** API can call Kinguin sandbox and receive webhooks securely.

---

### Phase 3: Fulfillment Service (3 Tasks)
**Goal:** Orchestrate the reservation → delivery → storage → email flow

- **Task 3.1** ✅ Create `fulfillment.module.ts`
- **Task 3.2** ✅ Implement `fulfillment.service.ts` (startReservation / finalizeDelivery)
- **Task 3.3** ✅ Extend `orders.service.ts` with helpers (setReservationId, findByReservation, fulfill)

**Deliverable:** Service can coordinate multi-step fulfillment with error handling.

---

### Phase 4: BullMQ Workers (2 Tasks)
**Goal:** Process fulfillment jobs asynchronously

- **Task 4.1** ✅ Create `fulfillment.processor.ts`
- **Task 4.2** ✅ Register processor in `app.module.ts`

**Deliverable:** Queue jobs are processed with retries and backoff.

---

### Phase 5: Payment Integration (1 Task)
**Goal:** Hook Level 2 payment flow to trigger Level 3 fulfillment

- **Task 5.1** ✅ Update `PaymentsService.handleIpn()` to enqueue fulfillment job

**Deliverable:** Payment finished → fulfillment starts automatically.

---

### Phase 6: Storage Helpers (1 Task)
**Goal:** Save keys to R2 and generate signed URLs

- **Task 6.1** ✅ Extend `storage.service.ts` with `saveKeysJson()` and `getSignedUrl()`

**Deliverable:** Keys stored securely; customers get link-only delivery.

---

### Phase 7: Admin API (2 Tasks)
**Goal:** Endpoints for monitoring reservations and webhooks

- **Task 7.1** ✅ Extend `admin.controller.ts` with `/admin/reservations`
- **Task 7.2** ✅ Extend `admin.controller.ts` with `/admin/webhook-logs` and replay

**Deliverable:** Admin can query fulfillment state and webhook history.

---

### Phase 8: Admin UI (2 Tasks)
**Goal:** Frontend pages for monitoring

- **Task 8.1** ✅ Create `apps/web/app/admin/reservations/page.tsx`
- **Task 8.2** ✅ Create/extend `apps/web/app/admin/webhooks/page.tsx`

**Deliverable:** Admin dashboards visible and functional.

---

### Phase 9: Security & Idempotency (2 Tasks)
**Goal:** Verify webhook security and retry resilience

- **Task 9.1** ✅ Verify webhook token + idempotency implementation
- **Task 9.2** ✅ Test retry and backoff logic

**Deliverable:** No duplicate deliveries; transient errors auto-retry.

---

### Phase 10: Environment Configuration (2 Tasks)
**Goal:** Document and configure Kinguin credentials

- **Task 10.1** ✅ Update `.env.example` with Kinguin variables
- **Task 10.2** ✅ Create `LEVEL_3_SETUP.md` documentation

**Deliverable:** Setup is reproducible and documented.

---

### Phase 11: End-to-End Testing (3 Tasks)
**Goal:** Validate complete fulfillment flow

- **Task 11.1** ✅ E2E test: happy path (order → payment → delivery)
- **Task 11.2** ✅ E2E test: idempotency (duplicate webhooks)
- **Task 11.3** ✅ E2E test: retry on failure

**Deliverable:** All critical paths tested and working.

---

### Phase 12: Code Quality (2 Tasks)
**Goal:** Ensure production-ready code

- **Task 12.1** ✅ Type check & lint all Level 3 code
- **Task 12.2** ✅ Regenerate SDK from OpenAPI

**Deliverable:** 0 TypeScript errors, 0 lint violations; SDK updated.

---

### Phase 13: Final Verification (3 Tasks)
**Goal:** Complete and document

- **Task 13.1** ✅ Run full quality check suite (`npm run quality:full`)
- **Task 13.2** ✅ Create `LEVEL_3_COMPLETE.md`
- **Task 13.3** ✅ Prepare Level 4 handoff

**Deliverable:** Level 3 complete; ready for Level 4.

---

## 📋 Phase-by-Phase Instructions

### Phase 1: Database Foundation

**Files to Create/Modify:**

1. `apps/api/src/modules/orders/key.entity.ts` (new)
2. `apps/api/src/database/migrations/1720000000000-add-keys-reservation.ts` (new)
3. `apps/api/src/modules/orders/order.entity.ts` (modify)
4. `apps/api/src/database/data-source.ts` (modify)

**Steps:**

```bash
# 1. Create Key entity
touch apps/api/src/modules/orders/key.entity.ts

# 2. Create migration
npm --workspace apps/api run typeorm migration:generate -n add-keys-reservation

# 3. Register entity and run migration
npm run type-check  # verify no errors
npm --workspace apps/api run typeorm migration:run
```

**What It Does:**
- Adds `kinguinReservationId` (varchar) to orders
- Creates `keys` table (id, orderItemId FK, storageRef, viewedAt, createdAt)
- Adds indexes for query performance
- Establishes 1:N relationship (order → keys)

---

### Phase 2: Kinguin Module

**Files to Create/Modify:**

1. `apps/api/src/modules/kinguin/kinguin.module.ts` (new)
2. `apps/api/src/modules/kinguin/kinguin.service.ts` (new)
3. `apps/api/src/modules/kinguin/kinguin.controller.ts` (new)
4. `apps/api/src/modules/kinguin/dto/` (new folder + DTOs)

**Key API Calls:**

```
POST   /reservations              → reserve product
POST   /reservations/{id}/give    → give/deliver reserved product
GET    /reservations/{id}/delivered → fetch delivered codes
```

**Webhook Events to Handle:**

```
reserve   → confirmed reservation created
give      → product given to customer
delivered → codes delivered (final)
cancel    → reservation cancelled
```

**Implementation Notes:**
- Bearer token auth (sandbox uses mock token for testing)
- All methods include error handling and logging
- Webhook verification via `X-Auth-Token` header
- Always return 200 OK (idempotency enforcement)

---

### Phase 3: Fulfillment Service

**Files to Create/Modify:**

1. `apps/api/src/modules/fulfillment/fulfillment.module.ts` (new)
2. `apps/api/src/modules/fulfillment/fulfillment.service.ts` (new)
3. `apps/api/src/modules/orders/orders.service.ts` (modify + 3 new methods)

**Core Methods:**

```typescript
// Start fulfillment (called on payment finished)
startReservation(orderId: string)
  ├─ Fetch order
  ├─ Call kinguin.reserve()
  ├─ Save reservationId
  └─ Call kinguin.give() (optimistic)

// Complete delivery (called on webhook "delivered")
finalizeDelivery(reservationId: string)
  ├─ Fetch order by reservation
  ├─ Call kinguin.getDelivered()
  ├─ Save keys to R2 (→ storageRef)
  ├─ Create Key records
  ├─ Mark order fulfilled
  └─ Send email with signed URL
```

**Helpers in OrdersService:**

```typescript
setReservationId(orderId, reservationId)     // update orders table
findByReservation(reservationId)              // query by reservation
fulfill(orderId, signedUrl)                   // mark completed
```

---

### Phase 4: BullMQ Workers

**Files to Create/Modify:**

1. `apps/api/src/jobs/fulfillment.processor.ts` (new)
2. `apps/api/src/app.module.ts` (modify - register processor)

**Queue Configuration:**

```typescript
{
  attempts: 5,                    // retry up to 5 times
  backoff: {
    type: 'exponential',
    delay: 1000                  // start at 1s, exponential growth
  },
  removeOnComplete: true          // cleanup after success
}
```

**Job Types:**

- `reserve` → startReservation
- `kinguin.webhook` → handle webhook events based on eventType

---

### Phase 5: Payment Integration

**File to Modify:**

- `apps/api/src/modules/payments/payments.service.ts`

**Change Location:**

In `handleIpn()` method, after `orders.markPaid(orderId)`:

```typescript
// Inject fulfillmentQueue in constructor
if (payload.payment_status === 'finished') {
  await this.fulfillmentQueue.add(
    'reserve',
    { orderId: payment.orderId },
    { attempts: 5, backoff: { type: 'exponential', delay: 1000 } }
  );
  this.logger.log(`[Payment] Fulfillment enqueued for order ${payment.orderId}`);
}
```

---

### Phase 6: Storage Helpers

**File to Modify:**

- `apps/api/src/modules/storage/storage.service.ts`

**New Methods:**

```typescript
async saveKeysJson(orderId: string, codes: string[]): Promise<string>
  // Return: R2 object key (e.g., "keys/uuid.json")

async getSignedUrl(storageRef: string, expiresIn: number): Promise<string>
  // Return: Full HTTPS signed URL with expiry
```

---

### Phase 7: Admin API

**File to Modify:**

- `apps/api/src/modules/admin/admin.controller.ts`

**New Endpoints:**

```
GET  /admin/reservations?reservationId=&limit=50&offset=0
     → Returns paginated orders with kinguinReservationId

GET  /admin/webhook-logs?provider=kinguin&limit=50&offset=0
     → Returns paginated webhook events

POST /admin/webhook-logs/{id}/replay
     → Manually requeue webhook job
```

---

### Phase 8: Admin UI

**Files to Create:**

1. `apps/web/app/admin/reservations/page.tsx`
2. `apps/web/app/admin/webhooks/page.tsx` (extend existing)

**Features:**

- Table display with pagination
- Search/filter by reservation ID or event type
- Real-time status indicators
- Replay button for failed webhooks
- Raw payload viewer (modal)
- Responsive design + dark mode

---

### Phase 9: Security & Idempotency

**Verification Checklist:**

```
✓ X-Auth-Token verification in KinguinController
✓ WebhookLog unique constraint on (externalId, eventType)
✓ Raw body captured before JSON parsing
✓ No secrets in frontend bundle
✓ Secrets stored in .env only
✓ HTTPS enforced in production
✓ Retry logic with backoff
```

---

### Phase 10: Environment Configuration

**File to Create/Modify:**

- `.env.example` (add Kinguin section)
- `docs/LEVEL_3_SETUP.md` (new setup guide)

**New Environment Variables:**

```
KINGUIN_CLIENT_ID=
KINGUIN_CLIENT_SECRET=
KINGUIN_BASE_URL=https://api-sandbox.kinguin.net
KINGUIN_WEBHOOK_SECRET=
```

---

### Phase 11: End-to-End Testing

**Test Scenarios:**

1. **Happy Path**
   - Create order → payment → fulfillment → keys delivered → email sent
   
2. **Idempotency**
   - Send duplicate webhook → verify single processing
   
3. **Retry**
   - Mock Kinguin 500 error → verify auto-retry → verify success

**Testing Commands:**

```bash
# Scenario 1: Order
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productId":"demo"}'

# Scenario 1: Payment
curl -X POST http://localhost:4000/payments/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"...", ...}'

# Scenario 1: IPN
curl -X POST http://localhost:4000/payments/ipn \
  -H "X-NOWPAYMENTS-SIGNATURE: ..." \
  -d '{"payment_status":"finished",...}'

# Scenario 2: Kinguin webhook (duplicate)
curl -X POST http://localhost:4000/kinguin/webhook \
  -H "X-Auth-Token: $KINGUIN_WEBHOOK_SECRET" \
  -d '{"reservationId":"123","event":"delivered",...}'
# Send same again → should return 200, not reprocess
```

---

### Phase 12: Code Quality

**Quality Check Steps:**

```bash
# Type check
npm run type-check

# Lint (should be 0 errors)
npm run lint --max-warnings 0

# Format
npm run format:fix

# Tests
npm run test

# Build all
npm run build

# Regenerate SDK
npm run sdk:gen

# Full suite
npm run quality:full
```

---

### Phase 13: Final Verification

**Completion Checklist:**

- [ ] All 5 quality gates passing (type, lint, format, test, build)
- [ ] 0 TypeScript errors
- [ ] 0 ESLint violations
- [ ] SDK regenerated with Kinguin + admin endpoints
- [ ] E2E tests passing (happy path, idempotency, retry)
- [ ] Admin pages rendering correctly
- [ ] Documentation complete
- [ ] No secrets in code/logs
- [ ] Ready for Level 4

---

## 🔐 Security Considerations

### Webhook Security

- **Token Verification:** X-Auth-Token header compared against KINGUIN_WEBHOOK_SECRET
- **Raw Body Capture:** Ensure middleware captures before JSON parsing
- **Idempotency:** WebhookLog unique constraint on (externalId, eventType)
- **Always 200 OK:** Prevents webhook retry storms

### Secret Management

- All API keys in `.env` only (never committed)
- No secrets in frontend code
- Bearer tokens kept server-side
- Signed URLs short-lived (15 min expiry)

### Data Protection

- Keys stored encrypted in R2
- Never plaintext in logs, UI, or email
- Delivery via signed URL only
- Audit trail in Keys table (viewedAt)

---

## ⚡ Performance Optimization

### Database Indexes

- `orders.kinguinReservationId` (for fast reservation lookups)
- `keys.orderItemId` (for order → keys relations)
- `webhook_logs.externalId` (unique constraint for idempotency)

### Async Processing

- IPN webhook is synchronous but returns 200 immediately
- Fulfillment job is queued for async processing
- Workers scale independently of API

### Caching Opportunities

- Kinguin token refresh cached (implement TTL)
- R2 signed URLs generated on-demand (short expiry)

---

## 📚 Expected Deliverables

**By End of Level 3:**

1. ✅ Database schema complete (keys table, reservation tracking)
2. ✅ Kinguin API integration (reserve/give/delivered endpoints)
3. ✅ Secure webhook receiver (token verification, idempotency)
4. ✅ Fulfillment service (orchestration, retry logic)
5. ✅ BullMQ workers (async job processing)
6. ✅ R2 key storage + signed URLs
7. ✅ Admin dashboards (reservations, webhook logs)
8. ✅ E2E workflow (order → payment → fulfillment → delivery)
9. ✅ Full code quality (0 errors, all tests passing)
10. ✅ Complete documentation

---

## 🚀 Ready to Start?

```bash
# 1. Review 03-Level.md carefully ✓
# 2. Create this task list ✓
# 3. Start Phase 1 (Database)
npm --workspace apps/api run typeorm migration:generate -n add-keys-reservation

# 4. Progress through phases sequentially
# 5. Run quality checks after each phase
npm run quality:full

# 6. Document as you go
# 7. Complete!
```

---

**Estimated Timeline:** 6-8 hours  
**Complexity:** 🔴🔴🔴 High (async coordination, multiple integrations)  
**Skillset Required:** TypeScript, NestJS, BullMQ, Webhooks, Database migrations

**Let's build Level 3! 🎯**
