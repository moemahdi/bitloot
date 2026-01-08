import { Controller, Post, Get, Body, Param, Headers, HttpCode, Logger, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { OrderStatusWebhookDto, ProductUpdateWebhookDto, KinguinWebhookEventName } from './dto/webhook.dto';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Kinguin Controller
 *
 * Provides HTTP endpoints for:
 * - Webhook receiver: POST /kinguin/webhooks (from Kinguin eCommerce API)
 * - Status polling: GET /kinguin/status/:orderId (check delivery progress)
 *
 * @example
 * // Order Status Webhook (called by Kinguin when order status changes):
 * POST /kinguin/webhooks
 * X-Event-Name: order.status
 * X-Event-Secret: <your-secret>
 * {
 *   "orderId": "PHS84FJAG5U",
 *   "orderExternalId": "AL2FEEHOO2OHF",
 *   "status": "completed",
 *   "updatedAt": "2020-10-16T11:24:08.025+00:00"
 * }
 *
 * // Product Update Webhook (called when product stock changes):
 * POST /kinguin/webhooks
 * X-Event-Name: product.update
 * X-Event-Secret: <your-secret>
 * {
 *   "kinguinId": 1949,
 *   "productId": "5c9b5f6b2539a4e8f172916a",
 *   "qty": 845,
 *   "textQty": 845,
 *   "cheapestOfferId": ["611222acff9ca40001f0b020"],
 *   "updatedAt": "2020-10-16T11:24:08.015+00:00"
 * }
 *
 * // Status polling (called by frontend to check progress):
 * GET /kinguin/status/PHS84FJAG5U
 * Response: { id: "PHS84FJAG5U", status: "completed", ... }
 *
 * @see https://api.kinguin.net/doc/webhooks
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
   * Webhook endpoint - Receive notifications from Kinguin eCommerce API
   *
   * Called by Kinguin for:
   * - order.status: Order status changes (processing → completed, canceled, refunded)
   * - product.update: Product stock/availability updates
   *
   * Validates X-Event-Secret header and processes idempotently.
   *
   * @param eventName Event type from X-Event-Name header
   * @param eventSecret Secret from X-Event-Secret header for verification
   * @param body Raw webhook body (validated based on event type)
   *
   * @returns 204 No Content to acknowledge receipt
   *
   * @throws UnauthorizedException (401) - Invalid or missing X-Event-Secret
   * @throws BadRequestException (400) - Invalid payload or unknown event type
   *
   * @see https://api.kinguin.net/doc/webhooks
   */
  @Post('webhooks')
  @HttpCode(204)
  @ApiOperation({ summary: 'Webhook receiver for Kinguin eCommerce API events' })
  @ApiHeader({
    name: 'X-Event-Name',
    description: 'Webhook event type (order.status or product.update)',
    required: true,
  })
  @ApiHeader({
    name: 'X-Event-Secret',
    description: 'Secret key for webhook verification',
    required: true,
  })
  @ApiResponse({ status: 204, description: 'Webhook acknowledged' })
  @ApiResponse({ status: 401, description: 'Invalid X-Event-Secret' })
  @ApiResponse({ status: 400, description: 'Invalid event type or payload' })
  async handleWebhook(
    @Headers('x-event-name') eventName: string | undefined,
    @Headers('x-event-secret') eventSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ): Promise<void> {
    // LOG START
    this.logStructured('info', 'handleWebhook:start', 'received', {
      eventName,
      hasSecret: typeof eventSecret === 'string' && eventSecret.length > 0,
    });

    // 1. Validate X-Event-Name header
    const validEvents = ['order.status', 'order.complete', 'product.update'];
    if (typeof eventName !== 'string' || !validEvents.includes(eventName)) {
      this.logStructured('warn', 'handleWebhook:invalid_event', 'bad_request', {
        eventName,
      });
      this.logger.warn(`[KINGUIN_WEBHOOK] ❌ Invalid or missing X-Event-Name: ${eventName}`);
      throw new BadRequestException(`Invalid X-Event-Name: ${eventName}`);
    }

    // 2. Validate X-Event-Secret header
    if (typeof eventSecret !== 'string' || eventSecret.length === 0) {
      this.logStructured('warn', 'handleWebhook:missing_secret', 'unauthorized', {
        eventName,
      });
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Missing X-Event-Secret header');
      throw new UnauthorizedException('Missing X-Event-Secret header');
    }

    // 3. Verify X-Event-Secret matches configured secret
    const isValid = this.kinguinService.validateWebhookSecret(eventSecret);
    if (!isValid) {
      this.logStructured('warn', 'handleWebhook:verify_failed', 'unauthorized', {
        eventName,
      });
      this.metrics.incrementInvalidHmac('kinguin');
      this.logger.warn('[KINGUIN_WEBHOOK] ❌ Invalid X-Event-Secret');
      throw new UnauthorizedException('Invalid X-Event-Secret');
    }

    // LOG SECRET VERIFIED
    this.logStructured('info', 'handleWebhook:secret_verified', 'valid', {
      eventName,
    });

    // 4. Route by event type
    const typedEventName = eventName as KinguinWebhookEventName;

    if (typedEventName === 'order.status' || typedEventName === 'order.complete') {
      // order.complete is essentially a final order.status update
      await this.handleOrderStatusWebhook(body as unknown as OrderStatusWebhookDto);
    } else if (typedEventName === 'product.update') {
      await this.handleProductUpdateWebhook(body as unknown as ProductUpdateWebhookDto);
    }

    // 204 No Content returned automatically (void return)
  }

  /**
   * Handle order.status webhook event
   * Processes order status changes from Kinguin
   */
  private async handleOrderStatusWebhook(payload: OrderStatusWebhookDto): Promise<void> {
    const { orderId, orderExternalId, status, updatedAt } = payload;

    this.logStructured('info', 'handleOrderStatus:start', 'processing', {
      orderId,
      orderExternalId,
      status,
      updatedAt,
    });

    // Validate required fields
    if (orderId === undefined || orderId === null || orderId === '') {
      this.logStructured('warn', 'handleOrderStatus:missing_orderId', 'bad_request', {
        status,
      });
      throw new BadRequestException('Missing orderId in webhook payload');
    }

    // Idempotency: skip if we already logged this EXACT webhook (same orderId + status)
    // Note: We need to allow different status transitions (processing → completed) for the same order
    const existing = await this.webhookLogsRepo.findOne({
      where: { 
        externalId: orderId, 
        webhookType: 'kinguin_order_status',
        paymentStatus: status,  // Include status in uniqueness check
      },
    });

    if (existing !== null) {
      this.logStructured('info', 'handleOrderStatus:duplicate', 'already_processed', {
        orderId,
        status,
        previousWebhookId: existing.id,
      });
      this.metrics.incrementDuplicateWebhook('kinguin', 'order_status');
      this.logger.debug(`[KINGUIN_WEBHOOK] Duplicate webhook ignored for orderId=${orderId}, status=${status}`);
      return;
    }

    this.logStructured('info', 'handleOrderStatus:idempotency_passed', 'new_webhook', {
      orderId,
      status,
    });

    // Log webhook for admin visibility
    const log = new WebhookLog();
    log.externalId = orderId;
    log.webhookType = 'kinguin_order_status';
    log.payload = payload as unknown as Record<string, unknown>;
    log.signature = '';  // eCommerce API uses X-Event-Secret, not signature
    log.signatureValid = true;
    log.processed = false;
    log.paymentStatus = status;
    await this.webhookLogsRepo.save(log);

    // Find order by Kinguin order ID (stored as kinguinReservationId in our database)
    const order = await this.ordersService.findByReservation(orderId);
    if (order === null) {
      this.logStructured('warn', 'handleOrderStatus:order_not_found', 'lookup_failed', {
        orderId,
        orderExternalId,
      });
      this.logger.warn(`[KINGUIN_WEBHOOK] ⚠️ Order not found for orderId=${orderId}`);
      // Log but don't throw - acknowledge webhook to prevent retries
      return;
    }

    this.logStructured('info', 'handleOrderStatus:enqueuing_job', 'in_progress', {
      orderId,
      internalOrderId: order.id,
      status,
    });

    // Enqueue fulfillment job based on status
    // Status values: processing, completed, canceled, refunded
    if (status === 'completed') {
      await this.fulfillmentQueue.add(
        'kinguin.order.completed',
        { orderId: order.id, kinguinOrderId: orderId, status },
        { jobId: `kinguin-completed-${orderId}-${Date.now()}`, removeOnComplete: true },
      );
    } else if (status === 'canceled' || status === 'refunded') {
      await this.fulfillmentQueue.add(
        'kinguin.order.failed',
        { orderId: order.id, kinguinOrderId: orderId, status },
        { jobId: `kinguin-failed-${orderId}-${Date.now()}`, removeOnComplete: true },
      );
    }
    // 'processing' status doesn't require action - order is still in progress

    this.logStructured('info', 'handleOrderStatus:complete', 'success', {
      orderId,
      internalOrderId: order.id,
      status,
    });
  }

  /**
   * Handle product.update webhook event
   * Processes product stock/availability updates from Kinguin
   */
  private async handleProductUpdateWebhook(payload: ProductUpdateWebhookDto): Promise<void> {
    const { kinguinId, productId, qty, textQty, cheapestOfferId, updatedAt } = payload;

    this.logStructured('info', 'handleProductUpdate:start', 'processing', {
      kinguinId,
      productId,
      qty,
      textQty,
      offerCount: cheapestOfferId?.length ?? 0,
      updatedAt,
    });

    // Check for duplicate webhook (idempotency)
    const existingLog = await this.webhookLogsRepo.findOne({
      where: {
        externalId: String(kinguinId),
        webhookType: 'kinguin_product_update',
      },
    });

    if (existingLog !== null && existingLog !== undefined) {
      this.logStructured('info', 'handleProductUpdate:duplicate', 'already_processed', {
        kinguinId,
        productId,
        previousWebhookId: existingLog.id,
      });
      this.logger.debug(
        `[KINGUIN_WEBHOOK] Duplicate product update ignored for kinguinId=${kinguinId}`,
      );
      return; // Skip duplicate
    }

    // For now, just log the product update
    // Future: Update local product cache, trigger price updates, etc.
    this.logger.log(
      `[KINGUIN_WEBHOOK] Product update: kinguinId=${kinguinId}, productId=${productId}, qty=${qty}`,
    );

    // Log webhook for admin visibility
    const log = new WebhookLog();
    log.externalId = String(kinguinId);
    log.webhookType = 'kinguin_product_update';
    log.payload = payload as unknown as Record<string, unknown>;
    log.signature = '';
    log.signatureValid = true;
    log.processed = true;  // Product updates are logged but not processed further
    log.paymentStatus = 'product_update';
    await this.webhookLogsRepo.save(log);

    this.logStructured('info', 'handleProductUpdate:complete', 'success', {
      kinguinId,
      productId,
      qty,
    });
  }

  /**
   * Query order status from Kinguin eCommerce API
   *
   * Polls Kinguin API to check current status of an order.
   * Used by frontend to track order fulfillment progress.
   *
   * Status progression (eCommerce API):
   * - processing: Order is being fulfilled
   * - completed: Order fulfilled, keys available (terminal - success)
   * - canceled: Order was canceled (terminal - canceled)
   * - refunded: Order was refunded (terminal - refunded)
   *
   * @param orderId Kinguin order ID (e.g., "PHS84FJAG5U")
   * @returns Current status with keys (if completed) or error message
   *
   * @throws NotFoundException (404) - Order not found
   * @throws BadRequestException (400) - Invalid order ID
   * @throws InternalServerErrorException (500) - API failure
   *
   * @example
   * GET /kinguin/status/PHS84FJAG5U
   *
   * Response (200):
   * {
   *   "id": "PHS84FJAG5U",
   *   "status": "completed",
   *   "key": "XXXXX-XXXXX-XXXXX-XXXXX"
   * }
   *
   * Response (400):
   * { "error": "Invalid order ID format" }
   *
   * Response (404):
   * { "error": "Order not found" }
   */
  @Get('status/:orderId')
  @ApiOperation({ summary: 'Query Kinguin order status' })
  @ApiResponse({ status: 200, description: 'Order status retrieved', schema: { properties: { id: { type: 'string' }, status: { type: 'string' }, key: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getStatus(
    @Param('orderId') orderId: string,
  ): Promise<OrderStatusResponse> {
    // 1. Validate order ID
    if (orderId === undefined || orderId === '' || orderId.length === 0) {
      this.logger.warn('[KINGUIN_STATUS] ❌ Missing orderId parameter');
      throw new NotFoundException('Order ID is required');
    }

    // 2. Query Kinguin service
    this.logger.debug(`[KINGUIN_STATUS] Querying status for order: ${orderId}`);

    try {
      const status = await this.kinguinService.getDelivered(orderId);

      this.logger.log(`[KINGUIN_STATUS] ✅ Status retrieved: id=${orderId}, status=${status.status}`);

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
