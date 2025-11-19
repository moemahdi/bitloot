/**
 * Test-specific module that avoids database initialization
 * Used by E2E tests to bootstrap NestJS without real database connection
 */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from '../../../health/health.controller';
import { OrdersService } from '../../orders/orders.service';
import { OrdersController } from '../../orders/orders.controller';
import { StorageService } from '../../storage/storage.service';
import { CatalogModule } from '../catalog.module';

/**
 * Minimal test module without TypeORM database initialization
 * Provides basic structure for E2E tests
 */
@Module({
  imports: [HttpModule, CatalogModule],
  controllers: [HealthController, OrdersController],
  providers: [OrdersService, StorageService],
  exports: [OrdersService, StorageService],
})
export class TestAppModule {}
