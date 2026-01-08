/**
 * Mock R2StorageClient for testing and development
 *
 * Provides in-memory storage instead of connecting to real Cloudflare R2.
 * Generates fake signed URLs with expiry timestamps.
 *
 * Used in:
 * - Development mode (NODE_ENV === 'development')
 * - Test mode when R2 credentials not provided
 *
 * @example
 * const mockR2 = new MockR2StorageClient();
 * const url = await mockR2.generateSignedUrl({ orderId: 'order-123' });
 * // → https://r2.mock/orders/order-123/key.json?expires=1699564800
 */

export class MockR2StorageClient {
  private storage = new Map<string, { key: Buffer; iv: Buffer; authTag: Buffer }>();

  /**
   * Mock: Upload encrypted key to R2 (in-memory storage in mock)
   *
   * @param config Upload configuration
   * @param config.orderId Order ID
   * @param config.encryptedKey Encrypted key buffer
   * @param config.encryptionIv Encryption IV buffer
   * @param config.authTag HMAC auth tag buffer
   * @returns Storage reference
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async uploadEncryptedKey(config: {
    orderId: string;
    encryptedKey: Buffer;
    encryptionIv: Buffer;
    authTag: Buffer;
  }): Promise<string> {
    const key = `orders/${config.orderId}/key.json`;
    this.storage.set(key, {
      key: config.encryptedKey,
      iv: config.encryptionIv,
      authTag: config.authTag,
    });

    return key;
  }

  /**
   * Mock: Generate short-lived signed URL
   *
   * Returns a fake but realistic-looking URL with expiry timestamp.
   * In real implementation, this would be signed by AWS SDK.
   *
   * @param config URL generation configuration
   * @param config.orderId Order ID
   * @param config.expiresInSeconds Time until expiry (seconds)
   * @returns Signed URL string
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async generateSignedUrl(config: {
    orderId: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    const expiresIn = config.expiresInSeconds ?? 180 * 60; // 3 hours default
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Generate fake but realistic-looking signed URL
    const fakeSignature = Buffer.from(
      `mock-sig-${config.orderId}-${expiresAt}`,
    ).toString('base64');
    const url = `https://r2.mock/orders/${config.orderId}/key.json?X-Amz-Signature=${fakeSignature}&X-Amz-Expires=${expiresIn}&X-Amz-Date=${new Date()
      .toISOString()
      .replace(/[:-]/g, '')}`;

    return url;
  }

  /**
   * Mock: Retrieve encrypted key from storage
   *
   * @param key Storage reference (e.g., 'orders/order-123/key.json')
   * @returns Encrypted key data or null if not found
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async retrieveEncryptedKey(key: string): Promise<{
    key: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } | null> {
    const data = this.storage.get(key);
    return data ?? null;
  }

  /**
   * Mock: Delete key from storage
   *
   * @param key Storage reference to delete
   * @returns true if deleted, false if not found
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async deleteKey(key: string): Promise<boolean> {
    const existed = this.storage.has(key);
    if (existed) {
      this.storage.delete(key);
    }
    return existed;
  }

  /**
   * Mock: List all stored keys (for testing/debugging)
   *
   * @returns Array of storage keys
   */
  listKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Mock: Clear all storage (for testing cleanup)
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Mock: Check if file exists at path
   *
   * Returns true if a file has been stored at this path in-memory.
   *
   * @param path Full path to check (e.g., 'products/{productId}/key.json')
   * @returns true if file exists, false otherwise
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async exists(path: string): Promise<boolean> {
    if (path === '' || path === null || path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    // Check both in-memory storage and simulated paths
    const exists = this.storage.has(path);
    console.warn(`[MockR2] exists(${path}): ${exists}`);
    return exists;
  }

  /**
   * Mock: Generate signed URL for arbitrary path
   *
   * Returns a fake but realistic-looking URL with expiry timestamp.
   *
   * @param params URL generation parameters
   * @param params.path Full path to the file
   * @param params.expiresInSeconds URL expiry time (default: 10800 = 3 hours)
   * @returns Signed URL string
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async generateSignedUrlForPath(params: {
    path: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    if (params.path === '' || params.path === null || params.path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    const expiresIn = params.expiresInSeconds ?? 10800; // 3 hours default
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Generate fake but realistic-looking signed URL
    const fakeSignature = Buffer.from(
      `mock-sig-${params.path}-${expiresAt}`,
    ).toString('base64');
    const url = `https://r2.mock/${params.path}?X-Amz-Signature=${fakeSignature}&X-Amz-Expires=${expiresIn}&X-Amz-Date=${new Date()
      .toISOString()
      .replace(/[:-]/g, '')}`;

    console.warn(`[MockR2] generateSignedUrlForPath(${params.path}): ${url}`);
    return url;
  }

  /**
   * Mock: Upload file to arbitrary path
   *
   * Stores data in-memory at the given path.
   *
   * @param params Upload parameters
   * @param params.path Full path to store the file
   * @param params.data File content (JSON object or string)
   * @returns Mock ETag
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async uploadToPath(params: {
    path: string;
    data: Record<string, unknown> | string;
  }): Promise<string> {
    if (params.path === '' || params.path === null || params.path === undefined) {
      throw new Error('Invalid path: must be a non-empty string');
    }

    const body = typeof params.data === 'string' ? params.data : JSON.stringify(params.data);
    
    // Store as Buffer for consistency with other storage methods
    this.storage.set(params.path, {
      key: Buffer.from(body),
      iv: Buffer.from('mock-iv'),
      authTag: Buffer.from('mock-auth'),
    });

    const etag = `"mock-etag-${Date.now()}"`;
    console.warn(`[MockR2] uploadToPath(${params.path}): ${etag}`);
    return etag;
  }

  /**
   * Mock: Verify key exists for order
   *
   * @param orderId Order ID
   * @returns true if key exists, false otherwise
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async verifyKeyExists(orderId: string): Promise<boolean> {
    const path = `orders/${orderId}/key.json`;
    return this.storage.has(path);
  }
}
