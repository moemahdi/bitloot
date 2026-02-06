import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsBoolean,
  IsArray,
  IsEnum,
  IsISO8601,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProductDeliveryType,
  InventoryItemStatus,
} from '../types/product-delivery.types';

// ============================================
// INTERNAL ITEM DATA DTOs (for validation only - NOT exposed in OpenAPI)
// These classes are used for runtime validation but should not appear
// in the generated SDK. They are internal implementation details.
// ============================================

/**
 * @internal DTO for adding a KEY type item (internal validation only)
 */
export class AddKeyItemDataDto {
  @IsString()
  type!: 'key';

  @IsString()
  @MinLength(1)
  key!: string;
}

/**
 * @internal DTO for adding an ACCOUNT type item (internal validation only)
 */
export class AddAccountItemDataDto {
  @IsString()
  type!: 'account';

  @IsString()
  @MinLength(1)
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  recoveryEmail?: string;

  @IsOptional()
  securityAnswers?: Record<string, string>;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * @internal DTO for adding a CODE type item (internal validation only)
 */
export class AddCodeItemDataDto {
  @IsString()
  type!: 'code';

  @IsString()
  @MinLength(1)
  code!: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

/**
 * @internal DTO for adding a LICENSE type item (internal validation only)
 */
export class AddLicenseItemDataDto {
  @IsString()
  type!: 'license';

  @IsString()
  @MinLength(1)
  licenseKey!: string;

  @IsOptional()
  @IsString()
  licensedTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  activationUrl?: string;

  @IsOptional()
  @IsString()
  downloadUrl?: string;
}

/**
 * @internal DTO for a single item in a bundle (internal validation only)
 */
export class BundleItemDto {
  @IsString()
  type!: 'key' | 'account' | 'code' | 'license';

  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  pin?: string;
}

/**
 * @internal DTO for adding a BUNDLE type item (internal validation only)
 */
export class AddBundleItemDataDto {
  @IsString()
  type!: 'bundle';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  @ArrayMinSize(1)
  items!: BundleItemDto[];
}

/**
 * @internal DTO for a custom field value (internal validation only)
 */
export class CustomFieldValueDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;
}

/**
 * @internal DTO for adding a CUSTOM type item (internal validation only)
 */
export class AddCustomItemDataDto {
  @IsString()
  type!: 'custom';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldValueDto)
  @ArrayMinSize(1)
  fields!: CustomFieldValueDto[];
}

// ============================================
// ADD INVENTORY ITEM DTO
// ============================================

/**
 * DTO for adding a single item to inventory
 * Note: itemData is typed as Record<string, unknown> for SDK generation,
 * but validated at runtime based on the 'type' field
 */
export class AddInventoryItemDto {
  @ApiProperty({
    description:
      'Item data object. Structure depends on "type" field: key (key), account (username, password), code (code), license (licenseKey), bundle (items[]), custom (fields[])',
    example: { type: 'key', key: 'XXXXX-XXXXX-XXXXX-XXXXX' },
  })
  @IsObject()
  itemData!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Supplier or source name',
    example: 'G2A',
  })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Acquisition cost',
    example: 5.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: 'Admin notes',
    example: 'Bought on sale',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// BULK IMPORT DTO
// ============================================

/**
 * DTO for bulk importing items
 */
export class BulkImportInventoryDto {
  @ApiProperty({
    description: 'Array of items to import',
    type: [AddInventoryItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddInventoryItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  items!: AddInventoryItemDto[];

  @ApiPropertyOptional({
    description: 'Skip duplicates instead of failing',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Supplier for all items',
    example: 'Kinguin',
  })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Cost per item',
    example: 4.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerItem?: number;
}

// ============================================
// QUERY DTOs
// ============================================

/**
 * DTO for listing inventory items
 */
export class InventoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: InventoryItemStatus,
  })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @ApiPropertyOptional({
    description: 'Filter by supplier',
    example: 'G2A',
  })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['uploadedAt', 'soldAt', 'expiresAt', 'cost'],
    default: 'uploadedAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc';
}

/**
 * DTO for updating item status
 */
export class UpdateItemStatusDto {
  @ApiProperty({
    description: 'New status',
    enum: [InventoryItemStatus.INVALID, InventoryItemStatus.AVAILABLE],
  })
  @IsEnum([InventoryItemStatus.INVALID, InventoryItemStatus.AVAILABLE])
  status!: InventoryItemStatus.INVALID | InventoryItemStatus.AVAILABLE;

  @ApiPropertyOptional({
    description: 'Reason for status change (required for invalid)',
    example: 'Key was already redeemed',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Response DTO for an inventory item
 */
export class InventoryItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id!: string;

  @ApiProperty({ description: 'Product ID' })
  productId!: string;

  @ApiProperty({
    enum: ProductDeliveryType,
    description: 'Delivery type',
  })
  deliveryType!: ProductDeliveryType;

  @ApiPropertyOptional({
    description: 'Masked preview of item',
    example: 'XXXX-****-****-XXXX',
  })
  maskedPreview?: string;

  @ApiProperty({
    enum: InventoryItemStatus,
    description: 'Item status',
  })
  status!: InventoryItemStatus;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Supplier name' })
  supplier?: string;

  @ApiPropertyOptional({ description: 'Cost' })
  cost?: number;

  @ApiPropertyOptional({ description: 'Admin notes' })
  notes?: string;

  @ApiProperty({ description: 'Upload date' })
  uploadedAt!: Date;

  @ApiPropertyOptional({ description: 'Uploader admin ID' })
  uploadedById?: string;

  @ApiPropertyOptional({ description: 'Sold date' })
  soldAt?: Date;

  @ApiPropertyOptional({ description: 'Sold price' })
  soldPrice?: number;

  @ApiPropertyOptional({ description: 'Order ID if sold' })
  soldToOrderId?: string;

  @ApiPropertyOptional({ description: 'Was reported invalid' })
  wasReported?: boolean;
}

/**
 * Response DTO for inventory statistics
 */
export class InventoryStatsDto {
  @ApiProperty({ description: 'Total items' })
  total!: number;

  @ApiProperty({ description: 'Available items' })
  available!: number;

  @ApiProperty({ description: 'Reserved items' })
  reserved!: number;

  @ApiProperty({ description: 'Sold items' })
  sold!: number;

  @ApiProperty({ description: 'Expired items' })
  expired!: number;

  @ApiProperty({ description: 'Invalid items' })
  invalid!: number;

  @ApiProperty({ description: 'Total acquisition cost' })
  totalCost!: number;

  @ApiProperty({ description: 'Average cost per item' })
  avgCost!: number;

  @ApiProperty({ description: 'Total revenue from sold items' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Total profit (revenue - cost)' })
  totalProfit!: number;
}

/**
 * Response DTO for bulk import result
 */
export class BulkImportResultDto {
  @ApiProperty({ description: 'Successfully imported count' })
  imported!: number;

  @ApiProperty({ description: 'Skipped duplicates count' })
  skippedDuplicates!: number;

  @ApiProperty({ description: 'Failed count' })
  failed!: number;

  @ApiProperty({
    description: 'Error messages for failed items',
    type: [String],
  })
  errors!: string[];
}

/**
 * Paginated inventory response
 */
export class PaginatedInventoryDto {
  @ApiProperty({
    description: 'Items',
    type: [InventoryItemResponseDto],
  })
  data!: InventoryItemResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages!: number;
}
