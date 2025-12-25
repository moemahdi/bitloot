# Kinguin Integration Checklist

**Start Date:** [Your Date]  
**Target Completion:** Week of [+3 weeks]  
**Status:** 🔴 Not Started

---

## PHASE 1: Setup & Sandbox Testing

### 1.1 Kinguin Account & Credentials
- [ ] Kinguin merchant account created
- [ ] Logged into Merchant Dashboard
- [ ] Generated sandbox API key ✅ Key: `_________________`
- [ ] Generated sandbox webhook secret ✅ Secret: `_________________`
- [ ] Stored in `.env.local`
- [ ] Downloaded API documentation

### 1.2 Kinguin Sandbox Setup
- [ ] Created 2-3 test offers
  - [ ] Offer 1: `_________________` 
  - [ ] Offer 2: `_________________` 
  - [ ] Offer 3: `_________________` 
- [ ] Set retail pricing with margin
- [ ] Uploaded test stock

### 1.3 Connectivity Tests
- [ ] Called `GET /health` endpoint
- [ ] Received 200 OK response
- [ ] Tested authentication
- [ ] Verified response structure

### 1.4 Environment Variables
- [ ] `.env.local` updated:
  ```
  KINGUIN_ENABLED=false
  KINGUIN_API_BASE_URL=https://sandbox.kinguin.net/api/v1
  KINGUIN_API_KEY=[key]
  KINGUIN_WEBHOOK_SECRET=[secret]
  ```
- [ ] No credentials in git
- [ ] `.env.example` updated

**Phase 1 Status:** ⏳ In Progress / ✅ Complete

---

## PHASE 2: Backend Implementation

### 2.1 Kinguin Client Library
**File:** `apps/api/src/modules/fulfillment/kinguin.client.ts`

- [ ] KinguinClient class created
- [ ] `createOrder(offerId, quantity)` implemented
  - [ ] Type-safe parameters
  - [ ] Error handling
  - [ ] Retry logic (3 attempts, exponential backoff)
- [ ] `getOrderStatus(kinguinOrderId)` implemented
- [ ] `getKey(kinguinOrderId)` implemented
- [ ] `healthCheck()` implemented
- [ ] Error handling helper
- [ ] Unit tests created (8+ tests)
  - [ ] createOrder success
  - [ ] createOrder API error
  - [ ] getOrderStatus pending → ready
  - [ ] getOrderStatus failed
  - [ ] getKey success
  - [ ] healthCheck pass
  - [ ] Retry logic
  - [ ] Error handling

**Status:** ⏳ In Progress / ✅ Complete

### 2.2 Fulfillment Service Updates
**File:** `apps/api/src/modules/fulfillment/fulfillment.service.ts`

- [ ] `fulfillOrderViaKinguin(orderId)` method added
  - [ ] Fetch order details
  - [ ] Call `kinguin.createOrder()`
  - [ ] Poll for key (10 attempts, 2s delay)
  - [ ] Encrypt key
  - [ ] Upload to R2
  - [ ] Generate signed URL
  - [ ] Queue email
  - [ ] Mark fulfilled
- [ ] Modify `fulfillOrder()` dispatcher
  ```typescript
  if (order.sourceType === 'kinguin') {
    return this.fulfillOrderViaKinguin(orderId);
  }
  ```
- [ ] Error handling comprehensive
- [ ] Logging at each step
- [ ] Tests updated/added (7+ tests)
  - [ ] fulfillOrderViaKinguin success
  - [ ] Order not found
  - [ ] Kinguin API error
  - [ ] Timeout waiting for key
  - [ ] Encryption success
  - [ ] R2 upload
  - [ ] Email notification

**Status:** ⏳ In Progress / ✅ Complete

### 2.3 Kinguin Webhook Controller
**File:** `apps/api/src/modules/webhooks/kinguin-webhook.controller.ts`

- [ ] Controller created
- [ ] `@Post('webhooks/kinguin')` endpoint
- [ ] HMAC-SHA512 signature verification
  - [ ] Extract signature from header
  - [ ] Timing-safe comparison
  - [ ] Return 401 if invalid
- [ ] Webhook idempotency
  - [ ] Log webhook
  - [ ] Check if duplicate
  - [ ] Skip if already processed
- [ ] Payload parsing
  - [ ] Extract Kinguin order ID
  - [ ] Extract key data
  - [ ] Extract timestamp
- [ ] Order update
  - [ ] Find order by kinguinOrderId
  - [ ] Update with key
  - [ ] Queue async processing
- [ ] Response
  - [ ] Return 200 OK immediately
  - [ ] Never block
- [ ] Tests (8+ tests)
  - [ ] Valid webhook processed
  - [ ] Invalid signature rejected
  - [ ] Duplicate skipped
  - [ ] Key extracted
  - [ ] Order updated
  - [ ] Email queued
  - [ ] Malformed payload handled
  - [ ] Missing order handled

**Status:** ⏳ In Progress / ✅ Complete

### 2.4 Module Registration
**File:** `apps/api/src/modules/fulfillment/fulfillment.module.ts`

- [ ] KinguinClient registered as provider
- [ ] Injected into FulfillmentService
- [ ] Webhook controller registered
- [ ] No circular dependencies

**Status:** ⏳ In Progress / ✅ Complete

### 2.5 Integration Tests
**File:** `apps/api/src/modules/fulfillment/e2e-kinguin.spec.ts`

- [ ] Full order flow tested
  - [ ] Create order with Kinguin product
  - [ ] Payment confirmed
  - [ ] Kinguin order created
  - [ ] Key received
  - [ ] Encrypted and stored
  - [ ] Email sent
  - [ ] Order marked fulfilled
- [ ] All side effects verified

**Status:** ⏳ In Progress / ✅ Complete

---

## PHASE 3: Frontend Updates

### 3.1 Order Status Page
**File:** `apps/web/src/features/orders/OrderDetails.tsx`

- [ ] Display fulfillment source badge
- [ ] Update status messages for Kinguin
- [ ] Show appropriate messaging

**Status:** ⏳ In Progress / ✅ Complete

### 3.2 Order History Table
**File:** `apps/web/src/features/account/OrderHistory.tsx`

- [ ] Add "Source" column
- [ ] Display badge (Kinguin/BitLoot)
- [ ] Responsive on mobile

**Status:** ⏳ In Progress / ✅ Complete

### 3.3 Admin Order Details (Optional)
**File:** `apps/web/src/app/admin/orders/[orderId]/page.tsx`

- [ ] Show Kinguin order ID if applicable
- [ ] Show fulfillment source
- [ ] Show key retrieval timestamp

**Status:** ⏳ In Progress / ✅ Complete

---

## PHASE 4: Database & Product Management

### 4.1 Database Migration
**File:** `apps/api/src/database/migrations/[timestamp]-add-kinguin.ts`

- [ ] Add `sourceType` to products table
- [ ] Add `kinguinOfferId` to products table
- [ ] Add `sourceType` to orders table (optional)
- [ ] Add `kinguinOrderId` to orders table (optional)
- [ ] Run locally
  - [ ] Applies cleanly
  - [ ] No data loss
  - [ ] Indexes created
- [ ] Run on staging
- [ ] Verify data integrity

**Status:** ⏳ In Progress / ✅ Complete

### 4.2 Product Entity
**File:** `apps/api/src/modules/catalog/product.entity.ts`

- [ ] Add `sourceType` column decorator
- [ ] Add `kinguinOfferId` column decorator
- [ ] Add validation for Kinguin products
- [ ] Update DTOs

**Status:** ⏳ In Progress / ✅ Complete

### 4.3 Order Entity (Optional)
**File:** `apps/api/src/modules/orders/order.entity.ts`

- [ ] Add `sourceType` column
- [ ] Add `kinguinOrderId` column

**Status:** ⏳ In Progress / ✅ Complete

### 4.4 Admin Product Form
**File:** `apps/web/src/app/admin/catalog/ProductForm.tsx`

- [ ] Add source selector (Custom/Kinguin)
- [ ] Conditional Kinguin Offer ID field
- [ ] Validation
- [ ] Test with both types

**Status:** ⏳ In Progress / ✅ Complete

### 4.5 Admin Products Table
**File:** `apps/web/src/app/admin/catalog/ProductsTable.tsx`

- [ ] Add "Source" column
- [ ] Filter by source
- [ ] Badge styling

**Status:** ⏳ In Progress / ✅ Complete

---

## TESTING & QA

### Unit Tests
- [ ] All new code has ≥90% coverage
- [ ] kinguin.client.spec.ts: 8+ tests ✅
- [ ] fulfillment.service.spec.ts: 7+ tests ✅
- [ ] kinguin-webhook.controller.spec.ts: 8+ tests ✅
- [ ] All passing

**Status:** ⏳ In Progress / ✅ Complete

### Integration Tests
- [ ] End-to-end Kinguin order test
- [ ] Webhook processing test
- [ ] Database migration test
- [ ] All passing

**Status:** ⏳ In Progress / ✅ Complete

### Manual Testing

**Setup:**
- [ ] KINGUIN_ENABLED=true in `.env.local`
- [ ] Test Kinguin product created in DB
- [ ] kinguinOfferId configured

**Order Flow:**
- [ ] Browse storefront
- [ ] Add Kinguin product to cart
- [ ] Proceed to checkout
- [ ] Enter email, accept terms
- [ ] Complete payment
- [ ] Order status shows "Processing..."

**Fulfillment:**
- [ ] Kinguin order created
- [ ] Key delivered (via webhook or polling)
- [ ] Order status → "fulfilled"
- [ ] R2 signed URL generated
- [ ] Email received
- [ ] Customer downloads key

**Edge Cases:**
- [ ] Cancel payment → order stays pending
- [ ] Kinguin API down → order fails, admin alerted
- [ ] Duplicate webhook → processed once
- [ ] Invalid signature → rejected
- [ ] Custom product still works (no regression)

**Status:** ⏳ In Progress / ✅ Complete

### Code Quality
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run format:check` → all formatted
- [ ] No `any` types
- [ ] No `@ts-ignore`

**Status:** ⏳ In Progress / ✅ Complete

---

## DEPLOYMENT & ROLLOUT

### Pre-Deployment
- [ ] All code reviewed and approved
- [ ] All tests passing (100% green)
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] Rollback plan documented

### Staging Deployment
- [ ] Deploy to staging
- [ ] Run migrations
- [ ] KINGUIN_ENABLED=false initially
- [ ] Verify no regression on custom products

### Staging Testing
- [ ] Run full manual test suite
- [ ] Test with staging Kinguin credentials
- [ ] 5+ test orders processed end-to-end
- [ ] Monitor logs
- [ ] Check email delivery

### Production Deployment
- [ ] Deploy with KINGUIN_ENABLED=false
- [ ] Zero customer impact (feature hidden)

### Gradual Rollout
- [ ] Week 1: Internal testing
- [ ] Week 2: 10% of products
  - [ ] Monitor 99%+ success rate
- [ ] Week 3: 50% of products
  - [ ] Monitor metrics
- [ ] Week 4: 100% of products

**Status:** ⏳ In Progress / ✅ Complete

---

## MONITORING & MAINTENANCE

### Logging & Alerts
- [ ] Kinguin API errors logged
- [ ] Webhook failures alerted
- [ ] Fulfillment timeouts monitored
- [ ] R2 errors tracked

**Status:** ⏳ In Progress / ✅ Complete

### Metrics
- [ ] Kinguin order success rate tracked
- [ ] Average time-to-key monitored
- [ ] Webhook delivery success rate
- [ ] Customer complaint rate

**Status:** ⏳ In Progress / ✅ Complete

---

## SIGN-OFF

**Implementation Lead:** ___________________  
**Date Started:** ___________________  
**Phase 1 Completed:** ___________________  
**Phase 2 Completed:** ___________________  
**Phase 3 Completed:** ___________________  
**Phase 4 Completed:** ___________________  
**Production Launch:** ___________________  

---

## Timeline Summary

| Phase | Hours | Target Date | Status |
|-------|-------|-------------|--------|
| Setup | 2 | Week 1 | ⏳ |
| Backend | 8 | Week 1-2 | ⏳ |
| Frontend | 3 | Week 2 | ⏳ |
| Database | 4 | Week 2-3 | ⏳ |
| Testing | 4 | Week 2-3 | ⏳ |
| **Total** | **21** | **Week 3** | ⏳ |

**Good luck! 🚀**
