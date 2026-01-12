import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Valid order statuses for admin override
 * Must match OrderStatus from order.entity.ts
 * Note: 'refunded' and 'cancelled' are not in the database enum but can be manually tracked
 */
export enum AdminOrderStatus {
  CREATED = 'created',
  WAITING = 'waiting',
  CONFIRMING = 'confirming',
  PAID = 'paid',
  UNDERPAID = 'underpaid',
  EXPIRED = 'expired',
  FAILED = 'failed',
  FULFILLED = 'fulfilled',
}

/**
 * DTO for updating order status via admin action
 * All status changes are logged for audit trail
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: AdminOrderStatus,
    description: 'New status for the order',
    example: 'failed',
  })
  @IsEnum(AdminOrderStatus, {
    message: `Status must be one of: ${Object.values(AdminOrderStatus).join(', ')}`,
  })
  status!: AdminOrderStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (recommended for all changes, especially refunds/failures)',
    example: 'Manual refund processed via PayPal - customer requested',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
