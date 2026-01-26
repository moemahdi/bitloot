import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { NowPaymentsClient } from './nowpayments.client';
import { MetricsModule } from '../metrics/metrics.module';
import { EmailsModule } from '../emails/emails.module';
import { OrdersModule } from '../orders/orders.module';
import { AdminOpsModule } from '../admin/admin-ops.module';
import { FulfillmentQueue } from '../../jobs/queues';
import { PaymentProcessorService } from '../../jobs/payment-processor.service';

/**
 * Payments Module
 *
 * Handles NOWPayments crypto payment processing:
 * - Payment invoice creation
 * - IPN webhook verification
 * - Order status updates
 * - Metrics collection (invalid HMAC, duplicates, etc.)
 *
 * Feature Flags:
 * - auto_fulfill_enabled: When disabled, orders won't auto-queue for fulfillment
 *
 * Dependencies:
 * - BullMQ: Async payment processing jobs
 * - Metrics: Prometheus metrics collection
 * - Orders: Order status management
 * - Storage: Key storage (R2)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, WebhookLog]),
    FulfillmentQueue,
    MetricsModule,
    EmailsModule,
    OrdersModule,
    AdminOpsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentProcessorService,
    {
      provide: NowPaymentsClient,
      useFactory: () => {
        const apiKey = process.env.NOWPAYMENTS_API_KEY ?? '';
        const baseUrl = process.env.NOWPAYMENTS_BASE ?? 'https://api-sandbox.nowpayments.io/v1';
        return new NowPaymentsClient(apiKey, baseUrl);
      },
    },
  ],
  exports: [PaymentsService, PaymentProcessorService, NowPaymentsClient],
})
export class PaymentsModule { }
