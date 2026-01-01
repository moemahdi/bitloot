import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { IpnHandlerService } from './ipn-handler.service';
import { NowpaymentsIpnRequestDto, NowpaymentsIpnResponseDto } from './dto/nowpayments-ipn.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * IPN Handler Controller
 * Receives webhook notifications from NOWPayments for payment status updates
 *
 * **Security Notes:**
 * - HMAC-SHA512 signature verification is done in service
 * - Timing-safe comparison prevents timing attacks
 * - Idempotency is enforced via database unique constraints
 * - Always returns 200 OK to prevent NOWPayments retries (errors are logged but don't retry)
 *
 * **Integration Flow:**
 * 1. NOWPayments sends IPN webhook to POST /webhooks/nowpayments/ipn
 * 2. Signature in X-NOWPAYMENTS-SIGNATURE header
 * 3. Controller extracts signature and calls service
 * 4. Service verifies, deduplicates, processes payment status
 * 5. Order status is updated
 * 6. Fulfillment is queued if payment is finished
 * 7. Always return 200 OK (success or failure)
 *
 * @class IpnHandlerController
 * @exports
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class IpnHandlerController {
  constructor(private readonly ipnHandlerService: IpnHandlerService) {}

  /**
   * Handle NOWPayments IPN (Instant Payment Notification)
   * Receives payment status updates from NOWPayments
   *
   * **Webhook Signature Verification:**
   * NOWPayments sends signature in X-NOWPAYMENTS-SIGNATURE header as SHA512 HMAC of request body
   *
   * **Payment Status Flow:**
   * - waiting → Order status: confirming (payment received, awaiting confirmations)
   * - confirming → Order status: confirming (confirmations in progress)
   * - finished → Order status: paid (payment complete, fulfillment triggered) ✅
   * - failed → Order status: failed (payment error)
   * - underpaid → Order status: underpaid (payment insufficient, non-refundable)
   *
   * **Response Contract:**
   * - Always returns 200 OK with { ok: true } (even on errors)
   * - Prevents NOWPayments from retrying failed webhooks
   * - Errors are logged but processed asynchronously
   *
   * @param {NowpaymentsIpnRequestDto} payload - IPN webhook payload from NOWPayments
   * @param {string} signature - HMAC-SHA512 signature from X-NOWPAYMENTS-SIGNATURE header
   * @returns {Promise<NowpaymentsIpnResponseDto>} Always { ok: true }
   *
   * @example
   * ```bash
   * # NOWPayments sends webhook:
   * POST /webhooks/nowpayments/ipn
   * X-NOWPAYMENTS-SIGNATURE: 3b5d40e5c0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5c0a1f2e3d4c5b6a7f8e9d0c1
   * Content-Type: application/json
   *
   * {
   *   "payment_id": "123456789",
   *   "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
   *   "order_id": "550e8400-e29b-41d4-a716-446655440000",
   *   "payment_status": "finished",
   *   "price_amount": 100.00,
   *   "price_currency": "eur",
   *   "pay_amount": 0.0025,
   *   "pay_currency": "btc",
   *   "received_amount": 0.0025,
   *   "received_currency": "btc",
   *   "created_at": "2025-11-08T15:30:00Z",
   *   "updated_at": "2025-11-08T15:35:00Z"
   * }
   * ```
   *
   * @apiNote
   * This endpoint should be registered in NOWPayments dashboard as IPN webhook.
   * Webhook URL: https://bitloot.io/api/webhooks/nowpayments/ipn
   */
  @Post('nowpayments/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'NOWPayments IPN Webhook Handler',
    description:
      'Receives instant payment notifications from NOWPayments. Verifies signature, ' +
      'deduplicates by payment ID, updates order status, and queues fulfillment if payment is complete. ' +
      'Always returns 200 OK to prevent webhook retries.',
  })
  @ApiHeader({
    name: 'X-NOWPAYMENTS-SIGNATURE',
    description: 'HMAC-SHA512 signature of request body (hex string)',
    required: true,
    example: '3b5d40e5c0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5c0a1f2e3d4c5b6a7f8e9d0c1',
  })
  @ApiResponse({
    status: 200,
    type: NowpaymentsIpnResponseDto,
    description:
      'Webhook received and processed (or queued for processing). Always 200 OK regardless of outcome.',
    schema: {
      example: {
        ok: true,
        message: 'Webhook processed',
        processed: true,
        webhookId: '660e8400-e29b-41d4-a716-446655440001',
      },
    },
  })
  async handleNowpaymentsIpn(
    @Body() payload: NowpaymentsIpnRequestDto,
    @Headers('x-nowpayments-signature') signature: string,
  ): Promise<NowpaymentsIpnResponseDto> {
    return this.ipnHandlerService.handleIpn(payload, signature);
  }

  /**
   * Admin endpoint: Get paginated list of all webhook logs with filtering
   * Protected by AdminGuard (requires admin role in JWT)
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page, max 100 (default: 20)
   * - webhookType: Filter by webhook type (e.g., 'nowpayments_ipn')
   * - processed: Filter by processed status (true|false)
   * - paymentStatus: Filter by payment status (e.g., 'finished', 'failed', 'waiting')
   * - orderId: Filter by specific order
   *
   * Returns: Paginated list of webhook logs for audit trail
   */
  @Get('admin/list')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[ADMIN] List all webhook logs with pagination',
    description: 'Requires admin role in JWT token. Returns delivery history for all webhooks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated webhook logs list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              externalId: { type: 'string' },
              webhookType: { type: 'string', example: 'nowpayments_ipn' },
              processed: { type: 'boolean' },
              signatureValid: { type: 'boolean' },
              paymentStatus: { type: 'string', example: 'finished' },
              orderId: { type: 'string', format: 'uuid', nullable: true },
              paymentId: { type: 'string', nullable: true },
              error: { type: 'string', nullable: true },
              attemptCount: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
        hasNextPage: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or missing JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden: user is not admin' })
  async adminListWebhooks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('webhookType') webhookType?: string,
    @Query('processed') processed?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('orderId') orderId?: string,
  ): Promise<{
    data: Array<{
      id: string;
      externalId: string;
      webhookType: string;
      processed: boolean;
      signatureValid: boolean;
      paymentStatus?: string;
      orderId?: string;
      paymentId?: string;
      error?: string;
      attemptCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    return await this.ipnHandlerService.listWebhooks({
      page: Math.max(1, !Number.isNaN(parseInt(page, 10)) ? parseInt(page, 10) : 1),
      limit: Math.min(
        100,
        Math.max(1, !Number.isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 20),
      ),
      webhookType,
      processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
      paymentStatus,
      orderId,
    });
  }
}
