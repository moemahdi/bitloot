import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../modules/orders/order.entity';
import { Payment } from '../modules/payments/payment.entity';

/**
 * Orphan Order Cleanup Job
 *
 * Runs every 15 minutes to clean up stale orders:
 *
 * Scenario 1: Orders WITH a payment that is older than 1 hour
 * - User started payment but never completed it
 * - Mark as 'expired' (payment window closed)
 *
 * Scenario 2: Orders WITHOUT any payment that are older than 24 hours
 * - User abandoned checkout before selecting currency
 * - Mark as 'expired' (abandoned cart cleanup)
 *
 * This prevents database pollution from:
 * - Duplicate order creation bugs
 * - Users who abandon checkout
 * - Payment widget failures
 *
 * IMPORTANT: Orders WITHOUT payments are given a much longer window (24h)
 * because users may be browsing, comparing currencies, or simply distracted.
 * The 1-hour window only applies AFTER a payment is created.
 */
@Injectable()
export class OrphanOrderCleanupService {
  private readonly logger = new Logger(OrphanOrderCleanupService.name);

  /**
   * Threshold for payment expiration (1 hour)
   * Orders WITH a payment record older than 60 minutes are expired
   * This is the "payment window" that users see
   */
  private readonly PAYMENT_WINDOW_MINUTES = 60;

  /**
   * Threshold for abandoned cart cleanup (24 hours)
   * Orders WITHOUT any payment record older than 24 hours are cleaned up
   * This gives users plenty of time to browse and come back
   */
  private readonly ABANDONED_CART_HOURS = 24;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
  ) {}

  /**
   * Cleanup orphaned/expired orders every 15 minutes
   *
   * Two separate cleanup scenarios:
   * 1. Orders WITH payments older than 1 hour → Payment window expired
   * 2. Orders WITHOUT payments older than 24 hours → Abandoned cart
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupOrphanedOrders(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🧹 Starting orphan order cleanup...');

    try {
      let totalCleaned = 0;

      // Scenario 1: Orders WITH payments older than 1 hour
      // These are orders where user started paying but never completed
      totalCleaned += await this.cleanupExpiredPayments();

      // Scenario 2: Orders WITHOUT payments older than 24 hours
      // These are abandoned carts where user never selected a currency
      totalCleaned += await this.cleanupAbandonedCarts();

      const duration = Date.now() - startTime;
      if (totalCleaned > 0) {
        this.logger.log(`✅ Orphan cleanup complete: ${totalCleaned} orders cleaned in ${duration}ms`);
      } else {
        this.logger.debug(`No orphaned orders found (${duration}ms)`);
      }
    } catch (error) {
      this.logger.error('Orphan order cleanup failed:', error);
    }
  }

  /**
   * Scenario 1: Expire orders that have a payment older than 1 hour
   * These users started the payment process but never completed it
   */
  private async cleanupExpiredPayments(): Promise<number> {
    const paymentCutoff = new Date(Date.now() - this.PAYMENT_WINDOW_MINUTES * 60 * 1000);

    // Find orders with payments older than the payment window
    // that are still in 'created' or 'pending' status
    const expiredPaymentOrders = await this.ordersRepo
      .createQueryBuilder('order')
      .innerJoin(Payment, 'payment', 'payment.orderId = order.id')
      .where('order.status IN (:...statuses)', { statuses: ['created', 'pending'] })
      .andWhere('payment.createdAt < :cutoff', { cutoff: paymentCutoff })
      .andWhere('payment.status NOT IN (:...finalStatuses)', {
        finalStatuses: ['finished', 'confirmed', 'underpaid'],
      })
      .select(['order.id', 'order.email', 'order.createdAt'])
      .getMany();

    if (expiredPaymentOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `Found ${expiredPaymentOrders.length} orders with expired payment windows (>${this.PAYMENT_WINDOW_MINUTES}min)`,
    );

    let cleanedCount = 0;
    for (const order of expiredPaymentOrders) {
      try {
        await this.ordersRepo.update(order.id, { status: 'expired' });
        await this.paymentsRepo.update({ orderId: order.id }, { status: 'failed' });
        cleanedCount++;
        this.logger.debug(
          `Marked order ${order.id} as expired (payment window closed after ${this.PAYMENT_WINDOW_MINUTES}min)`,
        );
      } catch (error) {
        this.logger.error(`Failed to expire order ${order.id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Scenario 2: Clean up abandoned carts older than 24 hours
   * These are orders where user never even selected a payment currency
   */
  private async cleanupAbandonedCarts(): Promise<number> {
    const abandonedCutoff = new Date(Date.now() - this.ABANDONED_CART_HOURS * 60 * 60 * 1000);

    // Find orders in 'created' status with NO associated payment record
    // and older than 24 hours
    const abandonedOrders = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin(Payment, 'payment', 'payment.orderId = order.id')
      .where('order.status = :status', { status: 'created' })
      .andWhere('order.createdAt < :cutoff', { cutoff: abandonedCutoff })
      .andWhere('payment.id IS NULL') // No payment record exists
      .select(['order.id', 'order.email', 'order.createdAt'])
      .getMany();

    if (abandonedOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `Found ${abandonedOrders.length} abandoned cart orders (>${this.ABANDONED_CART_HOURS}h, no payment)`,
    );

    let cleanedCount = 0;
    for (const order of abandonedOrders) {
      try {
        await this.ordersRepo.update(order.id, { status: 'expired' });
        cleanedCount++;
        this.logger.debug(
          `Marked order ${order.id} as expired (abandoned cart after ${this.ABANDONED_CART_HOURS}h)`,
        );
      } catch (error) {
        this.logger.error(`Failed to expire abandoned order ${order.id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Manual cleanup method for testing/admin use
   * Runs both cleanup scenarios immediately
   * @returns Number of orders cleaned up
   */
  async manualCleanup(): Promise<number> {
    this.logger.log('🔧 Running manual orphan cleanup...');

    const expiredPayments = await this.cleanupExpiredPayments();
    const abandonedCarts = await this.cleanupAbandonedCarts();

    const total = expiredPayments + abandonedCarts;
    if (total > 0) {
      this.logger.log(
        `Manual cleanup complete: ${expiredPayments} expired payments, ${abandonedCarts} abandoned carts`,
      );
    }
    return total;
  }
}
