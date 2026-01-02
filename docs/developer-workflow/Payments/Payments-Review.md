# 🔐 BITLOOT PAYMENT FEATURE — COMPREHENSIVE SECURITY AUDIT

**Auditor Role:** Senior Backend Architect, Security Auditor, and QA Lead  
**Date:** December 2025  
**Audit Scope:** Payment processing, IPN webhooks, fulfillment, key delivery, database, testing  
**Methodology:** Independent code verification — all claims treated as hypotheses  

---

## SECTION-BY-SECTION VERIFICATION

---

### Section 1: Core Payment Processing

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings:**
- ✅ NOWPayments integration implemented via nowpayments.client.ts
- ✅ HTTP timeouts configured (10 seconds)
- ✅ Payment state machine in payment-state-machine.ts with proper transitions
- ✅ `PaymentsService.createInvoice()` creates invoices with callback URL `/payments/ipn`
- ✅ Payment amounts stored as `Numeric(20,8)` for crypto precision
- ✅ Proper error handling with try/catch and structured error responses

**Hidden Risk:**
- Two different services (`PaymentsService` and `PaymentProcessorService`) create invoices with **different callback URLs** — see Section 3 for critical issue.

**Required Actions:** None for this section.

---

### Section 2: Cryptographic Security

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings:**
- ✅ HMAC-SHA512 signature verification with timing-safe comparison (`crypto.timingSafeEqual`)
- ✅ AES-256-GCM encryption for game keys (32-byte key, 12-byte IV, 16-byte auth tag)
- ✅ Per-key encryption keys stored in `encryption_key` column
- ✅ Comprehensive HMAC tests in hmac-verification.util.spec.ts (279 lines, 20+ test cases)
- ✅ JWT tokens with proper secret handling
- ✅ Secrets loaded from environment variables (no hardcoding)

**Required Actions:** None.

---

### Section 3: Webhook/IPN Processing

**Status:** 🚨 **CRITICAL — PARTIALLY CORRECT**  
**Confidence:** High

**Findings:**

**CRITICAL ISSUE #1: DUAL IPN ENDPOINTS**

| Service | Callback URL | Handler | Fulfillment? |
|---------|--------------|---------|--------------|
| `payments.service.ts:91` | `/payments/ipn` | `PaymentsController` → `PaymentsService.handleIpn()` | ✅ YES |
| `payment-processor.service.ts:141` | `/webhooks/nowpayments/ipn` | `IpnHandlerService` | ❌ **BROKEN** |

**CRITICAL ISSUE #2: FULFILLMENT CODE COMMENTED OUT**

In ipn-handler.service.ts lines 377-385:
```typescript
case 'finished':
  order.status = 'paid';

  // Queue fulfillment (TODO: inject FulfillmentService)
  // await this.fulfillmentQueue.add('fulfillOrder', {
  //   orderId: order.id,
  //   paymentId: payload.payment_id,
  // });
  fulfillmentTriggered = true;  // ⚠️ SET TO TRUE BUT NOTHING QUEUED!

  this.logger.log(`[IPN] Payment finished for order ${order.id}, fulfillment queued`);
```

**Impact:** If `PaymentProcessorService` is used to create invoices, the webhook arrives at `IpnHandlerService`, the payment is marked "paid," but **fulfillment NEVER triggers** because the queue job is commented out.

**What IS implemented correctly:**
- ✅ Timing-safe HMAC-SHA512 verification
- ✅ Idempotency via `WebhookLog` entity (unique `externalId`)
- ✅ Always returns 200 OK to prevent NOWPayments retries
- ✅ Comprehensive audit trail logging
- ✅ Proper state machine transitions

**Required Actions:**
1. **BLOCKING:** Determine which service is primary for production
2. **BLOCKING:** Either complete `IpnHandlerService` fulfillment OR deprecate that path
3. **BLOCKING:** Fix misleading log that says "fulfillment queued" when nothing is queued

---

### Section 4: Order State Machine

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings:**
- ✅ Exhaustive switch with `never` check for unknown status
- ✅ Proper transitions: waiting → confirming → paid/underpaid/failed
- ✅ State machine documented in payment-state-machine.ts
- ✅ Underpaid orders correctly marked as non-refundable
- ✅ Failed payments properly recorded with reason

**Required Actions:** None.

---

### Section 5: Async Job Processing (BullMQ)

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings (from queues.ts):**
- ✅ 3 queues: `payments-queue`, `fulfillment-queue`, `dlq-failed-jobs`
- ✅ 5 retry attempts with exponential backoff (1s initial delay)
- ✅ `removeOnComplete: true` prevents queue bloat
- ✅ `removeOnFail: false` keeps failed jobs for debugging
- ✅ DLQ retention: 7 days (604,800 seconds)
- ✅ Redis connection configured from environment

**Required Actions:** None.

---

### Section 6: Fulfillment Pipeline

**Status:** ⚠️ **PARTIALLY CORRECT**  
**Confidence:** High

**Findings:**
- ✅ `PaymentsService.handleIpn()` path correctly triggers fulfillment
- ✅ Kinguin API client with 30-second timeout and retry logic
- ✅ Key retrieval and encryption flow implemented
- ❌ `IpnHandlerService` path does NOT trigger fulfillment (code commented out)
- ✅ Dual source support: Custom keys and Kinguin API

**Hidden Risk:**
If invoices are created via `PaymentProcessorService`, customers pay but never receive keys.

**Required Actions:** 
1. **BLOCKING:** Resolve the dual-path issue (see Section 3)

---

### Section 7: Key Security & Delivery

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings:**
- ✅ AES-256-GCM encryption with per-key encryption keys
- ✅ Keys stored in Cloudflare R2 (S3-compatible)
- ✅ Signed URLs with configurable expiration (15 minutes default)
- ✅ `encryption_key` column added via migration `AddEncryptionKeyToKey`
- ✅ R2 client has proper timeout handling (checks for `Timeout` errors)

**Required Actions:** None.

---

### Section 8: Frontend Integration

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings (from CheckoutForm.tsx, 322 lines):**
- ✅ Two-step wizard (email capture → payment creation)
- ✅ Zod schema validation for email and payCurrency
- ✅ Cloudflare Turnstile CAPTCHA integration
- ✅ TanStack Query mutations with proper error handling
- ✅ Job status polling with cleanup on unmount
- ✅ Loading states and user feedback

**Required Actions:** None.

---

### Section 9: Database Schema & Migrations

**Status:** ✅ **CORRECT**  
**Confidence:** High

**Findings:**
- ✅ 19 migrations properly ordered and registered
- ✅ `synchronize: false` prevents auto-schema changes
- ✅ UUID primary keys with `gen_random_uuid()`
- ✅ Unique constraints on `externalId` for idempotency
- ✅ Foreign keys with CASCADE delete
- ✅ `Numeric(20,8)` precision for crypto amounts
- ✅ JSONB columns for audit trail (`rawPayload`)

**Hidden Risk:**
- No connection pooling configuration found in data-source.ts — relies on TypeORM defaults.

**Required Actions:**
- **Non-blocking:** Consider adding explicit connection pool limits for production:
  ```typescript
  extra: {
    max: 20,           // Max connections
    min: 5,            // Min connections
    idleTimeoutMillis: 30000,
  }
  ```

---

### Section 10: Testing & Quality Assurance

**Status:** 🚨 **CRITICAL — INCOMPLETE**  
**Confidence:** High

**Findings:**

**CRITICAL ISSUE: IPN HANDLER TESTS ARE STUBS**

From ipn-handler.service.spec.ts (62 lines):
```typescript
describe('HMAC Signature Verification', () => {
  it('should verify valid HMAC signatures', () => {
    expect(service).toBeDefined();  // ← STUB - NO ACTUAL TEST!
  });
  // ... ALL tests are just expect(service).toBeDefined()
});
```

**Test Coverage Reality:**

| File | Status | Notes |
|------|--------|-------|
| hmac-verification.util.spec.ts | ✅ Real (279 lines) | Comprehensive crypto tests |
| payments.service.spec.ts | ✅ Real | Invoice creation, handleIpn |
| ipn-handler.service.spec.ts | ❌ **STUBS** (62 lines) | All tests just check `toBeDefined()` |
| E2E tests | ❌ **MISSING** | No `*.e2e.*` files found |

**What's missing:**
- No integration tests for full payment → IPN → fulfillment flow
- No E2E tests
- No tests for the commented-out fulfillment code path

**Required Actions:**
1. **BLOCKING:** Implement real tests for `IpnHandlerService`
2. **BLOCKING:** Add E2E tests for the critical payment flow
3. Implement tests for edge cases (duplicate webhooks, invalid signatures, malformed payloads)

---

### Section 11: Missing Features & TODOs

**Status:** 🚨 **CRITICAL — INCOMPLETE**  
**Confidence:** High

**Findings:**

| Missing Feature | Location | Impact |
|-----------------|----------|--------|
| **Fulfillment in IpnHandlerService** | `ipn-handler.service.ts:377` | Customers may not receive keys |
| **Rate limiting** | Not found in any API endpoint | Vulnerable to abuse/DoS |
| **Real IPN handler tests** | ipn-handler.service.spec.ts | Untested critical path |
| **E2E tests** | No files found | No automated flow verification |
| **Connection pool config** | data-source.ts | Uses defaults (may not scale) |

**Required Actions:**
1. **BLOCKING:** Complete or remove IpnHandlerService fulfillment path
2. **BLOCKING:** Add rate limiting to order/payment creation endpoints
3. **BLOCKING:** Implement real tests for IPN handler

---

### Section 12: Performance & Scalability

**Status:** ⚠️ **PARTIALLY CORRECT**  
**Confidence:** Medium

**Findings:**

**What IS configured:**
- ✅ NOWPayments client: 10-second timeout
- ✅ Kinguin client: 30-second timeout
- ✅ R2 client: Proper timeout error handling
- ✅ BullMQ: Exponential backoff for retries

**What's MISSING:**
- ❌ **No rate limiting** on any API endpoint
- ❌ No explicit database connection pooling configuration
- ❌ No request timeout middleware
- ❌ No circuit breaker pattern for external APIs

**Required Actions:**
1. **BLOCKING:** Implement rate limiting (e.g., `@nestjs/throttler`)
2. **Non-blocking:** Add connection pool configuration
3. **Non-blocking:** Consider circuit breaker for Kinguin/NOWPayments calls

---

## FINAL AUDIT SUMMARY

### False or Overstated Claims

| Claim | Reality |
|-------|---------|
| "Fulfillment queued" log in IpnHandlerService | **FALSE** — Code is commented out, nothing is queued |
| IPN handler has test coverage | **FALSE** — All tests are stubs (`expect(service).toBeDefined()`) |
| "100% production-ready" | **FALSE** — Critical issues in IPN handler path |

### True Production-Readiness Percentage

| Category | Score | Notes |
|----------|-------|-------|
| Core Payment Processing | 90% | Split callback URLs need resolution |
| Cryptographic Security | 100% | Fully implemented |
| Webhook Processing | **40%** | One path works, one is broken |
| Order State Machine | 100% | Correct implementation |
| Async Job Processing | 100% | Correct implementation |
| Fulfillment Pipeline | **60%** | Only works on one path |
| Key Security | 100% | Fully implemented |
| Frontend | 100% | Fully implemented |
| Database | 95% | Missing pool config |
| Testing | **30%** | Stubs, no E2E |
| Performance | **50%** | No rate limiting |

**Overall: ~75% production-ready** ⚠️

---

### Top 5 Highest-Risk Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| **1** | Fulfillment code commented out in IpnHandlerService | 🔴 CRITICAL | Customers pay but don't receive keys |
| **2** | Split IPN callback URLs — two paths, one broken | 🔴 CRITICAL | Unpredictable fulfillment behavior |
| **3** | No rate limiting on API endpoints | 🔴 HIGH | DoS, payment abuse, cost exposure |
| **4** | IPN handler tests are all stubs | 🔴 HIGH | Critical path completely untested |
| **5** | No E2E tests for payment flow | 🟡 MEDIUM | No automated verification |

---

### Blocking Issues (Must Fix Before Production)

1. **🔴 CRITICAL:** Resolve the dual IPN endpoint situation — determine which path is canonical, complete or remove the other
2. **🔴 CRITICAL:** Either uncomment and implement fulfillment in `IpnHandlerService` OR ensure all invoices are created via `PaymentsService` only
3. **🔴 HIGH:** Add rate limiting middleware to order/payment creation endpoints
4. **🔴 HIGH:** Implement real tests for `IpnHandlerService` (replace stubs)
5. **🟡 MEDIUM:** Add at least one E2E test covering payment → IPN → fulfillment flow

---

### Non-Blocking Improvements

1. Add explicit database connection pool configuration
2. Implement circuit breaker pattern for external API calls
3. Add request timeout middleware at the NestJS level
4. Add comprehensive logging/monitoring for the payment flow
5. Document which IPN endpoint is primary and deprecate the other

---

## 🚨 FINAL RECOMMENDATION

# ❌ **NO-GO FOR PRODUCTION**

**Rationale:**

The payment system has **critical defects** that could result in:
1. **Customers paying but not receiving keys** (if PaymentProcessorService path is used)
2. **Misleading logs** claiming fulfillment was queued when it wasn't
3. **No protection against abuse** (no rate limiting)
4. **Untested critical path** (IPN handler has only stub tests)

**Before Production Deployment:**

```
REQUIRED ACTIONS (Estimated: 2-4 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [ ] Decide: Keep PaymentsService path OR fix IpnHandlerService
2. [ ] Uncomment fulfillment code OR deprecate IpnHandlerService
3. [ ] Add @nestjs/throttler rate limiting
4. [ ] Replace IPN handler stub tests with real tests
5. [ ] Add one E2E test for payment → fulfillment flow
6. [ ] Verify which callback URL NOWPayments is actually using

POST-FIX VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━
- Run full test suite
- Manually test payment → IPN → fulfillment in staging
- Verify rate limits work
- Re-audit affected sections
```

**Once the above issues are resolved, the system should be safe for production use.**

---

*Audit completed. All findings verified against actual source code.*