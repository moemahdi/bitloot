# 🚀 BitLoot Async Job System - Complete Implementation Plan

**Status:** Analysis & Planning Phase  
**Date:** November 2025  
**Objective:** Document and verify the complete BullMQ async job processing system

---

## 📋 EXECUTIVE SUMMARY

BitLoot has implemented a **production-grade asynchronous job processing system using BullMQ and Redis** with three specialized processors:

1. **PaymentProcessor** — Payment creation via NOWPayments API
2. **FulfillmentProcessor** — Order fulfillment and key delivery
3. **CatalogProcessor** — Product catalog sync and repricing

This document outlines:
- ✅ Current system architecture
- ✅ Verification checklist
- ⚠️ Potential issues and solutions
- ✅ Implementation requirements
- ✅ Testing strategy
- ✅ Monitoring & troubleshooting

---

## 🏗️ ARCHITECTURE OVERVIEW

### Queue System

```
┌─────────────────────────────────────────────────────────┐
│                    Redis (Port 6379)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  payments queue                                 │  │
│  │  ├─ pending (waiting to be processed)          │  │
│  │  ├─ active (currently processing)              │  │
│  │  ├─ completed (successfully processed)         │  │
│  │  └─ failed (max retries exceeded)              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  fulfillment queue                              │  │
│  │  ├─ pending                                     │  │
│  │  ├─ active                                      │  │
│  │  ├─ completed                                  │  │
│  │  └─ failed                                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  catalog queue                                  │  │
│  │  ├─ pending                                     │  │
│  │  ├─ active                                      │  │
│  │  ├─ completed                                  │  │
│  │  └─ failed                                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  dlq (dead-letter queue)                        │  │
│  │  └─ Jobs that failed all retries               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
        ↑                    ↑                    ↑
        │                    │                    │
        │                    │                    │
   Enqueuers             Processors            Listeners
   (Services)         (Workers/Handlers)   (Error/Complete)
```

### Service Enqueuing Pattern

```typescript
// Service (e.g., PaymentsService) enqueues job
await this.paymentsQueue.add(
  'createInvoice',
  { orderId: '123', amount: 100.50 },
  {
    attempts: 5,                    // Retry up to 5 times
    backoff: {
      type: 'exponential',          // 2s → 4s → 8s → 16s → 32s
      delay: 2000
    },
    removeOnComplete: true,         // Delete after success
    removeOnFail: false             // Keep failed jobs for debugging
  }
);

// Returns immediately (non-blocking)
// Job processed asynchronously by processor
```

### Processor Pattern

```typescript
@Processor(QUEUE_NAMES.PAYMENTS)
export class PaymentProcessor extends WorkerHost {
  async process(job: Job): Promise<PaymentJobResult> {
    // 1. Extract job data
    const { orderId, amount } = job.data;
    
    // 2. Perform work
    const invoice = await this.nowPaymentsClient.createInvoice(...);
    
    // 3. Persist result
    await this.paymentRepo.save(payment);
    
    // 4. Return result
    return { invoiceId, status: 'completed' };
  }
}
```

---

## ✅ CURRENT IMPLEMENTATION STATUS

### Queue Configuration (`queues.ts`)

**Status:** ✅ Implemented

```typescript
export const QUEUE_NAMES = {
  PAYMENTS: 'payments',
  FULFILLMENT: 'fulfillment',
  CATALOG: 'catalog',
  DLQ: 'dlq'
};

// Global Redis connection
const BullQueues = BullModule.forRoot({
  connection: { url: process.env.REDIS_URL }
});

// Individual queue registrations
export const PaymentsQueue = BullModule.registerQueue({ name: QUEUE_NAMES.PAYMENTS });
export const FulfillmentQueue = BullModule.registerQueue({ name: QUEUE_NAMES.FULFILLMENT });
export const CatalogQueue = BullModule.registerQueue({ name: QUEUE_NAMES.CATALOG });
```

**Files:**
- ✅ `apps/api/src/jobs/queues.ts` — Queue configuration

### Processors

#### 1. PaymentProcessor
**Status:** ✅ Implemented (257 lines)

**File:** `apps/api/src/jobs/payment-processor.service.ts`

**Responsibilities:**
- ✅ Create NOWPayments invoice
- ✅ Store payment record
- ✅ Handle retries (5 attempts, exponential backoff)
- ✅ Log to WebhookLog for audit

**Job Types:**
- `createInvoice` — Create new payment

**Enqueued by:**
- `OrdersService.create()` — When order created

**Performance:**
- ~1-2 seconds per job (includes NOWPayments API call)
- Retry delay: 2s → 4s → 8s → 16s → 32s (max 2 minutes total)

**Monitoring:**
- ✅ Metrics: `payment_jobs_total`, `payment_job_duration_seconds`
- ✅ Logging: All state transitions logged

#### 2. FulfillmentProcessor
**Status:** ✅ Implemented (330 lines)

**File:** `apps/api/src/jobs/fulfillment.processor.ts`

**Responsibilities:**
- ✅ Reserve order with Kinguin API
- ✅ Retrieve keys
- ✅ Encrypt keys (AES-256-GCM)
- ✅ Store in Cloudflare R2
- ✅ Generate signed URLs (15-min expiry)
- ✅ Send delivery email
- ✅ Update order status

**Job Types:**
- `reserve` — Kinguin order reservation
- `kinguin.webhook` — Handle Kinguin webhook
- `fulfillOrder` — Complete fulfillment

**Enqueued by:**
- `PaymentsService.handleIpn()` — When payment confirmed
- `KinguinController` — On webhook received

**Performance:**
- ~3-5 seconds per job (includes Kinguin API calls + R2 upload)
- Retry delay: Same as PaymentProcessor

**Monitoring:**
- ✅ Metrics: `fulfillment_jobs_total`, `fulfillment_job_duration_seconds`
- ✅ Logging: All state transitions + WebSocket events
- ✅ WebSocket: Real-time updates to admin/user

#### 3. CatalogProcessor
**Status:** ✅ Implemented (216 lines)

**File:** `apps/api/src/jobs/catalog.processor.ts`

**Responsibilities:**
- ✅ Sync product catalog from Kinguin
- ✅ Update pricing rules
- ✅ Handle bulk repricing
- ✅ Manage pagination for large syncs

**Job Types:**
- `catalog.sync.full` — Full catalog sync (all pages)
- `catalog.sync.page` — Single page sync
- `catalog.reprice` — Bulk repricing

**Enqueued by:**
- `CatalogService.syncCatalog()` — Manual or scheduled sync
- `CatalogService.repriceBatch()` — Pricing updates

**Performance:**
- ~10-30 seconds per page (100-200 products per page)
- Full sync: ~5-10 minutes (assuming 50-100 pages)
- Retry delay: Same as others

**Monitoring:**
- ✅ Metrics: `catalog_sync_jobs_total`, `catalog_sync_products_updated`
- ✅ Logging: Batch progress and error reporting

---

## ⚙️ REGISTRATION & WIRING

### App Module Registration

**Status:** ⚠️ **INCOMPLETE** — PaymentProcessor missing

**File:** `apps/api/src/app.module.ts`

**Current:**
```typescript
providers: [
  OrdersService,
  StorageService,
  FulfillmentProcessor,    // ✅ Registered
  CatalogProcessor,         // ✅ Registered
  // ❌ PaymentProcessor missing!
]
```

**What's Missing:**
- [ ] Import `PaymentProcessor` from `./jobs/payment-processor.service`
- [ ] Add `PaymentProcessor` to `providers` array
- [ ] Ensure PaymentProcessor has `@Processor(QUEUE_NAMES.PAYMENTS)` decorator

**Fix Required:**
```typescript
import { PaymentProcessor } from './jobs/payment-processor.service';  // ← ADD THIS

@Module({
  // ...
  providers: [
    OrdersService,
    StorageService,
    PaymentProcessor,        // ← ADD THIS
    FulfillmentProcessor,
    CatalogProcessor,
  ]
})
```

### Module-Level Registration

**PaymentsModule:**
- ✅ Imports queue: `BullModule.registerQueue({ name: QUEUE_NAMES.PAYMENTS })`
- ✅ Exports: `PaymentsService, PaymentProcessorService`
- ❌ But PaymentProcessor NOT listed as provider!

**FulfillmentModule:**
- ✅ Imports queue: `BullModule.registerQueue({ name: QUEUE_NAMES.FULFILLMENT })`
- ✅ Exports: `FulfillmentService, FulfillmentProcessor`
- ✅ Processor registered as provider

**CatalogModule:**
- ✅ Imports queue: `BullModule.registerQueue({ name: QUEUE_NAMES.CATALOG })`
- ✅ Exports: `CatalogService, CatalogProcessor`
- ✅ Processor registered as provider

---

## 🔍 VERIFICATION CHECKLIST

### 1. Queue Configuration

- [ ] `QUEUE_NAMES` enum defined with: `PAYMENTS`, `FULFILLMENT`, `CATALOG`, `DLQ`
- [ ] `BullQueues` root config points to correct Redis URL
- [ ] All 3 queues registered with `BullModule.registerQueue()`
- [ ] Default job options set (attempts: 5, backoff: exponential)
- [ ] `removeOnComplete: true` for successful jobs
- [ ] `removeOnFail: false` for failed jobs (keep for debugging)

**Check command:**
```bash
grep -A5 "QUEUE_NAMES\|BullModule.forRoot\|registerQueue" apps/api/src/jobs/queues.ts
```

### 2. Processor Registration

**Payment:**
- [ ] `@Processor(QUEUE_NAMES.PAYMENTS)` decorator present
- [ ] Extends `WorkerHost`
- [ ] `async process(job: Job)` method implemented
- [ ] Registered in `PaymentsModule` as provider
- [ ] **CRITICAL:** Registered in `AppModule` as provider

**Fulfillment:**
- [ ] `@Processor(QUEUE_NAMES.FULFILLMENT)` decorator present
- [ ] Extends `WorkerHost`
- [ ] Handles 3 job types: reserve, kinguin.webhook, fulfillOrder
- [ ] Registered in `FulfillmentModule` as provider
- [ ] Registered in `AppModule` as provider

**Catalog:**
- [ ] `@Processor(QUEUE_NAMES.CATALOG)` decorator present
- [ ] Extends `WorkerHost`
- [ ] Handles 3 job types: sync.full, sync.page, reprice
- [ ] Registered in `CatalogModule` as provider
- [ ] Registered in `AppModule` as provider

**Check command:**
```bash
grep -n "PaymentProcessor\|FulfillmentProcessor\|CatalogProcessor" apps/api/src/app.module.ts
```

### 3. Job Enqueueing

**Verify services enqueue correctly:**

```typescript
// PaymentsService.create()
await this.paymentsQueue.add('createInvoice', { orderId, amount }, jobOptions);

// OrdersService.markPaidIdempotent()
// → Triggers fulfillment enqueue

// FulfillmentService.startReservation()
await this.fulfillmentQueue.add('reserve', { orderId }, jobOptions);

// CatalogService.syncCatalog()
await this.catalogQueue.add('catalog.sync.full', { maxPages }, jobOptions);
```

**Check command:**
```bash
grep -n "\.add\(" apps/api/src/modules/payments/payments.service.ts
grep -n "\.add\(" apps/api/src/modules/fulfillment/fulfillment.service.ts
grep -n "\.add\(" apps/api/src/modules/catalog/catalog.service.ts
```

### 4. Type Safety

**No TypeScript errors:**
```bash
npm run type-check
# Expected: 0 errors
```

**No ESLint violations:**
```bash
npm run lint
# Expected: 0 violations in job system files
```

### 5. Testing

**Check test files exist:**
- [ ] `payment-processor.service.spec.ts` — 20+ tests
- [ ] `fulfillment.processor.spec.ts` — 20+ tests
- [ ] `catalog.processor.spec.ts` — 15+ tests

**Check test coverage:**
```bash
npm run test -- --coverage
# Expected: >90% coverage for job files
```

### 6. Monitoring & Admin

**Check admin endpoints:**
- [ ] `GET /admin/queues` — Queue status
- [ ] `GET /admin/queues/jobs/:jobId` — Job details
- [ ] `GET /admin/queues/failed` — Failed jobs list
- [ ] `POST /admin/queues/jobs/:jobId/retry` — Retry failed job

**Check metrics:**
- [ ] `payment_jobs_total` — Counter for total jobs processed
- [ ] `fulfillment_jobs_total` — Counter for fulfillment jobs
- [ ] `catalog_sync_jobs_total` — Counter for catalog syncs
- [ ] `job_processing_duration_seconds` — Histogram for timing

### 7. Error Handling

**DLQ Handler:**
- [ ] `dlq-handler.service.ts` processes failed jobs
- [ ] Failed jobs moved to DLQ after max retries
- [ ] DLQ jobs visible in admin dashboard
- [ ] Manual retry capability from admin

---

## 🐛 KNOWN ISSUES & FIXES

### Issue 1: PaymentProcessor Not Registered in AppModule

**Status:** ⚠️ **CRITICAL**

**Problem:**
- PaymentProcessor NOT imported in `app.module.ts`
- NOT registered as provider
- PaymentProcessor never instantiated
- Payment jobs never processed!

**Solution:**
```typescript
// apps/api/src/app.module.ts

import { PaymentProcessor } from './jobs/payment-processor.service';  // ADD

@Module({
  // ...
  providers: [
    OrdersService,
    StorageService,
    PaymentProcessor,          // ADD
    FulfillmentProcessor,
    CatalogProcessor,
  ]
})
export class AppModule {}
```

### Issue 2: Queue Default Options

**Status:** ⚠️ **NEEDS VERIFICATION**

**Question:** Are default job options set correctly?

**Required:**
```typescript
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,  // Start at 2s, exponential: 2s → 4s → 8s → 16s → 32s
  },
  removeOnComplete: true,
  removeOnFail: false,  // Keep for debugging
  timeout: 30000,       // 30-second timeout per job
};
```

**Check command:**
```bash
grep -A10 "defaultJobOptions" apps/api/src/jobs/queues.ts
```

### Issue 3: Processor Error Handling

**Status:** ⚠️ **NEEDS VERIFICATION**

**Required for all processors:**
```typescript
async process(job: Job): Promise<Result> {
  try {
    // Do work
    return result;
  } catch (error) {
    this.logger.error(`Job ${job.id} failed:`, error);
    // Throw to trigger BullMQ retry mechanism
    throw error;
  }
}
```

---

## 📊 IMPLEMENTATION REQUIREMENTS

### Task 1: Fix PaymentProcessor Registration

**Files to modify:**
- `apps/api/src/app.module.ts`

**Changes:**
1. Add import for `PaymentProcessor`
2. Add `PaymentProcessor` to `providers` array

**Verification:**
```bash
npm run type-check  # Should pass
npm run lint        # Should pass
```

### Task 2: Verify Queue Configuration

**Files to check:**
- `apps/api/src/jobs/queues.ts`
- `apps/api/src/modules/payments/payments.module.ts`
- `apps/api/src/modules/fulfillment/fulfillment.module.ts`
- `apps/api/src/modules/catalog/catalog.module.ts`

**Checklist:**
- [ ] All queues registered
- [ ] Default job options set correctly
- [ ] Timeout values reasonable
- [ ] Retry strategy appropriate

### Task 3: Create Integration Test

**File to create:**
- `apps/api/src/jobs/jobs.e2e.spec.ts`

**Test scenarios:**
1. Enqueue payment job → verify processed
2. Enqueue fulfillment job → verify processed
3. Test retry mechanism (mock failure, verify retry)
4. Test DLQ (exceed max retries, verify moves to DLQ)
5. Test manual retry from DLQ

### Task 4: Add Monitoring Endpoints

**Files to modify/create:**
- `apps/api/src/modules/admin/admin.controller.ts`
- `apps/api/src/modules/admin/admin.service.ts`

**Endpoints needed:**
- `GET /admin/queues` — Queue status
- `GET /admin/queues/:queueName` — Specific queue
- `GET /admin/queues/:queueName/jobs` — Jobs in queue
- `GET /admin/queues/:queueName/failed` — Failed jobs
- `POST /admin/queues/:queueName/jobs/:jobId/retry` — Retry job

### Task 5: Add Metrics

**File to modify:**
- `apps/api/src/modules/metrics/metrics.service.ts`

**Metrics to add:**
- Counter: `payment_jobs_total`
- Counter: `fulfillment_jobs_total`
- Counter: `catalog_jobs_total`
- Histogram: `job_processing_duration_seconds`
- Gauge: `active_jobs`
- Gauge: `failed_jobs`

### Task 6: Documentation

**File to create:**
- `docs/ASYNC_JOBS_ARCHITECTURE.md`

**Sections:**
- Overview & benefits
- Queue configuration
- Processor implementation
- Monitoring & debugging
- Troubleshooting guide
- Example job flows

---

## 🧪 TESTING STRATEGY

### Unit Tests

**Payment Processor:**
```typescript
describe('PaymentProcessor', () => {
  it('should process payment job', async () => {
    const job = createMockJob({ orderId, amount });
    const result = await processor.process(job);
    expect(result.invoiceId).toBeDefined();
    expect(result.status).toBe('completed');
  });
  
  it('should handle retry on API error', async () => {
    // Mock API error
    // Verify error thrown
    // Verify job retryable
  });
  
  it('should save payment record', async () => {
    // Verify Payment entity saved
    // Verify status 'pending'
  });
});
```

### Integration Tests

```typescript
describe('Job Queue Integration', () => {
  it('should enqueue and process payment job', async () => {
    const order = createTestOrder();
    const job = await paymentsService.createPayment(order);
    await sleep(2000);  // Wait for processing
    
    const payment = await paymentRepo.findOne(order.id);
    expect(payment.status).toBe('invoiced');
    expect(payment.externalId).toBeDefined();
  });
  
  it('should retry failed job', async () => {
    // Mock service to fail first time
    // Verify retry after backoff
    // Verify success on retry
  });
  
  it('should move to DLQ after max retries', async () => {
    // Mock service to fail consistently
    // Verify job moved to DLQ after 5 attempts
  });
});
```

### E2E Tests

```bash
# Full job processing flow
npm run test:e2e -- --testNamePattern="Async Job System"
```

---

## 🚨 TROUBLESHOOTING GUIDE

### Problem: Jobs not being processed

**Diagnosis:**
```bash
# Check Redis connection
redis-cli PING
# Should return: PONG

# Check queue status
redis-cli LLEN payments
redis-cli LLEN fulfillment
redis-cli LLEN catalog
# Should show job counts

# Check processor logs
docker logs bitloot-api | grep PaymentProcessor
```

**Solutions:**
1. Verify Redis is running: `docker compose up -d redis`
2. Verify processor registered in AppModule
3. Verify queue names match between enqueue and processor
4. Check logs for processor errors

### Problem: Jobs stuck in 'active' state

**Diagnosis:**
```bash
# Check job details
redis-cli HGETALL "bull:payments:job:123"
```

**Causes:**
1. Processor crashed during job
2. Job timeout too short
3. External API timeout

**Solutions:**
1. Check processor logs for errors
2. Increase timeout in queue options
3. Add error handling in processor
4. Manual retry from admin panel

### Problem: Excessive retries

**Diagnosis:**
- Jobs retry too many times
- Temporary API failures cause waste

**Solutions:**
1. Add circuit breaker pattern
2. Implement exponential backoff correctly
3. Add fallback strategies
4. Monitor retry patterns

---

## 📈 PERFORMANCE CHARACTERISTICS

### Throughput

**Estimated job processing rates:**
- Payments: ~30-40 jobs/minute (limited by NOWPayments API)
- Fulfillment: ~15-20 jobs/minute (limited by Kinguin API)
- Catalog: ~1-5 full syncs/hour (depends on Kinguin size)

### Latency

**Typical job duration:**
- Payment creation: 1-2 seconds
- Fulfillment: 3-5 seconds
- Catalog page sync: 10-30 seconds

### Resource Usage

**Redis memory:**
- Active jobs: ~1-10 MB
- Failed jobs: ~10-50 MB (depending on retention)
- Total queue data: <100 MB

**CPU:**
- Processor thread: ~5-15% per queue
- Total: <50% with 3 queues + retries

---

## ✅ QUALITY GATES

All changes must pass:

```bash
npm run type-check      # TypeScript ✅
npm run lint            # ESLint ✅
npm run format          # Prettier ✅
npm run test            # Jest ✅
npm run build           # Webpack/Next ✅
```

---

## 📝 NEXT STEPS

1. **Immediate:** Fix PaymentProcessor registration (Task 1)
2. **Short-term:** Verify all configurations (Task 2)
3. **Development:** Create integration tests (Task 3)
4. **Enhancement:** Add monitoring endpoints (Task 4)
5. **Analysis:** Add metrics (Task 5)
6. **Documentation:** Write architecture guide (Task 6)

---

**Document Version:** 1.0  
**Status:** Complete Implementation Plan  
**Target Completion:** 1-2 days
