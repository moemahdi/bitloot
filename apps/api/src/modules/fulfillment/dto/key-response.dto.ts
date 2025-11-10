import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsISO8601, IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO for license key delivery response
 *
 * Returned when a key is retrieved and ready for delivery to the customer.
 * Contains the encrypted key, expiry information, and access metadata.
 */
export class KeyResponseDto {
  /**
   * Order ID associated with this key
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
   * Encrypted license key (base64 encoded)
   *
   * Encrypted using AES-256-GCM with securely stored key.
   * Client should decrypt with the provided encryption metadata.
   *
   * @example "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
   */
  @ApiProperty({
    description: 'Encrypted key (base64)',
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  })
  @IsNotEmpty()
  @IsString()
  encryptedKey!: string;

  /**
   * Encryption IV (Initialization Vector, base64 encoded)
   *
   * Used to decrypt the key. Unique for each encryption operation.
   *
   * @example "NzY1ZDQ4ZDEtYTFiYS00ZWY0LWJkYzctYTI0ZjYyMWJhYjEy"
   */
  @ApiProperty({
    description: 'Encryption IV (base64)',
    example: 'NzY1ZDQ4ZDEtYTFiYS00ZWY0LWJkYzctYTI0ZjYyMWJhYjEy',
  })
  @IsNotEmpty()
  @IsString()
  encryptionIv!: string;

  /**
   * Encryption algorithm used
   *
   * Fixed to 'aes-256-gcm' for this API version
   *
   * @example "aes-256-gcm"
   */
  @ApiProperty({
    description: 'Encryption algorithm',
    example: 'aes-256-gcm',
    enum: ['aes-256-gcm'],
  })
  @IsString()
  algorithm!: string;

  /**
   * Authentication tag (base64 encoded)
   *
   * Used in AES-GCM for authenticated encryption.
   * Ensures key integrity during decryption.
   *
   * @example "dGVzdC1hdXRoLXRhZw=="
   */
  @ApiProperty({
    description: 'Authentication tag (base64)',
    example: 'dGVzdC1hdXRoLXRhZw==',
  })
  @IsNotEmpty()
  @IsString()
  authTag!: string;

  /**
   * URL to download the key (alternative to direct response)
   *
   * Signed URL that expires in 15 minutes. Customer can download
   * the key file directly from R2 storage.
   *
   * @example "https://r2-example.example.com/keys/550e8400.json?signature=xyz&expires=1234567890"
   */
  @ApiProperty({
    description: 'Signed download URL (expires in 15 min)',
    example: 'https://r2-example.example.com/keys/550e8400.json?signature=xyz&expires=1234567890',
  })
  @IsNotEmpty()
  @IsString()
  downloadUrl!: string;

  /**
   * Timestamp when the link expires (Unix timestamp in seconds)
   *
   * Customer must download/decrypt before this time.
   * Default expiry: 15 minutes from issue
   *
   * @example 1699467600
   */
  @ApiProperty({
    description: 'URL expiry timestamp (Unix seconds)',
    example: 1699467600,
  })
  @IsInt()
  @Min(0)
  expiresAt!: number;

  /**
   * Time remaining before expiry (in seconds)
   *
   * Convenience field for client-side countdown timers
   *
   * @example 900
   */
  @ApiProperty({
    description: 'Seconds until expiry',
    example: 900,
  })
  @IsInt()
  @Min(0)
  expiresIn!: number;

  /**
   * ISO8601 timestamp of when key was delivered
   *
   * @example "2025-11-08T14:00:00Z"
   */
  @ApiProperty({
    description: 'Delivery timestamp (ISO8601)',
    example: '2025-11-08T14:00:00Z',
  })
  @IsISO8601()
  deliveredAt!: string;
}
