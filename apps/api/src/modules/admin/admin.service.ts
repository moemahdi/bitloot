import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, type OrderStatus } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { Key } from '../orders/key.entity';
import { User } from '../../database/entities/user.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { EmailsService } from '../emails/emails.service';
import { StorageService } from '../storage/storage.service';
import { R2StorageClient } from '../storage/r2.client';
import { decryptKey } from '../storage/encryption.util';
import { AdminOrderStatus } from './dto/update-order-status.dto';
import type { OrderAnalyticsDto, BulkUpdateStatusResponseDto, StatusCountDto, SourceTypeCountDto, DailyVolumeDto } from './dto/bulk-operations.dto';
import { FulfillmentService } from '../fulfillment/fulfillment.service';

/**
 * Admin Service - Business logic for admin operations
 *
 * Handles:
 * - Payment queries and filtering
 * - Reservation lookups (kinguinReservationId)
 * - Webhook log retrieval with pagination
 * - Key delivery audit trail
 * - Dashboard analytics
 * - Order status management (admin override)
 * - Resend key delivery emails
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
    private readonly emailsService: EmailsService,
    private readonly storageService: StorageService,
    private readonly r2StorageClient: R2StorageClient,
    private readonly fulfillmentService: FulfillmentService,
  ) { }

  /**
   * Get dashboard statistics
   * Aggregates revenue, orders, users, and recent sales history
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    // 1. Total Revenue (Sum of completed payments)
    const revenueResult = await this.paymentsRepo
      .createQueryBuilder('p')
      .select('SUM(p.payAmount)', 'revenue')
      .where('p.status = :status', { status: 'finished' })
      .getRawOne<{ revenue: string | null }>();

    const revenue = revenueResult?.revenue ?? '0';

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
      .getRawMany<{ date: string; revenue: string }>();

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
        revenue: found !== undefined ? found.revenue : 0,
      });
    }

    return {
      totalRevenue: parseFloat(revenue),
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
    search?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    sourceType?: 'custom' | 'kinguin';
  }): Promise<{
    data: Array<{
      id: string;
      email: string;
      status: string;
      total: string;
      sourceType: string;
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

    // Search by email OR order ID
    if (options.search != null && options.search !== '') {
      qb.andWhere('(o.email ILIKE :search OR o.id::text ILIKE :search)', { search: `%${options.search}%` });
    } else if (options.email != null && options.email !== '') {
      qb.andWhere('o.email ILIKE :email', { email: `%${options.email}%` });
    }

    if (options.status != null) {
      qb.andWhere('o.status = :status', { status: options.status });
    }

    // Date range filtering
    if (options.startDate != null) {
      qb.andWhere('o.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate != null) {
      // Add 1 day to include the end date fully
      const endDatePlusOne = new Date(options.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      qb.andWhere('o.createdAt < :endDate', { endDate: endDatePlusOne });
    }

    // Source type filtering
    if (options.sourceType != null) {
      qb.andWhere('o.sourceType = :sourceType', { sourceType: options.sourceType });
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
          sourceType: o.sourceType ?? 'custom',
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
   * @returns Key delivery audit log with product info
   */
  async getKeyAuditTrail(orderId: string): Promise<
    Array<{
      id: string;
      orderItemId: string;
      viewed: boolean;
      viewedAt?: Date;
      downloadCount: number;
      lastAccessIp?: string;
      lastAccessUserAgent?: string;
      createdAt: Date;
    }>
  > {
    const keys = await this.keysRepo.find({
      where: { orderItem: { order: { id: orderId } } },
      order: { createdAt: 'ASC' },
    });

    if (keys.length === 0) {
      throw new NotFoundException(`No keys found for order: ${orderId}`);
    }

    return keys.map((k) => ({
      id: k.id,
      orderItemId: k.orderItemId,
      viewed: k.viewedAt !== null && k.viewedAt !== undefined,
      viewedAt: k.viewedAt ?? undefined,
      downloadCount: k.downloadCount ?? 0,
      lastAccessIp: k.lastAccessIp ?? undefined,
      lastAccessUserAgent: k.lastAccessUserAgent ?? undefined,
      createdAt: k.createdAt,
    }));
  }

  /**
   * Admin reveal key - for support purposes
   * ⚠️ This action is logged for audit purposes
   *
   * @param keyId Key ID to reveal
   * @param accessInfo Admin access information
   */
  async adminRevealKey(
    keyId: string,
    accessInfo: { ipAddress: string; userAgent: string },
  ): Promise<{
    keyId: string;
    orderItemId: string;
    orderId: string;
    plainKey: string;
    contentType: string;
    isBase64: boolean;
    viewedAt?: Date;
    downloadCount: number;
  }> {
    // Find the key with relations
    const key = await this.keysRepo.findOne({
      where: { id: keyId },
      relations: ['orderItem', 'orderItem.order'],
    });

    if (key === null || key === undefined) {
      throw new NotFoundException(`Key not found: ${keyId}`);
    }

    const orderId = key.orderItem?.order?.id ?? 'unknown';
    const orderItemId = key.orderItemId;

    // Log admin access for audit trail
    this.logger.warn(
      `⚠️ [ADMIN REVEAL] Key ${keyId} revealed by admin from ${accessInfo.ipAddress} (Order: ${orderId})`,
    );

    // Get the actual key content from R2
    let plainKey = '';
    let contentType = 'text/plain';
    let isBase64 = false;

    try {
      if (key.encryptionKey?.startsWith('raw:')) {
        // ===== RAW KEY (New format - no encryption) =====
        contentType = key.encryptionKey.substring(4);
        this.logger.debug(`[ADMIN REVEAL] Fetching raw key with content type: ${contentType}`);

        // Fetch raw key content from R2
        const rawKeyResult = await this.r2StorageClient.getRawKeyFromR2({
          orderId,
          orderItemId,
          contentType,
        });

        plainKey = rawKeyResult.content;
        isBase64 = rawKeyResult.isBase64;

        this.logger.debug(`[ADMIN REVEAL] Raw key fetched successfully (base64: ${isBase64})`);
      } else if (key.encryptionKey !== null && key.encryptionKey !== undefined) {
        // ===== ENCRYPTED KEY (Legacy format) =====
        this.logger.debug(`[ADMIN REVEAL] Fetching encrypted key from R2`);

        // Fetch encrypted key data from R2
        const encryptedKeyData = await this.r2StorageClient.getEncryptedKey(orderId);
        contentType = encryptedKeyData.contentType;

        // Decrypt the key
        const decryptionKey = Buffer.from(key.encryptionKey, 'base64');
        plainKey = decryptKey(
          encryptedKeyData.encryptedKey,
          encryptedKeyData.encryptionIv,
          encryptedKeyData.authTag,
          decryptionKey,
        );

        this.logger.debug(`[ADMIN REVEAL] Key decrypted successfully`);
      } else {
        plainKey = '[No key content available - missing encryption key]';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ADMIN REVEAL] Failed to fetch key: ${message}`);
      plainKey = `[Error fetching key: ${message}]`;
    }

    return {
      keyId: key.id,
      orderItemId,
      orderId,
      plainKey,
      contentType,
      isBase64,
      viewedAt: key.viewedAt ?? undefined,
      downloadCount: key.downloadCount ?? 0,
    };
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

  /**
   * Update order status (admin override)
   * Used for manual refunds, status corrections, etc.
   * All changes are logged for audit trail.
   *
   * @param orderId Order ID
   * @param newStatus New status to set
   * @param reason Optional reason for the change
   * @returns Previous and new status information
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: AdminOrderStatus,
    reason?: string,
  ): Promise<{ ok: boolean; orderId: string; previousStatus: string; newStatus: string }> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });

    if (order === null || order === undefined) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    const previousStatus = order.status;

    // Update the order status (cast AdminOrderStatus to OrderStatus as they're the same values)
    order.status = newStatus as unknown as OrderStatus;
    await this.ordersRepo.save(order);

    // Log the change
    this.logger.log(
      `[ADMIN] Order ${orderId} status changed: ${previousStatus} → ${newStatus}` +
      (reason !== undefined && reason.length > 0 ? ` (Reason: ${reason})` : ''),
    );

    return {
      ok: true,
      orderId,
      previousStatus,
      newStatus,
    };
  }

  /**
   * Retry fulfillment for a stuck order
   * This triggers the actual fulfillment process (reserve keys, encrypt, store in R2)
   * Use this when an order is stuck at 'paid' status or when fulfillment failed.
   *
   * @param orderId Order ID to retry fulfillment for
   * @param reason Optional reason for the retry (audit trail)
   * @returns Job ID and order status
   */
  async retryFulfillment(
    orderId: string,
    reason?: string,
  ): Promise<{ ok: boolean; orderId: string; jobId: string; previousStatus: string }> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });

    if (order === null || order === undefined) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    // Check if order is in a retryable state
    const retryableStatuses = ['paid', 'failed', 'waiting', 'confirming'];
    if (!retryableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order ${orderId} is in status '${order.status}' which cannot be retried. ` +
        `Retryable statuses: ${retryableStatuses.join(', ')}`,
      );
    }

    const previousStatus = order.status;

    // If order is at 'paid' but stuck, keep it at paid and enqueue fulfillment
    // The fulfillment processor will handle the actual work
    this.logger.log(
      `[ADMIN] Retrying fulfillment for order ${orderId} (status: ${previousStatus})` +
      (reason !== undefined && reason.length > 0 ? ` (Reason: ${reason})` : ''),
    );

    // Enqueue the fulfillment job
    const jobId = await this.fulfillmentService.enqueueFulfillment(orderId);

    this.logger.log(
      `[ADMIN] Fulfillment job queued for order ${orderId}: jobId=${jobId}`,
    );

    return {
      ok: true,
      orderId,
      jobId,
      previousStatus,
    };
  }

  /**
   * Resend key delivery email to customer
   * Regenerates signed URLs and sends new email via Resend
   *
   * @param orderId Order ID
   * @returns Success status with order and email info
   */
  async resendKeysEmail(orderId: string): Promise<{ ok: boolean; orderId: string; email: string }> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.keys'],
    });

    if (order === null || order === undefined) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    // Check if order is fulfilled
    if (order.status !== 'fulfilled') {
      throw new BadRequestException(
        `Order ${orderId} is not fulfilled (status: ${order.status}). Cannot resend keys.`,
      );
    }

    // Check if there are keys to resend
    const keys = order.items?.flatMap(item => item.keys ?? []) ?? [];
    if (keys.length === 0) {
      throw new BadRequestException(`Order ${orderId} has no keys to resend.`);
    }

    // Generate new success page URL (where customer can view keys)
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const successUrl = `${frontendUrl}/orders/${orderId}/success`;

    // Send email via EmailsService
    try {
      await this.emailsService.sendOrderCompleted(order.email, {
        orderId: order.id,
        productName: 'Your Digital Product',
        downloadUrl: successUrl,
        expiresIn: '24 hours',
      });

      this.logger.log(`[ADMIN] Keys email resent for order ${orderId} to ${order.email}`);

      return {
        ok: true,
        orderId,
        email: order.email,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ADMIN] Failed to resend keys email for order ${orderId}: ${message}`);
      throw new BadRequestException(`Failed to send email: ${message}`);
    }
  }

  /**
   * Bulk update order status
   * Updates multiple orders at once with the same status
   *
   * @param orderIds Array of order IDs
   * @param newStatus New status for all orders
   * @param reason Optional reason for the change
   * @returns Summary of updated and failed orders
   */
  async bulkUpdateStatus(
    orderIds: string[],
    newStatus: AdminOrderStatus,
    reason?: string,
  ): Promise<BulkUpdateStatusResponseDto> {
    const updated: string[] = [];
    const failed: string[] = [];

    // Process orders one by one to handle individual failures
    for (const orderId of orderIds) {
      try {
        const order = await this.ordersRepo.findOne({ where: { id: orderId } });
        
        if (order === null || order === undefined) {
          failed.push(orderId);
          continue;
        }

        const previousStatus = order.status;
        order.status = newStatus as unknown as OrderStatus;
        await this.ordersRepo.save(order);
        
        updated.push(orderId);
        
        this.logger.log(
          `[ADMIN BULK] Order ${orderId} status changed: ${previousStatus} → ${newStatus}` +
          (reason !== undefined && reason.length > 0 ? ` (Reason: ${reason})` : ''),
        );
      } catch (error) {
        failed.push(orderId);
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[ADMIN BULK] Failed to update order ${orderId}: ${message}`);
      }
    }

    this.logger.log(`[ADMIN BULK] Completed: ${updated.length} updated, ${failed.length} failed`);

    return {
      updated: updated.length,
      failed,
      total: orderIds.length,
    };
  }

  /**
   * Export orders to JSON with date range filtering
   * Returns all matching orders for client-side CSV generation
   *
   * @param startDate Start of date range
   * @param endDate End of date range
   * @param status Optional status filter
   * @param sourceType Optional source type filter
   * @returns Array of orders for export
   */
  async exportOrders(options: {
    startDate: Date;
    endDate: Date;
    status?: string;
    sourceType?: 'custom' | 'kinguin';
  }): Promise<Array<{
    id: string;
    email: string;
    status: string;
    sourceType: string;
    total: string;
    createdAt: string;
    paymentProvider?: string;
    paymentStatus?: string;
    paymentId?: string;
  }>> {
    const qb = this.ordersRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.payments', 'p')
      .where('o.createdAt >= :startDate', { startDate: options.startDate })
      .orderBy('o.createdAt', 'DESC');

    // Add 1 day to include the end date fully
    const endDatePlusOne = new Date(options.endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    qb.andWhere('o.createdAt < :endDate', { endDate: endDatePlusOne });

    if (options.status != null && options.status !== 'all') {
      qb.andWhere('o.status = :status', { status: options.status });
    }

    if (options.sourceType != null) {
      qb.andWhere('o.sourceType = :sourceType', { sourceType: options.sourceType });
    }

    const orders = await qb.getMany();

    return orders.map((o) => {
      const latestPayment = o.payments?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];

      return {
        id: o.id,
        email: o.email,
        status: o.status,
        sourceType: o.sourceType ?? 'custom',
        total: o.totalCrypto,
        createdAt: o.createdAt.toISOString(),
        paymentProvider: latestPayment?.provider,
        paymentStatus: latestPayment?.status,
        paymentId: latestPayment?.id,
      };
    });
  }

  /**
   * Get order analytics
   * Returns aggregated statistics for dashboard widgets
   *
   * @param days Number of days to analyze (default 30)
   * @returns Analytics data
   */
  async getOrderAnalytics(days: number = 30): Promise<OrderAnalyticsDto> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Orders by status
    const byStatusRaw = await this.ordersRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.createdAt >= :startDate', { startDate })
      .groupBy('o.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus = byStatusRaw.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));

    // Orders by source type
    const bySourceTypeRaw = await this.ordersRepo
      .createQueryBuilder('o')
      .select('o.sourceType', 'sourceType')
      .addSelect('COUNT(*)', 'count')
      .where('o.createdAt >= :startDate', { startDate })
      .groupBy('o.sourceType')
      .getRawMany<{ sourceType: string; count: string }>();

    const bySourceType = bySourceTypeRaw.map((r) => ({
      sourceType: r.sourceType ?? 'custom',
      count: parseInt(r.count, 10),
    }));

    // Daily volume with revenue - ONLY count paid and fulfilled orders for accurate revenue
    const dailyVolumeRaw = await this.ordersRepo
      .createQueryBuilder('o')
      .select("DATE_TRUNC('day', o.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CAST(o.totalCrypto AS DECIMAL)), 0)', 'revenue')
      .where('o.createdAt >= :startDate', { startDate })
      .andWhere('o.status IN (:...statuses)', { statuses: ['paid', 'fulfilled'] })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string; revenue: string }>();

    // Fill in missing days
    const dailyVolume: Array<{ date: string; count: number; revenue: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const found = dailyVolumeRaw.find(
        (r) => new Date(r.date).toISOString().substring(0, 10) === dateStr,
      );
      dailyVolume.push({
        date: dateStr,
        count: found !== undefined ? parseInt(found.count, 10) : 0,
        revenue: found !== undefined ? parseFloat(found.revenue) : 0,
      });
    }

    // Totals and rates
    const totalOrders = byStatus.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = dailyVolume.reduce((sum, d) => sum + d.revenue, 0);
    const fulfilledCount = byStatus.find((s) => s.status === 'fulfilled')?.count ?? 0;
    const paidCount = byStatus.find((s) => s.status === 'paid')?.count ?? 0;
    const failedCount = byStatus.find((s) => s.status === 'failed')?.count ?? 0;

    // AOV should be based on paid+fulfilled orders (same as revenue calculation)
    const paidOrFulfilledCount = fulfilledCount + paidCount;
    const averageOrderValue = paidOrFulfilledCount > 0 ? totalRevenue / paidOrFulfilledCount : 0;
    const fulfillmentRate = totalOrders > 0 ? (fulfilledCount / totalOrders) * 100 : 0;
    const failedRate = totalOrders > 0 ? (failedCount / totalOrders) * 100 : 0;

    return {
      byStatus,
      bySourceType,
      dailyVolume,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
      failedRate: Math.round(failedRate * 10) / 10,
    };
  }
}
