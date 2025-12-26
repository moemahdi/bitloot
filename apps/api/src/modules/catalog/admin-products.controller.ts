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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
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
} from './dto/admin-product.dto';
import { Product } from './entities/product.entity';

@ApiTags('Admin - Catalog Products')
@Controller('admin/catalog/products')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminProductsController {
  constructor(
    private readonly catalogService: CatalogService,
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
      id: product.id,
      externalId: product.externalId ?? undefined,
      sourceType: product.sourceType ?? 'custom',
      kinguinOfferId: product.kinguinOfferId ?? undefined,
      slug: product.slug,
      title: product.title,
      name: product.title,
      subtitle: product.subtitle ?? undefined,
      description: product.description ?? undefined,
      platform: product.platform ?? undefined,
      region: product.region ?? undefined,
      drm: product.drm ?? undefined,
      ageRating: product.ageRating ?? undefined,
      category: product.category ?? undefined,

      cost: product.cost,
      price: product.price,
      currency: product.currency,
      isPublished: product.isPublished,
      isCustom: product.isCustom,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all products (admin - no pagination limit)' })
  @ApiResponse({
    status: 200,
    type: [AdminProductResponseDto],
    description: 'All products regardless of publish status',
  })
  async listAll(
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('region') region?: string,
    @Query('published') published?: string,
    @Query('source') source?: string,
  ): Promise<AdminProductResponseDto[]> {
    try {
      const publishedBool =
        published === 'true' ? true : published === 'false' ? false : undefined;
      const products = await this.catalogService.listAllProductsAdmin(
        search,
        platform,
        region,
        publishedBool,
        source,
      );
      return products.map((p: Product) => this.toResponseDto(p));
    } catch (error) {
      throw new HttpException(
        `Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        cost: dto.cost,
        price: dto.price,
        currency: dto.currency,
        sourceType: dto.sourceType,
        kinguinOfferId: dto.kinguinOfferId,
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
}
