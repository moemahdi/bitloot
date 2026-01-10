import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { CatalogService } from './catalog.service';
import { GroupsService } from './groups.service';
import { CatalogController } from './products.controller';
import { GroupsController } from './groups.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminPricingController } from './admin-pricing.controller';
import { AdminRepriceController } from './admin-reprice.controller';
import { AdminSyncController } from './admin-sync.controller';
import { AdminKinguinController } from './admin-kinguin.controller';
import { KinguinCatalogClient } from './kinguin-catalog.client';
import { KinguinWebhooksController } from './kinguin-webhooks.controller';
import { AdminOpsModule } from '../admin/admin-ops.module';
import { CatalogProcessor } from '../../jobs/catalog.processor';

import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { ProductCategory } from './entities/product-category.entity';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';
import { ProductGroup } from './entities/product-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductOffer,
      ProductCategory,
      DynamicPricingRule,
      ProductGroup,
    ]),
    BullModule.registerQueue({ name: 'catalog' }),
    BullModule.registerQueue({ name: 'fulfillment' }),
    forwardRef(() => AdminOpsModule),
  ],
  providers: [CatalogService, GroupsService, KinguinCatalogClient, CatalogProcessor],
  controllers: [
    CatalogController,
    GroupsController,
    AdminProductsController,
    AdminGroupsController,
    AdminPricingController,
    AdminRepriceController,
    AdminSyncController,
    AdminKinguinController,
    KinguinWebhooksController,
  ],
  exports: [CatalogService, GroupsService, KinguinCatalogClient],
})
export class CatalogModule {}
