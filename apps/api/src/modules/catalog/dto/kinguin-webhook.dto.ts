import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for Kinguin product.update webhook payload
 * Triggered when product is changed, becomes out of stock, or new offer available
 *
 * @see https://www.kinguin.net/integration/docs/features/Webhooks.md#product-updated-webhook
 */
export class KinguinProductUpdateDto {
  @ApiProperty({ description: 'Product ID (numeric)', example: 1949 })
  @IsNumber()
  kinguinId!: number;

  @ApiProperty({ description: 'Product ID (string)', example: '5c9b5f6b2539a4e8f172916a' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Total quantity from cheapest offers', example: 845 })
  @IsNumber()
  qty!: number;

  @ApiProperty({ description: 'Quantity of text type serials', example: 845 })
  @IsNumber()
  textQty!: number;

  @ApiPropertyOptional({
    description: 'List of cheapest offer IDs',
    type: [String],
    example: ['611222acff9ca40001f0b020'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cheapestOfferId?: string[];

  @ApiProperty({
    description: 'Date of change in format Y-m-dTH:i:s.vP',
    example: '2020-10-16T11:24:08.015+00:00',
  })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO for Kinguin order.status webhook payload
 * Triggered when an order status changes
 *
 * @see https://www.kinguin.net/integration/docs/features/Webhooks.md#order-status-changed-webhook
 */
export class KinguinOrderStatusDto {
  @ApiProperty({ description: 'Kinguin Order ID', example: 'PHS84FJAG5U' })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ description: 'External Order ID (your order ID)', example: 'AL2FEEHOO2OHF' })
  @IsString()
  @IsOptional()
  orderExternalId?: string;

  @ApiProperty({
    description: 'Order status',
    example: 'completed',
    enum: ['processing', 'completed', 'canceled', 'refunded'],
  })
  @IsString()
  status!: string;

  @ApiProperty({
    description: 'Date of change in format Y-m-dTH:i:s.vP',
    example: '2020-10-16T11:24:08.025+00:00',
  })
  @IsString()
  updatedAt!: string;
}

/**
 * Kinguin order statuses
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#order-statuses
 */
export enum KinguinOrderStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

/**
 * Kinguin key statuses
 * @see https://www.kinguin.net/integration/docs/api/order/v1/README.md#key-statuses
 */
export enum KinguinKeyStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}
