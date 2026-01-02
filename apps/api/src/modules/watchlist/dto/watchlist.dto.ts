import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============ ADD TO WATCHLIST DTO ============

export class AddToWatchlistDto {
  @ApiProperty({
    description: 'Product ID to add to watchlist',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  productId!: string;
}

// ============ WATCHLIST ITEM RESPONSE DTO ============

export class WatchlistProductDto {
  @ApiProperty({ description: 'Product ID', type: String })
  id!: string;

  @ApiProperty({ description: 'Product slug for URL', type: String })
  slug!: string;

  @ApiProperty({ description: 'Product title', type: String })
  title!: string;

  @ApiPropertyOptional({ description: 'Product subtitle', type: String, nullable: true })
  subtitle?: string | null;

  @ApiPropertyOptional({ description: 'Cover image URL', type: String, nullable: true })
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Product platform (Steam, Epic, etc.)', type: String, nullable: true })
  platform?: string | null;

  @ApiPropertyOptional({ description: 'Product region', type: String, nullable: true })
  region?: string | null;

  @ApiProperty({ description: 'Product price in USD', type: Number })
  price!: number;

  @ApiProperty({ description: 'Whether product is currently available', type: Boolean })
  isPublished!: boolean;
}

export class WatchlistItemResponseDto {
  @ApiProperty({ description: 'Watchlist item ID' })
  id!: string;

  @ApiProperty({ description: 'User ID who owns this watchlist item' })
  userId!: string;

  @ApiProperty({ description: 'Product ID in the watchlist' })
  productId!: string;

  @ApiProperty({
    description: 'Product details',
    type: WatchlistProductDto,
  })
  product!: WatchlistProductDto;

  @ApiProperty({ description: 'When the item was added to watchlist' })
  createdAt!: Date;
}

// ============ PAGINATED WATCHLIST RESPONSE ============

export class PaginatedWatchlistResponseDto {
  @ApiProperty({
    description: 'List of watchlist items',
    type: [WatchlistItemResponseDto],
  })
  data!: WatchlistItemResponseDto[];

  @ApiProperty({ description: 'Total number of items in watchlist' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

// ============ CHECK WATCHLIST RESPONSE DTO ============

export class CheckWatchlistResponseDto {
  @ApiProperty({ description: 'Whether the product is in the user\'s watchlist' })
  isInWatchlist!: boolean;

  @ApiPropertyOptional({ description: 'Watchlist item ID if in watchlist' })
  watchlistItemId?: string;
}

// ============ QUERY PARAMS DTO ============

export class GetWatchlistQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 50)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
