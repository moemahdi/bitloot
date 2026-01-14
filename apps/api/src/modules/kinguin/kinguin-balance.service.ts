import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KinguinClient,
  KinguinOrderObject,
  SearchOrdersResponse,
} from '../fulfillment/kinguin.client';
import {
  KinguinBalanceDto,
  SpendingStatsDto,
  KinguinOrderSummaryDto,
  BalanceAlertDto,
  TopProductDto,
  BalanceHistoryPointDto,
  KinguinDashboardDto,
  KinguinHealthDto,
} from './dto/kinguin-balance.dto';

/**
 * Kinguin Balance Service
 *
 * Provides balance monitoring, spending analytics, and alerts
 * for the Kinguin admin dashboard.
 */
@Injectable()
export class KinguinBalanceService {
  private readonly logger = new Logger(KinguinBalanceService.name);

  // Alert thresholds (EUR)
  private readonly CRITICAL_THRESHOLD = 100;
  private readonly WARNING_THRESHOLD = 500;
  private readonly RUNWAY_WARNING_DAYS = 7;

  constructor(
    private readonly kinguinClient: KinguinClient,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get current Kinguin balance with API status
   */
  async getBalance(): Promise<KinguinBalanceDto> {
    const startTime = Date.now();

    try {
      const balance = await this.kinguinClient.getBalance();
      const baseUrl = this.configService.get<string>('KINGUIN_BASE_URL') ?? '';
      const isSandbox = baseUrl.includes('sandbox');

      this.logger.log(`✅ Fetched Kinguin balance: €${balance.toFixed(2)}`);

      return {
        balance,
        currency: 'EUR',
        fetchedAt: new Date().toISOString(),
        apiConnected: true,
        environment: isSandbox ? 'sandbox' : 'production',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to fetch Kinguin balance: ${errorMsg}`);

      // Return error state
      const baseUrl = this.configService.get<string>('KINGUIN_BASE_URL') ?? '';
      const isSandbox = baseUrl.includes('sandbox');

      return {
        balance: 0,
        currency: 'EUR',
        fetchedAt: new Date().toISOString(),
        apiConnected: false,
        environment: isSandbox ? 'sandbox' : 'production',
      };
    }
  }

  /**
   * Get spending statistics for a given period
   */
  async getSpendingStats(period: '24h' | '7d' | '30d'): Promise<SpendingStatsDto> {
    const now = new Date();
    const from = new Date();

    // Calculate start date
    switch (period) {
      case '24h':
        from.setHours(from.getHours() - 24);
        break;
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
    }

    try {
      // Fetch orders from Kinguin
      const response = await this.kinguinClient.searchOrders({
        createdAtFrom: from.toISOString(),
        createdAtTo: now.toISOString(),
        limit: 100, // Get up to 100 orders for stats
      });

      const orders = response.results ?? [];

      // Calculate total spent
      const totalSpent = orders.reduce((sum, order) => sum + (order.paymentPrice ?? 0), 0);

      // Calculate average
      const averageOrderCost = orders.length > 0 ? totalSpent / orders.length : 0;

      // Aggregate top products
      const productMap = new Map<string, { count: number; totalCost: number }>();

      for (const order of orders) {
        for (const product of order.products ?? []) {
          const name = product.name ?? 'Unknown Product';
          const existing = productMap.get(name) ?? { count: 0, totalCost: 0 };
          productMap.set(name, {
            count: existing.count + (product.qty ?? 1),
            totalCost: existing.totalCost + (product.totalPrice ?? 0),
          });
        }
      }

      // Sort by total cost and take top 5
      const topProducts: TopProductDto[] = Array.from(productMap.entries())
        .sort((a, b) => b[1].totalCost - a[1].totalCost)
        .slice(0, 5)
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          totalCost: Math.round(stats.totalCost * 100) / 100,
        }));

      this.logger.log(
        `📊 Spending stats (${period}): €${totalSpent.toFixed(2)} across ${orders.length} orders`,
      );

      return {
        period,
        totalSpent: Math.round(totalSpent * 100) / 100,
        orderCount: response.item_count ?? orders.length,
        averageOrderCost: Math.round(averageOrderCost * 100) / 100,
        topProducts,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to get spending stats: ${errorMsg}`);

      // Return empty stats on error
      return {
        period,
        totalSpent: 0,
        orderCount: 0,
        averageOrderCost: 0,
        topProducts: [],
      };
    }
  }

  /**
   * Get recent Kinguin orders
   */
  async getRecentOrders(limit: number = 10): Promise<KinguinOrderSummaryDto[]> {
    try {
      // Fetch recent orders (last 7 days to ensure we get some)
      const from = new Date();
      from.setDate(from.getDate() - 7);

      const response = await this.kinguinClient.searchOrders({
        createdAtFrom: from.toISOString(),
        createdAtTo: new Date().toISOString(),
        limit,
      });

      const orders = response.results ?? [];

      this.logger.log(`📋 Fetched ${orders.length} recent Kinguin orders`);

      return orders.map((order) => this.mapOrderToSummary(order));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to get recent orders: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Get balance alerts based on thresholds
   */
  async getAlerts(): Promise<BalanceAlertDto[]> {
    const alerts: BalanceAlertDto[] = [];

    try {
      // Get current balance
      const balanceData = await this.getBalance();

      // API connection check
      if (!balanceData.apiConnected) {
        alerts.push({
          type: 'critical',
          message: 'Kinguin API connection failed. Orders may not be fulfilled.',
        });
        return alerts; // Can't check other alerts without API
      }

      const balance = balanceData.balance;

      // Critical: Balance below €100
      if (balance < this.CRITICAL_THRESHOLD) {
        alerts.push({
          type: 'critical',
          message: `Critical: Balance below €${this.CRITICAL_THRESHOLD}! Order fulfillment may fail.`,
          threshold: this.CRITICAL_THRESHOLD,
          currentValue: balance,
        });
      }
      // Warning: Balance below €500
      else if (balance < this.WARNING_THRESHOLD) {
        alerts.push({
          type: 'warning',
          message: `Low balance warning: Below €${this.WARNING_THRESHOLD}`,
          threshold: this.WARNING_THRESHOLD,
          currentValue: balance,
        });
      }

      // Runway calculation
      const spending24h = await this.getSpendingStats('24h');
      const dailyBurn = spending24h.totalSpent;

      if (dailyBurn > 0) {
        const runwayDays = Math.floor(balance / dailyBurn);

        if (runwayDays < this.RUNWAY_WARNING_DAYS) {
          alerts.push({
            type: 'warning',
            message: `Only ${runwayDays} days of runway at current spending rate (€${dailyBurn.toFixed(2)}/day)`,
            currentValue: runwayDays,
          });
        }
      }

      // Info: Sandbox mode
      if (balanceData.environment === 'sandbox') {
        alerts.push({
          type: 'info',
          message: 'Running in Sandbox mode - no real transactions',
        });
      }

      this.logger.log(`🔔 Generated ${alerts.length} alerts`);
      return alerts;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to generate alerts: ${errorMsg}`);

      return [
        {
          type: 'critical',
          message: `Failed to check balance status: ${errorMsg}`,
        },
      ];
    }
  }

  /**
   * Get balance history for charts (estimated from orders)
   * Since Kinguin doesn't provide historical balance, we estimate it
   * by working backwards from current balance using order costs
   */
  async getBalanceHistory(days: number = 30): Promise<BalanceHistoryPointDto[]> {
    try {
      const now = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);

      // Get current balance
      const currentBalance = await this.kinguinClient.getBalance();

      // Get all orders in the period
      const response = await this.kinguinClient.searchOrders({
        createdAtFrom: from.toISOString(),
        createdAtTo: now.toISOString(),
        limit: 100,
      });

      const orders = response.results ?? [];

      // Group orders by date
      const dailySpending = new Map<string, number>();

      for (const order of orders) {
        const orderDate = new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0] ?? '';
        const existing = dailySpending.get(dateKey) ?? 0;
        dailySpending.set(dateKey, existing + (order.paymentPrice ?? 0));
      }

      // Build history points (working backwards from current balance)
      const history: BalanceHistoryPointDto[] = [];
      let runningBalance = currentBalance;

      // Generate points for each day
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0] ?? '';
        const spending = dailySpending.get(dateKey) ?? 0;

        history.unshift({
          date: dateKey,
          balance: Math.round(runningBalance * 100) / 100,
          spending: Math.round(spending * 100) / 100,
        });

        // Add back the spending to estimate previous balance
        runningBalance += spending;
      }

      this.logger.log(`📈 Generated ${history.length} balance history points`);
      return history;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to get balance history: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Get complete dashboard data in a single call
   */
  async getDashboard(): Promise<KinguinDashboardDto> {
    // Fetch all data in parallel for efficiency
    const [balance, spending24h, spending7d, spending30d, recentOrders, alerts] = await Promise.all([
      this.getBalance(),
      this.getSpendingStats('24h'),
      this.getSpendingStats('7d'),
      this.getSpendingStats('30d'),
      this.getRecentOrders(10),
      this.getAlerts(),
    ]);

    // Calculate runway based on best available data
    const dailyBurn = spending24h.totalSpent > 0 
      ? spending24h.totalSpent 
      : spending7d.totalSpent > 0 
        ? spending7d.totalSpent / 7 
        : spending30d.totalSpent / 30;
    const runwayDays = dailyBurn > 0 ? Math.floor(balance.balance / dailyBurn) : 999;

    return {
      balance,
      spending24h,
      spending7d,
      spending30d,
      recentOrders,
      alerts,
      runwayDays: Math.min(runwayDays, 999), // Cap at 999 for display
    };
  }

  /**
   * Health check for Kinguin API
   */
  async healthCheck(): Promise<KinguinHealthDto> {
    const startTime = Date.now();
    const baseUrl = this.configService.get<string>('KINGUIN_BASE_URL') ?? '';
    const isSandbox = baseUrl.includes('sandbox');

    try {
      await this.kinguinClient.getBalance();
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTimeMs: responseTime,
        environment: isSandbox ? 'sandbox' : 'production',
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTimeMs: responseTime,
        environment: isSandbox ? 'sandbox' : 'production',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Map Kinguin order object to summary DTO
   */
  private mapOrderToSummary(order: KinguinOrderObject): KinguinOrderSummaryDto {
    return {
      orderId: order.orderId,
      externalOrderId: order.orderExternalId,
      products: (order.products ?? []).map((p) => ({
        name: p.name ?? 'Unknown Product',
        qty: p.qty ?? 1,
      })),
      paymentPrice: order.paymentPrice ?? 0,
      status: order.status,
      createdAt: order.createdAt,
    };
  }
}
