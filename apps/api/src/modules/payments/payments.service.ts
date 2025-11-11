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

import { CreatePaymentDto, PaymentResponseDto, IpnRequestDto } from './dto/create-payment.dto';
import { NowPaymentsClient } from './nowpayments.client';
import { Payment } from './payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { OrdersService } from '../orders/orders.service';
import { QUEUE_NAMES } from '../../jobs/queues';

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
    @InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue,
  ) {}

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
        ipn_callback_url: `${process.env.WEBHOOK_BASE_URL ?? 'http://localhost:4000'}/payments/ipn`,
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

    try {
      // Idempotency check: if webhook already logged with same external id, return success
      const existingLog = await this.webhookLogsRepo.findOne({
        where: { externalId, webhookType: 'nowpayments_ipn', processed: true },
      });
      if (existingLog !== null) {
        this.logger.debug(`IPN already processed (idempotent): ${externalId}`);
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
      } else if (status === 'confirming') {
        await this.ordersService.markConfirming(orderId);
      } else if (status === 'finished') {
        // Payment confirmed: enqueue fulfillment job
        await this.ordersService.markPaid(orderId);

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

          this.logger.log(
            `[Phase 4] Reservation job queued: order ${orderId}, job ID ${job?.id ?? 'unknown'}, email ${orderDto.email}, items ${quantity}`,
          );
        } catch (error) {
          this.logger.error(
            `[Phase 4] Failed to queue fulfillment job for order ${orderId}:`,
            error instanceof Error ? error.message : String(error),
          );

          // Don't fail IPN processing - job queueing should be resilient
          // In production, use dead-letter queue or alerting for queueing failures
        }
      } else if (status === 'underpaid') {
        await this.ordersService.markUnderpaid(orderId);
      } else if (status === 'failed') {
        await this.ordersService.markFailed(orderId, 'NOWPayments reported failure');
      } else if (status !== undefined) {
        this.logger.warn(`Unknown payment status: ${status}`);
      }

      // Log webhook to prevent duplicates
      const webhookLog = new WebhookLog();
      webhookLog.externalId = externalId;
      webhookLog.webhookType = 'nowpayments_ipn';
      webhookLog.payload = dto as unknown as Record<string, unknown>;
      webhookLog.signatureValid = true;
      webhookLog.processed = true;
      await this.webhookLogsRepo.save(webhookLog);

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
}
