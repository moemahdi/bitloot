import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminOpsModule } from './admin-ops.module';
// AdminOpsController is provided by AdminOpsModule (no direct import needed)
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Key } from '../orders/key.entity';
import { User } from '../../database/entities/user.entity';
import { Product } from '../catalog/entities/product.entity';
import { EmailsModule } from '../emails/emails.module';
import { StorageService } from '../storage/storage.service';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { AuditModule } from '../audit/audit.module';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

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
    TypeOrmModule.forFeature([Order, Payment, WebhookLog, Key, User, Product]),
    AdminOpsModule,
    EmailsModule,
    FulfillmentModule, // Provides R2StorageClient and FulfillmentService
    AuditModule, // For audit logging interceptor
  ],
  providers: [
    AdminService,
    StorageService,
    // Apply AuditLogInterceptor to all admin endpoints
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule { }
