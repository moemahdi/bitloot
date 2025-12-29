import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { CatalogService } from './catalog.service';
import { CatalogController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductOffer, ProductCategory, DynamicPricingRule]),
    BullModule.registerQueue({ name: 'catalog' }),
    BullModule.registerQueue({ name: 'fulfillment' }),
    AdminOpsModule,
  ],
  providers: [CatalogService, KinguinCatalogClient, CatalogProcessor],
  controllers: [
    CatalogController,
    AdminProductsController,
    AdminPricingController,
    AdminRepriceController,
    AdminSyncController,
    AdminKinguinController,
    KinguinWebhooksController,
  ],
  exports: [CatalogService, KinguinCatalogClient],
})
export class CatalogModule {}
