import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Product } from './entities/product.entity';
import { ProductResponseDto, ProductListResponseDto } from './dto/product.dto';

/**
 * Parse JSON array field safely (handles JSONB columns that may be null, empty, or arrays)
 */
function parseJsonArray<T>(value: unknown): T[] | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Map Product entity to ProductResponseDto for API response
 * Includes all Kinguin extended fields for rich product display
 */
function toProductResponseDto(product: Product): ProductResponseDto {
  return {
    // Basic fields
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

    // Kinguin extended fields
    developers: parseJsonArray<string>(product.developers),
    publishers: parseJsonArray<string>(product.publishers),
    genres: parseJsonArray<string>(product.genres),
    releaseDate: product.releaseDate ?? undefined,
    metacriticScore: product.metacriticScore ?? undefined,
    regionalLimitations: product.regionalLimitations ?? undefined,
    activationDetails: product.activationDetails ?? undefined,
    videos: parseJsonArray<{ video_id: string }>(product.videos),
    languages: parseJsonArray<string>(product.languages),
    systemRequirements: parseJsonArray<{ system: string; requirement: string[] }>(
      product.systemRequirements,
    ),
    tags: parseJsonArray<string>(product.tags),
    steam: product.steam ?? undefined,
    screenshots: parseJsonArray<{ url: string; thumbnail: string }>(product.screenshots),
    isPreorder: product.isPreorder ?? undefined,
    rating: product.rating ?? undefined,
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
