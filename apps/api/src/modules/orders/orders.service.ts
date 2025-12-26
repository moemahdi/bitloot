import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto, OrderResponseDto, OrderItemResponseDto } from './dto/create-order.dto';
import { EmailsService } from '../emails/emails.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemsRepo: Repository<OrderItem>,
    private readonly emailsService: EmailsService,
    private readonly catalogService: CatalogService,
  ) { }

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const product = await this.catalogService.getProductById(dto.productId);
    if (product === null || product === undefined) {
      throw new NotFoundException(`Product not found: ${dto.productId}`);
    }

    const order = this.ordersRepo.create({
      email: dto.email,
      status: 'created',
      totalCrypto: product.price,
    });
    const savedOrder = await this.ordersRepo.save(order);

    // Create order item
    const item = this.itemsRepo.create({
      order: savedOrder,
      productId: dto.productId,
      signedUrl: null,
    });
    const savedItem = await this.itemsRepo.save(item);

    return this.mapToResponse(savedOrder, [savedItem]);
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
    return this.mapToResponse(order, order.items);
  }

  async markPaid(orderId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id: orderId },
      relations: ['items'],
    });
    order.status = 'paid';
    const updated = await this.ordersRepo.save(order);
    return this.mapToResponse(updated, updated.items);
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

    return this.mapToResponse(updated, updated.items);
  }

  async get(id: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findOneOrFail({
      where: { id },
      relations: ['items'],
    });
    return this.mapToResponse(order, order.items);
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
    return this.ordersRepo.save(order);
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
    return this.ordersRepo.save(order);
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
   * Mark order as fulfilled (keys delivered)
   * Transition: paid → fulfilled (terminal)
   * Called after keys are generated and stored in R2
   */
  async markFulfilled(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'paid') {
      throw new BadRequestException(
        `Cannot fulfill: order status is ${order.status}, expected paid`,
      );
    }

    order.status = 'fulfilled';
    this.logger.log(`Order ${orderId} marked as fulfilled (keys delivered)`);
    return this.ordersRepo.save(order);
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
      take: Math.min(limit, 100), // cap at 100 per page
    });

    return {
      data: orders.map((order) => this.mapToResponse(order, order.items)),
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

  private mapToResponse(order: Order, items: OrderItem[]): OrderResponseDto {
    return {
      id: order.id,
      email: order.email,
      userId: order.userId,
      status: order.status,
      sourceType: order.sourceType ?? 'custom',
      kinguinReservationId: order.kinguinReservationId,
      total: order.totalCrypto,
      items: items.map(
        (item): OrderItemResponseDto => ({
          id: item.id,
          productId: item.productId,
          sourceType: item.productSourceType ?? 'custom',
          signedUrl: item.signedUrl,
        }),
      ),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
