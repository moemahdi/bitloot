import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Product } from './entities/product.entity';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query (full-text)' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform (Steam, Epic, etc)' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region (US, EU, etc)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'price_asc', 'price_desc', 'rating'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (≤ 100)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination offset' })
  @ApiResponse({ status: 200, type: Object, description: 'Paginated product list' })
  async listProducts(
    @Query('q') q?: string,
    @Query('platform') platform?: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating',
    @Query('limit') limit: number = 24,
    @Query('offset') offset: number = 0,
  ): Promise<{ data: Product[]; total: number; limit: number; offset: number; pages: number }> {
    const result = await this.catalogService.listProducts(limit, offset, {
      q,
      platform,
      region,
      category,
      sort,
    });

    return result;
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get single product by slug' })
  @ApiResponse({ status: 200, type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('slug') slug: string): Promise<Product | null> {
    return this.catalogService.getProductBySlug(slug);
  }
}
