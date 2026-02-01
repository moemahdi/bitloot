import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsNumberString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

/**
 * Admin Pricing Rule DTOs
 *
 * Used for creating/updating dynamic pricing rules via admin API.
 * Only admins can manage pricing rules.
 */

export class CreatePricingRuleDto {
  @ApiProperty({
    description: 'Product ID (UUID). Leave empty for global rule that applies to all products.',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Rule type',
    enum: ['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'],
  })
  @IsEnum(['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'])
  ruleType!: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';

  @ApiProperty({
    description: 'Margin percentage (e.g., "35.50" for 35.5%)',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  marginPercent?: string;

  @ApiProperty({
    description: 'Fixed markup in minor units (cents)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fixedMarkupMinor?: number;

  @ApiProperty({
    description: 'Floor price in minor units (cents) - minimum selling price',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  floorMinor?: number;

  @ApiProperty({
    description: 'Cap price in minor units (cents) - maximum selling price',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  capMinor?: number;

  @ApiProperty({
    description: 'Minimum cost in minor units (cents) for rule to apply (inclusive). Use for tiered pricing by cost range.',
    required: false,
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minCostMinor?: number;

  @ApiProperty({
    description: 'Maximum cost in minor units (cents) for rule to apply (exclusive). Use for tiered pricing by cost range.',
    required: false,
    minimum: 0,
    example: 800,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCostMinor?: number;

  @ApiProperty({
    description: 'Rule priority (0 = highest)',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({ description: 'Is rule active?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiProperty({
    description: 'Rule type',
    enum: ['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'])
  ruleType?: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';

  @ApiProperty({
    description: 'Margin percentage (e.g., "35.50" for 35.5%)',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  marginPercent?: string;

  @ApiProperty({
    description: 'Fixed markup in minor units (cents)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fixedMarkupMinor?: number;

  @ApiProperty({
    description: 'Floor price in minor units (cents) - minimum selling price',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  floorMinor?: number;

  @ApiProperty({
    description: 'Cap price in minor units (cents) - maximum selling price',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  capMinor?: number;

  @ApiProperty({
    description: 'Minimum cost in minor units (cents) for rule to apply (inclusive). Use for tiered pricing by cost range.',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minCostMinor?: number;

  @ApiProperty({
    description: 'Maximum cost in minor units (cents) for rule to apply (exclusive). Use for tiered pricing by cost range.',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCostMinor?: number;

  @ApiProperty({
    description: 'Rule priority (0 = highest)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({ description: 'Is rule active?', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminPricingRuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true, description: 'Product ID. Null for global rules.' })
  productId?: string | null;

  @ApiProperty()
  ruleType!: string;

  @ApiProperty({ nullable: true })
  marginPercent?: string;

  @ApiProperty({ nullable: true })
  fixedMarkupMinor?: number;

  @ApiProperty({ nullable: true, description: 'Floor price in cents - minimum selling price' })
  floorMinor?: number;

  @ApiProperty({ nullable: true, description: 'Cap price in cents - maximum selling price' })
  capMinor?: number;

  @ApiProperty({ nullable: true, description: 'Minimum cost in cents for rule to apply (inclusive)' })
  minCostMinor?: number;

  @ApiProperty({ nullable: true, description: 'Maximum cost in cents for rule to apply (exclusive)' })
  maxCostMinor?: number;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AdminPricingRulesListResponseDto {
  @ApiProperty({ type: [AdminPricingRuleResponseDto] })
  data!: AdminPricingRuleResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
