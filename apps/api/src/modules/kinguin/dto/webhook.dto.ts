import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Kinguin eCommerce API Webhook Event Names
 * @see https://gateway.kinguin.net/esa/api - Webhooks documentation
 */
export type KinguinWebhookEventName = 'order.status' | 'order.complete' | 'product.update';

/**
 * Kinguin Order Status values from eCommerce API
 * @see api/order/v1/README.md#order-statuses
 */
export type KinguinOrderStatus =
  | 'processing'
  | 'completed'
  | 'canceled'
  | 'refunded';

/**
 * Order Status Changed Webhook DTO
 *
 * Triggered when an order status changes in Kinguin eCommerce API.
 *
 * Headers:
 * - X-Event-Name: 'order.status'
 * - X-Event-Secret: Your configured secret key
 *
 * @example
 * {
 *   "orderId": "PHS84FJAG5U",
 *   "orderExternalId": "AL2FEEHOO2OHF",
 *   "status": "completed",
 *   "updatedAt": "2020-10-16T11:24:08.025+00:00"
 * }
 *
 * @see KinguinController.handleWebhook()
 */
export class OrderStatusWebhookDto {
  /**
   * Kinguin Order ID
   * @example "PHS84FJAG5U"
   */
  @ApiProperty({
    description: 'Kinguin Order ID',
    example: 'PHS84FJAG5U',
  })
  @IsString()
  orderId!: string;

  /**
   * Your external order ID (if provided when placing order)
   * @example "AL2FEEHOO2OHF"
   */
  @ApiProperty({
    description: 'Order external ID (your reference)',
    example: 'AL2FEEHOO2OHF',
    required: false,
  })
  @IsString()
  @IsOptional()
  orderExternalId?: string;

  /**
   * Current order status
   *
   * Values:
   * - processing: Order is waiting for delivering the keys
   * - completed: Order is completed (all keys have been delivered)
   * - canceled: Order has been canceled
   * - refunded: Order has been refunded
   *
   * @example "completed"
   */
  @ApiProperty({
    description: 'Order status',
    enum: ['processing', 'completed', 'canceled', 'refunded'],
    example: 'completed',
  })
  @IsEnum(['processing', 'completed', 'canceled', 'refunded'])
  status!: KinguinOrderStatus;

  /**
   * Timestamp of the status change (ISO 8601 format)
   * @example "2020-10-16T11:24:08.025+00:00"
   */
  @ApiProperty({
    description: 'Date of change in ISO 8601 format',
    example: '2020-10-16T11:24:08.025+00:00',
  })
  @IsString()
  updatedAt!: string;
}

/**
 * Product Updated Webhook DTO
 *
 * Triggered when a product changes, becomes out of stock, or a new offer becomes available.
 *
 * Headers:
 * - X-Event-Name: 'product.update'
 * - X-Event-Secret: Your configured secret key
 *
 * @example
 * {
 *   "kinguinId": 1949,
 *   "productId": "5c9b5f6b2539a4e8f172916a",
 *   "qty": 845,
 *   "textQty": 845,
 *   "cheapestOfferId": ["611222acff9ca40001f0b020"],
 *   "updatedAt": "2020-10-16T11:24:08.015+00:00"
 * }
 *
 * @see KinguinController.handleWebhook()
 */
export class ProductUpdateWebhookDto {
  /**
   * Kinguin Product ID (integer)
   * @example 1949
   */
  @ApiProperty({
    description: 'Kinguin Product ID',
    example: 1949,
  })
  @IsNumber()
  kinguinId!: number;

  /**
   * Product ID (MongoDB ObjectId string)
   * @example "5c9b5f6b2539a4e8f172916a"
   */
  @ApiProperty({
    description: 'Product ID (string)',
    example: '5c9b5f6b2539a4e8f172916a',
  })
  @IsString()
  productId!: string;

  /**
   * Total quantity from the cheapest offers
   * @example 845
   */
  @ApiProperty({
    description: 'Total quantity from the cheapest offers',
    example: 845,
  })
  @IsNumber()
  qty!: number;

  /**
   * Quantity of text-type serials
   * @example 845
   */
  @ApiProperty({
    description: 'Quantity of text type serials',
    example: 845,
  })
  @IsNumber()
  textQty!: number;

  /**
   * List of cheapest offer IDs
   * @example ["611222acff9ca40001f0b020"]
   */
  @ApiProperty({
    description: 'List of cheapest offer IDs',
    example: ['611222acff9ca40001f0b020'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  cheapestOfferId!: string[];

  /**
   * Timestamp of the update (ISO 8601 format)
   * @example "2020-10-16T11:24:08.015+00:00"
   */
  @ApiProperty({
    description: 'Date of change in ISO 8601 format',
    example: '2020-10-16T11:24:08.015+00:00',
  })
  @IsString()
  updatedAt!: string;
}

/**
 * @deprecated Use OrderStatusWebhookDto or ProductUpdateWebhookDto instead
 * Kept for backwards compatibility during migration
 */
export type WebhookPayloadDto = OrderStatusWebhookDto | ProductUpdateWebhookDto;
