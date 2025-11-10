import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { R2StorageClient } from './r2.client';
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

// Mock the AWS SDK client
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('R2StorageClient', () => {
  let client: R2StorageClient;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    s3Mock.reset();

    const mockConfig = {
      endpoint: 'https://test.r2.cloudflarestorage.com',
      accessKeyId: 'test-key-id',
      secretAccessKey: 'test-secret-key',
      bucketName: 'test-bucket',
    };

    client = new R2StorageClient(mockConfig);
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    s3Mock.reset();
  });

  describe('Constructor', () => {
    it('should throw if endpoint is missing', () => {
      expect(() => {
        new R2StorageClient({
          endpoint: '',
          accessKeyId: 'key',
          secretAccessKey: 'secret',
          bucketName: 'bucket',
        });
      }).toThrow('R2 endpoint is required');
    });

    it('should throw if accessKeyId is missing', () => {
      expect(() => {
        new R2StorageClient({
          endpoint: 'https://test.r2.cloudflarestorage.com',
          accessKeyId: '',
          secretAccessKey: 'secret',
          bucketName: 'bucket',
        });
      }).toThrow('R2 access key ID is required');
    });

    it('should throw if secretAccessKey is missing', () => {
      expect(() => {
        new R2StorageClient({
          endpoint: 'https://test.r2.cloudflarestorage.com',
          accessKeyId: 'key',
          secretAccessKey: '',
          bucketName: 'bucket',
        });
      }).toThrow('R2 secret access key is required');
    });

    it('should use default bucket name if not provided', () => {
      const mockConfig = {
        endpoint: 'https://test.r2.cloudflarestorage.com',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const testClient = new R2StorageClient(mockConfig);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      expect((testClient as any).bucketName).toBe('bitloot-keys');
    });

    it('should successfully instantiate with valid config', () => {
      const mockConfig = {
        endpoint: 'https://test.r2.cloudflarestorage.com',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        bucketName: 'test-bucket',
      };

      expect(() => new R2StorageClient(mockConfig)).not.toThrow();
    });
  });

  describe('uploadEncryptedKey', () => {
    it('should throw if orderId is empty', async () => {
      await expect(
        client.uploadEncryptedKey({
          orderId: '',
          encryptedKey: 'test-key',
          encryptionIv: 'test-iv',
          authTag: 'test-tag',
        }),
      ).rejects.toThrow('Invalid orderId');
    });

    it('should validate parameters', async () => {
      await expect(
        client.uploadEncryptedKey({
          orderId: 'valid-order',
          encryptedKey: '',
          encryptionIv: '',
          authTag: '',
        }),
      ).rejects.toThrow(); // Will reject at AWS SDK level
    });
  });

  describe('generateSignedUrl', () => {
    it('should throw if orderId is empty', async () => {
      await expect(client.generateSignedUrl({ orderId: '' })).rejects.toThrow('Invalid orderId');
    });

    it('should validate expiresInSeconds bounds', async () => {
      // Too small (< 1)
      await expect(
        client.generateSignedUrl({
          orderId: 'test-order',
          expiresInSeconds: 0,
        }),
      ).rejects.toThrow('Invalid expiresInSeconds');

      // Too large (> 604800)
      await expect(
        client.generateSignedUrl({
          orderId: 'test-order',
          expiresInSeconds: 604801,
        }),
      ).rejects.toThrow('Invalid expiresInSeconds');
    });
  });

  describe('deleteKey', () => {
    it('should throw if orderId is empty', async () => {
      await expect(client.deleteKey('')).rejects.toThrow('Invalid orderId');
    });
  });

  describe('verifyKeyExists', () => {
    it('should throw if orderId is empty', async () => {
      await expect(client.verifyKeyExists('')).rejects.toThrow('Invalid orderId');
    });

    it('should return boolean type', async () => {
      try {
        const result = await client.verifyKeyExists('test-order');
        expect(typeof result).toBe('boolean');
      } catch (error) {
        // Verification may throw on AWS error (not 404)
        if (error instanceof Error) {
          expect(error.message).toContain('R2');
        }
      }
    });
  });

  describe('healthCheck', () => {
    it('should return boolean type', async () => {
      const result = await client.healthCheck();
      expect(typeof result).toBe('boolean');
    });

    it('should not throw errors', async () => {
      await expect(client.healthCheck()).resolves.toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle configuration with all properties', () => {
      const config = {
        endpoint: 'https://account.r2.cloudflarestorage.com',
        accessKeyId: 'account-id',
        secretAccessKey: 'app-secret',
        bucketName: 'bitloot-keys',
      };

      expect(() => new R2StorageClient(config)).not.toThrow();
    });

    it('should handle configuration with minimal properties', () => {
      const config = {
        endpoint: 'https://account.r2.cloudflarestorage.com',
        accessKeyId: 'account-id',
        secretAccessKey: 'app-secret',
      };

      expect(() => new R2StorageClient(config)).not.toThrow();
    });

    it('should maintain separate instances', () => {
      const client1 = new R2StorageClient({
        endpoint: 'https://account1.r2.cloudflarestorage.com',
        accessKeyId: 'key1',
        secretAccessKey: 'secret1',
        bucketName: 'bucket1',
      });

      const client2 = new R2StorageClient({
        endpoint: 'https://account2.r2.cloudflarestorage.com',
        accessKeyId: 'key2',
        secretAccessKey: 'secret2',
        bucketName: 'bucket2',
      });

      // Both should be valid instances
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('Parameter validation', () => {
    it('should validate orderId in uploadEncryptedKey', async () => {
      await expect(
        client.uploadEncryptedKey({
          orderId: '',
          encryptedKey: 'key',
          encryptionIv: 'iv',
          authTag: 'tag',
        }),
      ).rejects.toThrow('Invalid orderId');
    });

    it('should validate orderId in generateSignedUrl', async () => {
      await expect(
        client.generateSignedUrl({
          orderId: '',
        }),
      ).rejects.toThrow('Invalid orderId');
    });

    it('should validate orderId in deleteKey', async () => {
      await expect(client.deleteKey('')).rejects.toThrow('Invalid orderId');
    });

    it('should validate orderId in verifyKeyExists', async () => {
      await expect(client.verifyKeyExists('')).rejects.toThrow('Invalid orderId');
    });
  });
});
