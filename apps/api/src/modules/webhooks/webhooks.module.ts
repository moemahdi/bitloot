import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpnHandlerService } from './ipn-handler.service';
import { IpnHandlerController } from './ipn-handler.controller';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Order } from '../orders/order.entity';

/**
 * Webhooks Module
 *
 * Handles incoming webhooks from third-party services (e.g., NOWPayments)
 *
 * **Exported Services:**
 * - IpnHandlerService: Process NOWPayments IPN webhooks
 *
 * **Registered Entities:**
 * - WebhookLog: Audit trail and idempotency tracking
 * - Order: For status updates via IPN
 *
 * **Controllers:**
 * - IpnHandlerController: REST endpoint for webhook ingestion
 *
 * **Security Features:**
 * - HMAC-SHA512 signature verification
 * - Idempotency via unique constraints on WebhookLog
 * - Audit trail for all webhook events
 * - Always returns 200 OK to prevent webhook retries
 */
@Module({
  imports: [TypeOrmModule.forFeature([WebhookLog, Order])],
  controllers: [IpnHandlerController],
  providers: [IpnHandlerService],
  exports: [IpnHandlerService],
})
export class WebhooksModule {}
