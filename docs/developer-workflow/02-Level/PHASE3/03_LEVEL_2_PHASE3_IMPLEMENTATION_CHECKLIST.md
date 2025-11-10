# ✅ Phase 3 Implementation Checklist

**Date:** November 8, 2025  
**Duration:** ~17 hours (3-4 days)  
**Status:** Ready to begin

---

## 📋 Pre-Implementation Setup

### Environment & Dependencies

- [ ] Add environment variables to `.env`

  ```bash
  KINGUIN_API_KEY=xxx
  KINGUIN_BASE=https://sandbox.kinguin.net/api/v1
  KINGUIN_WEBHOOK_SECRET=xxx
  R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
  R2_ACCESS_KEY_ID=xxx
  R2_SECRET_ACCESS_KEY=xxx
  R2_BUCKET=bitloot-keys
  KEY_ENCRYPTION_SECRET=xxx
  ```

- [ ] Update `.env.example` with all Phase 3 variables

- [ ] Install AWS SDK

  ```bash
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  ```

- [ ] Create directory structure

  ```bash
  mkdir -p apps/api/src/modules/fulfillment/dto
  mkdir -p apps/api/src/modules/webhooks
  mkdir -p apps/api/src/modules/admin
  ```

- [ ] Review documentation
  - [ ] Read LEVEL_2_PHASE3_PLAN.md (overview)
  - [ ] Read docs/kinguin-API-documentation.md (API reference)
  - [ ] Read PHASE_3_ARCHITECTURE.md (system design)
  - [ ] Read PHASE_3_QUICK_START.md (implementation guide)

- [ ] Verify Node.js version (need v18+)
  ```bash
  node --version  # Should be >=18.0.0
  ```

---

## 🏗️ LAYER 1: External Clients

### Task 2: Kinguin Client Wrapper ⏳ IN PROGRESS

**File:** `apps/api/src/modules/fulfillment/kinguin.client.ts`

**Implementation Checklist:**

```typescript
export class KinguinClient {
  // Constructor: api key, base URL, logger
  // - [ ] Inject via dependency injection
  // - [ ] Type-safe parameter validation
  // Method 1: createOrder()
  // - [ ] POST to ${baseUrl}/orders
  // - [ ] Include Bearer token
  // - [ ] Handle response: { id, status, key? }
  // - [ ] Error handling with message extraction
  // - [ ] Return CreateOrderResponse type
  // Method 2: getOrderStatus()
  // - [ ] GET ${baseUrl}/orders/{orderId}
  // - [ ] Bearer token auth
  // - [ ] Return OrderStatusResponse type
  // - [ ] Extract status and key (if ready)
  // Method 3: getKey()
  // - [ ] Call getOrderStatus()
  // - [ ] Extract key from response
  // - [ ] Throw if no key available
  // Method 4: healthCheck()
  // - [ ] GET health endpoint
  // - [ ] Return boolean
  // Private: extractErrorMessage()
  // - [ ] Handle Kinguin error format
  // - [ ] Return string message
}
```

**Test Checklist:** `kinguin.client.spec.ts`

- [ ] Create order success

  ```typescript
  it('should create order and return response');
  ```

- [ ] Create order with invalid offer ID (error)

  ```typescript
  it('should throw on invalid offer ID');
  ```

- [ ] Get order status (pending key)

  ```typescript
  it('should return pending status');
  ```

- [ ] Get order status (key ready)

  ```typescript
  it('should return key in response');
  ```

- [ ] Get order status (failed)

  ```typescript
  it('should handle failed status');
  ```

- [ ] Get key from order

  ```typescript
  it('should extract key from order status');
  ```

- [ ] Health check passing

  ```typescript
  it('should return true on health check');
  ```

- [ ] Health check failure
  ```typescript
  it('should return false on connection error');
  ```

**Quality Requirements:**

- [ ] Zero TypeScript errors (`npm run type-check`)
- [ ] Zero ESLint violations (`npm run lint`)
- [ ] All 8 tests passing (`npm run test`)
- [ ] No `any` types
- [ ] Comprehensive JSDoc comments
- [ ] Error handling complete

**Estimated Time:** 2 hours

---

### Task 3: Kinguin Integration DTOs

**File:** `apps/api/src/modules/fulfillment/dto/`

**Create 5 DTO files:**

1. **create-order.dto.ts**
   - [ ] CreateOrderDto (offerId, quantity)
   - [ ] CreateOrderResponseDto (response from Kinguin)
   - Validation: @IsUUID(), @IsInt(), @Min(1)

2. **order-status.dto.ts**
   - [ ] OrderStatusDto (id, status, key?)
   - [ ] Enum: 'pending', 'ready', 'failed', 'cancelled'
   - Swagger: @ApiProperty with examples

3. **key-response.dto.ts**
   - [ ] KeyResponseDto (orderId, downloadUrl, expiresAt)
   - [ ] Message field for UI
   - Validation: all fields required except message

4. **fulfillment-status.dto.ts**
   - [ ] FulfillmentStatusDto (orderId, status, error?)
   - [ ] Status enum: 'pending', 'processing', 'fulfilled', 'failed'

5. **deliver-key.dto.ts**
   - [ ] DeliverKeyDto (orderId, key, deliveredAt)
   - [ ] Admin-only endpoint DTO

**Quality Requirements:**

- [ ] All DTOs have Swagger @ApiProperty decorators
- [ ] All fields have validation decorators
- [ ] Examples provided
- [ ] Type-safe (no `any`)
- [ ] Zero TypeScript errors

**Estimated Time:** 1 hour

---

### Task 4: Cloudflare R2 Client Wrapper

**File:** `apps/api/src/modules/storage/r2.client.ts`

**Implementation Checklist:**

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class R2StorageClient {
  // Constructor: endpoint, accessKeyId, secretAccessKey, bucketName, logger
  // - [ ] Initialize S3Client with R2 endpoint
  // - [ ] Type-safe credential storage
  // Method 1: uploadEncryptedKey()
  // - [ ] PUT to s3://bucket/orders/{orderId}/key.bin
  // - [ ] Include metadata (customer email, timestamp)
  // - [ ] Handle upload response
  // - [ ] Return object key
  // Method 2: generateSignedUrl()
  // - [ ] GET presigned URL for orderId
  // - [ ] Custom expiry (default 15 minutes)
  // - [ ] Return full signed URL string
  // Method 3: deleteKey()
  // - [ ] DELETE s3://bucket/orders/{orderId}/key.bin
  // - [ ] Handle deletion response
  // Method 4: healthCheck()
  // - [ ] Test R2 connectivity
  // - [ ] Return boolean
  // Private: extractErrorMessage()
  // - [ ] Handle S3 errors
  // - [ ] Return string
}
```

**Quality Requirements:**

- [ ] Type-safe AWS SDK v3 API calls
- [ ] Error handling for all operations
- [ ] Logging for audit trail
- [ ] No hardcoded values
- [ ] Zero TypeScript errors

**Estimated Time:** 1.5 hours

---

### Task 5: Key Encryption Utility

**File:** `apps/api/src/modules/storage/encryption.util.ts`

**Implementation Checklist:**

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Function 1: encryptKey()
// - [ ] Generate random 16-byte IV
// - [ ] Create AES-256-GCM cipher
// - [ ] Encrypt plaintext
// - [ ] Get auth tag
// - [ ] Return base64(iv || authTag || encrypted)

// Function 2: decryptKey()
// - [ ] Decode from base64
// - [ ] Extract IV, auth tag, encrypted data
// - [ ] Create decipher
// - [ ] Set auth tag (for verification)
// - [ ] Decrypt and return plaintext
// - [ ] Throw on verification failure

// Function 3: generateEncryptionKey()
// - [ ] Generate 32 random bytes (256 bits)
// - [ ] Return as hex string
```

**Test Checklist:** `encryption.util.spec.ts`

- [ ] Encrypt and decrypt (roundtrip)

  ```typescript
  it('should encrypt and decrypt correctly');
  ```

- [ ] Different ciphertexts for same plaintext (random IV)

  ```typescript
  it('should generate different ciphertexts');
  ```

- [ ] Decrypt with wrong key throws error

  ```typescript
  it('should throw on wrong decryption key');
  ```

- [ ] Tampered ciphertext fails auth tag

  ```typescript
  it('should reject tampered ciphertext');
  ```

- [ ] Empty plaintext handling

  ```typescript
  it('should handle empty string');
  ```

- [ ] Long key handling

  ```typescript
  it('should handle long keys');
  ```

- [ ] Special characters

  ```typescript
  it('should handle special characters');
  ```

- [ ] Generate encryption key

  ```typescript
  it('should generate strong keys');
  ```

- [ ] Base64 encoding/decoding

  ```typescript
  it('should handle base64 correctly');
  ```

- [ ] Multiple encryptions don't collide
  ```typescript
  it('should not produce collisions');
  ```

**Quality Requirements:**

- [ ] Cryptographically secure random IVs
- [ ] Authenticated encryption (auth tag)
- [ ] No timing leaks
- [ ] Proper error handling
- [ ] All 10+ tests passing

**Estimated Time:** 1 hour

---

## 🏢 LAYER 2: Services

### Task 6: Fulfillment Service Implementation

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.ts`

**Implementation Checklist:**

```typescript
@Injectable()
export class FulfillmentService {
  // Constructor: KinguinClient, R2StorageService, OrdersService, fulfillment queue
  // Method 1: fulfillOrder()
  // - [ ] Fetch order from database
  // - [ ] Call KinguinClient.createOrder()
  // - [ ] Poll for key with retries
  // - [ ] Encrypt key
  // - [ ] Store in R2
  // - [ ] Mark order fulfilled
  // - [ ] Queue email notification
  // - [ ] Comprehensive error handling
  // Method 2: getOrderStatus()
  // - [ ] Fetch order
  // - [ ] Return status DTO
  // Method 3: handleKinguinWebhook()
  // - [ ] Process webhook payload
  // - [ ] Update order status
  // - [ ] Handle key ready/failed events
  // Private: pollKinguinKey()
  // - [ ] Retry logic with delays
  // - [ ] Max attempts parameter
  // - [ ] Exponential backoff option
  // - [ ] Clear error messages
}
```

**Quality Requirements:**

- [ ] Orchestration logic clean and readable
- [ ] Proper logging at each step
- [ ] Comprehensive error handling
- [ ] Async/await properly used
- [ ] No unhandled promise rejections

**Estimated Time:** 2 hours

---

### Task 7: R2 Storage Service Implementation

**File:** `apps/api/src/modules/storage/r2-storage.service.ts`

**Implementation Checklist:**

```typescript
@Injectable()
export class R2StorageService {
  // Constructor: R2StorageClient, KeyDeliveryLog repository
  // Method 1: storeKey()
  // - [ ] Upload to R2
  // - [ ] Create delivery log entry
  // - [ ] Return object key and expiry
  // Method 2: retrieveSignedUrl()
  // - [ ] Fetch delivery log
  // - [ ] Check expiry
  // - [ ] Generate signed URL
  // - [ ] Update last accessed time
  // - [ ] Return URL
  // Method 3: verifyAccess()
  // - [ ] Check user ownership
  // - [ ] Return boolean
  // Method 4: cleanupExpiredKeys()
  // - [ ] Find expired keys
  // - [ ] Delete from R2
  // - [ ] Update status
  // - [ ] Return count deleted
}
```

**Quality Requirements:**

- [ ] Database integration (TypeORM)
- [ ] Ownership verification
- [ ] Error handling for expired keys
- [ ] Audit trail complete
- [ ] Cleanup logic safe

**Estimated Time:** 1.5 hours

---

## 🔌 LAYER 3: Integration

### Task 8: Update PaymentsService IPN Handler

**File:** `apps/api/src/modules/payments/payments.service.ts` (modification)

**Changes Required:**

- [ ] Modify `handleIpn()` method
- [ ] After `markPaid()`, queue fulfillment job
  ```typescript
  await this.fulfillmentQueue.add(
    'fulfillOrder',
    { orderId },
    { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
  );
  ```
- [ ] Add logger entry
- [ ] Maintain existing error handling

**Quality Requirements:**

- [ ] No breaking changes to existing logic
- [ ] Queue integration works
- [ ] Logging updated

**Estimated Time:** 30 minutes

---

## 🌐 LAYER 4: API Endpoints

### Task 9: Fulfillment Controller Endpoints

**File:** `apps/api/src/modules/fulfillment/fulfillment.controller.ts`

**Endpoints to create:**

1. **GET /fulfillment/{orderId}/status**
   - [ ] JWT authentication required
   - [ ] Returns FulfillmentStatusDto
   - [ ] Swagger documented

2. **GET /fulfillment/{orderId}/download-link**
   - [ ] JWT authentication required
   - [ ] Returns KeyResponseDto
   - [ ] Calls R2StorageService.retrieveSignedUrl()
   - [ ] Swagger documented

3. **POST /fulfillment/{orderId}/deliver**
   - [ ] Admin authentication required
   - [ ] Request: DeliverKeyDto
   - [ ] Response: success message
   - [ ] Swagger documented

**Quality Requirements:**

- [ ] All endpoints have Swagger documentation
- [ ] Type-safe DTOs on all responses
- [ ] Proper HTTP status codes
- [ ] Error handling with meaningful messages
- [ ] Ownership verification on user endpoints

**Estimated Time:** 1 hour

---

### Task 10: Kinguin Webhook Handler

**File:** `apps/api/src/modules/webhooks/kinguin-webhook.controller.ts`

**Endpoint:**

**POST /webhooks/kinguin**

- [ ] Extract signature from header
- [ ] Verify HMAC signature
- [ ] Log webhook for idempotency check
- [ ] Process based on event type:
  - [ ] 'order.ready' → Update order status
  - [ ] 'order.delivered' → Mark fulfilled
  - [ ] 'order.failed' → Mark failed
  - [ ] 'order.cancelled' → Mark cancelled
- [ ] Return 200 immediately
- [ ] Update webhook log status

**Quality Requirements:**

- [ ] Signature verification required
- [ ] Idempotency protection (WebhookLog)
- [ ] Fast response (200 immediately)
- [ ] Comprehensive error logging
- [ ] No data modifications on error

**Estimated Time:** 1 hour

---

### Task 11: Admin Payment Management Endpoints

**File:** `apps/api/src/modules/admin/admin-payments.controller.ts`

**Endpoints:**

1. **GET /admin/payments**
   - [ ] Paginated list of all payments
   - [ ] Query: page, limit, status filter
   - [ ] Admin guard required

2. **GET /admin/payments/{id}**
   - [ ] Payment details with full audit trail
   - [ ] Include webhook logs
   - [ ] Admin guard required

3. **GET /admin/orders/{id}/fulfillment**
   - [ ] Fulfillment status
   - [ ] R2 storage details
   - [ ] Access logs
   - [ ] Admin guard required

**Quality Requirements:**

- [ ] Pagination support
- [ ] Filtering by status, date, etc.
- [ ] Full audit trail visibility
- [ ] Admin-only access
- [ ] Comprehensive error messages

**Estimated Time:** 1 hour

---

## 🧪 LAYER 5: Testing

### Task 12: FulfillmentService Unit Tests

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.spec.ts`

**Test Scenarios (15+):**

- [ ] fulfillOrder() success path
- [ ] fulfillOrder() with Kinguin API failure
- [ ] fulfillOrder() with R2 upload failure
- [ ] fulfillOrder() with key polling timeout
- [ ] fulfillOrder() with encryption key missing
- [ ] getOrderStatus() for fulfilled order
- [ ] getOrderStatus() for pending order
- [ ] getOrderStatus() for failed order
- [ ] getOrderStatus() for non-existent order
- [ ] handleKinguinWebhook() for ready event
- [ ] handleKinguinWebhook() for failed event
- [ ] handleKinguinWebhook() with invalid payload
- [ ] Idempotency: fulfillOrder() called twice
- [ ] Audit trail: fulfillOrder() logs each step
- [ ] Email integration: fulfillOrder() queues email

**Quality Requirements:**

- [ ] Mock KinguinClient and R2StorageService
- [ ] Mock database calls
- [ ] All 15+ tests passing
- [ ] Coverage for happy path and errors
- [ ] Comprehensive assertions

**Estimated Time:** 2 hours

---

### Task 13: R2 Integration Tests

**File:** `apps/api/src/modules/storage/r2-storage.service.spec.ts`

**Test Scenarios (10+):**

- [ ] storeKey() success
- [ ] storeKey() creates delivery log
- [ ] storeKey() with metadata
- [ ] retrieveSignedUrl() returns valid URL
- [ ] retrieveSignedUrl() expires after 15 minutes
- [ ] retrieveSignedUrl() not found
- [ ] retrieveSignedUrl() updates access log
- [ ] verifyAccess() ownership check
- [ ] cleanupExpiredKeys() deletes old keys
- [ ] cleanupExpiredKeys() handles deletion failure

**Quality Requirements:**

- [ ] Mock AWS S3 API
- [ ] Mock database operations
- [ ] All 10+ tests passing
- [ ] Error scenarios covered
- [ ] Expiry enforcement tested

**Estimated Time:** 1.5 hours

---

## 📚 LAYER 6: Documentation

### Task 14: Phase 3 Summary & Security Verification

**File:** `docs/developer-workflow/02-Level/LEVEL_2_PHASE3_FINAL.md`

**Content:**

- [ ] Executive Summary (50 lines)
  - All 14 tasks completed
  - Test metrics
  - Security verification

- [ ] Task-by-Task Details (300 lines)
  - Implementation summary for each task
  - Code patterns and examples
  - Quality metrics

- [ ] Security Checklist (50 lines)
  - [ ] AES-256-GCM encryption
  - [ ] 15-minute signed URL expiry
  - [ ] Ownership verification
  - [ ] HMAC verification
  - [ ] Rate limiting
  - [ ] No plaintext keys
  - [ ] Key cleanup
  - [ ] Audit trail

- [ ] Integration Points (50 lines)
  - NOWPayments → FulfillmentService
  - FulfillmentService → KinguinClient
  - KinguinClient → R2StorageService

- [ ] Phase 4 Readiness (50 lines)
  - What's complete
  - What remains
  - Known limitations

**Quality Requirements:**

- [ ] All sections complete
- [ ] Code examples accurate
- [ ] Security checklist verified
- [ ] Sign-off ready

**Estimated Time:** 1 hour

---

## ✅ Final Quality Checks

After all 14 tasks complete:

### Code Quality

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run format:check` → all formatted
- [ ] `npm run test` → 60+/60+ tests passing

### Security Verification

- [ ] AES-256-GCM encryption verified
- [ ] 15-minute URL expiry enforced
- [ ] Ownership checks in place
- [ ] HMAC webhook verification working
- [ ] Rate limiting configured
- [ ] No plaintext keys in code/logs
- [ ] Audit trail complete

### Database

- [ ] Migration executed successfully
- [ ] KeyDeliveryLog table created
- [ ] Indexes created
- [ ] Relationships correct

### Documentation

- [ ] All phases documented
- [ ] Architecture diagrams complete
- [ ] Code examples working
- [ ] Security explained
- [ ] Phase 4 ready

### End-to-End Flow

- [ ] Payment confirmed (Phase 2)
- [ ] Kinguin order created (Phase 3)
- [ ] Key retrieved (Phase 3)
- [ ] Key encrypted (Phase 3)
- [ ] Key stored in R2 (Phase 3)
- [ ] Signed URL generated (Phase 3)
- [ ] Email sent (Phase 3)
- [ ] Customer downloads (Phase 3)

---

## 📊 Time Estimate

| Layer            | Tasks  | Hours  |
| ---------------- | ------ | ------ |
| 1: Clients       | 2-5    | 5.5    |
| 2: Services      | 6-7    | 3.5    |
| 3: Integration   | 8      | 0.5    |
| 4: Endpoints     | 9-11   | 3      |
| 5: Testing       | 12-13  | 3.5    |
| 6: Documentation | 14     | 1      |
| **Total**        | **14** | **17** |

**Breakdown per day:**

- Day 1 (6 hours): Tasks 2-4 (clients)
- Day 2 (6 hours): Tasks 5-8 (services & integration)
- Day 3 (5 hours): Tasks 9-14 (endpoints, testing, docs)

---

## 🚀 Ready to Begin

- [ ] All pre-implementation setup complete
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Directory structure created
- [ ] Documentation reviewed

**Next: Start Task 2 - Kinguin Client Wrapper! 🎯**

```bash
touch apps/api/src/modules/fulfillment/kinguin.client.ts
# Begin implementing from LEVEL_2_PHASE3_PLAN.md Task 2 section
```

---

**Phase 3 Checklist Ready ✅**

Track progress by checking items off as you complete each task!
