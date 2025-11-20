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
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Convert Product entity to response DTO
   */
  private parseNumberField(value: string | number | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.length > 0) {
      return Number.parseInt(value, 10);
    }
    return undefined;
  }

  private toResponseDto(product: Product): AdminProductResponseDto {
    return {
      id: product.id,
      externalId: product.externalId ?? undefined,
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
      costMinor: product.costMinor,
      priceMinor: product.priceMinor,
      price: {
        amount: (product.priceMinor / 100).toFixed(2),
        currency: product.currency,
      },
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
  ): Promise<AdminProductResponseDto[]> {
    try {
      const publishedBool =
        published === 'true' ? true : published === 'false' ? false : undefined;
      const products = await this.catalogService.listAllProductsAdmin(
        search,
        platform,
        region,
        publishedBool,
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
  async create(@Body() dto: CreateProductDto): Promise<AdminProductResponseDto> {
    try {
      const costMinor =
        typeof dto.costMinor === 'string' ? Number.parseInt(dto.costMinor, 10) : dto.costMinor;
      const priceMinor =
        typeof dto.priceMinor === 'string' ? Number.parseInt(dto.priceMinor, 10) : dto.priceMinor;

      const product = await this.catalogService.createCustomProduct({
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        platform: dto.platform,
        region: dto.region,
        drm: dto.drm,
        ageRating: dto.ageRating,
        category: dto.category,
        costMinor: costMinor ?? 0,
        priceMinor: priceMinor ?? 0,
        currency: dto.currency,
        isPublished: dto.isPublished,
      });
      return this.toResponseDto(product);
    } catch (error) {
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
      const costMinor = this.parseNumberField(dto.costMinor);
      const priceMinor = this.parseNumberField(dto.priceMinor);

      const product = await this.catalogService.updateProduct(id, {
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        platform: dto.platform,
        region: dto.region,
        drm: dto.drm,
        ageRating: dto.ageRating,
        category: dto.category,
        costMinor,
        priceMinor,
        currency: dto.currency,
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
