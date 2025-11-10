import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsISO8601 } from 'class-validator';
import type { OrderStatus } from '../../orders/order.entity';

/**
 * DTO for fulfillment process status
 *
 * Maps to FulfillmentService.checkStatus() return type.
 * Tracks the progress of order fulfillment.
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
   * Current order status
   *
   * Inherited from Order entity status field.
   * Values: created, waiting, confirming, paid, underpaid, failed, fulfilled
   *
   * @example "paid"
   */
  @ApiProperty({
    description: 'Current order status',
    example: 'paid',
  })
  @IsString()
  status!: OrderStatus;

  /**
   * Number of items fulfilled
   *
   * @example 2
   */
  @ApiProperty({
    description: 'Number of items fulfilled',
    example: 2,
  })
  @IsNumber()
  itemsFulfilled!: number;

  /**
   * Total number of items in order
   *
   * @example 3
   */
  @ApiProperty({
    description: 'Total number of items in order',
    example: 3,
  })
  @IsNumber()
  itemsTotal!: number;

  /**
   * Whether all items are fulfilled
   *
   * @example true
   */
  @ApiProperty({
    description: 'Whether all items are fulfilled',
    example: true,
  })
  @IsBoolean()
  allFulfilled!: boolean;

  /**
   * Last update timestamp
   *
   * @example "2025-11-10T15:30:00.000Z"
   */
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-10T15:30:00.000Z',
  })
  @IsISO8601()
  updatedAt!: Date;
}
