import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { MarketingService } from './marketing.service';
import {
  CreateFlashDealDto,
  UpdateFlashDealDto,
  FlashDealResponseDto,
  CreateBundleDealDto,
  UpdateBundleDealDto,
  BundleDealResponseDto,
  AddFlashDealProductDto,
  UpdateFlashDealProductDto,
  AddBundleProductDto,
  UpdateBundleProductDto,
} from './dto';

interface AuthenticatedRequest extends ExpressRequest {
  user?: { id: string; email: string; role?: string };
}

@ApiTags('Admin - Marketing')
@Controller('admin/marketing')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminMarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ============================================================================
  // FLASH DEALS
  // ============================================================================

  @Get('flash-deals')
  @ApiOperation({ summary: 'Get all flash deals' })
  @ApiResponse({ status: 200, description: 'List of flash deals', type: [FlashDealResponseDto] })
  async getAllFlashDeals(): Promise<FlashDealResponseDto[]> {
    const deals = await this.marketingService.getAllFlashDeals();
    return deals as unknown as FlashDealResponseDto[];
  }

  @Get('flash-deals/:id')
  @ApiOperation({ summary: 'Get flash deal by ID' })
  @ApiResponse({ status: 200, description: 'Flash deal details', type: FlashDealResponseDto })
  async getFlashDeal(@Param('id') id: string): Promise<FlashDealResponseDto> {
    return await this.marketingService.getFlashDealById(id) as unknown as FlashDealResponseDto;
  }

  @Post('flash-deals')
  @ApiOperation({ summary: 'Create new flash deal' })
  @ApiResponse({ status: 201, description: 'Created flash deal', type: FlashDealResponseDto })
  async createFlashDeal(
    @Body() dto: CreateFlashDealDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FlashDealResponseDto> {
    const userId = req.user?.id;
    return await this.marketingService.createFlashDeal(dto, userId) as unknown as FlashDealResponseDto;
  }

  @Patch('flash-deals/:id')
  @ApiOperation({ summary: 'Update flash deal' })
  @ApiResponse({ status: 200, description: 'Updated flash deal', type: FlashDealResponseDto })
  async updateFlashDeal(
    @Param('id') id: string,
    @Body() dto: UpdateFlashDealDto,
  ): Promise<FlashDealResponseDto> {
    return await this.marketingService.updateFlashDeal(id, dto) as unknown as FlashDealResponseDto;
  }

  @Delete('flash-deals/:id')
  @ApiOperation({ summary: 'Delete flash deal' })
  @ApiResponse({ status: 204, description: 'Flash deal deleted' })
  async deleteFlashDeal(@Param('id') id: string): Promise<void> {
    return this.marketingService.deleteFlashDeal(id);
  }

  @Post('flash-deals/:id/activate')
  @ApiOperation({ summary: 'Activate flash deal (deactivates others)' })
  @ApiResponse({ status: 200, description: 'Activated flash deal', type: FlashDealResponseDto })
  async activateFlashDeal(@Param('id') id: string): Promise<FlashDealResponseDto> {
    return await this.marketingService.activateFlashDeal(id) as unknown as FlashDealResponseDto;
  }

  // ============================================================================
  // FLASH DEAL PRODUCTS
  // ============================================================================

  @Post('flash-deals/:id/products')
  @ApiOperation({ summary: 'Add product to flash deal' })
  @ApiResponse({ status: 201, description: 'Product added', type: FlashDealResponseDto })
  async addProductToFlashDeal(
    @Param('id') id: string,
    @Body() dto: AddFlashDealProductDto,
  ): Promise<FlashDealResponseDto> {
    return await this.marketingService.addProductToFlashDeal(
      id,
      dto.productId,
      dto.discountPercent,
      dto.discountPrice,
    ) as unknown as FlashDealResponseDto;
  }

  @Patch('flash-deals/:id/products/:productId')
  @ApiOperation({ summary: 'Update product in flash deal' })
  @ApiResponse({ status: 200, description: 'Product updated', type: FlashDealResponseDto })
  async updateFlashDealProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateFlashDealProductDto,
  ): Promise<FlashDealResponseDto> {
    return await this.marketingService.updateFlashDealProduct(
      id,
      productId,
      dto.discountPercent,
      dto.discountPrice,
    ) as unknown as FlashDealResponseDto;
  }

  @Delete('flash-deals/:id/products/:productId')
  @ApiOperation({ summary: 'Remove product from flash deal' })
  @ApiResponse({ status: 200, description: 'Product removed', type: FlashDealResponseDto })
  async removeProductFromFlashDeal(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<FlashDealResponseDto> {
    return await this.marketingService.removeProductFromFlashDeal(id, productId) as unknown as FlashDealResponseDto;
  }

  // ============================================================================
  // BUNDLES
  // ============================================================================

  @Get('bundles')
  @ApiOperation({ summary: 'Get all bundle deals' })
  @ApiResponse({ status: 200, description: 'List of bundles', type: [BundleDealResponseDto] })
  async getAllBundles(): Promise<BundleDealResponseDto[]> {
    const bundles = await this.marketingService.getAllBundles();
    return bundles as unknown as BundleDealResponseDto[];
  }

  @Get('bundles/:id')
  @ApiOperation({ summary: 'Get bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle details', type: BundleDealResponseDto })
  async getBundle(@Param('id') id: string): Promise<BundleDealResponseDto> {
    return await this.marketingService.getBundleById(id) as unknown as BundleDealResponseDto;
  }

  @Post('bundles')
  @ApiOperation({ summary: 'Create new bundle deal' })
  @ApiResponse({ status: 201, description: 'Created bundle', type: BundleDealResponseDto })
  async createBundle(
    @Body() dto: CreateBundleDealDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BundleDealResponseDto> {
    const userId = req.user?.id;
    return await this.marketingService.createBundle(dto, userId) as unknown as BundleDealResponseDto;
  }

  @Patch('bundles/:id')
  @ApiOperation({ summary: 'Update bundle' })
  @ApiResponse({ status: 200, description: 'Updated bundle', type: BundleDealResponseDto })
  async updateBundle(
    @Param('id') id: string,
    @Body() dto: UpdateBundleDealDto,
  ): Promise<BundleDealResponseDto> {
    return await this.marketingService.updateBundle(id, dto) as unknown as BundleDealResponseDto;
  }

  @Delete('bundles/:id')
  @ApiOperation({ summary: 'Delete bundle' })
  @ApiResponse({ status: 204, description: 'Bundle deleted' })
  async deleteBundle(@Param('id') id: string): Promise<void> {
    return this.marketingService.deleteBundle(id);
  }

  // ============================================================================
  // BUNDLE PRODUCTS
  // ============================================================================

  @Post('bundles/:id/products')
  @ApiOperation({ summary: 'Add product to bundle with discount percentage' })
  @ApiResponse({ status: 201, description: 'Product added', type: BundleDealResponseDto })
  async addProductToBundle(
    @Param('id') id: string,
    @Body() dto: AddBundleProductDto,
  ): Promise<BundleDealResponseDto> {
    return await this.marketingService.addProductToBundle(
      id,
      dto.productId,
      dto.discountPercent,
      dto.displayOrder,
      dto.isBonus,
    ) as unknown as BundleDealResponseDto;
  }

  @Patch('bundles/:id/products/:productId')
  @ApiOperation({ summary: 'Update product discount or order in bundle' })
  @ApiResponse({ status: 200, description: 'Product updated', type: BundleDealResponseDto })
  async updateBundleProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBundleProductDto,
  ): Promise<BundleDealResponseDto> {
    return await this.marketingService.updateBundleProduct(
      id,
      productId,
      dto.discountPercent,
      dto.displayOrder,
      dto.isBonus,
    ) as unknown as BundleDealResponseDto;
  }

  @Delete('bundles/:id/products/:productId')
  @ApiOperation({ summary: 'Remove product from bundle' })
  @ApiResponse({ status: 200, description: 'Product removed', type: BundleDealResponseDto })
  async removeProductFromBundle(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<BundleDealResponseDto> {
    return await this.marketingService.removeProductFromBundle(id, productId) as unknown as BundleDealResponseDto;
  }
}
