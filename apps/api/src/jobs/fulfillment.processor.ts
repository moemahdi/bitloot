import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job, Queue } from 'bullmq';
import { FulfillmentService } from '../modules/fulfillment/fulfillment.service';
import { OrdersService } from '../modules/orders/orders.service';
import { FulfillmentGateway } from '../modules/fulfillment/fulfillment.gateway';
import { QUEUE_NAMES } from './queues';
import { WebhookLog } from '../database/entities/webhook-log.entity';

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
    @InjectRepository(WebhookLog)
    private readonly webhookLogsRepo: Repository<WebhookLog>,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT)
    private readonly fulfillmentQueue: Queue,
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

        // Route by job.name to support multiple phases per plan
      const jobName = job.name;
      if (jobName === 'reserve') {
        // Check product source type to determine fulfillment path
        const sourceType = order.sourceType ?? 'custom';
        
        if (sourceType === 'custom') {
          // CUSTOM PRODUCTS: Direct fulfillment (keys pre-uploaded to R2)
          this.logger.log(`[Fulfillment] 📦 Custom product order ${orderId} - executing direct fulfillment`);
          
          const result = await this.fulfillmentService.fulfillOrder(orderId);
          
          this.fulfillmentGateway.emitFulfillmentStatusChange({
            orderId,
            status: 'fulfilled',
            fulfillmentStatus: 'completed',
          });
          
          this.logger.log(`[Fulfillment] ✅ Custom order ${orderId} fulfilled successfully`);
          
          return {
            orderId,
            status: 'fulfilled',
            message: `Custom order fulfilled with ${result.items.length} items`,
          };
        }
        
        // KINGUIN PRODUCTS: Start reservation with Kinguin API
        this.logger.log(`[Fulfillment] 👑 Kinguin product order ${orderId} - starting reservation`);
        const result = await this.fulfillmentService.startReservation(orderId);
        this.fulfillmentGateway.emitFulfillmentStatusChange({
          orderId,
          status: order.status ?? 'paid',
          fulfillmentStatus: `reservation:${result.status}`,
        });

        // Auto-complete ONLY for mock orders (no Kinguin webhook for mock client)
        // Real Kinguin orders will receive a webhook when ready
        const isMockOrder = result.reservationId.startsWith('mock-order-');

        if (isMockOrder) {
          this.logger.log(
            `[Fulfillment] 🧪 Mock order detected: auto-queuing fetch-keys for ${result.reservationId}`,
          );
          // Queue fetch-keys job with small delay to simulate webhook delivery
          await this.fulfillmentQueue.add(
            'fetch-keys',
            { kinguinOrderId: result.reservationId, orderId },
            { delay: 500, attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
          );
        } else {
          this.logger.log(
            `[Fulfillment] 📡 Real Kinguin order created: ${result.reservationId} - waiting for Kinguin webhook`,
          );
        }

        // Do not mark fulfilled here; wait for webhook/fetch-keys to finalize
        return {
          orderId,
          status: 'reserved',
          message: `Reservation ${result.reservationId} created (status: ${result.status})`,
        };
      }

      if (jobName === 'kinguin.webhook') {
        // Handle webhook-driven finalize
        const dataObj: Record<string, unknown> =
          typeof job.data === 'object' && job.data !== null ? job.data : {};
        const reservationId =
          typeof dataObj.reservationId === 'string' ? dataObj.reservationId : '';
        const eventStatus = typeof dataObj.status === 'string' ? dataObj.status : '';

        if (reservationId === '') {
          throw new Error('kinguin.webhook job missing reservationId');
        }

        // Only finalize on ready/delivered
        if (eventStatus === 'ready' || eventStatus === 'delivered') {
          const { orderId: resolvedOrderId } = await this.fulfillmentService.finalizeDelivery(
            reservationId,
          );

          const finalOrder = await this.ordersService.markFulfilled(resolvedOrderId);

          // Mark webhook log as processed (idempotency bookkeeping)
          try {
            const log = await this.webhookLogsRepo.findOne({
              where: {
                externalId: reservationId,
                webhookType: 'kinguin_webhook',
                processed: false,
              },
              order: { createdAt: 'DESC' },
            });
            if (log !== null) {
              log.processed = true;
              log.orderId = resolvedOrderId;
              log.result = { success: true, action: 'fulfilled' } as Record<string, unknown>;
              await this.webhookLogsRepo.save(log);
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`[Fulfillment] Failed to mark webhook processed: ${msg}`);
          }

          this.fulfillmentGateway.emitFulfillmentStatusChange({
            orderId: resolvedOrderId,
            status: finalOrder.status ?? 'fulfilled',
            fulfillmentStatus: 'completed',
            items:
              typeof finalOrder.items === 'object' && Array.isArray(finalOrder.items)
                ? (finalOrder.items as unknown as Record<string, unknown>[])
                : undefined,
          });

          return {
            orderId: resolvedOrderId,
            status: 'fulfilled',
            message: `Order ${resolvedOrderId} fulfilled via webhook`,
            itemsProcessed:
              typeof finalOrder.items === 'object' && Array.isArray(finalOrder.items)
                ? finalOrder.items.length
                : 0,
          };
        }

        {
          const statusLabel = eventStatus !== '' ? eventStatus : 'unknown';
          this.fulfillmentGateway.emitFulfillmentStatusChange({
            orderId,
            status: order.status ?? 'processing',
            fulfillmentStatus: `webhook:${statusLabel}`,
          });
        }

        {
          const statusLabel = eventStatus !== '' ? eventStatus : 'unknown';
          return {
            orderId,
            status: 'processing',
            message: `Webhook received: ${statusLabel}`,
          };
        }
      }

      // Handle fetch-keys job from Kinguin order.status webhook
      if (jobName === 'fetch-keys') {
        const dataObj: Record<string, unknown> =
          typeof job.data === 'object' && job.data !== null ? job.data : {};
        const kinguinOrderId =
          typeof dataObj.kinguinOrderId === 'string' ? dataObj.kinguinOrderId : '';
        const externalOrderId =
          typeof dataObj.externalOrderId === 'string' ? dataObj.externalOrderId : '';

        if (kinguinOrderId === '') {
          throw new Error('fetch-keys job missing kinguinOrderId');
        }

        this.logger.log(
          `[Fulfillment] Processing fetch-keys job: kinguinOrderId=${kinguinOrderId}, externalOrderId=${externalOrderId}`,
        );

        // kinguinOrderId is stored in our kinguinReservationId field
        const { orderId: resolvedOrderId, signedUrl: _signedUrl } =
          await this.fulfillmentService.finalizeDelivery(kinguinOrderId);

        const finalOrder = await this.ordersService.markFulfilled(resolvedOrderId);

        this.fulfillmentGateway.emitFulfillmentStatusChange({
          orderId: resolvedOrderId,
          status: finalOrder.status ?? 'fulfilled',
          fulfillmentStatus: 'completed',
          items:
            typeof finalOrder.items === 'object' && Array.isArray(finalOrder.items)
              ? (finalOrder.items as unknown as Record<string, unknown>[])
              : undefined,
        });

        this.logger.log(
          `[Fulfillment] Order ${resolvedOrderId} fulfilled via fetch-keys webhook, signedUrl generated`,
        );

        return {
          orderId: resolvedOrderId,
          status: 'fulfilled',
          message: `Order ${resolvedOrderId} fulfilled via Kinguin webhook (fetch-keys)`,
          itemsProcessed:
            typeof finalOrder.items === 'object' && Array.isArray(finalOrder.items)
              ? finalOrder.items.length
              : 0,
        };
      }

      // Handle order-canceled job from Kinguin order.status webhook
      if (jobName === 'order-canceled') {
        const dataObj: Record<string, unknown> =
          typeof job.data === 'object' && job.data !== null ? job.data : {};
        const kinguinOrderId =
          typeof dataObj.kinguinOrderId === 'string' ? dataObj.kinguinOrderId : '';
        const externalOrderId =
          typeof dataObj.externalOrderId === 'string' ? dataObj.externalOrderId : '';

        if (kinguinOrderId === '') {
          throw new Error('order-canceled job missing kinguinOrderId');
        }

        this.logger.log(
          `[Fulfillment] Processing order-canceled job: kinguinOrderId=${kinguinOrderId}, externalOrderId=${externalOrderId}`,
        );

        // Find order by kinguinReservationId
        const canceledOrder = await this.ordersService.findByReservation(kinguinOrderId);

        if (canceledOrder === null) {
          this.logger.warn(
            `[Fulfillment] Order not found for Kinguin order ${kinguinOrderId}, skipping cancellation`,
          );
          return {
            orderId: kinguinOrderId,
            status: 'not_found',
            message: `Order not found for Kinguin order ${kinguinOrderId}`,
          };
        }

        // Mark order as failed with cancellation reason
        await this.ordersService.markFailed(
          canceledOrder.id,
          `Kinguin order ${kinguinOrderId} was canceled`,
        );

        this.fulfillmentGateway.emitFulfillmentStatusChange({
          orderId: canceledOrder.id,
          status: 'failed',
          fulfillmentStatus: 'canceled',
          error: 'Kinguin order was canceled',
        });

        this.logger.log(`[Fulfillment] Order ${canceledOrder.id} marked as failed (Kinguin canceled)`);

        return {
          orderId: canceledOrder.id,
          status: 'canceled',
          message: `Order ${canceledOrder.id} canceled due to Kinguin order ${kinguinOrderId} cancellation`,
        };
      }

      // Default: execute full fulfillment now
      const _fulfillmentResult = await this.fulfillmentService.fulfillOrder(orderId);

      const finalOrder = await this.ordersService.markFulfilled(orderId);

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
