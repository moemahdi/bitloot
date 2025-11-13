import { Controller, Post, Get, Body, Param, Headers, HttpCode, Logger, UnauthorizedException, NotFoundException, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '../../jobs/queues';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { KinguinService } from './kinguin.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusResponse } from '../fulfillment/kinguin.client';
import { WebhookPayloadDto } from './dto/webhook.dto';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Kinguin Controller
 *
 * Provides HTTP endpoints for:
 * - Webhook receiver: POST /kinguin/webhooks (from Kinguin order deliveries)
 * - Status polling: GET /kinguin/status/:reservationId (check delivery progress)
 *
 * @example
 * // Webhook (called by Kinguin when order is ready):
 * POST /kinguin/webhooks
 * X-KINGUIN-SIGNATURE: <hmac>
 * {
 *   "reservationId": "res-123",
 *   "status": "ready",
 *   "key": "XXXXX-XXXXX-..."
 * }
 *
 * // Status polling (called by frontend to check progress):
 * GET /kinguin/status/res-123
 * Response: { id: "res-123", status: "ready", key: "XXXXX-..." }
 *
 * @see KinguinService for business logic
 * @see KinguinClient for API communication
 */
@ApiTags('Kinguin')
@Controller('kinguin')
export class KinguinController {
  private readonly logger = new Logger(KinguinController.name);

  constructor(
    private readonly kinguinService: KinguinService,
    private readonly ordersService: OrdersService,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue,
    @InjectRepository(WebhookLog) private readonly webhookLogsRepo: Repository<WebhookLog>,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Structured logging helper for JSON formatting
   * Emits logs in consistent format with timestamp, level, service, operation, status, and context
   *
   * @param level 'info' | 'warn' | 'error'
   * @param operation Operation identifier (e.g., 'handleWebhook:start', 'verify:invalid_sig')
   * @param status Outcome status ('success', 'failed', 'duplicate', etc.)
   * @param context Additional fields for debugging (reservationId, orderId, error, etc.)
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
      service: 'KinguinController',
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
   * Webhook endpoint - Receive order delivery notifications from Kinguin
   *
   * Called by Kinguin when:
   * - Order is ready (status=ready, includes key)
   * - Order fails (status=failed, includes error)
   * - Order is cancelled (status=cancelled)
   *
   * Validates webhook signature and processes idempotently (same reservation can appear multiple times)
   *
   * @param payload Webhook payload from Kinguin (reservationId, status, key, error, etc.)
   * @param signature HMAC signature from X-KINGUIN-SIGNATURE header for verification
   * @returns { ok: true } to acknowledge receipt and prevent Kinguin retries
   *
   * @throws UnauthorizedException (401) - Invalid or missing signature
   * @throws BadRequestException (400) - Invalid payload or reservation ID
   *
   * @example
   * POST /kinguin/webhooks
   * X-KINGUIN-SIGNATURE: abc123...
   * {
   *   "reservationId": "res-123",
   *   "status": "ready",
   *   "key": "XXXXX-XXXXX-XXXXX"
   * }
   *
   * Response (200):
   * { "ok": true }
   *
   * Security: Signature verification ensures webhook came from Kinguin
   */
  @Post('webhooks')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook receiver for Kinguin order deliveries' })
  @ApiHeader({
    name: 'X-KINGUIN-SIGNATURE',
    description: 'HMAC signature for webhook verification',
    required: true,
  })
  @ApiResponse({ status: 200, schema: { properties: { ok: { type: 'boolean' } } } })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-kinguin-signature') signature: string | undefined,
    @Req() req: Request,
  ): Promise<{ ok: boolean }> {
    // LOG START
    this.logStructured('info', 'handleWebhook:start', 'received', {
      reservationId: payload.reservationId,
      status: payload.status,
      hasKey: typeof payload.key === 'string' && payload.key.length > 0,
    });

    // 1. Validate signature header exists
    if (signature === undefined || typeof signature !== 'string' || signature.length === 0) {
      // LOG MISSING SIGNATURE
      this.logStructured('warn', 'handleWebhook:missing_header', 'no_signature', {
        reservationId: payload.reservationId,
      });

      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Missing X-KINGUIN-SIGNATURE header');
      throw new UnauthorizedException('Missing X-KINGUIN-SIGNATURE header');
    }

    // 2. Get raw body from middleware (captured before JSON parsing and DTO transformation)
    // This ensures HMAC is verified against the exact payload sent by Kinguin
    const rawPayload = (req as unknown as Record<string, unknown>).rawBody as string | undefined;

    if (rawPayload === undefined || rawPayload === '' || rawPayload.length === 0) {
      // LOG INVALID PAYLOAD
      this.logStructured('warn', 'handleWebhook:invalid_body', 'missing_raw_body', {
        reservationId: payload.reservationId,
      });

      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Invalid webhook payload (rawBody missing/empty)');
      this.logger.debug(`   rawBody value: ${String(rawPayload)}`);
      this.logger.debug(`   req.body: ${JSON.stringify(req.body)}`);
      throw new UnauthorizedException('Invalid webhook payload');
    }

    this.logger.debug(`[KINGUIN_WEBHOOK] DEBUG: rawPayload=${rawPayload.substring(0, 80)}..., sig=${signature.substring(0, 32)}...`);

    // 3. Verify HMAC signature using raw payload (matches what Kinguin signed)
    const isValid = this.kinguinService.validateWebhook(rawPayload, signature);

    if (!isValid) {
      // LOG INVALID SIGNATURE
      this.logStructured('warn', 'handleWebhook:verify_failed', 'invalid_signature', {
        reservationId: payload.reservationId,
      });

      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Invalid HMAC signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // LOG SIGNATURE VERIFIED
    this.logStructured('info', 'handleWebhook:signature_verified', 'valid', {
      reservationId: payload.reservationId,
    });

    // 4. Extract reservation ID from validated DTO
    const reservationId = payload.reservationId;
    if (reservationId === undefined || reservationId === '') {
      // LOG MISSING RESERVATION ID
      this.logStructured('warn', 'handleWebhook:missing_reservation', 'invalid_payload', {
        status: payload.status,
      });

      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Missing reservationId in payload');
      throw new UnauthorizedException('Missing reservationId in webhook payload');
    }

    // 5. Extract fields
    const status = payload.status ?? '';
    const hasKey = typeof payload.key === 'string' && payload.key.length > 0;

    this.logger.log(
      `[KINGUIN_WEBHOOK] ✅ Webhook received: reservationId=${reservationId}, status=${status}, hasKey=${hasKey}`,
    );

    // 6. Idempotency: skip if we already logged this reservation webhook
    const existing = await this.webhookLogsRepo.findOne({
      where: { externalId: reservationId, webhookType: 'kinguin_webhook' },
    });
    if (existing !== null) {
      // LOG DUPLICATE DETECTION
      this.logStructured('info', 'handleWebhook:duplicate_detected', 'already_processed', {
        reservationId,
        previousWebhookId: existing.id,
      });

      this.logger.debug(
        `[KINGUIN_WEBHOOK] Duplicate webhook ignored for reservationId=${reservationId}`,
      );
      return { ok: true };
    }

    // LOG IDEMPOTENCY CHECK PASSED
    this.logStructured('info', 'handleWebhook:idempotency_check', 'new_webhook', {
      reservationId,
      status,
      hasKey,
    });

    // 7. Log webhook for admin visibility
    const log = new WebhookLog();
    log.externalId = reservationId;
    log.webhookType = 'kinguin_webhook';
    log.payload = payload as unknown as Record<string, unknown>;
    log.signature = signature;
    log.signatureValid = true;
    log.processed = false;
    log.paymentStatus = status;
    await this.webhookLogsRepo.save(log);

    // 8. Find order by reservation ID to get orderId for job processing
    const order = await this.ordersService.findByReservation(reservationId);
    if (order === null) {
      // LOG ORDER NOT FOUND
      this.logStructured('warn', 'handleWebhook:order_not_found', 'lookup_failed', {
        reservationId,
      });

      this.logger.warn(
        `[KINGUIN_WEBHOOK] ❌ Order not found for reservationId=${reservationId}`,
      );
      // Log the error but still return 200 OK (Kinguin should not retry)
      throw new NotFoundException(`Order not found for reservation ${reservationId}`);
    }

    // LOG JOB ENQUEUEING
    this.logStructured('info', 'handleWebhook:enqueuing_job', 'in_progress', {
      reservationId,
      orderId: order.id,
      status,
    });

    // 9. Enqueue fulfillment webhook job for processor routing (now with orderId)
    await this.fulfillmentQueue.add(
      'kinguin.webhook',
      { orderId: order.id, reservationId, status },
      { jobId: `kinguin-webhook-${reservationId}-${Date.now()}`, removeOnComplete: true },
    );

    // LOG COMPLETION
    this.logStructured('info', 'handleWebhook:complete', 'success', {
      reservationId,
      orderId: order.id,
      status,
    });

    // 10. Always return 200 OK (prevents Kinguin from retrying)
    return { ok: true };
  }

  /**
   * Query order delivery status from Kinguin
   *
   * Polls Kinguin API to check current status of reservation.
   * Used by frontend to track order fulfillment progress.
   *
   * Status progression:
   * - waiting: Order created, awaiting processing
   * - processing: Kinguin is fulfilling the order
   * - ready: Order ready, key available (terminal - success)
   * - failed: Order failed (terminal - error)
   * - cancelled: Order cancelled (terminal - cancelled)
   *
   * @param reservationId Kinguin reservation/order ID from previous reserve() call
   * @returns Current status with key (if ready) or error message
   *
   * @throws NotFoundException (404) - Reservation not found
   * @throws BadRequestException (400) - Invalid reservation ID
   * @throws InternalServerErrorException (500) - API failure
   *
   * @example
   * GET /kinguin/status/res-123
   *
   * Response (200):
   * {
   *   "id": "res-123",
   *   "status": "ready",
   *   "key": "XXXXX-XXXXX-XXXXX-XXXXX"
   * }
   *
   * Response (400):
   * { "error": "Invalid reservation ID format" }
   *
   * Response (404):
   * { "error": "Reservation not found" }
   */
  @Get('status/:reservationId')
  @ApiOperation({ summary: 'Query Kinguin order delivery status' })
  @ApiResponse({ status: 200, description: 'Order status retrieved', schema: { properties: { id: { type: 'string' }, status: { type: 'string' }, key: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getStatus(
    @Param('reservationId') reservationId: string,
  ): Promise<OrderStatusResponse> {
    // 1. Validate reservation ID
    if (reservationId === undefined || reservationId === '' || reservationId.length === 0) {
      this.logger.warn('[KINGUIN_STATUS] ❌ Missing reservationId parameter');
      throw new NotFoundException('Reservation ID is required');
    }

    // 2. Query Kinguin service
    this.logger.debug(`[KINGUIN_STATUS] Querying status for reservation: ${reservationId}`);

    try {
      const status = await this.kinguinService.getDelivered(reservationId);

      this.logger.log(`[KINGUIN_STATUS] ✅ Status retrieved: id=${reservationId}, status=${status.status}`);

      return status;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logger.error(`[KINGUIN_STATUS] ❌ Status query failed: ${errorMsg}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw error;
    }
  }
}
