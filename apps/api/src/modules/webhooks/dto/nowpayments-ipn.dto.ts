/**
 * NOWPayments IPN (Instant Payment Notification) DTOs
 * Handles webhook payloads from NOWPayments for payment status updates
 *
 * @file DTOs for webhook request/response validation
 * @module webhooks/dto
 *
 * IMPORTANT: NOWPayments IPN payload structure varies by status and includes
 * many optional fields. This DTO is intentionally permissive to accept all
 * valid NOWPayments payloads without validation errors.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateIf,
} from 'class-validator';

/**
 * Fee breakdown object from NOWPayments
 */
export class NowPaymentsFeeDto {
  @ApiPropertyOptional({ description: 'Fee currency' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Deposit fee' })
  @IsNumber()
  @IsOptional()
  depositFee?: number;

  @ApiPropertyOptional({ description: 'Service fee' })
  @IsNumber()
  @IsOptional()
  serviceFee?: number;

  @ApiPropertyOptional({ description: 'Withdrawal fee' })
  @IsNumber()
  @IsOptional()
  withdrawalFee?: number;
}

/**
 * NOWPayments IPN incoming webhook payload
 * Received from NOWPayments when payment status changes
 *
 * @class NowpaymentsIpnRequestDto
 *
 * IMPORTANT: NOWPayments sends invoice_id as a NUMBER, not a UUID string.
 * The order_id field contains our actual order UUID.
 *
 * @example
 * ```json
 * {
 *   "payment_id": 5284800572,
 *   "invoice_id": 5208745935,
 *   "order_id": "930a98e1-b8fd-4eb0-adb2-f37df3d0bfbe",
 *   "payment_status": "finished",
 *   "price_amount": 19.5,
 *   "price_currency": "eur",
 *   "pay_amount": 0.00025524,
 *   "pay_currency": "btc",
 *   "actually_paid": 0.00025524,
 *   "outcome_amount": 0.2778371,
 *   "outcome_currency": "ltc"
 * }
 * ```
 */
export class NowpaymentsIpnRequestDto {
  /**
   * Unique NOWPayments payment ID (can be number or string)
   * Used for idempotency tracking
   */
  @ApiProperty({
    description: 'NOWPayments payment ID',
    example: 5284800572,
    oneOf: [{ type: 'number' }, { type: 'string' }],
  })
  @ValidateIf((o: unknown) => (o as Record<string, unknown>)?.payment_id !== undefined && (typeof (o as Record<string, unknown>).payment_id === 'number' || typeof (o as Record<string, unknown>).payment_id === 'string'))
  @IsNotEmpty()
  payment_id!: number | string;

  /**
   * NOWPayments invoice ID (sent as NUMBER, not UUID)
   * This is NOWPayments' internal invoice ID, NOT our order UUID
   */
  @ApiProperty({
    description: 'NOWPayments invoice ID (number)',
    example: 5208745935,
    oneOf: [{ type: 'number' }, { type: 'string' }],
  })
  @ValidateIf((o: unknown) => (o as Record<string, unknown>)?.invoice_id !== undefined && (typeof (o as Record<string, unknown>).invoice_id === 'number' || typeof (o as Record<string, unknown>).invoice_id === 'string'))
  @IsOptional()
  invoice_id?: number | string;

  /**
   * Our system's order UUID
   * This is the actual order ID we use to look up orders
   */
  @ApiProperty({
    description: 'Our order UUID',
    example: '930a98e1-b8fd-4eb0-adb2-f37df3d0bfbe',
  })
  @IsString()
  @IsNotEmpty()
  order_id!: string;

  /**
   * Payment status from NOWPayments
   * Transitions: waiting → confirming → sending → finished (success)
   * Or: failed, partially_paid, expired, refunded
   */
  @ApiProperty({
    description: 'Payment status',
    example: 'finished',
  })
  @IsString()
  @IsNotEmpty()
  payment_status!: string;

  /**
   * Expected fiat price amount for the order
   */
  @ApiProperty({
    description: 'Expected price amount',
    example: 19.5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  price_amount!: number;

  /**
   * Price currency (e.g., 'eur', 'usd')
   */
  @ApiProperty({
    description: 'Price currency',
    example: 'eur',
  })
  @IsString()
  @IsNotEmpty()
  price_currency!: string;

  // ============================================================
  // OPTIONAL FIELDS - NOWPayments sends these variably
  // ============================================================

  /**
   * Amount to pay in cryptocurrency
   */
  @ApiPropertyOptional({
    description: 'Crypto amount to pay',
    example: 0.00025524,
  })
  @IsNumber()
  @IsOptional()
  pay_amount?: number;

  /**
   * Cryptocurrency to pay with
   */
  @ApiPropertyOptional({
    description: 'Pay currency code',
    example: 'btc',
  })
  @IsString()
  @IsOptional()
  pay_currency?: string;

  /**
   * Payment address for cryptocurrency
   */
  @ApiPropertyOptional({
    description: 'Crypto payment address',
    example: '36GMdZsn5ciVZhHEyUfGyoiUmyhAdG5gn3',
  })
  @IsString()
  @IsOptional()
  pay_address?: string;

  /**
   * Amount actually paid by customer
   */
  @ApiPropertyOptional({
    description: 'Amount actually paid',
    example: 0.00025524,
  })
  @IsNumber()
  @IsOptional()
  actually_paid?: number;

  /**
   * Amount actually paid in fiat equivalent
   */
  @ApiPropertyOptional({
    description: 'Amount actually paid in fiat',
    example: 19.5,
  })
  @IsNumber()
  @IsOptional()
  actually_paid_at_fiat?: number;

  /**
   * Amount received after conversion (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Amount received after fees/conversion',
    example: 0.0025,
  })
  @IsNumber()
  @IsOptional()
  received_amount?: number;

  /**
   * Currency received in
   */
  @ApiPropertyOptional({
    description: 'Currency received',
    example: 'btc',
  })
  @IsString()
  @IsOptional()
  received_currency?: string;

  /**
   * Outcome amount (converted to payout currency)
   */
  @ApiPropertyOptional({
    description: 'Outcome amount',
    example: 0.2778371,
  })
  @IsNumber()
  @IsOptional()
  outcome_amount?: number;

  /**
   * Outcome currency (payout currency)
   */
  @ApiPropertyOptional({
    description: 'Outcome currency',
    example: 'ltc',
  })
  @IsString()
  @IsOptional()
  outcome_currency?: string;

  /**
   * Fee breakdown object
   */
  @ApiPropertyOptional({
    description: 'Fee breakdown',
    type: NowPaymentsFeeDto,
  })
  @IsObject()
  @IsOptional()
  fee?: NowPaymentsFeeDto;

  /**
   * Purchase ID from NOWPayments
   */
  @ApiPropertyOptional({
    description: 'NOWPayments purchase ID',
    example: '5489876303',
  })
  @IsOptional()
  purchase_id?: string | number;

  /**
   * Order description we sent
   */
  @ApiPropertyOptional({
    description: 'Order description',
    example: 'BitLoot Order #930a98e1',
  })
  @IsString()
  @IsOptional()
  order_description?: string;

  /**
   * Payment creation timestamp (can be ISO string or Unix timestamp)
   */
  @ApiPropertyOptional({
    description: 'Payment created at',
    example: '2025-11-08T15:30:00Z',
  })
  @IsOptional()
  created_at?: string | number;

  /**
   * Payment last updated timestamp (can be ISO string or Unix timestamp)
   */
  @ApiPropertyOptional({
    description: 'Payment updated at',
    example: 1767352373337,
  })
  @IsOptional()
  updated_at?: string | number;

  /**
   * Optional NOWPayments reference
   */
  @ApiPropertyOptional({
    description: 'Optional reference',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  /**
   * Network (blockchain) used for payment
   */
  @ApiPropertyOptional({
    description: 'Blockchain network',
    example: 'btc',
  })
  @IsString()
  @IsOptional()
  network?: string;

  /**
   * Network precision/decimals
   */
  @ApiPropertyOptional({
    description: 'Network precision',
  })
  @IsNumber()
  @IsOptional()
  network_precision?: number;

  /**
   * Burning percentage (if applicable)
   */
  @ApiPropertyOptional({
    description: 'Burning percentage',
  })
  @IsNumber()
  @IsOptional()
  burning_percent?: number;

  /**
   * Expiration date/time
   */
  @ApiPropertyOptional({
    description: 'Payment expiration',
  })
  @IsOptional()
  expiration_estimate_date?: string;

  /**
   * Whether this is a test/sandbox payment
   */
  @ApiPropertyOptional({
    description: 'Is sandbox/test payment',
  })
  @IsOptional()
  is_fixed_rate?: boolean;

  /**
   * Whether payment uses fixed rate
   */
  @ApiPropertyOptional({
    description: 'Fixed rate enabled',
  })
  @IsOptional()
  is_fee_paid_by_user?: boolean;

  /**
   * Time limit for payment (in minutes)
   */
  @ApiPropertyOptional({
    description: 'Valid until timestamp',
  })
  @IsOptional()
  valid_until?: string;

  /**
   * Payment type
   */
  @ApiPropertyOptional({
    description: 'Payment type',
  })
  @IsString()
  @IsOptional()
  type?: string;

  /**
   * Smart contract address (for token payments)
   */
  @ApiPropertyOptional({
    description: 'Smart contract address',
  })
  @IsString()
  @IsOptional()
  smart_contract?: string;

  /**
   * Extra ID for some cryptocurrencies (e.g., XRP destination tag)
   */
  @ApiPropertyOptional({
    description: 'Extra ID (e.g., XRP tag)',
  })
  @IsOptional()
  payin_extra_id?: string;

  /**
   * Parent payment ID (for split payments or refunds)
   */
  @ApiPropertyOptional({
    description: 'Parent payment ID (for split payments)',
  })
  @IsOptional()
  parent_payment_id?: number | string | null;

  /**
   * Payment extra IDs (for some cryptocurrencies)
   */
  @ApiPropertyOptional({
    description: 'Payment extra IDs',
  })
  @IsOptional()
  payment_extra_ids?: string | null;

  /**
   * Deposit ID (for some payment methods)
   */
  @ApiPropertyOptional({
    description: 'Deposit ID',
  })
  @IsOptional()
  deposit_id?: string | number | null;

  /**
   * Sender address
   */
  @ApiPropertyOptional({
    description: 'Sender wallet address',
  })
  @IsString()
  @IsOptional()
  sender_address?: string;

  /**
   * Transaction hash/ID
   */
  @ApiPropertyOptional({
    description: 'Blockchain transaction hash',
  })
  @IsString()
  @IsOptional()
  txn_id?: string;

  /**
   * Any additional/unknown fields - catch-all to prevent validation errors
   * NOWPayments may send new fields at any time
   */
  [key: string]: unknown;
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
   * Payment ID (internal UUID) that was updated (if applicable)
   */
  paymentId?: string;

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
