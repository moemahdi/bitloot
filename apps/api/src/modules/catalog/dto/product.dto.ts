import { ApiProperty } from '@nestjs/swagger';

/**
 * Video object from Kinguin API
 */
export class VideoDto {
  @ApiProperty({ description: 'YouTube video ID', example: 'dQw4w9WgXcQ' })
  video_id!: string;
}

/**
 * Screenshot object from Kinguin API
 */
export class ScreenshotDto {
  @ApiProperty({ description: 'Full-size screenshot URL' })
  url!: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnail!: string;
}

/**
 * System requirement object from Kinguin API
 */
export class SystemRequirementDto {
  @ApiProperty({ description: 'System name', example: 'Windows' })
  system!: string;

  @ApiProperty({ description: 'List of requirements', type: [String] })
  requirement!: string[];
}

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
    description: 'Product category (Kinguin genre)',
    example: 'Games',
    required: false,
  })
  category?: string;

  @ApiProperty({
    description: 'BitLoot business category: games, software, gift-cards, subscriptions',
    example: 'games',
    enum: ['games', 'software', 'gift-cards', 'subscriptions'],
    required: false,
  })
  businessCategory?: string;

  @ApiProperty({
    description: 'Whether product is featured on homepage',
    example: false,
    required: false,
  })
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Price in crypto (decimal string)',
    example: '59.99000000',
  })
  price!: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
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

  // ============================================
  // KINGUIN EXTENDED FIELDS
  // ============================================

  @ApiProperty({
    description: 'Game developers',
    type: [String],
    required: false,
    example: ['CD Projekt Red'],
  })
  developers?: string[];

  @ApiProperty({
    description: 'Game publishers',
    type: [String],
    required: false,
    example: ['CD Projekt'],
  })
  publishers?: string[];

  @ApiProperty({
    description: 'Game genres',
    type: [String],
    required: false,
    example: ['Action', 'RPG', 'Open World'],
  })
  genres?: string[];

  @ApiProperty({
    description: 'Release date (YYYY-MM-DD)',
    required: false,
    example: '2020-12-10',
  })
  releaseDate?: string;

  @ApiProperty({
    description: 'Metacritic score (0-100)',
    required: false,
    example: 86,
  })
  metacriticScore?: number;

  @ApiProperty({
    description: 'Regional limitations description',
    required: false,
    example: 'Region free',
  })
  regionalLimitations?: string;

  @ApiProperty({
    description: 'Activation details / instructions',
    required: false,
    example: 'Download and install the game client, log in to your account, enter the key',
  })
  activationDetails?: string;

  @ApiProperty({
    description: 'YouTube video trailers',
    type: [VideoDto],
    required: false,
  })
  videos?: VideoDto[];

  @ApiProperty({
    description: 'Supported languages',
    type: [String],
    required: false,
    example: ['English', 'German', 'French', 'Spanish'],
  })
  languages?: string[];

  @ApiProperty({
    description: 'System requirements by OS',
    type: [SystemRequirementDto],
    required: false,
  })
  systemRequirements?: SystemRequirementDto[];

  @ApiProperty({
    description: 'Product tags',
    type: [String],
    required: false,
    example: ['base', 'action', 'open-world'],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Steam app ID',
    required: false,
    example: '1091500',
  })
  steam?: string;

  @ApiProperty({
    description: 'Product screenshots',
    type: [ScreenshotDto],
    required: false,
  })
  screenshots?: ScreenshotDto[];

  @ApiProperty({
    description: 'Is this a pre-order product',
    required: false,
    example: false,
  })
  isPreorder?: boolean;

  @ApiProperty({
    description: 'Product rating (0-5 scale)',
    required: false,
    example: 4.5,
  })
  rating?: number;
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
