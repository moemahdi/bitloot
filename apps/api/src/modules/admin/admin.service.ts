import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Key } from '../orders/key.entity';
import { User } from '../../database/entities/user.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

/**
 * Admin Service - Business logic for admin operations
 *
 * Handles:
 * - Payment queries and filtering
 * - Reservation lookups (kinguinReservationId)
 * - Webhook log retrieval with pagination
 * - Key delivery audit trail
 * - Dashboard analytics
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(WebhookLog) private readonly webhookLogsRepo: Repository<WebhookLog>,
    @InjectRepository(Key) private readonly keysRepo: Repository<Key>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) { }

  /**
   * Get dashboard statistics
   * Aggregates revenue, orders, users, and recent sales history
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    // 1. Total Revenue (Sum of completed payments)
    const { revenue } = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('SUM(p.payAmount)', 'revenue')
      .where('p.status = :status', { status: 'finished' })
      .getRawOne();

    // 2. Total Orders
    const totalOrders = await this.ordersRepo.count();

    // 3. Total Users
    const totalUsers = await this.usersRepo.count();

    // 4. Active Orders (waiting/confirming/paid)
    const activeOrders = await this.ordersRepo.count({
      where: [
        { status: 'waiting' },
        { status: 'confirming' },
        { status: 'paid' },
      ]
    });

    // 5. Revenue History (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueHistoryRaw = await this.paymentsRepo
      .createQueryBuilder('p')
      .select("DATE_TRUNC('day', p.createdAt)", 'date')
      .addSelect('SUM(p.payAmount)', 'revenue')
      .where('p.status = :status', { status: 'finished' })
      .andWhere('p.createdAt >= :startDate', { startDate: sevenDaysAgo })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Format history
    const revenueHistory = revenueHistoryRaw.map((item) => ({
      date: new Date(item.date).toISOString().substring(0, 10),
      revenue: parseFloat(item.revenue),
    }));

    // Fill in missing days with 0
    const filledHistory: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const found = revenueHistory.find((h) => h.date === dateStr);
      filledHistory.push({
        date: dateStr,
        revenue: found ? found.revenue : 0,
      });
    }

    return {
      totalRevenue: parseFloat(revenue ?? '0'),
      totalOrders,
      totalUsers,
      activeOrders,
      revenueHistory: filledHistory,
    };
  }

  /**
   * Get paginated list of orders with filtering
   *
   * @param options Pagination and filter options
   * @returns Paginated orders
   */
  async getOrders(options: {
    limit?: number;
    offset?: number;
    email?: string;
    status?: string;
  }): Promise<{
    data: Array<{
      id: string;
      email: string;
      status: string;
      total: string;
      createdAt: Date;
      payment?: {
        id: string;
        provider: string;
        status: string;
      };
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const qb = this.ordersRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.payments', 'p')
      .orderBy('o.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (options.email != null && options.email !== '') {
      qb.andWhere('u.email ILIKE :email', { email: `%${options.email}%` });
    }

    if (options.status != null) {
      qb.andWhere('o.status = :status', { status: options.status });
    }

    const [orders, total] = await qb.getManyAndCount();

    return {
      data: orders.map((o) => {
        // Get latest payment if any
        const latestPayment = o.payments?.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0];

        return {
          id: o.id,
          email: o.email,
          status: o.status,
          total: o.totalCrypto,
          createdAt: o.createdAt,
          payment: latestPayment !== undefined && latestPayment !== null
            ? {
              id: latestPayment.id,
              provider: latestPayment.provider,
              status: latestPayment.status,
            }
            : undefined,
        };
      }),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get paginated list of payments with filtering
   *
   * @param options Pagination and filter options
   * @returns Paginated payments with order info
   */
  async getPayments(options: {
    limit?: number;
    offset?: number;
    provider?: string;
    status?: string;
  }): Promise<{
    data: Array<{
      id: string;
      orderId: string;
      externalId: string;
      provider: string;
      status: string;
      createdAt: Date;
      order?: { email: string };
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const query = this.paymentsRepo.createQueryBuilder('p').leftJoinAndSelect('p.order', 'o');

    if (typeof options.provider === 'string' && options.provider.length > 0) {
      query.andWhere('p.provider = :provider', { provider: options.provider });
    }

    if (typeof options.status === 'string' && options.status.length > 0) {
      query.andWhere('p.status = :status', { status: options.status });
    }

    query.orderBy('p.createdAt', 'DESC').skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        externalId: p.externalId,
        provider: p.provider,
        status: p.status,
        createdAt: p.createdAt,
        order: p.order !== null && p.order !== undefined ? { email: p.order.email } : undefined,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get paginated list of orders with Kinguin reservation info
   *
   * @param options Pagination and filter options
   * @returns Paginated orders with reservation status
   */
  async getReservations(options: {
    limit?: number;
    offset?: number;
    kinguinReservationId?: string;
    status?: string;
  }): Promise<{
    data: Array<{
      id: string;
      email: string;
      status: string;
      kinguinReservationId?: string;
      createdAt: Date;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const query = this.ordersRepo.createQueryBuilder('o');

    if (typeof options.kinguinReservationId === 'string' && options.kinguinReservationId.length > 0) {
      query.andWhere('o.kinguinReservationId = :resId', {
        resId: options.kinguinReservationId,
      });
    }

    if (typeof options.status === 'string' && options.status.length > 0) {
      query.andWhere('o.status = :status', { status: options.status });
    }

    query.orderBy('o.createdAt', 'DESC').skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((o) => ({
        id: o.id,
        email: o.email,
        status: o.status,
        kinguinReservationId: o.kinguinReservationId ?? undefined,
        createdAt: o.createdAt,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get paginated webhook logs
   *
   * @param options Pagination and filter options
   * @returns Paginated webhook logs
   */
  async getWebhookLogs(options: {
    limit?: number;
    offset?: number;
    webhookType?: string;
    paymentStatus?: 'pending' | 'processed' | 'failed' | 'duplicate';
  }): Promise<{
    data: Array<{
      id: string;
      webhookType: string;
      externalId: string;
      paymentStatus: string;
      error?: string;
      createdAt: Date;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const query = this.webhookLogsRepo.createQueryBuilder('wl');

    if (typeof options.webhookType === 'string' && options.webhookType.length > 0) {
      query.andWhere('wl.webhookType = :webhookType', { webhookType: options.webhookType });
    }

    if (typeof options.paymentStatus === 'string' && options.paymentStatus.length > 0) {
      query.andWhere('wl.paymentStatus = :paymentStatus', { paymentStatus: options.paymentStatus });
    }

    query.orderBy('wl.createdAt', 'DESC').skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((wl) => ({
        id: wl.id,
        webhookType: wl.webhookType,
        externalId: wl.externalId,
        paymentStatus: wl.paymentStatus ?? 'unknown',
        error: wl.error !== null && typeof wl.error === 'string' && wl.error.length > 0 ? wl.error : undefined,
        createdAt: wl.createdAt,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get webhook log details by ID
   *
   * @param id WebhookLog ID
   * @returns Full webhook log with payload
   */
  async getWebhookLog(id: string): Promise<{
    id: string;
    webhookType: string;
    externalId: string;
    paymentStatus: string;
    payload: Record<string, unknown>;
    error?: string;
    createdAt: Date;
  }> {
    const log = await this.webhookLogsRepo.findOne({ where: { id } });

    if (log === null || log === undefined) {
      throw new NotFoundException(`Webhook log not found: ${id}`);
    }

    return {
      id: log.id,
      webhookType: log.webhookType,
      externalId: log.externalId,
      paymentStatus: log.paymentStatus ?? 'unknown',
      payload: log.payload !== null && typeof log.payload === 'object' ? log.payload : {},
      error: log.error !== null && typeof log.error === 'string' && log.error.length > 0 ? log.error : undefined,
      createdAt: log.createdAt,
    };
  }

  /**
   * Get key access audit trail for an order
   *
   * @param orderId Order ID
   * @returns Key delivery audit log
   */
  async getKeyAuditTrail(orderId: string): Promise<
    Array<{
      id: string;
      viewed: boolean;
      viewedAt?: Date;
      createdAt: Date;
    }>
  > {
    const keys = await this.keysRepo.find({
      where: { orderItem: { order: { id: orderId } } },
      relations: ['orderItem'],
      order: { createdAt: 'ASC' },
    });

    if (keys.length === 0) {
      throw new NotFoundException(`No keys found for order: ${orderId}`);
    }

    return keys.map((k) => ({
      id: k.id,
      viewed: k.viewedAt !== null && k.viewedAt !== undefined,
      viewedAt: k.viewedAt ?? undefined,
      createdAt: k.createdAt,
    }));
  }

  /**
   * Manually mark a webhook for reprocessing
   * (Allows admin to replay failed webhooks)
   *
   * @param id WebhookLog ID
   */
  async markWebhookForReplay(id: string): Promise<void> {
    const log = await this.webhookLogsRepo.findOne({ where: { id } });

    if (log === null || log === undefined) {
      throw new NotFoundException(`Webhook log not found: ${id}`);
    }

    if (log.paymentStatus === 'processed') {
      throw new BadRequestException('Cannot replay already processed webhook');
    }

    // Mark for replay by resetting status to pending
    log.paymentStatus = 'pending';
    await this.webhookLogsRepo.save(log);

    this.logger.log(`Webhook ${id} marked for replay`);
  }
}
