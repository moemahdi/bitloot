import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PromosService } from './promos.service';
import {
    ValidatePromoDto,
    ValidatePromoResponseDto,
    CreatePromoCodeDto,
    UpdatePromoCodeDto,
    PromoCodeResponseDto,
    PaginatedPromoCodesDto,
    PaginatedRedemptionsDto,
    PromoCodeQueryDto,
    RedemptionQueryDto,
} from './dto/promo.dto';

@ApiTags('promos')
@Controller('promos')
export class PromosController {
    constructor(private readonly promosService: PromosService) { }

    // ==================== PUBLIC ENDPOINTS ====================

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate a promo code for checkout' })
    @ApiResponse({ status: 200, type: ValidatePromoResponseDto })
    async validate(@Body() dto: ValidatePromoDto): Promise<ValidatePromoResponseDto> {
        return this.promosService.validateCode(dto);
    }
}

// ==================== ADMIN ENDPOINTS ====================

@ApiTags('admin-promos')
@Controller('admin/promos')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminPromosController {
    constructor(private readonly promosService: PromosService) { }

    @Get()
    @ApiOperation({ summary: 'List all promo codes (admin)' })
    @ApiResponse({ status: 200, type: PaginatedPromoCodesDto })
    async list(@Query() query: PromoCodeQueryDto): Promise<PaginatedPromoCodesDto> {
        const { data, total } = await this.promosService.findAll({
            page: query.page,
            limit: query.limit,
            isActive: query.isActive,
            search: query.search,
            scopeType: query.scopeType,
        });

        const limit = query.limit ?? 20;
        const page = query.page ?? 1;

        return {
            data: data.map((p) => this.promosService.toResponseDto(p)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get promo code by ID (admin)' })
    @ApiResponse({ status: 200, type: PromoCodeResponseDto })
    @ApiResponse({ status: 404, description: 'Promo code not found' })
    async getOne(@Param('id') id: string): Promise<PromoCodeResponseDto> {
        const promo = await this.promosService.findOneOrThrow(id);
        return this.promosService.toResponseDto(promo);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new promo code (admin)' })
    @ApiResponse({ status: 201, type: PromoCodeResponseDto })
    @ApiResponse({ status: 409, description: 'Promo code already exists' })
    async create(@Body() dto: CreatePromoCodeDto): Promise<PromoCodeResponseDto> {
        const promo = await this.promosService.create(dto);
        return this.promosService.toResponseDto(promo);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a promo code (admin)' })
    @ApiResponse({ status: 200, type: PromoCodeResponseDto })
    @ApiResponse({ status: 404, description: 'Promo code not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePromoCodeDto,
    ): Promise<PromoCodeResponseDto> {
        const promo = await this.promosService.update(id, dto);
        return this.promosService.toResponseDto(promo);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a promo code (admin, permanent)' })
    @ApiResponse({ status: 204, description: 'Promo code deleted' })
    @ApiResponse({ status: 404, description: 'Promo code not found' })
    async delete(@Param('id') id: string): Promise<void> {
        await this.promosService.delete(id);
    }

    @Get(':id/redemptions')
    @ApiOperation({ summary: 'Get redemption history for a promo code (admin)' })
    @ApiResponse({ status: 200, type: PaginatedRedemptionsDto })
    @ApiResponse({ status: 404, description: 'Promo code not found' })
    async getRedemptions(
        @Param('id') id: string,
        @Query() query: RedemptionQueryDto,
    ): Promise<PaginatedRedemptionsDto> {
        // Verify promo exists
        await this.promosService.findOneOrThrow(id);

        const { data, total } = await this.promosService.getRedemptions(id, {
            page: query.page,
            limit: query.limit,
        });

        const limit = query.limit ?? 20;
        const page = query.page ?? 1;

        return {
            data: data.map((r) => this.promosService.toRedemptionResponseDto(r)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
