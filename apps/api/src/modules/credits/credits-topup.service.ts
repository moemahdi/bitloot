import { Injectable, Logger, NotFoundException, BadRequestException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { CreditTopup } from './entities/credit-topup.entity';
import { CreditsService } from './credits.service';
import { BalanceCapExceededError, DailyTopupLimitError, TopupRateLimitError } from './credits.errors';
import { NowPaymentsClient } from '../payments/nowpayments.client';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments/payments.service';
import { EmbeddedPaymentResponseDto } from '../payments/dto/create-payment.dto';
import { TopupResponseDto, TopupStatusResponseDto } from './dto/create-topup.dto';

const BALANCE_CAP = 2000;
const DAILY_LIMIT = 1000;
const HOURLY_RATE_LIMIT = 25;

@Injectable()
export class CreditsTopupService {
  private readonly logger = new Logger(CreditsTopupService.name);

  constructor(
    @InjectRepository(CreditTopup)
    private readonly topupRepo: Repository<CreditTopup>,
    private readonly creditsService: CreditsService,
    private readonly npClient: NowPaymentsClient,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Get a pending topup by ID. Verifies ownership.
   */
  async getTopup(topupId: string, userId: string): Promise<TopupResponseDto> {
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (!topup) {
      throw new NotFoundException(`Top-up ${topupId} not found`);
    }
    if (topup.userId !== userId) {
      throw new BadRequestException('Top-up does not belong to this user');
    }
    return {
      topupId: topup.id,
      amountEur: parseFloat(topup.amountEur),
    };
  }

  /**
   * Get topup status including NOWPayments payment status.
   * Used for polling on the checkout page.
   */
  async getTopupStatus(topupId: string, userId: string): Promise<TopupStatusResponseDto> {
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (!topup) {
      throw new NotFoundException(`Top-up ${topupId} not found`);
    }
    if (topup.userId !== userId) {
      throw new BadRequestException('Top-up does not belong to this user');
    }

    const response: TopupStatusResponseDto = {
      topupId: topup.id,
      amountEur: parseFloat(topup.amountEur),
      status: topup.status,
      npPaymentId: topup.npPaymentId ?? undefined,
      confirmedAt: topup.confirmedAt?.toISOString(),
    };

    // If there's an NOWPayments payment ID, poll for current status
    if (topup.npPaymentId) {
      try {
        const npStatus = await this.npClient.getPaymentStatus(topup.npPaymentId);
        response.paymentStatus = npStatus.payment_status;
        response.payCurrency = npStatus.pay_currency;
        response.actuallyPaid = npStatus.actuallyPaid ?? undefined;
        response.payAmount = npStatus.pay_amount ?? undefined;

        // Auto-confirm if NP shows finished but our topup is still pending
        // This handles cases where IPN webhook didn't arrive (localhost, network issues)
        if (npStatus.payment_status === 'finished' && topup.status === 'pending') {
          this.logger.log(`Auto-confirming topup ${topupId} based on NP status poll (IPN fallback)`);
          await this.confirmTopup(topupId, topup.npPaymentId);
          response.status = 'confirmed';
          response.confirmedAt = new Date().toISOString();
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch NOWPayments status for ${topup.npPaymentId}: ${error}`);
        // Return without payment status - frontend will retry
      }
    }

    return response;
  }

  /**
   * Create a top-up record (no payment yet).
   * User will select crypto currency on the checkout page, then createTopupPayment is called.
   */
  async createTopup(
    userId: string,
    amountEur: number,
  ): Promise<{ topupId: string; amountEur: number }> {
    // 1. Check current balance against cap
    const balance = await this.creditsService.getBalance(userId);
    if (balance.total + amountEur > BALANCE_CAP) {
      throw new BalanceCapExceededError(balance.total, amountEur, BALANCE_CAP);
    }

    // 2. Check daily limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyTotal = await this.topupRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t."amountEur"::numeric), 0)', 'total')
      .where('t."userId" = :userId AND t.status = :status AND t."createdAt" > :since', {
        userId,
        status: 'confirmed',
        since: oneDayAgo,
      })
      .getRawOne();

    if (parseFloat(dailyTotal?.total ?? '0') + amountEur > DAILY_LIMIT) {
      throw new DailyTopupLimitError();
    }

    // 3. Check rate limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await this.topupRepo.count({
      where: {
        userId,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (hourlyCount >= HOURLY_RATE_LIMIT) {
      throw new TopupRateLimitError();
    }

    // 4. Create top-up record
    const topup = this.topupRepo.create({
      userId,
      amountEur: amountEur.toFixed(8),
      status: 'pending',
    });

    const saved = await this.topupRepo.save(topup);
    this.logger.log(`Created top-up ${saved.id} for user ${userId}: €${amountEur}`);

    return { topupId: saved.id, amountEur };
  }

  /**
   * Create an embedded payment for a pending top-up.
   * Called after user selects cryptocurrency on the checkout page.
   */
  async createTopupPayment(
    topupId: string,
    userId: string,
    payCurrency: string,
  ): Promise<EmbeddedPaymentResponseDto> {
    // 1. Get the topup record
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (topup === null || topup === undefined) {
      throw new NotFoundException(`Top-up ${topupId} not found`);
    }

    // 2. Verify ownership
    if (topup.userId !== userId) {
      throw new BadRequestException('Top-up does not belong to this user');
    }

    // 3. Verify status
    if (topup.status !== 'pending') {
      throw new BadRequestException(`Cannot create payment for top-up in status "${topup.status}"`);
    }

    // 4. Check if payment already exists
    if (topup.npPaymentId !== null && topup.npPaymentId !== undefined) {
      // Return existing payment details by fetching from NOWPayments
      try {
        const existingPayment = await this.npClient.getPaymentStatus(topup.npPaymentId);
        
        const qrCodeData = this.generateQrCodeData(
          existingPayment.pay_currency,
          existingPayment.pay_address,
          existingPayment.pay_amount ?? 0,
        );

        const expiresAt = existingPayment.expiration_date ?? 
          new Date(Date.now() + 60 * 60 * 1000).toISOString();

        return {
          paymentId: existingPayment.payment_id.toString(),
          externalId: existingPayment.payment_id.toString(),
          orderId: `topup:${topupId}`,
          payAddress: existingPayment.pay_address ?? '',
          payAmount: existingPayment.pay_amount ?? 0,
          payCurrency: existingPayment.pay_currency ?? payCurrency,
          priceAmount: existingPayment.price_amount,
          priceCurrency: existingPayment.price_currency,
          status: existingPayment.payment_status,
          expiresAt,
          qrCodeData,
          estimatedTime: this.getEstimatedConfirmationTime(existingPayment.pay_currency ?? payCurrency),
        };
      } catch (error) {
        this.logger.warn(`Failed to fetch existing payment ${topup.npPaymentId}, creating new payment`);
        // Payment fetch failed, continue to create a new one
      }
    }

    const amountEur = parseFloat(topup.amountEur);

    // 5. Check currency availability and minimum
    const availability = await this.paymentsService.checkCurrencyAvailability(
      payCurrency,
      amountEur,
      'eur',
    );

    if (!availability.available) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'AMOUNT_BELOW_MINIMUM',
          message: availability.message,
          payCurrency,
          estimatedAmount: availability.estimatedAmount,
          minAmount: availability.minAmount,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // 6. Create NOWPayments payment (embedded - no redirect)
    try {
      const webhookBaseUrl = this.configService.get<string>('WEBHOOK_BASE_URL') ?? 'https://api.bitloot.io';

      const npPayment = await this.npClient.createPayment({
        price_amount: amountEur,
        price_currency: 'eur',
        pay_currency: payCurrency,
        order_id: `topup:${topupId}`,
        order_description: `BitLoot Credits Top-up €${amountEur.toFixed(2)}`,
        ipn_callback_url: `${webhookBaseUrl}/webhooks/nowpayments/ipn`,
        // NO success_url / cancel_url = embedded flow (no redirect)
      });

      // Update topup with NOWPayments payment ID
      topup.npPaymentId = npPayment.payment_id.toString();
      await this.topupRepo.save(topup);

      this.logger.log(
        `Created embedded payment for top-up ${topupId}: NP ID ${npPayment.payment_id}, amount ${npPayment.pay_amount} ${npPayment.pay_currency}`,
      );

      // Generate QR code data
      const qrCodeData = this.generateQrCodeData(
        npPayment.pay_currency,
        npPayment.pay_address,
        npPayment.pay_amount,
      );

      // Calculate expiration
      const expiresAt = npPayment.expiration_date ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();

      return {
        paymentId: npPayment.payment_id.toString(),
        externalId: npPayment.payment_id.toString(),
        orderId: `topup:${topupId}`,
        payAddress: npPayment.pay_address,
        payAmount: npPayment.pay_amount,
        payCurrency: npPayment.pay_currency,
        priceAmount: npPayment.price_amount,
        priceCurrency: npPayment.price_currency,
        status: npPayment.payment_status,
        expiresAt,
        qrCodeData,
        estimatedTime: this.getEstimatedConfirmationTime(payCurrency),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMsg = error instanceof Error ? error.message : 'unknown error';
      if (errorMsg.includes('less than minimal') || errorMsg.includes('min_amount')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            error: 'AMOUNT_BELOW_MINIMUM',
            message: `${payCurrency.toUpperCase()} is unavailable for this amount. Please choose a different cryptocurrency.`,
            payCurrency,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      this.logger.error(`Failed to create embedded payment for top-up ${topupId}:`, error);
      throw new InternalServerErrorException(`Failed to create payment: ${errorMsg}`);
    }
  }

  /**
   * Generate QR code data URI for crypto wallet apps
   */
  private generateQrCodeData(currency: string, address: string, amount: number): string {
    const currencyLower = currency.toLowerCase();

    if (currencyLower === 'btc') {
      return `bitcoin:${address}?amount=${amount}`;
    }
    if (currencyLower === 'eth') {
      return `ethereum:${address}?value=${amount}`;
    }
    if (currencyLower === 'ltc') {
      return `litecoin:${address}?amount=${amount}`;
    }
    if (currencyLower === 'usdt' || currencyLower === 'usdttrc20') {
      return `tron:${address}?amount=${amount}`;
    }
    // Generic fallback
    return address;
  }

  /**
   * Get estimated confirmation time for a cryptocurrency
   */
  private getEstimatedConfirmationTime(currency: string): string {
    const times: Record<string, string> = {
      btc: '10-60 minutes',
      eth: '2-5 minutes',
      ltc: '2-10 minutes',
      xrp: '< 1 minute',
      usdt: '5-15 minutes',
      usdttrc20: '1-3 minutes',
      trx: '1-3 minutes',
      bnb: '< 1 minute',
      sol: '< 1 minute',
      doge: '10-30 minutes',
      matic: '2-5 minutes',
    };
    return times[currency.toLowerCase()] ?? '5-30 minutes';
  }

  async confirmTopup(topupId: string, paymentId: string): Promise<void> {
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (topup === null || topup === undefined) {
      throw new NotFoundException(`Top-up ${topupId} not found`);
    }

    // Idempotent: already confirmed
    if (topup.status === 'confirmed') {
      this.logger.log(`Top-up ${topupId} already confirmed`);
      return;
    }

    if (topup.status !== 'pending') {
      this.logger.warn(`Cannot confirm top-up ${topupId} in status "${topup.status}"`);
      return;
    }

    topup.status = 'confirmed';
    topup.npPaymentId = paymentId; // Store NP's numeric payment ID in npPaymentId (not UUID paymentId)
    topup.confirmedAt = new Date();
    await this.topupRepo.save(topup);

    // Grant cash credits
    const amount = parseFloat(topup.amountEur);
    await this.creditsService.grantCashCredits(
      topup.userId,
      amount,
      'topup',
      'topup',
      topup.id,
      `Top-up €${amount.toFixed(2)} confirmed`,
    );

    this.logger.log(`Confirmed top-up ${topupId}: €${amount.toFixed(2)} cash credits granted to user ${topup.userId}`);
  }

  async failTopup(topupId: string): Promise<void> {
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (topup === null || topup === undefined) return;

    if (topup.status !== 'pending') return;

    topup.status = 'failed';
    await this.topupRepo.save(topup);
    this.logger.log(`Failed top-up ${topupId}`);
  }

  /**
   * Check if a NOWPayments external payment ID is associated with a pending top-up.
   * If found, confirm it (grant cash credits). Returns true if a top-up was confirmed.
   *
   * This is called from the IPN handler when a payment finishes.
   * The link is established via the npPaymentId column on CreditTopup.
   */
  async confirmTopupByPaymentId(externalPaymentId: string): Promise<boolean> {
    // Find pending top-ups that reference this external payment ID.
    // CreditTopup.npPaymentId stores the external NOWPayments payment ID (set during payment creation).
    const topup = await this.topupRepo.findOne({
      where: { npPaymentId: externalPaymentId, status: 'pending' },
    });

    if (topup === null || topup === undefined) {
      return false; // Not a top-up payment
    }

    // Reuse existing confirm logic
    await this.confirmTopup(topup.id, externalPaymentId);
    return true;
  }

  async getUserTopupHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: CreditTopup[]; total: number }> {
    const [items, total] = await this.topupRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async getTopupById(id: string): Promise<CreditTopup | null> {
    return this.topupRepo.findOne({ where: { id } });
  }

  async getPendingTopups(): Promise<CreditTopup[]> {
    return this.topupRepo.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Manual confirmation fallback when IPN doesn't arrive (e.g., localhost development).
   * Checks NOWPayments status and confirms if payment is finished.
   */
  async manualConfirmTopup(
    topupId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const topup = await this.topupRepo.findOne({ where: { id: topupId } });
    if (!topup) {
      throw new NotFoundException(`Top-up ${topupId} not found`);
    }
    if (topup.userId !== userId) {
      throw new BadRequestException('Top-up does not belong to this user');
    }

    // Already confirmed
    if (topup.status === 'confirmed') {
      return { success: true, message: 'Top-up already confirmed' };
    }

    // Not in pending state
    if (topup.status !== 'pending') {
      return { success: false, message: `Top-up is in ${topup.status} state` };
    }

    // No payment created yet
    if (!topup.npPaymentId) {
      return { success: false, message: 'No payment has been created for this top-up' };
    }

    // Check NOWPayments status
    try {
      const npStatus = await this.npClient.getPaymentStatus(topup.npPaymentId);

      if (npStatus.payment_status === 'finished') {
        // Payment is confirmed - grant credits
        await this.confirmTopup(topupId, topup.npPaymentId);
        this.logger.log(`Manual confirm top-up ${topupId}: credits granted`);
        return { success: true, message: 'Top-up confirmed and credits granted' };
      } else if (npStatus.payment_status === 'confirming' || npStatus.payment_status === 'confirmed') {
        return {
          success: false,
          message: `Payment is still ${npStatus.payment_status}. Please wait for blockchain confirmation.`,
        };
      } else if (npStatus.payment_status === 'waiting' || npStatus.payment_status === 'sending') {
        return {
          success: false,
          message: 'Payment has not been received yet. Please complete the payment.',
        };
      } else {
        return {
          success: false,
          message: `Payment status is ${npStatus.payment_status}. Cannot confirm.`,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Manual confirm error for ${topupId}: ${errorMsg}`);
      throw new BadRequestException(`Failed to verify payment status: ${errorMsg}`);
    }
  }
}
