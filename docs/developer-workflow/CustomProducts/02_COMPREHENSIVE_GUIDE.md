# Kinguin Integration: Comprehensive Roadmap

**Status:** ✅ BACKEND COMPLETE | ⏳ Frontend Remaining | **Timeline:** 1 week remaining

---

## 🎉 Implementation Progress

### ✅ COMPLETE (Backend - ~12 hours)
| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Setup & Credentials | ✅ Done |
| Phase 2 | Backend Services (KinguinClient, Dispatcher) | ✅ Done |
| Phase 3 | Database & Entities | ✅ Done |

### ⏳ REMAINING (Frontend/Testing - ~8 hours)
| Phase | Description | Status |
|-------|-------------|--------|
| Phase 4 | Admin UI Updates | ⏳ Not Started |
| Phase 5 | Testing & Deployment | ⏳ Not Started |

---

## Executive Summary

You have a fully functional hybrid product fulfillment system. **The backend is complete** — Kinguin API integration, database schema, and fulfillment dispatcher are all implemented and passing quality gates.

**What's Done:**
- ✅ KinguinClient with real API integration
- ✅ FulfillmentService dispatcher pattern
- ✅ Database migration for sourceType
- ✅ Product/Order/OrderItem entities updated
- ✅ R2StorageClient new methods
- ✅ All quality gates passing (type-check, lint, build)

**What's Left:**
- ⏳ Admin product form source selector
- ⏳ Admin products table source column
- ⏳ Order status page source badge
- ⏳ E2E testing with real Kinguin API

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

### Order Fulfillment Flow (✅ IMPLEMENTED)

**Custom Product:**
```
Payment Confirmed
  ↓
startFulfillment(orderId)
  ↓
if (item.productSourceType === 'custom') {
  await fulfillOrderViaCustom(item)  // ✅ Implemented
  // 1. Retrieve pre-uploaded key from R2
  // 2. Generate signed URL
  // 3. Email sent to customer
  // 4. Order marked fulfilled
}
```

**Kinguin Product:**
```
Payment Confirmed
  ↓
startFulfillment(orderId)
  ↓
if (item.productSourceType === 'kinguin') {
  await fulfillOrderViaKinguin(item)  // ✅ Implemented
  // 1. Call kinguinClient.createOrder()
  // 2. Poll for key (exponential backoff)
  // 3. Encrypt + store in R2
  // 4. Email signed URL
  // 5. Order marked fulfilled
}
```

---

## ✅ Phase 1: Setup & Credentials (COMPLETE)

### 1.1 Kinguin Merchant Account
- ✅ Merchant account created
- ✅ Sandbox API key generated
- ✅ Environment variables configured:
  ```
  KINGUIN_ENABLED=true
  KINGUIN_API_BASE_URL=https://sandbox.kinguin.net/api/v1
  KINGUIN_API_KEY=xxx
  ```

### 1.2 Test Offers
- ✅ Test products created with sourceType='kinguin'
- ✅ kinguinOfferId field populated

### 1.3 Connectivity Verified
- ✅ API health endpoint tested
- ✅ Authentication working

---

## ✅ Phase 2: Backend Services (COMPLETE)

### 2.1 Kinguin Client (✅ IMPLEMENTED)

**File:** `apps/api/src/modules/fulfillment/kinguin.client.ts`

**Methods Implemented:**
1. ✅ `createOrder(offerId, quantity)` - Create order with Kinguin
2. ✅ `getOrderStatus(kinguinOrderId)` - Get order status
3. ✅ `getKey(kinguinOrderId)` - Extract key from order
4. ✅ `healthCheck()` - Verify API connectivity

**Quality Achieved:**
- ✅ No `any` types
- ✅ Comprehensive error handling
- ✅ Retry logic with exponential backoff
- Per-operation logging
- Tests: 8+ scenarios

### 2.2 Fulfillment Service Updates (✅ IMPLEMENTED)

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.ts`

**Methods Implemented:**
```typescript
// ✅ Main dispatcher
async startFulfillment(orderId: string): Promise<void> {
  const order = await this.ordersRepo.findOne({
    where: { id: orderId },
    relations: ['items', 'items.product']
  });
  
  for (const item of order.items) {
    if (item.productSourceType === ProductSourceType.KINGUIN) {
      await this.fulfillOrderViaKinguin(item);  // ✅ Implemented
    } else {
      await this.fulfillOrderViaCustom(item);   // ✅ Implemented
    }
  }
}

// ✅ Kinguin fulfillment path
async fulfillOrderViaKinguin(item: OrderItem): Promise<void>

// ✅ Custom fulfillment path  
async fulfillOrderViaCustom(item: OrderItem): Promise<void>
```

### 2.3 Status Polling (Webhook Alternative) (✅ IMPLEMENTED)

Since BitLoot is a **buyer** (not Kinguin merchant), we use polling instead of webhooks:

**Implementation:**
- ✅ Polling in `fulfillKinguinItem()` method
- ✅ 10 attempts with exponential backoff
- ✅ 2-second base delay, 1.5x multiplier
- ✅ Keys stored securely in R2

### 2.4 Module Registration (✅ COMPLETE)

**File:** `apps/api/src/modules/fulfillment/fulfillment.module.ts`

**Changes Made:**
- ✅ KinguinClient registered as provider
- ✅ Injected into FulfillmentService
- ✅ HttpModule imported for axios

---

## ✅ Phase 3: Database & Entities (COMPLETE)

### 3.1 Database Migration (✅ CREATED)

**File:** `apps/api/src/database/migrations/1764000000000-AddSourceType.ts`

**Changes Made:**

Products table:
```sql
ALTER TABLE products
ADD COLUMN "sourceType" VARCHAR(20) DEFAULT 'custom' NOT NULL,
ADD COLUMN "kinguinOfferId" VARCHAR(255) NULLABLE;
```

Orders table:
```sql
ALTER TABLE orders
ADD COLUMN "sourceType" VARCHAR(20) DEFAULT 'custom' NOT NULL,
ADD COLUMN "kinguinReservationId" VARCHAR(255) NULLABLE;
```

Order Items table:
```sql
ALTER TABLE order_items
ADD COLUMN "productSourceType" VARCHAR(20) DEFAULT 'custom' NOT NULL;
```

### 3.2 Entities Updated (✅ COMPLETE)

**Product Entity:**
```typescript
// ✅ apps/api/src/modules/catalog/entities/product.entity.ts
@Column({ type: 'varchar', default: ProductSourceType.CUSTOM })
sourceType: ProductSourceType;

@Column({ type: 'varchar', nullable: true })
kinguinOfferId?: string | null;
```

**Order Entity:**
```typescript
// ✅ apps/api/src/modules/orders/entities/order.entity.ts
@Column({ type: 'varchar', default: ProductSourceType.CUSTOM })
sourceType: ProductSourceType;

@Column({ type: 'varchar', nullable: true })
kinguinReservationId?: string | null;
```

**OrderItem Entity:**
```typescript
// ✅ apps/api/src/modules/orders/entities/order-item.entity.ts
@Column({ type: 'varchar', default: ProductSourceType.CUSTOM })
productSourceType: ProductSourceType;
```

---

## ⏳ Phase 4: Frontend Updates (REMAINING - 4 hours)

### 4.1 Admin Product Form

**File to modify:** `apps/web/src/app/admin/catalog/products/[id]/page.tsx`

**Changes needed:**
```tsx
// Add source type selector
<RadioGroup value={sourceType} onChange={setSourceType}>
  <Radio value="custom">Custom (Manual Key Upload)</Radio>
  <Radio value="kinguin">Kinguin (Auto-Fulfillment)</Radio>
</RadioGroup>

// Show Kinguin offer ID field when kinguin selected
{sourceType === 'kinguin' && (
  <FormField label="Kinguin Offer ID">
    <Input 
      value={kinguinOfferId}
      onChange={setKinguinOfferId}
      placeholder="Enter Kinguin offer ID"
    />
  </FormField>
)}
```

### 4.2 Admin Products Table

**File to modify:** `apps/web/src/app/admin/catalog/products/page.tsx`

**Changes needed:**
```tsx
// Add source column to table
<TableCell>
  {product.sourceType === 'kinguin' ? (
    <Badge variant="blue">Kinguin</Badge>
  ) : (
    <Badge variant="green">Custom</Badge>
  )}
</TableCell>
```

### 4.3 Order Status Pages

**File to modify:** `apps/web/src/features/orders/OrderDetails.tsx`

**Changes needed:**
- Source badge showing Custom vs Kinguin
- Source-specific status messages
- Loading state during Kinguin processing

### 4.4 Order History

**File to modify:** `apps/web/src/features/account/OrderHistory.tsx`

**Changes needed:**
- Source column in order table
- Color-coded badges for source type

---

## ⏳ Phase 5: Testing & Deployment (REMAINING - 4 hours)
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

