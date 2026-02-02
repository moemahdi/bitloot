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

    this.logger.debug('✅ R2StorageClient initialized');
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
   * @param params.contentType Content type of the key (text/plain, image/jpeg, etc.)
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
   *   contentType: 'text/plain',
   *   metadata: { email: 'user@example.com', timestamp: Date.now() },
   * });
   */
  async uploadEncryptedKey(params: {
    orderId: string;
    encryptedKey: string;
    encryptionIv: string;
    authTag: string;
    contentType?: string;
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
      contentType: params.contentType ?? 'text/plain',
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
   * Upload raw key content to R2 (no encryption)
   *
   * Stores the key content directly in its original format as provided by Kinguin.
   * The key is stored at: `orders/{orderId}/key.{extension}`
   *
   * @param params Upload parameters
   * @param params.orderId Order ID (used as storage key)
   * @param params.content Raw key content (string or Buffer)
   * @param params.contentType Content type (text/plain, image/jpeg, etc.)
   * @param params.filename Original filename (optional)
   * @param params.metadata Optional metadata (order email, timestamp, etc.)
   *
   * @returns Object with ETag, objectKey, and contentType
   *
   * @throws Error if upload fails
   *
   * @example
   * const result = await client.uploadRawKey({
   *   orderId: '550e8400-e29b-41d4-a716-446655440000',
   *   content: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
   *   contentType: 'text/plain',
   * });
   */
  async uploadRawKey(params: {
    orderId: string;
    orderItemId?: string; // Optional: for multi-item orders, creates unique file per item
    content: string | Buffer;
    contentType: string;
    filename?: string;
    metadata?: Record<string, string>;
  }): Promise<{ etag: string; objectKey: string; contentType: string }> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    // Determine file extension from content type
    const extensionMap: Record<string, string> = {
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/octet-stream': 'bin',
    };
    const extension = extensionMap[params.contentType] ?? 'txt';
    // Use orderItemId in path for multi-item orders to avoid overwrites
    const itemSuffix = params.orderItemId !== null && params.orderItemId !== undefined && params.orderItemId !== '' 
      ? `-${params.orderItemId.slice(0, 8)}` 
      : '';
    const objectKey = `orders/${params.orderId}/key${itemSuffix}.${extension}`;

    try {
      this.logger.debug(`Uploading raw key to R2: ${objectKey} (${params.contentType})`);

      const input: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: params.content,
        ContentType: params.contentType,
        Metadata: {
          'order-id': params.orderId,
          'original-filename': params.filename ?? `key.${extension}`,
          'uploaded-at': new Date().toISOString(),
          ...params.metadata,
        },
      };

      const command = new PutObjectCommand(input);
      const response = await this.s3.send(command);

      const etag = response.ETag ?? 'unknown';
      this.logger.log(`✅ Raw key uploaded to R2: ${objectKey} (ETag: ${etag}, type: ${params.contentType})`);

      return { etag, objectKey, contentType: params.contentType };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to upload raw key to R2: ${message}`);
      throw new Error(`R2 raw key upload failed: ${message}`);
    }
  }

  /**
   * Generate signed URL for raw key download
   *
   * Creates a time-limited URL for downloading the raw key from R2.
   *
   * @param params URL generation parameters
   * @param params.orderId Order ID (must match uploaded key)
   * @param params.contentType Content type of the stored key
   * @param params.expiresInSeconds URL expiry time in seconds (default: 10800 = 3 hours)
   *
   * @returns Signed download URL
   */
  async generateSignedUrlForRawKey(params: {
    orderId: string;
    orderItemId?: string; // Optional: for multi-item orders, matches the uploaded file
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const expiresInSeconds = params.expiresInSeconds ?? 10800; // Default 3 hours

    // Determine file extension and filename
    const extensionMap: Record<string, string> = {
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/octet-stream': 'bin',
    };
    const extension = extensionMap[params.contentType] ?? 'txt';
    // Use orderItemId in path for multi-item orders to match the uploaded file
    const itemSuffix = params.orderItemId !== null && params.orderItemId !== undefined && params.orderItemId !== '' 
      ? `-${params.orderItemId.slice(0, 8)}` 
      : '';
    const objectKey = `orders/${params.orderId}/key${itemSuffix}.${extension}`;
    const filename = `bitloot-key-${params.orderId}${itemSuffix}.${extension}`;

    try {
      this.logger.debug(
        `Generating signed URL for raw key: ${objectKey} (expires in ${expiresInSeconds}s)`,
      );

      const input: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
        ResponseContentType: params.contentType,
      };

      const command = new GetObjectCommand(input);
      const url = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });

      this.logger.log(`✅ Signed URL generated for raw key: ${objectKey}`);

      return url;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to generate signed URL for raw key: ${message}`);
      throw new Error(`R2 signed URL generation failed: ${message}`);
    }
  }

  /**
   * Fetch raw key content from R2
   *
   * Retrieves the raw key file (text or image) from R2 storage.
   * For text keys, returns the content as a string.
   * For image keys, returns the content as base64.
   *
   * @param params Fetch parameters
   * @param params.orderId Order ID
   * @param params.contentType Content type of the stored key
   *
   * @returns Object with key content (text or base64) and content type
   *
   * @example
   * const result = await client.getRawKeyFromR2({
   *   orderId: '550e8400-e29b-41d4-a716-446655440000',
   *   contentType: 'text/plain',
   * });
   * // Returns: { content: 'XXXX-XXXX-XXXX', contentType: 'text/plain', isBase64: false }
   */
  async getRawKeyFromR2(params: {
    orderId: string;
    orderItemId?: string; // Optional: for multi-item orders, matches the uploaded file
    contentType: string;
  }): Promise<{ content: string; contentType: string; isBase64: boolean }> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    // Determine file extension
    const extensionMap: Record<string, string> = {
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/octet-stream': 'bin',
    };
    const extension = extensionMap[params.contentType] ?? 'txt';
    // Use orderItemId in path for multi-item orders to match the uploaded file
    const itemSuffix = params.orderItemId !== null && params.orderItemId !== undefined && params.orderItemId !== '' 
      ? `-${params.orderItemId.slice(0, 8)}` 
      : '';
    const objectKey = `orders/${params.orderId}/key${itemSuffix}.${extension}`;

    try {
      this.logger.debug(`Fetching raw key from R2: ${objectKey}`);

      const input: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
      };

      const command = new GetObjectCommand(input);
      const response = await this.s3.send(command);

      if (response.Body === null || response.Body === undefined) {
        throw new Error(`No content found at ${objectKey}`);
      }

      // Read the body as bytes
      const bodyBytes = await response.Body.transformToByteArray();

      // For text content, return as string
      // For images, return as base64
      const isImage = params.contentType.startsWith('image/');
      let content: string;

      if (isImage) {
        // Convert to base64 for images
        content = Buffer.from(bodyBytes).toString('base64');
      } else {
        // Convert to string for text
        content = Buffer.from(bodyBytes).toString('utf-8');
      }

      this.logger.log(`✅ Raw key fetched from R2: ${objectKey} (${bodyBytes.length} bytes)`);

      return {
        content,
        contentType: params.contentType,
        isBase64: isImage,
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to fetch raw key from R2: ${message}`);
      throw new Error(`R2 raw key fetch failed: ${message}`);
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
   * @param params.expiresInSeconds URL expiry time in seconds (default: 10800 = 3 hours)
   *
   * @returns Signed download URL
   *
   * @throws Error if URL generation fails or orderId is invalid
   *
   * @example
   * const url = await client.generateSignedUrl({
   *   orderId: '550e8400-e29b-41d4-a716-446655440000',
   *   expiresInSeconds: 10800, // 3 hours
   * });
   * // Returns: https://xxx.r2.cloudflarestorage.com/orders/550e8400.../key.json?...signature...
   */
  async generateSignedUrl(params: { orderId: string; expiresInSeconds?: number }): Promise<string> {
    // Validate orderId
    if (params.orderId === '' || params.orderId === null || params.orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const expiresInSeconds = params.expiresInSeconds ?? 10800; // Default 3 hours

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
   * Check if a file exists at arbitrary path in R2
   *
   * Generic method for checking existence at any path.
   * Used for custom product keys stored outside standard order paths.
   *
   * @param path Full path to the file (e.g., 'products/{productId}/key.json')
   * @returns true if file exists, false otherwise
   *
   * @throws Error if check fails (network/permission error)
   *
   * @example
   * const exists = await client.exists('products/550e8400.../key.json');
   */
  async exists(path: string): Promise<boolean> {
    if (path === '' || path === null || path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    try {
      this.logger.debug(`Checking if file exists: ${path}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const response = await this.s3.send(command);
      const exists = response.ContentLength !== undefined && response.ContentLength > 0;

      if (exists) {
        this.logger.debug(`✅ File exists in R2: ${path}`);
      } else {
        this.logger.warn(`⚠️ File not found or empty: ${path}`);
      }

      return exists;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      if (message.includes('NoSuchKey') || message.includes('404')) {
        this.logger.debug(`File not found: ${path}`);
        return false;
      }
      this.logger.error(`❌ Failed to check file existence: ${message}`);
      throw new Error(`R2 existence check failed: ${message}`);
    }
  }

  /**
   * Generate signed URL for arbitrary path in R2
   *
   * Generic method for generating signed URLs at any path.
   * Used for custom product keys stored outside standard order paths.
   *
   * @param params URL generation parameters
   * @param params.path Full path to the file
   * @param params.expiresInSeconds URL expiry time (default: 900 = 15 min)
   *
   * @returns Signed download URL
   *
   * @example
   * const url = await client.generateSignedUrlForPath({
   *   path: 'products/550e8400.../key.json',
   *   expiresInSeconds: 900,
   * });
   */
  async generateSignedUrlForPath(params: {
    path: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    if (params.path === '' || params.path === null || params.path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    const expiresInSeconds = params.expiresInSeconds ?? 900;

    if (typeof expiresInSeconds !== 'number' || expiresInSeconds < 1 || expiresInSeconds > 604800) {
      throw new Error('Invalid expiresInSeconds: must be between 1 and 604800 (7 days)');
    }

    try {
      this.logger.debug(`Generating signed URL for path: ${params.path} (expires in ${expiresInSeconds}s)`);

      const input: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: params.path,
        ResponseContentDisposition: `attachment; filename="bitloot-key.json"`,
      };

      const command = new GetObjectCommand(input);
      const url = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });

      this.logger.log(`✅ Signed URL generated for path: ${params.path}`);
      return url;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to generate signed URL for path: ${message}`);
      throw new Error(`R2 signed URL generation failed: ${message}`);
    }
  }

  /**
   * Upload file to arbitrary path in R2
   *
   * Generic method for uploading files to any path.
   * Used for custom product key uploads by admin.
   *
   * @param params Upload parameters
   * @param params.path Full path to store the file
   * @param params.data File content (JSON object or string)
   * @param params.metadata Optional metadata
   *
   * @returns S3 ETag
   *
   * @example
   * const etag = await client.uploadToPath({
   *   path: 'products/550e8400.../key.json',
   *   data: { keys: ['KEY-123', 'KEY-456'] },
   * });
   */
  async uploadToPath(params: {
    path: string;
    data: Record<string, unknown> | string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    if (params.path === '' || params.path === null || params.path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    try {
      this.logger.debug(`Uploading to path: ${params.path}`);

      const body = typeof params.data === 'string' ? params.data : JSON.stringify(params.data);

      const input: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: params.path,
        Body: body,
        ContentType: 'application/json',
        Metadata: params.metadata ?? {},
      };

      const command = new PutObjectCommand(input);
      const response = await this.s3.send(command);

      const etag = response.ETag ?? 'unknown';
      this.logger.log(`✅ File uploaded to R2: ${params.path} (ETag: ${etag})`);

      return etag;
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to upload to path: ${message}`);
      throw new Error(`R2 upload failed: ${message}`);
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
   * Retrieve encrypted key data from R2
   *
   * Fetches the JSON file containing the encrypted key and parses it.
   * Used by the delivery service to decrypt keys on-demand.
   *
   * @param orderId Order ID to fetch key for
   * @returns Parsed encrypted key data object including content type
   *
   * @throws Error if key not found or fetch fails
   *
   * @example
   * const keyData = await client.getEncryptedKey('550e8400-e29b-41d4-a716-446655440000');
   * // { encryptedKey: '...', encryptionIv: '...', authTag: '...', algorithm: 'aes-256-gcm', contentType: 'text/plain' }
   */
  async getEncryptedKey(orderId: string): Promise<{
    encryptedKey: string;
    encryptionIv: string;
    authTag: string;
    algorithm: string;
    contentType: string;
  }> {
    if (orderId === '' || orderId === null || orderId === undefined) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const objectKey = `orders/${orderId}/key.json`;

    try {
      this.logger.debug(`Fetching encrypted key from R2: ${objectKey}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.s3.send(command);

      if (response.Body === null || response.Body === undefined) {
        throw new Error(`Key file is empty: ${objectKey}`);
      }

      // Convert stream to string
      const bodyContents = await response.Body.transformToString();
      const keyData = JSON.parse(bodyContents) as {
        encryptedKey?: string;
        encryptionIv?: string;
        authTag?: string;
        algorithm?: string;
        contentType?: string;
      };

      // Validate required fields
      if (
        keyData.encryptedKey === undefined ||
        keyData.encryptionIv === undefined ||
        keyData.authTag === undefined
      ) {
        throw new Error(`Invalid key data structure in ${objectKey}`);
      }

      this.logger.log(`✅ Encrypted key fetched from R2: ${objectKey}`);

      return {
        encryptedKey: keyData.encryptedKey,
        encryptionIv: keyData.encryptionIv,
        authTag: keyData.authTag,
        algorithm: keyData.algorithm ?? 'aes-256-gcm',
        contentType: keyData.contentType ?? 'text/plain',
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`❌ Failed to fetch encrypted key from R2: ${message}`);
      throw new Error(`R2 key fetch failed: ${message}`);
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
