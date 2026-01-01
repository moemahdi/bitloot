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
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

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
