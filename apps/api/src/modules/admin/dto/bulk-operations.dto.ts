import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray, IsUUID, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { AdminOrderStatus } from './update-order-status.dto';

/**
 * Status count item for analytics
 */
export class StatusCountDto {
  @ApiProperty({ description: 'Order status', example: 'fulfilled' })
  status!: string;

  @ApiProperty({ description: 'Number of orders with this status', example: 42 })
  count!: number;
}

/**
 * Source type count item for analytics
 */
export class SourceTypeCountDto {
  @ApiProperty({ description: 'Source type', example: 'kinguin' })
  sourceType!: string;

  @ApiProperty({ description: 'Number of orders from this source', example: 35 })
  count!: number;
}

/**
 * Daily volume item for analytics
 */
export class DailyVolumeDto {
  @ApiProperty({ description: 'Date in ISO format', example: '2025-01-12' })
  date!: string;

  @ApiProperty({ description: 'Number of orders on this day', example: 15 })
  count!: number;

  @ApiProperty({ description: 'Revenue on this day in EUR', example: 450.99 })
  revenue!: number;
}

/**
 * DTO for bulk status update
 * Allows updating multiple orders at once
 */
export class BulkUpdateStatusDto {
  @ApiProperty({
    description: 'Array of order IDs to update',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'At least one order ID is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 orders can be updated at once' })
  orderIds!: string[];

  @ApiProperty({
    enum: AdminOrderStatus,
    description: 'New status for all orders',
    example: 'fulfilled',
  })
  @IsEnum(AdminOrderStatus, {
    message: `Status must be one of: ${Object.values(AdminOrderStatus).join(', ')}`,
  })
  status!: AdminOrderStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'Bulk processing - manual verification complete',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * Response for bulk status update
 */
export class BulkUpdateStatusResponseDto {
  @ApiProperty({ description: 'Number of orders successfully updated' })
  updated!: number;

  @ApiProperty({ description: 'IDs of orders that failed to update', type: [String] })
  failed!: string[];

  @ApiProperty({ description: 'Total orders processed' })
  total!: number;
}

/**
 * Response for order analytics
 */
export class OrderAnalyticsDto {
  @ApiProperty({ description: 'Orders grouped by status', type: [StatusCountDto] })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Orders grouped by source type', type: [SourceTypeCountDto] })
  bySourceType!: SourceTypeCountDto[];

  @ApiProperty({ description: 'Daily order volume for the last 30 days', type: [DailyVolumeDto] })
  dailyVolume!: DailyVolumeDto[];

  @ApiProperty({ description: 'Average order value in EUR', example: 29.99 })
  averageOrderValue!: number;

  @ApiProperty({ description: 'Total orders in period', example: 158 })
  totalOrders!: number;

  @ApiProperty({ description: 'Total revenue in period', example: 4538.42 })
  totalRevenue!: number;

  @ApiProperty({ description: 'Fulfillment rate percentage (0-100)', example: 85.5 })
  fulfillmentRate!: number;

  @ApiProperty({ description: 'Failed order rate percentage (0-100)', example: 2.3 })
  failedRate!: number;
}
