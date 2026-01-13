# Retry Fulfillment Feature Documentation

**Date Implemented:** January 13, 2026  
**Status:** ✅ Complete & Production-Ready

---

## Overview

The Retry Fulfillment feature allows administrators to manually trigger fulfillment for orders that are stuck in `paid` status due to missed webhooks, network issues, or infrastructure failures.

---

## Problem Statement

### Why Orders Get Stuck

Orders can become stuck in `paid` status (payment confirmed but keys not delivered) due to:

| Cause | Description |
|-------|-------------|
| **Webhook missed** | Kinguin sent order status webhook but server was restarting/unavailable |
| **Network timeout** | Key fetch started but connection dropped mid-request |
| **R2 upload failed** | Key fetched from Kinguin but Cloudflare R2 was temporarily unavailable |
| **BullMQ crash** | Worker process crashed during job execution |
| **ngrok tunnel expired** | Development environment webhook endpoint became unreachable |

### Business Impact

- Customer paid but didn't receive their game key
- Manual intervention required to identify and fix stuck orders
- Poor customer experience and potential refund requests

---

## Solution Architecture

### Components Modified

1. **Backend API** (`apps/api`)
   - `AdminController` - New `POST /admin/orders/:id/retry-fulfillment` endpoint
   - `AdminService` - Retry logic with validation
   - `FulfillmentProcessor` - Enhanced with Kinguin polling
   - `FulfillmentService` - Fixed order ID usage, added recovery logic

2. **Frontend** (`apps/web`)
   - `admin/orders/[id]/page.tsx` - Added "Retry Fulfillment" button

3. **SDK** (`packages/sdk`)
   - Regenerated with new `adminControllerRetryFulfillment` method

---

## Implementation Details

### 1. Backend Endpoint

**File:** `apps/api/src/modules/admin/admin.controller.ts`

```typescript
@Post('orders/:id/retry-fulfillment')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiOperation({ summary: 'Retry fulfillment for stuck order' })
async retryFulfillment(
  @Param('id') orderId: string,
  @Body() dto: RetryFulfillmentDto,
): Promise<RetryFulfillmentResponseDto> {
  return this.adminService.retryFulfillment(orderId, dto.reason);
}
```

**Allowed Statuses for Retry:**
- `paid` - Payment confirmed, fulfillment pending
- `failed` - Previous fulfillment attempt failed
- `waiting` - Waiting for confirmations
- `confirming` - Payment confirmations in progress

### 2. Kinguin Order Recovery

**Problem:** If Kinguin order was created but we crashed before saving the reservation ID, retrying would fail with "orderExternalId already used".

**Solution:** Added recovery logic in `startReservation()`:

```typescript
try {
  kinguinOrder = await this.kinguinClient.placeOrderV2({
    products: kinguinProducts,
    orderExternalId: orderId,
  });
} catch (error) {
  if (errorMessage.includes('already used') || errorMessage.includes('ConstraintViolation')) {
    // Search for existing order by our order ID
    const searchResult = await this.kinguinClient.searchOrders({
      orderExternalId: orderId,
      limit: 1,
    });
    
    // Recover the existing Kinguin order
    kinguinOrder = {
      orderId: existingOrder.orderId,
      status: existingOrder.status,
    };
  }
}
```

### 3. Kinguin Status Polling

**Problem:** Real Kinguin orders wait for webhooks. If webhook was missed, order stays stuck forever.

**Solution:** After getting reservation, poll Kinguin to check if keys are already ready:

```typescript
// In fulfillment.processor.ts
if (!isMockOrder) {
  const kinguinOrder = await this.kinguinClient.getOrder(result.reservationId);
  
  if (kinguinOrder.status === 'completed') {
    // Keys are ready! Queue fetch-keys immediately
    await this.fulfillmentQueue.add('fetch-keys', {
      kinguinOrderId: result.reservationId,
      orderId,
    });
  } else {
    // Still processing - wait for webhook
    this.logger.log(`Waiting for Kinguin webhook...`);
  }
}
```

### 4. Fixed Order ID Bug

**Problem:** `finalizeDelivery()` was calling Kinguin API with BitLoot order ID instead of Kinguin order ID.

**Before (broken):**
```typescript
const status = await this.kinguinClient.getOrderStatus(order.id);
// Error: Order "5c91f65c-..." not found
```

**After (fixed):**
```typescript
// Use reservationId (Kinguin order ID), not order.id (BitLoot order ID)
const status = await this.kinguinClient.getOrderStatus(reservationId);
// Success: Order "CWUEE13E1AF6" status: completed
```

### 5. Frontend Button

**File:** `apps/web/src/app/admin/orders/[id]/page.tsx`

```tsx
const canRetryFulfillment = ['paid', 'failed', 'waiting', 'confirming']
  .includes(order?.status?.toLowerCase() ?? '');

{canRetryFulfillment && (
  <Button
    onClick={handleRetryFulfillment}
    disabled={retryFulfillmentMutation.isPending}
    variant="outline"
    className="border-orange-500 text-orange-600 hover:bg-orange-50"
  >
    <RefreshCw className="mr-2 h-4 w-4" />
    {retryFulfillmentMutation.isPending ? 'Retrying...' : 'Retry Fulfillment'}
  </Button>
)}
```

---

## Double-Spending Protection

### Layer 1: Kinguin `orderExternalId` Uniqueness

Kinguin rejects duplicate orders with the same external ID:
```
POST /v2/order with orderExternalId: "5c91f65c-..."
→ 422 ConstraintViolation: "orderExternalId already used"
```

Our code catches this and recovers the existing order instead.

### Layer 2: BitLoot `kinguinReservationId` Check

```typescript
// In startReservation()
if (order.kinguinReservationId) {
  this.logger.log(`Reservation already exists: ${order.kinguinReservationId}`);
  return { reservationId: order.kinguinReservationId, status: 'processing' };
}
```

### Layer 3: Order Status Validation

```typescript
// In AdminService.retryFulfillment()
if (order.status === 'fulfilled') {
  throw new BadRequestException('Order is already fulfilled');
}
```

### Layer 4: Idempotent Key Storage

- Keys stored at: `orders/{orderId}/key.txt`
- Re-uploading overwrites same file (no duplication)
- Database key entity has unique constraint on `orderItemId`

---

## Usage Guide

### Admin UI

1. Navigate to **Admin → Orders**
2. Click on the stuck order (status: `paid`)
3. Click the orange **"Retry Fulfillment"** button
4. Wait for toast notification confirming job queued
5. Order should transition to `fulfilled` within seconds

### API Direct Call

```bash
curl -X POST http://localhost:4000/admin/orders/{orderId}/retry-fulfillment \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Manual retry - webhook missed"}'
```

**Response:**
```json
{
  "success": true,
  "orderId": "5c91f65c-4b12-463c-9277-8cfc139ceda4",
  "jobId": "155",
  "message": "Fulfillment job queued"
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    RETRY FULFILLMENT FLOW                       │
└─────────────────────────────────────────────────────────────────┘

Admin clicks "Retry Fulfillment"
           │
           ▼
┌──────────────────────┐
│ Validate order status │ ──── If "fulfilled" → Return error
│ (paid/failed/waiting) │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Queue BullMQ job     │
│ (fulfillment-queue)  │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ Check reservation ID │ ──▶ │ Has kinguinReservationId│
└──────────────────────┘     │ → Skip to polling       │
           │                 └─────────────────────────┘
           │ No reservation
           ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ Call Kinguin API     │ ──▶ │ "Already used" error?   │
│ placeOrderV2()       │     │ → Search & recover      │
└──────────────────────┘     └─────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Save reservation ID  │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ Poll Kinguin status  │ ──▶ │ Status = "completed"?   │
│ getOrder()           │     │ → Queue fetch-keys      │
└──────────────────────┘     └─────────────────────────┘
           │                          │
           │ Status = "processing"    │
           ▼                          ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ Wait for webhook     │     │ Fetch keys from Kinguin │
└──────────────────────┘     │ getKeysV2()             │
                             └─────────────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────────┐
                             │ Upload to R2 storage    │
                             └─────────────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────────┐
                             │ Generate signed URL     │
                             └─────────────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────────┐
                             │ Send completion email   │
                             └─────────────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────────┐
                             │ Mark order "fulfilled"  │
                             └─────────────────────────┘
```

---

## Files Changed

| File | Changes |
|------|---------|
| `apps/api/src/modules/admin/admin.controller.ts` | Added `POST /admin/orders/:id/retry-fulfillment` endpoint |
| `apps/api/src/modules/admin/admin.service.ts` | Added `retryFulfillment()` method |
| `apps/api/src/modules/admin/dto/admin.dto.ts` | Added `RetryFulfillmentDto` and `RetryFulfillmentResponseDto` |
| `apps/api/src/jobs/fulfillment.processor.ts` | Added Kinguin polling after reservation, injected KinguinClient |
| `apps/api/src/modules/fulfillment/fulfillment.service.ts` | Fixed order ID bug, added Kinguin order recovery logic |
| `apps/web/src/app/admin/orders/[id]/page.tsx` | Added "Retry Fulfillment" button with mutation |
| `packages/sdk/` | Regenerated with new endpoint |

---

## Testing

### Manual Test Steps

1. Create an order and complete payment
2. Simulate stuck order by stopping the webhook handler
3. Wait for Kinguin to complete the order (check Kinguin dashboard)
4. Use "Retry Fulfillment" button
5. Verify order transitions to `fulfilled`
6. Verify customer receives email with key download link

### Expected Log Output

```
[AdminService] Retrying fulfillment for order 5c91f65c-... (status: paid)
[FulfillmentService] Reservation already exists: CWUEE13E1AF6 (idempotent)
[FulfillmentProcessor] Polling Kinguin order status for: CWUEE13E1AF6
[KinguinClient] Order CWUEE13E1AF6 status: completed
[FulfillmentProcessor] Kinguin order CWUEE13E1AF6 is COMPLETED - queuing fetch-keys
[KinguinClient] Retrieved 1 key(s) for order: CWUEE13E1AF6
[R2StorageClient] Raw key uploaded to R2
[EmailsService] Order completed email sent
[OrdersService] Order marked as fulfilled
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not visible | Check order status is `paid`, `failed`, `waiting`, or `confirming` |
| "Order already fulfilled" error | Order was already completed - no action needed |
| Kinguin order not found | Verify `kinguinReservationId` is saved on the order |
| Keys not available | Kinguin order may still be processing - check Kinguin dashboard |
| R2 upload fails | Check Cloudflare R2 credentials and bucket permissions |

---

## Security Considerations

- Endpoint protected by `JwtAuthGuard` + `AdminGuard`
- Only admin users can trigger retry
- Audit logged with reason provided by admin
- Rate limited by BullMQ job concurrency

---

## Related Documentation

- [Kinguin API Documentation](../Kinguin-eCommerce-API-master/README.md)
- [Fulfillment Flow](./03-Level/LEVEL_3_COMPREHENSIVE_FINAL_REPORT.md)
- [Admin Dashboard](./05-Level/LEVEL_5_FINAL_COMPLETION_REPORT.md)
