import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsNotEmpty, IsString, IsUUID, IsOptional, IsEmail } from 'class-validator';

/**
 * Create payment request DTO
 *
 * Sent by frontend to initiate a payment with NOWPayments.
 * Maps order data to NOWPayments invoice creation parameters.
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Order ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Total price amount',
    example: '49.99',
  })
  @IsDecimal({ decimal_digits: '1,8' })
  @IsNotEmpty()
  priceAmount!: string;

  @ApiProperty({
    description: 'Price currency (fiat)',
    example: 'eur',
  })
  @IsString()
  @IsNotEmpty()
  priceCurrency!: string;

  @ApiProperty({
    description: 'Cryptocurrency to accept (optional, user chooses at payment page)',
    example: 'btc',
    required: false,
  })
  @IsString()
  @IsOptional()
  payCurrency?: string;
}

/**
 * Create payment response DTO
 *
 * Returned when payment is successfully created with NOWPayments.
 * Contains invoice URL and payment details for frontend.
 */
export class PaymentResponseDto {
  @ApiProperty({
    description: 'NOWPayments invoice ID',
    example: 123456,
  })
  invoiceId!: number;

  @ApiProperty({
    description: 'Invoice URL for customer to complete payment',
    example: 'https://nowpayments.io/invoice/...',
  })
  invoiceUrl!: string;

  @ApiProperty({
    description: 'Status tracking URL',
    example: 'https://nowpayments.io/status/...',
  })
  statusUrl!: string;

  @ApiProperty({
    description: 'Cryptocurrency payment address',
    example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  })
  payAddress!: string;

  @ApiProperty({
    description: 'Amount to pay in fiat',
    example: 49.99,
  })
  priceAmount!: number;

  @ApiProperty({
    description: 'Amount to pay in crypto',
    example: 0.001234,
  })
  payAmount!: number;

  @ApiProperty({
    description: 'Cryptocurrency code',
    example: 'btc',
  })
  payCurrency!: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'waiting',
  })
  status!: string;

  @ApiProperty({
    description: 'Payment expiration date (ISO string)',
    example: '2025-11-08T23:59:59Z',
  })
  expirationDate!: string;
}

/**
 * IPN webhook request DTO
 *
 * Sent by NOWPayments to notify about payment status changes.
 * Includes HMAC signature for verification.
 */
export class IpnRequestDto {
  @ApiProperty({
    description: 'Order ID that maps to NOWPayments invoice order_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({
    description: 'NOWPayments external payment ID (same as invoiceId)',
    example: 'fake_550e8400-...',
  })
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @ApiProperty({
    description: 'Payment status from NOWPayments (waiting, confirming, finished, failed, etc)',
    example: 'finished',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Amount paid in crypto',
    example: 0.001234,
    required: false,
  })
  @IsOptional()
  payAmount?: number;

  @ApiProperty({
    description: 'Cryptocurrency code',
    example: 'btc',
    required: false,
  })
  @IsString()
  @IsOptional()
  payCurrency?: string;

  @ApiProperty({
    description: 'Number of confirmations',
    example: 0,
    required: false,
  })
  @IsOptional()
  confirmations?: number;
}

/**
 * IPN webhook response DTO
 *
 * Response to send back to NOWPayments to acknowledge receipt.
 */
export class IpnResponseDto {
  @ApiProperty({
    description: 'Webhook processed successfully',
    example: true,
  })
  ok!: boolean;

  @ApiProperty({
    description: 'Optional message',
    example: 'Payment processed',
    required: false,
  })
  @IsOptional()
  message?: string;
}

/**
 * Embedded Payment Response DTO
 *
 * Returned when creating an embedded payment (no redirect).
 * Contains wallet address and amount for in-app display (QR code, copy).
 */
export class EmbeddedPaymentResponseDto {
  @ApiProperty({
    description: 'Internal payment ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  paymentId!: string;

  @ApiProperty({
    description: 'NOWPayments external payment ID',
    example: '839217',
  })
  externalId!: string;

  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  orderId!: string;

  @ApiProperty({
    description: 'Wallet address to send crypto to',
    example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  })
  payAddress!: string;

  @ApiProperty({
    description: 'Amount to pay in crypto',
    example: 0.001234,
  })
  payAmount!: number;

  @ApiProperty({
    description: 'Cryptocurrency code (lowercase)',
    example: 'btc',
  })
  payCurrency!: string;

  @ApiProperty({
    description: 'Amount in fiat currency',
    example: 49.99,
  })
  priceAmount!: number;

  @ApiProperty({
    description: 'Fiat currency code',
    example: 'eur',
  })
  priceCurrency!: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'waiting',
  })
  status!: string;

  @ApiProperty({
    description: 'Payment expiration date (ISO string)',
    example: '2025-01-08T23:59:59Z',
  })
  expiresAt!: string;

  @ApiProperty({
    description: 'QR code data URI for wallet apps (format: bitcoin:address?amount=X)',
    example: 'bitcoin:bc1qxy2...?amount=0.001234',
  })
  qrCodeData!: string;

  @ApiProperty({
    description: 'Estimated time for payment confirmation',
    example: '10-30 minutes',
  })
  estimatedTime!: string;
}
