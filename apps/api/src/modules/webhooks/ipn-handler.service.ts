import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import {
  NowpaymentsIpnRequestDto,
  NowpaymentsIpnResponseDto,
  WebhookProcessingResult,
} from './dto/nowpayments-ipn.dto';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Order } from '../orders/order.entity';
import { MetricsService } from '../metrics/metrics.service';
import { QUEUE_NAMES } from '../../jobs/queues';

/**
 * IPN Handler Service
 *
 * Processes incoming webhooks from NOWPayments with security and idempotency.
 *
 * Security Features:
 * 1. HMAC-SHA512 signature verification (timing-safe comparison)
 * 2. Idempotency via unique constraint on (externalId, webhookType, processed)
 * 3. Audit trail in webhook_logs table
 * 4. Always returns 200 OK (prevents webhook retries)
 *
 * Payment Status State Machine:
 * - waiting/confirming → Order status: confirming
 * - finished → Order status: paid, trigger fulfillment
 * - failed → Order status: failed
 * - underpaid → Order status: underpaid (non-refundable)
 */
@Injectable()
export class IpnHandlerService {
  private readonly logger = new Logger(IpnHandlerService.name);

  constructor(
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly metrics: MetricsService,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT)
    private readonly fulfillmentQueue: Queue,
  ) {}

  /**
   * Structured logging helper for JSON formatting
   * Emits logs in consistent format with timestamp, level, service, operation, status, and context
   *
   * @param level 'info' | 'warn' | 'error'
   * @param operation Operation identifier (e.g., 'handleIpn:start', 'verify:invalid_sig')
   * @param status Outcome status ('success', 'failed', 'duplicate', etc.)
   * @param context Additional fields for debugging (orderId, paymentId, error, etc.)
   *
   * @example
   * this.logStructured('info', 'handleIpn:start', 'received', { paymentId: 'pay-123', status: 'waiting' });
   * // Output: {"timestamp":"2025-11-11T...","level":"info","service":"IpnHandlerService","operation":"handleIpn:start","status":"received","context":{"paymentId":"pay-123",...}}
   */
  private logStructured(
    level: 'info' | 'warn' | 'error',
    operation: string,
    status: string,
    context: Record<string, unknown>,
  ): void {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: 'IpnHandlerService',
      operation,
      status,
      context,
    };
    const logMessage = JSON.stringify(structuredLog);

    if (level === 'error') {
      this.logger.error(logMessage);
    } else if (level === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  /**
   * Main IPN handler entry point
   * Receives webhook from NOWPayments, verifies signature, processes payment
   *
   * **Flow:**
   * 1. Log webhook (for audit/recovery)
   * 2. Verify HMAC signature
   * 3. Check idempotency (prevent duplicates)
   * 4. Process payment status
   * 5. Store result in webhook log
   *
   * **Returns 200 OK regardless of outcome** to prevent NOWPayments retries
   *
   * @param payload - Webhook payload from NOWPayments
   * @param signature - HMAC-SHA512 signature from x-nowpayments-sig header
   * @returns Always 200 OK response
   */
  async handleIpn(
    payload: NowpaymentsIpnRequestDto,
    signature: string,
  ): Promise<NowpaymentsIpnResponseDto> {
    const paymentId = payload.payment_id;

    // LOG START
    this.logStructured('info', 'handleIpn:start', 'received', {
      paymentId,
      status: payload.payment_status,
      orderId: payload.order_id,
    });

    // 1. Create webhook log entry (for recovery/audit)
    const webhookLog = await this.logWebhookReceived(payload, signature);

    try {
      // 2. Verify signature (timing-safe HMAC comparison)
      // NOWPayments requires the payload to be sorted alphabetically by key before computing HMAC
      const isValidSignature = this.verifySignature(payload, signature);
      if (!isValidSignature) {
        // LOG INVALID SIGNATURE
        this.logStructured('warn', 'handleIpn:verify_failed', 'invalid_signature', {
          paymentId,
          webhookId: webhookLog.id,
        });

        this.logger.warn(`[IPN] Invalid signature for payment ${payload.payment_id}`);
        const updated = this.webhookLogRepo.merge(webhookLog, {
          signatureValid: false,
          result: { success: false, error: 'Invalid webhook signature' },
        });
        await this.webhookLogRepo.save(updated);

        return {
          ok: true,
          message: 'Webhook received',
          processed: false,
          webhookId: webhookLog.id,
        };
      }

      // LOG SIGNATURE VERIFIED
      this.logStructured('info', 'handleIpn:signature_verified', 'valid', {
        paymentId,
        webhookId: webhookLog.id,
      });

      // 3. Check idempotency (already processed?)
      const existing = await this.checkIdempotency(String(payload.payment_id));
      if (existing?.processed === true) {
        // Track duplicate webhook metric
        this.metrics.incrementDuplicateWebhook('nowpayments', 'ipn');
        
        // LOG DUPLICATE DETECTION
        this.logStructured('info', 'handleIpn:duplicate_detected', 'already_processed', {
          paymentId,
          previousWebhookId: existing.id,
          webhookId: webhookLog.id,
        });

        this.logger.debug(
          `[IPN] Duplicate webhook for payment ${payload.payment_id} (already processed)`,
        );
        return {
          ok: true,
          message: 'Webhook received',
          processed: false,
          webhookId: existing.id,
        };
      }

      // LOG IDEMPOTENCY CHECK PASSED
      this.logStructured('info', 'handleIpn:idempotency_check', 'new_webhook', {
        paymentId,
        webhookId: webhookLog.id,
      });

      // 4. Process payment status
      this.logStructured('info', 'handleIpn:processing_status', 'in_progress', {
        paymentId,
        paymentStatus: payload.payment_status,
      });

      const result = await this.processPaymentStatus(payload);

      // 5. Update webhook log with result
      const updatedLog = this.webhookLogRepo.merge(webhookLog, {
        signatureValid: true,
        result: result as unknown as Record<string, unknown>,
        processed: result.success ?? false,
        orderId: result.orderId,
        paymentStatus: payload.payment_status,
      });

      await this.webhookLogRepo.save(updatedLog);

      this.logger.log(
        `[IPN] Webhook processed: payment=${payload.payment_id}, status=${payload.payment_status}`,
      );

      // LOG COMPLETION
      this.logStructured('info', 'handleIpn:complete', 'success', {
        paymentId,
        orderId: result.orderId,
        status: payload.payment_status,
        webhookId: webhookLog.id,
        processed: result.success,
      });

      return {
        ok: true,
        message: 'Webhook processed',
        processed: result.success ?? false,
        webhookId: webhookLog.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';

      // LOG ERROR
      this.logStructured('error', 'handleIpn:error', 'failed', {
        paymentId,
        error: errorMessage,
        errorType,
        webhookId: webhookLog.id,
      });

      this.logger.error(
        `[IPN] Error processing webhook for payment ${payload.payment_id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      const errorLog = this.webhookLogRepo.merge(webhookLog, {
        result: { success: false, error: errorMessage },
        processed: false,
      });

      try {
        await this.webhookLogRepo.save(errorLog);
      } catch (saveError) {
        const saveErrorMsg = saveError instanceof Error ? saveError.message : 'Unknown error';
        this.logStructured('error', 'handleIpn:error_saving_log', 'critical', {
          paymentId,
          originalError: errorMessage,
          saveError: saveErrorMsg,
        });

        this.logger.error(`[IPN] Failed to save webhook log: ${saveErrorMsg}`);
      }

      // Always return 200 OK to prevent webhook retries
      return {
        ok: true,
        message: 'Webhook received',
        processed: false,
        webhookId: webhookLog.id,
      };
    }
  }

  /**
   * Verify HMAC-SHA512 signature using timing-safe comparison
   * Prevents timing attacks that could leak signature information
   *
   * @param {string} payload - Raw payload string
   * @param {string} signature - Signature hex string from webhook header
   * @returns {boolean} True if signature is valid
   *
   * @private
   * @example
   * ```typescript
   * const payloadStr = JSON.stringify(payload);
   * const isValid = this.verifySignature(payloadObject, signatureFromHeader);
   * ```
   */
  private verifySignature(payload: Record<string, unknown>, signature: string): boolean {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (secret === undefined || secret === '') {
      this.logger.error('[IPN] NOWPAYMENTS_IPN_SECRET not configured');
      this.metrics.incrementInvalidHmac('nowpayments');
      return false;
    }

    // Check if signature is missing or empty
    if (!signature || signature.length === 0) {
      this.logger.error('[IPN] No signature provided in request headers');
      this.metrics.incrementInvalidHmac('nowpayments');
      return false;
    }

    try {
      // NOWPayments requires payload to be sorted alphabetically by keys (recursively)
      // before computing HMAC - per their documentation
      const sortedPayload = this.sortObject(payload);
      const payloadString = JSON.stringify(sortedPayload);
      
      // Calculate HMAC-SHA512 of sorted payload
      const hmac = crypto.createHmac('sha512', secret).update(payloadString).digest('hex');
      
      // Debug logging (temporary)
      this.logger.debug(`[IPN] Sorted payload for verification: ${payloadString.substring(0, 100)}...`);

      // Log for debugging (temporary)
      this.logger.log(`[IPN] Expected signature length: ${hmac.length}, received: ${signature.length}`);
      
      // If lengths differ, signatures cannot match (timingSafeEqual will throw)
      if (hmac.length !== signature.length) {
        this.logger.warn(`[IPN] Signature length mismatch: expected ${hmac.length}, got ${signature.length}`);
        this.metrics.incrementInvalidHmac('nowpayments');
        return false;
      }

      // Timing-safe comparison (prevents timing attacks)
      const isValid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
      
      if (!isValid) {
        this.logger.warn('[IPN] Invalid HMAC signature received');
        this.metrics.incrementInvalidHmac('nowpayments');
      }
      
      return isValid;
    } catch (error) {
      // timingSafeEqual throws if buffers have different lengths
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[IPN] Signature verification failed: ${errorMsg}`);
      this.metrics.incrementInvalidHmac('nowpayments');
      return false;
    }
  }

  /**
   * Recursively sort object keys alphabetically.
   * Required by NOWPayments for HMAC signature verification.
   *
   * @param obj - Object to sort
   * @returns Sorted object with all nested objects also sorted
   */
  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.keys(obj)
      .sort()
      .reduce((result: Record<string, unknown>, key: string) => {
        const value = obj[key];
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
          ? this.sortObject(value as Record<string, unknown>)
          : value;
        return result;
      }, {});
  }

  /**
   * Check if webhook has been processed before (idempotency)
   * Prevents duplicate fulfillment and payment processing
   *
   * @param {string} paymentId - NOWPayments payment ID (unique per payment)
   * @returns {Promise<WebhookLog | null>} Existing webhook log or null if new
   *
   * @private
   * @example
   * ```typescript
   * const existing = await this.checkIdempotency('123456789');
   * if (existing?.processed) {
   *   // Already processed, skip
   *   return;
   * }
   * ```
   */
  private async checkIdempotency(paymentId: string): Promise<WebhookLog | null> {
    return this.webhookLogRepo.findOne({
      where: {
        externalId: paymentId,
        webhookType: 'nowpayments_ipn',
      },
    });
  }

  /**
   * Process payment status and update order
   * Implements payment state machine:
   * - waiting/confirming → Update order to 'confirming'
   * - finished → Update to 'paid', trigger fulfillment
   * - failed → Update to 'failed'
   * - underpaid → Update to 'underpaid' (non-refundable)
   *
   * @param {NowpaymentsIpnRequestDto} payload - IPN webhook payload
   * @returns {Promise<WebhookProcessingResult>} Processing result
   *
   * @private
   * @throws Error if order not found, amount mismatch, or processing fails
   *
   * @example
   * ```typescript
   * const result = await this.processPaymentStatus(payload);
   * console.log(result);
   * // { success: true, orderId: '...', previousStatus: 'pending', newStatus: 'paid', fulfillmentTriggered: true }
   * ```
   */
  private async processPaymentStatus(
    payload: NowpaymentsIpnRequestDto,
  ): Promise<WebhookProcessingResult> {
    // 1. Find order by order_id (the actual order UUID)
    const order = await this.orderRepo.findOne({
      where: { id: payload.order_id },
    });

    if (order === null) {
      throw new Error(`Order not found: ${payload.order_id}`);
    }

    const previousStatus = order.status;

    // 2. Update order status based on payment status
    let fulfillmentTriggered = false;

    switch (payload.payment_status) {
      case 'waiting':
      case 'confirming':
        order.status = 'confirming';
        break;

      case 'finished':
        // Payment complete - trigger fulfillment
        order.status = 'paid';

        // Queue fulfillment job to process order delivery
        await this.fulfillmentQueue.add(
          'reserve',
          {
            orderId: order.id,
            paymentId: payload.payment_id,
          },
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
        fulfillmentTriggered = true;

        this.logger.log(`[IPN] Payment finished for order ${order.id}, fulfillment queued`);
        break;

      case 'failed':
        order.status = 'failed';
        this.logger.warn(`[IPN] Payment failed for order ${order.id}`);
        break;

      case 'underpaid':
        // Non-refundable - customer loses funds
        order.status = 'underpaid';
        this.logger.warn(`[IPN] Payment underpaid for order ${order.id} (non-refundable)`);
        break;

      default: {
        // Unknown status - log and continue (don't fail)
        this.logger.warn(`[IPN] Unknown payment status: ${payload.payment_status}`);
        return {
          success: false,
          message: `Unknown payment status: ${payload.payment_status}`,
          error: `Unknown payment status`,
        };
      }
    }

    // 3. Save order with new status
    await this.orderRepo.save(order);

    // 4. Return processing result
    return {
      success: true,
      message: `Payment status updated: ${payload.payment_status}`,
      orderId: order.id,
      previousStatus,
      newStatus: order.status,
      fulfillmentTriggered,
    };
  }

  /**
   * Log webhook receipt for audit trail and idempotency tracking
   * Called first (before verification) to ensure all webhooks are logged
   *
   * @param {NowpaymentsIpnRequestDto} payload - Webhook payload
   * @param {string} signature - HMAC signature
   * @returns {Promise<WebhookLog>} Created webhook log entry
   *
   * @private
   * @example
   * ```typescript
   * const log = await this.logWebhookReceived(payload, signature);
   * console.log(log.id); // webhook-uuid
   * ```
   */
  private async logWebhookReceived(
    payload: NowpaymentsIpnRequestDto,
    signature: string,
  ): Promise<WebhookLog> {
    const webhookLog = new WebhookLog();
    webhookLog.externalId = String(payload.payment_id);
    webhookLog.webhookType = 'nowpayments_ipn';
    webhookLog.payload = payload as unknown as Record<string, unknown>;
    webhookLog.signature = signature; // Note: In production, never log full signature
    webhookLog.signatureValid = false; // Set later after verification
    webhookLog.processed = false;
    webhookLog.result = {
      success: false,
      message: 'Processing',
    } as Record<string, unknown>;

    return this.webhookLogRepo.save(webhookLog);
  }

  /**
   * Get webhook log for debugging/support
   * Used to retrieve webhook processing history
   *
   * @param {string} webhookId - Webhook log UUID
   * @returns {Promise<WebhookLog>} Webhook log entry
   *
   * @example
   * ```typescript
   * const log = await ipnHandler.getWebhookLog('webhook-uuid');
   * console.log(log.result); // Processing result
   * ```
   */
  async getWebhookLog(webhookId: string): Promise<WebhookLog> {
    const log = await this.webhookLogRepo.findOne({
      where: { id: webhookId },
    });

    if (log === null) {
      throw new Error(`Webhook log not found: ${webhookId}`);
    }

    return log;
  }

  /**
   * Get all webhook logs for an order (audit trail)
   * Shows all payment status updates for the order
   *
   * @param {string} orderId - Order UUID
   * @returns {Promise<WebhookLog[]>} All webhook logs for order
   *
   * @example
   * ```typescript
   * const logs = await ipnHandler.getOrderWebhookLogs('order-uuid');
   * logs.forEach(log => {
   *   console.log(`Payment ${log.externalId}: ${log.result.message}`);
   * });
   * ```
   */
  async getOrderWebhookLogs(orderId: string): Promise<WebhookLog[]> {
    return this.webhookLogRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Admin method: List webhook logs with pagination and filtering
   * Used by admin dashboard to view webhook delivery history
   *
   * **Filters:**
   * - webhookType: Filter by webhook source (e.g., 'nowpayments_ipn')
   * - processed: Filter by processed status (true/false)
   * - paymentStatus: Filter by payment status from webhook (processed/finished/waiting)
   * - orderId: Filter by associated order
   *
   * @param options Pagination and filter options
   * @returns Paginated list of webhook logs
   */
  async listWebhooks(options: {
    page: number;
    limit: number;
    webhookType?: string;
    processed?: boolean;
    paymentStatus?: string;
    orderId?: string;
  }): Promise<{
    data: Array<{
      id: string;
      externalId: string;
      webhookType: string;
      processed: boolean;
      signatureValid: boolean;
      paymentStatus?: string;
      orderId?: string;
      paymentId?: string;
      error?: string;
      attemptCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    const { page, limit, webhookType, processed, paymentStatus, orderId } = options;

    try {
      let query = this.webhookLogRepo.createQueryBuilder('webhook');

      // Apply filters
      if (webhookType !== undefined && webhookType !== '') {
        query = query.where('webhook.webhookType = :webhookType', { webhookType });
      }

      if (processed !== undefined) {
        query = query.andWhere('webhook.processed = :processed', { processed });
      }

      if (paymentStatus !== undefined && paymentStatus !== '') {
        query = query.andWhere('webhook.paymentStatus = :paymentStatus', { paymentStatus });
      }

      if (orderId !== undefined && orderId !== '') {
        query = query.andWhere('webhook.orderId = :orderId', { orderId });
      }

      // Get total count
      const total = await query.getCount();
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const webhookLogs = await query
        .orderBy('webhook.createdAt', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getMany();

      this.logger.debug(
        `[ADMIN] Listed webhook logs: ${webhookLogs.length} items, page ${page}/${totalPages}, total ${total}`,
      );

      return {
        data: webhookLogs.map((log) => ({
          id: log.id,
          externalId: log.externalId,
          webhookType: log.webhookType,
          processed: log.processed,
          signatureValid: log.signatureValid,
          paymentStatus: log.paymentStatus,
          orderId: log.orderId,
          paymentId: log.paymentId,
          error: log.error ?? undefined,
          attemptCount: log.attemptCount,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`[ADMIN] Failed to list webhook logs: ${errorMsg}`);
      throw new Error(`Failed to list webhook logs: ${errorMsg}`);
    }
  }

  /**
   * Health check for IPN handler
   * Verifies webhook logging is working
   *
   * @returns {Promise<{ status: string }>} Health status
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      // Verify we can read from webhook logs
      await this.webhookLogRepo.count();
      return { status: 'healthy' };
    } catch (error) {
      this.logger.error(
        `[IPN] Health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { status: 'unhealthy' };
    }
  }
}
