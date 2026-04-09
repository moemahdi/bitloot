import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Key } from './key.entity';
import { Payment } from '../payments/payment.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailsModule } from '../emails/emails.module';
import { CatalogModule } from '../catalog/catalog.module';
import { MarketingModule } from '../marketing/marketing.module';
import { PromosModule } from '../promos/promos.module';
import { CreditsModule } from '../credits/credits.module';
import { AdminOpsModule } from '../admin/admin-ops.module';
import { QUEUE_NAMES } from '../../jobs/queues';

/**
 * Orders Module
 *
 * Provides order management services and API endpoints for:
 * - Creating orders
 * - Retrieving order details
 * - Managing order items
 * - Linking orders to reservations
 * - Email notifications for order status changes (Level 4)
 * - Order session tokens for immediate guest access
 * - Promo code validation and redemption tracking
 *
 * Feature Flags:
 * - payment_processing_enabled: Controls order creation
 * - maintenance_mode: Blocks all orders when enabled
 *
 * @example
 * // In app.module.ts:
 * @Module({
 *   imports: [OrdersModule, ...]
 * })
 * export class AppModule {}
 *
 * // In another service:
 * constructor(private readonly orders: OrdersService) {}
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Key, Payment]),
    BullModule.registerQueue({ name: QUEUE_NAMES.FULFILLMENT }),
    forwardRef(() => EmailsModule),
    CatalogModule,
    MarketingModule,
    PromosModule,
    CreditsModule,
    ConfigModule,
    forwardRef(() => AdminOpsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule { }
