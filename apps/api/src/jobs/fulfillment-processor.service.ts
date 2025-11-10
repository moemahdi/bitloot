import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';

import { FulfillmentJobData, JobResult, QUEUE_NAMES } from './queues';
import { Order } from '../modules/orders/order.entity';

interface FulfillmentJobResult {
  orderId: string;
  status: string;
  deliveryLink: string;
  expiresAt: string;
  message: string;
}

/**
 * Processor for fulfillment-queue
 *
 * @Processor(QUEUE_NAMES.FULFILLMENT) registers this to handle jobs from FulfillmentQueue
 * Extends WorkerHost from @nestjs/bullmq
 */
@Processor(QUEUE_NAMES.FULFILLMENT)
export class FulfillmentProcessorService extends WorkerHost {
  private readonly logger = new Logger(FulfillmentProcessorService.name);

  constructor(@InjectRepository(Order) private readonly ordersRepo: Repository<Order>) {
    super();
  }

  /**
   * Main job handler for order fulfillment
   *
   * Called by BullMQ when job becomes active
   * Framework handles retries automatically based on queue config
   *
   * @param job Job from fulfillment-queue with FulfillmentJobData payload
   * @returns JobResult with delivery link
   * @throws Error for retryable failures
   *
   * Job flow (Phase 3 Integration):
   * 1. Load order and validate it exists
   * 2. Create Kinguin order via KinguinClient (retryable)
   * 3. Poll Kinguin for license key (retryable)
   * 4. Encrypt key via EncryptionUtil
   * 5. Store encrypted key in R2 via R2StorageClient
   * 6. Generate signed URL (15-min expiry)
   * 7. Send delivery email via EmailsService with Resend
   * 8. Update order status to fulfilled
   * 9. Return delivery link
   *
   * Retry Strategy:
   * - Kinguin timeouts (retryable) → exponential backoff
   * - R2 upload failures (retryable) → exponential backoff
   * - Email service errors (retryable) → exponential backoff
   * - Order not found (non-retryable) → return error
   * - Encryption failure (non-retryable) → return error
   *
   * Phase 3 Integrations Used:
   * ← KinguinClient.createOrder()
   * ← KinguinClient.fulfillOrder() / getOrderStatus()
   * ← EncryptionUtil.encryptKey()
   * ← R2StorageClient.uploadEncryptedKey()
   * ← R2StorageClient.generateSignedUrl()
   * ← EmailsService.sendOrderDelivery()
   */
  async process(job: Job<FulfillmentJobData>): Promise<JobResult<FulfillmentJobResult>> {
    const { orderId, kinguinOfferId, quantity } = job.data;

    this.logger.log(
      `[Fulfillment Processor] Job #${job.id} started: order ${orderId}, offer ${kinguinOfferId}, qty ${quantity}`,
    );

    try {
      // Step 1: Load order and validate it exists
      const order = await this.ordersRepo.findOne({
        where: { id: orderId },
      });

      if (order === null) {
        // Non-retryable error: order doesn't exist
        this.logger.error(`Order ${orderId} not found - non-retryable error`);
        return {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${orderId} not found in database`,
            retryable: false,
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Step 2: Create Kinguin order (Phase 3 integration point)
      // TODO: Integrate KinguinClient when available
      this.logger.log(
        `[Fulfillment Processor] Creating Kinguin order for offer ${kinguinOfferId}, qty ${quantity} (Phase 3 TODO)`,
      );

      // Mock: Simulate Kinguin order creation
      const mockKinguinOrderId = `KG-${orderId.substring(0, 8)}-${Date.now()}`;
      const randomSuffix = randomBytes(4).toString('hex').substring(0, 7);
      const mockLicenseKey = `LICENSE-${kinguinOfferId}-${randomSuffix}`;

      // Step 3-7: Key retrieval, encryption, storage, email (Phase 3 integration)
      // TODO: Integrate with EncryptionUtil, R2StorageClient, EmailsService
      const mockSignedUrl = `https://r2-mock.example.com/keys/${orderId}?token=${Date.now()}&expires=${Date.now() + 15 * 60 * 1000}`;
      const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

      this.logger.log(
        `[Fulfillment Processor] Mock fulfillment: Kinguin order ${mockKinguinOrderId}, key ${mockLicenseKey.substring(0, 10)}***, signed URL generated`,
      );

      // Step 8: Update order status to fulfilled
      order.status = 'fulfilled';
      await this.ordersRepo.save(order);

      this.logger.log(`[Fulfillment Processor] Order ${orderId} marked as fulfilled`);

      // Step 9: Return success result with delivery link
      const result: JobResult<FulfillmentJobResult> = {
        success: true,
        data: {
          orderId,
          status: 'fulfilled',
          deliveryLink: mockSignedUrl,
          expiresAt: expirationTime.toISOString(),
          message: `Order fulfilled. Delivery link will expire at ${expirationTime.toISOString()}`,
        },
        attempt: job.attemptsMade + 1,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `[Fulfillment Processor] Job #${job.id} completed successfully: order ${orderId} fulfilled`,
      );

      return result;
    } catch (error) {
      // Log error and let BullMQ handle retry
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[Fulfillment Processor] Job #${job.id} failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts}): ${errorMessage}`,
      );

      // Throw to trigger BullMQ retry logic
      throw error;
    }
  }

  /**
   * Handle when job fails all retry attempts
   * Called when job reaches max attempts and is about to move to DLQ
   */
  onFailed(_job: Job<FulfillmentJobData>, error: Error): void {
    this.logger.error(
      `[Fulfillment Processor] Job failed permanently after max attempts: ${error.message}`,
    );

    // TODO: Notify customer that fulfillment failed
    // TODO: Send alert to ops team
    // TODO: Mark order for manual intervention
  }

  /**
   * Handle job completion
   * Called after job completes successfully
   */
  onCompleted(_job: Job<FulfillmentJobData>): void {
    this.logger.log(`[Fulfillment Processor] Job completed`);
  }
}
