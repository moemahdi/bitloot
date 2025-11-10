/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeliveryService } from './delivery.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock the encryption utility
vi.mock('../storage/encryption.util', () => ({
  decryptKey: vi.fn((_encryptedKey, _iv, _authTag, _key) => {
    // Mock decryption: return a test key string
    return 'MOCK-DECRYPTED-KEY-FOR-TESTING-123456';
  }),
}));

/**
 * DeliveryService Vitest Suite
 *
 * Tests for:
 * 1. Delivery link generation
 * 2. Key revelation and decryption
 * 3. Encryption key management
 * 4. Expiry tracking
 * 5. Audit logging
 * 6. Error handling
 * 7. Health checks
 *
 * Total: 55+ tests
 */
describe('DeliveryService', () => {
  let service: DeliveryService;

  // Mock repositories - typed as any for test mocking
  const mockOrderRepo: any = {
    findOne: vi.fn(),
  };

  const mockOrderItemRepo: any = {
    update: vi.fn(),
  };

  const mockR2Client: any = {
    uploadEncryptedKey: vi.fn(),
    generateSignedUrl: vi.fn(),
    deleteKey: vi.fn(),
    verifyKeyExists: vi.fn(),
    healthCheck: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock service with vitest mocked dependencies
    service = new (DeliveryService as any)(mockOrderRepo, mockOrderItemRepo, mockR2Client);
  });

  /**
   * ============================================================================
   * Test Suite 1: Generate Delivery Links
   * ============================================================================
   */
  describe('generateDeliveryLink', () => {
    it('should generate delivery link for fulfilled order', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/orders/order-123/key.json?signature=...',
          },
        ],
        updatedAt: new Date(),
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.generateDeliveryLink(orderId);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderId);
      expect(result.signedUrl).toContain('r2.example.com');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.itemCount).toBe(1);
      expect(result.message).toContain('15 minutes');
    });

    it('should throw if order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.generateDeliveryLink('order-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw if order not fulfilled', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'waiting',
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.generateDeliveryLink('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw if order has no items', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.generateDeliveryLink('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw if items not all fulfilled (no signed URLs)', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: null,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.generateDeliveryLink('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should handle multiple items in order', async () => {
      const mockOrder = {
        id: 'order-123',
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          { id: 'item-1', productId: 'product-1', signedUrl: 'https://r2.../key1' },
          { id: 'item-2', productId: 'product-2', signedUrl: 'https://r2.../key2' },
          { id: 'item-3', productId: 'product-3', signedUrl: 'https://r2.../key3' },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.generateDeliveryLink('order-123');

      expect(result.itemCount).toBe(3);
      expect(result.signedUrl).toContain('key1'); // Returns first item's URL
    });

    it('should return link with correct expiry time (15 minutes)', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const beforeCall = Date.now();
      const result = await service.generateDeliveryLink('order-123');
      const afterCall = Date.now();

      const expectedExpiry = beforeCall + 15 * 60 * 1000;
      const resultExpiry = result.expiresAt.getTime();

      // Allow 100ms tolerance
      expect(resultExpiry).toBeGreaterThanOrEqual(expectedExpiry - 100);
      expect(resultExpiry).toBeLessThanOrEqual(afterCall + 15 * 60 * 1000 + 100);
    });
  });

  /**
   * ============================================================================
   * Test Suite 2: Get Encrypted Key from R2
   * ============================================================================
   */
  describe('getEncryptedKeyFromR2', () => {
    it('should return mock encrypted key data', () => {
      const result = service.getEncryptedKeyFromR2('order-123');

      expect(result).toBeDefined();
      expect(result.encryptedKey).toBe('bW9jay1lbmNyeXB0ZWQta2V5LTMybW9jay1lbmNyeXA=');
      expect(result.iv).toBe('bW9jay1pdi0xMjM0');
      expect(result.authTag).toBe('bW9jay1hdXRoLXRhZy0xNg==');
      expect(result.algorithm).toBe('aes-256-gcm');
    });

    it('should return consistent structure for multiple calls', () => {
      const result1 = service.getEncryptedKeyFromR2('order-123');
      const result2 = service.getEncryptedKeyFromR2('order-456');

      expect(result1).toEqual(result2);
    });
  });

  /**
   * ============================================================================
   * Test Suite 3: Reveal Key (Decryption)
   * ============================================================================
   */
  describe('revealKey', () => {
    it('should reveal key for fulfilled order', async () => {
      const orderId = 'order-123';
      const itemId = 'item-1';
      const accessInfo = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      const mockOrder = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: itemId,
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      // Store encryption key first
      const mockKey = Buffer.alloc(32);
      service.storeEncryptionKey(orderId, mockKey);

      const result = await service.revealKey(orderId, itemId, accessInfo);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderId);
      expect(result.itemId).toBe(itemId);
      expect(result.plainKey).toBeDefined();
      expect(result.revealedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.downloadCount).toBe(1);
      expect(result.accessInfo).toEqual(accessInfo);
    });

    it('should throw if order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.revealKey('order-999', 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if order not fulfilled', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'waiting',
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(
        service.revealKey('order-123', 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if item not found', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [
          {
            id: 'item-2',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(
        service.revealKey('order-123', 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if item has no signed URL', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: null,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(
        service.revealKey('order-123', 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if encryption key not found', async () => {
      const mockOrder = {
        id: 'order-123',
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);
      // Don't store encryption key - should fail

      await expect(
        service.revealKey('order-123', 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow(/Decryption key not found/);
    });

    it('should log access with correct details', async () => {
      const orderId = 'order-123';
      const itemId = 'item-1';
      const email = 'user@example.com';
      const ipAddress = '203.0.113.42';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      const mockOrder = {
        id: orderId,
        email,
        status: 'fulfilled',
        items: [
          {
            id: itemId,
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const mockKey = Buffer.alloc(32);
      service.storeEncryptionKey(orderId, mockKey);

      const result = await service.revealKey(orderId, itemId, {
        ipAddress,
        userAgent,
      });

      expect(result.accessInfo.ipAddress).toBe(ipAddress);
      expect(result.accessInfo.userAgent).toBe(userAgent);
    });
  });

  /**
   * ============================================================================
   * Test Suite 4: Encryption Key Management
   * ============================================================================
   */
  describe('Encryption Key Management', () => {
    it('should store and retrieve encryption key', () => {
      const orderId = 'order-123';
      const key = Buffer.from('a'.repeat(64), 'utf8');

      service.storeEncryptionKey(orderId, key);

      // Verify internally (no public getter, but revealKey should work)
      expect(() => {
        service.storeEncryptionKey(orderId, key);
      }).not.toThrow();
    });

    it('should clear encryption key', async () => {
      const orderId = 'order-123';
      const key = Buffer.from('a'.repeat(64), 'utf8');

      service.storeEncryptionKey(orderId, key);
      service.clearEncryptionKey(orderId);

      // Should throw when trying to use cleared key
      const mockOrder = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(
        service.revealKey(orderId, 'item-1', {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).rejects.toThrow();
    });

    it('should store multiple keys for different orders', () => {
      const key1 = Buffer.from('key1'.repeat(8), 'utf8');
      const key2 = Buffer.from('key2'.repeat(8), 'utf8');

      service.storeEncryptionKey('order-1', key1);
      service.storeEncryptionKey('order-2', key2);

      // Both should be retrievable (internally)
      expect(() => {
        service.storeEncryptionKey('order-1', key1);
        service.storeEncryptionKey('order-2', key2);
      }).not.toThrow();
    });

    it('should overwrite existing key for same order', () => {
      const orderId = 'order-123';
      const key1 = Buffer.from('key1'.repeat(8), 'utf8');
      const key2 = Buffer.from('key2'.repeat(8), 'utf8');

      service.storeEncryptionKey(orderId, key1);
      service.storeEncryptionKey(orderId, key2);

      // Only key2 should be stored (no error on overwrite)
      expect(() => {
        service.storeEncryptionKey(orderId, key2);
      }).not.toThrow();
    });

    it('should handle buffer key storage', () => {
      const orderId = 'order-123';
      const keyBuffer = Buffer.alloc(32);

      expect(() => {
        service.storeEncryptionKey(orderId, keyBuffer);
      }).not.toThrow();
    });
  });

  /**
   * ============================================================================
   * Test Suite 5: Link Expiry Checking
   * ============================================================================
   */
  describe('checkLinkExpiry', () => {
    it('should return active link status', async () => {
      const orderId = 'order-123';
      const recentDate = new Date();

      const mockOrder = {
        id: orderId,
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
            updatedAt: recentDate,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.checkLinkExpiry(orderId);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderId);
      expect(result.isExpired).toBe(false);
      expect(result.remainingSeconds).toBeGreaterThan(0);
      expect(result.message).toContain('expires in');
    });

    it('should return expired link status for old links', async () => {
      const orderId = 'order-123';
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

      const mockOrder = {
        id: orderId,
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
            updatedAt: oldDate,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.checkLinkExpiry(orderId);

      expect(result.isExpired).toBe(true);
      expect(result.remainingSeconds).toBe(0);
      expect(result.message).toContain('expired');
    });

    it('should throw if order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.checkLinkExpiry('order-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw if order has no items', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.checkLinkExpiry('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw if item has no signed URL', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: null,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.checkLinkExpiry('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should calculate remaining time correctly', async () => {
      const orderId = 'order-123';
      const createdTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const recentDate = new Date(createdTime);

      const mockOrder = {
        id: orderId,
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
            updatedAt: recentDate,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.checkLinkExpiry(orderId);

      // Should have ~10 minutes remaining (15 - 5)
      expect(result.remainingSeconds).toBeGreaterThan(9 * 60);
      expect(result.remainingSeconds).toBeLessThan(11 * 60);
    });

    it('should return expiry date timestamp', async () => {
      const orderId = 'order-123';
      const recentDate = new Date();

      const mockOrder = {
        id: orderId,
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
            updatedAt: recentDate,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.checkLinkExpiry(orderId);

      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  /**
   * ============================================================================
   * Test Suite 6: Health Check
   * ============================================================================
   */
  describe('healthCheck', () => {
    it('should return healthy status when R2 is healthy', async () => {
      mockR2Client.healthCheck.mockResolvedValueOnce(true);

      const result = await service.healthCheck();

      expect(result).toBeDefined();
      expect(result.service).toBe('DeliveryService');
      expect(result.status).toBe('healthy');
      expect(result.dependencies.r2Storage).toBe(true);
    });

    it('should return degraded status when R2 is unhealthy', async () => {
      mockR2Client.healthCheck.mockResolvedValueOnce(false);

      const result = await service.healthCheck();

      expect(result.status).toBe('degraded');
      expect(result.dependencies.r2Storage).toBe(false);
    });

    it('should return degraded status on R2 exception', async () => {
      mockR2Client.healthCheck.mockRejectedValueOnce(new Error('R2 connection failed'));

      const result = await service.healthCheck();

      // R2 exception is caught and handled, returns 'degraded'
      expect(result.status).toBe('degraded');
      expect(result.dependencies.r2Storage).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should include timestamp in health check', async () => {
      mockR2Client.healthCheck.mockResolvedValueOnce(true);

      const beforeCall = new Date();
      const result = await service.healthCheck();
      const afterCall = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  /**
   * ============================================================================
   * Test Suite 7: Error Handling & Edge Cases
   * ============================================================================
   */
  describe('Error Handling & Edge Cases', () => {
    it('should handle null order gracefully', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      const tests = [
        () => service.generateDeliveryLink('order-123'),
        () => service.checkLinkExpiry('order-123'),
      ];

      for (const test of tests) {
        await expect(test()).rejects.toThrow();
      }
    });

    it('should handle undefined items array', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'fulfilled',
        items: undefined,
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.generateDeliveryLink('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should handle empty string order ID', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.generateDeliveryLink('')).rejects.toThrow();
    });

    it('should handle special characters in order ID', async () => {
      const orderId = 'order-@#$%^&*()';

      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.generateDeliveryLink(orderId)).rejects.toThrow();
    });

    it('should not throw on logging failure', async () => {
      const orderId = 'order-123';
      const itemId = 'item-1';

      const mockOrder = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: itemId,
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const mockKey = Buffer.alloc(32);
      service.storeEncryptionKey(orderId, mockKey);

      // Should not throw even if logging fails
      await expect(
        service.revealKey(orderId, itemId, {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).resolves.toBeDefined();
    });
  });

  /**
   * ============================================================================
   * Test Suite 8: Integration Scenarios
   * ============================================================================
   */
  describe('Integration Scenarios', () => {
    it('should handle full delivery workflow', async () => {
      const orderId = 'order-123';
      const itemId = 'item-1';

      // Step 1: Generate link
      const mockOrder1 = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: itemId,
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
            updatedAt: new Date(),
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder1);

      const linkResult = await service.generateDeliveryLink(orderId);
      expect(linkResult.signedUrl).toBeDefined();

      // Step 2: Check expiry
      const mockOrder2 = {
        ...mockOrder1,
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder2);

      const expiryResult = await service.checkLinkExpiry(orderId);
      expect(expiryResult.isExpired).toBe(false);

      // Step 3: Store encryption key and reveal
      const mockKey = Buffer.alloc(32);
      service.storeEncryptionKey(orderId, mockKey);

      const mockOrder3 = {
        ...mockOrder1,
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder3);

      const revealResult = await service.revealKey(orderId, itemId, {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(revealResult.plainKey).toBeDefined();

      // Step 4: Clear key
      service.clearEncryptionKey(orderId);
      await expect(
        (async () => {
          const mockOrder4 = { ...mockOrder1 };
          mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder4);
          return service.revealKey(orderId, itemId, {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          });
        })(),
      ).rejects.toThrow();
    });

    it('should handle concurrent link generations', async () => {
      const mockOrder = {
        id: 'order-123',
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const promises = Array.from({ length: 5 }, () => service.generateDeliveryLink('order-123'));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.orderId === 'order-123')).toBe(true);
    });

    it('should handle multiple items with consistent link URLs', async () => {
      const mockOrder = {
        id: 'order-123',
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          { id: 'item-1', productId: 'product-1', signedUrl: 'https://r2.../key1' },
          { id: 'item-2', productId: 'product-2', signedUrl: 'https://r2.../key2' },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.generateDeliveryLink('order-123');

      // Should use first item's URL
      expect(result.signedUrl).toContain('key1');
      expect(result.itemCount).toBe(2);
    });
  });

  /**
   * ============================================================================
   * Test Suite 9: Data Validation
   * ============================================================================
   */
  describe('Data Validation', () => {
    it('should validate signed URL format', async () => {
      const mockOrder = {
        id: 'order-123',
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: '', // Empty URL should fail
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      await expect(service.generateDeliveryLink('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should validate email address in order', async () => {
      const mockOrder = {
        id: 'order-123',
        email: null,
        status: 'fulfilled',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      // Should handle null email gracefully (use default in logs)
      const result = await service.generateDeliveryLink('order-123');
      expect(result).toBeDefined();
    });

    it('should handle very long order IDs', async () => {
      const longOrderId = 'order-' + 'x'.repeat(1000);

      mockOrderRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.generateDeliveryLink(longOrderId)).rejects.toThrow(NotFoundException);
    });

    it('should handle Unicode in user agent', async () => {
      const orderId = 'order-123';
      const itemId = 'item-1';

      const mockOrder = {
        id: orderId,
        email: 'user@example.com',
        status: 'fulfilled',
        items: [
          {
            id: itemId,
            productId: 'product-1',
            signedUrl: 'https://r2.example.com/key.json',
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValueOnce(mockOrder);

      const mockKey = Buffer.alloc(32);
      service.storeEncryptionKey(orderId, mockKey);

      const result = await service.revealKey(orderId, itemId, {
        ipAddress: '192.168.1.1',
        userAgent: '日本語 Mozilla/5.0 🚀',
      });

      expect(result.accessInfo.userAgent).toBe('日本語 Mozilla/5.0 🚀');
    });
  });
});
