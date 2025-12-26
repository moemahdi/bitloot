import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumberString,
  IsEnum,
  MinLength,
  MaxLength,
  IsUUID,
  IsIn,
} from 'class-validator';

/**
 * Product source type for fulfillment routing
 * - 'custom': Manual fulfillment (admin uploads keys to R2)
 * - 'kinguin': Automatic fulfillment via Kinguin API
 */
export type ProductSourceType = 'custom' | 'kinguin';

/**
 * Admin Product DTOs
 *
 * Used for creating/updating products via admin API endpoints.
 * Only admins can create/edit products.
 */

export class CreateProductDto {
  @ApiProperty({
    description: 'Product fulfillment source',
    enum: ['custom', 'kinguin'],
    default: 'custom',
    example: 'custom',
  })
  @IsOptional()
  @IsIn(['custom', 'kinguin'])
  sourceType?: ProductSourceType;

  @ApiProperty({
    description: 'Kinguin offer ID (required when sourceType is kinguin)',
    required: false,
    example: '5c9b5e6b-89f6-4b3d-8f4e-abcdef123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  kinguinOfferId?: string;

  @ApiProperty({ description: 'Product title' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Product subtitle', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Platform (steam, epic, gog, etc.)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @ApiProperty({ description: 'Region (us, eu, asia, global)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string;

  @ApiProperty({ description: 'DRM type', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  drm?: string;

  @ApiProperty({ description: 'Age rating (PEGI-16, ESRB-M, etc.)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ageRating?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ description: 'Wholesale cost (decimal string)', example: '45.00' })
  @IsNumberString()
  cost!: string;

  @ApiProperty({
    description: 'Retail price (decimal string)',
    example: '59.99',
  })
  @IsNumberString()
  price!: string;

  @ApiProperty({ description: 'Currency code (USD, EUR, GBP)', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Is published to storefront?', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product fulfillment source',
    enum: ['custom', 'kinguin'],
    required: false,
    example: 'custom',
  })
  @IsOptional()
  @IsIn(['custom', 'kinguin'])
  sourceType?: ProductSourceType;

  @ApiProperty({
    description: 'Kinguin offer ID (required when sourceType is kinguin)',
    required: false,
    example: '5c9b5e6b-89f6-4b3d-8f4e-abcdef123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  kinguinOfferId?: string;

  @ApiProperty({ description: 'Product title', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Product subtitle', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Platform', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @ApiProperty({ description: 'Region', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string;

  @ApiProperty({ description: 'DRM type', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  drm?: string;

  @ApiProperty({ description: 'Age rating', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  ageRating?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ description: 'Wholesale cost', required: false })
  @IsOptional()
  @IsNumberString()
  cost?: string;

  @ApiProperty({ description: 'Retail price', required: false })
  @IsOptional()
  @IsNumberString()
  price?: string;

  @ApiProperty({ description: 'Currency code', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class PublishProductDto {
  @ApiProperty({ description: 'Publish status' })
  @IsBoolean()
  isPublished!: boolean;
}

export class ProductPriceDto {
  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;
}

export class AdminProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  externalId?: string;

  @ApiProperty({
    description: 'Product fulfillment source',
    enum: ['custom', 'kinguin'],
    example: 'custom',
  })
  sourceType!: 'custom' | 'kinguin';

  @ApiProperty({
    description: 'Kinguin offer ID (present when sourceType is kinguin)',
    required: false,
    example: '5c9b5e6b-89f6-4b3d-8f4e-abcdef123456',
  })
  kinguinOfferId?: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  subtitle?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  platform?: string;

  @ApiProperty({ required: false })
  region?: string;

  @ApiProperty({ required: false })
  drm?: string;

  @ApiProperty({ required: false })
  ageRating?: string;

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty()
  cost!: string;

  @ApiProperty()
  price!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty()
  isCustom!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}

export class AdminPricingRuleDto {
  @ApiProperty({ description: 'Rule ID' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Rule type',
    enum: ['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'],
  })
  @IsEnum(['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'])
  ruleType!: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';

  @ApiProperty({ description: 'Margin percentage (e.g., 8.00 for 8%)', required: false })
  @IsOptional()
  @IsNumberString()
  marginPercent?: string;

  @ApiProperty({ description: 'Fixed markup in minor units', required: false })
  @IsOptional()
  @IsNumberString()
  fixedMarkupMinor?: number;

  @ApiProperty({ description: 'Floor price in minor units', required: false })
  @IsOptional()
  @IsNumberString()
  floorMinor?: number;

  @ApiProperty({ description: 'Cap price in minor units', required: false })
  @IsOptional()
  @IsNumberString()
  capMinor?: number;

  @ApiProperty({ description: 'Rule priority (higher = applied first)', example: 0 })
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Is rule active?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;
}

export class AdminSyncStatusDto {
  @ApiProperty({ description: 'Sync job ID' })
  jobId!: string;

  @ApiProperty({ enum: ['pending', 'running', 'completed', 'failed'] })
  status!: 'pending' | 'running' | 'completed' | 'failed';

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Products processed', default: 0 })
  productsProcessed!: number;

  @ApiProperty({ description: 'Products updated', default: 0 })
  productsUpdated!: number;

  @ApiProperty({ description: 'Errors encountered', required: false })
  errors?: string[];
}
