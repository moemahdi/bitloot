import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { CreatePaymentDto, PaymentResponseDto, IpnRequestDto, EmbeddedPaymentResponseDto } from './dto/create-payment.dto';
import { NowPaymentsClient } from './nowpayments.client';
import { Payment } from './payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { OrdersService } from '../orders/orders.service';
import { QUEUE_NAMES } from '../../jobs/queues';
import { MetricsService } from '../metrics/metrics.service';

/**
 * PaymentsService handles payment lifecycle:
 * 1. create() - Queue payment creation job with NOWPayments
 * 2. handleIpn() - Process webhook notifications with idempotency
 * 3. On IPN finished - Queue fulfillment job
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly npClient: NowPaymentsClient,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(WebhookLog) private readonly webhookLogsRepo: Repository<WebhookLog>,
    private readonly ordersService: OrdersService,
    private readonly metricsService: MetricsService,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue,
  ) {}

  /**
  /**
   * Log structured JSON event for observability
   * @param level Log level (info, warn, error)
   * @param operation Operation name
   * @param status Status (success, failure, partial)
   * @param context Additional context data
   */
  private logStructured(
    level: 'info' | 'warn' | 'error',
    operation: string,
    status: string,
    context: Record<string, unknown>,
  ): void {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: 'PaymentsService',
      operation,
      status,
      context,
    };

    const logMessage = JSON.stringify(structuredLog);
    if (level === 'error') {
      this.logger.error(logMessage);
    } else if (level === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  /**
   * Create a payment invoice with NOWPayments
   * Call NOWPayments API to create invoice, store payment record, return invoice URL
   *
   * @param dto CreatePaymentDto with orderId, email, price, currency
   * @returns PaymentResponseDto with invoice details
   * @throws BadRequestException if order not found or API call fails
   */
  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    this.logger.debug(`Creating payment for order ${dto.orderId}, email: ${dto.email}`);

    try {
      // Call NOWPayments client to create invoice
      const npInvoice = await this.npClient.createInvoice({
        price_amount: parseFloat(dto.priceAmount),
        price_currency: dto.priceCurrency,
        pay_currency: dto.payCurrency ?? 'btc',
        order_id: dto.orderId,
        order_description: `BitLoot Order #${dto.orderId.substring(0, 8)}`,
        ipn_callback_url: `${process.env.WEBHOOK_BASE_URL ?? 'http://localhost:4000'}/webhooks/nowpayments/ipn`,
        success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/orders/${dto.orderId}/success`,
        cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/orders/${dto.orderId}/cancel`,
      });

      // Create Payment record for tracking
      const payment = this.paymentsRepo.create({
        externalId: npInvoice.id.toString(),
        orderId: dto.orderId,
        provider: 'nowpayments',
        status: 'created',
        rawPayload: npInvoice as unknown as Record<string, string | number | boolean | null>,
      });
      await this.paymentsRepo.save(payment);

      this.logger.log(
        `Payment created: NP ID ${npInvoice.id}, order ${dto.orderId}, amount ${npInvoice.price_amount} ${npInvoice.price_currency}`,
      );

      // Map NOWPayments response to PaymentResponseDto
      return {
        invoiceId: npInvoice.id,
        invoiceUrl: npInvoice.invoice_url,
        statusUrl: npInvoice.status_url,
        payAddress: npInvoice.pay_address,
        priceAmount: npInvoice.price_amount,
        payAmount: 0, // Will be set once we receive payment details
        payCurrency: npInvoice.pay_currency,
        status: npInvoice.status,
        // 1-hour expiration window for checkout UX (NOWPayments invoices are permanent)
        expirationDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to create payment for order ${dto.orderId}:`, error);
      throw new InternalServerErrorException(
        `Failed to create payment: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Handle IPN webhook from NOWPayments
   * Process status transitions, update order, log webhook
   * Queue fulfillment job on payment finished
   *
   * @param dto IpnRequestDto with orderId, externalId (npPaymentId), and status
   * @returns { ok: true } on success
   * @throws BadRequestException if order not found or invalid transition
   */
  async handleIpn(dto: IpnRequestDto): Promise<{ ok: boolean }> {
    const { orderId, externalId, status } = dto;
    this.logger.log(`IPN received: order ${orderId}, status ${status}, np_id ${externalId}`);

    // Structured log: Incoming webhook
    this.logStructured('info', 'handleIpn:start', 'received', {
      orderId,
      paymentId: externalId,
      status,
      timestamp: new Date().toISOString(),
    });

    try {
      // Idempotency check: if webhook already logged with same external id, return success
      const existingLog = await this.webhookLogsRepo.findOne({
        where: { externalId, webhookType: 'nowpayments_ipn', processed: true },
      });
      if (existingLog !== null) {
        this.logger.debug(`IPN already processed (idempotent): ${externalId}`);
        this.logStructured('info', 'handleIpn:idempotency', 'duplicate', {
          orderId,
          paymentId: externalId,
          reason: 'webhook_already_processed',
        });
        return { ok: true }; // Idempotent: already handled
      }

      // Update Payment record with latest status
      const payment = await this.paymentsRepo.findOne({
        where: { externalId },
      });
      if (payment !== null && status !== undefined) {
        // Cast status to valid Payment status enum
        const validStatuses = [
          'created',
          'waiting',
          'confirmed',
          'finished',
          'underpaid',
          'failed',
        ] as const;
        if (validStatuses.includes(status as (typeof validStatuses)[number])) {
          payment.status = status as (typeof validStatuses)[number];
          await this.paymentsRepo.save(payment);
        }
      }

      // Process status transitions on Order
      if (status === 'waiting') {
        await this.ordersService.markWaiting(orderId);
        this.logStructured('info', 'handleIpn:status_transition', 'waiting', {
          orderId,
          paymentId: externalId,
          previousStatus: payment?.status,
          newStatus: status,
        });
      } else if (status === 'confirming') {
        await this.ordersService.markConfirming(orderId);
        this.logStructured('info', 'handleIpn:status_transition', 'confirming', {
          orderId,
          paymentId: externalId,
          previousStatus: payment?.status,
          newStatus: status,
        });
      } else if (status === 'finished') {
        // Payment confirmed: enqueue fulfillment job
        await this.ordersService.markPaid(orderId);
        this.logStructured('info', 'handleIpn:status_transition', 'payment_confirmed', {
          orderId,
          paymentId: externalId,
          previousStatus: payment?.status,
          newStatus: status,
        });

        // Queue fulfillment job (Phase 4: BullMQ async processing)
        try {
          // Fetch order with items to extract details for fulfillment job
          const orderDto = await this.ordersService.get(orderId);
          const firstItem = orderDto.items?.[0];
          const quantity = Array.isArray(orderDto.items) ? orderDto.items.length : 1;

          const job = await this.fulfillmentQueue.add(
            'reserve',
            {
              orderId,
              paymentId: payment?.id ?? 'unknown',
              kinguinOfferId: firstItem?.productId ?? 'demo-product',
              userEmail: orderDto.email,
              quantity,
            },
            {
              jobId: `reserve-${orderId}`,
              removeOnComplete: true,
              removeOnFail: false, // Keep failed jobs for debugging
            },
          );

          this.logStructured('info', 'handleIpn:job_enqueued', 'fulfillment_job_created', {
            orderId,
            paymentId: externalId,
            jobId: job?.id ?? 'unknown',
            kinguinOfferId: firstItem?.productId ?? 'demo-product',
            quantity,
            email: orderDto.email,
          });

          this.logger.log(
            `[Phase 4] Reservation job queued: order ${orderId}, job ID ${job?.id ?? 'unknown'}, email ${orderDto.email}, items ${quantity}`,
          );
        } catch (error) {
          this.logStructured('error', 'handleIpn:job_queueing_failed', 'fulfillment_job_failed', {
            orderId,
            paymentId: externalId,
            error: error instanceof Error ? error.message : String(error),
            errorType: error?.constructor?.name,
          });

          this.logger.error(
            `[Phase 4] Failed to queue fulfillment job for order ${orderId}:`,
            error instanceof Error ? error.message : String(error),
          );

          // Don't fail IPN processing - job queueing should be resilient
          // In production, use dead-letter queue or alerting for queueing failures
        }
      } else if (status === 'underpaid') {
        await this.ordersService.markUnderpaid(orderId);
        this.metricsService.incrementUnderpaidOrders('btc'); // TODO: track actual asset
        this.logStructured('warn', 'handleIpn:underpaid_order', 'payment_insufficient', {
          orderId,
          paymentId: externalId,
          priceAmount: payment?.priceAmount,
          payAmount: payment?.payAmount,
          currency: payment?.payCurrency,
        });
      } else if (status === 'failed') {
        // Check if this is an expiration (based on IPN payload) or a real failure
        // NOWPayments sends 'failed' for both expired and actual failures
        const isExpired = this.isPaymentExpired(dto);
        
        if (isExpired) {
          await this.ordersService.markExpired(orderId, 'Payment invoice expired');
          this.logStructured('warn', 'handleIpn:payment_expired', 'payment_window_closed', {
            orderId,
            paymentId: externalId,
            reason: 'invoice_expired',
          });
        } else {
          await this.ordersService.markFailed(orderId, 'NOWPayments reported failure');
          this.logStructured('warn', 'handleIpn:payment_failed', 'payment_rejected', {
            orderId,
            paymentId: externalId,
            reason: 'nowpayments_failure',
          });
        }
      } else if (status !== undefined) {
        this.logger.warn(`Unknown payment status: ${status}`);
        this.logStructured('warn', 'handleIpn:unknown_status', 'unknown_status', {
          orderId,
          paymentId: externalId,
          status,
        });
      }

      // Log webhook to prevent duplicates
      const webhookLog = new WebhookLog();
      webhookLog.externalId = externalId;
      webhookLog.webhookType = 'nowpayments_ipn';
      webhookLog.payload = dto as unknown as Record<string, unknown>;
      webhookLog.signatureValid = true;
      webhookLog.processed = true;
      await this.webhookLogsRepo.save(webhookLog);

      this.logStructured('info', 'handleIpn:complete', 'success', {
        orderId,
        paymentId: externalId,
        status,
        processingTimeMs: Date.now(),
      });

      this.logger.log(`IPN processed successfully: order ${orderId} → status ${status}`);
      return { ok: true };
    } catch (error) {
      // Log failed webhook for debugging
      const webhookLog = new WebhookLog();
      webhookLog.externalId = externalId;
      webhookLog.webhookType = 'nowpayments_ipn';
      webhookLog.payload = dto as unknown as Record<string, unknown>;
      webhookLog.signatureValid = false;
      webhookLog.processed = false;
      webhookLog.error = error instanceof Error ? error.message : 'unknown error';
      await this.webhookLogsRepo.save(webhookLog);

      this.logStructured('error', 'handleIpn:failed', 'processing_error', {
        orderId,
        paymentId: externalId,
        status,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
      });

      this.logger.error(`IPN processing failed: order ${orderId}`, error);
      throw new BadRequestException(
        `IPN processing failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Get async job status for payment processing
   * Polls BullMQ fulfillment queue for job status
   *
   * @param jobId BullMQ job ID
   * @returns Job status with progress
   * @throws BadRequestException if job not found
   */
  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
  }> {
    this.logger.debug(`Getting job status for ${jobId}`);

    try {
      const job = await this.fulfillmentQueue.getJob(jobId);

      if (job === null || job === undefined) {
        throw new BadRequestException(`Job not found: ${jobId}`);
      }

      // Determine job status
      const isCompleted = await job.isCompleted();
      const isFailed = await job.isFailed();
      const isWaiting = await job.isWaiting();
      const isActive = await job.isActive();

      let status: 'pending' | 'processing' | 'completed' | 'failed';
      if (isCompleted) {
        status = 'completed';
      } else if (isFailed) {
        status = 'failed';
      } else if (isActive) {
        status = 'processing';
      } else if (isWaiting) {
        status = 'pending';
      } else {
        status = 'pending';
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const jobProgress: unknown = (job as any).progress;
      const progress = typeof jobProgress === 'number' ? jobProgress : undefined;

      const response = {
        jobId,
        status,
        progress,
        error: isFailed ? job.failedReason : undefined,
      };

      this.logger.debug(`Job ${jobId} status: ${status}, progress: ${progress ?? 'N/A'}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}:`, error);
      throw new BadRequestException(
        `Failed to get job status: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * [ADMIN] List all payments with pagination and filtering
   *
   * @param options Pagination and filter options
   * @returns Paginated payments list with metadata
   */
  async listPayments(options: {
    page: number;
    limit: number;
    status?: string;
    provider?: string;
    orderId?: string;
  }): Promise<{
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
    const { page, limit, status, provider, orderId } = options;

    this.logger.debug(
      `[ADMIN] Listing payments: page=${page}, limit=${limit}, status=${status}, provider=${provider}, orderId=${orderId}`,
    );

    try {
      // Build query
      let query = this.paymentsRepo.createQueryBuilder('payment');

      if (status !== undefined && status !== '') {
        query = query.where('payment.status = :status', { status });
      }

      if (provider !== undefined && provider !== '') {
        query = query.andWhere('payment.provider = :provider', { provider });
      }

      if (orderId !== undefined && orderId !== '') {
        query = query.andWhere('payment.orderId = :orderId', { orderId });
      }

      // Get total count
      const total = await query.getCount();
      const totalPages = Math.ceil(total / limit);

      // Get paginated results using select() for better type safety
      const payments = await query
        .orderBy('payment.createdAt', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getMany();

      this.logger.log(
        `[ADMIN] Payments listed: page=${page}, limit=${limit}, total=${total}, returned=${payments.length}`,
      );

      return {
        data: payments.map((payment) => ({
          id: payment.id,
          orderId: payment.orderId,
          externalId: payment.externalId,
          status: payment.status as string,
          provider: payment.provider,
          priceAmount:
            payment.priceAmount !== undefined ? parseFloat(payment.priceAmount.toString()) : 0,
          priceCurrency: payment.priceCurrency ?? '',
          payAmount: payment.payAmount !== undefined ? parseFloat(payment.payAmount.toString()) : 0,
          payCurrency: payment.payCurrency ?? '',
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } catch (error) {
      this.logger.error(`[ADMIN] Failed to list payments:`, error);
      throw new BadRequestException(
        `Failed to list payments: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Create an embedded payment (no redirect to NOWPayments)
   *
   * Uses the NOWPayments Payment API (not Invoice API) to create a payment
   * that returns wallet address and amount for in-app display.
   * Customer pays from their wallet directly without leaving your site.
   *
   * @param dto CreatePaymentDto with orderId, email, price, and payCurrency (required for embedded)
   * @returns EmbeddedPaymentResponseDto with wallet address, amount, QR code data
   * @throws BadRequestException if payCurrency not specified
   */
  async createEmbedded(dto: CreatePaymentDto): Promise<EmbeddedPaymentResponseDto> {
    this.logger.debug(`Creating embedded payment for order ${dto.orderId}, currency: ${dto.payCurrency}`);

    // For embedded flow, payCurrency is required (user must select crypto first)
    const paymentCurrency = dto.payCurrency ?? '';
    if (paymentCurrency === null || paymentCurrency === undefined || paymentCurrency === '') {
      throw new BadRequestException('payCurrency is required for embedded payments');
    }

    try {
      // Call NOWPayments Payment API (not Invoice API)
      const npPayment = await this.npClient.createPayment({
        price_amount: parseFloat(dto.priceAmount),
        price_currency: dto.priceCurrency,
        pay_currency: paymentCurrency,
        order_id: dto.orderId,
        order_description: `BitLoot Order #${dto.orderId.substring(0, 8)}`,
        ipn_callback_url: `${process.env.WEBHOOK_BASE_URL ?? 'http://localhost:4000'}/webhooks/nowpayments/ipn`,
        // NO success_url / cancel_url = embedded flow (no redirect)
      });

      // Create Payment record for tracking
      const payment = this.paymentsRepo.create({
        externalId: npPayment.payment_id.toString(),
        orderId: dto.orderId,
        provider: 'nowpayments',
        status: 'waiting',
        priceAmount: npPayment.price_amount.toString(),
        priceCurrency: npPayment.price_currency,
        payAmount: npPayment.pay_amount.toString(),
        payCurrency: npPayment.pay_currency,
        rawPayload: npPayment as unknown as Record<string, string | number | boolean | null>,
      });
      await this.paymentsRepo.save(payment);

      this.logger.log(
        `Embedded payment created: NP ID ${npPayment.payment_id}, order ${dto.orderId}, amount ${npPayment.pay_amount} ${npPayment.pay_currency}`,
      );

      // Generate QR code data URI for wallet apps
      const qrCodeData = this.generateQrCodeData(
        npPayment.pay_currency,
        npPayment.pay_address,
        npPayment.pay_amount,
      );

      // Calculate expiration (NOWPayments payments typically expire in 1 hour)
      const expiresAt = npPayment.expiration_date ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();

      return {
        paymentId: payment.id,
        externalId: npPayment.payment_id.toString(),
        orderId: dto.orderId,
        payAddress: npPayment.pay_address,
        payAmount: npPayment.pay_amount,
        payCurrency: npPayment.pay_currency,
        priceAmount: npPayment.price_amount,
        priceCurrency: npPayment.price_currency,
        status: npPayment.payment_status,
        expiresAt,
        qrCodeData,
        estimatedTime: this.getEstimatedConfirmationTime(paymentCurrency),
      };
    } catch (error) {
      this.logger.error(`Failed to create embedded payment for order ${dto.orderId}:`, error);
      throw new InternalServerErrorException(
        `Failed to create payment: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Generate QR code data URI for crypto wallet apps
   * Uses BIP-21 format for Bitcoin, EIP-681 for Ethereum, etc.
   */
  private generateQrCodeData(currency: string, address: string, amount: number): string {
    const currencyLower = currency.toLowerCase();

    // BIP-21 format for Bitcoin
    if (currencyLower === 'btc') {
      return `bitcoin:${address}?amount=${amount}`;
    }

    // EIP-681 for Ethereum
    if (currencyLower === 'eth') {
      return `ethereum:${address}?value=${amount}`;
    }

    // Litecoin
    if (currencyLower === 'ltc') {
      return `litecoin:${address}?amount=${amount}`;
    }

    // USDT TRC20 (Tron network)
    if (currencyLower === 'usdttrc20' || currencyLower === 'trx') {
      return `tron:${address}?amount=${amount}`;
    }

    // USDT ERC20
    if (currencyLower === 'usdterc20') {
      return `ethereum:${address}?value=${amount}`;
    }

    // Generic fallback: just the address
    return address;
  }

  /**
   * Get estimated confirmation time based on cryptocurrency
   */
  private getEstimatedConfirmationTime(currency: string): string {
    const currencyLower = currency.toLowerCase();

    const times: Record<string, string> = {
      btc: '10-60 minutes',
      eth: '2-5 minutes',
      ltc: '2-10 minutes',
      usdttrc20: '1-3 minutes',
      usdterc20: '2-5 minutes',
      trx: '1-2 minutes',
      bnb: '1-3 minutes',
      sol: '< 1 minute',
      doge: '10-30 minutes',
    };

    return times[currencyLower] ?? '5-30 minutes';
  }

  /**
   * Poll NOWPayments directly for payment status and update order if needed
   * 
   * This is useful when IPN webhooks are delayed or not received (common in sandbox).
   * It polls the NOWPayments API, updates the local payment record, and triggers
   * fulfillment if the payment is finished.
   * 
   * @param paymentId Our internal payment UUID
   * @returns Current payment status and order state
   */
  async pollAndUpdatePaymentStatus(paymentId: string): Promise<{
    paymentId: string;
    paymentStatus: string;
    orderId: string | null;
    orderStatus: string | null;
    fulfillmentTriggered: boolean;
  }> {
    this.logger.debug(`Polling payment status for internal ID: ${paymentId}`);

    // 1. Find our local payment record by internal UUID
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId },
    });

    if (payment === null) {
      this.logger.warn(`No local payment found for ID: ${paymentId}`);
      return {
        paymentId,
        paymentStatus: 'unknown',
        orderId: null,
        orderStatus: null,
        fulfillmentTriggered: false,
      };
    }

    // 2. Use the external ID (NOWPayments numeric ID) to poll NOWPayments
    const externalId = payment.externalId;
    this.logger.debug(`Polling NOWPayments with external ID: ${externalId}`);

    const npStatus = await this.npClient.getPaymentStatus(externalId);
    const paymentStatus = npStatus.payment_status;
    
    this.logger.log(`NOWPayments status for ${externalId}: ${paymentStatus}`);

    const orderId = payment.orderId;
    let fulfillmentTriggered = false;

    // 3. Check if status changed and needs processing
    if (payment.status !== paymentStatus) {
      this.logger.log(`Payment ${paymentId} status changed: ${payment.status} → ${paymentStatus}`);
      
      // Update local payment status - cast to valid status type
      const validStatuses = ['created', 'waiting', 'confirmed', 'finished', 'underpaid', 'failed'] as const;
      type PaymentStatus = typeof validStatuses[number];
      
      if (validStatuses.includes(paymentStatus as PaymentStatus)) {
        payment.status = paymentStatus as PaymentStatus;
      }
      
      // Store raw response as record (convert to flat object for storage)
      payment.rawPayload = npStatus as unknown as Record<string, string | number | boolean | null>;
      await this.paymentsRepo.save(payment);

      // Handle terminal states
      if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
        // Mark order as paid
        const order = await this.ordersService.markPaid(orderId);
        this.logger.log(`Order ${orderId} marked as paid via polling`);

        // Queue fulfillment job
        const job = await this.fulfillmentQueue.add(
          'fulfill',
          { orderId, paymentId },
          { 
            jobId: `fulfill-${orderId}`,
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        this.logger.log(`Fulfillment job queued for order ${orderId}: ${job.id}`);
        fulfillmentTriggered = true;

        return {
          paymentId,
          paymentStatus,
          orderId,
          orderStatus: order.status,
          fulfillmentTriggered,
        };
      }
    }

    // 4. Get current order status
    try {
      const order = await this.ordersService.get(orderId);
      return {
        paymentId,
        paymentStatus,
        orderId,
        orderStatus: order?.status ?? null,
        fulfillmentTriggered,
      };
    } catch {
      return {
        paymentId,
        paymentStatus,
        orderId,
        orderStatus: null,
        fulfillmentTriggered,
      };
    }
  }

  /**
   * Determine if a failed payment was due to expiration
   * 
   * NOWPayments sends 'failed' status for both expired invoices and actual failures.
   * We can distinguish them by checking if no payment was ever received:
   * - If actually_paid is 0 or undefined → likely expiration
   * - If actually_paid > 0 → actual payment failure (e.g., network issue, processing error)
   * 
   * @param dto IPN request data
   * @returns true if the failure was due to invoice expiration
   */
  private isPaymentExpired(dto: IpnRequestDto): boolean {
    // Check if any amount was actually paid
    // Use type assertion since IPN may include additional fields from NOWPayments
    const dtoAsRecord = dto as unknown as Record<string, unknown>;
    const actuallyPaid = dtoAsRecord['actually_paid'] ?? 
                         dtoAsRecord['actuallyPaid'] ?? 0;
    
    const paidAmount = typeof actuallyPaid === 'number' ? actuallyPaid : parseFloat(String(actuallyPaid)) || 0;
    
    // If no payment was ever received and status is failed → expired
    // If some payment was received → actual failure (not expiration)
    return paidAmount === 0;
  }
}
