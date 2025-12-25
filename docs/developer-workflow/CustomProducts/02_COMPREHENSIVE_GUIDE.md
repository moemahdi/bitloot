# Kinguin Integration: Comprehensive Roadmap

**Status:** Ready to Execute | **Timeline:** 2-3 weeks | **Complexity:** Low-Medium

---

## Executive Summary

You have a fully functional custom product fulfillment system. This document explains how to integrate Kinguin's API alongside it without any breaking changes.

**Key Numbers:**
- New Code: ~350 lines
- Modified Code: ~100 lines  
- Risk Level: Minimal (feature flag)
- Timeline: 16-20 development hours
- Revenue Impact: 2-5x potential

---

## Architecture Overview

### Hybrid Model (Custom + Kinguin)

```
Products Table
├─ Custom Products (100+)
│  ├─ sourceType: 'custom'
│  ├─ Fulfillment: Manual (you upload key)
│  ├─ Margin: 100%
│  └─ Control: Full
│
└─ Kinguin Products (1000s)
   ├─ sourceType: 'kinguin'
   ├─ Fulfillment: Automatic (Kinguin API)
   ├─ Margin: 90% (Kinguin takes 10%)
   └─ Control: Limited to pricing rules
```

### Order Fulfillment Flow

**Custom Product:**
```
Payment Confirmed
  ↓
fulfillOrder(orderId)
  ↓
if (order.sourceType === 'custom') {
  // 1. You manually upload key to R2
  // 2. System generates signed URL
  // 3. Email sent to customer
  // 4. Order marked fulfilled
}
```

**Kinguin Product:**
```
Payment Confirmed
  ↓
fulfillOrder(orderId)
  ↓
if (order.sourceType === 'kinguin') {
  // 1. Call kinguin.createOrder()
  // 2. Poll for key (via webhook or polling)
  // 3. Encrypt + store in R2
  // 4. Email signed URL
  // 5. Order marked fulfilled
}
```

---

## Phase 1: Setup & Credentials (2 hours)

### 1.1 Kinguin Merchant Account
- Create merchant account at kinguin.com
- Generate sandbox API key
- Generate webhook signing secret
- Store in `.env.local`:
  ```
  KINGUIN_ENABLED=false
  KINGUIN_API_BASE_URL=https://sandbox.kinguin.net/api/v1
  KINGUIN_API_KEY=xxx
  KINGUIN_WEBHOOK_SECRET=xxx
  ```

### 1.2 Create Test Offers
- In Kinguin merchant dashboard (sandbox)
- Create 2-3 test offers
- Note offer IDs
- Set pricing with your desired margin

### 1.3 Verify Connectivity
- Test health endpoint with curl
- Verify authentication works
- Confirm webhook URL is accessible

---

## Phase 2: Backend Services (8 hours)

### 2.1 Kinguin Client (kinguin.client.ts)

**File location:** `apps/api/src/modules/fulfillment/kinguin.client.ts`

**Responsibilities:**
- HTTP calls to Kinguin API
- Error handling & retries
- Logging for audit trail
- Type-safe responses

**Methods to implement:**
1. `createOrder(offerId, quantity)` - Create order with Kinguin
2. `getOrderStatus(kinguinOrderId)` - Poll for order status
3. `getKey(kinguinOrderId)` - Extract key from order
4. `healthCheck()` - Verify API connectivity

**Quality requirements:**
- No `any` types
- Comprehensive error handling
- Retry logic with exponential backoff
- Per-operation logging
- Tests: 8+ scenarios

### 2.2 Fulfillment Service Updates (fulfillment.service.ts)

**Add new method:**
```typescript
async fulfillOrderViaKinguin(orderId: string): Promise<void>
```

Logic:
1. Fetch order from database
2. Call `kinguin.createOrder()` with offer ID
3. Poll for key (max 10 attempts, 2s apart)
4. Encrypt key with AES-256-GCM
5. Upload to R2 storage
6. Generate signed URL (15-min expiry)
7. Queue email notification
8. Mark order as fulfilled

**Modify existing method:**
```typescript
async fulfillOrder(orderId: string): Promise<void> {
  const order = await this.ordersService.findById(orderId);
  
  // DISPATCHER: Choose fulfillment path
  if (order.sourceType === 'kinguin') {
    return this.fulfillOrderViaKinguin(orderId);
  } else {
    // Existing custom product logic (unchanged)
  }
}
```

### 2.3 Webhook Handler (kinguin-webhook.controller.ts)

**File location:** `apps/api/src/modules/webhooks/kinguin-webhook.controller.ts`

**Endpoint:** `POST /webhooks/kinguin`

**Flow:**
1. Receive webhook from Kinguin
2. Extract signature from `x-kinguin-signature` header
3. Verify HMAC-SHA512 (timing-safe)
4. Log webhook (prevent duplicates)
5. Extract key from payload
6. Update order with key
7. Queue async processing (email, etc.)
8. Return 200 OK immediately

**Key security patterns:**
- Signature verification with timing-safe comparison
- Idempotency via webhook log table
- Async processing (don't block webhook handler)
- Error logging without sensitive data

### 2.4 Module Registration (fulfillment.module.ts)

**Changes:**
- Register KinguinClient as provider
- Inject into FulfillmentService
- Register webhook controller

---

## Phase 3: Frontend Updates (3 hours)

### 3.1 Order Status Pages

**File:** `apps/web/src/features/orders/OrderDetails.tsx`

**Add:**
- Fulfillment source badge (Custom vs Kinguin)
- Source-specific status messages
- Loading state during Kinguin processing

### 3.2 Order History

**File:** `apps/web/src/features/account/OrderHistory.tsx`

**Add:**
- Source column in order table
- Color-coded badges

### 3.3 Admin Order Details

**File:** `apps/web/src/app/admin/orders/[orderId]/page.tsx`

**Add:**
- Kinguin order ID display (if applicable)
- Link to Kinguin dashboard
- Fulfillment source visibility

---

## Phase 4: Database & Admin (4 hours)

### 4.1 Database Migration

**File:** `apps/api/src/database/migrations/[timestamp]-add-kinguin.ts`

**Changes:**

Products table:
```sql
ALTER TABLE products
ADD COLUMN sourceType ENUM('custom', 'kinguin') DEFAULT 'custom' NOT NULL,
ADD COLUMN kinguinOfferId VARCHAR(255) NULLABLE;
```

Orders table (optional but recommended):
```sql
ALTER TABLE orders
ADD COLUMN sourceType ENUM('custom', 'kinguin') DEFAULT 'custom' NOT NULL,
ADD COLUMN kinguinOrderId VARCHAR(255) NULLABLE;
```

**Execution:**
- Run migration locally first
- Verify no data loss
- Verify indexes created
- Test existing products

### 4.2 Entity Updates

**Product entity:**
```typescript
@Column({ 
  type: 'enum', 
  enum: ['custom', 'kinguin'], 
  default: 'custom' 
})
sourceType: 'custom' | 'kinguin';

@Column({ type: 'varchar', length: 255, nullable: true })
kinguinOfferId?: string;

// Validation
@ValidateIf(obj => obj.sourceType === 'kinguin')
@IsNotEmpty({ message: 'Kinguin products must have an offer ID' })
kinguinOfferId?: string;
```

**Order entity:**
```typescript
@Column({ 
  type: 'enum', 
  enum: ['custom', 'kinguin'], 
  default: 'custom' 
})
sourceType: 'custom' | 'kinguin';

@Column({ type: 'varchar', length: 255, nullable: true })
kinguinOrderId?: string;
```

### 4.3 Admin Product Form

**File:** `apps/web/src/app/admin/catalog/ProductForm.tsx`

**Add:**
- Radio selector: Custom vs Kinguin
- Conditional field: Kinguin Offer ID
- Validation for source type

### 4.4 Admin Products Table

**File:** `apps/web/src/app/admin/catalog/ProductsTable.tsx`

**Add:**
- Source column with badge
- Filter dropdown (Custom/Kinguin/All)
- Sort by source (optional)

---

## Phase 5: Optional - Catalog Sync (4-6 hours)

### 5.1 Kinguin Catalog Client

Extend with:
- `fetchOffers(page, pageSize)` - Paginated offer listing
- `getOfferDetails(offerId)` - Full offer information
- Rate limiting compliance

### 5.2 BullMQ Catalog Sync Job

Job: `catalog-sync`

Process:
1. Fetch all Kinguin offers (paginated, 50/batch)
2. For each offer:
   - Upsert product to database
   - Set sourceType='kinguin'
   - Apply pricing rules
   - Update search index
3. Return stats (added, updated, failed)

### 5.3 Admin Endpoint

`POST /admin/catalog/sync-kinguin`

Triggers sync job and returns job ID for progress polling.

### 5.4 Frontend Sync Controls

Display:
- Sync button
- Progress bar (if running)
- Last sync timestamp
- Sync history

---

## Testing Strategy

### Unit Tests (150+ tests)

**kinguin.client.spec.ts:**
- createOrder success/failure
- getOrderStatus pending/ready/failed
- getKey success/failure
- healthCheck pass/fail
- Retry logic validation
- Error handling edge cases

**fulfillment.service.spec.ts (Kinguin branch):**
- fulfillOrderViaKinguin success
- API failures handled correctly
- Key extraction from responses
- Encryption verification
- R2 upload verification
- Email notification queued
- Order status updates
- Timeout handling

**kinguin-webhook.controller.spec.ts:**
- Valid webhook processed
- Invalid signature rejected (401)
- Duplicate webhook deduplicated
- Key extraction from payload
- Order updates triggered
- Email queued
- Malformed payload handled
- Missing order handled gracefully

### Integration Tests (10+ scenarios)

**End-to-end Kinguin order:**
1. Create order with Kinguin product
2. Payment confirmed
3. Kinguin order created
4. Webhook received
5. Key stored in R2
6. Email sent
7. Order marked fulfilled
8. Customer can download

### Manual Testing

**Sandbox Environment:**

Kinguin setup:
- [ ] Create test offers in Kinguin sandbox
- [ ] Verify API key works
- [ ] Webhook secret configured

Custom products (regression test):
- [ ] Create and fulfill custom product order
- [ ] Verify manual delivery still works
- [ ] Email sent correctly

Kinguin products (new feature):
- [ ] Create Kinguin product in admin
- [ ] Create order as customer
- [ ] Complete payment
- [ ] Order marked fulfilled
- [ ] Key downloaded successfully
- [ ] Key decrypts properly

Edge cases:
- [ ] Kinguin API down → order queued for retry
- [ ] Duplicate webhook → processed once
- [ ] Invalid signature → rejected
- [ ] Timeout waiting for key → alert admin

---

## Deployment Strategy

### Stage 1: Code Deploy with Feature Flag OFF
```
KINGUIN_ENABLED=false
```
- No user impact
- Code exists but disabled
- Internal testing only

### Stage 2: Internal Testing (1 week)
```
KINGUIN_ENABLED=true (staging only)
```
- Team creates test orders
- Monitor logs for errors
- Verify fulfillment works

### Stage 3: Gradual Rollout
Week 1: 10% of products
Week 2: 50% of products  
Week 3: 100% of products

Monitor success rate (target: 99%+) at each stage.

### Stage 4: Full Launch
All products can be Kinguin or custom
Customer can't tell the difference
Automatic fulfillment for Kinguin products

---

## Risk Mitigation

### Risk: "Kinguin API Goes Down"
**Mitigation:**
- Automatic retry (3x with exponential backoff)
- Orders marked "pending" on failure
- Admin can manually deliver as fallback
- Same as custom products

### Risk: "Webhook Signature Verification Fails"
**Mitigation:**
- Timing-safe comparison prevents timing attacks
- Test signature verification in sandbox first
- Logging all webhook attempts
- Can regenerate secret if needed

### Risk: "Database Migration Breaks"
**Mitigation:**
- Test locally first
- Backup before running
- Migration is additive (no deletions)
- Existing products default to 'custom'
- Can rollback migration if needed

### Risk: "Custom Products Stop Working"
**Mitigation:**
- Code path is separate (if/else branch)
- Existing logic never modified
- Comprehensive regression tests
- Easy rollback (disable KINGUIN_ENABLED)

---

## Monitoring & Maintenance

### Metrics to Track
- Kinguin order success rate (target: 99%+)
- Average time-to-key (target: <15s)
- Webhook delivery success rate (target: 99.5%+)
- Customer complaint rate
- Failed order rate

### Alerts to Set Up
- Kinguin API error rate > 5%
- Webhook delivery failures > 1%
- Order fulfillment timeout > 30s
- Signature verification failures

### Logs to Review
- Weekly: Kinguin API errors
- Weekly: Webhook delivery status
- Monthly: Offer price synchronization
- Quarterly: Kinguin API changelog updates

---

## Timeline Estimate

| Phase | Tasks | Hours | Timeline |
|-------|-------|-------|----------|
| Phase 1 | Setup + Credentials | 2 | Week 1 |
| Phase 2 | Backend Services | 8 | Week 1-2 |
| Phase 3 | Frontend Updates | 3 | Week 2 |
| Phase 4 | Database + Admin | 4 | Week 2-3 |
| Phase 5 | Catalog Sync (opt) | 5 | Week 3+ |
| Testing | Unit + Integration | 4 | Week 2-3 |
| **Total** | **All required phases** | **21 hours** | **2-3 weeks** |

---

## Success Criteria

### By End of Week 1
- ✅ Kinguin credentials configured
- ✅ KinguinClient implemented and tested
- ✅ Sandbox orders created via API

### By End of Week 2
- ✅ Webhook handler working
- ✅ Both custom + Kinguin orders fulfill end-to-end
- ✅ 10+ manual test orders processed successfully
- ✅ Database migration applied

### By End of Week 3
- ✅ Admin UI updated
- ✅ Feature flag testable (true/false)
- ✅ All tests passing (100+ tests)
- ✅ Staging deployment successful
- ✅ Ready for production launch

---

## Key Advantages You Have

1. **Existing fulfillment pipeline** - R2 storage, encryption, email all work
2. **Phase 3 plan exists** - Architecture already specified
3. **Proven patterns** - HMAC verification (NOWPayments) same as Kinguin
4. **Feature flag safety** - Zero risk to production
5. **Hybrid model** - Keep custom products forever

---

## Conclusion

You're not behind. You've built the right foundation first. Now you're adding Kinguin as a second fulfillment method, not replacing your existing system.

**This is the correct order of operations.** Most teams would ship broken products. You're being deliberate and safe.

Start with Phase 1 this week. You'll have Kinguin orders live in production within 2-3 weeks.

