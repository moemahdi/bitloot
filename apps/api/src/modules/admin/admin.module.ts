import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminOpsModule } from './admin-ops.module';
import { AdminOpsController } from './admin-ops.controller';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Key } from '../orders/key.entity';
import { User } from '../../database/entities/user.entity';

/**
 * Admin Module - Management API for BitLoot operators
 *
 * Provides endpoints for:
 * - Payment monitoring and history
 * - Reservation tracking (Kinguin integration)
 * - Webhook log viewer with replay capability
 * - Order status and fulfillment tracking
 * - Feature flags, queue stats, balance monitoring (Phase 3)
 * - Admin-only operations
 *
 * All endpoints require JWT authentication + admin role
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Payment, WebhookLog, Key, User]),
    AdminOpsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController, AdminOpsController],
  exports: [AdminService],
})
export class AdminModule { }
