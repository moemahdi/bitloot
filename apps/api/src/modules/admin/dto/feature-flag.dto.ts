import { IsString, IsBoolean, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Categories for feature flags
 */
export const FeatureFlagCategories = [
  'Payments',
  'Fulfillment',
  'Products',
  'Notifications',
  'Security',
  'System',
] as const;

export type FeatureFlagCategory = (typeof FeatureFlagCategories)[number];

/**
 * DTO for creating a feature flag
 */
export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Unique flag name (snake_case)', example: 'my_feature_enabled' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Initial enabled state', default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Human-readable description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category for grouping',
    enum: FeatureFlagCategories,
    default: 'System',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

/**
 * DTO for updating a feature flag
 */
export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ description: 'Enable or disable flag' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Update description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Update category',
    enum: FeatureFlagCategories,
  })
  @IsOptional()
  @IsString()
  category?: string;
}

/**
 * Response DTO for a single feature flag
 */
export class FeatureFlagResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Flag name' })
  name!: string;

  @ApiProperty({ description: 'Current enabled state' })
  enabled!: boolean;

  @ApiProperty({ description: 'Flag description' })
  description?: string;

  @ApiProperty({ description: 'Category for grouping' })
  category!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'ID of admin who last updated' })
  updatedById?: string;

  @ApiPropertyOptional({ description: 'Email of admin who last updated' })
  updatedByEmail?: string;
}

/**
 * Response DTO for feature flag toggle result
 */
export class ToggleFeatureFlagResponseDto {
  @ApiProperty({ description: 'Operation success' })
  success!: boolean;

  @ApiProperty({ description: 'Result message' })
  message!: string;

  @ApiPropertyOptional({ description: 'Updated flag state' })
  flag?: FeatureFlagResponseDto;
}

/**
 * Response DTO for listing all feature flags
 */
export class ListFeatureFlagsResponseDto {
  @ApiProperty({ type: [FeatureFlagResponseDto], description: 'List of all feature flags' })
  flags!: FeatureFlagResponseDto[];

  @ApiProperty({ description: 'Total number of flags' })
  total!: number;

  @ApiProperty({ description: 'Number of enabled flags' })
  enabledCount!: number;

  @ApiProperty({ description: 'Number of disabled flags' })
  disabledCount!: number;
}

/**
 * Response DTO for grouped feature flags by category
 */
export class GroupedFeatureFlagsResponseDto {
  @ApiProperty({
    description: 'Flags grouped by category',
    example: {
      Payments: [{ name: 'payment_processing_enabled', enabled: true }],
      Security: [{ name: 'captcha_enabled', enabled: false }],
    },
  })
  groups!: Record<string, FeatureFlagResponseDto[]>;

  @ApiProperty({ description: 'Total number of flags' })
  total!: number;

  @ApiProperty({ description: 'Available categories' })
  categories!: string[];
}
