import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import {
  KinguinProductUpdateDto,
  KinguinOrderStatusDto,
  KinguinOrderStatus,
} from './dto/kinguin-webhook.dto';

/**
 * Kinguin Webhook Controller
 *
 * Handles webhook callbacks from Kinguin eCommerce API:
 * - product.update: Triggered when product inventory/pricing changes
 * - order.status: Triggered when order status changes (processing → completed)
 *
 * Webhook headers:
 * - X-Event-Name: Event type (product.update, order.status)
 * - X-Event-Secret: Shared secret for authentication
 *
 * IMPORTANT: Must return 204 No Content with empty body
 * Kinguin retries failed webhooks until 204 is returned
 *
 * Configure webhooks at: https://www.kinguin.net/integration/dashboard/stores
 */
@ApiTags('Webhooks')
@Controller('webhooks/kinguin')
export class KinguinWebhooksController {
  private readonly logger = new Logger(KinguinWebhooksController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('catalog') private readonly catalogQueue: Queue,
    @InjectQueue('fulfillment') private readonly fulfillmentQueue: Queue,
  ) {
    this.webhookSecret = this.configService.get<string>('KINGUIN_WEBHOOK_SECRET') ?? '';

    if (this.webhookSecret === '') {
      this.logger.warn('⚠️ KINGUIN_WEBHOOK_SECRET not configured - webhooks will reject all requests');
    }
  }

  /**
   * Validate webhook secret from X-Event-Secret header
   */
  private validateSecret(eventSecret: string | undefined): void {
    if (this.webhookSecret === '') {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    if (eventSecret === undefined || eventSecret === '') {
      throw new UnauthorizedException('Missing X-Event-Secret header');
    }

    // Timing-safe comparison to prevent timing attacks
    const secretBuffer = Buffer.from(this.webhookSecret);
    const eventSecretBuffer = Buffer.from(eventSecret);

    if (secretBuffer.length !== eventSecretBuffer.length) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (!crypto.timingSafeEqual(secretBuffer, eventSecretBuffer)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  /**
   * Handle product.update webhook
   *
   * Triggered when:
   * - Product is changed
   * - Product becomes out of stock
   * - New offer is available
   *
   * @param eventSecret - X-Event-Secret header for authentication
   * @param eventName - X-Event-Name header (should be "product.update")
   * @param payload - Product update data
   * @returns 204 No Content (empty response)
   */
  @Post('product-update')
  @HttpCode(204)
  @ApiExcludeEndpoint() // Hide from Swagger - internal webhook
  @ApiOperation({ summary: 'Handle Kinguin product.update webhook' })
  async handleProductUpdate(
    @Headers('x-event-secret') eventSecret: string,
    @Headers('x-event-name') eventName: string,
    @Body() payload: KinguinProductUpdateDto,
  ): Promise<void> {
    this.validateSecret(eventSecret);

    this.logger.log(
      `📦 Product update webhook received: kinguinId=${payload.kinguinId}, qty=${payload.qty}, productId=${payload.productId}`,
    );

    // Verify event name matches expected
    if (eventName !== undefined && eventName !== '' && eventName !== 'product.update') {
      this.logger.warn(`⚠️ Unexpected event name: ${eventName} (expected product.update)`);
    }

    try {
      // Enqueue job to update product in our catalog
      await this.catalogQueue.add(
        'sync-single-product',
        {
          kinguinId: payload.kinguinId,
          productId: payload.productId,
          qty: payload.qty,
          textQty: payload.textQty,
          cheapestOfferId: payload.cheapestOfferId,
          updatedAt: payload.updatedAt,
          source: 'webhook',
        },
        {
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );

      this.logger.log(`✅ Product update job enqueued for kinguinId=${payload.kinguinId}`);
    } catch (error: unknown) {
      // Log error but still return 204 to prevent Kinguin retries
      this.logger.error(
        `❌ Failed to enqueue product update job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Return 204 No Content with empty body (required by Kinguin)
    return;
  }

  /**
   * Handle order.status webhook
   *
   * Triggered when order status changes:
   * - processing: Order is being processed
   * - completed: Order fulfilled, keys available
   * - canceled: Order was canceled
   * - refunded: Order was refunded
   *
   * @param eventSecret - X-Event-Secret header for authentication
   * @param eventName - X-Event-Name header (should be "order.status")
   * @param payload - Order status data
   * @returns 204 No Content (empty response)
   */
  @Post('order-status')
  @HttpCode(204)
  @ApiExcludeEndpoint() // Hide from Swagger - internal webhook
  @ApiOperation({ summary: 'Handle Kinguin order.status webhook' })
  async handleOrderStatus(
    @Headers('x-event-secret') eventSecret: string,
    @Headers('x-event-name') eventName: string,
    @Body() payload: KinguinOrderStatusDto,
  ): Promise<void> {
    this.validateSecret(eventSecret);

    this.logger.log(
      `📋 Order status webhook received: orderId=${payload.orderId}, status=${payload.status}, externalId=${payload.orderExternalId ?? 'N/A'}`,
    );

    // Verify event name matches expected
    if (eventName !== undefined && eventName !== '' && eventName !== 'order.status') {
      this.logger.warn(`⚠️ Unexpected event name: ${eventName} (expected order.status)`);
    }

    try {
      // Handle based on order status
      const status = payload.status as KinguinOrderStatus;
      switch (status) {
        case KinguinOrderStatus.COMPLETED:
          // Order completed - keys are ready to be fetched
          await this.fulfillmentQueue.add(
            'fetch-keys',
            {
              kinguinOrderId: payload.orderId,
              externalOrderId: payload.orderExternalId,
              status,
              updatedAt: payload.updatedAt,
              source: 'webhook',
            },
            {
              removeOnComplete: true,
              removeOnFail: 100,
              attempts: 5,
              backoff: { type: 'exponential', delay: 5000 },
            },
          );
          this.logger.log(`✅ Fetch-keys job enqueued for order ${payload.orderId}`);
          break;

        case KinguinOrderStatus.CANCELED:
          // Order canceled - handle refund/cancellation
          await this.fulfillmentQueue.add(
            'order-canceled',
            {
              kinguinOrderId: payload.orderId,
              externalOrderId: payload.orderExternalId,
              status,
              updatedAt: payload.updatedAt,
              source: 'webhook',
            },
            {
              removeOnComplete: true,
              removeOnFail: 100,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            },
          );
          this.logger.log(`⚠️ Order canceled job enqueued for order ${payload.orderId}`);
          break;

        case KinguinOrderStatus.REFUNDED:
          // Order was refunded - log and potentially trigger refund workflow
          this.logger.log(`💰 Order ${payload.orderId} was refunded`);
          // TODO: Add refund handling logic if needed
          break;

        case KinguinOrderStatus.PROCESSING:
          // Log status change, no action needed yet - order is still being processed
          this.logger.log(`ℹ️ Order ${payload.orderId} status: ${status}`);
          break;

        default: {
          // Exhaustive switch - status is 'never' here
          const _exhaustiveCheck: never = status;
          this.logger.warn(`⚠️ Unknown order status: ${String(_exhaustiveCheck)}`);
        }
      }
    } catch (error: unknown) {
      // Log error but still return 204 to prevent Kinguin retries
      this.logger.error(
        `❌ Failed to process order status webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Return 204 No Content with empty body (required by Kinguin)
    return;
  }

  /**
   * Health check endpoint for webhook validation
   * Can be used to test webhook connectivity
   */
  @Post('health')
  @HttpCode(204)
  @ApiExcludeEndpoint()
  healthCheck(
    @Headers('x-event-secret') eventSecret: string,
  ): void {
    this.validateSecret(eventSecret);
    this.logger.log('✅ Webhook health check passed');
  }
}
