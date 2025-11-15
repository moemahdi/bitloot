import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminOpsService } from './admin-ops.service';
import { AdminOpsController } from './admin-ops.controller';

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
  ],
  providers: [AdminOpsService],
  controllers: [AdminOpsController],
  exports: [AdminOpsService],
})
export class AdminOpsModule {}
