import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import { CatalogService } from './catalog.service';
import { GroupsService } from './groups.service';
import { CatalogCacheService } from './catalog-cache.service';
import { AdminInventoryService } from './services/admin-inventory.service';
import { StockSyncService } from './services/stock-sync.service';
import { CatalogController } from './products.controller';
import { GroupsController } from './groups.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminPricingController } from './admin-pricing.controller';
import { AdminRepriceController } from './admin-reprice.controller';
import { AdminSyncController } from './admin-sync.controller';
import { AdminKinguinController } from './admin-kinguin.controller';
import {
  AdminInventoryController,
  AdminInventoryGlobalController,
} from './controllers/admin-inventory.controller';
import { AdminStockSyncController } from './controllers/admin-stock-sync.controller';
import { KinguinCatalogClient } from './kinguin-catalog.client';
import { KinguinWebhooksController } from './kinguin-webhooks.controller';
import { AdminOpsModule } from '../admin/admin-ops.module';
import { AuditModule } from '../audit/audit.module';
import { CatalogProcessor } from '../../jobs/catalog.processor';

import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { ProductCategory } from './entities/product-category.entity';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';
import { ProductGroup } from './entities/product-group.entity';
import { ProductInventory } from './entities/product-inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductOffer,
      ProductCategory,
      DynamicPricingRule,
      ProductGroup,
      ProductInventory,
    ]),
    BullModule.registerQueue({ name: 'catalog' }),
    BullModule.registerQueue({ name: 'fulfillment' }),
    ScheduleModule.forRoot(),
    forwardRef(() => AdminOpsModule),
    AuditModule,
  ],
  providers: [
    CatalogService,
    GroupsService,
    CatalogCacheService,
    AdminInventoryService,
    StockSyncService,
    KinguinCatalogClient,
    CatalogProcessor,
  ],
  controllers: [
    CatalogController,
    GroupsController,
    AdminProductsController,
    AdminGroupsController,
    AdminPricingController,
    AdminRepriceController,
    AdminSyncController,
    AdminKinguinController,
    AdminInventoryController,
    AdminInventoryGlobalController,
    AdminStockSyncController,
    KinguinWebhooksController,
  ],
  exports: [
    CatalogService,
    GroupsService,
    CatalogCacheService,
    AdminInventoryService,
    StockSyncService,
    KinguinCatalogClient,
  ],
})
export class CatalogModule {}
