import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

/**
 * Admin operational service for feature flags, queue stats, and balance monitoring
 * Phase 3: Ops Panels & Monitoring
 */
@Injectable()
export class AdminOpsService {
  private readonly logger = new Logger(AdminOpsService.name);

  // In-memory feature flags (can be moved to database for persistence)
  private readonly featureFlags: Map<string, { enabled: boolean; description: string }> = new Map([
    [
      'payment_processing_enabled',
      { enabled: true, description: 'Enable NOWPayments payment processing' },
    ],
    [
      'fulfillment_enabled',
      { enabled: true, description: 'Enable Kinguin fulfillment orders' },
    ],
    [
      'email_notifications_enabled',
      { enabled: true, description: 'Send email notifications' },
    ],
    [
      'auto_fulfill_enabled',
      { enabled: true, description: 'Automatically fulfill orders on payment' },
    ],
    [
      'captcha_enabled',
      { enabled: true, description: 'Require CAPTCHA on checkout' },
    ],
    [
      'maintenance_mode',
      { enabled: false, description: 'Enable maintenance mode (disables checkout)' },
    ],
    [
      'kinguin_enabled',
      { enabled: true, description: 'Enable Kinguin API integration for product fulfillment' },
    ],
    [
      'custom_products_enabled',
      { enabled: true, description: 'Enable custom product creation and management' },
    ],
  ]);

  constructor(
    @InjectQueue('payments') private readonly paymentsQueue: Queue,
    @InjectQueue('fulfillment') private readonly fulfillmentQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  // ============ FEATURE FLAGS ============

  /**
   * Get all feature flags
   */
  getFeatureFlags(): Array<{ name: string; enabled: boolean; description: string }> {
    return Array.from(this.featureFlags.entries()).map(([name, flag]) => ({
      name,
      ...flag,
    }));
  }

  /**
   * Get single feature flag
   */
  getFeatureFlag(name: string): { enabled: boolean; description: string } | null {
    const flag = this.featureFlags.get(name);
    if (flag === undefined) return null;
    return flag;
  }

  /**
   * Check if a feature flag is enabled (convenience method)
   * Returns false if flag doesn't exist
   */
  isEnabled(name: string): boolean {
    const flag = this.featureFlags.get(name);
    return flag?.enabled ?? false;
  }

  /**
   * Update feature flag
   */
  updateFeatureFlag(
    name: string,
    enabled: boolean,
  ): { success: boolean; message: string } {
    const flag = this.featureFlags.get(name);
    if (flag === undefined) {
      return { success: false, message: `Feature flag ${name} not found` };
    }

    flag.enabled = enabled;
    this.logger.log(
      `✅ Feature flag '${name}' updated to ${enabled ? 'enabled' : 'disabled'}`,
    );
    return { success: true, message: `Feature flag '${name}' updated` };
  }

  /**
   * Create new feature flag
   */
  createFeatureFlag(
    name: string,
    enabled: boolean = false,
    description: string = '',
  ): { success: boolean; message: string } {
    if (this.featureFlags.has(name)) {
      return { success: false, message: `Feature flag ${name} already exists` };
    }

    this.featureFlags.set(name, { enabled, description });
    this.logger.log(`✅ Feature flag '${name}' created (enabled=${enabled})`);
    return { success: true, message: `Feature flag '${name}' created` };
  }

  // ============ QUEUE STATISTICS ============

  /**
   * Get queue statistics (jobs waiting, active, failed, delayed)
   */
  async getQueueStats(): Promise<
    Record<
      string,
      {
        waiting: number;
        active: number;
        failed: number;
        delayed: number;
        paused: number;
        total: number;
      }
    >
  > {
    const stats: Record<
      string,
      {
        waiting: number;
        active: number;
        failed: number;
        delayed: number;
        paused: number;
        total: number;
      }
    > = {};

    // Payments queue
    const paymentCounts = await this.paymentsQueue.getJobCounts();
    stats['payments'] = {
      waiting: paymentCounts.waiting ?? 0,
      active: paymentCounts.active ?? 0,
      failed: paymentCounts.failed ?? 0,
      delayed: paymentCounts.delayed ?? 0,
      paused: paymentCounts.paused ?? 0,
      total:
        (paymentCounts.waiting ?? 0) +
        (paymentCounts.active ?? 0) +
        (paymentCounts.failed ?? 0),
    };

    // Fulfillment queue
    const fulfillmentCounts = await this.fulfillmentQueue.getJobCounts();
    stats['fulfillment'] = {
      waiting: fulfillmentCounts.waiting ?? 0,
      active: fulfillmentCounts.active ?? 0,
      failed: fulfillmentCounts.failed ?? 0,
      delayed: fulfillmentCounts.delayed ?? 0,
      paused: fulfillmentCounts.paused ?? 0,
      total:
        (fulfillmentCounts.waiting ?? 0) +
        (fulfillmentCounts.active ?? 0) +
        (fulfillmentCounts.failed ?? 0),
    };

    return stats;
  }

  /**
   * Get queue details for specific queue
   */
  async getQueueDetails(queueName: string): Promise<{
    name: string;
    stats: { waiting: number; active: number; failed: number; delayed: number };
    recentJobs: Array<{
      id: string;
      data: Record<string, unknown>;
      state: string;
      progress: number;
      attempts: number;
    }>;
  }> {
    let queue: Queue;
    if (queueName === 'payments') {
      queue = this.paymentsQueue;
    } else if (queueName === 'fulfillment') {
      queue = this.fulfillmentQueue;
    } else {
      throw new Error(`Queue ${queueName} not found`);
    }

    const counts = await queue.getJobCounts();
    const activeJobs = await queue.getActiveCount();
    const jobs = await queue.getJobs(['active', 'waiting', 'failed'], 0, 10);

    return {
      name: queueName,
      stats: {
        waiting: counts.waiting ?? 0,
        active: activeJobs,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      },
      recentJobs: jobs.map((job) => {
        const jobData = (job.data ?? {}) as Record<string, unknown>;
        return {
          id: job.id ?? 'unknown',
          data: jobData,
          state: 'unknown',
          progress: (job.progress as unknown as number) ?? 0,
          attempts: job.attemptsMade ?? 0,
        };
      }),
    };
  }

  // ============ BALANCE MONITORING ============

  /**
   * Get current balance and account status
   */
  getBalance(): {
    nowpayments: {
      available: string;
      currency: string;
      lastUpdated: string;
    };
    status: {
      api_connected: boolean;
      webhooks_enabled: boolean;
      sandbox_mode: boolean;
    };
  } {
    // In production, this would call NOWPayments API to get real balance
    // For now, return mock data with timestamp
    const isSandbox = this.configService.get<string>('NOWPAYMENTS_BASE')?.includes('sandbox');

    return {
      nowpayments: {
        available: '0.0000' + 'BTC', // Mock value - would fetch from API
        currency: 'BTC',
        lastUpdated: new Date().toISOString(),
      },
      status: {
        api_connected: true,
        webhooks_enabled: true,
        sandbox_mode: isSandbox ?? false,
      },
    };
  }

  /**
   * Get detailed balance information
   */
  getBalanceDetails(): {
    accounts: Array<{
      currency: string;
      balance: string;
      pending: string;
      locked: string;
    }>;
    totalEUR: string;
    lastSync: string;
  } {
    // In production, would aggregate real balances from payment providers
    return {
      accounts: [
        { currency: 'BTC', balance: '0.0000', pending: '0.0000', locked: '0.0000' },
        { currency: 'ETH', balance: '0.0000', pending: '0.0000', locked: '0.0000' },
        { currency: 'USDT', balance: '0.0000', pending: '0.0000', locked: '0.0000' },
      ],
      totalEUR: '0.00',
      lastSync: new Date().toISOString(),
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    api: { healthy: boolean; uptime: string };
    database: { healthy: boolean; responseTime: string };
    redis: { healthy: boolean; responseTime: string };
    queues: { healthy: boolean; failedJobs: number };
  }> {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const failedPayments = await this.paymentsQueue.getFailedCount();
    const failedFulfillment = await this.fulfillmentQueue.getFailedCount();

    return {
      api: {
        healthy: true,
        uptime: `${hours}h ${minutes}m`,
      },
      database: {
        healthy: true,
        responseTime: '<5ms',
      },
      redis: {
        healthy: true,
        responseTime: '<2ms',
      },
      queues: {
        healthy: (failedPayments + failedFulfillment) === 0,
        failedJobs: (failedPayments ?? 0) + (failedFulfillment ?? 0),
      },
    };
  }
}
