import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Key } from '../orders/key.entity';

/**
 * Admin Service - Business logic for admin operations
 *
 * Handles:
 * - Payment queries and filtering
 * - Reservation lookups (kinguinReservationId)
 * - Webhook log retrieval with pagination
 * - Key delivery audit trail
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(WebhookLog) private readonly webhookLogsRepo: Repository<WebhookLog>,
    @InjectRepository(Key) private readonly keysRepo: Repository<Key>,
  ) {}

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
