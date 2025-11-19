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
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  AdminPricingRuleResponseDto,
  AdminPricingRulesListResponseDto,
} from './dto/admin-pricing.dto';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';

@ApiTags('Admin - Catalog Pricing')
@Controller('admin/catalog/rules')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminPricingController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Convert DynamicPricingRule entity to response DTO
   */
  private toResponseDto(rule: DynamicPricingRule): AdminPricingRuleResponseDto {
    return {
      id: rule.id,
      productId: rule.productId,
      ruleType: rule.rule_type,
      marginPercent: rule.marginPercent ?? undefined,
      fixedMarkupMinor: rule.fixedMarkupMinor ?? undefined,
      floorMinor: rule.floorMinor ?? undefined,
      capMinor: rule.capMinor ?? undefined,
      priority: rule.priority,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  /**
   * List all pricing rules (admin only)
   * Supports filtering by product ID, rule type, and active status
   */
  @Get()
  @ApiOperation({ summary: 'List all pricing rules (admin only)' })
  @ApiResponse({ status: 200, type: AdminPricingRulesListResponseDto })
  listAll(
    @Query('productId') productId?: string,
    @Query('ruleType')
    ruleType?: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust',
    @Query('isActive') isActive?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): AdminPricingRulesListResponseDto {
    try {
      const pageNum = Math.max(1, Number.parseInt(page, 10) ?? 1);
      const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) ?? 20));

      // Parse isActive filter
      let _isActiveBool: boolean | undefined;
      if (isActive === 'true') {
        _isActiveBool = true;
      } else if (isActive === 'false') {
        _isActiveBool = false;
      }

      // TODO: Implement database query with filters
      // For now, returning empty list structure
      const rules: DynamicPricingRule[] = [];
      const total = 0;

      return {
        data: rules.map((r) => this.toResponseDto(r)),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Failed to fetch pricing rules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get pricing rule by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get pricing rule by ID (admin only)' })
  @ApiResponse({ status: 200, type: AdminPricingRuleResponseDto })
  async getById(@Param('id') id: string): Promise<AdminPricingRuleResponseDto> {
    try {
      const rule = await this.catalogService.getPricingRuleById(id);
      return this.toResponseDto(rule);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Failed to fetch pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create new pricing rule (admin only)
   */
  @Post()
  @ApiOperation({ summary: 'Create new pricing rule (admin only)' })
  @ApiResponse({ status: 201, type: AdminPricingRuleResponseDto })
  async create(
    @Body() dto: CreatePricingRuleDto,
  ): Promise<AdminPricingRuleResponseDto> {
    try {
      const rule = await this.catalogService.createPricingRule({
        productId: dto.productId,
        ruleType: dto.ruleType,
        marginPercent: dto.marginPercent,
        fixedMarkupMinor: dto.fixedMarkupMinor,
        floorMinor: dto.floorMinor,
        capMinor: dto.capMinor,
        priority: dto.priority,
        isActive: dto.isActive,
      });
      return this.toResponseDto(rule);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Failed to create pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update pricing rule (admin only)
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update pricing rule (admin only)' })
  @ApiResponse({ status: 200, type: AdminPricingRuleResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
  ): Promise<AdminPricingRuleResponseDto> {
    try {
      const rule = await this.catalogService.updatePricingRule(id, {
        ruleType: dto.ruleType,
        marginPercent: dto.marginPercent,
        fixedMarkupMinor: dto.fixedMarkupMinor,
        floorMinor: dto.floorMinor,
        capMinor: dto.capMinor,
        priority: dto.priority,
        isActive: dto.isActive,
      });
      return this.toResponseDto(rule);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Failed to update pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete pricing rule (admin only)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete pricing rule (admin only)' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    try {
      await this.catalogService.deletePricingRule(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new HttpException(
        'Failed to delete pricing rule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
