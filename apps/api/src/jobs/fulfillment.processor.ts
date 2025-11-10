import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { FulfillmentService } from '../modules/fulfillment/fulfillment.service';
import { OrdersService } from '../modules/orders/orders.service';
import { FulfillmentGateway } from '../modules/fulfillment/fulfillment.gateway';
import { QUEUE_NAMES } from './queues';

interface FulfillmentJobResult {
  orderId: string;
  status: string;
  message: string;
  itemsProcessed?: number;
}

/**
 * BullMQ Worker for async fulfillment job processing
 *
 * Handles fulfillment-queue jobs with exponential backoff retry strategy
 * Integrates Phase 3 fulfillment services for Kinguin order processing
 *
 * Job Processing Flow:
 * 1. Payment confirmation → Enqueue 'fulfill' job
 * 2. Processor loads order via OrdersService
 * 3. Calls FulfillmentService.fulfillOrder() which handles:
 *    - Kinguin order creation & reservation
 *    - Key retrieval polling
 *    - AES-256-GCM encryption
 *    - R2 storage with signed URL (15-min expiry)
 *    - Resend delivery email
 * 4. Updates order status to fulfilled with signed URL
 * 5. Emits WebSocket event to user
 * 6. Returns delivery link
 *
 * Retry Strategy (from queues.ts):
 * - Max attempts: 3 (configurable in queues.ts)
 * - Backoff: exponential (2s, 4s, 8s delay)
 * - On failure: moves to DLQ after max retries
 * - Failed jobs kept in DLQ for manual inspection/replay
 */
@Processor(QUEUE_NAMES.FULFILLMENT)
export class FulfillmentProcessor extends WorkerHost {
  private readonly logger = new Logger(FulfillmentProcessor.name);

  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly ordersService: OrdersService,
    private readonly fulfillmentGateway: FulfillmentGateway,
  ) {
    super();
  }

  /**
   * Main job processor - handles fulfillment jobs
   *
   * Job Data:
   * ```
   * {
   *   orderId: string;              // Order to fulfill (required)
   * }
   * ```
   *
   * Processing Steps:
   * 1. Extract and validate orderId from job data
   * 2. Load order by ID (throw if not found - non-retryable)
   * 3. Emit status event: fulfillment starting
   * 4. Call FulfillmentService.fulfillOrder(orderId)
   *    - This handles all Phase 3 integrations
   * 5. Mark order as fulfilled
   * 6. Emit status event: fulfillment completed
   * 7. Return result
   *
   * On Error:
   * - Log error with context
   * - Emit error event to WebSocket
   * - BullMQ automatically retries with exponential backoff
   * - After max retries, job moves to DLQ
   *
   * @param job BullMQ job with FulfillmentJobData
   * @returns FulfillmentJobResult with success indicator and message
   * @throws Error (triggers BullMQ retry)
   */
  async process(
    job: Job<Record<string, unknown>>,
  ): Promise<FulfillmentJobResult> {
    const startTime = Date.now();
    const jobData = job.data;

    // Extract orderId from job data (type-safe)
    const orderId =
      typeof jobData === 'object' &&
      jobData !== null &&
      'orderId' in jobData &&
      typeof jobData.orderId === 'string'
        ? jobData.orderId
        : null;

    if (orderId === null || orderId.length === 0) {
      throw new Error('Invalid or missing orderId in fulfillment job data');
    }

    try {
      this.logger.log(
        `[Fulfillment] Processing job ID ${job.id ?? 'unknown'} for order ${orderId} (attempt ${job.attemptsMade + 1})`,
      );

      // Step 1: Load order (validates it exists)
      const order = await this.ordersService.get(orderId);

      if (order === null || order === undefined) {
        throw new Error(`Order ${orderId} not found - non-retryable`);
      }

      // Step 2: Emit fulfillment starting
      this.fulfillmentGateway.emitFulfillmentStatusChange({
        orderId,
        status: order.status ?? 'processing',
        fulfillmentStatus: 'in_progress',
      });

      // Step 3: Execute fulfillment (all Phase 3 integrations handled here)
      const fulfillmentResult =
        await this.fulfillmentService.fulfillOrder(orderId);

      // Ensure we have a valid signed URL
      const signedUrl =
        typeof fulfillmentResult === 'object' &&
        fulfillmentResult !== null &&
        'signedUrl' in fulfillmentResult &&
        typeof fulfillmentResult.signedUrl === 'string'
          ? fulfillmentResult.signedUrl
          : null;

      if (signedUrl === null) {
        throw new Error(
          'Fulfillment service did not return valid signed URL',
        );
      }

      // Step 4: Update order to fulfilled
      const finalOrder = await this.ordersService.fulfill(orderId, signedUrl);

      // Step 5: Emit fulfillment completed
      this.fulfillmentGateway.emitFulfillmentStatusChange({
        orderId,
        status: finalOrder.status ?? 'fulfilled',
        fulfillmentStatus: 'completed',
        items:
          typeof finalOrder.items === 'object' && Array.isArray(finalOrder.items)
            ? (finalOrder.items as unknown as Record<string, unknown>[])
            : undefined,
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `[Fulfillment] Job ${job.id ?? 'unknown'} completed for order ${orderId} in ${duration}ms`,
      );

      // Step 6: Return result
      return {
        orderId,
        status: 'fulfilled',
        message: `Order ${orderId} fulfilled successfully`,
        itemsProcessed:
          typeof finalOrder.items === 'object' &&
          Array.isArray(finalOrder.items)
            ? finalOrder.items.length
            : 0,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[Fulfillment] Job ${job.id ?? 'unknown'} failed for order ${orderId} after ${duration}ms: ${errorMessage}`,
      );

      // Emit error event to user
      this.fulfillmentGateway.emitFulfillmentStatusChange({
        orderId,
        status: 'failed',
        fulfillmentStatus: 'failed',
        error: errorMessage,
      });

      // Throw to trigger BullMQ retry (exponential backoff)
      throw error;
    }
  }

  /**
   * Called when job completes successfully
   * Useful for logging, metrics, or cleanup
   *
   * @param job Completed job
   */
  onCompleted(
    job: Job<Record<string, unknown>> | undefined,
  ): void {
    if (job === null || job === undefined) {
      return;
    }

    const duration =
      typeof job.finishedOn === 'number' &&
      typeof job.processedOn === 'number'
        ? job.finishedOn - job.processedOn
        : 0;

    this.logger.log(
      `[Fulfillment] Job completed: ${job.name} (ID: ${job.id ?? 'unknown'}, Duration: ${duration}ms, Attempts: ${job.attemptsMade + 1})`,
    );
  }

  /**
   * Called when job fails and moves to DLQ (dead-letter queue)
   * Triggers admin alerts
   *
   * @param job Failed job (may be undefined)
   * @param error The error that caused the failure
   */
  onFailed(
    job: Job<Record<string, unknown>> | undefined,
    error: Error,
  ): void {
    if (job === null || job === undefined) {
      this.logger.error(
        `[Fulfillment] Job failed with unknown error: ${error.message}`,
      );
      return;
    }

    this.logger.error(
      `[Fulfillment] Job failed: ${job.name} (ID: ${job.id ?? 'unknown'}, Attempts: ${job.attemptsMade + 1}/3)`,
      error.stack,
    );

    // Could emit admin alert here or send to monitoring service
  }
}
