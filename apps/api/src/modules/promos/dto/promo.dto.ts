import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsNumber,
    IsBoolean,
    IsUUID,
    IsArray,
    IsDateString,
    Min,
    Max,
    MaxLength,
    Matches,
} from 'class-validator';
import type { PromoDiscountType, PromoScopeType } from '../entities/promocode.entity';

// ==================== VALIDATION DTOs ====================

export class ValidatePromoDto {
    @ApiProperty({ description: 'Promo code to validate', example: 'SAVE10' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code!: string;

    @ApiProperty({ description: 'Order subtotal in EUR', example: '49.99' })
    @IsString()
    @IsNotEmpty()
    orderTotal!: string;

    @ApiProperty({ description: 'Product IDs in the order', required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    productIds?: string[];

    @ApiProperty({ description: 'Category slugs of products in the order', required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categoryIds?: string[];

    @ApiProperty({ description: 'User ID (for per-user limit check)', required: false })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiProperty({ description: 'Email (for guest per-user limit check)', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({
        description: 'Already applied promo code IDs (for stacking check)',
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    appliedPromoCodeIds?: string[];
}

export class ValidatePromoResponseDto {
    @ApiProperty({ description: 'Whether the promo code is valid' })
    valid!: boolean;

    @ApiProperty({ description: 'Promo code ID if valid', required: false })
    promoCodeId?: string;

    @ApiProperty({ description: 'Discount amount to apply (in EUR)', required: false })
    discountAmount?: string;

    @ApiProperty({ description: 'Discount type', required: false, enum: ['percent', 'fixed'] })
    discountType?: PromoDiscountType;

    @ApiProperty({ description: 'Discount value (percent or fixed amount)', required: false })
    discountValue?: string;

    @ApiProperty({ description: 'Whether this promo can be stacked with others', required: false })
    stackable?: boolean;

    @ApiProperty({ description: 'Human-readable message' })
    message!: string;

    @ApiProperty({ description: 'Error code for programmatic handling', required: false })
    errorCode?: string;
}

// ==================== ADMIN CREATE/UPDATE DTOs ====================

export class CreatePromoCodeDto {
    @ApiProperty({ description: 'Unique promo code', example: 'SUMMER2024' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @Matches(/^[A-Z0-9_-]+$/i, { message: 'Code must be alphanumeric with - or _' })
    code!: string;

    @ApiProperty({ description: 'Admin description', required: false, example: 'Summer sale promotion' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;

    @ApiProperty({ enum: ['percent', 'fixed'], description: 'Discount type' })
    @IsEnum(['percent', 'fixed'])
    discountType!: PromoDiscountType;

    @ApiProperty({ description: 'Discount value (0-100 for percent, amount for fixed)', example: '10' })
    @IsString()
    @IsNotEmpty()
    discountValue!: string;

    @ApiProperty({ description: 'Minimum order value in EUR', required: false, example: '25.00' })
    @IsOptional()
    @IsString()
    minOrderValue?: string;

    @ApiProperty({ description: 'Max total uses', required: false, example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsesTotal?: number;

    @ApiProperty({ description: 'Max uses per user', required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsesPerUser?: number;

    @ApiProperty({ enum: ['global', 'category', 'product'], description: 'Scope type', default: 'global' })
    @IsOptional()
    @IsEnum(['global', 'category', 'product'])
    scopeType?: PromoScopeType;

    @ApiProperty({ description: 'Scope value (category slug or product IDs)', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    scopeValue?: string;

    @ApiProperty({ description: 'Start date (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    startsAt?: string;

    @ApiProperty({ description: 'Expiry date (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiProperty({ description: 'Allow stacking with other promos', default: false })
    @IsOptional()
    @IsBoolean()
    stackable?: boolean;

    @ApiProperty({ description: 'Is the code active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdatePromoCodeDto {
    @ApiProperty({ description: 'Admin description', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;

    @ApiProperty({ enum: ['percent', 'fixed'], required: false })
    @IsOptional()
    @IsEnum(['percent', 'fixed'])
    discountType?: PromoDiscountType;

    @ApiProperty({ description: 'Discount value', required: false })
    @IsOptional()
    @IsString()
    discountValue?: string;

    @ApiProperty({ description: 'Minimum order value', required: false })
    @IsOptional()
    @IsString()
    minOrderValue?: string;

    @ApiProperty({ description: 'Max total uses', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsesTotal?: number;

    @ApiProperty({ description: 'Max uses per user', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsesPerUser?: number;

    @ApiProperty({ enum: ['global', 'category', 'product'], required: false })
    @IsOptional()
    @IsEnum(['global', 'category', 'product'])
    scopeType?: PromoScopeType;

    @ApiProperty({ description: 'Scope value', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    scopeValue?: string;

    @ApiProperty({ description: 'Start date', required: false })
    @IsOptional()
    @IsDateString()
    startsAt?: string;

    @ApiProperty({ description: 'Expiry date', required: false })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiProperty({ description: 'Allow stacking', required: false })
    @IsOptional()
    @IsBoolean()
    stackable?: boolean;

    @ApiProperty({ description: 'Is active', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// ==================== RESPONSE DTOs ====================

export class PromoCodeResponseDto {
    @ApiProperty() id!: string;
    @ApiProperty() code!: string;
    @ApiProperty({ required: false }) description?: string;
    @ApiProperty({ enum: ['percent', 'fixed'] }) discountType!: PromoDiscountType;
    @ApiProperty() discountValue!: string;
    @ApiProperty({ required: false }) minOrderValue?: string;
    @ApiProperty({ required: false }) maxUsesTotal?: number;
    @ApiProperty({ required: false }) maxUsesPerUser?: number;
    @ApiProperty() usageCount!: number;
    @ApiProperty({ enum: ['global', 'category', 'product'] }) scopeType!: PromoScopeType;
    @ApiProperty({ required: false }) scopeValue?: string;
    @ApiProperty({ required: false }) startsAt?: string;
    @ApiProperty({ required: false }) expiresAt?: string;
    @ApiProperty() stackable!: boolean;
    @ApiProperty() isActive!: boolean;
    @ApiProperty() createdAt!: string;
    @ApiProperty() updatedAt!: string;
}

export class PromoRedemptionResponseDto {
    @ApiProperty() id!: string;
    @ApiProperty() promoCodeId!: string;
    @ApiProperty() orderId!: string;
    @ApiProperty({ required: false }) userId?: string;
    @ApiProperty() email!: string;
    @ApiProperty() discountApplied!: string;
    @ApiProperty() originalTotal!: string;
    @ApiProperty() finalTotal!: string;
    @ApiProperty() createdAt!: string;
}

export class PaginatedPromoCodesDto {
    @ApiProperty({ type: [PromoCodeResponseDto] })
    data!: PromoCodeResponseDto[];

    @ApiProperty() total!: number;
    @ApiProperty() page!: number;
    @ApiProperty() limit!: number;
    @ApiProperty() totalPages!: number;
}

export class PaginatedRedemptionsDto {
    @ApiProperty({ type: [PromoRedemptionResponseDto] })
    data!: PromoRedemptionResponseDto[];

    @ApiProperty() total!: number;
    @ApiProperty() page!: number;
    @ApiProperty() limit!: number;
    @ApiProperty() totalPages!: number;
}

// ==================== QUERY DTOs ====================

export class PromoCodeQueryDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiProperty({ required: false, description: 'Filter by active status' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false, description: 'Search by code' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, enum: ['global', 'category', 'product'] })
    @IsOptional()
    @IsEnum(['global', 'category', 'product'])
    scopeType?: PromoScopeType;
}

export class RedemptionQueryDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}
