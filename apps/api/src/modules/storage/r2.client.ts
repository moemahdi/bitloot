import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * R2StorageClient — Type-safe Cloudflare R2 (S3-compatible) API wrapper
 *
 * Provides high-level methods for encrypted key storage and retrieval.
 * Uses AWS SDK v3 for compatibility with Cloudflare R2.
 *
 * @example
 * const client = new R2StorageClient({
 *   endpoint: 'https://xxx.r2.cloudflarestorage.com',
 *   accessKeyId: 'xxx',
 *   secretAccessKey: 'xxx',
 *   bucketName: 'bitloot-keys',
 * });
 *
 * const url = await client.uploadEncryptedKey({
 *   orderId: 'order-123',
 *   encryptedKey: Buffer.from('...'),
 *   encryptionIv: Buffer.from('...'),
 * });
 */

@Injectable()
export class R2StorageClient {
  private readonly logger = new Logger(R2StorageClient.name);
  private s3: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  /**
   * Initialize R2StorageClient with connection details
   *
   * @param config Configuration object
   * @param config.endpoint R2 endpoint URL (e.g., https://{accountId}.r2.cloudflarestorage.com)
   * @param config.accessKeyId R2 API access key ID
   * @param config.secretAccessKey R2 API secret access key
   * @param config.bucketName Target bucket name (default: 'bitloot-keys')
   *
   * @throws Error if endpoint or credentials are empty
   */
  constructor(config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName?: string;
  }) {
    // Validate required config - explicit empty string check
    if (config.endpoint === '' || config.endpoint === null || config.endpoint === undefined) {
      throw new Error('R2 endpoint is required');
    }
    if (
      config.accessKeyId === '' ||
      config.accessKeyId === null ||
      config.accessKeyId === undefined
    ) {
      throw new Error('R2 access key ID is required');
    }
    if (
      config.secretAccessKey === '' ||
      config.secretAccessKey === null ||
      config.secretAccessKey === undefined
    ) {
      throw new Error('R2 secret access key is required');
    }

    this.endpoint = config.endpoint;
    this.bucketName = config.bucketName ?? 'bitloot-keys';

    // Initialize S3Client pointing to R2

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.logger.debug(
      `✅ R2StorageClient initialized: ${this.endpoint} (bucket: ${this.bucketName})`,
    );
  }

  /**
   * Upload encrypted key to R2
   *
   * Stores an encrypted key with metadata for later retrieval.
   * The key is stored at: `orders/{orderId}/key.json`
   *
   * @param params Upload parameters
   * @param params.orderId Order ID (used as storage key)
   * @param params.encryptedKey Encrypted key data (base64 encoded)
   * @param params.encryptionIv Encryption IV (base64 encoded)
   * @param params.authTag Authentication tag for GCM (base64 encoded)
   * @param params.metadata Optional metadata (order email, timestamp, etc.)
   *
   * @returns S3 ETag (version identifier)
   *
   * @throws Error if upload fails
   *
   * @example
   * const etag = await client.uploadEncryptedKey({
   *   orderId: '550e8400-e29b-41d4-a716-446655440000',
   *   encryptedKey: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
   *   encryptionIv: 'NzY1ZDQ4ZDEtYTFiYS00ZWY0LWJkYzctYTI0ZjYyMWJhYjEy',
   *   authTag: 'dGVzdC1hdXRoLXRhZw==',
   *   metadata: { email: 'user@example.com', timestamp: Date.now() },
   * });
   */
  async uploadEncryptedKey(params: {
    orderId: string;
    encryptedKey: string;
    encryptionIv: string;
    authTag: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const objectKey = `orders/${params.orderId}/key.json`;
    const keyData = {
      encryptedKey: params.encryptedKey,
      encryptionIv: params.encryptionIv,
      authTag: params.authTag,
      algorithm: 'aes-256-gcm',
      uploadedAt: new Date().toISOString(),
      ...params.metadata,
    };

    try {
      this.logger.debug(`Uploading encrypted key to R2: ${objectKey}`);

      const input: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: JSON.stringify(keyData),
        ContentType: 'application/json',
        Metadata: {
          'order-id': params.orderId,
          'encryption-algorithm': 'aes-256-gcm',
          'uploaded-at': new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(input);

      const response = await this.s3.send(command);

      const etag = response.ETag ?? 'unknown';
      this.logger.log(`✅ Key uploaded to R2: ${objectKey} (ETag: ${etag})`);

      return etag;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to upload key to R2: ${message}`);
      throw new Error(`R2 upload failed: ${message}`);
    }
  }

  /**
   * Generate signed URL for key download
   *
   * Creates a time-limited URL that allows downloading the encrypted key
   * from R2 without requiring credentials.
   *
   * @param params URL generation parameters
   * @param params.orderId Order ID (must match uploaded key)
   * @param params.expiresInSeconds URL expiry time in seconds (default: 900 = 15 min)
   *
   * @returns Signed download URL
   *
   * @throws Error if URL generation fails or orderId is invalid
   *
   * @example
   * const url = await client.generateSignedUrl({
   *   orderId: '550e8400-e29b-41d4-a716-446655440000',
   *   expiresInSeconds: 900, // 15 minutes
   * });
   * // Returns: https://xxx.r2.cloudflarestorage.com/orders/550e8400.../key.json?...signature...
   */
  async generateSignedUrl(params: { orderId: string; expiresInSeconds?: number }): Promise<string> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const expiresInSeconds = params.expiresInSeconds ?? 900; // Default 15 minutes

    // Validate expiry
    if (typeof expiresInSeconds !== 'number' || expiresInSeconds < 1 || expiresInSeconds > 604800) {
      throw new Error('Invalid expiresInSeconds: must be between 1 and 604800 (7 days)');
    }

    const objectKey = `orders/${params.orderId}/key.json`;

    try {
      this.logger.debug(
        `Generating signed URL for: ${objectKey} (expires in ${expiresInSeconds}s)`,
      );

      const input: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename="bitloot-key-${params.orderId}.json"`,
      };

      const command = new GetObjectCommand(input);

      const url = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });

      this.logger.log(`✅ Signed URL generated: ${objectKey}`);

      return url;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to generate signed URL: ${message}`);
      throw new Error(`R2 signed URL generation failed: ${message}`);
    }
  }

  /**
   * Delete encrypted key from R2
   *
   * Removes the key file from storage. Used for cleanup after delivery
   * or if fulfillment is cancelled.
   *
   * @param orderId Order ID identifying the key to delete
   *
   * @returns void (deletion is fire-and-forget in most cases)
   *
   * @throws Error if deletion fails
   *
   * @example
   * await client.deleteKey('550e8400-e29b-41d4-a716-446655440000');
   */
  async deleteKey(orderId: string): Promise<void> {
    // Validate orderId
    if (orderId === '' || orderId === null || orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const objectKey = `orders/${orderId}/key.json`;

    try {
      this.logger.debug(`Deleting key from R2: ${objectKey}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      await this.s3.send(command);
      this.logger.log(`✅ Key deleted from R2: ${objectKey}`);
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to delete key from R2: ${message}`);
      throw new Error(`R2 deletion failed: ${message}`);
    }
  }

  /**
   * Verify key exists in R2
   *
   * Checks if an encrypted key file exists in storage.
   * Used to validate fulfillment before sending download link to customer.
   *
   * @param orderId Order ID to verify
   *
   * @returns true if key exists, false if not found
   *
   * @throws Error if verification fails (network error, permission error, etc.)
   *
   * @example
   * const exists = await client.verifyKeyExists('550e8400-e29b-41d4-a716-446655440000');
   * if (!exists) {
   *   throw new Error('Key not found in storage');
   * }
   */
  async verifyKeyExists(orderId: string): Promise<boolean> {
    // Validate orderId
    if (orderId === '' || orderId === null || orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const objectKey = `orders/${orderId}/key.json`;

    try {
      this.logger.debug(`Verifying key exists: ${objectKey}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      // Try to get object metadata without downloading body

      const response = await this.s3.send(command);

      const exists = response.ContentLength !== undefined && response.ContentLength > 0;

      if (exists) {
        this.logger.debug(`✅ Key exists in R2: ${objectKey}`);
      } else {
        this.logger.warn(`⚠️ Key not found or empty: ${objectKey}`);
      }

      return exists;
    } catch (error) {
      // Check if error is 404 (not found) - this is expected in normal flow
      const message = this.extractErrorMessage(error);
      if (message.includes('NoSuchKey') || message.includes('404')) {
        this.logger.debug(`Key not found (expected for new orders): ${objectKey}`);
        return false;
      }

      // For actual errors (network, permission), throw
      this.logger.error(`❌ Failed to verify key existence: ${message}`);
      throw new Error(`R2 verification failed: ${message}`);
    }
  }

  /**
   * Health check for R2 connection
   *
   * Attempts a simple operation to verify R2 connectivity.
   * Used for readiness probes and diagnostics.
   *
   * @returns true if R2 is accessible, false otherwise (never throws)
   *
   * @example
   * const healthy = await client.healthCheck();
   * if (!healthy) {
   *   console.warn('R2 connection issue detected');
   * }
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.debug('Performing R2 health check...');

      // Try to list objects with max 1 result (minimal operation)

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: '.health-check',
      });

      // This will likely fail with 404, but that's OK - we're just checking connectivity
      try {
        await this.s3.send(command);
      } catch (error) {
        const message = this.extractErrorMessage(error);
        if (message.includes('NoSuchKey') || message.includes('404')) {
          // 404 is fine - bucket is accessible, key just doesn't exist
          this.logger.debug('✅ R2 health check passed (404 expected)');
          return true;
        }
        throw error;
      }

      this.logger.debug('✅ R2 health check passed');
      return true;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.warn(`⚠️ R2 health check failed: ${message}`);
      return false;
    }
  }

  /**
   * Extract error message from various error types
   *
   * Handles AWS SDK errors, HTTP errors, and generic errors.
   * Provides consistent error messaging for logging and client response.
   *
   * @param error Unknown error object
   * @returns Extracted error message string
   *
   * @private
   */
  private extractErrorMessage(error: unknown): string {
    // Handle Error instances
    if (error instanceof Error) {
      const awsError = error as Error & {
        name?: string;
        code?: string;
      };

      // Check for AWS-specific error properties
      if (typeof awsError.name === 'string') {
        if (awsError.name.includes('NoSuchKey')) {
          return 'Key not found in bucket';
        }
        if (awsError.name.includes('AccessDenied')) {
          return 'Access denied - check R2 credentials';
        }
        if (awsError.name.includes('Timeout')) {
          return 'Request timeout - R2 not responding';
        }
      }

      // Check for ECONNABORTED (timeout during transmission)
      if (typeof awsError.code === 'string' && awsError.code === 'ECONNABORTED') {
        return 'Request timeout';
      }

      // Default Error message
      return error.message;
    }

    // Fallback for non-Error objects
    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown R2 error';
  }
}
