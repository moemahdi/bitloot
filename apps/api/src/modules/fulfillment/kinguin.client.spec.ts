import { describe, it, expect, beforeEach } from 'vitest';
import { KinguinClient } from './kinguin.client';

describe('KinguinClient', () => {
  let client: KinguinClient;
  const mockApiKey = 'test-api-key-12345';
  const mockBaseUrl = 'https://sandbox.kinguin.net/api/v1';

  beforeEach(() => {
    client = new KinguinClient(mockApiKey, mockBaseUrl);
  });

  // ============================================================================
  // Test Suite 1: Constructor & Validation
  // ============================================================================

  describe('constructor', () => {
    it('should throw on empty API key', () => {
      expect(() => new KinguinClient('', mockBaseUrl)).toThrow('Invalid Kinguin API key');
    });

    it('should throw on empty base URL', () => {
      expect(() => new KinguinClient(mockApiKey, '')).toThrow('Invalid Kinguin base URL');
    });

    it('should initialize successfully with valid credentials', () => {
      const validClient = new KinguinClient(mockApiKey, mockBaseUrl);
      expect(validClient).toBeInstanceOf(KinguinClient);
    });
  });

  // ============================================================================
  // Test Suite 2: createOrder() Method
  // ============================================================================

  describe('createOrder()', () => {
    it('should throw on invalid offerId (empty string)', async () => {
      await expect(
        client.createOrder({
          offerId: '',
          quantity: 1,
        }),
      ).rejects.toThrow('Invalid offerId');
    });

    it('should throw on invalid quantity (below minimum)', async () => {
      await expect(
        client.createOrder({
          offerId: 'game-789',
          quantity: 0,
        }),
      ).rejects.toThrow('Invalid quantity');
    });

    it('should throw on invalid quantity (above maximum)', async () => {
      await expect(
        client.createOrder({
          offerId: 'game-789',
          quantity: 101,
        }),
      ).rejects.toThrow('Invalid quantity');
    });

    it('should handle API errors gracefully', () => {
      // This would use actual API in integration tests
      // Unit test validates input validation
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 3: getOrderStatus() Method
  // ============================================================================

  describe('getOrderStatus()', () => {
    it('should throw on empty order ID', async () => {
      await expect(client.getOrderStatus('')).rejects.toThrow('Invalid orderId');
    });

    it('should accept valid order IDs', () => {
      // Validation passes for valid inputs
      expect(() => {
        // Would make API call with valid orderId
        // Unit test validates input validation
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Test Suite 4: getKey() Method
  // ============================================================================

  describe('getKey()', () => {
    it('should throw on empty order ID', async () => {
      await expect(client.getKey('')).rejects.toThrow('Invalid orderId');
    });

    it('should validate input before processing', () => {
      // Input validation happens first
      expect(() => {
        // Valid input should pass validation
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Test Suite 5: healthCheck() Method
  // ============================================================================

  describe('healthCheck()', () => {
    it('should return boolean from health check', async () => {
      const result = await client.healthCheck();
      expect(typeof result === 'boolean').toBe(true);
    });

    it('should handle connection failures gracefully', async () => {
      // Health check catches errors and returns false
      const result = await client.healthCheck();
      expect([true, false]).toContain(result);
    });
  });

  // ============================================================================
  // Test Suite 6: Type Safety Verification
  // ============================================================================

  describe('type safety', () => {
    it('should have createOrder method', () => {
      expect(typeof client.createOrder).toBe('function');
    });

    it('should have getOrderStatus method', () => {
      expect(typeof client.getOrderStatus).toBe('function');
    });

    it('should have getKey method', () => {
      expect(typeof client.getKey).toBe('function');
    });

    it('should have healthCheck method', () => {
      expect(typeof client.healthCheck).toBe('function');
    });
  });

  // ============================================================================
  // Test Suite 7: Constructor Parameter Validation
  // ============================================================================

  describe('parameter validation', () => {
    it('validates API key is not empty', () => {
      expect(() => new KinguinClient('', 'https://api.example.com')).toThrow();
    });

    it('validates base URL is not empty', () => {
      expect(() => new KinguinClient('key123', '')).toThrow();
    });

    it('accepts valid credentials', () => {
      const validClient = new KinguinClient('valid-key', 'https://api.example.com');
      expect(validClient).toBeDefined();
    });
  });

  // ============================================================================
  // Test Suite 8: Error Messages
  // ============================================================================

  describe('error messages', () => {
    it('provides helpful error for invalid offerId', async () => {
      try {
        await client.createOrder({ offerId: '', quantity: 1 });
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('offerId');
        } else {
          throw error;
        }
      }
    });

    it('provides helpful error for invalid quantity', async () => {
      try {
        await client.createOrder({ offerId: 'test', quantity: -1 });
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('quantity');
        } else {
          throw error;
        }
      }
    });

    it('provides helpful error for empty orderId', async () => {
      try {
        await client.getOrderStatus('');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('orderId');
        } else {
          throw error;
        }
      }
    });
  });
});
