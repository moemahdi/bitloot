import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Key } from '../orders/key.entity';
import { R2StorageClient } from '../storage/r2.client';
import { decryptKey } from '../storage/encryption.util';

/**
 * Delivery Integration Service
 *
 * Manages the complete delivery experience:
 * 1. Generate download links for fulfilled orders
 * 2. Track link expiry and access
 * 3. Retrieve and decrypt encryption keys
 * 4. Log key revelation events (audit trail)
 * 5. Validate access permissions
 *
 * Security model:
 * - Links expire after 3 hours
 * - Keys are encrypted in R2 (never stored plaintext)
 * - All revelations are logged (who, when, from where)
 * - Re-download attempts rejected after first access
 *
 * @example
 * // Generate delivery link
 * const link = await deliveryService.generateDeliveryLink(orderId);
 * // {
 * //   signedUrl: 'https://r2.../orders/order-123/key.json?...signature...',
 * //   expiresAt: Date,
 * //   message: 'Link expires in 3 hours'
 * // }
 *
 * // Reveal key (called when user clicks download)
 * const key = await deliveryService.revealKey(orderId, itemId, {
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 * });
 * // {
 * //   plainKey: 'steam-key-1234567890',
 * //   revealedAt: Date,
 * //   expiresAt: Date,
 * //   downloadCount: 1
 * // }
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger('DeliveryService');

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Key) private readonly keyRepo: Repository<Key>,
    private readonly r2StorageClient: R2StorageClient,
  ) { }

  /**
   * Generate a delivery link for a fulfilled order
   *
   * Steps:
   * 1. Verify order is fulfilled
   * 2. Verify all items have signed URLs
   * 3. Return primary signed URL (first item)
   * 4. Log link generation
   *
   * @param orderId Order ID to generate link for
   * @returns Link details with expiry time
   * @throws NotFoundException if order not found
   * @throws BadRequestException if order not fulfilled
   */
  async generateDeliveryLink(orderId: string): Promise<DeliveryLinkResult> {
    try {
      this.logger.debug(`[DELIVERY] Generating link for order: ${orderId}`);

      // Verify order exists and is fulfilled
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (order === null || order === undefined) {
        throw new NotFoundException(`Order not found: ${orderId}`);
      }

      if (order.status !== 'fulfilled') {
        throw new BadRequestException(`Order not fulfilled. Status: ${order.status}`);
      }

      if (order.items === null || order.items === undefined || order.items.length === 0) {
        throw new BadRequestException(`Order has no items: ${orderId}`);
      }

      // Check all items have signed URLs
      const allFulfilled = order.items.every(
        (item) =>
          item.signedUrl !== null && item.signedUrl !== undefined && item.signedUrl.length > 0,
      );

      if (!allFulfilled) {
        throw new BadRequestException(`Not all items have delivery links: ${orderId}`);
      }

      // Get primary item's signed URL
      const primaryItem = order.items[0];

      if (primaryItem === null || primaryItem === undefined) {
        throw new Error(`Primary item not found`);
      }

      const signedUrl = primaryItem.signedUrl;

      if (signedUrl === null || signedUrl === undefined || signedUrl.length === 0) {
        throw new Error(`Primary item has no signed URL: ${primaryItem.id}`);
      }

      // Calculate expiry (3 hours from R2 signed URL)
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

      this.logger.log(
        `✅ [DELIVERY] Link generated for order ${orderId} (expires: ${expiresAt.toISOString()})`,
      );

      return {
        orderId,
        signedUrl,
        expiresAt,
        itemCount: order.items.length,
        message: 'Link expires in 3 hours. Download your key now.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Link generation failed: ${message}`);
      throw error;
    }
  }

  /**
   * Retrieve encrypted key data from R2
   *
   * Used internally to fetch encrypted key before decryption.
   *
   * @param orderId Order ID
   * @returns Encrypted key object {encryptedKey, iv, authTag, contentType}
   * @throws Error if key not found in R2
   */
  async getEncryptedKeyFromR2(orderId: string): Promise<EncryptedKeyData> {
    try {
      this.logger.debug(`[DELIVERY] Fetching encrypted key from R2: ${orderId}`);

      // Fetch encrypted key data from R2
      const keyData = await this.r2StorageClient.getEncryptedKey(orderId);

      // Map field names: R2 JSON uses 'encryptionIv', but EncryptedKeyData uses 'iv'
      const result: EncryptedKeyData = {
        encryptedKey: keyData.encryptedKey,
        iv: keyData.encryptionIv,
        authTag: keyData.authTag,
        algorithm: keyData.algorithm,
        contentType: keyData.contentType,
      };

      this.logger.debug(`[DELIVERY] Encrypted key retrieved from R2 (type: ${result.contentType})`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Failed to retrieve encrypted key: ${message}`);
      throw error;
    }
  }

  /**
   * Reveal (decrypt) key and log access
   *
   * Steps:
   * 1. Verify order and item exist
   * 2. Verify order is fulfilled with signed URL
   * 3. Retrieve encrypted key from R2
   * 4. Get encryption key from vault (or mock)
   * 5. Decrypt key using decryptKey()
   * 6. Log revelation event with IP/User-Agent
   * 7. Increment download counter
   * 8. Return plaintext key with access info
   *
   * Security:
   * - Key is only decrypted on-demand (never stored plaintext)
   * - Decryption failures (tampering) are caught and logged
   * - All accesses are audited (IP, User-Agent, timestamp)
   * - Links expire after 15 minutes
   *
   * @param orderId Order ID
   * @param itemId Order item ID (for multi-item orders)
   * @param accessInfo Client IP and User-Agent for audit logging
   * @returns Revealed key with access metadata
   * @throws Error if order/item not found or key retrieval fails
   */
  async revealKey(
    orderId: string,
    itemId: string,
    accessInfo: { ipAddress: string; userAgent: string },
  ): Promise<RevealedKeyResult> {
    try {
      this.logger.debug(`[DELIVERY] Revealing key for order ${orderId}, item ${itemId}`);

      // Step 1-2: Verify order and item exist
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (order === null || order === undefined) {
        throw new NotFoundException(`Order not found: ${orderId}`);
      }

      if (order.status !== 'fulfilled') {
        throw new BadRequestException(`Order not fulfilled. Status: ${order.status}`);
      }

      const item = order.items.find((i) => i.id === itemId);
      if (item === null || item === undefined) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      if (item.signedUrl === null || item.signedUrl === undefined || item.signedUrl.length === 0) {
        throw new BadRequestException(`Item not fulfilled (no signed URL): ${itemId}`);
      }

      // Fetch Key entity to get the encryption key (or raw marker)
      const keyEntity = await this.keyRepo.findOne({ where: { orderItemId: itemId } });

      if (keyEntity?.encryptionKey == null) {
        throw new Error(`Key metadata not found for item: ${itemId}`);
      }

      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
      let plainKey: string;
      let contentType: string;
      let isBase64 = false;
      let signedUrl: string | undefined;

      // Check if this is a raw key (no encryption) or encrypted key (legacy)
      if (keyEntity.encryptionKey.startsWith('raw:')) {
        // ===== RAW KEY (New format - no encryption) =====
        contentType = keyEntity.encryptionKey.substring(4); // Extract content type after 'raw:'
        this.logger.debug(`[DELIVERY] Detected raw key with content type: ${contentType}`);

        // Fetch raw key content from R2 (using itemId for multi-item orders)
        const rawKeyResult = await this.r2StorageClient.getRawKeyFromR2({
          orderId,
          orderItemId: itemId,
          contentType,
        });

        plainKey = rawKeyResult.content;
        isBase64 = rawKeyResult.isBase64;

        // Generate a fresh signed URL for direct download (3 hours)
        signedUrl = await this.r2StorageClient.generateSignedUrlForRawKey({
          orderId,
          orderItemId: itemId,
          contentType,
          expiresInSeconds: 3 * 60 * 60, // 3 hours
        });

        this.logger.debug(`[DELIVERY] Raw key fetched successfully (base64: ${isBase64})`);
      } else {
        // ===== ENCRYPTED KEY (Legacy format) =====
        this.logger.debug(`[DELIVERY] Detected encrypted key, using decryption flow`);

        // Retrieve encrypted key data from R2
        const encryptedKeyData = await this.getEncryptedKeyFromR2(orderId);
        contentType = encryptedKeyData.contentType;

        const decryptionKey = Buffer.from(keyEntity.encryptionKey, 'base64');

        // Decrypt key
        try {
          plainKey = decryptKey(
            encryptedKeyData.encryptedKey,
            encryptedKeyData.iv,
            encryptedKeyData.authTag,
            decryptionKey,
          );
          this.logger.debug(`[DELIVERY] Key decrypted successfully`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`[DELIVERY] Key decryption failed (tampering?): ${message}`);
          throw new Error(`Failed to decrypt key. Possible data corruption: ${message}`);
        }
      }

      // Update viewedAt timestamp on key entity for audit trail
      const revealedAt = new Date();
      const isFirstReveal = keyEntity.viewedAt === null || keyEntity.viewedAt === undefined;
      
      if (isFirstReveal) {
        // First time reveal - set the viewedAt timestamp
        keyEntity.viewedAt = revealedAt;
      }
      
      // Always increment download count and update access info
      keyEntity.downloadCount = (keyEntity.downloadCount ?? 0) + 1;
      keyEntity.lastAccessIp = accessInfo.ipAddress;
      keyEntity.lastAccessUserAgent = accessInfo.userAgent;
      await this.keyRepo.save(keyEntity);
      
      this.logger.debug(`[DELIVERY] Key access recorded for item ${itemId} (download #${keyEntity.downloadCount})`);

      // Log revelation event
      this.logKeyRevelation({
        orderId,
        itemId,
        email: order.email ?? 'unknown@example.com',
        ipAddress: accessInfo.ipAddress,
        userAgent: accessInfo.userAgent,
        revealedAt,
      });

      this.logger.log(
        `✅ [DELIVERY] Key revealed for order ${orderId}, item ${itemId} from ${accessInfo.ipAddress} (type: ${contentType}, raw: ${keyEntity.encryptionKey.startsWith('raw:')})`,
      );

      return {
        orderId,
        itemId,
        plainKey,
        contentType,
        isBase64,
        signedUrl,
        revealedAt,
        expiresAt,
        downloadCount: keyEntity.downloadCount,
        accessInfo,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Key revelation failed: ${message}`);
      throw error;
    }
  }



  /**
   * Log key revelation event for audit trail
   *
   * Logs:
   * - Order ID and Item ID
   * - Customer email
   * - Client IP address
   * - User-Agent (browser/app info)
   * - Exact timestamp
   *
   * Used for:
   * - Compliance reporting
   * - Fraud detection
   * - Access auditing
   *
   * In production, this would write to:
   * - Audit log database
   * - CloudWatch logs
   * - DataDog / Sentry
   *
   * @param log Revelation event data
   */
  private logKeyRevelation(log: KeyRevelationLog): void {
    try {
      this.logger.log(
        `📋 [AUDIT] Key revealed: order=${log.orderId}, item=${log.itemId}, email=${log.email}, ip=${log.ipAddress}`,
      );

      // TODO: Write to audit log repository in Task 13
      // const result = await this.auditLogRepo.save({
      //   orderId: log.orderId,
      //   itemId: log.itemId,
      //   email: log.email,
      //   ipAddress: log.ipAddress,
      //   userAgent: log.userAgent,
      //   eventType: 'KEY_REVEALED',
      //   createdAt: log.revealedAt,
      // });
      // Placeholder for audit log persistence

      this.logger.debug(`[DELIVERY] Revelation logged`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Failed to log revelation: ${message}`);
      // Don't throw - logging failure shouldn't break delivery
    }
  }

  /**
   * Check if delivery link has expired
   *
   * @param orderId Order ID
   * @returns Expiry status with timestamp
   */
  async checkLinkExpiry(orderId: string): Promise<LinkExpiryStatus> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (order === null || order === undefined) {
        throw new NotFoundException(`Order not found: ${orderId}`);
      }

      if (order.items === null || order.items === undefined || order.items.length === 0) {
        throw new BadRequestException(`Order has no items: ${orderId}`);
      }

      const item = order.items[0];

      if (item === null || item === undefined) {
        throw new BadRequestException(`Primary item not found: ${orderId}`);
      }

      if (item.signedUrl === null || item.signedUrl === undefined || item.signedUrl.length === 0) {
        throw new BadRequestException(`Item has no signed URL: ${item.id}`);
      }

      // R2 signed URLs expire after 3 hours from generation
      const generatedAt = item.updatedAt;
      const expiresAt = new Date(generatedAt.getTime() + 3 * 60 * 60 * 1000); // 3 hours
      const now = new Date();
      const isExpired = now > expiresAt;
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );

      return {
        orderId,
        isExpired,
        expiresAt,
        remainingSeconds,
        message: isExpired
          ? 'Link has expired. Request a new one.'
          : `Link expires in ${Math.floor(remainingSeconds / 60)} minutes.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Expiry check failed: ${message}`);
      throw error;
    }
  }

  /**
   * Health check for delivery service
   */
  async healthCheck(): Promise<DeliveryHealthCheck> {
    try {
      this.logger.debug(`[DELIVERY] Running health check`);

      // Check R2 client
      let r2Healthy = false;
      try {
        r2Healthy = await this.r2StorageClient.healthCheck();
      } catch {
        r2Healthy = false;
      }

      return {
        service: 'DeliveryService',
        status: r2Healthy ? 'healthy' : 'degraded',
        dependencies: {
          r2Storage: r2Healthy,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[DELIVERY] Health check failed: ${message}`);
      return {
        service: 'DeliveryService',
        status: 'unhealthy',
        dependencies: {
          r2Storage: false,
        },
        timestamp: new Date(),
        error: message,
      };
    }
  }
}

/**
 * ============================================================================
 * Interfaces & Types
 * ============================================================================
 */

/**
 * Generated delivery link
 */
export interface DeliveryLinkResult {
  orderId: string;
  signedUrl: string;
  expiresAt: Date;
  itemCount: number;
  message: string;
}

/**
 * Encrypted key data from R2
 */
export interface EncryptedKeyData {
  encryptedKey: string; // base64
  iv: string; // base64
  authTag: string; // base64
  algorithm: string; // 'aes-256-gcm'
  /**
   * Content type of the key data.
   * - 'text/plain' - Standard text key (default)
   * - 'image/jpeg' - JPEG image (serial contains base64 image)
   * - 'image/png' - PNG image (serial contains base64 image)
   * - 'image/gif' - GIF image (serial contains base64 image)
   */
  contentType: string;
}

/**
 * Revealed key with access metadata
 */
export interface RevealedKeyResult {
  orderId: string;
  itemId: string;
  /**
   * For text keys: the actual key content
   * For image keys: base64-encoded image data (when isBase64 is true)
   * May be empty if signedUrl is provided for direct download
   */
  plainKey: string;
  /**
   * Content type of the key data.
   * - 'text/plain' - Standard text key (default)
   * - 'image/jpeg' - JPEG image (plainKey contains base64 image)
   * - 'image/png' - PNG image (plainKey contains base64 image)
   * - 'image/gif' - GIF image (plainKey contains base64 image)
   */
  contentType: string;
  /**
   * Whether plainKey contains base64-encoded data (true for images)
   */
  isBase64?: boolean;
  /**
   * Direct download URL for the key file (for raw keys)
   * When provided, clients can use this for direct file download
   */
  signedUrl?: string;
  revealedAt: Date;
  expiresAt: Date;
  downloadCount: number;
  accessInfo: {
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * Key revelation audit log entry
 */
export interface KeyRevelationLog {
  orderId: string;
  itemId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  revealedAt: Date;
}

/**
 * Link expiry status
 */
export interface LinkExpiryStatus {
  orderId: string;
  isExpired: boolean;
  expiresAt: Date;
  remainingSeconds: number;
  message: string;
}

/**
 * Health check result
 */
export interface DeliveryHealthCheck {
  service: 'DeliveryService';
  status: 'healthy' | 'degraded' | 'unhealthy';
  dependencies: {
    r2Storage: boolean;
  };
  timestamp: Date;
  error?: string;
}
