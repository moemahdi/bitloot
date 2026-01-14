import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Item in order creation request
 */
export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID (UUID)', example: '52b45262-731b-4730-a409-709e1bd16797' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity (default: 1)', example: 1, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ 
    description: 'Single product ID (for backward compatibility)',
    default: 'demo-product', 
    example: 'demo-product',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @ApiProperty({
    description: 'Array of items to order (use this for multi-item orders)',
    type: [CreateOrderItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiProperty({ required: false, example: 'Demo order' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, description: 'Cloudflare Turnstile CAPTCHA token for bot protection' })
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Idempotency key (cart hash) to prevent duplicate order creation. If provided, duplicate requests with the same key within 5 minutes will return the existing order instead of creating a new one.',
    example: 'cart-hash-abc123'
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ description: 'Product title/name for display' })
  productTitle!: string;

  @ApiProperty({ description: 'Product slug for navigation', required: false, type: String, nullable: true })
  productSlug?: string | null;

  @ApiProperty({ description: 'Quantity of this item', example: 1 })
  quantity!: number;

  @ApiProperty({ description: 'Unit price in EUR at time of purchase', example: '29.99' })
  unitPrice!: string;

  @ApiProperty({
    description: 'Fulfillment source for this item',
    enum: ['custom', 'kinguin'],
    example: 'custom',
  })
  sourceType!: 'custom' | 'kinguin';

  @ApiProperty({ nullable: true })
  signedUrl?: string | null;
}

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description: 'Overall order fulfillment source',
    enum: ['custom', 'kinguin'],
    example: 'custom',
  })
  sourceType!: 'custom' | 'kinguin';

  @ApiProperty({
    description: 'Kinguin reservation ID (present when sourceType is kinguin)',
    required: false,
  })
  kinguinReservationId?: string;

  @ApiProperty()
  total!: string;

  @ApiProperty({
    description: 'Session token for immediate key access (valid 1 hour). Only included on order creation.',
    required: false,
  })
  orderSessionToken?: string;

  @ApiProperty({
    description: 'Cryptocurrency used for payment (e.g., btc, eth, ltc)',
    required: false,
    example: 'btc',
  })
  payCurrency?: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  @ApiProperty({ description: 'Creation timestamp in ISO 8601 format (UTC)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp in ISO 8601 format (UTC)' })
  updatedAt!: string;
}

/**
 * User order statistics - calculated directly from database for accuracy
 */
export class UserOrderStatsDto {
  @ApiProperty({ description: 'Total number of orders', example: 151 })
  totalOrders!: number;

  @ApiProperty({ description: 'Number of completed (fulfilled) orders', example: 66 })
  completedOrders!: number;

  @ApiProperty({ description: 'Number of pending orders (waiting, confirming)', example: 5 })
  pendingOrders!: number;

  @ApiProperty({ description: 'Number of processing orders (paid, awaiting fulfillment)', example: 3 })
  processingOrders!: number;

  @ApiProperty({ description: 'Number of failed/expired/underpaid orders', example: 10 })
  failedOrders!: number;

  @ApiProperty({ description: 'Total amount spent on fulfilled orders (EUR)', example: '3243.11' })
  totalSpent!: string;

  @ApiProperty({ description: 'Number of digital downloads (items from fulfilled orders)', example: 40 })
  digitalDownloads!: number;
}
