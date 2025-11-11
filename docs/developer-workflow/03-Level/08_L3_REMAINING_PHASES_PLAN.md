# 🎯 Level 3 — Remaining Phases & Implementation Plan

**Status:** 📋 **READY FOR IMPLEMENTATION**  
**Date Created:** November 10, 2025  
**Completed Phases:** 1, 2, 3 + JWT Auth Layer (3/13)  
**Remaining Phases:** 4-13 (10 phases, 24 tasks)  
**Estimated Duration:** 6-8 hours  
**Complexity:** High (async coordination, webhooks, WebSocket)

---

## 📊 COMPLETION STATUS SUMMARY

### ✅ Completed (3 Phases + 1 Standalone)

| Phase | Name | Tasks | Status | Quality |
|-------|------|-------|--------|---------|
| **Phase 1** | Database Foundation | 5/5 | ✅ Complete | 5/5 Gates ✅ |
| **Phase 2** | Kinguin Module | 4/4 | ✅ Complete | 4/4 Gates ✅ |
| **Phase 3** | Fulfillment Service | 9/9 | ✅ Complete | 4/4 Gates ✅ |
| **Auth** | JWT Authentication | 3/3 | ✅ Complete | 5/5 Gates ✅ |
| **TOTAL COMPLETED** | | **21/21** | **✅ 100%** | **All passing** |

### ⏳ Remaining (10 Phases)

| Phase | Name | Tasks | Status | Est. Time |
|-------|------|-------|--------|-----------|
| **Phase 4** | BullMQ Workers | 2 | ⏳ Pending | 45 min |
| **Phase 5** | Payment Integration | 1 | ⏳ Pending | 20 min |
| **Phase 6** | Storage Helpers | 1 | ⏳ Pending | 30 min |
| **Phase 7** | WebSocket Gateway | 3 | ⏳ Pending | 1.5 hr |
| **Phase 8** | Admin API | 2 | ⏳ Pending | 45 min |
| **Phase 9** | Admin UI | 2 | ⏳ Pending | 1 hr |
| **Phase 10** | Security & Idempotency | 2 | ⏳ Pending | 45 min |
| **Phase 11** | Environment Config | 2 | ⏳ Pending | 30 min |
| **Phase 12** | E2E Testing | 3 | ⏳ Pending | 1.5 hr |
| **Phase 13** | Code Quality & Docs | 3 | ⏳ Pending | 1 hr |
| **TOTAL REMAINING** | | **24/24** | **⏳ 0%** | **~8 hrs** |

---

## 🚀 PHASE 4: BullMQ Workers (2 Tasks)

**Goal:** Implement asynchronous job processing for order fulfillment  
**Est. Duration:** 45 minutes  
**Complexity:** Medium  
**Blockers:** None (all dependencies complete)

### Task 4.1: Create `fulfillment.processor.ts`

**File:** `apps/api/src/jobs/fulfillment.processor.ts`

**Purpose:** BullMQ worker that processes fulfillment jobs

**Implementation Requirements:**

```typescript
@Processor('fulfillment')
export class FulfillmentProcessor extends WorkerHost {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly ordersService: OrdersService,
    private readonly kinguinService: KinguinService,
  ) {}

  // Job types to handle:
  // 1. 'reserve' - Start Kinguin reservation on payment confirmation
  // 2. 'kinguin.webhook' - Process incoming Kinguin webhooks
  // 3. 'retry-fulfillment' - Retry failed fulfillments with backoff
}
```

**Methods to Implement:**

1. **`processReserve(job: Job<{ orderId: string }>)`**
   - Fetch order and items
   - Call kinguin.reserve() for each item
   - Store reservationId in database
   - Update order.status = 'waiting'
   - Emit WebSocket event: `fulfillment:reserved`
   - Error handling: Retry with exponential backoff

2. **`processKinguinWebhook(job: Job<WebhookPayload>)`**
   - Extract orderId from reservationId
   - Route by webhook event type:
     - `'ready'` → Store keys in R2, generate signed URLs
     - `'delivered'` → Mark order fulfilled, send email
     - `'failed'` → Mark order failed, notify customer
   - Update Key entities with storageRef
   - Emit WebSocket event per status

3. **`onCompleted(job: Job)`**
   - Log job completion with duration
   - Emit admin event: `admin:job-completed`

4. **`onFailed(job: Job, err: Error)`**
   - Log job failure with error details
   - Route to dead-letter queue
   - Emit admin alert: `admin:job-failed`

**Queue Configuration:**

```typescript
{
  attempts: 5,                              // Max 5 retries
  backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s, 16s, 32s
  removeOnComplete: true,                   // Clean up after success
  removeOnFail: false,                      // Keep failed jobs for debugging
}
```

**Testing Strategy:**

- Unit tests: Mock fulfillmentService, ordersService, kinguinService
- Test retry logic: Simulate transient failures
- Test job lifecycle: onCompleted, onFailed hooks
- Test state transitions: created → waiting → ready → fulfilled

**Deliverable:**
- ✅ Async job processor with proper error handling
- ✅ Retry logic with exponential backoff
- ✅ WebSocket event emissions on state changes
- ✅ Comprehensive logging and observability

---

### Task 4.2: Register Processor in `app.module.ts`

**File:** `apps/api/src/app.module.ts`

**Purpose:** Wire FulfillmentProcessor into NestJS module system

**Implementation:**

```typescript
import { FulfillmentProcessor } from './jobs/fulfillment.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
    BullModule.registerQueue({ name: 'fulfillment' }),
    // ... other modules
  ],
  providers: [
    FulfillmentProcessor,  // Register processor
    // ... other providers
  ],
})
export class AppModule {}
```

**Verification:**

- ✅ Module imports BullModule
- ✅ Queue registered: 'fulfillment'
- ✅ Processor auto-attached via @Processor decorator
- ✅ Dependency injection properly configured
- ✅ Type-check passes: 0 errors
- ✅ Lint passes: 0 violations

**Deliverable:**
- ✅ Processor registered and auto-listening
- ✅ Jobs start processing on payment confirmation

---

## 🔗 PHASE 5: Payment Integration (1 Task)

**Goal:** Hook Phase 2 payment flow to trigger Phase 4 fulfillment jobs  
**Est. Duration:** 20 minutes  
**Complexity:** Low  
**Blockers:** Phase 4 must be complete

### Task 5.1: Update `PaymentsService.handleIpn()`

**File:** `apps/api/src/modules/payments/payments.service.ts`

**Current State:** Handles IPN webhook, updates order status

**Change Required:** Enqueue fulfillment job on payment confirmation

**Implementation:**

```typescript
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    @InjectQueue('fulfillment') private readonly fulfillmentQueue: Queue,
  ) {}

  async handleIpn(dto: IpnRequestDto): Promise<void> {
    // ... existing code ...

    if (dto.payment_status === 'finished') {
      // Mark order as paid
      await this.ordersService.markPaid(dto.orderId);

      // NEW: Enqueue fulfillment job
      await this.fulfillmentQueue.add(
        'reserve',
        { orderId: dto.orderId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        }
      );

      this.logger.log(
        `[Payment] Fulfillment job enqueued for order ${dto.orderId}`
      );

      // Emit WebSocket event to user
      this.fulfillmentGateway.emitPaymentConfirmed({
        orderId: dto.orderId,
        amount: dto.amount_received?.toString() ?? '0',
        currency: dto.pay_currency ?? 'BTC',
      });
    }
  }
}
```

**Changes Summary:**

1. Inject `@InjectQueue('fulfillment')`
2. After `markPaid()`, enqueue 'reserve' job
3. Add logging: job enqueued
4. Emit WebSocket event: `paymentConfirmed`

**Testing:**

- Mock Queue and verify add() called with correct params
- Verify job payload: { orderId }
- Verify no duplicate jobs on IPN replay (idempotency)

**Deliverable:**
- ✅ Payment → Fulfillment pipeline complete
- ✅ Jobs automatically start on payment confirmation
- ✅ WebSocket notifications sent to user

---

## 💾 PHASE 6: Storage Helpers (1 Task)

**Goal:** Integrate Cloudflare R2 for key storage and signed URL generation  
**Est. Duration:** 30 minutes  
**Complexity:** Low  
**Blockers:** Phase 3 StorageService exists

### Task 6.1: Extend `storage.service.ts`

**File:** `apps/api/src/modules/storage/storage.service.ts`

**Current State:** Has basic R2 client setup

**New Methods Required:**

```typescript
export class StorageService {
  /**
   * Save decrypted keys JSON to R2 and return signed URL
   * Used by fulfillment processor after Kinguin delivers
   *
   * @param orderId Order ID (used in S3 path)
   * @param codes Array of license keys/codes
   * @returns Signed URL valid for 15 minutes
   */
  async saveKeysJson(orderId: string, codes: string[]): Promise<string> {
    const objectKey = `orders/${orderId}/keys.json`;
    const body = JSON.stringify({ codes, downloadedAt: new Date().toISOString() });

    // Upload to R2
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
        Body: body,
        ContentType: 'application/json',
        Metadata: {
          'order-id': orderId,
          'timestamp': new Date().toISOString(),
        },
      })
    );

    // Generate signed URL (15 min expiry)
    return this.getSignedUrl(objectKey, 15 * 60);
  }

  /**
   * Generate signed URL for downloading keys from R2
   *
   * @param objectKey S3 object key
   * @param expirySeconds URL expiry duration
   * @returns Presigned URL
   */
  async getSignedUrl(objectKey: string, expirySeconds: number = 900): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
      }),
      { expiresIn: expirySeconds }
    );
  }

  /**
   * Delete keys from R2 (cleanup after customer downloads)
   *
   * @param orderId Order ID to delete
   */
  async deleteKeysJson(orderId: string): Promise<void> {
    const objectKey = `orders/${orderId}/keys.json`;

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: objectKey,
      })
    );

    this.logger.log(`[Storage] Deleted keys for order ${orderId}`);
  }
}
```

**Features:**

- ✅ JSON serialization with metadata
- ✅ S3 metadata tracking (order ID, timestamp)
- ✅ Signed URL with 15-minute expiry
- ✅ Cleanup method for data hygiene
- ✅ Comprehensive logging
- ✅ Error handling

**Testing:**

- Mock S3 client (AWS SDK)
- Verify JSON structure and metadata
- Verify signed URL expiry duration
- Verify cleanup deletes correct object

**Deliverable:**
- ✅ Keys stored securely in R2
- ✅ Signed URLs generated for customer downloads
- ✅ Data cleanup supported

---

## 🔌 PHASE 7: WebSocket Gateway Integration (3 Tasks)

**Goal:** Enable real-time updates via WebSocket (replaces REST polling)  
**Est. Duration:** 1.5 hours  
**Complexity:** High  
**Blockers:** JWT Auth Layer must be complete

### Task 7.1: Fix ESLint errors in `fulfillment.gateway.ts`

**File:** `apps/api/src/modules/fulfillment/fulfillment.gateway.ts`

**Status:** ✅ **ALREADY FIXED** (completed in previous session)

**Summary of Fixes Applied:**

- ✅ Replaced `isAdmin === true` with `isAdmin` (boolean comparison)
- ✅ Changed `any[]` to `Record<string, unknown>[]` (no implicit any)
- ✅ Changed `any` to `Record<string, unknown>` (result field)
- ✅ Added explicit null checks: `!== null && !== undefined`
- ✅ Changed `||` to `??` (nullish coalescing for better semantics)
- ✅ All Socket get() calls now have explicit null checks

**Verification:**
- ✅ Type-check: 0 errors
- ✅ Lint: 0 violations
- ✅ File compiles cleanly

**Deliverable:** Gateway compiles without errors

---

### Task 7.2: Register Gateway in Module System

**File:** `apps/api/src/modules/fulfillment/fulfillment.module.ts`

**Change Required:** Import WebSocketModule and register gateway

**Implementation:**

```typescript
import { Module } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { WebSocketModule } from '@nestjs/websockets';
import { FulfillmentGateway } from './fulfillment.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    WebSocketModule,  // NEW
  ],
  providers: [
    FulfillmentService,
    StorageService,
    DeliveryService,
    FulfillmentGateway,  // NEW: Register gateway
    FulfillmentController,
  ],
  exports: [FulfillmentService, StorageService, DeliveryService],
})
export class FulfillmentModule {}
```

**Also Update:** `apps/api/src/app.module.ts`

```typescript
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';

@Module({
  imports: [
    // ... other modules
    FulfillmentModule,  // Includes gateway
  ],
})
export class AppModule {}
```

**Verification:**
- ✅ Module imports properly
- ✅ Gateway auto-listens on `/fulfillment` namespace
- ✅ Type-check: 0 errors

**Deliverable:** Gateway registered and listening

---

### Task 7.3: Integrate Gateway with Fulfillment Service

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.ts`

**Change Required:** Inject FulfillmentGateway and emit events on state changes

**Implementation:**

```typescript
export class FulfillmentService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly storageService: StorageService,
    private readonly deliveryService: DeliveryService,
    private readonly fulfillmentGateway: FulfillmentGateway,  // NEW
  ) {}

  async fulfillOrder(orderId: string): Promise<FulfillmentResultDto> {
    try {
      const order = await this.ordersService.findOne(orderId);

      // Emit: fulfillment starting
      this.fulfillmentGateway.emitFulfillmentStatusChange({
        orderId,
        status: order.status,
        fulfillmentStatus: 'processing',
      });

      // ... fulfillment logic ...

      // Emit: fulfillment complete
      this.fulfillmentGateway.emitFulfillmentStatusChange({
        orderId,
        status: 'fulfilled',
        fulfillmentStatus: 'completed',
        items: result.items,
      });

      return result;
    } catch (error) {
      // Emit: error
      this.fulfillmentGateway.emitFulfillmentError({
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        severity: 'error',
        retryable: true,
      });

      throw error;
    }
  }
}
```

**Emission Points:**

- ✅ Order reserved: `emitFulfillmentStatusChange({ status: 'waiting' })`
- ✅ Keys received: `emitFulfillmentStatusChange({ status: 'ready' })`
- ✅ Order fulfilled: `emitFulfillmentStatusChange({ status: 'fulfilled' })`
- ✅ Errors: `emitFulfillmentError()`
- ✅ Webhooks: `emitWebhookReceived()`

**Deliverable:** Real-time events flowing to connected WebSocket clients

---

## 📊 PHASE 8: Admin API Endpoints (2 Tasks)

**Goal:** Create REST endpoints for admin monitoring  
**Est. Duration:** 45 minutes  
**Complexity:** Medium  
**Blockers:** Phase 3 + JWT Auth complete

### Task 8.1: Extend Admin Controller with Reservations Endpoint

**File:** `apps/api/src/modules/admin/admin.controller.ts`

**Endpoint:** `GET /admin/reservations`

**Implementation:**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)  // JWT + Admin role required
export class AdminController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly kinguinService: KinguinService,
  ) {}

  @Get('reservations')
  @ApiOperation({ summary: 'List all Kinguin reservations with status' })
  @ApiResponse({ status: 200, type: [ReservationStatusDto] })
  async getReservations(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponse<ReservationStatusDto>> {
    const skip = (pagination.page - 1) * pagination.limit;

    // Find all orders with kinguinReservationId
    const [reservations, total] = await this.ordersService.findWithReservations(
      skip,
      pagination.limit,
    );

    // Fetch status from Kinguin for each
    const statuses = await Promise.all(
      reservations.map(async (order) => ({
        orderId: order.id,
        reservationId: order.kinguinReservationId,
        status: await this.kinguinService.getDelivered(order.kinguinReservationId!),
        orderStatus: order.status,
        createdAt: order.createdAt,
      }))
    );

    return {
      data: statuses,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < total,
    };
  }
}
```

**DTO:**

```typescript
export class ReservationStatusDto {
  @ApiProperty() orderId!: string;
  @ApiProperty() reservationId!: string;
  @ApiProperty() status!: string;  // From Kinguin
  @ApiProperty() orderStatus!: string;
  @ApiProperty() createdAt!: Date;
}
```

**Verification:**
- ✅ Paginated response
- ✅ Admin guard enforces authorization
- ✅ Type-safe DTO
- ✅ Swagger documentation

**Deliverable:** Admin can view all reservations and statuses

---

### Task 8.2: Extend Admin Controller with Webhook Logs Endpoint

**File:** `apps/api/src/modules/admin/admin.controller.ts`

**Endpoints:**

1. `GET /admin/webhook-logs` - List webhook history
2. `POST /admin/webhook-logs/:id/replay` - Manually retry webhook

**Implementation:**

```typescript
@Get('webhook-logs')
@ApiOperation({ summary: 'View webhook delivery history' })
async getWebhookLogs(
  @Query() pagination: PaginationDto,
  @Query('status') status?: string,
  @Query('provider') provider?: string,
): Promise<PaginatedResponse<WebhookLogDto>> {
  const query = this.webhookLogRepo.createQueryBuilder('log');

  if (status) query.andWhere('log.status = :status', { status });
  if (provider) query.andWhere('log.provider = :provider', { provider });

  const [logs, total] = await query
    .orderBy('log.createdAt', 'DESC')
    .skip((pagination.page - 1) * pagination.limit)
    .take(pagination.limit)
    .getManyAndCount();

  return {
    data: logs.map(this.mapToDto),
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
    hasNextPage: pagination.page * pagination.limit < total,
  };
}

@Post('webhook-logs/:id/replay')
@ApiOperation({ summary: 'Manually replay a webhook' })
async replayWebhook(@Param('id') logId: string): Promise<void> {
  const log = await this.webhookLogRepo.findOneBy({ id: logId });
  if (!log) throw new NotFoundException('Webhook log not found');

  // Re-enqueue for processing
  await this.webhookQueue.add(
    'process-webhook',
    log.rawPayload,
    { removeOnComplete: true }
  );

  this.logger.log(`[Admin] Webhook ${logId} replayed`);
}
```

**Deliverable:** Admin can monitor webhooks and manually retry if needed

---

## 🎨 PHASE 9: Admin UI Pages (2 Tasks)

**Goal:** Create frontend pages for admin monitoring  
**Est. Duration:** 1 hour  
**Complexity:** Medium  
**Blockers:** Phase 8 API endpoints must be complete

### Task 9.1: Create `/admin/reservations/page.tsx`

**File:** `apps/web/app/admin/reservations/page.tsx`

**Features:**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminDataTable } from '@/components/admin-data-table';
import { reservationsControllerGetAll } from '@bitloot/sdk/clients/admin';

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reservations', page, limit],
    queryFn: () => reservationsControllerGetAll({ page, limit }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Kinguin Reservations</h1>

      <AdminDataTable
        data={data?.data ?? []}
        columns={[
          { header: 'Order ID', accessorKey: 'orderId' },
          { header: 'Reservation ID', accessorKey: 'reservationId' },
          { header: 'Status', accessorKey: 'status' },
          { header: 'Order Status', accessorKey: 'orderStatus' },
          { header: 'Created', accessorKey: 'createdAt' },
        ]}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Deliverable:** Admin dashboard displays all reservations with real-time status

---

### Task 9.2: Extend `/admin/webhooks/page.tsx`

**File:** `apps/web/app/admin/webhooks/page.tsx`

**Features:**

- List webhook deliveries with status (pending, processed, failed)
- Filter by provider and status
- Manual replay button for failed webhooks
- Pagination support

**Deliverable:** Admin can view webhook history and manually retry

---

## 🔐 PHASE 10: Security & Idempotency Verification (2 Tasks)

**Goal:** Ensure webhook security and retry resilience  
**Est. Duration:** 45 minutes  
**Complexity:** Medium  
**Blockers:** Phases 2, 4 complete

### Task 10.1: Verify Webhook Token + Idempotency

**Implementation:**

1. **Kinguin Webhook Verification** (`kinguin.controller.ts`)
   - ✅ Extract `X-KINGUIN-SIGNATURE` header
   - ✅ Verify HMAC-SHA256 signature
   - ✅ Always return 200 OK
   - ✅ Idempotency via WebhookLog unique constraint

2. **Webhook Log Deduplication** (Database)
   - ✅ Unique constraint: `(externalId, provider)`
   - ✅ Failed webhook retries use same externalId
   - ✅ Only first occurrence processed

3. **Testing:**
   - Send duplicate webhooks → verify single processing
   - Send out-of-order webhooks → verify correct final state
   - Send with invalid signature → verify 401 rejection

**Deliverable:** Webhook security validated

---

### Task 10.2: Test Retry and Backoff Logic

**Implementation:**

1. **BullMQ Retry Configuration** (`fulfillment.processor.ts`)
   - ✅ Exponential backoff: 2s, 4s, 8s, 16s, 32s
   - ✅ Max 5 attempts
   - ✅ Dead-letter queue on final failure

2. **Test Cases:**
   - Transient failure (simulate 502 from Kinguin) → retries succeed
   - Permanent failure → moves to DLQ after 5 attempts
   - Verify job state: `active` → `delayed` → `failed`

3. **Admin Monitoring:**
   - View job status via WebSocket events
   - Admin dashboard shows failed jobs queue
   - Manual retry capability

**Deliverable:** Retry logic tested and verified resilient

---

## ⚙️ PHASE 11: Environment Configuration (2 Tasks)

**Goal:** Document and configure all Level 3 secrets/variables  
**Est. Duration:** 30 minutes  
**Complexity:** Low  
**Blockers:** None

### Task 11.1: Update `.env.example`

**File:** `.env.example`

**Add Kinguin Variables:**

```bash
# === KINGUIN API (Level 3) ===
KINGUIN_API_KEY=your-kinguin-sandbox-key
KINGUIN_BASE_URL=https://sandbox.kinguin.net/api/v1
KINGUIN_WEBHOOK_SECRET=your-webhook-secret
KINGUIN_WEBHOOK_URL=https://api.bitloot.io/kinguin/webhooks

# === CLOUDFLARE R2 (Level 3) ===
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=bitloot-keys
R2_KEY=your-r2-access-key
R2_SECRET=your-r2-secret-key

# === REDIS (Already in use, verify) ===
REDIS_URL=redis://localhost:6379

# === WEBSOCKET (New) ===
WEBSOCKET_URL=ws://localhost:4000/fulfillment
FRONTEND_URL=http://localhost:3000
```

**Deliverable:** Setup instructions for new services

---

### Task 11.2: Create `LEVEL_3_SETUP.md`

**File:** `docs/developer-workflow/03-Level/LEVEL_3_SETUP.md`

**Contents:**

1. **Prerequisites**
   - Docker (PostgreSQL, Redis running)
   - Node.js 18+
   - Kinguin sandbox account
   - Cloudflare R2 account

2. **Local Setup Steps**

   ```bash
   # 1. Copy environment
   cp .env.example .env

   # 2. Configure Kinguin sandbox credentials
   # Get from: https://sandbox.kinguin.net/dashboard

   # 3. Configure Cloudflare R2
   # Get credentials from Cloudflare dashboard

   # 4. Run migrations
   npm --workspace apps/api run typeorm migration:run

   # 5. Start all services
   npm run dev:all

   # 6. Verify services
   curl http://localhost:4000/healthz
   open http://localhost:3000
   ```

3. **Testing Workflow**
   - Create test order
   - Trigger payment via NOWPayments sandbox
   - Observe fulfillment in real-time via WebSocket

4. **Troubleshooting**
   - Kinguin API timeouts
   - R2 authentication failures
   - WebSocket connection issues
   - Database migration errors

**Deliverable:** Complete setup guide for Level 3

---

## 🧪 PHASE 12: End-to-End Testing (3 Tasks)

**Goal:** Validate complete fulfillment pipeline  
**Est. Duration:** 1.5 hours  
**Complexity:** High  
**Blockers:** All previous phases complete

### Task 12.1: E2E Test - Happy Path (Order → Payment → Delivery)

**Test File:** `apps/api/test/e2e/level3-happy-path.e2e.ts`

**Scenario:**

```typescript
describe('Level 3 - Happy Path E2E', () => {
  it('should complete full fulfillment flow', async () => {
    // 1. Create product
    const product = await createTestProduct();

    // 2. Create order
    const order = await createOrder({
      email: 'test@example.com',
      items: [{ productId: product.id, quantity: 1 }],
    });

    // 3. Create payment (NOWPayments)
    const payment = await createPayment({ orderId: order.id });

    // 4. Verify payment queued fulfillment job
    const jobs = await fulfillmentQueue.getJobs();
    expect(jobs).toContainEqual(expect.objectContaining({
      name: 'reserve',
      data: { orderId: order.id },
    }));

    // 5. Simulate Kinguin webhook: keys ready
    await kinguinService.simulateWebhook({
      event: 'delivered',
      reservationId: order.kinguinReservationId,
      codes: ['GAME-KEY-123'],
    });

    // 6. Verify order marked fulfilled
    const updatedOrder = await ordersService.findOne(order.id);
    expect(updatedOrder.status).toBe('fulfilled');

    // 7. Verify signed URL generated
    const keys = await orderService.getDeliveryLink(order.id);
    expect(keys.signedUrl).toMatch(/^https:\/\/.*\.r2/);
  });
});
```

**Assertions:**
- ✅ Order created successfully
- ✅ Payment created with NOWPayments
- ✅ Fulfillment job queued
- ✅ Kinguin API called with reservation
- ✅ Keys stored in R2
- ✅ Signed URL generated
- ✅ Order marked fulfilled
- ✅ Webhook processed idempotently

**Deliverable:** Happy path verified end-to-end

---

### Task 12.2: E2E Test - Idempotency (Duplicate Webhooks)

**Test:**

```typescript
it('should handle duplicate Kinguin webhooks idempotently', async () => {
  // 1. Send webhook
  const webhook = { eventId: 'evt-123', reservationId: 'res-456' };
  await kinguinService.sendWebhook(webhook);

  // 2. Verify order fulfilled
  const order1 = await ordersService.findOne(orderId);
  expect(order1.status).toBe('fulfilled');
  const url1 = order1.deliveryLink;

  // 3. Send same webhook again (duplicate)
  await kinguinService.sendWebhook(webhook);

  // 4. Verify no duplicate processing
  const order2 = await ordersService.findOne(orderId);
  expect(order2.status).toBe('fulfilled');  // Still fulfilled
  expect(order2.deliveryLink).toBe(url1);    // Same link

  // 5. Verify webhook log shows duplicate
  const logs = await webhookLogRepo.find({ eventId: 'evt-123' });
  expect(logs.length).toBe(1);  // Only one processed
});
```

**Deliverable:** Idempotency verified

---

### Task 12.3: E2E Test - Retry on Failure

**Test:**

```typescript
it('should retry failed fulfillment with exponential backoff', async () => {
  // 1. Mock Kinguin API to fail twice
  kinguinService.simulateFailures(2);

  // 2. Enqueue fulfillment job
  await fulfillmentQueue.add('reserve', { orderId });

  // 3. Job fails and retries
  await sleep(2000);  // Initial delay

  // 4. First retry fails
  expect(fulfillmentQueue.getActiveCount()).toBe(0);
  const failedJobs = await fulfillmentQueue.getFailedCount();
  expect(failedJobs).toBe(0);  // Not yet in DLQ

  // 5. Second retry succeeds
  await sleep(4000);  // Exponential backoff

  // 6. Job completes successfully
  const completedJobs = await fulfillmentQueue.getCompletedCount();
  expect(completedJobs).toBeGreaterThan(0);

  // 7. Order marked fulfilled
  const order = await ordersService.findOne(orderId);
  expect(order.status).toBe('fulfilled');
});
```

**Deliverable:** Retry and backoff logic verified

---

## ✅ PHASE 13: Code Quality & Documentation (3 Tasks)

**Goal:** Ensure production-ready code and comprehensive docs  
**Est. Duration:** 1 hour  
**Complexity:** Low  
**Blockers:** All phases 4-12 complete

### Task 13.1: Run Full Quality Check Suite

**Command:**

```bash
npm run quality:full
```

**Expected Results:**

```
✓ PASS  Type Checking         (7-10s)
  └─ 0 TypeScript errors across all workspaces

✓ PASS  Linting               (15-20s)
  └─ 0 ESLint violations

✓ PASS  Testing               (15-20s)
  └─ All unit + E2E tests passing

✓ PASS  Building              (30-40s)
  └─ API, Web, SDK all compile successfully

Total: 70-100 seconds | Status: ALL PASSING ✅
```

**Verification Checklist:**

- ✅ 0 TypeScript compilation errors
- ✅ 0 ESLint violations (runtime safety)
- ✅ All tests pass (210+ tests)
- ✅ All workspaces build successfully
- ✅ SDK regenerated from OpenAPI

**Deliverable:** Production-ready code quality

---

### Task 13.2: Regenerate SDK from OpenAPI

**Command:**

```bash
npm run sdk:gen
```

**Verification:**

- ✅ New clients generated: Reservations, WebhookLogs, Fulfillment
- ✅ All DTOs exported correctly
- ✅ Swagger docs updated
- ✅ SDK builds without errors

**Deliverable:** Frontend SDK updated with Level 3 endpoints

---

### Task 13.3: Create `LEVEL_3_COMPLETE.md`

**File:** `docs/developer-workflow/03-Level/LEVEL_3_COMPLETE.md`

**Contents:**

1. **Completion Summary**
   - 13 phases, 44 tasks: **44/44 Complete ✅**
   - Quality gates: **5/5 Passing ✅**
   - Test coverage: **210+ tests passing ✅**

2. **Achievement Highlights**
   - Real Kinguin fulfillment pipeline operational
   - WebSocket real-time updates (90% latency reduction)
   - Async job processing with resilience
   - Comprehensive admin dashboards
   - Production-grade security and idempotency

3. **Key Metrics**
   - Code quality: 0 errors, 0 violations
   - Build time: 70-100 seconds
   - Test pass rate: 100%
   - Deployment readiness: Production ✅

4. **System Architecture**
   - Payment confirmation → Fulfillment job queued
   - BullMQ processes jobs with 5 retries, exponential backoff
   - Kinguin API reserve/give/delivered flow
   - Keys stored encrypted in R2 with signed URLs
   - WebSocket events for real-time UI updates
   - Admin dashboards for monitoring

5. **Database Schema**
   - Orders table: Added `kinguinReservationId`
   - Keys table: Tracks stored keys with R2 refs
   - WebhookLogs: Idempotency enforcement
   - Proper indexes for performance

6. **API Endpoints**
   - **Fulfillment:** GET /fulfillment/{id}/status, /download-link, /reveal
   - **Kinguin:** POST /kinguin/webhooks, GET /kinguin/status/:id
   - **Admin:** GET /admin/reservations, /webhook-logs, POST /webhook-logs/:id/replay
   - **WebSocket:** /fulfillment namespace with real-time events

7. **Security**
   - HMAC webhook verification
   - Idempotency via unique constraints
   - JWT + Admin guard on protected routes
   - Keys encrypted at rest, TLS in transit
   - No plaintext keys in logs or frontend

8. **Next Steps (Level 4)**
   - Shopping cart with multiple items
   - Discount codes and promotions
   - Order history and tracking
   - Customer reviews and ratings
   - Advanced admin reporting

**Deliverable:** Comprehensive Phase completion documentation

---

## 📋 IMPLEMENTATION SEQUENCING & TIMELINE

### Recommended Order (Optimize for dependencies):

```
Day 1 (Morning - 4 hours)
├─ Phase 4: BullMQ Workers (45 min)        ← No blockers
├─ Phase 5: Payment Integration (20 min)   ← Depends on Phase 4
├─ Phase 6: Storage Helpers (30 min)       ← No external blockers
└─ Phase 7: WebSocket Gateway (1.5 hrs)    ← Depends on JWT (done) + Phases 4-6

Day 1 (Afternoon - 4 hours)
├─ Phase 8: Admin API (45 min)             ← No blockers
├─ Phase 9: Admin UI (1 hour)              ← Depends on Phase 8
├─ Phase 10: Security Verification (45 min) ← All phases complete
└─ Phase 11: Environment Config (30 min)    ← Documentation only

Day 2 (Morning - 2 hours)
├─ Phase 12: E2E Testing (1.5 hrs)         ← All phases must complete
└─ Phase 13: Quality & Docs (1 hr)         ← Final verification

TOTAL: ~8 hours of focused development
```

---

## 🎯 SUCCESS CRITERIA (Level 3 Complete)

All of the following must be true:

### Code Quality ✅
- [ ] 0 TypeScript compilation errors
- [ ] 0 ESLint violations
- [ ] 100% test pass rate (210+ tests)
- [ ] All workspaces build successfully

### Functionality ✅
- [ ] Payment → Fulfillment job pipeline working
- [ ] Kinguin API integration (reserve/give/delivered)
- [ ] Keys stored in R2 with signed URLs
- [ ] WebSocket real-time updates operational
- [ ] Admin dashboards fully functional

### Security ✅
- [ ] Webhook HMAC verification implemented
- [ ] Idempotency enforced via unique constraints
- [ ] JWT + Admin guard on protected routes
- [ ] No plaintext keys anywhere
- [ ] Audit trail complete

### Testing ✅
- [ ] Happy path E2E test passing
- [ ] Idempotency E2E test passing
- [ ] Retry logic E2E test passing
- [ ] All unit tests passing
- [ ] Manual testing verified

### Documentation ✅
- [ ] LEVEL_3_SETUP.md complete
- [ ] LEVEL_3_COMPLETE.md written
- [ ] Inline code comments comprehensive
- [ ] API Swagger docs updated
- [ ] README updated with Level 3 features

---

## 🚀 GETTING STARTED

### Start Now - Phase 4:

1. Create `apps/api/src/jobs/fulfillment.processor.ts`
2. Register in `app.module.ts`
3. Type-check and lint
4. Move to Phase 5

**Estimated time to Phase 4 complete:** 45 minutes

**Next checkpoint:** After Phase 5 (Payment integration), verify jobs are queuing correctly

---

## 📞 REFERENCE MATERIALS

**Completed Documentation:**
- ✅ PHASE1_DATABASE_FOUNDATION_COMPLETE.md
- ✅ PHASE2_KINGUIN_INTEGRATION_COMPLETE.md
- ✅ PHASE3_FULFILLMENT_COMPLETE.md
- ✅ JWT_AUTH_COMPLETE.md

**New Documents to Create:**
- LEVEL_3_SETUP.md (Phase 11)
- LEVEL_3_COMPLETE.md (Phase 13)

**External References:**
- BullMQ Docs: https://docs.bullmq.io
- Socket.io Docs: https://socket.io/docs/
- Cloudflare R2: https://developers.cloudflare.com/r2/

---

**Status:** Ready to begin Phase 4 ✅  
**Next Session:** Start with BullMQ processor implementation  
**Estimated Completion:** ~8 hours of focused work

🚀 **Let's build Level 3!**
