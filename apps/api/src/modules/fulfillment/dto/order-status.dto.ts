import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Order status enumeration
 *
 * Represents the lifecycle states of a Kinguin order
 */
export enum OrderStatusEnum {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * DTO for Kinguin order status response
 *
 * Returned when querying the status of an order from Kinguin.
 * Contains status information and optionally the license key if ready.
 */
export class OrderStatusDto {
  /**
   * Kinguin order identifier
   *
   * @example "order-123-abc"
   */
  @ApiProperty({
    description: 'Kinguin order ID',
    example: 'order-123-abc',
  })
  @IsString()
  id!: string;

  /**
   * Current order status
   *
   * - `waiting`: Order submitted, awaiting processing
   * - `processing`: Order being processed
   * - `ready`: Order complete, key available
   * - `failed`: Order failed, no key
   * - `cancelled`: Order cancelled
   *
   * @example "ready"
   */
  @ApiProperty({
    description: 'Order status',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.READY,
  })
  @IsEnum(OrderStatusEnum, { message: 'status must be a valid OrderStatus' })
  status!: OrderStatusEnum;

  /**
   * License key (only populated when status is 'ready')
   *
   * @example "XXXXX-XXXXX-XXXXX-XXXXX"
   */
  @ApiProperty({
    description: 'License key (only when status is ready)',
    example: 'XXXXX-XXXXX-XXXXX-XXXXX',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'key must be a string' })
  key?: string | null;

  /**
   * Error message (only populated when status is 'failed')
   *
   * @example "Out of stock"
   */
  @ApiProperty({
    description: 'Error reason (only when status is failed)',
    example: 'Out of stock',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'error must be a string' })
  error?: string | null;

  /**
   * Kinguin external order ID (for idempotency)
   *
   * @example "ext-456-def"
   */
  @ApiProperty({
    description: 'External ID for idempotency',
    example: 'ext-456-def',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'externalId must be a string' })
  externalId?: string | null;
}
