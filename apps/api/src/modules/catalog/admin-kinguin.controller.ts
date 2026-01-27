/**
 * Admin Kinguin Search & Import Controller
 *
 * Provides endpoints for manually searching Kinguin products
 * and importing them one-by-one into the BitLoot catalog.
 *
 * This is separate from bulk sync operations - it allows admins to:
 * 1. Search Kinguin by product name
 * 2. View search results with full product info
 * 3. Import selected products individually
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { KinguinCatalogClient } from './kinguin-catalog.client';
import { CatalogService } from './catalog.service';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs for Swagger documentation (with @ApiProperty for SDK type generation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single product result from Kinguin search
 */
export class KinguinProductResultDto {
  @ApiProperty({
    description: 'Kinguin product ID (use this for import)',
    example: '5c9b5b4b4f4c4c4c4c4c4c4c',
  })
  productId!: string;

  @ApiProperty({
    description: 'Product name/title',
    example: 'Cyberpunk 2077',
  })
  name!: string;

  @ApiProperty({
    description: 'Original name (if different from localized name)',
    required: false,
    nullable: true,
    example: 'Cyberpunk 2077',
  })
  originalName?: string;

  @ApiProperty({
    description: 'Platform (Steam, Epic, Origin, etc.)',
    required: false,
    nullable: true,
    example: 'Steam',
  })
  platform?: string;

  @ApiProperty({
    description: 'Price in EUR',
    example: 29.99,
  })
  price!: number;

  @ApiProperty({
    description: 'Product region',
    required: false,
    nullable: true,
    example: 'Global',
  })
  region?: string;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
    nullable: true,
    example: 'https://cdn.kinguin.net/media/catalog/product/1234.jpg',
  })
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Metacritic score (0-100)',
    required: false,
    nullable: true,
    example: 86,
  })
  metacriticScore?: number;

  @ApiProperty({
    description: 'Age rating',
    required: false,
    nullable: true,
    example: '18+',
  })
  ageRating?: string;

  @ApiProperty({
    description: 'Whether this product is already in BitLoot catalog',
    example: false,
  })
  alreadyImported!: boolean;
}

/**
 * Response from Kinguin product search
 */
export class KinguinSearchResponseDto {
  @ApiProperty({
    description: 'Search results',
    type: [KinguinProductResultDto],
  })
  results!: KinguinProductResultDto[];

  @ApiProperty({
    description: 'Total count of results',
    example: 42,
  })
  totalCount!: number;

  @ApiProperty({
    description: 'Search query used',
    example: 'Cyberpunk',
  })
  query!: string;
}

/**
 * Response from importing a Kinguin product
 */
export class KinguinImportResponseDto {
  @ApiProperty({
    description: 'Whether import was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Imported product ID in BitLoot catalog',
    example: 'abc123-def456-ghi789',
  })
  productId!: string;

  @ApiProperty({
    description: 'Product title',
    example: 'Cyberpunk 2077',
  })
  title!: string;

  @ApiProperty({
    description: 'Status message',
    example: 'Successfully imported "Cyberpunk 2077" from Kinguin',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether this was a new product or update to existing',
    example: true,
  })
  isNew!: boolean;
}

@Controller('admin/catalog/kinguin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Admin Catalog - Kinguin')
export class AdminKinguinController {
  constructor(
    private readonly kinguinClient: KinguinCatalogClient,
    private readonly catalogService: CatalogService,
  ) {}

  /**
   * GET /admin/catalog/kinguin/search
   * Search Kinguin products by name
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search Kinguin products',
    description:
      'Search the Kinguin catalog by product name. Returns matching products with their details. Use this to find products to import.',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Product name to search for (minimum 3 characters)',
    example: 'Cyberpunk 2077',
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filter by platform',
    example: 'Steam',
  })
  @ApiQuery({
    name: 'genre',
    required: false,
    description: 'Filter by genre',
    example: 'RPG',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum results (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned',
    type: KinguinSearchResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query (min 3 characters)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async searchProducts(
    @Query('query') query: string,
    @Query('platform') platform?: string,
    @Query('genre') genre?: string,
    @Query('limit') limitStr?: string,
    @Query('page') pageStr?: string,
  ): Promise<KinguinSearchResponseDto> {
    // Validate query
    if (query === undefined || query.trim().length < 3) {
      throw new BadRequestException(
        'Search query must be at least 3 characters',
      );
    }

    // Parse pagination
    const parsedLimit = limitStr !== undefined ? parseInt(limitStr, 10) : 20;
    const limit = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    const parsedPage = pageStr !== undefined ? parseInt(pageStr, 10) : 1;
    const page = !Number.isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    // Search Kinguin
    const kinguinResults = await this.kinguinClient.searchProducts(
      query.trim(),
      { platform, genre, limit, page },
    );

    // Get list of already imported products by externalId
    const importedIds = await this.catalogService.getImportedKinguinIds(
      kinguinResults.results.map((p) => p.productId),
    );

    // Transform results
    const results: KinguinProductResultDto[] = kinguinResults.results.map(
      (product) => ({
        productId: product.productId,
        name: product.name,
        originalName: product.originalName,
        platform: product.platform,
        price: product.price,
        region: product.regionalLimitations ?? 'Global',
        coverImageUrl:
          product.images?.cover?.url ?? product.images?.cover?.thumbnail,
        metacriticScore: product.metacriticScore,
        ageRating: product.ageRating,
        alreadyImported: importedIds.has(product.productId),
      }),
    );

    return {
      results,
      totalCount: kinguinResults.item_count,
      query: query.trim(),
    };
  }

  /**
   * POST /admin/catalog/kinguin/import/:productId
   * Import a single Kinguin product into BitLoot catalog
   */
  @Post('import/:productId')
  @ApiOperation({
    summary: 'Import Kinguin product',
    description:
      'Import a specific Kinguin product into the BitLoot catalog. Uses the Kinguin productId from search results.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Kinguin product ID to import',
    example: '5c9b5b4b4f4c4c4c4c4c4c4c',
  })
  @ApiQuery({
    name: 'businessCategory',
    required: false,
    description: 'Business category for the imported product',
    enum: ['games', 'software', 'gift-cards', 'subscriptions'],
  })
  @ApiResponse({
    status: 200,
    description: 'Product imported successfully',
    type: KinguinImportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found on Kinguin' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async importProduct(
    @Param('productId') productId: string,
    @Query('businessCategory') businessCategory?: 'games' | 'software' | 'gift-cards' | 'subscriptions',
  ): Promise<KinguinImportResponseDto> {
    // Validate productId
    if (productId === undefined || productId.trim().length === 0) {
      throw new BadRequestException('Product ID is required');
    }

    // Fetch full product details from Kinguin
    const kinguinProduct = await this.kinguinClient.getProductV2(
      productId.trim(),
    );

    if (kinguinProduct === null) {
      throw new NotFoundException(
        `Product ${productId} not found on Kinguin`,
      );
    }

    // Check if already exists
    const existingProduct = await this.catalogService.findByExternalId(
      productId.trim(),
    );
    const isNew = existingProduct === null;

    // Upsert the product with optional business category override
    const product = await this.catalogService.upsertProduct(kinguinProduct, businessCategory);

    return {
      success: true,
      productId: product.id,
      title: product.title,
      message: isNew
        ? `Successfully imported "${product.title}" from Kinguin`
        : `Successfully updated "${product.title}" from Kinguin`,
      isNew,
    };
  }
}
