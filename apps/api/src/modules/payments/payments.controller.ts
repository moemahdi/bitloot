import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { type Request } from 'express';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  IpnRequestDto,
  IpnResponseDto,
  EmbeddedPaymentResponseDto,
} from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { verifyNowPaymentsSignature } from './hmac-verification.util';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all endpoints
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  /**
   * Create a payment invoice with NOWPayments
   * Level 1 (fake): uses createFakePayment
   * Level 2+ (real): calls NOWPayments API via create()
   */
  @Post('create')
  @ApiOperation({ summary: 'Create payment invoice (redirect flow)' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async create(@Body() dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.payments.create(dto);
  }

  /**
   * Create an embedded payment (no redirect)
   *
   * Uses NOWPayments Payment API to create a payment that returns
   * wallet address and amount for in-app display. Customer pays
   * directly from their wallet without leaving your site.
   *
   * Frontend should:
   * 1. Display QR code using qrCodeData
   * 2. Show payAddress with copy button
   * 3. Display payAmount in payCurrency
   * 4. Poll GET /payments/:id/status every 5 seconds
   * 5. Show countdown timer using expiresAt
   */
  @Post('embedded')
  @ApiOperation({
    summary: 'Create embedded payment (no redirect)',
    description:
      'Creates a payment and returns wallet address + amount for in-app display. No redirect to NOWPayments.',
  })
  @ApiResponse({ status: 201, type: EmbeddedPaymentResponseDto })
  @ApiResponse({ status: 400, description: 'payCurrency is required for embedded payments' })
  async createEmbedded(@Body() dto: CreatePaymentDto): Promise<EmbeddedPaymentResponseDto> {
    return this.payments.createEmbedded(dto);
  }

  /**
   * Get existing active payment for an order
   *
   * Returns the most recent payment for an order if it exists and is in
   * an active (non-terminal) state. Used to resume payment after navigation.
   *
   * @param orderId Order ID to look up
   * @returns EmbeddedPaymentResponseDto if active payment exists, null otherwise
   */
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get existing payment for order',
    description:
      'Returns the active payment for an order if one exists. Used to resume checkout after navigation.',
  })
  @ApiResponse({ status: 200, type: EmbeddedPaymentResponseDto })
  @ApiResponse({ status: 404, description: 'No active payment found for order' })
  async getPaymentForOrder(@Param('orderId') orderId: string): Promise<EmbeddedPaymentResponseDto> {
    const payment = await this.payments.getActivePaymentForOrder(orderId);
    if (payment === null) {
      throw new HttpException('No active payment found for order', HttpStatus.NOT_FOUND);
    }
    return payment;
  }

  /**
   * Poll payment status directly from NOWPayments
   *
   * This endpoint polls NOWPayments API directly to get the current
   * payment status. If status has changed to a terminal state (finished,
   * failed, etc.), it updates the order and triggers fulfillment if needed.
   *
   * Use this when IPN webhooks aren't reliably received (e.g., sandbox mode).
   *
   * @param paymentId NOWPayments payment ID (external ID)
   * @returns Current payment status and order state
   */
  @Get('poll/:paymentId')
  @ApiOperation({
    summary: 'Poll payment status from NOWPayments',
    description:
      'Directly polls NOWPayments API for payment status and updates order if needed. Useful when IPN is delayed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status from NOWPayments',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        paymentStatus: { type: 'string', enum: ['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'] },
        orderId: { type: 'string' },
        orderStatus: { type: 'string' },
        fulfillmentTriggered: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async pollPaymentStatus(@Param('paymentId') paymentId: string): Promise<{
    paymentId: string;
    paymentStatus: string;
    orderId: string | null;
    orderStatus: string | null;
    fulfillmentTriggered: boolean;
  }> {
    return this.payments.pollAndUpdatePaymentStatus(paymentId);
  }

  /**
   * IPN webhook endpoint for NOWPayments payment status updates
   *
   * Rate limited: 30 requests per minute from any single IP
   * (NOWPayments typically sends 1-3 callbacks per payment)
   *
   * Workflow:
   * 1) Extract HMAC signature from x-nowpayments-signature header
   * 2) Verify signature against raw request body using HMAC-SHA512
   * 3) If invalid → return 401 Unauthorized
   * 4) Log webhook to WebhookLog table (dedup by externalId)
   * 5) Call PaymentsService.handleIpn() to process status transition
   * 6) Return 200 OK with { ok: true }
   *
   * Webhook includes payment status updates:
   * - waiting: Payment received, awaiting blockchain confirmations
   * - confirming: Blockchain confirmations in progress
   * - finished: Payment confirmed and meets minimum
   * - failed: Payment failed or expired
   * - underpaid: Received but amount less than required
   *
   * @param dto IpnRequestDto with orderId, externalId, status
   * @param signature HMAC-SHA512 signature from header
   * @param req Express request (contains rawBody from middleware)
   * @returns IpnResponseDto with { ok: true }
   */
  @Post('ipn')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 30 } }) // 30 requests per minute for webhooks
  @ApiOperation({
    summary: 'NOWPayments IPN webhook',
    description:
      'Receive payment status updates from NOWPayments. Signature verified with HMAC-SHA512.',
  })
  @ApiResponse({ status: 200, type: IpnResponseDto, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid HMAC signature' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async ipn(
    @Body() dto: IpnRequestDto,
    @Headers('x-nowpayments-signature') signature: string | undefined,
    @Req() req: Request,
  ): Promise<IpnResponseDto> {
    const { orderId, externalId } = dto;
    this.logger.debug(
      `IPN received: order ${orderId}, np_id ${externalId}, signature: ${signature?.substring(0, 16)}...`,
    );

    // 1) Extract and verify HMAC signature
    if (typeof signature !== 'string' || signature.length === 0) {
      this.logger.warn(`IPN rejected: missing signature header`);
      throw new HttpException('Missing x-nowpayments-signature header', HttpStatus.UNAUTHORIZED);
    }

    // Get raw body from middleware (captured before JSON parsing)
    const rawBody = (req as unknown as Record<string, unknown>).rawBody as string | undefined;
    if (typeof rawBody !== 'string' || rawBody.length === 0) {
      this.logger.error(`IPN rejected: raw body not available`);
      throw new HttpException('Invalid request body', HttpStatus.BAD_REQUEST);
    }

    // Verify HMAC
    const secret = process.env.NOWPAYMENTS_IPN_SECRET ?? '';
    const isValid = verifyNowPaymentsSignature(rawBody, signature, secret);
    if (!isValid) {
      this.logger.warn(`IPN rejected: invalid HMAC signature for order ${orderId}`);
      throw new HttpException('Invalid HMAC signature', HttpStatus.UNAUTHORIZED);
    }

    this.logger.log(`IPN verified: order ${orderId}, signature valid`);

    // 2) Process webhook with PaymentsService
    // handleIpn handles:
    // - Idempotency (checks WebhookLog)
    // - Status transitions (calls OrdersService methods)
    // - Error handling and logging
    try {
      const result = await this.payments.handleIpn(dto);
      this.logger.log(`IPN processed successfully: order ${orderId}`);
      return result;
    } catch (error) {
      this.logger.error(`IPN processing failed for order ${orderId}:`, error);
      throw new HttpException(
        `IPN processing failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get async job status for payment processing
   * Used for polling payment fulfillment progress
   *
   * @param jobId BullMQ job ID from initial payment creation
   * @returns Job status: pending|processing|completed|failed with progress
   */
  @Get('jobs/:jobId/status')
  @ApiOperation({ summary: 'Get payment job status' })
  @ApiResponse({ status: 200, description: 'Job status with progress' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<{
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
  }> {
    this.logger.debug(`Fetching job status: ${jobId}`);

    try {
      const status = await this.payments.getJobStatus(jobId);
      this.logger.log(`Job status retrieved: ${jobId} → ${status.status}`);
      return status;
    } catch (_error) {
      this.logger.warn(`Job status not found: ${jobId}`);
      throw new HttpException(`Job not found: ${jobId}`, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Admin endpoint: Get paginated list of all payments with filtering
   * Protected by AdminGuard (requires admin role in JWT)
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page, max 100 (default: 20)
   * - status: Filter by payment status (waiting|confirming|finished|failed|underpaid)
   * - provider: Filter by provider (e.g., 'nowpayments')
   * - orderId: Filter by specific order
   *
   * Returns: Paginated list of payments with metadata
   */
  @Get('admin/list')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[ADMIN] List all payments with pagination',
    description: 'Requires admin role in JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated payments list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              orderId: { type: 'string', format: 'uuid' },
              externalId: { type: 'string' },
              status: {
                type: 'string',
                enum: ['created', 'waiting', 'confirming', 'finished', 'underpaid', 'failed'],
              },
              provider: { type: 'string' },
              priceAmount: { type: 'number' },
              priceCurrency: { type: 'string' },
              payAmount: { type: 'number' },
              payCurrency: { type: 'string' },
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
  async adminListPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('orderId') orderId?: string,
  ): Promise<{
    data: Array<{
      id: string;
      orderId: string;
      externalId: string;
      status: string;
      provider: string;
      priceAmount: number;
      priceCurrency: string;
      payAmount: number;
      payCurrency: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    this.logger.log(
      `[ADMIN] Listing payments: page=${page}, limit=${limit}, status=${status}, provider=${provider}, orderId=${orderId}`,
    );

    try {
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);

      const result = await this.payments.listPayments({
        page: Math.max(1, !Number.isNaN(parsedPage) ? parsedPage : 1),
        limit: Math.min(100, Math.max(1, !Number.isNaN(parsedLimit) ? parsedLimit : 20)),
        status,
        provider,
        orderId,
      });

      this.logger.log(
        `[ADMIN] Payments list retrieved: ${result.data.length} items, total=${result.total}`,
      );
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`[ADMIN] Failed to list payments: ${errorMsg}`);
      throw new HttpException(`Failed to list payments: ${errorMsg}`, HttpStatus.BAD_REQUEST);
    }
  }
}
