import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminOpsService } from './admin-ops.service';
import { AdminOpsController } from './admin-ops.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { FeatureFlag } from '../../database/entities/feature-flag.entity';
import { SystemConfig } from '../../database/entities/system-config.entity';
import { UserDeletionCleanupService } from '../../jobs/user-deletion-cleanup.processor';
import { AuthModule } from '../auth/auth.module';
import { EmailsModule } from '../emails/emails.module';
import { AuditModule } from '../audit/audit.module';

/**
 * Admin Ops Module - Feature Flags, System Configuration, Ops Panels
 *
 * Features:
 * - Feature flags with database persistence
 * - System configuration for API credentials (encrypted secrets)
 * - Sandbox/Production environment switching
 * - Queue statistics and monitoring
 * - Balance monitoring (NOWPayments, Kinguin)
 * - System health checks
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureFlag, SystemConfig]),
    BullModule.registerQueue(
      { name: 'payments-queue' },
      { name: 'fulfillment-queue' },
    ),
    forwardRef(() => AuthModule),
    forwardRef(() => EmailsModule),
    AuditModule,
  ],
  providers: [
    AdminOpsService,
    FeatureFlagsService,
    SystemConfigService,
    UserDeletionCleanupService,
    // Note: AuditLogInterceptor is registered globally in AdminModule
  ],
  controllers: [
    AdminOpsController,
    FeatureFlagsController,
    SystemConfigController,
  ],
  exports: [AdminOpsService, FeatureFlagsService, SystemConfigService],
})
export class AdminOpsModule {}
