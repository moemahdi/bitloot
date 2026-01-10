import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminOpsService } from './admin-ops.service';
import { AdminOpsController } from './admin-ops.controller';
import { UserDeletionCleanupService } from '../../jobs/user-deletion-cleanup.processor';
import { AuthModule } from '../auth/auth.module';
import { EmailsModule } from '../emails/emails.module';

/**
 * Admin Ops Module - Phase 3: Ops Panels & Monitoring
 * Provides feature flags, queue stats, balance monitoring, system health
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'payments' },
      { name: 'fulfillment' },
    ),
    AuthModule,
    EmailsModule,
  ],
  providers: [AdminOpsService, UserDeletionCleanupService],
  controllers: [AdminOpsController],
  exports: [AdminOpsService],
})
export class AdminOpsModule {}
