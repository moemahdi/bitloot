import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { KinguinClient, KinguinOrderObject } from '../fulfillment/kinguin.client';
import {
  ProfitSummaryDto,
  ProductProfitDto,
  ProfitTrendPointDto,
  ProfitTrendDto,
  MarginDistributionDto,
  MarginDistributionBucketDto,
  ProfitAlertDto,
  ProfitAlertsDto,
  ProductProfitListDto,
  ProfitDashboardDto,
} from './dto/kinguin-profit.dto';

/**
 * Order with items and cost data for profit calculation
 */
interface OrderWithCost {
  orderId: string;
  revenue: number; // BitLoot selling price (totalCrypto in EUR equivalent)
  cost: number; // Kinguin cost (paymentPrice)
  productId: string;
  productName: string;
  quantity: number;
  createdAt: Date;
}

/**
 * Kinguin Profit Service
 *
 * Calculates profit metrics by cross-referencing:
 * - BitLoot orders (revenue from customer payments)
 * - Kinguin orders (cost of goods sold)
 *
 * Profit = Revenue - Cost
 * Margin = (Profit / Revenue) × 100
 */
@Injectable()
export class KinguinProfitService {
  private readonly logger = new Logger(KinguinProfitService.name);

  // Alert thresholds
  private readonly LOW_MARGIN_THRESHOLD = 15; // Warn if margin < 15%
  private readonly NEGATIVE_PROFIT_THRESHOLD = 0; // Alert if profit is negative
  private readonly HIGH_MARGIN_THRESHOLD = 40; // Success if margin > 40%

  // Cache for product names to avoid repeated DB lookups
  private productNameCache = new Map<string, string>();

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly kinguinClient: KinguinClient,
  ) {}

  // ========== HELPER METHODS ==========

  /**
   * Get product name by ID, with caching
   */
  private async getProductName(productId: string): Promise<string> {
    // Check cache first
    if (this.productNameCache.has(productId)) {
      return this.productNameCache.get(productId)!;
    }

    try {
      const product = await this.productsRepo.findOne({
        where: { id: productId },
        select: ['id', 'title'],
      });

      const name = product?.title ?? productId;
      this.productNameCache.set(productId, name);
      return name;
    } catch {
      return productId; // Return ID as fallback
    }
  }

  /**
   * Bulk fetch product names and populate cache
   */
  private async preloadProductNames(productIds: string[]): Promise<void> {
    const uncachedIds = productIds.filter((id) => !this.productNameCache.has(id));

    if (uncachedIds.length === 0) return;

    try {
      const products = await this.productsRepo.find({
        where: { id: In(uncachedIds) },
        select: ['id', 'title'],
      });

      for (const product of products) {
        this.productNameCache.set(product.id, product.title);
      }

      // Set fallback for any IDs not found
      for (const id of uncachedIds) {
        if (!this.productNameCache.has(id)) {
          this.productNameCache.set(id, id);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to preload product names: ${error}`);
    }
  }

  /**
   * Get date range for a period
   */
  private getDateRange(period: '24h' | '7d' | '30d' | '90d' | 'total'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'total':
        // All time - set start to a very old date (e.g., 2020-01-01)
        start.setFullYear(2020, 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  }

  /**
   * Fetch fulfilled BitLoot orders for a date range
   * Includes orders with sourceType='kinguin' OR orders with kinguinReservationId set
   * (for backwards compatibility with orders created before sourceType was added)
   */
  private async getFulfilledOrders(start: Date, end: Date): Promise<Order[]> {
    const fulfilledStatuses: OrderStatus[] = ['fulfilled'];

    // Use query builder to handle OR condition for sourceType or kinguinReservationId
    return this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.status IN (:...statuses)', { statuses: fulfilledStatuses })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(order.sourceType = :sourceType OR order.kinguinReservationId IS NOT NULL)',
        { sourceType: 'kinguin' }
      )
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Fetch Kinguin orders for a date range to get costs
   */
  private async getKinguinOrderCosts(start: Date, end: Date): Promise<Map<string, number>> {
    const costMap = new Map<string, number>();

    try {
      const response = await this.kinguinClient.searchOrders({
        createdAtFrom: start.toISOString(),
        createdAtTo: end.toISOString(),
        limit: 500,
      });

      for (const order of response.results) {
        // Map Kinguin order ID to payment price (cost)
        costMap.set(order.orderId, order.paymentPrice ?? 0);
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch Kinguin orders for cost data: ${error}`);
    }

    return costMap;
  }

  /**
   * Calculate revenue from BitLoot order
   * Uses sum of (unitPrice × quantity) for each item
   */
  private calculateOrderRevenue(order: Order): number {
    if (!order.items || order.items.length === 0) {
      this.logger.warn(`Order ${order.id} has no items loaded!`);
      return 0;
    }

    const revenue = order.items.reduce((sum, item) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + unitPrice * item.quantity;
    }, 0);
    
    this.logger.debug(`Order ${order.id}: ${order.items.length} items, revenue €${revenue.toFixed(2)}`);
    return revenue;
  }

  /**
   * Get cost for an order from Kinguin
   * Uses kinguinReservationId to match with Kinguin order
   */
  private async getOrderCost(order: Order): Promise<number> {
    if (!order.kinguinReservationId) {
      return 0;
    }

    try {
      // Kinguin order ID is stored as kinguinReservationId
      const kinguinOrder = await this.kinguinClient.getOrder(order.kinguinReservationId);
      return kinguinOrder?.paymentPrice ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Build order-with-cost data for profit calculations
   */
  private async buildOrdersWithCost(
    orders: Order[],
    kinguinCostMap: Map<string, number>,
  ): Promise<OrderWithCost[]> {
    const result: OrderWithCost[] = [];

    // Collect all unique product IDs and preload names
    const productIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items || []) {
        productIds.add(item.productId);
      }
    }
    await this.preloadProductNames(Array.from(productIds));

    for (const order of orders) {
      const revenue = this.calculateOrderRevenue(order);
      
      // Skip test orders (orders with no revenue)
      if (revenue === 0) {
        continue;
      }
      
      // Get cost from map or fetch individually
      let cost = 0;
      if (order.kinguinReservationId) {
        cost = kinguinCostMap.get(order.kinguinReservationId) ?? 0;
        
        // If not in map, try to fetch individually
        if (cost === 0) {
          cost = await this.getOrderCost(order);
        }
      }

      // Add each item as a separate entry for per-product analysis
      for (const item of order.items || []) {
        const itemRevenue = (parseFloat(item.unitPrice) || 0) * item.quantity;
        
        // Skip items with no revenue
        if (itemRevenue === 0) {
          continue;
        }
        
        const itemCostRatio = revenue > 0 ? itemRevenue / revenue : 0;
        const itemCost = cost * itemCostRatio; // Proportional cost

        // Get product name from cache (preloaded above)
        const productName = this.productNameCache.get(item.productId) ?? item.productId;

        result.push({
          orderId: order.id,
          revenue: itemRevenue,
          cost: itemCost,
          productId: item.productId,
          productName,
          quantity: item.quantity,
          createdAt: order.createdAt,
        });
      }
    }

    return result;
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Get profit summary for a period
   */
  async getProfitSummary(period: '24h' | '7d' | '30d' | '90d' | 'total'): Promise<ProfitSummaryDto> {
    const { start, end } = this.getDateRange(period);

    this.logger.log(`📊 Calculating profit summary for ${period} (${start.toISOString()} to ${end.toISOString()})...`);

    // Fetch BitLoot orders
    const orders = await this.getFulfilledOrders(start, end);
    this.logger.log(`📦 Found ${orders.length} fulfilled orders for ${period}`);
    
    // Fetch Kinguin costs
    const kinguinCostMap = await this.getKinguinOrderCosts(start, end);
    this.logger.log(`💰 Kinguin cost map has ${kinguinCostMap.size} entries`);

    // Calculate totals - only include orders with revenue > 0 (skip test orders)
    let totalRevenue = 0;
    let totalCost = 0;
    let ordersWithCost = 0;
    let ordersWithoutCost = 0;
    let skippedTestOrders = 0;
    let validOrderCount = 0;

    for (const order of orders) {
      const revenue = this.calculateOrderRevenue(order);
      
      // Skip test orders (orders with no revenue)
      // These are likely test orders or orders created before unitPrice was tracked
      if (revenue === 0) {
        skippedTestOrders++;
        this.logger.debug(`Order ${order.id}: Skipping test order (revenue = 0)`);
        continue;
      }
      
      validOrderCount++;
      totalRevenue += revenue;

      // Get cost from Kinguin
      if (order.kinguinReservationId) {
        let cost = kinguinCostMap.get(order.kinguinReservationId) ?? 0;
        
        // If not in map, try to fetch individually
        if (cost === 0) {
          cost = await this.getOrderCost(order);
          if (cost > 0) {
            this.logger.debug(`Order ${order.id}: Cost fetched individually: €${cost.toFixed(2)}`);
          }
        }
        
        if (cost > 0) {
          ordersWithCost++;
        } else {
          ordersWithoutCost++;
          this.logger.debug(`Order ${order.id}: No cost found for reservation ${order.kinguinReservationId}`);
        }
        
        totalCost += cost;
      } else {
        ordersWithoutCost++;
      }
    }

    this.logger.log(`📊 ${period}: ${validOrderCount} valid orders, ${skippedTestOrders} test orders skipped, ${ordersWithCost} with cost, ${ordersWithoutCost} without cost`);

    const grossProfit = totalRevenue - totalCost;
    const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const orderCount = validOrderCount; // Only count real orders, not test orders
    const avgProfitPerOrder = orderCount > 0 ? grossProfit / orderCount : 0;
    const avgRevenuePerOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
    const avgCostPerOrder = orderCount > 0 ? totalCost / orderCount : 0;
    const roiPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    this.logger.log(
      `✅ Profit summary for ${period}: Revenue €${totalRevenue.toFixed(2)}, Cost €${totalCost.toFixed(2)}, Profit €${grossProfit.toFixed(2)} (${profitMarginPercent.toFixed(1)}%)`,
    );

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      orderCount,
      avgProfitPerOrder: Math.round(avgProfitPerOrder * 100) / 100,
      avgRevenuePerOrder: Math.round(avgRevenuePerOrder * 100) / 100,
      avgCostPerOrder: Math.round(avgCostPerOrder * 100) / 100,
      roiPercent: Math.round(roiPercent * 10) / 10,
      period,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Get per-product profitability breakdown
   */
  async getProductProfitability(
    period: '24h' | '7d' | '30d' | '90d' | 'total',
    limit: number = 20,
  ): Promise<ProductProfitListDto> {
    const { start, end } = this.getDateRange(period);

    this.logger.log(`📊 Calculating product profitability for ${period}...`);

    const orders = await this.getFulfilledOrders(start, end);
    const kinguinCostMap = await this.getKinguinOrderCosts(start, end);
    const ordersWithCost = await this.buildOrdersWithCost(orders, kinguinCostMap);

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        unitsSold: number;
        totalRevenue: number;
        totalCost: number;
      }
    >();

    for (const item of ordersWithCost) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.totalRevenue += item.revenue;
        existing.totalCost += item.cost;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          unitsSold: item.quantity,
          totalRevenue: item.revenue,
          totalCost: item.cost,
        });
      }
    }

    // Convert to array and calculate metrics
    const products: ProductProfitDto[] = Array.from(productMap.values())
      .map((p) => {
        const totalProfit = p.totalRevenue - p.totalCost;
        const marginPercent = p.totalRevenue > 0 ? (totalProfit / p.totalRevenue) * 100 : 0;
        const avgSellPrice = p.unitsSold > 0 ? p.totalRevenue / p.unitsSold : 0;
        const avgCostPrice = p.unitsSold > 0 ? p.totalCost / p.unitsSold : 0;
        const avgProfitPerUnit = p.unitsSold > 0 ? totalProfit / p.unitsSold : 0;

        return {
          productId: p.productId,
          productName: p.productName,
          unitsSold: p.unitsSold,
          totalRevenue: Math.round(p.totalRevenue * 100) / 100,
          totalCost: Math.round(p.totalCost * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          marginPercent: Math.round(marginPercent * 10) / 10,
          avgSellPrice: Math.round(avgSellPrice * 100) / 100,
          avgCostPrice: Math.round(avgCostPrice * 100) / 100,
          avgProfitPerUnit: Math.round(avgProfitPerUnit * 100) / 100,
        };
      })
      // Sort by total profit descending
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit);

    return {
      products,
      total: productMap.size,
      period,
    };
  }

  /**
   * Get top N most profitable products
   */
  async getTopProducts(
    period: '24h' | '7d' | '30d' | '90d' | 'total',
    limit: number = 10,
  ): Promise<ProductProfitDto[]> {
    const result = await this.getProductProfitability(period, limit);
    return result.products;
  }

  /**
   * Get low margin products (below threshold)
   */
  async getLowMarginProducts(
    threshold: number = 15,
    limit: number = 10,
  ): Promise<ProductProfitDto[]> {
    const result = await this.getProductProfitability('30d', 100);

    return result.products
      .filter((p) => p.marginPercent < threshold && p.marginPercent >= 0)
      .sort((a, b) => a.marginPercent - b.marginPercent)
      .slice(0, limit);
  }

  /**
   * Get daily profit trend for charting
   */
  async getProfitTrend(days: number = 30): Promise<ProfitTrendDto> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    this.logger.log(`📊 Calculating profit trend for ${days} days...`);

    const orders = await this.getFulfilledOrders(start, end);
    const kinguinCostMap = await this.getKinguinOrderCosts(start, end);

    // Group by date
    const dailyData = new Map<
      string,
      { revenue: number; cost: number; orderCount: number }
    >();

    // Initialize all dates with zeros
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0] ?? '';
      if (dateKey) {
        dailyData.set(dateKey, { revenue: 0, cost: 0, orderCount: 0 });
      }
    }

    // Aggregate orders by date (skip test orders with no revenue)
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0] ?? '';
      const existing = dailyData.get(dateKey);
      if (!existing) continue;

      const revenue = this.calculateOrderRevenue(order);
      
      // Skip test orders (no revenue)
      if (revenue === 0) {
        continue;
      }
      
      let cost = 0;
      if (order.kinguinReservationId) {
        cost = kinguinCostMap.get(order.kinguinReservationId) ?? 0;
      }

      existing.revenue += revenue;
      existing.cost += cost;
      existing.orderCount += 1;
    }

    // Convert to trend array
    const trend: ProfitTrendPointDto[] = Array.from(dailyData.entries())
      .map(([date, data]) => {
        const profit = data.revenue - data.cost;
        const marginPercent = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

        return {
          date,
          revenue: Math.round(data.revenue * 100) / 100,
          cost: Math.round(data.cost * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          marginPercent: Math.round(marginPercent * 10) / 10,
          orderCount: data.orderCount,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary stats
    const totalRevenue = trend.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = trend.reduce((sum, d) => sum + d.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgDailyProfit = trend.length > 0 ? totalProfit / trend.length : 0;

    // Find best day
    const bestDay = trend.reduce(
      (best, day) => (day.profit > best.profit ? day : best),
      trend[0] || { profit: 0, date: '' },
    );

    return {
      trend,
      days,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgDailyProfit: Math.round(avgDailyProfit * 100) / 100,
      bestDayProfit: bestDay.profit,
      bestDayDate: bestDay.date,
    };
  }

  /**
   * Get margin distribution histogram
   */
  async getMarginDistribution(
    period: '24h' | '7d' | '30d' | '90d' | 'total' = '30d',
  ): Promise<MarginDistributionDto> {
    const result = await this.getProductProfitability(period, 1000);

    const ranges = [
      { range: 'Negative (<0%)', min: -Infinity, max: 0 },
      { range: '0-10%', min: 0, max: 10 },
      { range: '10-25%', min: 10, max: 25 },
      { range: '25-40%', min: 25, max: 40 },
      { range: '40%+', min: 40, max: Infinity },
    ];

    const distribution: MarginDistributionBucketDto[] = ranges.map(({ range, min, max }) => {
      const inRange = result.products.filter(
        (p) => p.marginPercent >= min && p.marginPercent < max,
      );

      return {
        range,
        minMargin: min === -Infinity ? -100 : min,
        maxMargin: max === Infinity ? 100 : max,
        productCount: inRange.length,
        percentOfTotal:
          result.products.length > 0
            ? Math.round((inRange.length / result.products.length) * 1000) / 10
            : 0,
        totalProfit: Math.round(inRange.reduce((sum, p) => sum + p.totalProfit, 0) * 100) / 100,
        totalRevenue: Math.round(inRange.reduce((sum, p) => sum + p.totalRevenue, 0) * 100) / 100,
      };
    });

    // Calculate average and median margin
    const margins = result.products.map((p) => p.marginPercent).sort((a, b) => a - b);
    const avgMargin =
      margins.length > 0 ? margins.reduce((sum, m) => sum + m, 0) / margins.length : 0;
    let medianMargin = 0;
    if (margins.length > 0) {
      if (margins.length % 2 === 0) {
        const lower = margins[margins.length / 2 - 1] ?? 0;
        const upper = margins[margins.length / 2] ?? 0;
        medianMargin = (lower + upper) / 2;
      } else {
        medianMargin = margins[Math.floor(margins.length / 2)] ?? 0;
      }
    }

    return {
      distribution,
      totalProducts: result.products.length,
      avgMargin: Math.round(avgMargin * 10) / 10,
      medianMargin: Math.round(medianMargin * 10) / 10,
      period,
    };
  }

  /**
   * Get profit-related alerts
   */
  async getProfitAlerts(): Promise<ProfitAlertsDto> {
    const alerts: ProfitAlertDto[] = [];

    // Get recent profit data
    const summary24h = await this.getProfitSummary('24h');
    const summary7d = await this.getProfitSummary('7d');
    const lowMarginProducts = await this.getLowMarginProducts(this.LOW_MARGIN_THRESHOLD, 5);

    // Alert: Negative profit today
    if (summary24h.grossProfit < this.NEGATIVE_PROFIT_THRESHOLD) {
      alerts.push({
        type: 'danger',
        metric: 'grossProfit24h',
        message: `⚠️ LOSS ALERT: Today's profit is negative (€${summary24h.grossProfit.toFixed(2)})`,
        currentValue: summary24h.grossProfit,
        threshold: 0,
        recommendation: 'Review pricing strategy and Kinguin costs immediately.',
      });
    }

    // Alert: Low margin today
    if (
      summary24h.orderCount > 0 &&
      summary24h.profitMarginPercent < this.LOW_MARGIN_THRESHOLD
    ) {
      alerts.push({
        type: 'warning',
        metric: 'profitMargin24h',
        message: `Low margin warning: Today's margin is ${summary24h.profitMarginPercent.toFixed(1)}% (target: ${this.LOW_MARGIN_THRESHOLD}%+)`,
        currentValue: summary24h.profitMarginPercent,
        threshold: this.LOW_MARGIN_THRESHOLD,
        recommendation: 'Consider increasing prices on low-margin products.',
      });
    }

    // Alert: High margin (success!)
    if (
      summary24h.orderCount > 0 &&
      summary24h.profitMarginPercent > this.HIGH_MARGIN_THRESHOLD
    ) {
      alerts.push({
        type: 'success',
        metric: 'profitMargin24h',
        message: `🎉 Excellent margin: Today's margin is ${summary24h.profitMarginPercent.toFixed(1)}%`,
        currentValue: summary24h.profitMarginPercent,
      });
    }

    // Alert: Negative weekly profit
    if (summary7d.grossProfit < 0) {
      alerts.push({
        type: 'danger',
        metric: 'grossProfit7d',
        message: `⚠️ Weekly loss: 7-day profit is negative (€${summary7d.grossProfit.toFixed(2)})`,
        currentValue: summary7d.grossProfit,
        threshold: 0,
        recommendation: 'Urgent review of pricing and product mix required.',
      });
    }

    // Alert: Low margin products exist
    if (lowMarginProducts.length > 0) {
      const productNames = lowMarginProducts
        .slice(0, 3)
        .map((p) => p.productName)
        .join(', ');
      alerts.push({
        type: 'info',
        metric: 'lowMarginProducts',
        message: `${lowMarginProducts.length} products with margin < ${this.LOW_MARGIN_THRESHOLD}%: ${productNames}${lowMarginProducts.length > 3 ? '...' : ''}`,
        currentValue: lowMarginProducts.length,
        threshold: this.LOW_MARGIN_THRESHOLD,
        recommendation: 'Review pricing for these products.',
      });
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (alerts.some((a) => a.type === 'danger')) {
      overallStatus = 'critical';
    } else if (alerts.some((a) => a.type === 'warning')) {
      overallStatus = 'warning';
    }

    return {
      alerts,
      fetchedAt: new Date().toISOString(),
      overallStatus,
    };
  }

  /**
   * Get combined profit dashboard data
   */
  async getProfitDashboard(): Promise<ProfitDashboardDto> {
    this.logger.log('📊 Fetching profit dashboard data...');

    const [
      summaryTotal,
      summary24h,
      summary7d,
      summary30d,
      topProducts,
      lowMarginProducts,
      trendResponse,
      distributionResponse,
      alertsResponse,
    ] = await Promise.all([
      this.getProfitSummary('total'),
      this.getProfitSummary('24h'),
      this.getProfitSummary('7d'),
      this.getProfitSummary('30d'),
      this.getTopProducts('30d', 10),
      this.getLowMarginProducts(this.LOW_MARGIN_THRESHOLD, 5),
      this.getProfitTrend(30),
      this.getMarginDistribution(),
      this.getProfitAlerts(),
    ]);

    return {
      summaryTotal,
      summary24h,
      summary7d,
      summary30d,
      topProducts,
      lowMarginProducts,
      profitTrend: trendResponse.trend,
      marginDistribution: distributionResponse.distribution,
      alerts: alertsResponse.alerts,
      fetchedAt: new Date().toISOString(),
    };
  }
}
