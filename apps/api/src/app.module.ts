import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthController } from './health/health.controller';
import { Order } from './modules/orders/order.entity';
import { OrderItem } from './modules/orders/order-item.entity';
import { Payment } from './modules/payments/payment.entity';
import { WebhookLog } from './database/entities/webhook-log.entity';
import { OrdersService } from './modules/orders/orders.service';
import { OrdersController } from './modules/orders/orders.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { StorageService } from './modules/storage/storage.service';
import { EmailsService } from './modules/emails/emails.service';
import { NowPaymentsClient } from './modules/payments/nowpayments.client';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BullQueues, PaymentsQueue, FulfillmentQueue } from './jobs/queues';
import { PaymentProcessorService } from './jobs/payment-processor.service';
import { FulfillmentProcessorService } from './jobs/fulfillment-processor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'C:/Users/beast/bitloot/.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    // BullMQ root configuration (global connection to Redis)
    BullQueues,
    // Register feature entities
    TypeOrmModule.forFeature([Order, OrderItem, Payment, WebhookLog]),
    // Register BullMQ queues for job processing
    PaymentsQueue,
    FulfillmentQueue,
    // Feature modules
    WebhooksModule,
  ],
  controllers: [HealthController, OrdersController, PaymentsController],
  providers: [
    // Services
    OrdersService,
    PaymentsService,
    // NowPaymentsClient factory: provide API key and base URL from environment
    {
      provide: NowPaymentsClient,
      useFactory: () => {
        const apiKey = process.env.NOWPAYMENTS_API_KEY ?? '';
        const baseUrl = process.env.NOWPAYMENTS_BASE ?? 'https://api-sandbox.nowpayments.io/v1';
        return new NowPaymentsClient(apiKey, baseUrl);
      },
    },
    StorageService,
    EmailsService,
    // BullMQ Processors (must be registered as providers to be instantiated)
    PaymentProcessorService,
    FulfillmentProcessorService,
  ],
})
export class AppModule {}
