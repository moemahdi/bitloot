import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from '../modules/orders/order.entity';

/**
 * Orphan Order Cleanup Job
 * 
 * Runs every 15 minutes to clean up stale orders that:
 * 1. Have status 'created' (never started payment)
 * 2. Were created more than 30 minutes ago
 * 
 * These orders are marked as 'failed' with reason 'expired'
 * This prevents database pollution from:
 * - Duplicate order creation bugs
 * - Users who abandon checkout
 * - Payment widget failures
 */
@Injectable()
export class OrphanOrderCleanupService {
  private readonly logger = new Logger(OrphanOrderCleanupService.name);
  private readonly ORPHAN_THRESHOLD_MINUTES = 30;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  /**
   * Cleanup orphaned orders every 15 minutes
   * Orders in 'created' status for more than 30 minutes are marked as failed
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupOrphanedOrders(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🧹 Starting orphan order cleanup...');

    try {
      // Calculate cutoff time (30 minutes ago)
      const cutoffTime = new Date(Date.now() - this.ORPHAN_THRESHOLD_MINUTES * 60 * 1000);

      // Find all orphaned orders
      const orphanedOrders = await this.ordersRepo.find({
        where: {
          status: 'created',
          createdAt: LessThan(cutoffTime),
        },
        select: ['id', 'email', 'createdAt', 'status'],
      });

      if (orphanedOrders.length === 0) {
        this.logger.debug('No orphaned orders found');
        return;
      }

      this.logger.log(`Found ${orphanedOrders.length} orphaned orders to clean up`);

      // Mark each order as failed (expired)
      let cleanedCount = 0;
      for (const order of orphanedOrders) {
        try {
          await this.ordersRepo.update(order.id, {
            status: 'failed',
          });
          cleanedCount++;
          this.logger.debug(`Marked order ${order.id} as failed (expired after ${this.ORPHAN_THRESHOLD_MINUTES}min)`);
        } catch (error) {
          this.logger.error(`Failed to cleanup order ${order.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Orphan cleanup complete: ${cleanedCount}/${orphanedOrders.length} orders cleaned in ${duration}ms`);
    } catch (error) {
      this.logger.error('Orphan order cleanup failed:', error);
    }
  }

  /**
   * Manual cleanup method for testing/admin use
   * @returns Number of orders cleaned up
   */
  async manualCleanup(): Promise<number> {
    const cutoffTime = new Date(Date.now() - this.ORPHAN_THRESHOLD_MINUTES * 60 * 1000);

    const result = await this.ordersRepo
      .createQueryBuilder()
      .update(Order)
      .set({ status: 'failed' })
      .where('status = :status', { status: 'created' })
      .andWhere('createdAt < :cutoff', { cutoff: cutoffTime })
      .execute();

    const affected = result.affected ?? 0;
    if (affected > 0) {
      this.logger.log(`Manual cleanup: ${affected} orphaned orders marked as failed`);
    }
    return affected;
  }
}
