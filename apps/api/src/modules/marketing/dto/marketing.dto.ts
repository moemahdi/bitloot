import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  IsEnum,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// ============================================================================
// FLASH DEAL DTOs
// ============================================================================

export class FlashDealProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Discount percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Fixed discount price' })
  @IsOptional()
  @IsString()
  discountPrice?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Featured product flag' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Stock limit for this deal' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockLimit?: number;
}

export class CreateFlashDealDto {
  @ApiProperty({ description: 'Flash deal name' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if empty)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ description: 'Main headline text' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  headline?: string;

  @ApiPropertyOptional({ description: 'Sub-headline text' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subHeadline?: string;

  @ApiPropertyOptional({ description: 'Full description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time (ISO 8601)' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'End time (ISO 8601)' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ description: 'Activate deal immediately', default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Background type',
    enum: ['gradient', 'solid', 'image', 'video'],
    default: 'gradient',
  })
  @IsOptional()
  @IsEnum(['gradient', 'solid', 'image', 'video'])
  backgroundType?: 'gradient' | 'solid' | 'image' | 'video';

  @ApiPropertyOptional({ description: 'Background value (color, URL, or gradient)' })
  @IsOptional()
  @IsString()
  backgroundValue?: string;

  @ApiPropertyOptional({ description: 'Accent color hex', default: '#00D9FF' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ description: 'Text color hex', default: '#FFFFFF' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ description: 'Badge text (e.g., "HOT DEAL")' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badgeText?: string;

  @ApiPropertyOptional({ description: 'Badge background color hex' })
  @IsOptional()
  @IsString()
  badgeColor?: string;

  @ApiPropertyOptional({ description: 'CTA button text', default: 'Shop Now' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ctaText?: string;

  @ApiPropertyOptional({ description: 'CTA button link' })
  @IsOptional()
  @IsString()
  ctaLink?: string;

  @ApiPropertyOptional({ description: 'Show countdown timer', default: true })
  @IsOptional()
  @IsBoolean()
  showCountdown?: boolean;

  @ApiPropertyOptional({ description: 'Show product cards', default: true })
  @IsOptional()
  @IsBoolean()
  showProducts?: boolean;

  @ApiPropertyOptional({ description: 'Number of products to display', default: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  productsCount?: number;

  @ApiPropertyOptional({
    description: 'Display type: inline (default position in page) or sticky (above header)',
    enum: ['inline', 'sticky'],
    default: 'inline',
  })
  @IsOptional()
  @IsEnum(['inline', 'sticky'])
  displayType?: 'inline' | 'sticky';

  @ApiPropertyOptional({ description: 'Products to include in flash deal', type: [FlashDealProductDto] })
  @IsOptional()
  products?: FlashDealProductDto[];
}

export class UpdateFlashDealDto extends PartialType(CreateFlashDealDto) { }

export class FlashDealResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  headline?: string;

  @ApiPropertyOptional()
  subHeadline?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;

  @ApiProperty()
  backgroundType!: string;

  @ApiPropertyOptional()
  backgroundValue?: string;

  @ApiProperty()
  accentColor!: string;

  @ApiProperty()
  textColor!: string;

  @ApiPropertyOptional()
  badgeText?: string;

  @ApiPropertyOptional()
  badgeColor?: string;

  @ApiProperty()
  ctaText!: string;

  @ApiPropertyOptional()
  ctaLink?: string;

  @ApiProperty()
  showCountdown!: boolean;

  @ApiProperty()
  showProducts!: boolean;

  @ApiProperty()
  productsCount!: number;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ description: 'Display type: inline or sticky', enum: ['inline', 'sticky'] })
  displayType!: 'inline' | 'sticky';

  @ApiPropertyOptional({ description: 'Products included in deal' })
  products?: FlashDealProductResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class FlashDealProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  discountPercent?: string;

  @ApiPropertyOptional()
  discountPrice?: string;

  @ApiPropertyOptional()
  originalPrice?: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiPropertyOptional()
  stockLimit?: number;

  @ApiProperty()
  soldCount!: number;

  @ApiPropertyOptional({ description: 'Product details' })
  product?: {
    id: string;
    title: string;
    slug: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    platform?: string;
    productType?: string;
  };
}

// ============================================================================
// BUNDLE DEAL DTOs
// ============================================================================

export class BundleProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Display order in bundle' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is this a bonus item (free with bundle)', default: false })
  @IsOptional()
  @IsBoolean()
  isBonus?: boolean;

  @ApiPropertyOptional({ description: 'Discount percentage for this product (0-100)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}

export class CreateBundleDealDto {
  @ApiProperty({ description: 'Bundle name' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if empty)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ description: 'Full description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description for cards' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiProperty({ description: 'Bundle price' })
  @IsString()
  bundlePrice!: string;

  @ApiPropertyOptional({ description: 'Original price before discount (sum of individual products)' })
  @IsOptional()
  @IsString()
  originalPrice?: string;

  @ApiPropertyOptional({ description: 'Savings percentage (calculated or manual)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  savingsPercent?: number;

  @ApiPropertyOptional({ description: 'Bundle category (e.g., gaming, software, subscription)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Activate bundle', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Feature on homepage', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Start time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'End time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Hero image URL (larger banner image)' })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiPropertyOptional({ description: 'Badge text (e.g., "Best Value")' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badgeText?: string;

  @ApiPropertyOptional({ description: 'Badge color hex' })
  @IsOptional()
  @IsString()
  badgeColor?: string;

  @ApiPropertyOptional({ description: 'Background gradient CSS' })
  @IsOptional()
  @IsString()
  backgroundGradient?: string;

  @ApiPropertyOptional({ description: 'Stock limit' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockLimit?: number;

  @ApiPropertyOptional({ description: 'Products in bundle', type: [BundleProductDto] })
  @IsOptional()
  products?: BundleProductDto[];
}

export class UpdateBundleDealDto extends PartialType(CreateBundleDealDto) { }

export class BundleDealResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiProperty()
  bundlePrice!: string;

  @ApiPropertyOptional()
  originalPrice?: string;

  @ApiPropertyOptional()
  savingsAmount?: string;

  @ApiPropertyOptional()
  savingsPercent?: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiPropertyOptional()
  startsAt?: Date;

  @ApiPropertyOptional()
  endsAt?: Date;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiPropertyOptional()
  badgeText?: string;

  @ApiPropertyOptional()
  badgeColor?: string;

  @ApiPropertyOptional()
  backgroundGradient?: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiPropertyOptional()
  stockLimit?: number;

  @ApiProperty()
  soldCount!: number;

  @ApiProperty()
  productTypes!: string[];

  @ApiPropertyOptional({ description: 'Products in bundle' })
  products?: BundleProductResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class BundleProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isBonus!: boolean;

  @ApiProperty({ description: 'Discount percentage for this product (0-100)' })
  discountPercent!: string;

  @ApiPropertyOptional({ description: 'Calculated discounted price' })
  discountedPrice?: string;

  @ApiPropertyOptional({ description: 'Product details' })
  product?: {
    id: string;
    title: string;
    slug: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    platform?: string;
    productType?: string;
  };
}

export class AddBundleProductDto {
  @ApiProperty({ description: 'Product ID to add to bundle' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Discount percentage for this product (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;

  @ApiPropertyOptional({ description: 'Display order in bundle', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is this a bonus item (free with bundle)', default: false })
  @IsOptional()
  @IsBoolean()
  isBonus?: boolean;
}

export class UpdateBundleProductDto {
  @ApiPropertyOptional({ description: 'Discount percentage for this product (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Display order in bundle' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is this a bonus item' })
  @IsOptional()
  @IsBoolean()
  isBonus?: boolean;
}


// ============================================================================
// FLASH DEAL PRODUCT MANAGEMENT DTOs
// ============================================================================

export class AddFlashDealProductDto {
  @ApiProperty({ description: 'Product ID to add' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'Discount percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Fixed discount price' })
  @IsOptional()
  @IsString()
  discountPrice?: string;
}

export class UpdateFlashDealProductDto {
  @ApiPropertyOptional({ description: 'Discount percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Fixed discount price' })
  @IsOptional()
  @IsString()
  discountPrice?: string;
}
