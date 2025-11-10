# 🚀 Level 2 Phase 3: Kinguin Fulfillment & Cloudflare R2 Integration

**Status:** ✅ **PHASE 3 ROADMAP & PLANNING** — Ready to begin implementation  
**Date:** November 8, 2025  
**Phase:** Phase 3 (Fulfillment System)  
**Total Tasks:** 14 tasks over 3-4 days  
**Completion Goal:** Full end-to-end order fulfillment with encrypted key delivery

---

## 📊 Phase 3 Overview

Phase 3 implements the **fulfillment pipeline**: when a payment is confirmed via NOWPayments, create an order with Kinguin, retrieve the license key, encrypt and store it in Cloudflare R2, and deliver a short-lived signed URL to the customer.

### Phase 3 Integration Flow

```
Payment Confirmed (NOWPayments IPN)
    ↓
PaymentsService.handleIpn() → payment.status = 'finished'
    ↓
BullMQ Job: FulfillmentService.fulfillOrder(orderId)
    ↓
KinguinClient.createOrder() → Kinguin order placed
    ↓
Kinguin returns key (sync or async via webhook)
    ↓
EncryptKey(licenseKey) → AES-256-GCM encrypted
    ↓
R2StorageService.storeKey(encryptedKey, orderId)
    ↓
R2StorageService.generateSignedUrl(orderId) → 15-min expiry link
    ↓
Order marked fulfilled, signed URL sent to customer email
    ↓
Customer receives email with "Download Key" link
    ↓
Link opens R2 signed URL, downloads encrypted key
    ↓
Frontend decrypts key (or shows plaintext if decryption skipped)
```

---

## 🎯 Task Breakdown (14 Tasks)

### **LAYER 1: External Client Wrappers (Tasks 1-4)**

#### Task 1: Kinguin Client Wrapper ✅ READY

**File:** `apps/api/src/modules/fulfillment/kinguin.client.ts` (400+ lines)

**Methods to implement:**

```typescript
export class KinguinClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string, // https://www.kinguin.net/api/v1 (prod)
    private readonly logger: Logger,
  ) {}

  // Place a new order with Kinguin
  async createOrder(params: {
    offerId: string; // Kinguin product ID
    quantity: number; // usually 1
  }): Promise<CreateOrderResponse> {
    // POST /v1/orders
    // {
    //   "offerId": "...",
    //   "quantity": 1,
    //   "autoDeliver": true
    // }
    // Returns: { id, status, key, ... }
  }

  // Get order status and key (if ready)
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    // GET /v1/orders/{orderId}
    // Returns: { id, status, keys[], ... }
  }

  // Retrieve key from a specific order
  async getKey(orderId: string): Promise<string> {
    // Extract from getOrderStatus response
    // Returns: raw license key string
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    // GET /v1/health or similar
  }

  // Private error handler
  private extractErrorMessage(error: unknown): string {
    // Similar to NowPaymentsClient pattern
  }
}
```

**Quality Requirements:**

- ✅ Type-safe API calls with Bearer token auth
- ✅ Comprehensive error handling
- ✅ Retry logic for transient failures
- ✅ Logging for audit trail
- ✅ Zero `any` types

**Tests (8+ scenarios):**

1. ✅ Create order success
2. ✅ Create order failure (invalid offer)
3. ✅ Get order status (pending)
4. ✅ Get order status (ready with key)
5. ✅ Get order status (failed)
6. ✅ Get key from order
7. ✅ Health check passing
8. ✅ Health check failure

---

#### Task 2: Kinguin Integration DTOs ✅ READY

**File:** `apps/api/src/modules/fulfillment/dto/` (5 files)

**DTOs to create:**

```typescript
// CreateOrderDto.ts
export class CreateOrderDto {
  @IsUUID()
  @ApiProperty({ example: '550e8400-...' })
  offerId!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ example: 1, default: 1 })
  quantity = 1;
}

// OrderStatusDto.ts
export class OrderStatusDto {
  @IsUUID()
  @ApiProperty({ example: '660e8400-...' })
  id!: string;

  @IsEnum(['pending', 'ready', 'failed', 'cancelled'])
  @ApiProperty({ example: 'ready' })
  status!: 'pending' | 'ready' | 'failed' | 'cancelled';

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'ABCD-EFGH-IJKL-MNOP', required: false })
  key?: string;
}

// KeyResponseDto.ts
export class KeyResponseDto {
  @IsUUID()
  @ApiProperty({ example: '550e8400-...' })
  orderId!: string;

  @IsString()
  @ApiProperty({ example: 'https://r2-signed-url...' })
  downloadUrl!: string;

  @IsISO8601()
  @ApiProperty({ example: '2025-11-08T10:00:00Z' })
  expiresAt!: Date;

  @IsString()
  @ApiProperty({ example: 'Download your key - link expires in 15 minutes' })
  message!: string;
}

// FulfillmentStatusDto.ts
export class FulfillmentStatusDto {
  @IsUUID()
  @ApiProperty()
  orderId!: string;

  @IsEnum(['pending', 'processing', 'fulfilled', 'failed'])
  @ApiProperty()
  status!: 'pending' | 'processing' | 'fulfilled' | 'failed';

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  error?: string;
}

// DeliverKeyDto.ts
export class DeliverKeyDto {
  @IsUUID()
  @ApiProperty()
  orderId!: string;

  @IsString()
  @ApiProperty()
  key!: string;

  @IsISO8601()
  @ApiProperty()
  deliveredAt!: Date;
}
```

**Quality Requirements:**

- ✅ Swagger documentation on all fields
- ✅ Validation decorators (class-validator)
- ✅ Type-safe numeric/string/boolean fields
- ✅ Examples provided
- ✅ Optional fields properly marked

---

#### Task 3: Cloudflare R2 Client Wrapper ✅ READY

**File:** `apps/api/src/modules/storage/r2.client.ts` (300+ lines)

**Methods to implement:**

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class R2StorageClient {
  private s3: S3Client;

  constructor(
    private readonly endpoint: string, // https://{accountId}.r2.cloudflarestorage.com
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly bucketName: string,
    private readonly logger: Logger,
  ) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  // Upload encrypted key to R2
  async uploadEncryptedKey(
    orderId: string,
    encryptedKey: string, // Already encrypted
    metadata?: Record<string, string>,
  ): Promise<string> {
    // PUT to s3://bucket/orders/{orderId}/key.bin
    // Return object key
  }

  // Generate short-lived signed URL for download
  async generateSignedUrl(
    orderId: string,
    expiresIn: number = 15 * 60, // 15 minutes default
  ): Promise<string> {
    // GET signed URL valid for 15 minutes
    // Return full URL
  }

  // Delete encrypted key (cleanup after successful delivery)
  async deleteKey(orderId: string): Promise<void> {
    // DELETE s3://bucket/orders/{orderId}/key.bin
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    // Test connectivity to R2
  }

  private extractErrorMessage(error: unknown): string {
    // Error handling
  }
}
```

**Quality Requirements:**

- ✅ Type-safe AWS SDK v3 API calls
- ✅ Signed URL generation with custom expiry
- ✅ Metadata support for audit trail
- ✅ Comprehensive error handling
- ✅ Logging for all operations

---

#### Task 4: Key Encryption Utility ✅ READY

**File:** `apps/api/src/modules/storage/encryption.util.ts` (100+ lines)

**Functions to implement:**

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// AES-256-GCM encryption with secure IV and auth tag
export function encryptKey(plainKey: string, encryptionKey: string): string {
  // 1. Generate random 16-byte IV
  const iv = randomBytes(16);

  // 2. Create AES-256-GCM cipher
  const cipher = createCipheriv(
    'aes-256-gcm',
    scryptSync(encryptionKey, 'salt', 32), // Derive 256-bit key
    iv,
  );

  // 3. Encrypt plaintext
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 4. Get auth tag (16 bytes)
  const authTag = cipher.getAuthTag();

  // 5. Return: base64(iv || authTag || encrypted)
  return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
}

export function decryptKey(encryptedData: string, encryptionKey: string): string {
  // 1. Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64');

  // 2. Extract IV (first 16 bytes), auth tag (next 16), encrypted data (rest)
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);

  // 3. Create decipher
  const decipher = createDecipheriv('aes-256-gcm', scryptSync(encryptionKey, 'salt', 32), iv);

  // 4. Set auth tag before decrypting (for verification)
  decipher.setAuthTag(authTag);

  // 5. Decrypt
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Generate a strong encryption key (for storing)
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex'); // 256 bits
}
```

**Quality Requirements:**

- ✅ AES-256-GCM (authenticated encryption)
- ✅ Secure random IV per encryption
- ✅ Auth tag verification prevents tampering
- ✅ No key derivation errors
- ✅ Proper error handling on decryption failure

**Tests (10+ scenarios):**

1. ✅ Encrypt and decrypt plaintext key
2. ✅ Different keys produce different ciphertexts (random IV)
3. ✅ Decrypt with wrong key throws error
4. ✅ Tampered ciphertext fails auth tag verification
5. ✅ Empty plaintext handling
6. ✅ Long key handling
7. ✅ Special characters in key
8. ✅ Generate encryption key produces strong output
9. ✅ Base64 encoding/decoding correct
10. ✅ Multiple encryptions don't collide

---

### **LAYER 2: Service Implementations (Tasks 5-7)**

#### Task 5: R2 Storage Service Implementation ✅ READY

**File:** `apps/api/src/modules/storage/r2-storage.service.ts` (200+ lines)

**Methods to implement:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { R2StorageClient } from './r2.client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyDeliveryLog } from '../../database/entities/key-delivery-log.entity';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);

  constructor(
    private readonly r2Client: R2StorageClient,
    @InjectRepository(KeyDeliveryLog)
    private readonly deliveryLogRepo: Repository<KeyDeliveryLog>,
  ) {}

  /**
   * Store encrypted key in R2 and create delivery log entry
   */
  async storeKey(
    orderId: string,
    encryptedKey: string,
    customerEmail: string,
  ): Promise<{ objectKey: string; expiresAt: Date }> {
    try {
      // 1. Upload to R2
      const objectKey = await this.r2Client.uploadEncryptedKey(orderId, encryptedKey, {
        'customer-email': customerEmail,
        'stored-at': new Date().toISOString(),
      });

      // 2. Create delivery log entry
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const log = this.deliveryLogRepo.create({
        orderId,
        customerEmail,
        objectKey,
        status: 'stored',
        expiresAt,
      });
      await this.deliveryLogRepo.save(log);

      this.logger.log(`Key stored for order ${orderId}, expires at ${expiresAt}`);
      return { objectKey, expiresAt };
    } catch (error) {
      this.logger.error(`Failed to store key for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Generate short-lived signed URL for key download
   */
  async retrieveSignedUrl(orderId: string): Promise<string> {
    try {
      // 1. Check delivery log exists
      const log = await this.deliveryLogRepo.findOneBy({ orderId });
      if (!log) throw new NotFoundException(`No key stored for order ${orderId}`);

      // 2. Check expiry
      if (log.expiresAt < new Date()) {
        this.logger.warn(`Key expired for order ${orderId}`);
        throw new GoneException('Download link has expired');
      }

      // 3. Generate signed URL (15 min expiry)
      const signedUrl = await this.r2Client.generateSignedUrl(orderId);

      // 4. Update last accessed time
      log.lastAccessedAt = new Date();
      await this.deliveryLogRepo.save(log);

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to retrieve signed URL for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Verify user has access to key (ownership check)
   */
  async verifyAccess(orderId: string, userId: string): Promise<boolean> {
    // Check that userId matches order owner
    // (Implementation depends on Order entity structure)
    return true; // Placeholder
  }

  /**
   * Clean up expired keys (cron job)
   */
  async cleanupExpiredKeys(): Promise<number> {
    const expired = await this.deliveryLogRepo.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: 'stored',
      },
    });

    for (const log of expired) {
      try {
        await this.r2Client.deleteKey(log.orderId);
        log.status = 'deleted';
        await this.deliveryLogRepo.save(log);
      } catch (error) {
        this.logger.error(`Failed to clean up key for order ${log.orderId}`, error);
      }
    }

    return expired.length;
  }
}
```

**Quality Requirements:**

- ✅ Dependency injection of R2StorageClient
- ✅ Database audit trail via KeyDeliveryLog entity
- ✅ Ownership verification
- ✅ Expiry enforcement
- ✅ Cleanup logic for security

---

#### Task 6: Fulfillment Service Implementation ✅ READY

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.ts` (400+ lines)

**Methods to implement:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { KinguinClient } from './kinguin.client';
import { R2StorageService } from '../storage/r2-storage.service';
import { OrdersService } from '../orders/orders.service';
import { encryptKey } from '../storage/encryption.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    private readonly kinguinClient: KinguinClient,
    private readonly r2Storage: R2StorageService,
    private readonly ordersService: OrdersService,
    @InjectQueue('fulfillment') private readonly fulfillmentQueue: Queue,
  ) {}

  /**
   * Main fulfillment flow: Kinguin → R2 → Email
   */
  async fulfillOrder(orderId: string): Promise<void> {
    try {
      this.logger.log(`Starting fulfillment for order ${orderId}`);

      // 1. Fetch order details
      const order = await this.ordersService.findById(orderId);
      if (!order) throw new NotFoundException(`Order ${orderId} not found`);

      // 2. Create Kinguin order
      const kinguinOrder = await this.kinguinClient.createOrder({
        offerId: order.items[0].productId, // First item's product
        quantity: 1,
      });
      this.logger.log(`Kinguin order created: ${kinguinOrder.id}`);

      // 3. Retrieve key from Kinguin (sync or poll)
      const licenseKey = await this.pollKinguinKey(kinguinOrder.id);
      this.logger.log(`Key retrieved from Kinguin`);

      // 4. Encrypt key for storage
      const encryptionKey = process.env.KEY_ENCRYPTION_SECRET!;
      const encryptedKey = encryptKey(licenseKey, encryptionKey);

      // 5. Store in R2
      const { objectKey, expiresAt } = await this.r2Storage.storeKey(
        orderId,
        encryptedKey,
        order.email,
      );
      this.logger.log(`Key stored in R2: ${objectKey}`);

      // 6. Update order status
      await this.ordersService.markFulfilled(orderId);

      // 7. Queue email notification (async)
      await this.fulfillmentQueue.add(
        'sendDeliveryEmail',
        { orderId, email: order.email, expiresAt },
        { removeOnComplete: true },
      );

      this.logger.log(`Order ${orderId} fulfillment complete`);
    } catch (error) {
      this.logger.error(`Fulfillment failed for order ${orderId}`, error);
      await this.ordersService.markFailed(orderId);
      throw error;
    }
  }

  /**
   * Poll Kinguin for key with retries
   */
  private async pollKinguinKey(
    kinguinOrderId: string,
    maxAttempts: number = 10,
    delayMs: number = 2000,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.kinguinClient.getOrderStatus(kinguinOrderId);

        if (status.key) {
          this.logger.log(`Key received on attempt ${attempt}`);
          return status.key;
        }

        if (status.status === 'failed') {
          throw new Error(`Kinguin order failed: ${status.error || 'unknown'}`);
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        if (attempt === maxAttempts) throw error;
      }
    }

    throw new Error('Timeout waiting for key from Kinguin');
  }

  /**
   * Get current fulfillment status
   */
  async getOrderStatus(orderId: string): Promise<FulfillmentStatusDto> {
    const order = await this.ordersService.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    return {
      orderId,
      status: order.status === 'fulfilled' ? 'fulfilled' : 'pending',
      error: order.status === 'failed' ? 'Fulfillment failed' : undefined,
    };
  }

  /**
   * Handle Kinguin webhook (key delivery status updates)
   */
  async handleKinguinWebhook(payload: any): Promise<void> {
    // Implement based on Kinguin webhook schema
    this.logger.log(`Kinguin webhook received: ${JSON.stringify(payload)}`);
    // Update order status based on webhook
  }
}
```

**Quality Requirements:**

- ✅ Orchestration of multiple services
- ✅ Polling logic with retries
- ✅ Comprehensive error handling
- ✅ Audit logging at each step
- ✅ Queue integration for async tasks

---

#### Task 7: Update PaymentsService IPN Handler ✅ READY

**File:** `apps/api/src/modules/payments/payments.service.ts` (modified)

**Modification to `handleIpn()` method:**

```typescript
async handleIpn(dto: IpnRequestDto): Promise<void> {
  // ... existing idempotency check ...

  // Existing: markPaid()
  await this.orders.markPaid(orderId);

  // NEW: Queue fulfillment job instead of inline
  await this.fulfillmentQueue.add(
    'fulfillOrder',
    { orderId },
    {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  );

  this.logger.log(`Fulfillment job queued for order ${orderId}`);
}
```

**Quality Requirements:**

- ✅ Async fulfillment via queue
- ✅ Retry logic with exponential backoff
- ✅ Clean separation of concerns
- ✅ Maintains fast IPN response

---

### **LAYER 3: API Endpoints (Tasks 8-10)**

#### Task 8: Create Fulfillment Controller Endpoints ✅ READY

**File:** `apps/api/src/modules/fulfillment/fulfillment.controller.ts` (250+ lines)

**Endpoints to implement:**

```typescript
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { FulfillmentService } from './fulfillment.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { FulfillmentStatusDto, KeyResponseDto, DeliverKeyDto } from './dto';

@ApiTags('Fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly r2Storage: R2StorageService,
  ) {}

  /**
   * GET /fulfillment/{orderId}/status
   * Get current fulfillment status for an order
   */
  @Get(':orderId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get fulfillment status' })
  @ApiResponse({ status: 200, type: FulfillmentStatusDto })
  async getStatus(@Param('orderId') orderId: string): Promise<FulfillmentStatusDto> {
    return this.fulfillmentService.getOrderStatus(orderId);
  }

  /**
   * GET /fulfillment/{orderId}/download-link
   * Get signed URL for downloading encrypted key
   */
  @Get(':orderId/download-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get key download link (15-min expiry)' })
  @ApiResponse({ status: 200, type: KeyResponseDto })
  async getDownloadLink(@Param('orderId') orderId: string): Promise<KeyResponseDto> {
    const downloadUrl = await this.r2Storage.retrieveSignedUrl(orderId);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return {
      orderId,
      downloadUrl,
      expiresAt,
      message: 'Your download link will expire in 15 minutes. Please download now.',
    };
  }

  /**
   * POST /fulfillment/{orderId}/deliver
   * Manually deliver key (admin-only)
   */
  @Post(':orderId/deliver')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually deliver key to customer' })
  @ApiResponse({ status: 200, type: DeliverKeyDto })
  async manuallyDeliverKey(
    @Param('orderId') orderId: string,
    @Body() dto: DeliverKeyDto,
  ): Promise<DeliverKeyDto> {
    // Admin override: manually deliver key
    await this.fulfillmentService.fulfillOrder(orderId);
    return dto;
  }
}
```

**Quality Requirements:**

- ✅ Ownership verification via JWT guard
- ✅ Comprehensive Swagger documentation
- ✅ Type-safe DTOs on all responses
- ✅ Error handling with proper HTTP codes

---

#### Task 9: Create Kinguin Webhook Handler ✅ READY

**File:** `apps/api/src/modules/webhooks/kinguin-webhook.controller.ts` (200+ lines)

**Endpoint to implement:**

```typescript
import { Controller, Post, Headers, Req, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { WebhooksService } from './webhooks.service';
import { verifyKinguinSignature } from './kinguin-signature.util';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly webhooksService: WebhooksService,
  ) {}

  /**
   * POST /webhooks/kinguin
   * Handle Kinguin order status updates
   */
  @Post('kinguin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Kinguin webhook handler' })
  @ApiResponse({ status: 200, schema: { properties: { ok: { type: 'boolean' } } } })
  async handleKinguinWebhook(
    @Headers('x-kinguin-signature') signature: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const raw = req.rawBody?.toString?.() ?? JSON.stringify(req.body);

    // 1. Verify signature
    const secret = process.env.KINGUIN_WEBHOOK_SECRET!;
    if (!verifyKinguinSignature(raw, signature, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Log webhook (idempotency check)
    const payload = JSON.parse(raw);
    const logged = await this.webhooksService.logWebhook({
      provider: 'kinguin',
      externalId: payload.id || payload.orderId,
      status: 'received',
      rawPayload: payload,
    });

    if (logged.isDuplicate) {
      return res.status(200).json({ ok: true }); // Already processed
    }

    // 3. Process based on webhook type
    try {
      switch (payload.type || payload.event) {
        case 'order.ready':
        case 'order.delivered':
          // Key is ready or delivered
          await this.fulfillmentService.handleKinguinWebhook(payload);
          break;

        case 'order.failed':
        case 'order.cancelled':
          // Mark order as failed
          await this.fulfillmentService.handleKinguinWebhook(payload);
          break;

        default:
          this.logger.warn(`Unknown Kinguin webhook type: ${payload.type}`);
      }

      // 4. Update webhook log
      await this.webhooksService.updateWebhook(logged.id, {
        status: 'processed',
        processedAt: new Date(),
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      await this.webhooksService.updateWebhook(logged.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error('Kinguin webhook processing failed', error);
      return res.status(500).json({ error: 'Processing failed' });
    }
  }
}
```

**Quality Requirements:**

- ✅ Signature verification (HMAC or similar)
- ✅ Idempotency protection via webhook log
- ✅ Proper error handling and audit trail
- ✅ Fast response (200 immediately)

---

#### Task 10: Create Admin Payment Management Endpoints ✅ READY

**File:** `apps/api/src/modules/admin/admin-payments.controller.ts` (200+ lines)

**Endpoints to implement:**

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PaymentsService } from '../payments/payments.service';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto';

@ApiTags('Admin - Payments')
@UseGuards(AdminGuard)
@ApiBearerAuth('JWT-auth')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  /**
   * GET /admin/payments?page=1&limit=20&status=finished
   * List all payments with filtering
   */
  @Get()
  @ApiOperation({ summary: 'List payments (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  async listPayments(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ): Promise<PaginatedResponse<PaymentResponseDto>> {
    return this.paymentsService.findAllPaginated({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      where: status ? { status } : {},
    });
  }

  /**
   * GET /admin/payments/{id}
   * Get specific payment with full audit trail
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, type: PaymentDetailDto })
  async getPayment(@Param('id') id: string): Promise<PaymentDetailDto> {
    const payment = await this.paymentsService.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');

    return {
      ...payment,
      webhookLogs: await this.getWebhookLogs(payment.externalId),
    };
  }

  /**
   * GET /admin/orders/{id}/fulfillment
   * Get fulfillment status and R2 delivery info
   */
  @Get('orders/:orderId/fulfillment')
  @ApiOperation({ summary: 'Get order fulfillment status' })
  @ApiResponse({ status: 200, type: FulfillmentDetailDto })
  async getFulfillmentStatus(@Param('orderId') orderId: string): Promise<FulfillmentDetailDto> {
    const status = await this.fulfillmentService.getOrderStatus(orderId);
    // Include R2 storage details, access logs, etc.
    return status;
  }

  private async getWebhookLogs(externalId: string): Promise<any[]> {
    // Fetch webhook logs for audit trail
    return [];
  }
}
```

**Quality Requirements:**

- ✅ Admin guard on all endpoints
- ✅ Comprehensive pagination support
- ✅ Full audit trail visibility
- ✅ Filtering by status, date range, etc.

---

### **LAYER 4: Testing & Validation (Tasks 11-12)**

#### Task 11: FulfillmentService Unit Tests ✅ READY

**File:** `apps/api/src/modules/fulfillment/fulfillment.service.spec.ts` (400+ lines)

**Test scenarios (15+):**

```typescript
describe('FulfillmentService', () => {
  // 1. fulfillOrder() success path
  it('should fulfill order: Kinguin → R2 → Email', async () => {
    // Arrange
    const orderId = 'test-order-id';
    const mockKinguinOrder = { id: 'king-order-123', key: 'ABCD-EFGH-IJKL' };
    // Act & Assert
  });

  // 2. fulfillOrder() with Kinguin API failure
  it('should mark order failed if Kinguin API fails', async () => {
    // Mock Kinguin error, verify order marked as failed
  });

  // 3. fulfillOrder() with R2 upload failure
  it('should rollback if R2 upload fails', async () => {
    // Mock R2 error, verify order marked as failed
  });

  // 4. fulfillOrder() with key polling timeout
  it('should timeout if key not received from Kinguin', async () => {
    // Mock delayed Kinguin response, verify timeout after max attempts
  });

  // 5. fulfillOrder() with encryption key missing
  it('should fail if encryption key not configured', async () => {
    // Verify proper error handling
  });

  // 6. getOrderStatus() for fulfilled order
  it('should return fulfilled status', async () => {});

  // 7. getOrderStatus() for pending order
  it('should return pending status', async () => {});

  // 8. getOrderStatus() for failed order
  it('should return failed status with error message', async () => {});

  // 9. getOrderStatus() for non-existent order
  it('should throw NotFoundException', async () => {});

  // 10. handleKinguinWebhook() for ready event
  it('should update order when key ready', async () => {});

  // 11. handleKinguinWebhook() for failed event
  it('should mark order failed on webhook failure', async () => {});

  // 12. handleKinguinWebhook() with invalid payload
  it('should handle malformed webhook gracefully', async () => {});

  // 13. Idempotency: fulfillOrder() called twice
  it('should not process order twice (queue deduplication)', async () => {});

  // 14. Audit trail: fulfillOrder() logs each step
  it('should log all fulfillment steps', async () => {});

  // 15. Email integration: fulfillOrder() queues email
  it('should queue delivery email after fulfillment', async () => {});
});
```

**Quality Requirements:**

- ✅ 15+ test scenarios covering happy path, errors, edge cases
- ✅ Mock Kinguin and R2 APIs
- ✅ Verify database updates
- ✅ Check audit logs
- ✅ Idempotency testing

---

#### Task 12: R2 Integration Tests ✅ READY

**File:** `apps/api/src/modules/storage/r2-storage.service.spec.ts` (300+ lines)

**Test scenarios (10+):**

```typescript
describe('R2StorageService', () => {
  // 1. storeKey() success
  it('should store encrypted key and return object key', async () => {});

  // 2. storeKey() creates delivery log
  it('should create key delivery log entry', async () => {});

  // 3. storeKey() with metadata
  it('should store metadata (customer email, timestamp)', async () => {});

  // 4. retrieveSignedUrl() returns valid URL
  it('should return signed URL for stored key', async () => {});

  // 5. retrieveSignedUrl() expires after 15 minutes
  it('should reject expired keys', async () => {});

  // 6. retrieveSignedUrl() not found
  it('should throw NotFoundException for non-existent key', async () => {});

  // 7. retrieveSignedUrl() updates access log
  it('should update lastAccessedAt on retrieval', async () => {});

  // 8. verifyAccess() ownership check
  it('should verify user ownership before access', async () => {});

  // 9. cleanupExpiredKeys() deletes old keys
  it('should delete keys older than 15 minutes', async () => {});

  // 10. cleanupExpiredKeys() handles deletion failure
  it('should continue cleanup if one deletion fails', async () => {});
});
```

**Quality Requirements:**

- ✅ 10+ test scenarios
- ✅ Mock AWS S3 API
- ✅ Verify database changes
- ✅ Check expiry enforcement
- ✅ Ownership verification

---

### **LAYER 5: Database Entities & Migration (Tasks 13)**

#### Task 13: Create Database Entities & Migration ✅ READY

**Files:**

1. **KeyDeliveryLog Entity** - `apps/api/src/database/entities/key-delivery-log.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('key_delivery_logs')
@Index(['orderId', 'status'])
@Index(['expiresAt'])
export class KeyDeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  orderId!: string;

  @Column('varchar')
  customerEmail!: string;

  @Column('varchar')
  objectKey!: string; // S3/R2 object key

  @Column('enum', { enum: ['stored', 'accessed', 'expired', 'deleted'] })
  status!: 'stored' | 'accessed' | 'expired' | 'deleted';

  @Column('timestamp', { nullable: true })
  expiresAt!: Date;

  @Column('timestamp', { nullable: true })
  lastAccessedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

2. **Migration** - `apps/api/src/database/migrations/1730000000004-CreateKeyDeliveryLogs.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateKeyDeliveryLogs1730000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'key_delivery_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'orderId', type: 'uuid' },
          { name: 'customerEmail', type: 'varchar' },
          { name: 'objectKey', type: 'varchar' },
          {
            name: 'status',
            type: 'enum',
            enum: ['stored', 'accessed', 'expired', 'deleted'],
          },
          { name: 'expiresAt', type: 'timestamp', isNullable: true },
          { name: 'lastAccessedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Indexes
    await queryRunner.createIndex(
      'key_delivery_logs',
      new TableIndex({ columnNames: ['orderId', 'status'] }),
    );
    await queryRunner.createIndex(
      'key_delivery_logs',
      new TableIndex({ columnNames: ['expiresAt'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('key_delivery_logs');
  }
}
```

**Quality Requirements:**

- ✅ Proper indexes for query performance
- ✅ Status enum for state tracking
- ✅ Expiry enforcement
- ✅ Access audit trail

---

### **LAYER 6: Documentation & Verification (Task 14)**

#### Task 14: Phase 3 Summary & Security Verification ✅ READY

**File:** `docs/developer-workflow/02-Level/LEVEL_2_PHASE3_FINAL.md` (500+ lines)

**Content to include:**

1. **Executive Summary** (50 lines)
   - 14 tasks completed
   - Test coverage (25+, passing)
   - Architecture overview
   - Security verification

2. **Task-by-Task Breakdown** (300 lines)
   - Each of 14 tasks with implementation details
   - Code snippets and patterns
   - Quality metrics

3. **Security Checklist** (50 lines)
   - ✅ AES-256-GCM encryption for keys
   - ✅ 15-minute signed URL expiry
   - ✅ Ownership verification on access
   - ✅ HMAC verification on Kinguin webhooks
   - ✅ Rate limiting on endpoints
   - ✅ No plaintext keys in logs/emails
   - ✅ Key cleanup on expiry
   - ✅ Audit trail for all access

4. **Integration Points** (50 lines)
   - NOWPayments → FulfillmentService
   - FulfillmentService → KinguinClient
   - KinguinClient → R2StorageService
   - R2StorageService → KeyDeliveryLog

5. **Phase 4 Readiness** (50 lines)
   - What's ready for next phase
   - Known limitations
   - Future improvements

---

## 📋 Phase 3 Environment Setup

### Environment Variables to Add

```bash
# Kinguin API
KINGUIN_API_KEY=your_kinguin_api_key
KINGUIN_API_SECRET=your_kinguin_secret
KINGUIN_BASE=https://www.kinguin.net/api/v1  # Production
# KINGUIN_BASE=https://sandbox.kinguin.net/api/v1  # Sandbox
KINGUIN_WEBHOOK_SECRET=your_webhook_secret

# Cloudflare R2
R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=bitloot-keys

# Key Encryption
KEY_ENCRYPTION_SECRET=your_encryption_secret_256_bit

# Admin
ADMIN_SECRET=your_admin_secret_for_manual_operations
```

### Dependencies to Add

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 🎯 Success Criteria

**Phase 3 is complete when:**

- ✅ 14 tasks all implemented
- ✅ 25+ tests passing (Kinguin client, R2 storage, fulfillment service)
- ✅ Type-check: 0 errors
- ✅ Lint: 0 errors
- ✅ Security checklist: All 8 items verified
- ✅ End-to-end: Payment → Kinguin → R2 → Email flow working
- ✅ Documentation: Complete with architecture diagrams

---

## 📈 Expected Metrics (End of Phase 3)

```
Total Tests (API):     60+/60+ PASSING ✅
Type-Check:            0 errors ✅
Lint:                  0 errors ✅
Code Coverage:         Payment (100%), Fulfillment (95%), Storage (95%)
Security Audit:        8/8 items verified ✅
Documentation:         Complete with examples ✅
Production Readiness:  95% (minor polish remaining for Phase 4)
```

---

## 🚀 Ready to Begin?

Phase 3 tasks are all planned and documented. Start with **Task 1: Kinguin Client Wrapper** when ready!

**Next step:** Implement Task 1 (KinguinClient) → Full end-to-end fulfillment system

---

**Phase 3 Planning:** ✅ **COMPLETE**  
**Ready to start implementation:** ✅ **YES**  
**Estimated duration:** 3-4 development days  
**Target completion:** November 11-12, 2025
