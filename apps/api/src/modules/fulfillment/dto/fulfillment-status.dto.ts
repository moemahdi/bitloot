import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsISO8601 } from 'class-validator';

/**
 * Fulfillment process status enumeration
 *
 * Represents the stages of order fulfillment after payment
 */
export enum FulfillmentStatusEnum {
  PENDING = 'pending',
  CREATING_KINGUIN_ORDER = 'creating_kinguin_order',
  WAITING_FOR_KEY = 'waiting_for_key',
  ENCRYPTING_KEY = 'encrypting_key',
  UPLOADING_TO_STORAGE = 'uploading_to_storage',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * DTO for fulfillment process status
 *
 * Tracks the progress of order fulfillment from Kinguin order creation
 * through key encryption, storage, and delivery.
 */
export class FulfillmentStatusDto {
  /**
   * Order ID
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  orderId!: string;

  /**
   * Current fulfillment status
   *
   * - `pending`: Awaiting fulfillment to begin
   * - `creating_kinguin_order`: Creating order on Kinguin
   * - `waiting_for_key`: Waiting for Kinguin to provide key
   * - `encrypting_key`: Encrypting the key
   * - `uploading_to_storage`: Uploading encrypted key to R2
   * - `completed`: Fulfillment complete, key ready for delivery
   * - `failed`: Fulfillment failed, cannot proceed
   *
   * @example "waiting_for_key"
   */
  @ApiProperty({
    description: 'Current fulfillment stage',
    enum: FulfillmentStatusEnum,
    example: FulfillmentStatusEnum.WAITING_FOR_KEY,
  })
  @IsEnum(FulfillmentStatusEnum, {
    message: 'status must be a valid FulfillmentStatus',
  })
  status!: FulfillmentStatusEnum;

  /**
   * Kinguin order ID (if order created on Kinguin)
   *
   * @example "kinguin-order-789"
   */
  @ApiProperty({
    description: 'Kinguin order ID',
    example: 'kinguin-order-789',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  kinguinOrderId?: string | null;

  /**
   * Progress percentage (0-100)
   *
   * Estimated progress through fulfillment pipeline
   *
   * @example 75
   */
  @ApiProperty({
    description: 'Fulfillment progress (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  progress!: number;

  /**
   * Error message (only if status is 'failed')
   *
   * Human-readable explanation of what went wrong
   *
   * @example "Kinguin API returned: Out of stock"
   */
  @ApiProperty({
    description: 'Error message if failed',
    example: 'Kinguin API returned: Out of stock',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string | null;

  /**
   * ISO8601 timestamp when fulfillment started
   *
   * @example "2025-11-08T14:00:00Z"
   */
  @ApiProperty({
    description: 'Fulfillment start time (ISO8601)',
    example: '2025-11-08T14:00:00Z',
  })
  @IsISO8601()
  startedAt!: string;

  /**
   * ISO8601 timestamp when fulfillment completed or failed
   *
   * @example "2025-11-08T14:05:00Z"
   */
  @ApiProperty({
    description: 'Fulfillment end time (ISO8601)',
    example: '2025-11-08T14:05:00Z',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  completedAt?: string | null;

  /**
   * Time taken to complete or fail (in seconds)
   *
   * Calculated from startedAt to completedAt
   *
   * @example 300
   */
  @ApiProperty({
    description: 'Duration in seconds',
    example: 300,
    nullable: true,
    required: false,
  })
  @IsOptional()
  durationSeconds?: number | null;
}
