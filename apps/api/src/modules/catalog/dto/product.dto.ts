import { ApiProperty } from '@nestjs/swagger';

/**
 * Public-facing product response DTO for catalog API
 * Used by storefront (customer-facing) endpoints
 */
export class ProductResponseDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'URL-friendly product identifier',
    example: 'cyberpunk-2077-steam-us',
  })
  slug!: string;

  @ApiProperty({
    description: 'Product title',
    example: 'Cyberpunk 2077',
  })
  title!: string;

  @ApiProperty({
    description: 'Product subtitle or edition',
    example: 'Ultimate Edition',
    required: false,
  })
  subtitle?: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'An open-world, action-adventure RPG set in the dark future of Night City',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Gaming platform',
    example: 'Steam',
    required: false,
  })
  platform?: string;

  @ApiProperty({
    description: 'Region code',
    example: 'US',
    required: false,
  })
  region?: string;

  @ApiProperty({
    description: 'DRM system',
    example: 'Steam',
    required: false,
  })
  drm?: string;

  @ApiProperty({
    description: 'Age rating',
    example: 'M - Mature 17+',
    required: false,
  })
  ageRating?: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Games',
    required: false,
  })
  category?: string;

  @ApiProperty({
    description: 'Price in minor units (cents)',
    example: 5999,
    minimum: 0,
  })
  priceMinor!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency!: string;

  @ApiProperty({
    description: 'Whether product is published and visible',
    example: true,
  })
  isPublished!: boolean;

  @ApiProperty({
    description: 'Cover image URL',
    example: 'https://cdn.bitloot.io/products/cyberpunk-2077-cover.jpg',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Product creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T15:45:00Z',
  })
  updatedAt!: Date;
}

/**
 * Paginated list of products response
 */
export class ProductListResponseDto {
  @ApiProperty({
    type: [ProductResponseDto],
    description: 'Array of products',
  })
  data!: ProductResponseDto[];

  @ApiProperty({
    description: 'Total number of products matching filters',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 24,
  })
  limit!: number;

  @ApiProperty({
    description: 'Pagination offset',
    example: 0,
  })
  offset!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 7,
  })
  pages!: number;
}
