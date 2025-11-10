import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsISO8601,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsOptional,
} from 'class-validator';

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
