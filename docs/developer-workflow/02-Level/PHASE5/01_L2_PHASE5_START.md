# 🚀 Phase 5: API Endpoints & Admin Features

**Status:** ⏳ **STARTING** (Phase 4 Complete, Ready for Phase 5)  
**Date Started:** November 10, 2025  
**Phase Duration:** Estimated 4-6 hours  
**Progress:** 0/10 tasks

---

## 📋 Phase 5 Overview

**Phase 5** extends the Level 2 async payment system with **admin endpoints** for monitoring payments and webhooks, **admin UI** for operational visibility, and **cleanup** of Level 1 fake payment methods.

### What's Already Complete (from Phase 4)

✅ **Async Payment System**

- BullMQ job queues with payment/fulfillment processors
- REST polling endpoints for job status
- Frontend real-time UI with spinner and progress bar
- Complete error handling and retry logic

✅ **Payment Integration**

- NOWPayments API integration with HMAC verification
- Payment and WebhookLog entities with idempotency
- IPN webhook handling with state transitions
- Full test coverage (199+ tests, 100% passing)

✅ **Quality Gates**

- Type-check: 0 errors ✅
- Lint: 0 errors ✅
- Format: All files formatted ✅
- Tests: 199+ passing ✅
- Build: All workspaces compile ✅

### What Phase 5 Adds

**Admin Endpoints** (for operational visibility)

- GET /admin/payments - List all payments with pagination and filtering
- GET /admin/webhooks - List webhook logs with delivery history
- POST /admin/webhooks/:id/retry - Manual webhook retry capability

**Admin UI** (dashboard pages)

- /admin/payments - Payment monitoring with real-time status
- /admin/webhooks - Webhook delivery history and error tracking

**Cleanup**

- Remove Level 1 fake payment endpoints
- Remove createFakePayment method
- Update documentation for real NOWPayments only

**Tooling & Testing**

- ngrok setup for local IPN testing
- Comprehensive testing & verification guide
- SDK regeneration with new admin endpoints

---

## 🎯 Phase 5 Tasks (10 Total)

### Task 1: Admin Payments Listing Endpoint ⏳

**Objective:** Create authenticated admin-only endpoint for payment monitoring

**Endpoint:** `GET /admin/payments`

**Requirements:**

- Protected with AdminGuard (verify role in JWT)
- Pagination: `page`, `limit` (max 100)
- Filtering: `status`, `dateFrom`, `dateTo`, `provider`
- Sorting: `createdAt`, `status`, `amount`
- Response: Array of payment summaries with order info

**Response Format:**

```typescript
{
  data: [
    {
      id: string;
      orderId: string;
      externalId: string;
      provider: 'nowpayments' | 'stripe' | ...;
      status: 'created' | 'waiting' | 'confirming' | 'finished' | 'failed' | 'underpaid';
      priceAmount: string;
      priceCurrency: string;
      payAmount: string;
      payCurrency: string;
      createdAt: string;
      updatedAt: string;
    }
  ],
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Files to Modify:**

- `apps/api/src/modules/payments/payments.controller.ts` (add endpoint)
- `apps/api/src/modules/payments/payments.service.ts` (add query method)
- `apps/api/src/common/guards/admin.guard.ts` (create if missing)

---

### Task 2: Admin Webhook Logs Endpoint ⏳

**Objective:** Create authenticated endpoint for webhook delivery monitoring

**Endpoint:** `GET /admin/webhooks`

**Requirements:**

- Protected with AdminGuard
- Pagination: `page`, `limit` (max 100)
- Filtering: `provider`, `status`, `dateFrom`, `dateTo`
- Sorting: `createdAt`, `status`
- Response: Array of webhook delivery records

**Response Format:**

```typescript
{
  data: [
    {
      id: string;
      externalId: string;
      provider: 'nowpayments';
      webhookType: 'ipn';
      status: 'pending' | 'processed' | 'failed' | 'duplicate';
      signatureValid: boolean;
      processed: boolean;
      orderId?: string;
      error?: string;
      result?: Record<string, unknown>;
      sourceIp?: string;
      createdAt: string;
      updatedAt: string;
    }
  ],
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Files to Modify:**

- `apps/api/src/modules/webhooks/webhooks.controller.ts` (new or add endpoint)
- `apps/api/src/modules/webhooks/ipn-handler.service.ts` (add query method)

---

### Task 3: Admin UI - Payments Page ⏳

**Objective:** Build admin dashboard for payment monitoring

**Route:** `/admin/payments`

**Features:**

- Data table with all payments
- Status column with color-coding (created=blue, waiting=yellow, finished=green, failed=red, underpaid=orange)
- Pagination controls
- Filters: status dropdown, date range picker
- Real-time refresh button
- Click row to see order details
- Export to CSV button

**Components:**

- `apps/web/app/admin/payments/page.tsx`
- `apps/web/src/features/admin/PaymentsTable.tsx`
- `apps/web/src/features/admin/PaymentsFilters.tsx`

**Data Integration:**

- Fetch from `GET /admin/payments` API
- Use TanStack Query with staleTime: 10 seconds
- Auto-refresh every 30 seconds or manual refresh button

---

### Task 4: Admin UI - Webhook Logs Page ⏳

**Objective:** Build admin dashboard for webhook delivery tracking

**Route:** `/admin/webhooks`

**Features:**

- Data table with webhook delivery history
- Status badges (processed=green, pending=yellow, failed=red, duplicate=gray)
- Error details column (expandable)
- Manual retry button for failed webhooks
- Pagination
- Filters: status, date range, provider

**Components:**

- `apps/web/app/admin/webhooks/page.tsx`
- `apps/web/src/features/admin/WebhookLogsTable.tsx`
- `apps/web/src/features/admin/WebhookStatusBadge.tsx`

---

### Task 5: Remove Level 1 Fake Payments ⏳

**Objective:** Clean up Level 1 fake payment methods

**Changes:**

1. Delete `payments.service.ts` method: `createFakePayment()`
2. Update `PaymentsController` to only use real `create()` method
3. Delete fake payment DTOs if any
4. Update tests to remove fake payment scenarios
5. Update documentation to reflect real NOWPayments only

**Files to Modify:**

- `apps/api/src/modules/payments/payments.service.ts`
- `apps/api/src/modules/payments/payments.controller.ts`
- `apps/api/src/modules/payments/payments.service.spec.ts`

---

### Task 6: Regenerate SDK ⏳

**Objective:** Update SDK with new admin endpoints

**Steps:**

1. Run `npm run sdk:gen` to pull OpenAPI spec
2. Verify new admin endpoints appear in generated clients
3. Verify types include new response formats
4. Build SDK: `npm --workspace packages/sdk run build`
5. Verify no TypeScript errors

**Files Updated:**

- `packages/sdk/src/generated/apis/AdminApi.ts` (new)
- `packages/sdk/src/generated/models/PaymentSummaryDto.ts`
- `packages/sdk/src/generated/models/WebhookLogDto.ts`

---

### Task 7: Setup ngrok for Local IPN Testing ⏳

**Objective:** Configure public tunnel for NOWPayments IPN callbacks

**Steps:**

1. Install ngrok: https://ngrok.com/download
2. Authenticate: `ngrok config add-authtoken YOUR_TOKEN`
3. Run tunnel: `ngrok http 4000`
4. Copy public URL (e.g., `https://abc123.ngrok.io`)
5. Set `NOWPAYMENTS_CALLBACK_URL=https://abc123.ngrok.io/api/payments/ipn`
6. Update .env with ngrok URL
7. Test: POST test payload to ngrok URL and verify in API logs

**Documentation:**

- Add ngrok setup guide to README
- Document how to test IPN locally
- Include curl examples for manual testing

---

### Task 8: Create Testing & Verification Guide ⏳

**Objective:** Document end-to-end Phase 5 testing workflow

**Guide Contents:**

1. **Environment Setup**
   - Configure NOWPayments sandbox credentials
   - Setup ngrok tunnel
   - Set environment variables

2. **End-to-End Test Flow**
   - Create order: `POST /orders`
   - Initiate payment: `POST /payments/create`
   - Simulate payment: ngrok tunnel receives IPN
   - Verify order status updated
   - Check admin pages show payment
   - Check webhook logs show delivery

3. **API Testing**
   - Test admin endpoints: `/admin/payments`, `/admin/webhooks`
   - Verify pagination works
   - Verify filtering works
   - Verify error handling

4. **UI Testing**
   - Admin payments page loads
   - Payments table displays data
   - Filters work correctly
   - Pagination works
   - Real-time refresh works

5. **Curl Examples**
   - Create order
   - Create payment
   - Manual IPN test payload
   - Admin endpoints queries

---

### Task 9: Run Full Quality Checks ⏳

**Objective:** Verify all 5 quality gates pass

**Commands:**

```bash
npm run type-check     # 0 errors expected
npm run lint           # 0 errors expected
npm run format         # All files formatted
npm run test           # All tests passing (200+)
npm run build          # All workspaces compile
```

**Expected Results:**

- Type errors: 0
- Lint errors: 0
- Format violations: 0
- Test failures: 0
- Build errors: 0
- Overall: 100% pass

---

### Task 10: Create PHASE5_COMPLETE Summary ⏳

**Objective:** Document Phase 5 completion

**Document Contents:**

1. Executive summary (all tasks complete, quality gates passing)
2. Task breakdown (1-10 with deliverables)
3. Architecture overview
4. Admin endpoints documentation
5. Admin UI features
6. Testing results (quality gates)
7. Security considerations
8. Next phase recommendations (Phase 6 features)
9. Deployment checklist

---

## 📊 Progress Tracking

| #   | Task                                | Status | Priority |
| --- | ----------------------------------- | ------ | -------- |
| 1   | Admin payments listing endpoint     | ⏳     | HIGH     |
| 2   | Admin webhook logs endpoint         | ⏳     | HIGH     |
| 3   | Admin UI - Payments page            | ⏳     | MEDIUM   |
| 4   | Admin UI - Webhook logs page        | ⏳     | MEDIUM   |
| 5   | Remove Level 1 fake payments        | ⏳     | HIGH     |
| 6   | Regenerate SDK                      | ⏳     | HIGH     |
| 7   | Setup ngrok for local IPN testing   | ⏳     | MEDIUM   |
| 8   | Create testing & verification guide | ⏳     | MEDIUM   |
| 9   | Run full quality checks             | ⏳     | HIGH     |
| 10  | Create PHASE5_COMPLETE summary      | ⏳     | MEDIUM   |

---

## 🎯 Success Criteria

**For Phase 5 to be COMPLETE:**

- ✅ Admin endpoints implemented and working
- ✅ Admin UI pages built and functional
- ✅ Level 1 fake payments removed
- ✅ SDK regenerated with all types
- ✅ All 5 quality gates passing (0 errors)
- ✅ 200+ tests passing
- ✅ Documentation complete
- ✅ Testing guide available
- ✅ Production deployment checklist ready

---

## 📝 Architecture Context

### Current System (from Phase 4)

```
Frontend (Next.js)
  ├─ /product/[id] - Product checkout
  ├─ /pay/[orderId] - Payment page
  └─ /orders/[id]/success - Success page
       ↓ Job polling

Backend API (NestJS)
  ├─ POST /payments/create - Real NOWPayments
  ├─ POST /payments/ipn - Webhook handler
  ├─ GET /payments/jobs/:jobId/status - Job status
  └─ ⭐ NEW: /admin/* - Admin endpoints
       ↓ Enqueue

Job Queue (BullMQ)
  ├─ Payment processor
  ├─ Fulfillment processor
  └─ DLQ handler
       ↓ Process

Third-Party APIs
  ├─ NOWPayments
  ├─ Kinguin
  ├─ Cloudflare R2
  └─ Resend
```

### Phase 5 Additions

```
+ Admin Security
  ├─ AdminGuard (JWT role check)
  └─ AdminGateway (endpoint prefix)

+ Admin Endpoints
  ├─ GET /admin/payments
  ├─ GET /admin/webhooks
  └─ POST /admin/webhooks/:id/retry

+ Admin UI
  ├─ /admin/payments
  └─ /admin/webhooks

+ Cleanup
  └─ Remove createFakePayment()
```

---

## 🚀 Getting Started (Next Steps)

### Immediate Actions

1. **Mark Task 1 as In-Progress:**

   ```
   Todo: Task 1 - Admin Payments Listing Endpoint → IN-PROGRESS
   ```

2. **Start with Admin Guard Creation:**
   - Create `apps/api/src/common/guards/admin.guard.ts`
   - Implement JWT role verification
   - Check for 'admin' role in token payload

3. **Then Implement Admin Payments Endpoint:**
   - Add controller endpoint with pagination/filtering
   - Add service query method
   - Add AdminGuard decorator
   - Add Swagger documentation

4. **Build Out Remaining Tasks Sequentially:**
   - Task 1-2: Endpoints
   - Task 3-4: UI pages
   - Task 5-6: Cleanup and SDK
   - Task 7-9: Testing and validation
   - Task 10: Documentation

---

## 📞 Key Notes

- **Authentication:** Use existing JWT from Level 1 auth (add 'admin' role)
- **Guards:** Create AdminGuard to verify admin role before endpoint access
- **Pagination:** Standard pattern: `limit`, `page`, `total`, `totalPages`
- **Filtering:** Optional query params for status, date range, provider
- **SDK:** Run `npm run sdk:gen` after all endpoints finalized
- **Quality:** All code must pass 5 quality gates (type, lint, format, test, build)
- **Testing:** Use ngrok for local NOWPayments IPN testing

---

## 🎓 Learning Goals

By end of Phase 5, you'll have:

✅ **Admin API Pattern** - Protected endpoints with role-based access control  
✅ **Admin UI Dashboard** - Real-time monitoring interface  
✅ **Data Pagination** - Efficient list endpoints with filtering  
✅ **TypeORM Queries** - Advanced filtering and pagination patterns  
✅ **React Admin UX** - Data tables, filters, status badges  
✅ **SDK Generation** - Updating SDK with new endpoints  
✅ **Integration Testing** - End-to-end workflow testing  
✅ **Production Operations** - Monitoring and troubleshooting guides

---

## ✨ Phase 5 Vision

**Goal:** Build a complete admin dashboard for operational visibility and control over the payment processing system.

**Outcome:**

- Admins can monitor all payments in real-time
- Admins can see webhook delivery history
- Admins can manually retry failed webhooks
- Clean, professional UI for operational use
- Full test coverage and quality gates
- Production-ready code

---

**Phase 5 Ready to Start! 🚀**

Next action: Begin Task 1 - Admin Payments Listing Endpoint

---

**Estimated Timeline:**

- Tasks 1-2: 1.5 hours (endpoints)
- Tasks 3-4: 1.5 hours (UI pages)
- Tasks 5-6: 1 hour (cleanup + SDK)
- Tasks 7-9: 1 hour (testing + quality)
- Task 10: 0.5 hours (documentation)
- **Total: 5-6 hours**

**Quality Target:** 5/5 gates passing, 200+ tests, 0 errors

---

_Phase 5 Start: November 10, 2025_  
_Ready to proceed with Task 1!_
