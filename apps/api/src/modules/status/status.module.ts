import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { AdminOpsModule } from '../admin/admin-ops.module';

/**
 * Status Module
 *
 * Public endpoints for system status checks.
 * No authentication required for these endpoints.
 * 
 * Uses FeatureFlagsService from AdminOpsModule to ensure
 * the same cached instance is used across the application.
 */
@Module({
  imports: [AdminOpsModule],
  controllers: [StatusController],
})
export class StatusModule {}
