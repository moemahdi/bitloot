import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Product } from './entities/product.entity';
import { ProductResponseDto, ProductListResponseDto } from './dto/product.dto';

/**
 * Map Product entity to ProductResponseDto for API response
 * Ensures consistent field naming (entity uses coverImageUrl, DTO uses imageUrl)
 */
function toProductResponseDto(product: Product): ProductResponseDto {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    platform: product.platform,
    region: product.region,
    drm: product.drm,
    ageRating: product.ageRating,
    category: product.category,
    price: product.price,
    currency: product.currency,
    isPublished: product.isPublished,
    imageUrl: product.coverImageUrl, // Map coverImageUrl → imageUrl
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

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
  @ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Paginated product list' })
  async listProducts(
    @Query('q') q?: string,
    @Query('platform') platform?: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating',
    @Query('limit') limit: number = 24,
    @Query('offset') offset: number = 0,
  ): Promise<ProductListResponseDto> {
    const result = await this.catalogService.listProducts(limit, offset, {
      q,
      platform,
      region,
      category,
      sort,
    });

    // Map entities to DTOs
    return {
      data: result.data.map(toProductResponseDto),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      pages: result.pages,
    };
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get single product by slug' })
  @ApiResponse({ status: 200, type: ProductResponseDto, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('slug') slug: string): Promise<ProductResponseDto> {
    const product = await this.catalogService.getProductBySlug(slug);
    if (product === null) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }
    return toProductResponseDto(product);
  }
}
