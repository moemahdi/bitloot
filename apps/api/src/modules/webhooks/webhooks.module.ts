import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpnHandlerService } from './ipn-handler.service';
import { IpnHandlerController } from './ipn-handler.controller';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Order } from '../orders/order.entity';
import { MetricsModule } from '../metrics/metrics.module';
import { EmailsModule } from '../emails/emails.module';
import { ResendBounceController } from './resend-bounce.controller';
import { FulfillmentQueue } from '../../jobs/queues';

/**
 * Webhooks Module
 *
 * Handles incoming webhooks from third-party services:
 * - NOWPayments IPN (payment status)
 * - Resend bounce/complaint events (email deliverability)
 *
 * **Exported Services:**
 * - IpnHandlerService: Process NOWPayments IPN webhooks
 *
 * **Registered Entities:**
 * - WebhookLog: Audit trail and idempotency tracking
 * - Order: For status updates via IPN
 *
 * **Controllers:**
 * - IpnHandlerController: REST endpoint for NOWPayments webhooks
 * - ResendBounceController: REST endpoint for Resend bounce/complaint events
 *
 * **Queue Integration:**
 * - FulfillmentQueue: Triggers order fulfillment after payment confirmation
 *
 * **Security Features:**
 * - HMAC-SHA512 signature verification
 * - Idempotency via unique constraints on WebhookLog
 * - Audit trail for all webhook events
 * - Always returns 200 OK to prevent webhook retries
 * - Bounce event handling with suppression list updates
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookLog, Order]),
    MetricsModule,
    EmailsModule,
    FulfillmentQueue, // Enable IpnHandlerService to queue fulfillment jobs
  ],
  controllers: [IpnHandlerController, ResendBounceController],
  providers: [IpnHandlerService],
  exports: [IpnHandlerService],
})
export class WebhooksModule {}
