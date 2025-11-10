/**
 * NOWPayments IPN (Instant Payment Notification) DTOs
 * Handles webhook payloads from NOWPayments for payment status updates
 *
 * @file DTOs for webhook request/response validation
 * @module webhooks/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * NOWPayments IPN incoming webhook payload
 * Received from NOWPayments when payment status changes
 *
 * @class NowpaymentsIpnRequestDto
 *
 * @example
 * ```json
 * {
 *   "payment_id": "123456789",
 *   "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "order_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "payment_status": "finished",
 *   "price_amount": 100.00,
 *   "price_currency": "usd",
 *   "pay_amount": 0.0025,
 *   "pay_currency": "btc",
 *   "received_amount": 0.0025,
 *   "received_currency": "btc",
 *   "created_at": "2025-11-08T15:30:00Z",
 *   "updated_at": "2025-11-08T15:35:00Z"
 * }
 * ```
 */
export class NowpaymentsIpnRequestDto {
  /**
   * Unique NOWPayments payment ID
   * Used for idempotency tracking
   *
   * @type {string}
   * @example "123456789"
   */
  @ApiProperty({
    description: 'NOWPayments payment ID',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  payment_id!: string;

  /**
   * Order UUID (our system's order ID)
   * Matches the invoice_id sent to NOWPayments
   *
   * @type {string}
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Order UUID from our system',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  invoice_id!: string;

  /**
   * Duplicate of invoice_id (for NOWPayments compatibility)
   * Also maps to our order ID
   *
   * @type {string}
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Duplicate of invoice_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  order_id!: string;

  /**
   * Payment status from NOWPayments
   * Transitions: waiting → confirming → finished (success)
   * Or: failed, underpaid (error)
   *
   * @type {string}
   * @enum {string} 'waiting' | 'confirming' | 'finished' | 'failed' | 'underpaid'
   * @example "finished"
   */
  @ApiProperty({
    description: 'Payment status',
    enum: ['waiting', 'confirming', 'finished', 'failed', 'underpaid'],
    example: 'finished',
  })
  @IsString()
  @IsNotEmpty()
  payment_status!: 'waiting' | 'confirming' | 'finished' | 'failed' | 'underpaid';

  /**
   * Expected USD price amount for the order
   * Used to verify payment amount matches
   *
   * @type {number}
   * @example 100.00
   */
  @ApiProperty({
    description: 'Expected USD price amount',
    example: 100.0,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  price_amount!: number;

  /**
   * Price currency (always USD in our system)
   *
   * @type {string}
   * @example "usd"
   */
  @ApiProperty({
    description: 'Price currency',
    example: 'usd',
  })
  @IsString()
  @IsNotEmpty()
  price_currency!: string;

  /**
   * Amount paid in cryptocurrency
   * Exact amount user sent to payment address
   *
   * @type {number}
   * @example 0.0025
   */
  @ApiProperty({
    description: 'Crypto amount paid',
    example: 0.0025,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  pay_amount!: number;

  /**
   * Cryptocurrency currency code
   * Examples: btc, eth, xrp, etc.
   *
   * @type {string}
   * @example "btc"
   */
  @ApiProperty({
    description: 'Cryptocurrency code',
    example: 'btc',
  })
  @IsString()
  @IsNotEmpty()
  pay_currency!: string;

  /**
   * Amount actually received by NOWPayments
   * May differ from pay_amount due to network fees
   *
   * @type {number}
   * @example 0.0025
   */
  @ApiProperty({
    description: 'Amount received after fees',
    example: 0.0025,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  received_amount!: number;

  /**
   * Cryptocurrency received in
   * (may differ if converted)
   *
   * @type {string}
   * @example "btc"
   */
  @ApiProperty({
    description: 'Crypto currency received',
    example: 'btc',
  })
  @IsString()
  @IsNotEmpty()
  received_currency!: string;

  /**
   * Payment creation timestamp (ISO 8601)
   *
   * @type {string}
   * @example "2025-11-08T15:30:00Z"
   */
  @ApiProperty({
    description: 'Payment created at',
    example: '2025-11-08T15:30:00Z',
  })
  @IsString()
  @IsNotEmpty()
  created_at!: string;

  /**
   * Payment last updated timestamp (ISO 8601)
   *
   * @type {string}
   * @example "2025-11-08T15:35:00Z"
   */
  @ApiProperty({
    description: 'Payment updated at',
    example: '2025-11-08T15:35:00Z',
  })
  @IsString()
  @IsNotEmpty()
  updated_at!: string;

  /**
   * Optional NOWPayments reference or tracking info
   * May include additional payment metadata
   *
   * @type {string | undefined}
   * @optional
   */
  @ApiProperty({
    description: 'Optional NOWPayments reference',
    required: false,
  })
  @IsString()
  @IsOptional()
  reference?: string;
}

/**
 * IPN webhook response DTO
 * Always returns 200 OK to prevent NOWPayments retry loops
 * Never exposes internal error details to webhook caller
 *
 * @class NowpaymentsIpnResponseDto
 *
 * @example
 * ```json
 * {
 *   "ok": true,
 *   "message": "Webhook received and processed",
 *   "processed": true,
 *   "webhookId": "webhook-log-uuid"
 * }
 * ```
 */
export class NowpaymentsIpnResponseDto {
  /**
   * Success flag (always true to accept webhook)
   *
   * @type {boolean}
   * @example true
   */
  @ApiProperty({
    description: 'Webhook received successfully',
    example: true,
  })
  ok!: boolean;

  /**
   * Human-readable message
   * Generic message for security (never expose internal errors)
   *
   * @type {string}
   * @example "Webhook received and processed"
   */
  @ApiProperty({
    description: 'Response message',
    example: 'Webhook received and processed',
  })
  message!: string;

  /**
   * Whether webhook was actually processed
   * False if it was a duplicate or error occurred
   *
   * @type {boolean}
   * @example true
   */
  @ApiProperty({
    description: 'Whether webhook was processed',
    example: true,
  })
  processed!: boolean;

  /**
   * Webhook log UUID for audit trail
   * Can be used for debugging/support inquiries
   *
   * @type {string}
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Webhook log ID for audit trail',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  webhookId!: string;
}

/**
 * Webhook processing result (internal use)
 * Used to store result details in webhook_logs table
 *
 * @interface WebhookProcessingResult
 */
export interface WebhookProcessingResult {
  /**
   * Whether processing succeeded
   */
  success: boolean;

  /**
   * Human-readable result message
   */
  message?: string;

  /**
   * Error description (if failed)
   */
  error?: string;

  /**
   * Order ID that was updated (if applicable)
   */
  orderId?: string;

  /**
   * Previous order status
   */
  previousStatus?: string;

  /**
   * New order status after processing
   */
  newStatus?: string;

  /**
   * Whether fulfillment was triggered
   */
  fulfillmentTriggered?: boolean;
}

/**
 * Payment status enum for consistent state management
 */
export enum PaymentStatus {
  WAITING = 'waiting',
  CONFIRMING = 'confirming',
  FINISHED = 'finished',
  FAILED = 'failed',
  UNDERPAID = 'underpaid',
}

/**
 * Order status enum (payment-related states)
 * Maps from PaymentStatus to OrderStatus
 */
export enum OrderPaymentStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  PAID = 'paid',
  FAILED = 'failed',
  UNDERPAID = 'underpaid',
}
