import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';
import { CreateOrderDto, OrderResponseDto, OrderItemResponseDto } from './dto/create-order.dto';
import { EmailsService } from '../emails/emails.service';
import { CatalogService } from '../catalog/catalog.service';
import { MarketingService } from '../marketing/marketing.service';
import { Product } from '../catalog/entities/product.entity';

// In-memory cache for idempotency keys (in production, use Redis)
const idempotencyCache = new Map<string, { orderId: string; expiresAt: number }>();

// ========== ORDER STATUS CACHE ==========
// Cache fulfilled orders to reduce database queries (they don't change)
const orderStatusCache = new Map<string, { response: OrderResponseDto; cachedAt: number }>();
const ORDER_CACHE_TTL_MS = 60 * 1000; // 1 minute for non-terminal states
const ORDER_FULFILLED_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for fulfilled orders

/**
 * Invalidate order status cache for a specific order
 * MUST be called after any order status change to ensure fresh data
 */
export function invalidateOrderCache(orderId: string): void {
  if (orderStatusCache.has(orderId)) {
    orderStatusCache.delete(orderId);
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (value.expiresAt < now) {
      idempotencyCache.delete(key);
    }
  }
  // Cleanup order status cache
  for (const [key, value] of orderStatusCache.entries()) {
    const ttl = ORDER_FULFILLED_CACHE_TTL_MS; // Max TTL for cleanup
    if (now - value.cachedAt > ttl) {
      orderStatusCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly jwtSecret: string;

  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemsRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    private readonly emailsService: EmailsService,
    private readonly catalogService: CatalogService,
    private readonly marketingService: MarketingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production';
  }

  /**
   * Generate a session token for order access (valid 1 hour)
   * Used for immediate guest access after checkout
   */
  generateOrderSessionToken(orderId: string, email: string): string {
    const payload = {
      type: 'order_session',
      orderId,
      email: email.toLowerCase(),
    };
    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: '1h',
    });
  }

  /**
   * Verify an order session token
   * Returns { orderId, email } if valid, null if invalid/expired
   */
  verifyOrderSessionToken(token: string): { orderId: string; email: string } | null {
    try {
      const decoded = this.jwtService.verify<{
        type: string;
        orderId: string;
        email: string;
      }>(token, { secret: this.jwtSecret });
      
      if (decoded.type !== 'order_session') {
        return null;
      }
      return { orderId: decoded.orderId, email: decoded.email };
    } catch {
      return null;
    }
  }

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderResponseDto> {
    // ========== IDEMPOTENCY CHECK ==========
    // If idempotencyKey is provided, check for existing order to prevent duplicates
    if (dto.idempotencyKey !== undefined && dto.idempotencyKey.length > 0) {
      const cacheKey = `${dto.email}:${dto.idempotencyKey}`;
      const cached = idempotencyCache.get(cacheKey);
      
      if (cached !== undefined && cached.expiresAt > Date.now()) {
        this.logger.log(`🔄 Idempotency hit: returning existing order ${cached.orderId} for key ${dto.idempotencyKey}`);
        return await this.get(cached.orderId);
      }
    }

    // Normalize items: support both single productId and items array
    let itemsToCreate: Array<{ productId: string; quantity: number; discountPercent?: number; bundleId?: string }> = [];
    
    if (dto.items !== undefined && dto.items.length > 0) {
      // Multi-item order
      itemsToCreate = dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity ?? 1,
        discountPercent: item.discountPercent,
        bundleId: item.bundleId,
      }));
    } else if (dto.productId !== undefined) {
      // Single item (backward compatibility)
      itemsToCreate = [{ productId: dto.productId, quantity: 1 }];
    } else {
      throw new BadRequestException('Either productId or items array is required');
    }

    // Check if this is a bundle purchase (any item has bundleId)
    const isBundlePurchase = itemsToCreate.some(item => item.bundleId !== undefined);
    const bundleId = itemsToCreate.find(item => item.bundleId !== undefined)?.bundleId;

    // Fetch all products
    const productIds = itemsToCreate.map((item) => item.productId);
    const productsMap = await this.catalogService.getProductsBySlugs(productIds);
    
    // Validate all products exist
    const notFound: string[] = [];
    const products: Product[] = [];
    for (const item of itemsToCreate) {
      const product = productsMap.get(item.productId);
      if (product === undefined || product === null) {
        notFound.push(item.productId);
      } else {
        products.push(product);
      }
    }
    
    if (notFound.length > 0) {
      throw new NotFoundException(`Products not found: ${notFound.join(', ')}`);
    }

    // ========== GET EFFECTIVE PRICES (considering flash deals AND bundle discounts) ==========
    // For bundle purchases, bundle discounts take priority over flash deals
    // For regular purchases, flash deals apply as SOURCE OF TRUTH
    const productPricingInputs = products.map((p) => ({
      id: p.id,
      price: p.price,
      currency: p.currency,
    }));
    const effectivePrices = await this.marketingService.getEffectivePricesForProducts(productPricingInputs);

    // Calculate total price with appropriate discounts
    let totalPrice = 0;
    const itemPrices: Array<{ productId: string; effectivePrice: string; isDiscounted: boolean; discountSource: 'bundle' | 'flash' | 'none' }> = [];
    
    for (let i = 0; i < itemsToCreate.length; i++) {
      const item = itemsToCreate[i];
      const product = products[i];
      if (item !== undefined && product !== undefined) {
        const flashPricing = effectivePrices.get(product.id);
        const basePrice = parseFloat(product.price);
        let effectivePrice: number;
        let discountSource: 'bundle' | 'flash' | 'none' = 'none';
        
        // Bundle discount takes priority if this is a bundle purchase with discount
        if (isBundlePurchase && item.discountPercent !== undefined && item.discountPercent > 0) {
          effectivePrice = basePrice * (1 - item.discountPercent / 100);
          discountSource = 'bundle';
          this.logger.log(`🎁 Bundle discount applied: ${product.title} ${basePrice.toFixed(2)} → ${effectivePrice.toFixed(2)} (${item.discountPercent}% off)`);
        } else if (flashPricing?.isDiscounted === true) {
          // Flash deal discount
          effectivePrice = parseFloat(flashPricing.effectivePrice);
          discountSource = 'flash';
          this.logger.log(`📦 Flash deal discount: ${product.title} ${flashPricing.originalPrice} → ${flashPricing.effectivePrice} (${flashPricing.discountPercent}% off)`);
        } else {
          // No discount
          effectivePrice = basePrice;
        }
        
        totalPrice += effectivePrice * item.quantity;
        
        itemPrices.push({
          productId: item.productId,
          effectivePrice: effectivePrice.toFixed(2),
          isDiscounted: discountSource !== 'none',
          discountSource,
        });
      }
    }

    // Determine overall source type (if any item is kinguin, order is kinguin)
    const hasKinguinProduct = products.some((p) => p.sourceType === 'kinguin');
    const sourceType = hasKinguinProduct ? 'kinguin' : 'custom';

    const orderType = isBundlePurchase ? `bundle (${bundleId})` : 'regular';
    this.logger.log(`Creating ${orderType} order with ${itemsToCreate.length} item(s), total: €${totalPrice.toFixed(2)}, sourceType: ${sourceType}${userId !== null && userId !== undefined && userId !== '' ? `, userId: ${userId}` : ' (guest)'}`);

    // Create order
    const order = this.ordersRepo.create({
      email: dto.email,
      status: 'created',
      totalCrypto: totalPrice.toFixed(8),
      sourceType: sourceType,
      userId: userId ?? undefined,
    });
    const savedOrder = await this.ordersRepo.save(order);

    // Create order items with EFFECTIVE prices (flash deal discounted if applicable)
    const savedItems: OrderItem[] = [];
    for (let i = 0; i < itemsToCreate.length; i++) {
      const itemData = itemsToCreate[i];
      const product = products[i];
      if (itemData !== undefined && product !== undefined) {
        // Get effective price for this product (may be discounted via flash deal)
        const itemPricing = itemPrices.find((ip) => ip.productId === itemData.productId);
        const effectivePrice = itemPricing?.effectivePrice ?? product.price;
        
        // For quantity > 1, create multiple order items (each gets a separate key)
        for (let q = 0; q < itemData.quantity; q++) {
          const item = this.itemsRepo.create({
            order: savedOrder,
            productId: itemData.productId,
            productSourceType: product.sourceType ?? 'custom',
            quantity: 1, // Each item represents 1 unit (for key delivery)
            unitPrice: effectivePrice, // Capture EFFECTIVE price (with flash deal discount if applicable)
            signedUrl: null,
          });
          const savedItem = await this.itemsRepo.save(item);
          savedItems.push(savedItem);
        }
      }
    }

    // ========== CACHE IDEMPOTENCY KEY ==========
    // Store in cache to prevent duplicates for 5 minutes
    if (dto.idempotencyKey !== undefined && dto.idempotencyKey.length > 0) {
      const cacheKey = `${dto.email}:${dto.idempotencyKey}`;
      idempotencyCache.set(cacheKey, {
        orderId: savedOrder.id,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });
      this.logger.debug(`Cached idempotency key: ${cacheKey} → order ${savedOrder.id}`);
    }

    const response = await this.mapToResponse(savedOrder, savedItems);
    
    // ========== GENERATE ORDER SESSION TOKEN ==========
    // Include session token for immediate guest access (valid 1 hour)
    response.orderSessionToken = this.generateOrderSessionToken(savedOrder.id, dto.email);
    this.logger.debug(`Generated order session token for order ${savedOrder.id}`);
    
    return response;
  }

  /**
   * Set Kinguin reservation ID on an order
   * Used after reservation is created with Kinguin
   */
  async setReservationId(orderId: string, reservationId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    order.kinguinReservationId = reservationId;
    this.logger.log(`Order ${orderId} linked to reservation ${reservationId}`);
    return this.ordersRepo.save(order);
  }

  /**
   * Find order by Kinguin reservation ID
   * Returns mapped DTO or null if not found
   */
  async findByReservation(reservationId: string): Promise<OrderResponseDto | null> {
    const order = await this.ordersRepo.findOne({
      where: { kinguinReservationId: reservationId },
      relations: ['items'],
    });
    if (order === null) return null;
    return await this.mapToResponse(order, order.items);
  }

  async markPaid(orderId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });

    // RACE CONDITION FIX: Don't downgrade status if order is already fulfilled
    if (order.status === 'fulfilled') {
      this.logger.debug(
        `⏭️ Order ${orderId} already fulfilled, skipping markPaid to prevent status downgrade`,
      );
      return await this.mapToResponse(order, order.items);
    }

    order.status = 'paid';
    const updated = await this.ordersRepo.save(order);

    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);
    this.logger.debug(`📦 Cache invalidated for order ${orderId} (markPaid)`);

    return await this.mapToResponse(updated, updated.items);
  }

  async fulfill(orderId: string, signedUrl: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });

    // Update all items with signed URL
    order.items.forEach((item) => {
      item.signedUrl = signedUrl;
    });
    await this.itemsRepo.save(order.items);

    // Mark order as fulfilled
    order.status = 'fulfilled';
    const updated = await this.ordersRepo.save(order);

    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);
    this.logger.debug(`📦 Cache invalidated for order ${orderId} (fulfill)`);

    return await this.mapToResponse(updated, updated.items);
  }

  async get(id: string): Promise<OrderResponseDto> {
    // ========== ORDER STATUS CACHE CHECK ==========
    const cached = orderStatusCache.get(id);
    if (cached !== undefined) {
      const ttl = cached.response.status === 'fulfilled' 
        ? ORDER_FULFILLED_CACHE_TTL_MS 
        : ORDER_CACHE_TTL_MS;
      
      if (Date.now() - cached.cachedAt < ttl) {
        this.logger.debug(`📦 Cache hit for order ${id} (status: ${cached.response.status})`);
        return cached.response;
      }
      // Cache expired, remove it
      orderStatusCache.delete(id);
    }

    const order = await this.ordersRepo.findOneOrFail({
      where: { id },
      relations: ['items'],
    });
    const response = await this.mapToResponse(order, order.items);

    // ========== CACHE THE RESPONSE ==========
    // Cache all orders, but fulfilled orders are cached longer
    orderStatusCache.set(id, { response, cachedAt: Date.now() });

    return response;
  }

  /**
   * Mark order as waiting for payment confirmation
   * Transition: created → waiting
   * Called when NOWPayments confirms payment is being received
   */
  async markWaiting(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'created') {
      throw new BadRequestException(
        `Cannot mark as waiting: order status is ${order.status}, expected created`,
      );
    }

    order.status = 'waiting';
    this.logger.log(`Order ${orderId} marked as waiting (payment in progress)`);
    const saved = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);
    
    return saved;
  }

  /**
   * Mark order as confirming blockchain confirmations
   * Transition: waiting → confirming
   * Called when NOWPayments reports payment is confirming
   */
  async markConfirming(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'waiting' && order.status !== 'created') {
      throw new BadRequestException(`Cannot mark as confirming: order status is ${order.status}`);
    }

    order.status = 'confirming';
    this.logger.log(`Order ${orderId} marked as confirming (awaiting blockchain confirmations)`);
    const saved = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);
    
    return saved;
  }

  /**
   * Mark order as underpaid (non-refundable) - Level 4
   * Transition: * → underpaid (terminal)
   * Called when NOWPayments reports underpayment
   * Sends underpaid notice email to customer
   */
  async markUnderpaid(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status === 'fulfilled' || order.status === 'paid') {
      throw new BadRequestException(
        `Cannot mark as underpaid: order is already in terminal state ${order.status}`,
      );
    }

    order.status = 'underpaid';
    this.logger.warn(
      `Order ${orderId} marked as underpaid (NON-REFUNDABLE, insufficient payment received)`,
    );

    const savedOrder = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);

    // Level 4: Send underpaid notice email
    try {
      await this.emailsService.sendUnderpaidNotice(order.email, {
        orderId: order.id,
        amountSent: 'Unknown', // Would be populated from NOWPayments IPN
        amountRequired: 'Unknown', // Would be populated from order total
      });

      this.logger.log(`Underpaid notice email sent to ${order.email} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send underpaid notice email for order ${orderId}:`, error);
      // Don't fail the order status update - email delivery should be non-critical
    }

    return savedOrder;
  }

  /**
   * Mark order as failed - Level 4
   * Transition: * → failed (terminal)
   * Called when NOWPayments reports payment failure
   * Sends payment failed notice email to customer
   */
  async markFailed(orderId: string, reason?: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status === 'fulfilled') {
      throw new BadRequestException(`Cannot mark as failed: order is already fulfilled`);
    }

    order.status = 'failed';
    this.logger.error(`Order ${orderId} marked as failed. Reason: ${reason ?? 'unknown'}`);

    const savedOrder = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);

    // Level 4: Send payment failed notice email
    try {
      await this.emailsService.sendPaymentFailedNotice(order.email, {
        orderId: order.id,
        reason: reason ?? 'Payment processor reported failure',
      });

      this.logger.log(`Payment failed notice email sent to ${order.email} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment failed notice email for order ${orderId}:`, error);
      // Don't fail the order status update - email delivery should be non-critical
    }

    return savedOrder;
  }

  /**
   * Mark order as expired - Level 4
   * Transition: * → expired (terminal)
   * Called when payment invoice expires (distinct from failed for better UX)
   * Expired orders can prompt users to retry with a new payment
   * Sends payment expired notice email to customer
   */
  async markExpired(orderId: string, reason?: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status === 'fulfilled') {
      throw new BadRequestException(`Cannot mark as expired: order is already fulfilled`);
    }

    // Idempotent: already expired is success
    if (order.status === 'expired') {
      this.logger.debug(`Order ${orderId} is already expired (idempotent success)`);
      return order;
    }

    order.status = 'expired';
    this.logger.warn(`Order ${orderId} marked as expired. Reason: ${reason ?? 'payment window closed'}`);

    const savedOrder = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);

    // Level 4: Send payment expired notice email (customer can retry)
    try {
      await this.emailsService.sendPaymentExpiredNotice(order.email, {
        orderId: order.id,
        reason: reason ?? 'Payment window expired',
      });

      this.logger.log(`Payment expired notice email sent to ${order.email} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment expired notice email for order ${orderId}:`, error);
      // Don't fail the order status update - email delivery should be non-critical
    }

    return savedOrder;
  }

  /**
   * Mark order as fulfilled (keys delivered)
   * Transition: paid → fulfilled (terminal)
   * Called after keys are generated and stored in R2
   * Idempotent: If already fulfilled, returns success without error
   */
  async markFulfilled(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    // Idempotent: already fulfilled is success
    if (order.status === 'fulfilled') {
      this.logger.debug(`Order ${orderId} is already fulfilled (idempotent success)`);
      return order;
    }

    if (order.status !== 'paid') {
      throw new BadRequestException(
        `Cannot fulfill: order status is ${order.status}, expected paid`,
      );
    }

    order.status = 'fulfilled';
    this.logger.log(`Order ${orderId} marked as fulfilled (keys delivered)`);
    const savedOrder = await this.ordersRepo.save(order);
    
    // CRITICAL: Invalidate cache after status change
    invalidateOrderCache(orderId);
    
    return savedOrder;
  }

  /**
   * Find order by ID and verify it belongs to the given user (ownership check)
   * Used to enforce that users can only access their own orders
   * Throws NotFoundException if not found or doesn't belong to user
   */
  async findUserOrderOrThrow(orderId: string, userId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });
    if (order === null) {
      this.logger.warn(`Order ${orderId} not found or doesn't belong to user ${userId}`);
      throw new NotFoundException(`Order not found or access denied`);
    }
    return order;
  }

  /**
   * Find all orders for a given user with pagination
   * Used by GET /users/:id/orders endpoint
   */
  async findUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: OrderResponseDto[]; total: number }> {
    const [orders, total] = await this.ordersRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 500), // cap at 500 per page for user's own orders
    });

    // Map orders with product titles (async)
    const mappedOrders = await Promise.all(
      orders.map((order) => this.mapToResponse(order, order.items)),
    );

    return {
      data: mappedOrders,
      total,
    };
  }

  /**
   * Check if order can transition to a given status
   * Validates state machine transitions
   */
  isValidTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      created: ['waiting', 'confirming', 'paid', 'failed'],
      waiting: ['confirming', 'paid', 'underpaid', 'failed'],
      confirming: ['paid', 'underpaid', 'failed'],
      paid: ['fulfilled', 'failed'],
      underpaid: [], // terminal
      failed: [], // terminal
      fulfilled: [], // terminal
    };

    return (validTransitions[fromStatus] ?? []).includes(toStatus);
  }

  /**
   * Link all orders with matching email to a user account
   * This is called during login/signup to ensure guest orders appear in the user's dashboard
   * @param userId The user's ID to link orders to
   * @param email The email to match orders against
   * @returns Number of orders linked
   */
  async linkOrdersByEmail(userId: string, email: string): Promise<number> {
    const result = await this.ordersRepo
      .createQueryBuilder()
      .update(Order)
      .set({ userId })
      .where('email = :email', { email })
      .andWhere('userId IS NULL')
      .execute();

    const linkedCount = result.affected ?? 0;
    if (linkedCount > 0) {
      this.logger.log(`🔗 Linked ${linkedCount} orders to user ${userId} by email ${email}`);
    }
    return linkedCount;
  }

  private async mapToResponse(order: Order, items: OrderItem[]): Promise<OrderResponseDto> {
    // Batch fetch product titles for all items
    const productIds = items.map((item) => item.productId);
    const productMap = await this.catalogService.getProductsBySlugs(productIds);

    // Fetch the most recent payment for this order to get payCurrency
    const payment = await this.paymentsRepo.findOne({
      where: { orderId: order.id },
      order: { createdAt: 'DESC' },
    });

    return {
      id: order.id,
      email: order.email,
      userId: order.userId,
      status: order.status,
      sourceType: order.sourceType ?? 'custom',
      kinguinReservationId: order.kinguinReservationId,
      total: order.totalCrypto,
      payCurrency: payment?.payCurrency ?? undefined,
      items: items.map(
        (item): OrderItemResponseDto => ({
          id: item.id,
          productId: item.productId,
          productTitle: productMap.get(item.productId)?.title ?? item.productId,
          productSlug: productMap.get(item.productId)?.slug ?? null,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? '0.00',
          sourceType: item.productSourceType ?? 'custom',
          signedUrl: item.signedUrl,
        }),
      ),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  /**
   * Get user order statistics - calculated directly from database
   * No pagination limits - aggregated in SQL for accuracy
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    processingOrders: number;
    failedOrders: number;
    totalSpent: string;
    digitalDownloads: number;
  }> {
    // Define type for query result
    interface StatsResult {
      totalOrders: number;
      completedOrders: number;
      pendingOrders: number;
      processingOrders: number;
      failedOrders: number;
      totalSpent: string;
    }

    interface DownloadsResult {
      count: number;
    }

    // Use raw query for efficient aggregation
    const result = await this.ordersRepo.query<StatsResult[]>(
      `
      SELECT 
        COUNT(*)::int as "totalOrders",
        COUNT(*) FILTER (WHERE status = 'fulfilled')::int as "completedOrders",
        COUNT(*) FILTER (WHERE status IN ('pending', 'waiting', 'confirming', 'created'))::int as "pendingOrders",
        COUNT(*) FILTER (WHERE status = 'paid')::int as "processingOrders",
        COUNT(*) FILTER (WHERE status IN ('failed', 'underpaid', 'expired'))::int as "failedOrders",
        COALESCE(SUM(CASE WHEN status = 'fulfilled' THEN "totalCrypto" ELSE 0 END), 0)::text as "totalSpent"
      FROM orders
      WHERE "userId" = $1
      `,
      [userId],
    );

    // Get digital downloads count (items from fulfilled orders)
    const downloadsResult = await this.ordersRepo.query<DownloadsResult[]>(
      `
      SELECT COUNT(*)::int as count
      FROM order_items oi
      JOIN orders o ON oi."orderId" = o.id
      WHERE o."userId" = $1 AND o.status = 'fulfilled'
      `,
      [userId],
    );

    const stats: StatsResult = (result[0] as StatsResult | undefined) ?? {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      failedOrders: 0,
      totalSpent: '0',
    };

    const downloads = (downloadsResult[0] as DownloadsResult | undefined) ?? { count: 0 };

    return {
      totalOrders: stats.totalOrders,
      completedOrders: stats.completedOrders,
      pendingOrders: stats.pendingOrders,
      processingOrders: stats.processingOrders,
      failedOrders: stats.failedOrders,
      totalSpent: String(stats.totalSpent),
      digitalDownloads: downloads.count,
    };
  }
}
