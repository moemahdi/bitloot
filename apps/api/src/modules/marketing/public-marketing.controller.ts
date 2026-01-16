import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiProperty } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import {
  PageConfigResponseDto,
  FlashDealResponseDto,
  BundleDealResponseDto,
} from './dto';

// DTO for effective price request
class GetEffectivePriceDto {
  @ApiProperty({ description: 'Product ID' })
  productId!: string;

  @ApiProperty({ description: 'Base price of product' })
  price!: string;

  @ApiProperty({ description: 'Currency code', default: 'EUR' })
  currency?: string;
}

class GetEffectivePricesRequestDto {
  @ApiProperty({ type: [GetEffectivePriceDto], description: 'Products to get effective prices for' })
  products!: GetEffectivePriceDto[];
}

// DTO for effective price response
class EffectivePriceResponseDto {
  @ApiProperty() productId!: string;
  @ApiProperty() effectivePrice!: string;
  @ApiProperty() originalPrice!: string;
  @ApiProperty() discountPercent!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() isDiscounted!: boolean;
  @ApiProperty({ required: false }) flashDealId?: string;
}

class GetEffectivePricesResponseDto {
  @ApiProperty({ type: [EffectivePriceResponseDto] })
  prices!: EffectivePriceResponseDto[];
}

@ApiTags('Public - Marketing')
@Controller('public/marketing')
export class PublicMarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('page-config')
  @ApiOperation({ summary: 'Get page configuration for rendering' })
  @ApiQuery({ name: 'pageId', required: false, description: 'Page identifier', example: 'homepage' })
  @ApiResponse({ status: 200, description: 'Page config with sections', type: PageConfigResponseDto })
  async getPageConfig(@Query('pageId') pageId: string = 'homepage'): Promise<PageConfigResponseDto> {
    return this.marketingService.getPageConfig(pageId);
  }

  @Get('flash-deal/active')
  @ApiOperation({ summary: 'Get currently active flash deal by type' })
  @ApiQuery({ name: 'type', required: false, description: 'Display type filter (inline or sticky)', enum: ['inline', 'sticky'] })
  @ApiResponse({ status: 200, description: 'Active flash deal or null', type: FlashDealResponseDto })
  async getActiveFlashDeal(@Query('type') type?: 'inline' | 'sticky'): Promise<FlashDealResponseDto | null> {
    if (type) {
      return this.marketingService.getActiveFlashDealByType(type) as any;
    }
    // Default: return the first active deal (inline preferred for backward compatibility)
    return this.marketingService.getActiveFlashDeal() as any;
  }

  @Get('flash-deals/active')
  @ApiOperation({ summary: 'Get all currently active flash deals' })
  @ApiResponse({ status: 200, description: 'List of active flash deals', type: [FlashDealResponseDto] })
  async getActiveFlashDeals(): Promise<FlashDealResponseDto[]> {
    return this.marketingService.getActiveFlashDeals() as any;
  }

  @Get('bundles')
  @ApiOperation({ summary: 'Get active bundles' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum bundles to return', example: 6 })
  @ApiResponse({ status: 200, description: 'List of active bundles', type: [BundleDealResponseDto] })
  async getActiveBundles(@Query('limit') limit?: string): Promise<BundleDealResponseDto[]> {
    const numLimit = limit ? parseInt(limit, 10) : 6;
    return this.marketingService.getActiveBundles(numLimit) as any;
  }

  @Get('bundles/:slug')
  @ApiOperation({ summary: 'Get bundle by slug' })
  @ApiResponse({ status: 200, description: 'Bundle details', type: BundleDealResponseDto })
  async getBundleBySlug(@Param('slug') slug: string): Promise<BundleDealResponseDto> {
    // For now, we'll get by ID - can add slug lookup later
    return this.marketingService.getBundleById(slug) as any;
  }

  @Post('effective-prices')
  @ApiOperation({ 
    summary: 'Get effective prices for products (with flash deal discounts applied)',
    description: 'Returns the actual price customers will pay, considering any active flash deals. Use this for cart, checkout, and display.',
  })
  @ApiBody({ type: GetEffectivePricesRequestDto })
  @ApiResponse({ status: 200, description: 'Effective prices for requested products', type: GetEffectivePricesResponseDto })
  async getEffectivePrices(@Body() dto: GetEffectivePricesRequestDto): Promise<GetEffectivePricesResponseDto> {
    const pricesMap = await this.marketingService.getEffectivePricesForProducts(
      dto.products.map((p) => ({
        id: p.productId,
        price: p.price,
        currency: p.currency,
      })),
    );

    const prices: EffectivePriceResponseDto[] = [];
    for (const product of dto.products) {
      const pricing = pricesMap.get(product.productId);
      if (pricing) {
        prices.push({
          productId: product.productId,
          effectivePrice: pricing.effectivePrice,
          originalPrice: pricing.originalPrice,
          discountPercent: pricing.discountPercent,
          currency: pricing.currency,
          isDiscounted: pricing.isDiscounted,
          flashDealId: pricing.flashDealId,
        });
      }
    }

    return { prices };
  }

  @Get('effective-price/:productId')
  @ApiOperation({ 
    summary: 'Get effective price for a single product',
    description: 'Returns the actual price a customer will pay, considering any active flash deals.',
  })
  @ApiQuery({ name: 'price', required: true, description: 'Base price of product' })
  @ApiQuery({ name: 'currency', required: false, description: 'Currency code', example: 'EUR' })
  @ApiResponse({ status: 200, description: 'Effective price for product', type: EffectivePriceResponseDto })
  async getEffectivePrice(
    @Param('productId') productId: string,
    @Query('price') price: string,
    @Query('currency') currency?: string,
  ): Promise<EffectivePriceResponseDto> {
    const pricing = await this.marketingService.getEffectivePrice(
      productId,
      price,
      currency ?? 'EUR',
    );

    return {
      productId,
      effectivePrice: pricing.effectivePrice,
      originalPrice: pricing.originalPrice,
      discountPercent: pricing.discountPercent,
      currency: pricing.currency,
      isDiscounted: pricing.isDiscounted,
      flashDealId: pricing.flashDealId,
    };
  }
}
