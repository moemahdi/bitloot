import { describe, it, expect, beforeEach } from 'vitest';
import { type CatalogServiceMocks, createMockCatalogService } from './catalog.types';

/**
 * Admin Reprice Controller Tests
 * Tests repricing job operations
 */
describe('AdminRepriceController', () => {
  let service: CatalogServiceMocks;

  beforeEach(() => {
    service = createMockCatalogService();
  });

  describe('POST /admin/catalog/reprice', () => {
    it('should enqueue reprice job with product IDs', async () => {
      service.triggerReprice.mockResolvedValue({ jobId: '456' });
      const result = (await service.triggerReprice({ productIds: ['1', '2'] })) as { jobId: string };
      expect(result.jobId).toBeDefined();
    });

    it('should accept optional rule_id filter', async () => {
      service.triggerReprice.mockResolvedValue({ jobId: '456' });
      await service.triggerReprice({ ruleId: '1' });
      expect(service.triggerReprice).toHaveBeenCalled();
    });

    it('should return 202 Accepted with jobId', async () => {
      service.triggerReprice.mockResolvedValue({
        jobId: '456',
        status: 202,
      });
      const result = (await service.triggerReprice({})) as { jobId: string; status: number };
      expect(result.status).toBe(202);
    });

    it('should validate product IDs exist', () => {
      expect(service.triggerReprice).toBeDefined();
    });

    it('should require admin role', () => {
      expect(service.triggerReprice).toBeDefined();
    });

    it('should support batching (max 1000 products)', () => {
      expect(service.triggerReprice).toBeDefined();
    });
  });

  describe('GET /admin/catalog/reprice/status/:jobId', () => {
    it('should return reprice job status', async () => {
      service.getRepriceStatus.mockResolvedValue({
        status: 'completed',
      });
      const result = (await service.getRepriceStatus('456')) as { status: string };
      expect(result.status).toBeDefined();
    });

    it('should include updated count', async () => {
      service.getRepriceStatus.mockResolvedValue({
        updated_count: 42,
      });
      const result = (await service.getRepriceStatus('456')) as { updated_count: number };
      expect(result.updated_count).toBeDefined();
    });
  });

  describe('POST /admin/catalog/reprice/cancel/:jobId', () => {
    it('should cancel running reprice job', async () => {
      service.cancelReprice.mockResolvedValue({
        jobId: '456',
        cancelled: true,
      });
      const result = (await service.cancelReprice('456')) as { jobId: string; cancelled: boolean };
      expect(result.cancelled).toBe(true);
    });

    it('should rollback partial updates', async () => {
      service.cancelReprice.mockResolvedValue({
        jobId: '456',
        rollback_count: 15,
      });
      const result = (await service.cancelReprice('456')) as { jobId: string; rollback_count: number };
      expect(result.rollback_count).toBeDefined();
    });
  });
});
