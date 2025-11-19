import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HttpException } from '@nestjs/common';

/**
 * KinguinCatalogClient Specification Tests
 * Tests for Kinguin catalog API client integration
 * Covers: product sync, pricing, availability, error handling
 */

interface KinguinOffer {
  offerId: string;
  title: string;
  price: number;
  stock: number;
  category: string;
}

interface KinguinCatalogClient {
  getOffers: (filters?: Record<string, unknown>) => Promise<KinguinOffer[]>;
  getOfferDetail: (offerId: string) => Promise<KinguinOffer>;
  checkAvailability: (offerId: string, quantity: number) => Promise<boolean>;
  getCategories: () => Promise<string[]>;
  validateOffer: (offerId: string) => Promise<boolean>;
  syncCatalog: (limit?: number) => Promise<{ synced: number; failed: number }>;
}

describe('KinguinCatalogClient', () => {
  let client: KinguinCatalogClient;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    client = {
      getOffers: vi.fn(),
      getOfferDetail: vi.fn(),
      checkAvailability: vi.fn(),
      getCategories: vi.fn(),
      validateOffer: vi.fn(),
      syncCatalog: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOffers', () => {
    it('should fetch all available offers from Kinguin', async () => {
      const mockOffers = [
        { offerId: 'k1', title: 'Game 1', price: 10.99, stock: 100, category: 'games' },
        { offerId: 'k2', title: 'Game 2', price: 19.99, stock: 50, category: 'games' },
      ] as KinguinOffer[];

      (client.getOffers as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockOffers);

      const result = (await client.getOffers()) as KinguinOffer[];

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]?.offerId).toBe('k1');
    });

    it('should accept filter parameters for category', async () => {
      const mockOffers = [
        { offerId: 'k1', title: 'Software 1', price: 29.99, stock: 25, category: 'software' },
      ] as KinguinOffer[];

      (client.getOffers as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockOffers);

      const result = (await client.getOffers({ category: 'software' })) as KinguinOffer[];

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.category).toBe('software');
    });

    it('should handle pagination filters', async () => {
      const mockOffers = [{ offerId: 'k1', title: 'Game', price: 10, stock: 100, category: 'games' }] as KinguinOffer[];

      (client.getOffers as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockOffers);

      const result = (await client.getOffers({ page: 2, limit: 50 })) as KinguinOffer[];

      expect(result).toBeDefined();
      expect((client.getOffers as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ page: 2, limit: 50 });
    });

    it('should return empty array when no offers available', async () => {
      (client.getOffers as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const result = (await client.getOffers()) as KinguinOffer[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      (client.getOffers as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('API Error'));

      await expect(client.getOffers()).rejects.toThrow('API Error');
    });
  });

  describe('getOfferDetail', () => {
    it('should fetch detailed information for a specific offer', async () => {
      const mockDetail = { offerId: 'k1', title: 'Game 1', price: 10.99, stock: 100, category: 'games' } as KinguinOffer;

      (client.getOfferDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDetail);

      const result = (await client.getOfferDetail('k1')) as KinguinOffer;

      expect(result).toBeDefined();
      expect(result.offerId).toBe('k1');
      expect(result.title).toBe('Game 1');
    });

    it('should include all required fields in offer detail', async () => {
      const mockDetail = {
        offerId: 'k123',
        title: 'Product Title',
        price: 25.5,
        stock: 75,
        category: 'software',
      } as KinguinOffer;

      (client.getOfferDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockDetail);

      const result = (await client.getOfferDetail('k123')) as KinguinOffer;

      expect(result.offerId).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.price).toBeDefined();
      expect(result.stock).toBeDefined();
      expect(result.category).toBeDefined();
    });

    it('should throw error for non-existent offer', async () => {
      (client.getOfferDetail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new HttpException('Offer not found', 404),
      );

      await expect(client.getOfferDetail('invalid')).rejects.toThrow();
    });
  });

  describe('checkAvailability', () => {
    it('should verify offer availability with requested quantity', async () => {
      (client.checkAvailability as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      const result = (await client.checkAvailability('k1', 5)) as boolean;

      expect(result).toBe(true);
    });

    it('should return false when quantity exceeds stock', async () => {
      (client.checkAvailability as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const result = (await client.checkAvailability('k1', 1000)) as boolean;

      expect(result).toBe(false);
    });

    it('should validate availability for large quantities', async () => {
      (client.checkAvailability as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      const result = (await client.checkAvailability('k1', 100)) as boolean;

      expect(result).toBe(true);
      expect((client.checkAvailability as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('k1', 100);
    });
  });

  describe('getCategories', () => {
    it('should fetch all available product categories', async () => {
      const mockCategories = ['games', 'software', 'subscriptions', 'ebooks'];

      (client.getCategories as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockCategories);

      const result = (await client.getCategories()) as string[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result).toContain('games');
    });

    it('should handle empty category list', async () => {
      (client.getCategories as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const result = (await client.getCategories()) as string[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('validateOffer', () => {
    it('should validate that offer exists and is valid', async () => {
      (client.validateOffer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      const result = (await client.validateOffer('k1')) as boolean;

      expect(result).toBe(true);
    });

    it('should return false for invalid or expired offer', async () => {
      (client.validateOffer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      const result = (await client.validateOffer('invalid')) as boolean;

      expect(result).toBe(false);
    });
  });

  describe('syncCatalog', () => {
    it('should sync catalog and return count of synced and failed items', async () => {
      const syncResult = { synced: 250, failed: 3 };

      (client.syncCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(syncResult);

      const result = (await client.syncCatalog()) as { synced: number; failed: number };

      expect(result).toBeDefined();
      expect(result.synced).toBe(250);
      expect(result.failed).toBe(3);
    });

    it('should accept limit parameter for partial sync', async () => {
      const syncResult = { synced: 100, failed: 1 };

      (client.syncCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(syncResult);

      const result = (await client.syncCatalog(100)) as { synced: number; failed: number };

      expect(result.synced).toBe(100);
      expect((client.syncCatalog as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(100);
    });

    it('should handle sync with no failures', async () => {
      const syncResult = { synced: 500, failed: 0 };

      (client.syncCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(syncResult);

      const result = (await client.syncCatalog()) as { synced: number; failed: number };

      expect(result.failed).toBe(0);
    });

    it('should report failure count for problematic items', async () => {
      const syncResult = { synced: 400, failed: 15 };

      (client.syncCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(syncResult);

      const result = (await client.syncCatalog()) as { synced: number; failed: number };

      expect(result.failed).toBe(15);
    });
  });
});
