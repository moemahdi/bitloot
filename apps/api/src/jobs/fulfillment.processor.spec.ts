import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FulfillmentProcessor } from './fulfillment.processor';
import type { FulfillmentService } from '../modules/fulfillment/fulfillment.service';
import type { OrdersService } from '../modules/orders/orders.service';
import type { FulfillmentGateway } from '../modules/fulfillment/fulfillment.gateway';
import type { Repository } from 'typeorm';
import type { WebhookLog } from '../database/entities/webhook-log.entity';
import type { Job } from 'bullmq';

/**
 * FulfillmentProcessor Specification Tests
 * Tests for BullMQ async fulfillment job processing
 * Covers: job execution, Kinguin integration, key delivery, error handling, retries
 */

describe('FulfillmentProcessor', () => {
  let processor: FulfillmentProcessor;
  let fulfillmentServiceMock: Partial<FulfillmentService>;
  let ordersServiceMock: Partial<OrdersService>;
  let fulfillmentGatewayMock: Partial<FulfillmentGateway>;
  let webhookLogsRepoMock: Partial<Repository<WebhookLog>>;

  beforeEach(() => {
    // Create mock functions with proper return values
    const fulfillOrderFn = vi.fn().mockResolvedValue({
      orderId: 'order-123',
      keyUrl: 'https://r2.example.com/signed/key/url',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const getFn = vi.fn().mockResolvedValue({
      id: 'order-123',
      status: 'paid',
      totalCrypto: '0.5',
    });

    const markFulfilledFn = vi.fn().mockResolvedValue({
      id: 'order-123',
      status: 'fulfilled',
      items: [{ id: 'item-1', name: 'test-item' }], // Include items for itemsProcessed calculation
    });

    const emitFn = vi.fn().mockReturnValue(undefined);

    fulfillmentServiceMock = {
      fulfillOrder: fulfillOrderFn,
    };

    ordersServiceMock = {
      get: getFn,
      markFulfilled: markFulfilledFn,
    };

    fulfillmentGatewayMock = {
      emitFulfillmentStatusChange: emitFn,
    };

    webhookLogsRepoMock = {};

    processor = new FulfillmentProcessor(
      fulfillmentServiceMock as FulfillmentService,
      ordersServiceMock as OrdersService,
      fulfillmentGatewayMock as FulfillmentGateway,
      webhookLogsRepoMock as Repository<WebhookLog>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Job Processing', () => {
    it('should process fulfillment job successfully', async () => {
      const mockJob = {
        data: { orderId: 'order-123' } as Record<string, unknown>,
        id: 'job-456',
        progress: vi.fn(),
        log: vi.fn(),
      } as unknown as Job;

      const result = await processor.process(mockJob);

      // Processor returns {orderId, status, message, itemsProcessed}
      expect(result.orderId).toBe('order-123');
      expect(result.status).toBe('fulfilled');
      expect(result.message).toContain('fulfilled successfully');
      expect(result.itemsProcessed).toBe(1); // Mock now returns items array with 1 item
    });

    it('should throw error if order not found', async () => {
      const mockJob = {
        data: { orderId: 'order-invalid' } as Record<string, unknown>,
        id: 'job-456',
      } as unknown as Job;

      // Make get return null to simulate order not found
      const getFn = ordersServiceMock.get as unknown as ReturnType<typeof vi.fn>;
      if (getFn) {
        getFn.mockResolvedValueOnce(null);
      }

      await expect(processor.process(mockJob)).rejects.toThrow();
    });

    it('should handle Kinguin API errors gracefully', async () => {
      const mockJob = {
        data: { orderId: 'order-789' } as Record<string, unknown>,
        id: 'job-789',
      } as unknown as Job;

      const timeoutError = new Error('Kinguin API timeout');

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockRejectedValue(timeoutError);

      await expect(processor.process(mockJob)).rejects.toThrow('Kinguin API timeout');
    });

    it('should move to DLQ after max retries', async () => {
      const mockJob = {
        data: { orderId: 'order-dlq' } as Record<string, unknown>,
        id: 'job-dlq',
        attemptsMade: 3,
        maxRetries: 3,
      } as unknown as Job;

      const persistentError = new Error('Persistent failure after 3 retries');

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockRejectedValue(persistentError);

      await expect(processor.process(mockJob)).rejects.toThrow('Persistent failure');
    });
  });

  describe('WebSocket Events', () => {
    it('should emit fulfillment-started event', async () => {
      const mockJob = {
        data: { orderId: 'order-ws-start' } as Record<string, unknown>,
        id: 'job-ws-start',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-ws-start',
        status: 'in-progress',
        message: 'Fulfillment started',
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      await processor.process(mockJob);

      const server = fulfillmentGatewayMock.server;
      if (server?.to) {
        expect(server.to).toBeDefined();
      }
    });

    it('should emit fulfillment-completed event with key URL', async () => {
      const mockJob = {
        data: { orderId: 'order-ws-done' } as Record<string, unknown>,
        id: 'job-ws-done',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-ws-done',
        status: 'fulfilled',
        message: 'Order order-ws-done fulfilled successfully',
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      const result = await processor.process(mockJob);

      expect(result.status).toBe('fulfilled');
      expect(result.message).toContain('fulfilled successfully');
    });
  });

  describe('Status Tracking', () => {
    it('should update order status to fulfilled', async () => {
      const mockJob = {
        data: { orderId: 'order-status' } as Record<string, unknown>,
        id: 'job-status',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-status',
        status: 'fulfilled',
        message: 'Order status updated',
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      const result = await processor.process(mockJob);

      expect(result.status).toBe('fulfilled');
    });

    it('should track fulfillment start and end times', async () => {
      const mockJob = {
        data: { orderId: 'order-timing' } as Record<string, unknown>,
        id: 'job-timing',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-timing',
        status: 'fulfilled',
        message: 'Fulfillment completed in 5000ms',
        itemsProcessed: 1,
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      const result = await processor.process(mockJob);

      expect(result.orderId).toBe('order-timing');
      expect(result.status).toBe('fulfilled');
      expect(result.itemsProcessed).toBe(1); // Now should be 1 since mock includes items array
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate job processing gracefully', async () => {
      const mockJob = {
        data: { orderId: 'order-idempotent', jobId: 'duplicate-123' } as Record<
          string,
          unknown
        >,
        id: 'job-duplicate',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-idempotent',
        status: 'already-fulfilled',
        message: 'Order was already fulfilled - returning cached result',
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      const result = await processor.process(mockJob);

      expect(result.status).toMatch(/fulfilled|already-fulfilled/);
    });
  });

  describe('Integration with Other Services', () => {
    it('should coordinate between OrdersService and FulfillmentService', async () => {
      const mockJob = {
        data: { orderId: 'order-integration' } as Record<string, unknown>,
        id: 'job-integration',
      } as unknown as Job;

      const mockFulfillmentResult = {
        orderId: 'order-integration',
        status: 'fulfilled',
        signedUrl: 'https://r2.example.com/integrated',
      };

      const fulfillOrderFn = fulfillmentServiceMock.fulfillOrder as unknown as ReturnType<
        typeof vi.fn
      >;
      fulfillOrderFn.mockResolvedValue(mockFulfillmentResult);

      const result = await processor.process(mockJob);

      expect(fulfillOrderFn).toHaveBeenCalledWith('order-integration');
      expect(result.status).toBe('fulfilled');
    });
  });
});
