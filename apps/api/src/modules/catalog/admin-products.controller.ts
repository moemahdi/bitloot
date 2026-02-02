import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CatalogService } from './catalog.service';
import { AdminOpsService } from '../admin/admin-ops.service';
import {
  CreateProductDto,
  UpdateProductDto,
  AdminProductResponseDto,
  AdminProductsListResponseDto,
  BulkDeleteProductsDto,
  BulkDeleteResponseDto,
  BulkRepriceProductsDto,
  BulkRepriceResponseDto,
  BulkPublishProductsDto,
  BulkPublishResponseDto,
  BulkUnpublishProductsDto,
  BulkUnpublishResponseDto,
} from './dto/admin-product.dto';
import { Product } from './entities/product.entity';

@ApiTags('Admin - Catalog Products')
@Controller('admin/catalog/products')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminProductsController {
  constructor(
    private readonly catalogService: CatalogService,
    @Inject(forwardRef(() => AdminOpsService))
    private readonly adminOpsService: AdminOpsService,
  ) { }

  /**
   * Convert Product entity to response DTO
   */
  private parseNumberField(value: string | number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.length > 0) {
      return Number.parseFloat(value);
    }
    return undefined;
  }

  private toResponseDto(product: Product): AdminProductResponseDto {
    return {
      // Core identifiers
      id: product.id,
      externalId: product.externalId ?? undefined,
      sourceType: product.sourceType ?? 'custom',
      kinguinOfferId: product.kinguinOfferId ?? undefined,
      slug: product.slug,
      
      // Basic product info
      title: product.title,
      name: product.title,
      originalName: product.originalName ?? undefined,
      subtitle: product.subtitle ?? undefined,
      description: product.description ?? undefined,
      
      // Categorization
      platform: product.platform ?? undefined,
      region: product.region ?? undefined,
      drm: product.drm ?? undefined,
      ageRating: product.ageRating ?? undefined,
      category: product.category ?? undefined,
      
      // Kinguin identifiers
      kinguinId: product.kinguinId ?? undefined,
      kinguinProductId: product.kinguinProductId ?? undefined,
      
      // Product metadata
      developers: product.developers ?? undefined,
      publishers: product.publishers ?? undefined,
      genres: product.genres ?? undefined,
      releaseDate: product.releaseDate ?? undefined,
      tags: product.tags ?? undefined,
      
      // Inventory/stock info
      qty: product.qty ?? undefined,
      textQty: product.textQty ?? undefined,
      offersCount: product.offersCount ?? undefined,
      totalQty: product.totalQty ?? undefined,
      isPreorder: product.isPreorder ?? false,
      
      // Ratings and reviews
      metacriticScore: product.metacriticScore ?? undefined,
      rating: product.rating ?? undefined,
      
      // Regional restrictions
      regionalLimitations: product.regionalLimitations ?? undefined,
      countryLimitation: product.countryLimitation ?? undefined,
      regionId: product.regionId ?? undefined,
      
      // Activation and fulfillment
      activationDetails: product.activationDetails ?? undefined,
      merchantName: product.merchantName ?? undefined,
      cheapestOfferId: product.cheapestOfferId ?? undefined,
      
      // Media
      coverImageUrl: product.coverImageUrl ?? undefined,
      coverThumbnailUrl: product.coverThumbnailUrl ?? undefined,
      screenshots: product.screenshots ?? undefined,
      videos: product.videos ?? undefined,
      
      // Technical info
      languages: product.languages ?? undefined,
      systemRequirements: product.systemRequirements ?? undefined,
      steam: product.steam ?? undefined,

      // Pricing
      cost: product.cost,
      price: product.price,
      currency: product.currency,
      
      // Status
      isPublished: product.isPublished,
      isCustom: product.isCustom,
      
      // Business category and featured
      businessCategory: product.businessCategory ?? 'games',
      isFeatured: product.isFeatured ?? false,
      
      // Homepage sections
      featuredSections: product.featuredSections ?? undefined,
      featuredOrder: product.featuredOrder ?? 0,
      
      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination (admin)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by title' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'published', required: false, description: 'Filter by published status (true/false)' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source (kinguin/custom)' })
  @ApiQuery({ name: 'businessCategory', required: false, description: 'Filter by business category (games/software/subscriptions)' })
  @ApiQuery({ name: 'genre', required: false, description: 'Filter by genre (e.g., Action, RPG, Strategy)' })
  @ApiQuery({ name: 'featured', required: false, description: 'Filter by featured status (true/false)' })
  @ApiQuery({ name: 'section', required: false, description: 'Filter by featured section key (e.g., trending, featured_games)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 500)', example: 25 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field', enum: ['createdAt', 'title', 'cost', 'price'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    type: AdminProductsListResponseDto,
    description: 'Paginated products list with total count',
  })
  async listAll(
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('region') region?: string,
    @Query('published') published?: string,
    @Query('source') source?: string,
    @Query('businessCategory') businessCategory?: string,
    @Query('genre') genre?: string,
    @Query('featured') featured?: string,
    @Query('section') section?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'title' | 'cost' | 'price',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<AdminProductsListResponseDto> {
    try {
      const publishedBool =
        published === 'true' ? true : published === 'false' ? false : undefined;
      const featuredBool =
        featured === 'true' ? true : featured === 'false' ? false : undefined;
      
      // Parse pagination params with defaults
      const parsedPage = parseInt(pageStr ?? '1', 10);
      const page = isNaN(parsedPage) ? 1 : parsedPage;
      const parsedLimit = parseInt(limitStr ?? '25', 10);
      const limit = isNaN(parsedLimit) ? 25 : parsedLimit;

      const result = await this.catalogService.listAllProductsAdmin(
        search,
        platform,
        region,
        publishedBool,
        source,
        page,
        limit,
        businessCategory,
        featuredBool,
        genre,
        sortBy,
        sortOrder,
        section,
      );

      return {
        products: result.products.map((p: Product) => this.toResponseDto(p)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all unique genres from products' })
  @ApiResponse({ status: 200, type: [String], description: 'List of unique genre names' })
  async getGenres(): Promise<string[]> {
    try {
      return await this.catalogService.getDistinctGenres();
    } catch (error) {
      throw new HttpException(
        `Failed to get genres: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (admin)' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string): Promise<AdminProductResponseDto> {
    try {
      const product: Product | null = await this.catalogService.getProductById(id);
      if (product === null) {
        throw new NotFoundException(`Product not found: ${id}`);
      }
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create custom product' })
  @ApiResponse({ status: 201, type: AdminProductResponseDto })
  @ApiResponse({ status: 403, description: 'Feature disabled' })
  async create(@Body() dto: CreateProductDto): Promise<AdminProductResponseDto> {
    try {
      // Check feature flags based on source type
      if (dto.sourceType === 'kinguin' && !this.adminOpsService.isEnabled('kinguin_enabled')) {
        throw new ForbiddenException('Kinguin integration is currently disabled');
      }
      if (dto.sourceType === 'custom' && !this.adminOpsService.isEnabled('custom_products_enabled')) {
        throw new ForbiddenException('Custom products feature is currently disabled');
      }

      const product = await this.catalogService.createCustomProduct({
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        platform: dto.platform,
        region: dto.region,
        drm: dto.drm,
        ageRating: dto.ageRating,
        category: dto.category,
        cost: dto.cost,
        price: dto.price,
        currency: dto.currency,
        isPublished: dto.isPublished,
        sourceType: dto.sourceType,
        kinguinOfferId: dto.kinguinOfferId,
      });
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new HttpException(
        `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product details' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProductResponseDto> {
    try {
      const product = await this.catalogService.updateProduct(id, {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        platform: dto.platform,
        region: dto.region,
        drm: dto.drm,
        ageRating: dto.ageRating,
        category: dto.category,
        businessCategory: dto.businessCategory,
        cost: dto.cost,
        price: dto.price,
        currency: dto.currency,
        sourceType: dto.sourceType,
        kinguinOfferId: dto.kinguinOfferId,
        featuredSections: dto.featuredSections,
        featuredOrder: dto.featuredOrder,
      });
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async delete(@Param('id') id: string): Promise<void> {
    try {
      await this.catalogService.deleteProduct(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete products' })
  @ApiResponse({ status: 200, type: BulkDeleteResponseDto, description: 'Products deleted' })
  async bulkDelete(@Body() dto: BulkDeleteProductsDto): Promise<BulkDeleteResponseDto> {
    try {
      const result = await this.catalogService.deleteProducts(dto.ids);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk delete products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish product (set isPublished=true)' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async publish(@Param('id') id: string): Promise<AdminProductResponseDto> {
    try {
      const product = await this.catalogService.publishProduct(id);
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to publish product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish product (set isPublished=false)' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async unpublish(@Param('id') id: string): Promise<AdminProductResponseDto> {
    try {
      const product = await this.catalogService.unpublishProduct(id);
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to unpublish product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/reprice')
  @ApiOperation({ summary: 'Reprice a single product based on current pricing rules' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async reprice(@Param('id') id: string): Promise<AdminProductResponseDto> {
    try {
      const product = await this.catalogService.repriceProduct(id);
      return this.toResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        `Failed to reprice product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-reprice')
  @ApiOperation({ summary: 'Bulk reprice products based on current pricing rules' })
  @ApiResponse({ status: 200, type: BulkRepriceResponseDto, description: 'Products repriced' })
  async bulkReprice(@Body() dto: BulkRepriceProductsDto): Promise<BulkRepriceResponseDto> {
    try {
      const result = await this.catalogService.repriceProducts(dto.ids);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk reprice products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-publish')
  @ApiOperation({ summary: 'Bulk publish products (set isPublished=true)' })
  @ApiResponse({ status: 200, type: BulkPublishResponseDto, description: 'Products published' })
  async bulkPublish(@Body() dto: BulkPublishProductsDto): Promise<BulkPublishResponseDto> {
    try {
      const result = await this.catalogService.bulkPublishProducts(dto.ids);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk publish products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-unpublish')
  @ApiOperation({ summary: 'Bulk unpublish products (set isPublished=false)' })
  @ApiResponse({ status: 200, type: BulkUnpublishResponseDto, description: 'Products unpublished' })
  async bulkUnpublish(@Body() dto: BulkUnpublishProductsDto): Promise<BulkUnpublishResponseDto> {
    try {
      const result = await this.catalogService.bulkUnpublishProducts(dto.ids);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk unpublish products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/feature')
  @ApiOperation({ summary: 'Mark product as featured' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto, description: 'Product marked as featured' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async feature(@Param('id') id: string): Promise<AdminProductResponseDto> {
    const product = await this.catalogService.setFeatured(id, true);
    if (product == null) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.toResponseDto(product);
  }

  @Patch(':id/unfeature')
  @ApiOperation({ summary: 'Remove product from featured' })
  @ApiResponse({ status: 200, type: AdminProductResponseDto, description: 'Product removed from featured' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async unfeature(@Param('id') id: string): Promise<AdminProductResponseDto> {
    const product = await this.catalogService.setFeatured(id, false);
    if (product == null) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.toResponseDto(product);
  }

  @Post('bulk-feature')
  @ApiOperation({ summary: 'Bulk feature products (set isFeatured=true)' })
  @ApiResponse({ status: 200, type: BulkPublishResponseDto, description: 'Products featured' })
  async bulkFeature(@Body() dto: BulkPublishProductsDto): Promise<BulkPublishResponseDto> {
    try {
      const result = await this.catalogService.bulkSetFeatured(dto.ids, true);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk feature products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-unfeature')
  @ApiOperation({ summary: 'Bulk unfeature products (set isFeatured=false)' })
  @ApiResponse({ status: 200, type: BulkPublishResponseDto, description: 'Products unfeatured' })
  async bulkUnfeature(@Body() dto: BulkPublishProductsDto): Promise<BulkPublishResponseDto> {
    try {
      const result = await this.catalogService.bulkSetFeatured(dto.ids, false);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to bulk unfeature products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
