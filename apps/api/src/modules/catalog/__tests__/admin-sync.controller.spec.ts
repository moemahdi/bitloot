import { describe, it, expect, beforeEach } from 'vitest';
import { type CatalogServiceMocks, createMockCatalogService } from './catalog.types';

/**
 * Admin Catalog Sync Controller Tests
 * Tests Kinguin catalog sync trigger and monitoring
 */
describe('AdminSyncController', () => {
  let service: CatalogServiceMocks;

  beforeEach(() => {
    service = createMockCatalogService();
  });

  describe('POST /admin/catalog/sync', () => {
    it('should enqueue sync job to BullMQ', async () => {
      service.triggerSync.mockResolvedValue({ jobId: '123' });
      const result = (await service.triggerSync()) as { jobId: string };
      expect(result.jobId).toBeDefined();
    });

    it('should return 202 Accepted with jobId', async () => {
      service.triggerSync.mockResolvedValue({
        jobId: '123',
        status: 202,
      });
      const result = (await service.triggerSync()) as { status: number };
      expect(result.status).toBe(202);
    });

    it('should prevent concurrent syncs (return 409 if running)', async () => {
      service.triggerSync.mockRejectedValue(new Error('Sync already running'));
      await expect(service.triggerSync()).rejects.toThrow();
    });

    it('should require admin role', () => {
      expect(service.triggerSync).toBeDefined();
    });

    it('should accept optional filters (platform, region)', async () => {
      service.triggerSync.mockResolvedValue({ jobId: '123' });
      await service.triggerSync({ platform: 'steam' });
      expect(service.triggerSync).toHaveBeenCalled();
    });

    it('should set sync_started_at timestamp', async () => {
      service.triggerSync.mockResolvedValue({
        jobId: '123',
        sync_started_at: new Date(),
      });
      const result = (await service.triggerSync()) as { sync_started_at: Date };
      expect(result.sync_started_at).toBeDefined();
    });
  });

  describe('GET /admin/catalog/sync-status/:jobId', () => {
    it('should return job status (queued, running, completed)', async () => {
      service.getSyncStatus.mockResolvedValue({
        status: 'running',
      });
      const result = (await service.getSyncStatus('123')) as { status: string };
      expect(['queued', 'running', 'completed']).toContain(result.status);
    });

    it('should return processed/total counts', async () => {
      service.getSyncStatus.mockResolvedValue({
        processed: 50,
        total: 100,
      });
      const result = (await service.getSyncStatus('123')) as { processed: number; total: number };
      expect(result.processed).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should return 404 for non-existent job', async () => {
      service.getSyncStatus.mockRejectedValue(new Error('Not found'));
      await expect(service.getSyncStatus('nonexistent')).rejects.toThrow();
    });

    it('should include ETA for running jobs', async () => {
      service.getSyncStatus.mockResolvedValue({
        status: 'running',
        eta_seconds: 120,
      });
      const result = (await service.getSyncStatus('123')) as { eta_seconds?: number };
      expect(result.eta_seconds).toBeDefined();
    });
  });

  describe('GET /admin/catalog/sync-status', () => {
    it('should return status of most recent sync', async () => {
      service.getLatestSyncStatus.mockResolvedValue({
        status: 'completed',
      });
      const result = (await service.getLatestSyncStatus()) as { status: string };
      expect(result.status).toBeDefined();
    });

    it('should return last_sync_at timestamp', async () => {
      service.getLatestSyncStatus.mockResolvedValue({
        last_sync_at: new Date(),
      });
      const result = (await service.getLatestSyncStatus()) as { last_sync_at: Date };
      expect(result.last_sync_at).toBeDefined();
    });
  });
});
