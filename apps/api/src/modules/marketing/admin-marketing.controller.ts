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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { MarketingService } from './marketing.service';
import {
  UpdateSectionDto,
  ReorderSectionsDto,
  SectionResponseDto,
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

@ApiTags('Admin - Marketing')
@Controller('admin/marketing')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminMarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ============================================================================
  // SECTIONS
  // ============================================================================

  @Get('sections')
  @ApiOperation({ summary: 'Get all page sections' })
  @ApiResponse({ status: 200, description: 'List of all sections', type: [SectionResponseDto] })
  async getAllSections(): Promise<SectionResponseDto[]> {
    return this.marketingService.getAllSections();
  }

  @Get('sections/:sectionKey')
  @ApiOperation({ summary: 'Get section by key' })
  @ApiResponse({ status: 200, description: 'Section details', type: SectionResponseDto })
  async getSection(@Param('sectionKey') sectionKey: string): Promise<SectionResponseDto> {
    return this.marketingService.getSectionByKey(sectionKey);
  }

  @Patch('sections/:sectionKey')
  @ApiOperation({ summary: 'Update section configuration' })
  @ApiResponse({ status: 200, description: 'Updated section', type: SectionResponseDto })
  async updateSection(
    @Param('sectionKey') sectionKey: string,
    @Body() dto: UpdateSectionDto,
    @Req() req: any,
  ): Promise<SectionResponseDto> {
    const userId = req.user?.id;
    return this.marketingService.updateSection(sectionKey, dto, userId);
  }

  @Patch('sections/reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  @ApiResponse({ status: 200, description: 'Reordered sections', type: [SectionResponseDto] })
  async reorderSections(@Body() dto: ReorderSectionsDto): Promise<SectionResponseDto[]> {
    return this.marketingService.reorderSections(dto.order);
  }

  // ============================================================================
  // FLASH DEALS
  // ============================================================================

  @Get('flash-deals')
  @ApiOperation({ summary: 'Get all flash deals' })
  @ApiResponse({ status: 200, description: 'List of flash deals', type: [FlashDealResponseDto] })
  async getAllFlashDeals(): Promise<FlashDealResponseDto[]> {
    const deals = await this.marketingService.getAllFlashDeals();
    return deals as any;
  }

  @Get('flash-deals/:id')
  @ApiOperation({ summary: 'Get flash deal by ID' })
  @ApiResponse({ status: 200, description: 'Flash deal details', type: FlashDealResponseDto })
  async getFlashDeal(@Param('id') id: string): Promise<FlashDealResponseDto> {
    return this.marketingService.getFlashDealById(id) as any;
  }

  @Post('flash-deals')
  @ApiOperation({ summary: 'Create new flash deal' })
  @ApiResponse({ status: 201, description: 'Created flash deal', type: FlashDealResponseDto })
  async createFlashDeal(
    @Body() dto: CreateFlashDealDto,
    @Req() req: any,
  ): Promise<FlashDealResponseDto> {
    const userId = req.user?.id;
    return this.marketingService.createFlashDeal(dto, userId) as any;
  }

  @Patch('flash-deals/:id')
  @ApiOperation({ summary: 'Update flash deal' })
  @ApiResponse({ status: 200, description: 'Updated flash deal', type: FlashDealResponseDto })
  async updateFlashDeal(
    @Param('id') id: string,
    @Body() dto: UpdateFlashDealDto,
  ): Promise<FlashDealResponseDto> {
    return this.marketingService.updateFlashDeal(id, dto) as any;
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
    return this.marketingService.activateFlashDeal(id) as any;
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
    return this.marketingService.addProductToFlashDeal(
      id,
      dto.productId,
      dto.discountPercent,
      dto.discountPrice,
    ) as any;
  }

  @Patch('flash-deals/:id/products/:productId')
  @ApiOperation({ summary: 'Update product in flash deal' })
  @ApiResponse({ status: 200, description: 'Product updated', type: FlashDealResponseDto })
  async updateFlashDealProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateFlashDealProductDto,
  ): Promise<FlashDealResponseDto> {
    return this.marketingService.updateFlashDealProduct(
      id,
      productId,
      dto.discountPercent,
      dto.discountPrice,
    ) as any;
  }

  @Delete('flash-deals/:id/products/:productId')
  @ApiOperation({ summary: 'Remove product from flash deal' })
  @ApiResponse({ status: 200, description: 'Product removed', type: FlashDealResponseDto })
  async removeProductFromFlashDeal(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<FlashDealResponseDto> {
    return this.marketingService.removeProductFromFlashDeal(id, productId) as any;
  }

  // ============================================================================
  // BUNDLES
  // ============================================================================

  @Get('bundles')
  @ApiOperation({ summary: 'Get all bundle deals' })
  @ApiResponse({ status: 200, description: 'List of bundles', type: [BundleDealResponseDto] })
  async getAllBundles(): Promise<BundleDealResponseDto[]> {
    const bundles = await this.marketingService.getAllBundles();
    return bundles as any;
  }

  @Get('bundles/:id')
  @ApiOperation({ summary: 'Get bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle details', type: BundleDealResponseDto })
  async getBundle(@Param('id') id: string): Promise<BundleDealResponseDto> {
    return this.marketingService.getBundleById(id) as any;
  }

  @Post('bundles')
  @ApiOperation({ summary: 'Create new bundle deal' })
  @ApiResponse({ status: 201, description: 'Created bundle', type: BundleDealResponseDto })
  async createBundle(
    @Body() dto: CreateBundleDealDto,
    @Req() req: any,
  ): Promise<BundleDealResponseDto> {
    const userId = req.user?.id;
    return this.marketingService.createBundle(dto, userId) as any;
  }

  @Patch('bundles/:id')
  @ApiOperation({ summary: 'Update bundle' })
  @ApiResponse({ status: 200, description: 'Updated bundle', type: BundleDealResponseDto })
  async updateBundle(
    @Param('id') id: string,
    @Body() dto: UpdateBundleDealDto,
  ): Promise<BundleDealResponseDto> {
    return this.marketingService.updateBundle(id, dto) as any;
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
    return this.marketingService.addProductToBundle(
      id,
      dto.productId,
      dto.discountPercent,
      dto.displayOrder,
      dto.isBonus,
    ) as any;
  }

  @Patch('bundles/:id/products/:productId')
  @ApiOperation({ summary: 'Update product discount or order in bundle' })
  @ApiResponse({ status: 200, description: 'Product updated', type: BundleDealResponseDto })
  async updateBundleProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBundleProductDto,
  ): Promise<BundleDealResponseDto> {
    return this.marketingService.updateBundleProduct(
      id,
      productId,
      dto.discountPercent,
      dto.displayOrder,
      dto.isBonus,
    ) as any;
  }

  @Delete('bundles/:id/products/:productId')
  @ApiOperation({ summary: 'Remove product from bundle' })
  @ApiResponse({ status: 200, description: 'Product removed', type: BundleDealResponseDto })
  async removeProductFromBundle(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<BundleDealResponseDto> {
    return this.marketingService.removeProductFromBundle(id, productId) as any;
  }
}
