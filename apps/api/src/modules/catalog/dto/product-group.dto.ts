import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// FAQ ITEM DTO
// ============================================

/**
 * FAQ item for spotlight pages
 */
export class FaqItemDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  question!: string;

  @ApiProperty({ description: 'Answer text' })
  @IsString()
  answer!: string;
}

/**
 * Feature item for spotlight pages
 */
export class FeatureItemDto {
  @ApiProperty({ description: 'Feature title', example: 'Massive Open World' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    description: 'Feature description',
    example: 'Explore a living world with dynamic events, side quests, and seamless traversal.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description!: string;
}

// ============================================
// CREATE / UPDATE DTOs
// ============================================

/**
 * Create a new product group
 */
export class CreateProductGroupDto {
  @ApiProperty({
    description: 'Display title for the group',
    example: 'Battlefield 6',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'URL-friendly slug (auto-generated if not provided)',
    required: false,
    example: 'battlefield-6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    description: 'Group description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Cover image URL (will use first product image if not set)',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Short tagline for the card',
    required: false,
    example: 'Available on 5 platforms',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @ApiProperty({
    description: 'Whether group is visible in catalog',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Display order (lower = first)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  // ============================================
  // SPOTLIGHT FIELDS
  // ============================================

  @ApiProperty({
    description: 'Whether this group appears on spotlight/games pages',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSpotlight?: boolean;

  @ApiProperty({
    description: 'Full-width hero banner/poster image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @ApiProperty({
    description: 'YouTube/Vimeo embed URL for trailer',
    required: false,
    example: 'https://www.youtube.com/embed/VIDEO_ID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroVideoUrl?: string;

  @ApiProperty({
    description: 'Release date (ISO 8601)',
    required: false,
    example: '2026-03-15T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({
    description: 'Rich marketing copy for spotlight page',
    required: false,
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Per-game accent color for theming',
    required: false,
    example: '#FF6B00',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accentColor?: string;

  @ApiProperty({
    description: 'Badge text (NEW RELEASE, COMING SOON, PRE-ORDER)',
    required: false,
    example: 'NEW RELEASE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badgeText?: string;

  @ApiProperty({
    description: 'Metacritic score (0-100)',
    required: false,
    example: 85,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  metacriticScore?: number;

  @ApiProperty({
    description: 'Game developer name',
    required: false,
    example: 'DICE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  developerName?: string;

  @ApiProperty({
    description: 'Game publisher name',
    required: false,
    example: 'Electronic Arts',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  publisherName?: string;

  @ApiProperty({
    description: 'Array of genre strings',
    required: false,
    example: ['FPS', 'Action', 'Multiplayer'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiProperty({
    description: 'Array of structured feature highlights',
    required: false,
    type: [FeatureItemDto],
  })
  @IsOptional()
  @IsArray()
  features?: FeatureItemDto[];

  @ApiProperty({
    description: 'Array of FAQ items',
    required: false,
    type: [FaqItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faqItems?: FaqItemDto[];

  @ApiProperty({
    description: 'Display order in spotlight carousel (lower = first)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  spotlightOrder?: number;
}

/**
 * Update an existing product group
 */
export class UpdateProductGroupDto {
  @ApiProperty({
    description: 'Display title for the group',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    description: 'Group description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Cover image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Short tagline for the card',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @ApiProperty({
    description: 'Whether group is visible in catalog',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Display order (lower = first)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  // ============================================
  // SPOTLIGHT FIELDS
  // ============================================

  @ApiProperty({
    description: 'Whether this group appears on spotlight/games pages',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSpotlight?: boolean;

  @ApiProperty({
    description: 'Full-width hero banner/poster image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @ApiProperty({
    description: 'YouTube/Vimeo embed URL for trailer',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroVideoUrl?: string;

  @ApiProperty({
    description: 'Release date (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({
    description: 'Rich marketing copy for spotlight page',
    required: false,
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Per-game accent color for theming',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accentColor?: string;

  @ApiProperty({
    description: 'Badge text (NEW RELEASE, COMING SOON, PRE-ORDER)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badgeText?: string;

  @ApiProperty({
    description: 'Metacritic score (0-100)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  metacriticScore?: number;

  @ApiProperty({
    description: 'Game developer name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  developerName?: string;

  @ApiProperty({
    description: 'Game publisher name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  publisherName?: string;

  @ApiProperty({
    description: 'Array of genre strings',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiProperty({
    description: 'Array of structured feature highlights',
    required: false,
    type: [FeatureItemDto],
  })
  @IsOptional()
  @IsArray()
  features?: FeatureItemDto[];

  @ApiProperty({
    description: 'Array of FAQ items',
    required: false,
    type: [FaqItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faqItems?: FaqItemDto[];

  @ApiProperty({
    description: 'Display order in spotlight carousel (lower = first)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  spotlightOrder?: number;
}

/**
 * Assign products to a group
 */
export class AssignProductsToGroupDto {
  @ApiProperty({
    description: 'Array of product IDs to assign to this group',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  productIds!: string[];
}

/**
 * Remove products from a group
 */
export class RemoveProductsFromGroupDto {
  @ApiProperty({
    description: 'Array of product IDs to remove from this group',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  productIds!: string[];
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Simplified product info for group variant list
 */
export class GroupProductVariantDto {
  @ApiProperty({ description: 'Product ID' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  title!: string;

  @ApiProperty({ description: 'Product slug' })
  slug!: string;

  @ApiProperty({ description: 'Platform (Steam, PlayStation, Xbox, etc.)' })
  platform?: string;

  @ApiProperty({ description: 'Region' })
  region?: string;

  @ApiProperty({ description: 'Edition or type (Standard, Phantom, Account, Key)' })
  subtitle?: string;

  @ApiProperty({ description: 'Retail price' })
  price!: string;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiProperty({ description: 'Cover image URL' })
  coverImageUrl?: string;

  @ApiProperty({ description: 'Product rating' })
  rating?: number;

  @ApiProperty({ description: 'Is published/available' })
  isPublished!: boolean;

  @ApiProperty({ description: 'Source type (custom or kinguin)' })
  sourceType!: string;
}

/**
 * Product group response (basic info)
 */
export class ProductGroupResponseDto {
  @ApiProperty({ description: 'Group ID' })
  id!: string;

  @ApiProperty({ description: 'Group title' })
  title!: string;

  @ApiProperty({ description: 'URL slug' })
  slug!: string;

  @ApiProperty({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Cover image URL' })
  coverImageUrl?: string;

  @ApiProperty({ description: 'Tagline' })
  tagline?: string;

  @ApiProperty({ description: 'Is active/visible' })
  isActive!: boolean;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;

  @ApiProperty({ description: 'Minimum price in group' })
  minPrice!: string;

  @ApiProperty({ description: 'Maximum price in group' })
  maxPrice!: string;

  @ApiProperty({ description: 'Number of products in group' })
  productCount!: number;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;

  // ============================================
  // SPOTLIGHT FIELDS
  // ============================================

  @ApiProperty({ description: 'Whether this group appears on spotlight/games pages' })
  isSpotlight!: boolean;

  @ApiProperty({ description: 'Full-width hero banner/poster image URL' })
  heroImageUrl?: string;

  @ApiProperty({ description: 'YouTube/Vimeo embed URL for trailer' })
  heroVideoUrl?: string;

  @ApiProperty({ description: 'Release date' })
  releaseDate?: Date;

  @ApiProperty({ description: 'Rich marketing copy for spotlight page' })
  longDescription?: string;

  @ApiProperty({ description: 'Per-game accent color for theming' })
  accentColor?: string;

  @ApiProperty({ description: 'Badge text (NEW RELEASE, COMING SOON, PRE-ORDER)' })
  badgeText?: string;

  @ApiProperty({ description: 'Metacritic score (0-100)' })
  metacriticScore?: number;

  @ApiProperty({ description: 'Game developer name' })
  developerName?: string;

  @ApiProperty({ description: 'Game publisher name' })
  publisherName?: string;

  @ApiProperty({ description: 'Array of genre strings', type: [String] })
  genres!: string[];

  @ApiProperty({ description: 'Array of structured feature highlights', type: [FeatureItemDto] })
  features!: FeatureItemDto[];

  @ApiProperty({ description: 'Array of FAQ items', type: [FaqItemDto] })
  faqItems!: FaqItemDto[];

  @ApiProperty({ description: 'Display order in spotlight carousel' })
  spotlightOrder!: number;
}

/**
 * Product group with all product variants
 */
export class ProductGroupWithProductsDto extends ProductGroupResponseDto {
  @ApiProperty({
    description: 'Products in this group',
    type: [GroupProductVariantDto],
  })
  products!: GroupProductVariantDto[];
}

/**
 * Paginated list of product groups
 */
export class ProductGroupListResponseDto {
  @ApiProperty({ type: [ProductGroupResponseDto] })
  groups!: ProductGroupResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages!: number;
}

// ============================================
// QUERY DTOs
// ============================================

/**
 * Query parameters for listing groups
 */
export class ListProductGroupsQueryDto {
  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by spotlight status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSpotlight?: boolean;

  @ApiProperty({
    description: 'Search in title',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number (1-based)',
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
