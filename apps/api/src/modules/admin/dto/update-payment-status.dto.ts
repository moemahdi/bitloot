import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Valid payment statuses for manual override
 * Note: 'created' and 'waiting' are initial states - can only move forward
 */
export const PAYMENT_STATUSES = ['confirmed', 'finished', 'underpaid', 'failed'] as const;
export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number];

/**
 * DTO for manual payment status override by admin
 * Used for support edge cases where automatic status detection fails
 */
export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'New payment status',
    enum: PAYMENT_STATUSES,
    example: 'finished',
  })
  @IsEnum(PAYMENT_STATUSES, {
    message: `Status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
  })
  status!: PaymentStatusType;

  @ApiProperty({
    description: 'Reason for manual status change (required for audit trail)',
    example: 'Customer confirmed payment via support ticket #12345',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters for audit purposes' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason!: string;
}

/**
 * Response DTO for payment status update
 */
export class UpdatePaymentStatusResponseDto {
  @ApiProperty({ description: 'Whether the update was successful' })
  success!: boolean;

  @ApiProperty({ description: 'Updated payment ID' })
  paymentId!: string;

  @ApiProperty({ description: 'Previous status' })
  previousStatus!: string;

  @ApiProperty({ description: 'New status' })
  newStatus!: string;

  @ApiProperty({ description: 'Admin who made the change' })
  changedBy!: string;

  @ApiProperty({ description: 'Timestamp of the change' })
  changedAt!: Date;
}
