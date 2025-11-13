import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Key } from './key.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailsModule } from '../emails/emails.module';

/**
 * Orders Module
 *
 * Provides order management services and API endpoints for:
 * - Creating orders
 * - Retrieving order details
 * - Managing order items
 * - Linking orders to reservations
 * - Email notifications for order status changes (Level 4)
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
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Key]), EmailsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
