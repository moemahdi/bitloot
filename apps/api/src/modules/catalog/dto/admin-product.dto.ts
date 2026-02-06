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
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
} from 'class-validator';
import { ProductDeliveryType } from '../types/product-delivery.types';

/**
 * Product source type for fulfillment routing
 * - 'custom': Manual fulfillment (admin uploads keys to R2)
 * - 'kinguin': Automatic fulfillment via Kinguin API
 */
export type ProductSourceType = 'custom' | 'kinguin';

// Re-export for convenience
export { ProductDeliveryType };

/**
 * Business category for BitLoot store organization
 */
export type BusinessCategory = 'games' | 'software' | 'subscriptions';

/**
 * Canonical business categories for BitLoot
 */
export const BITLOOT_CATEGORIES = [
  { id: 'games' as const, label: 'Games', icon: 'Gamepad2', description: 'PC & Console game keys and accounts' },
  { id: 'software' as const, label: 'Software', icon: 'Monitor', description: 'Windows, Office, antivirus & more' },
  { id: 'subscriptions' as const, label: 'Subscriptions', icon: 'Clock', description: 'Game Pass, PS Plus, EA Play' },
] as const;

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
    description: 'Type of digital delivery content',
    enum: ['key', 'account', 'code', 'license', 'bundle', 'custom'],
    default: 'key',
    example: 'key',
  })
  @IsOptional()
  @IsEnum(ProductDeliveryType)
  deliveryType?: ProductDeliveryType;

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
  @MaxLength(100)
  drm?: string;

  @ApiProperty({ description: 'Age rating (PEGI-16, ESRB-M, etc.)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ageRating?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({
    description: 'Business category for store organization',
    enum: ['games', 'software', 'subscriptions'],
    default: 'games',
    example: 'games',
  })
  @IsOptional()
  @IsIn(['games', 'software', 'subscriptions'])
  businessCategory?: BusinessCategory;

  @ApiProperty({
    description: 'Whether this product is featured on the homepage',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ description: 'Wholesale cost (decimal string)', example: '45.00' })
  @IsNumberString()
  cost!: string;

  @ApiProperty({
    description: 'Retail price (decimal string)',
    example: '59.99',
  })
  @IsNumberString()
  price!: string;

  @ApiProperty({ description: 'Currency code (EUR)', default: 'EUR' })
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
    description: 'Type of digital delivery content',
    enum: ['key', 'account', 'code', 'license', 'bundle', 'custom'],
    required: false,
    example: 'key',
  })
  @IsOptional()
  @IsEnum(ProductDeliveryType)
  deliveryType?: ProductDeliveryType;

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
  @MaxLength(100)
  drm?: string;

  @ApiProperty({ description: 'Age rating', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ageRating?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({
    description: 'Business category for store organization',
    enum: ['games', 'software', 'subscriptions'],
    required: false,
    example: 'games',
  })
  @IsOptional()
  @IsIn(['games', 'software', 'subscriptions'])
  businessCategory?: BusinessCategory;

  @ApiProperty({
    description: 'Whether this product is featured on the homepage',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

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

  @ApiProperty({
    description: 'Homepage sections this product appears in',
    required: false,
    example: ['trending', 'featured_games'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredSections?: string[];

  @ApiProperty({
    description: 'Display order within featured sections (lower = first)',
    required: false,
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  featuredOrder?: number;
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

/**
 * Video object from Kinguin API
 */
export class KinguinVideoDto {
  @ApiProperty({ description: 'YouTube video ID', example: 'dQw4w9WgXcQ' })
  video_id!: string;
}

/**
 * Screenshot object from Kinguin API
 */
export class KinguinScreenshotDto {
  @ApiProperty({ description: 'Full-size screenshot URL' })
  url!: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnail!: string;
}

/**
 * System requirement object from Kinguin API
 */
export class KinguinSystemRequirementDto {
  @ApiProperty({ description: 'System name', example: 'Windows' })
  system!: string;

  @ApiProperty({ description: 'List of requirements', type: [String] })
  requirement!: string[];
}

export class AdminProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  externalId?: string;

  @ApiProperty({
    description: 'Kinguin numeric ID',
    required: false,
    example: 20443,
  })
  kinguinId?: number;

  @ApiProperty({
    description: 'Kinguin product ID string',
    required: false,
    example: '5c9b5e6b-89f6-4b3d-8f4e-abcdef123456',
  })
  kinguinProductId?: string;

  @ApiProperty({
    description: 'Product fulfillment source',
    enum: ['custom', 'kinguin'],
    example: 'custom',
  })
  sourceType!: 'custom' | 'kinguin';

  @ApiProperty({
    description: 'Type of digital delivery content',
    enum: ['key', 'account', 'code', 'license', 'bundle', 'custom'],
    example: 'key',
  })
  deliveryType!: ProductDeliveryType;

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

  @ApiProperty({
    description: 'Original product name from Kinguin',
    required: false,
    example: 'Counter-Strike: Source',
  })
  originalName?: string;

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

  @ApiProperty({
    description: 'Business category for store organization',
    enum: ['games', 'software', 'subscriptions'],
    example: 'games',
  })
  businessCategory!: 'games' | 'software' | 'subscriptions';

  @ApiProperty({
    description: 'Whether this product is featured on the homepage',
    example: false,
  })
  isFeatured!: boolean;

  // ============================================
  // KINGUIN API EXTENDED FIELDS
  // ============================================

  @ApiProperty({
    description: 'Game developers',
    type: [String],
    required: false,
    example: ['Valve'],
  })
  developers?: string[];

  @ApiProperty({
    description: 'Game publishers',
    type: [String],
    required: false,
    example: ['Valve'],
  })
  publishers?: string[];

  @ApiProperty({
    description: 'Game genres',
    type: [String],
    required: false,
    example: ['Action', 'FPS'],
  })
  genres?: string[];

  @ApiProperty({
    description: 'Release date (YYYY-MM-DD)',
    required: false,
    example: '2004-11-01',
  })
  releaseDate?: string;

  @ApiProperty({
    description: 'Quantity of cheapest offers',
    required: false,
    example: 100,
  })
  qty?: number;

  @ApiProperty({
    description: 'Quantity of text serials',
    required: false,
    example: 50,
  })
  textQty?: number;

  @ApiProperty({
    description: 'Number of offers',
    required: false,
    example: 5,
  })
  offersCount?: number;

  @ApiProperty({
    description: 'Total quantity from all offers',
    required: false,
    example: 200,
  })
  totalQty?: number;

  @ApiProperty({
    description: 'Is this a pre-order product',
    example: false,
  })
  isPreorder!: boolean;

  @ApiProperty({
    description: 'Metacritic score (0-100)',
    required: false,
    example: 88,
  })
  metacriticScore?: number;

  @ApiProperty({
    description: 'Regional limitations description',
    required: false,
    example: 'Region free',
  })
  regionalLimitations?: string;

  @ApiProperty({
    description: 'Excluded country codes (ISO 2-letter)',
    type: [String],
    required: false,
    example: ['DE', 'AT'],
  })
  countryLimitation?: string[];

  @ApiProperty({
    description: 'Kinguin region ID',
    required: false,
    example: 1,
  })
  regionId?: number;

  @ApiProperty({
    description: 'Activation details / instructions',
    required: false,
  })
  activationDetails?: string;

  @ApiProperty({
    description: 'YouTube video IDs',
    type: [KinguinVideoDto],
    required: false,
  })
  videos?: KinguinVideoDto[];

  @ApiProperty({
    description: 'Supported languages',
    type: [String],
    required: false,
    example: ['English', 'German', 'French'],
  })
  languages?: string[];

  @ApiProperty({
    description: 'System requirements by OS',
    type: [KinguinSystemRequirementDto],
    required: false,
  })
  systemRequirements?: KinguinSystemRequirementDto[];

  @ApiProperty({
    description: 'Product tags',
    type: [String],
    required: false,
    example: ['base', 'dlc'],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Cheapest offer seller names',
    type: [String],
    required: false,
    example: ['BestSeller', 'TopGames'],
  })
  merchantName?: string[];

  @ApiProperty({
    description: 'Steam app ID',
    required: false,
    example: '730',
  })
  steam?: string;

  @ApiProperty({
    description: 'Product screenshots',
    type: [KinguinScreenshotDto],
    required: false,
  })
  screenshots?: KinguinScreenshotDto[];

  @ApiProperty({
    description: 'Cover thumbnail URL',
    required: false,
  })
  coverThumbnailUrl?: string;

  @ApiProperty({
    description: 'Cheapest offer IDs',
    type: [String],
    required: false,
  })
  cheapestOfferId?: string[];

  // ============================================
  // END KINGUIN API EXTENDED FIELDS
  // ============================================

  @ApiProperty({
    description: 'Cover image URL for product display',
    required: false,
    example: 'https://cdn.kinguin.net/media/images/products/cover.jpg',
  })
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Product rating (0-5 scale)',
    required: false,
    example: 4.5,
  })
  rating?: number;

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

  @ApiProperty({
    description: 'Homepage sections this product appears in',
    type: [String],
    required: false,
    example: ['trending', 'featured_games'],
  })
  featuredSections?: string[];

  @ApiProperty({
    description: 'Display order within featured sections',
    required: false,
    example: 0,
  })
  featuredOrder?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}

/**
 * Paginated response for admin product listing
 */
export class AdminProductsListResponseDto {
  @ApiProperty({ type: [AdminProductResponseDto], description: 'Array of products' })
  products!: AdminProductResponseDto[];

  @ApiProperty({ description: 'Total number of products matching filters' })
  total!: number;

  @ApiProperty({ description: 'Current page number (1-based)' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
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

/**
 * DTO for bulk delete request
 */
export class BulkDeleteProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to delete',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids!: string[];
}

/**
 * DTO for bulk delete response
 */
export class BulkDeleteResponseDto {
  @ApiProperty({ description: 'Number of products successfully deleted' })
  deleted!: number;

  @ApiProperty({
    description: 'IDs of products that were not found',
    type: [String],
    required: false,
  })
  notFound?: string[];
}

/**
 * DTO for bulk reprice request
 */
export class BulkRepriceProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to reprice',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids!: string[];
}

/**
 * DTO for bulk reprice response
 */
export class BulkRepriceResponseDto {
  @ApiProperty({ description: 'Number of products successfully repriced' })
  success!: number;

  @ApiProperty({ description: 'Number of products that failed to reprice' })
  failed!: number;
}

/**
 * DTO for bulk publish request
 */
export class BulkPublishProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to publish',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids!: string[];
}

/**
 * DTO for bulk publish response
 */
export class BulkPublishResponseDto {
  @ApiProperty({ description: 'Number of products successfully published' })
  published!: number;

  @ApiProperty({
    description: 'IDs of products that were not found',
    type: [String],
    required: false,
  })
  notFound?: string[];
}

/**
 * DTO for bulk unpublish request
 */
export class BulkUnpublishProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to unpublish',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids!: string[];
}

/**
 * DTO for bulk unpublish response
 */
export class BulkUnpublishResponseDto {
  @ApiProperty({ description: 'Number of products successfully unpublished' })
  unpublished!: number;

  @ApiProperty({
    description: 'IDs of products that were not found',
    type: [String],
    required: false,
  })
  notFound?: string[];
}
