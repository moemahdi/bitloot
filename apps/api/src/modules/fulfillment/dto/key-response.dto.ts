import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsISO8601,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// DELIVERY CONTENT DTOs (for structured delivery)
// ============================================

/**
 * A single item in the delivery content
 * Displayed to customer after purchase
 */
export class DeliveryContentItemDto {
  @ApiProperty({
    description: 'Type of delivery item',
    enum: ['key', 'credential', 'code', 'license', 'info', 'custom'],
    example: 'key',
  })
  @IsString()
  type!: 'key' | 'credential' | 'code' | 'license' | 'info' | 'custom';

  @ApiProperty({
    description: 'Label for the item (displayed to customer)',
    example: 'Activation Key',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    description: 'Value of the item',
    example: 'XXXXX-XXXXX-XXXXX-XXXXX',
  })
  @IsString()
  value!: string;

  @ApiPropertyOptional({
    description: 'Whether this item is sensitive (should be masked by default)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;
}

/**
 * Complete structured delivery content for an order item
 */
export class DeliveryContentDto {
  @ApiProperty({
    description: 'Product title',
    example: 'Game Title - Steam Key',
  })
  @IsString()
  productTitle!: string;

  @ApiProperty({
    description: 'Delivery type',
    enum: ['key', 'account', 'code', 'license', 'bundle', 'custom'],
    example: 'key',
  })
  @IsString()
  deliveryType!: 'key' | 'account' | 'code' | 'license' | 'bundle' | 'custom';

  @ApiPropertyOptional({
    description: 'Special instructions for using the product',
    example: 'Redeem on Steam client > Games > Activate a Product',
  })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiProperty({
    description: 'When the item was delivered (ISO date)',
    example: '2026-02-04T12:00:00Z',
  })
  @IsString()
  deliveredAt!: string;

  @ApiProperty({
    description: 'Array of delivery items (keys, credentials, etc.)',
    type: [DeliveryContentItemDto],
  })
  @IsArray()
  items!: DeliveryContentItemDto[];

  @ApiPropertyOptional({
    description: 'Additional notes for the customer',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Face value for gift cards/codes',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  faceValue?: number;

  @ApiPropertyOptional({
    description: 'Currency for face value',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'URL for activating the product',
    example: 'https://store.steampowered.com/account/registerkey',
  })
  @IsOptional()
  @IsString()
  activationUrl?: string;
}

/**
 * DTO for delivery link response
 *
 * Returned by generateDeliveryLink() endpoint.
 * Contains pre-signed URL for downloading encrypted keys from R2.
 */
export class DeliveryLinkDto {
  /**
   * Order ID
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  orderId!: string;

  /**
   * Pre-signed download URL from Cloudflare R2
   *
   * Signed URL that expires in 15 minutes. Customer can download
   * the encrypted keys file directly from R2 storage.
   *
   * @example "https://r2-example.example.com/orders/550e8400.json?signature=xyz&expires=..."
   */
  @ApiProperty({
    description: 'Signed download URL (expires in 15 min)',
    example: 'https://r2-example.example.com/orders/550e8400.json?signature=xyz',
  })
  @IsNotEmpty()
  @IsString()
  signedUrl!: string;

  /**
   * Timestamp when the URL expires (ISO8601 format)
   *
   * Customer must download before this time.
   * Default expiry: 15 minutes from issue
   *
   * @example "2025-11-08T14:15:00Z"
   */
  @ApiProperty({
    description: 'URL expiry timestamp (ISO8601)',
    example: '2025-11-08T14:15:00Z',
  })
  @IsISO8601()
  expiresAt!: Date;

  /**
   * Number of items available for download
   *
   * Corresponds to order items that have been fulfilled.
   *
   * @example 3
   */
  @ApiProperty({
    description: 'Number of items available',
    example: 3,
  })
  @IsNumber()
  itemCount!: number;

  /**
   * User-friendly delivery message
   *
   * @example "Your order is ready for download. Link expires in 15 minutes."
   */
  @ApiProperty({
    description: 'Delivery message',
    example: 'Your order is ready for download. Link expires in 15 minutes.',
  })
  @IsString()
  message!: string;
}

/**
 * DTO for revealed key response
 *
 * Returned by revealKey() endpoint.
 * Contains decrypted license key and access metadata.
 */
export class RevealedKeyDto {
  /**
   * Order ID
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  orderId!: string;

  /**
   * Item ID within the order
   *
   * @example "4f5d7890-1234-5678-9abc-def012345678"
   */
  @ApiProperty({
    description: 'Item ID',
    example: '4f5d7890-1234-5678-9abc-def012345678',
  })
  @IsNotEmpty()
  @IsString()
  itemId!: string;

  /**
   * Decrypted license key (plaintext)
   *
   * This is the actual license key decrypted from R2 storage.
   * Keep this safe and do not share.
   *
   * For image content types (image/jpeg, image/png, image/gif),
   * this will contain base64-encoded image data.
   *
   * @example "KEY-ABC123XYZ789"
   */
  @ApiProperty({
    description: 'Decrypted license key',
    example: 'KEY-ABC123XYZ789',
  })
  @IsNotEmpty()
  @IsString()
  plainKey!: string;

  /**
   * Content type of the key data
   *
   * Indicates the format of the plainKey field:
   * - 'text/plain': Standard text license key
   * - 'image/jpeg': Base64-encoded JPEG image
   * - 'image/png': Base64-encoded PNG image
   * - 'image/gif': Base64-encoded GIF image
   *
   * @example "text/plain"
   */
  @ApiProperty({
    description: 'Content type of the key data (text/plain, image/jpeg, image/png, image/gif)',
    example: 'text/plain',
  })
  @IsNotEmpty()
  @IsString()
  contentType!: string;

  /**
   * Timestamp when the key was revealed (ISO8601)
   *
   * @example "2025-11-08T14:00:00Z"
   */
  @ApiProperty({
    description: 'Key revelation timestamp (ISO8601)',
    example: '2025-11-08T14:00:00Z',
  })
  @IsISO8601()
  revealedAt!: Date;

  /**
   * Timestamp when the key expires (ISO8601)
   *
   * Key is no longer accessible after this time.
   *
   * @example "2025-11-08T14:15:00Z"
   */
  @ApiProperty({
    description: 'Key expiration timestamp (ISO8601)',
    example: '2025-11-08T14:15:00Z',
  })
  @IsISO8601()
  expiresAt!: Date;

  /**
   * Number of times this key has been accessed
   *
   * @example 1
   */
  @ApiProperty({
    description: 'Number of times accessed',
    example: 1,
  })
  @IsNumber()
  downloadCount!: number;

  /**
   * Access information for audit trail
   *
   * Captures client details when key was revealed
   */
  @ApiProperty({
    description: 'Access information',
    example: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  })
  accessInfo!: { ipAddress: string; userAgent: string };

  /**
   * Structured delivery content for custom products
   *
   * Present when the delivery contains structured data (accounts, codes, bundles)
   * instead of a simple key string. When present, `plainKey` will contain
   * the JSON-stringified version for backward compatibility.
   */
  @ApiPropertyOptional({
    description: 'Structured delivery content for custom products',
    type: () => DeliveryContentDto,
  })
  @ValidateNested()
  @Type(() => DeliveryContentDto)
  deliveryContent?: DeliveryContentDto;
}

/**
 * DTO for health check response
 *
 * Returned by healthCheck() endpoint.
 * Indicates the operational status of the fulfillment service.
 */
export class HealthCheckResultDto {
  /**
   * Service identifier
   *
   * @example "FulfillmentService"
   */
  @ApiProperty({
    description: 'Service name',
    example: 'FulfillmentService',
  })
  @IsString()
  service!: string;

  /**
   * Service health status
   *
   * - healthy: All systems operational
   * - degraded: Some systems operational
   * - unhealthy: Service not operational
   *
   * @example "healthy"
   */
  @ApiProperty({
    description: 'Health status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy'],
  })
  @IsEnum(['healthy', 'degraded', 'unhealthy'])
  status!: 'healthy' | 'degraded' | 'unhealthy';

  /**
   * Dependency health status
   *
   * Status of external services required for fulfillment
   */
  @ApiProperty({
    description: 'Dependency status',
    example: { r2Storage: true },
  })
  @IsObject()
  dependencies!: {
    r2Storage: boolean;
  };

  /**
   * Health check timestamp (ISO8601)
   *
   * @example "2025-11-08T14:00:00Z"
   */
  @ApiProperty({
    description: 'Check timestamp (ISO8601)',
    example: '2025-11-08T14:00:00Z',
  })
  @IsISO8601()
  timestamp!: Date;

  /**
   * Optional error message
   *
   * Present if status is degraded or unhealthy
   *
   * @example "R2 storage connection timeout"
   */
  @ApiProperty({
    description: 'Error message (if any)',
    example: 'R2 storage connection timeout',
    required: false,
  })
  @IsOptional()
  @IsString()
  error?: string;
}
