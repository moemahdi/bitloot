import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FlashDeal,
  FlashDealProduct,
  BundleDeal,
  BundleProduct,
  SectionAnalytics,
} from './entities';
import { Product } from '../catalog/entities/product.entity';
import { MarketingService } from './marketing.service';
import { AdminMarketingController } from './admin-marketing.controller';
import { PublicMarketingController } from './public-marketing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FlashDeal,
      FlashDealProduct,
      BundleDeal,
      BundleProduct,
      SectionAnalytics,
      Product,
    ]),
  ],
  controllers: [AdminMarketingController, PublicMarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
