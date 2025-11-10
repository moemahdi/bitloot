import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for manual key delivery (admin only)
 *
 * Allows admins to manually deliver a key to a customer's order
 * if automatic fulfillment fails.
 *
 * This is an emergency recovery flow - normal flow uses automatic fulfillment.
 */
export class DeliverKeyDto {
  /**
   * The license key to deliver
   *
   * Provide the raw key. It will be encrypted before storage.
   * Do not include this in normal user requests - admins only.
   *
   * @example "XXXXX-XXXXX-XXXXX-XXXXX"
   */
  @ApiProperty({
    description: 'License key to deliver (admin only)',
    example: 'XXXXX-XXXXX-XXXXX-XXXXX',
  })
  @IsNotEmpty({ message: 'key is required' })
  @IsString({ message: 'key must be a string' })
  key!: string;

  /**
   * Optional note explaining why manual delivery is needed
   *
   * Recorded in audit trail for compliance
   *
   * @example "Kinguin API was down, manually retrieved key"
   */
  @ApiProperty({
    description: 'Reason for manual delivery',
    example: 'Kinguin API was down, manually retrieved key',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  reason?: string;

  /**
   * Admin user ID performing this action
   *
   * Populated by middleware from JWT token, not provided by client
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Admin user ID (from auth token)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  adminId?: string;
}
