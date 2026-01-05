import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ default: 'demo-product', example: 'demo-product' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ required: false, example: 'Demo order' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, description: 'Cloudflare Turnstile CAPTCHA token for bot protection' })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ description: 'Product title/name for display' })
  productTitle!: string;

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

  @ApiProperty({ type: [OrderItemResponseDto] })
  @Type(() => OrderItemResponseDto)
  items!: OrderItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
