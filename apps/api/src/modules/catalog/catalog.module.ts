import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { CatalogService } from './catalog.service';
import { CatalogController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminPricingController } from './admin-pricing.controller';
import { AdminRepriceController } from './admin-reprice.controller';
import { AdminSyncController } from './admin-sync.controller';
import { KinguinCatalogClient } from './kinguin-catalog.client';

import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { ProductCategory } from './entities/product-category.entity';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductOffer, ProductCategory, DynamicPricingRule]),
    BullModule.registerQueue({ name: 'catalog' }),
  ],
  providers: [CatalogService, KinguinCatalogClient],
  controllers: [
    CatalogController,
    AdminProductsController,
    AdminPricingController,
    AdminRepriceController,
    AdminSyncController,
  ],
  exports: [CatalogService, KinguinCatalogClient],
})
export class CatalogModule {}
