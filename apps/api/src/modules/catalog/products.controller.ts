import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Product } from './entities/product.entity';
import { ProductResponseDto, ProductListResponseDto } from './dto/product.dto';
import { CategoriesResponseDto, FiltersResponseDto } from './dto/category-filters.dto';

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
    businessCategory: product.businessCategory ?? 'games',
    isFeatured: product.isFeatured ?? false,
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

  @Get('categories')
  @ApiOperation({
    summary: 'Get dynamic categories with counts',
    description:
      'Returns all available categories (genres, platforms, collections) dynamically aggregated from published products. Also includes featured/virtual categories for special sorts.',
  })
  @ApiResponse({
    status: 200,
    type: CategoriesResponseDto,
    description: 'Categories with product counts and featured collections',
  })
  async getCategories(): Promise<CategoriesResponseDto> {
    return this.catalogService.getCategories();
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Get available filter options',
    description:
      'Returns all available filter options (platforms, regions, genres) with counts, plus price range. Used for building dynamic filter UI.',
  })
  @ApiResponse({
    status: 200,
    type: FiltersResponseDto,
    description: 'Filter options with counts and price range',
  })
  async getFilters(): Promise<FiltersResponseDto> {
    return this.catalogService.getFilters();
  }

  @Get('products')
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query (full-text)' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform (Steam, Epic, etc)' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region (US, EU, etc)' })
  @ApiQuery({ name: 'businessCategory', required: false, description: 'Filter by BitLoot category: games, software, subscriptions' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by genre (legacy Kinguin genres)' })
  @ApiQuery({ name: 'featured', required: false, type: 'boolean', description: 'Show only featured products' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number', description: 'Minimum price filter (EUR)' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number', description: 'Maximum price filter (EUR)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'price_asc', 'price_desc', 'rating'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (≤ 100)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination offset' })
  @ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Paginated product list' })
  async listProducts(
    @Query('q') q?: string,
    @Query('platform') platform?: string,
    @Query('region') region?: string,
    @Query('businessCategory') businessCategory?: string,
    @Query('category') category?: string,
    @Query('featured') featuredParam?: string,
    @Query('minPrice') minPriceParam?: string,
    @Query('maxPrice') maxPriceParam?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating',
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ): Promise<ProductListResponseDto> {
    // Ensure limit and offset are valid numbers with defaults
    const limit = limitParam !== undefined && limitParam !== '' ? parseInt(limitParam, 10) : 24;
    const offset = offsetParam !== undefined && offsetParam !== '' ? parseInt(offsetParam, 10) : 0;
    const safeLimit = Number.isNaN(limit) ? 24 : limit;
    const safeOffset = Number.isNaN(offset) ? 0 : offset;
    const featured = featuredParam === 'true' || featuredParam === '1';
    const minPrice = minPriceParam !== undefined && minPriceParam !== '' ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam !== undefined && maxPriceParam !== '' ? parseFloat(maxPriceParam) : undefined;
    
    try {
      // Log: listProducts called with: q, platform, region, businessCategory, category, sort, limit, offset
      
      const result = await this.catalogService.listProducts(safeLimit, safeOffset, {
        q,
        platform,
        region,
        businessCategory,
        category,
        featured,
        minPrice,
        maxPrice,
        sort,
      });
      
      // Log: listProducts result count and total

      // Map entities to DTOs
      const mappedData = result.data.map((product, index) => {
        try {
          return toProductResponseDto(product);
        } catch (err) {
          console.error(`[CatalogController] Error mapping product ${index} (${product.id}):`, err);
          throw err;
        }
      });

      return {
        data: mappedData,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: result.pages,
      };
    } catch (error) {
      console.error('[CatalogController] listProducts error:', error);
      throw error;
    }
  }

  @Get('products/featured')
  @ApiOperation({
    summary: 'Get featured products',
    description: 'Returns products marked as featured (isFeatured=true), sorted by featured order. Use for homepage featured section.',
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Max products to return (default 8, max 24)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Featured products list' })
  async getFeaturedProducts(
    @Query('limit') limitParam?: string,
  ): Promise<ProductListResponseDto> {
    const limit = limitParam !== undefined && limitParam !== '' ? parseInt(limitParam, 10) : 8;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 8 : Math.min(limit, 24);
    
    const result = await this.catalogService.listProducts(safeLimit, 0, {
      featured: true,
    });
    
    return {
      data: result.data.map(toProductResponseDto),
      total: result.total,
      limit: safeLimit,
      offset: 0,
      pages: Math.ceil(result.total / safeLimit),
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

  @Get('sections/:sectionKey')
  @ApiOperation({
    summary: 'Get products for a homepage section',
    description: 'Returns products assigned to a specific homepage section (trending, featured_games, etc.)',
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Max products to return (default 12)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto, description: 'Products in section' })
  async getProductsBySection(
    @Param('sectionKey') sectionKey: string,
    @Query('limit') limitParam?: string,
  ): Promise<ProductListResponseDto> {
    const limit = limitParam !== undefined && limitParam !== '' ? parseInt(limitParam, 10) : 12;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 12 : Math.min(limit, 50);
    
    const result = await this.catalogService.getProductsBySection(sectionKey, safeLimit);
    
    return {
      data: result.data.map(toProductResponseDto),
      total: result.total,
      limit: safeLimit,
      offset: 0,
      pages: 1,
    };
  }
}
