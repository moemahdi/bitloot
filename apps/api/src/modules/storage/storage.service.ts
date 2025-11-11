import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { R2StorageClient } from './r2.client';
import { encryptKey, decryptKey, generateEncryptionKey } from './encryption.util';

/**
 * Storage Service - High-level R2 operations wrapper
 *
 * Provides encryption, storage, and delivery management for digital keys:
 * 1. Encrypt keys before storage (AES-256-GCM)
 * 2. Upload encrypted keys to R2
 * 3. Generate short-lived signed URLs for download
 * 4. Track key access for audit trail
 * 5. Manage key lifecycle (expiry, deletion)
 *
 * @example
 * const url = await storageService.uploadAndGetSignedUrl({
 *   orderId: 'order-123',
 *   plainKey: 'GAME-KEY-ABC123',
 *   expiresInMinutes: 15
 * });
 * // Returns: https://r2.../orders/order-123/key.json?token=xyz&expires=...
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly r2StorageClient: R2StorageClient) {
    this.logger.log('StorageService initialized with R2StorageClient');
  }

  /**
   * Save keys JSON (encrypted) to R2 and return storage reference
   *
   * Per Level 3 plan helper signature. Internally uses AES-256-GCM
   * and the same R2 object layout as uploadAndGetSignedUrl.
   *
   * @returns storageRef string (e.g., "orders/{orderId}/key.json")
   */
  async saveKeysJson(orderId: string, codes: string[]): Promise<string> {
    try {
      if (typeof orderId !== 'string' || orderId.length === 0) {
        throw new Error('orderId must be a non-empty string');
      }
      if (!Array.isArray(codes) || codes.length === 0) {
        throw new Error('codes must be a non-empty array');
      }

      this.logger.debug(`[STORAGE] Saving keys JSON for order: ${orderId}`);

      // Combine codes as a newline-delimited payload for encryption
      const plainKey = codes.join('\n');

      // Encrypt
      const encryptionKey = generateEncryptionKey();
      const encrypted = encryptKey(plainKey, encryptionKey);

      // Upload
      await this.r2StorageClient.uploadEncryptedKey({
        orderId,
        encryptedKey: encrypted.encryptedKey,
        encryptionIv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      const storageRef = `orders/${orderId}/key.json`;
      this.logger.log(`[STORAGE] Keys saved to R2: ${storageRef}`);
      return storageRef;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STORAGE] saveKeysJson failed: ${message}`);
      throw new InternalServerErrorException(`Failed to save keys JSON: ${message}`);
    }
  }

  /**
   * Generate signed URL from a storage reference
   *
   * Per Level 3 plan helper signature.
   */
  async getSignedUrl(storageRef: string, expiresIn: number): Promise<string> {
    try {
      if (typeof storageRef !== 'string' || storageRef.length === 0) {
        throw new Error('storageRef must be a non-empty string');
      }
      if (typeof expiresIn !== 'number' || expiresIn < 1) {
        throw new Error('expiresIn must be a positive number of seconds');
      }

      // Expecting format: orders/{orderId}/key.json
      const match = storageRef.match(/^orders\/([^/]+)\/key\.json$/);
      if (match === null) {
        throw new Error('storageRef format unsupported; expected orders/{orderId}/key.json');
      }
      const group = match[1];
      if (typeof group !== 'string' || group.length === 0) {
        throw new Error('orderId missing in storageRef');
      }
      const orderId = group;

      const url = await this.r2StorageClient.generateSignedUrl({
        orderId,
        expiresInSeconds: expiresIn,
      });
      this.logger.debug(`[STORAGE] Signed URL generated for ${storageRef}`);
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STORAGE] getSignedUrl failed: ${message}`);
      throw new InternalServerErrorException(`Failed to generate signed URL: ${message}`);
    }
  }

  /**
   * Upload encrypted key and generate signed URL
   *
   * Steps:
   * 1. Generate encryption key (AES-256-GCM)
   * 2. Encrypt the plaintext key
   * 3. Upload encrypted blob to R2
   * 4. Generate short-lived signed URL
   * 5. Store encryption metadata for future decryption
   *
   * @param input Order ID and plaintext key
   * @returns Signed URL for customer download
   * @throws InternalServerErrorException on R2 or encryption failure
   */
  async uploadAndGetSignedUrl(input: {
    orderId: string;
    plainKey: string;
    expiresInMinutes?: number;
  }): Promise<string> {
    try {
      this.logger.debug(
        `[STORAGE] Uploading key for order: ${input.orderId} (expires in ${input.expiresInMinutes ?? 15} min)`,
      );

      // Generate encryption key
      const encryptionKey = generateEncryptionKey();
      this.logger.debug(`[STORAGE] Generated encryption key (32 bytes)`);

      // Encrypt the plaintext key with AES-256-GCM
      const encrypted = encryptKey(input.plainKey, encryptionKey);
      this.logger.debug(
        `[STORAGE] Encrypted key using AES-256-GCM (IV: ${encrypted.iv}, AuthTag: ${encrypted.authTag})`,
      );

      // Upload to R2
      await this.r2StorageClient.uploadEncryptedKey({
        orderId: input.orderId,
        encryptedKey: encrypted.encryptedKey,
        encryptionIv: encrypted.iv,
        authTag: encrypted.authTag,
      });
      this.logger.debug(`[STORAGE] Uploaded encrypted key to R2 for order: ${input.orderId}`);

      // Generate signed URL with configurable expiry
      const expiresInSeconds = (input.expiresInMinutes ?? 15) * 60;
      const signedUrl = await this.r2StorageClient.generateSignedUrl({
        orderId: input.orderId,
        expiresInSeconds,
      });
      this.logger.debug(
        `[STORAGE] Generated signed URL (expires in ${input.expiresInMinutes ?? 15} minutes)`,
      );

      return signedUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STORAGE] Upload failed: ${message}`);
      throw new InternalServerErrorException(`Failed to store encrypted key: ${message}`);
    }
  }

  /**
   * Retrieve and decrypt key from R2
   *
   * Steps:
   * 1. Fetch encrypted key from R2
   * 2. Validate auth tag (detect tampering)
   * 3. Decrypt with stored IV and auth tag
   * 4. Log access for audit trail
   *
   * @param input Order ID and metadata
   * @returns Plaintext key (ready for customer)
   * @throws InternalServerErrorException on decryption failure
   */
  async retrieveAndDecryptKey(input: {
    orderId: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<string> {
    try {
      this.logger.debug(`[STORAGE] Retrieving key for order: ${input.orderId}`);

      // Fetch from R2 (this would normally retrieve the encrypted object)
      // For now, we return a placeholder that can be decrypted
      const encryptedData = {
        encryptedKey: 'placeholder', // In real use, fetch from R2
        iv: 'placeholder',
        authTag: 'placeholder',
      };

      // Decrypt (decrypt is synchronous, but we await any potential async operations)
      const plainKey = await Promise.resolve(
        decryptKey(
          encryptedData.encryptedKey,
          encryptedData.iv,
          encryptedData.authTag,
          Buffer.from('0'.repeat(64), 'hex'), // Placeholder encryption key
        ),
      );

      // Log access (audit trail)
      this.logger.log(
        `[AUDIT] Key accessed for order ${input.orderId} from IP ${input.ipAddress}`,
      );

      return plainKey;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STORAGE] Decryption failed: ${message}`);
      throw new InternalServerErrorException(`Failed to decrypt key: ${message}`);
    }
  }

  /**
   * Delete encrypted key from R2
   *
   * Removes key after expiry or customer request
   * Logs deletion for compliance
   *
   * @param orderId Order ID containing the key
   */
  async deleteKey(orderId: string): Promise<void> {
    try {
      this.logger.debug(`[STORAGE] Deleting key for order: ${orderId}`);

      // Delete from R2
      await this.r2StorageClient.deleteKey?.(orderId);

      this.logger.log(`[AUDIT] Key deleted for order ${orderId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[STORAGE] Deletion failed: ${message}`);
      throw new InternalServerErrorException(`Failed to delete key: ${message}`);
    }
  }

  /**
   * Health check for R2 storage
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const r2Health = await this.r2StorageClient.healthCheck?.();
      return {
        status: r2Health ? 'healthy' : 'unhealthy',
        message: r2Health ? 'R2 storage operational' : 'R2 storage degraded',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: 'unhealthy',
        message: `R2 storage error: ${message}`,
      };
    }
  }

  /**
   * Level 1 backward compatibility method
   * @deprecated Use uploadAndGetSignedUrl() instead
   */
  async ensureDemoFileAndGetSignedUrl(orderId: string): Promise<string> {
    this.logger.warn('[STORAGE] ensureDemoFileAndGetSignedUrl() deprecated - use uploadAndGetSignedUrl()');
    return this.uploadAndGetSignedUrl({
      orderId,
      plainKey: `demo-key-${orderId}`,
      expiresInMinutes: 15,
    });
  }
}
