import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Key } from './key.entity';
import { Payment } from '../payments/payment.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailsModule } from '../emails/emails.module';
import { CatalogModule } from '../catalog/catalog.module';
import { MarketingModule } from '../marketing/marketing.module';

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
    EmailsModule,
    CatalogModule,
    MarketingModule,
    ConfigModule,
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
