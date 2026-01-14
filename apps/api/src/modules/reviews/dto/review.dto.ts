import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewStatus } from '../../../database/entities/review.entity';

// ============ CUSTOMER DTOs ============

/**
 * DTO for customers to create a review after purchase
 */
export class CreateReviewDto {
  @ApiProperty({
    description: 'Order ID this review is for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional({
    description: 'Specific product ID being reviewed (optional, for multi-product orders)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Star rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @ApiPropertyOptional({
    description: 'Review title/headline',
    example: 'Great product, fast delivery!',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Review content/body',
    example: 'I received my key instantly after payment. Works perfectly!',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @Length(10, 2000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Display name for the review (optional, will use email username if not provided)',
    example: 'John D.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;
}

/**
 * DTO for customers to update their own review (before approval)
 */
export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Star rating (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Review title/headline',
    example: 'Updated: Still great!',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Review content/body',
    example: 'Updated my review after using the product more.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Display name for the review',
    example: 'John D.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;
}

// ============ ADMIN DTOs ============

/**
 * DTO for admins to create a review manually (e.g., testimonials)
 */
export class AdminCreateReviewDto {
  @ApiPropertyOptional({
    description: 'Order ID (optional for admin-created reviews)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Product ID being reviewed',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description: 'Star rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @ApiPropertyOptional({
    description: 'Review title/headline',
    example: 'Amazing service!',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Review content/body',
    example: 'BitLoot provided excellent service and instant delivery!',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @Length(10, 2000)
  content!: string;

  @ApiProperty({
    description: 'Display name for the reviewer',
    example: 'Happy Customer',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  authorName!: string;

  @ApiPropertyOptional({
    description: 'Initial status (defaults to pending)',
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Whether to display on homepage',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  displayOnHomepage?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as verified purchase (defaults to false for admin-created)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerifiedPurchase?: boolean;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Created from customer email testimonial',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}

/**
 * DTO for admins to update any review
 */
export class AdminUpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Star rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Review title/headline',
    example: 'Edited title',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Review content/body',
    example: 'Edited content',
    minLength: 10,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Display name for the reviewer',
    example: 'Valued Customer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;

  @ApiPropertyOptional({
    description: 'Moderation status',
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Whether to display on homepage',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  displayOnHomepage?: boolean;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Approved after content review',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}

/**
 * DTO for approving/rejecting a review
 */
export class ModerateReviewDto {
  @ApiProperty({
    description: 'New status (approved or rejected)',
    enum: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
    example: ReviewStatus.APPROVED,
  })
  @IsEnum(ReviewStatus)
  status!: ReviewStatus.APPROVED | ReviewStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Whether to display on homepage (only applies when approving)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  displayOnHomepage?: boolean;

  @ApiPropertyOptional({
    description: 'Admin notes about the decision',
    example: 'Approved - genuine customer feedback',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}

// ============ RESPONSE DTOs ============

/**
 * Represents an order item in a review response
 */
export class ReviewOrderItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  productId!: string;

  @ApiProperty({ example: 'Grand Theft Auto V' })
  productTitle!: string;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'grand-theft-auto-v' })
  productSlug?: string | null;

  @ApiProperty({ example: 1 })
  quantity!: number;
}

/**
 * Public review response (for customers viewing reviews)
 */
export class ReviewResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'Great product!' })
  title?: string | null;

  @ApiProperty({ example: 'Fast delivery and works perfectly.' })
  content!: string;

  @ApiProperty({ example: 'John D.' })
  authorName!: string;

  @ApiProperty({ example: true })
  isVerifiedPurchase!: boolean;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'Product Name' })
  productName?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: '550e8400-e29b-41d4-a716-446655440001' })
  productId?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'grand-theft-auto-v' })
  productSlug?: string | null;

  @ApiPropertyOptional({ type: [ReviewOrderItemDto], description: 'Order items for multi-product orders' })
  orderItems?: ReviewOrderItemDto[];

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  createdAt!: Date;
}

/**
 * Admin review response (includes moderation info)
 */
export class AdminReviewResponseDto extends ReviewResponseDto {
  @ApiPropertyOptional({ type: 'string', nullable: true, example: '550e8400-e29b-41d4-a716-446655440000' })
  orderId?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: '550e8400-e29b-41d4-a716-446655440001' })
  userId?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'user@example.com' })
  userEmail?: string | null;

  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.PENDING })
  status!: ReviewStatus;

  @ApiProperty({ example: false })
  displayOnHomepage!: boolean;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'Internal notes here' })
  adminNotes?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: '550e8400-e29b-41d4-a716-446655440003' })
  approvedById?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, example: 'admin@bitloot.io' })
  approvedByEmail?: string | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true, example: '2025-01-15T12:00:00.000Z' })
  approvedAt?: Date | null;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z' })
  updatedAt!: Date;
}

/**
 * Paginated reviews response
 */
export class PaginatedReviewsDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  data!: ReviewResponseDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}

/**
 * Paginated admin reviews response
 */
export class PaginatedAdminReviewsDto {
  @ApiProperty({ type: [AdminReviewResponseDto] })
  data!: AdminReviewResponseDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}

/**
 * Review statistics response
 */
export class ReviewStatsDto {
  @ApiProperty({ example: 150 })
  totalReviews!: number;

  @ApiProperty({ example: 4.7 })
  averageRating!: number;

  @ApiProperty({
    description: 'Breakdown by rating',
    example: { 1: 5, 2: 10, 3: 20, 4: 40, 5: 75 },
  })
  ratingBreakdown!: Record<number, number>;

  @ApiProperty({
    description: 'Breakdown by status',
    example: { pending: 15, approved: 130, rejected: 5 },
  })
  statusBreakdown!: Record<string, number>;
}
