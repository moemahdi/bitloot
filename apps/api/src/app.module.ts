import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { HealthController } from './health/health.controller';
import { Order } from './modules/orders/order.entity';
import { OrderItem } from './modules/orders/order-item.entity';
import { Payment } from './modules/payments/payment.entity';
import { WebhookLog } from './database/entities/webhook-log.entity';
import { User } from './database/entities/user.entity';
import { OrdersService } from './modules/orders/orders.service';
import { OrdersController } from './modules/orders/orders.controller';
import { StorageService } from './modules/storage/storage.service';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BullQueues, FulfillmentQueue } from './jobs/queues';
import { FulfillmentProcessor } from './jobs/fulfillment.processor';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { WebSocketModule } from './modules/fulfillment/websocket.module';
import { KinguinModule } from './modules/kinguin/kinguin.module';
import { UsersModule } from './modules/users/users.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { EmailsModule } from './modules/emails/emails.module';
import { AuditModule } from './modules/audit/audit.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'C:/Users/beast/bitloot/.env',
    }),
    HttpModule,
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
    TypeOrmModule.forFeature([Order, OrderItem, Payment, WebhookLog, User]),
    // Register BullMQ queue for fulfillment processing
    FulfillmentQueue,
    // Feature modules
    WebhooksModule,
    AdminModule,
    AuthModule,
    PaymentsModule,
    // Fulfillment & WebSocket modules (providers for services/gateway)
    FulfillmentModule,
    WebSocketModule,
    // Kinguin integration module (controller + services + queue)
    KinguinModule,
    // User management module
    UsersModule,
    // Metrics collection module (Prometheus)
    MetricsModule,
    // Emails module (Resend integration, retry, suppression list, bounces)
    EmailsModule,
    // Audit logging module (admin actions & exports)
    AuditModule,
    // Catalog management module (products, pricing rules, Kinguin sync)
    CatalogModule,
    // Reviews module (customer reviews, admin moderation, ratings)
    ReviewsModule,
  ],
  controllers: [HealthController, OrdersController],
  providers: [
    // Services
    OrdersService,
    StorageService,
    // BullMQ Processors (must be registered as providers to be instantiated)
    // Note: PaymentProcessorService is provided by PaymentsModule
    // Note: CatalogProcessor is provided by CatalogModule
    FulfillmentProcessor,
  ],
})
export class AppModule {}
