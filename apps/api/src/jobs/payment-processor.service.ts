/**
 * Payment Processing Queue Processor
 *
 * Async job processor for payment creation via NOWPayments
 * - Receives job with order ID and payment details
 * - Calls NOWPayments API to create invoice
 * - Stores payment record with status
 * - Handles retries with exponential backoff
 * - Logs all events to WebhookLog for audit trail
 *
 * Responsibility:
 * ✅ Create NOWPayments invoice
 * ✅ Update Payment entity status
 * ✅ Return payment URL for frontend
 * ❌ Does NOT trigger fulfillment (that happens on IPN)
 */

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentJobData, JobResult, QUEUE_NAMES } from './queues';
import { NowPaymentsClient } from '../modules/payments/nowpayments.client';
import { Payment } from '../modules/payments/payment.entity';
import { Order } from '../modules/orders/order.entity';

interface PaymentJobResult {
  invoiceId: number;
  invoiceUrl: string;
  statusUrl: string;
  payAddress: string;
  priceAmount: number;
  payCurrency: string;
  status: string;
  expirationDate: string;
}

/**
 * NOWPayments Invoice API Response Type (simplified)
 * More comprehensive type would be generated from OpenAPI spec
 */
interface NowPaymentsInvoice {
  id: number;
  invoice_url: string;
  status_url: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  status: string;
}

/**
 * Processor for payments-queue
 *
 * @Processor(QUEUE_NAMES.PAYMENTS) registers this to handle jobs from PaymentsQueue
 * Extends WorkerHost from @nestjs/bullmq
 */
@Processor(QUEUE_NAMES.PAYMENTS)
export class PaymentProcessorService extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessorService.name);

  constructor(
    private readonly npClient: NowPaymentsClient,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
  ) {
    super();
  }

  /**
   * Main job handler for payment creation
   *
   * Called by BullMQ when job becomes active
   * Framework handles retries automatically based on queue config
   *
   * @param job Job from payments-queue with PaymentJobData payload
   * @returns JobResult with invoice details (returned to caller)
   * @throws Error for retryable failures, returns error result for non-retryable
   *
   * Job flow:
   * 1. Load order and validate
   * 2. Create NOWPayments invoice
   * 3. Store Payment record in database
   * 4. Return invoice URL and payment address
   * 5. On retry: Clear previous payment record and retry step 2-3
   */
  async process(job: Job<PaymentJobData>): Promise<JobResult<PaymentJobResult>> {
    const { orderId, priceAmount, priceCurrency, payCurrency = 'btc' } = job.data;

    this.logger.log(
      `[Payment Processor] Job #${job.id} started: order ${orderId}, amount ${priceAmount} ${priceCurrency}`,
    );

    try {
      // Step 1: Load order and validate it exists
      const order = await this.ordersRepo.findOne({
        where: { id: orderId },
      });

      if (order === null) {
        // Non-retryable error: order doesn't exist
        this.logger.error(`Order ${orderId} not found - non-retryable error`);
        return {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${orderId} not found in database`,
            retryable: false, // Don't retry if order doesn't exist
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Step 2: Check if payment already exists (idempotency)
      // If retrying, we may already have created a payment
      const existingPayment = await this.paymentsRepo.findOne({
        where: { orderId },
        order: { createdAt: 'DESC' }, // Get most recent
      });

      let payment: Payment;

      if (existingPayment?.status === 'created') {
        // Payment already created in previous attempt, reuse it
        this.logger.log(
          `[Payment Processor] Reusing existing payment ${existingPayment.externalId} for order ${orderId}`,
        );
        payment = existingPayment;
      } else {
        // Step 3: Call NOWPayments to create invoice (retryable on network errors)
        let npInvoice: NowPaymentsInvoice;

        try {
          npInvoice = await this.npClient.createInvoice({
            price_amount: parseFloat(priceAmount),
            price_currency: priceCurrency,
            pay_currency: payCurrency,
            order_id: orderId,
            order_description: `BitLoot Order #${orderId.substring(0, 8)}`,
            ipn_callback_url: `${process.env.WEBHOOK_BASE_URL ?? 'http://localhost:4000'}/webhooks/nowpayments/ipn`,
            success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/orders/${orderId}/success`,
            cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/orders/${orderId}/cancel`,
          });

          this.logger.log(
            `[Payment Processor] NOWPayments invoice created: ID ${npInvoice.id}, status ${npInvoice.status}`,
          );
        } catch (error) {
          // Network/API error - retryable
          this.logger.error(
            `[Payment Processor] NOWPayments API call failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts}):`,
            error instanceof Error ? error.message : String(error),
          );

          throw new Error(
            `Failed to create NOWPayments invoice: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }

        // Step 4: Store Payment record in database
        try {
          payment = this.paymentsRepo.create({
            externalId: npInvoice.id.toString(),
            orderId,
            provider: 'nowpayments',
            status: 'waiting', // Mark as waiting for payment
            rawPayload: npInvoice as unknown as Record<string, string | number | boolean | null>,
          });

          await this.paymentsRepo.save(payment);

          this.logger.log(
            `[Payment Processor] Payment record created: ${payment.id}, NP ID ${npInvoice.id}`,
          );
        } catch (error) {
          // Database error - retryable
          this.logger.error(
            `[Payment Processor] Failed to save payment record (attempt ${job.attemptsMade + 1}/${job.opts.attempts}):`,
            error instanceof Error ? error.message : String(error),
          );

          throw new Error(
            `Failed to save payment record: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }

      // Step 5: Return success result with invoice details
      const invoiceId = typeof payment.rawPayload?.id === 'number' ? payment.rawPayload.id : 0;
      const invoiceUrl =
        typeof payment.rawPayload?.invoice_url === 'string' ? payment.rawPayload.invoice_url : '';
      const statusUrl =
        typeof payment.rawPayload?.status_url === 'string' ? payment.rawPayload.status_url : '';
      const payAddress =
        typeof payment.rawPayload?.pay_address === 'string' ? payment.rawPayload.pay_address : '';

      const result: JobResult<PaymentJobResult> = {
        success: true,
        data: {
          invoiceId,
          invoiceUrl,
          statusUrl,
          payAddress,
          priceAmount: parseFloat(priceAmount),
          payCurrency,
          status: payment.status,
          expirationDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        attempt: job.attemptsMade + 1,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `[Payment Processor] Job #${job.id} completed successfully: invoice ${result.data?.invoiceId}`,
      );

      return result;
    } catch (error) {
      // Log error and let BullMQ handle retry
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[Payment Processor] Job #${job.id} failed (attempt ${job.attemptsMade + 1}/${job.opts.attempts}): ${errorMessage}`,
      );

      // Throw to trigger BullMQ retry logic
      throw error;
    }
  }

  /**
   * Optional: Handle when job fails all retry attempts
   * Called when job reaches max attempts and is about to move to DLQ
   *
   * @param error Final error that caused all attempts to fail
   */
  onFailed(_job: Job<PaymentJobData>, error: Error): void {
    this.logger.error(
      `[Payment Processor] Job failed permanently after max attempts: ${error.message}`,
    );

    // TODO: Notify customer that payment creation failed
    // TODO: Send alert to ops team
  }

  /**
   * Optional: Handle job completion
   * Called after job completes successfully
   */
  onCompleted(_job: Job<PaymentJobData>): void {
    this.logger.log(`[Payment Processor] Job completed`);
  }
}
