import { ApiProperty } from '@nestjs/swagger';

/**
 * Category item returned from dynamic aggregation
 * Categories are derived from product genres and special collections
 */
export class CategoryDto {
  @ApiProperty({
    description: 'Unique category identifier (slug-format)',
    example: 'action',
  })
  id!: string;

  @ApiProperty({
    description: 'Display label for the category',
    example: 'Action',
  })
  label!: string;

  @ApiProperty({
    description: 'Category type: genre, platform, collection, or custom',
    enum: ['genre', 'platform', 'collection', 'custom'],
    example: 'genre',
  })
  type!: 'genre' | 'platform' | 'collection' | 'custom';

  @ApiProperty({
    description: 'Number of products in this category',
    example: 150,
  })
  count!: number;

  @ApiProperty({
    description: 'Icon identifier for frontend (lucide icon name)',
    example: 'gamepad-2',
    required: false,
  })
  icon?: string;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
  })
  sortOrder!: number;
}

/**
 * Platform filter option
 */
export class PlatformFilterDto {
  @ApiProperty({
    description: 'Platform identifier',
    example: 'steam',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Steam',
  })
  label!: string;

  @ApiProperty({
    description: 'Number of products on this platform',
    example: 500,
  })
  count!: number;
}

/**
 * Region filter option
 */
export class RegionFilterDto {
  @ApiProperty({
    description: 'Region identifier',
    example: 'global',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Global',
  })
  label!: string;

  @ApiProperty({
    description: 'Number of products available in this region',
    example: 800,
  })
  count!: number;
}

/**
 * Genre filter option (derived from Kinguin genres)
 */
export class GenreFilterDto {
  @ApiProperty({
    description: 'Genre identifier (slug-format)',
    example: 'rpg',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'RPG',
  })
  label!: string;

  @ApiProperty({
    description: 'Number of products in this genre',
    example: 120,
  })
  count!: number;
}

/**
 * Price range information
 */
export class PriceRangeDto {
  @ApiProperty({
    description: 'Minimum price in the catalog',
    example: 0.99,
  })
  min!: number;

  @ApiProperty({
    description: 'Maximum price in the catalog',
    example: 149.99,
  })
  max!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  currency!: string;
}

/**
 * Featured category item (for featured tabs like Trending, New, etc.)
 */
export class FeaturedCategoryDto {
  @ApiProperty({
    description: 'Unique identifier for the featured category',
    example: 'trending',
  })
  id!: string;

  @ApiProperty({
    description: 'Display label for the featured category',
    example: 'Trending',
  })
  label!: string;

  @ApiProperty({
    description: 'Sort type for this featured category',
    example: 'trending',
  })
  sort!: string;

  @ApiProperty({
    description: 'Icon identifier for frontend (lucide icon name)',
    example: 'flame',
    required: false,
  })
  icon?: string;
}

/**
 * Complete categories response
 */
export class CategoriesResponseDto {
  @ApiProperty({
    description: 'List of available categories',
    type: [CategoryDto],
  })
  categories!: CategoryDto[];

  @ApiProperty({
    description: 'Featured/special categories (trending, new, etc.)',
    type: [FeaturedCategoryDto],
  })
  featured!: FeaturedCategoryDto[];

  @ApiProperty({
    description: 'Total number of published products',
    example: 1500,
  })
  totalProducts!: number;
}

/**
 * Complete filters response for catalog filtering
 */
export class FiltersResponseDto {
  @ApiProperty({
    description: 'Available platforms',
    type: [PlatformFilterDto],
  })
  platforms!: PlatformFilterDto[];

  @ApiProperty({
    description: 'Available regions',
    type: [RegionFilterDto],
  })
  regions!: RegionFilterDto[];

  @ApiProperty({
    description: 'Available genres',
    type: [GenreFilterDto],
  })
  genres!: GenreFilterDto[];

  @ApiProperty({
    description: 'Price range',
    type: PriceRangeDto,
  })
  priceRange!: PriceRangeDto;
}
