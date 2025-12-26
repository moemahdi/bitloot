import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../jobs/queues';
import { Order, type OrderStatus } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { KinguinClient } from './kinguin.client';
import { R2StorageClient } from '../storage/r2.client';
import { generateEncryptionKey, encryptKey } from '../storage/encryption.util';
import { DeliveryService } from './delivery.service';
import { EmailsService } from '../emails/emails.service';
import { Key } from '../orders/key.entity';
import { OrdersService } from '../orders/orders.service';
import { Product, type ProductSourceType } from '../catalog/entities/product.entity';
import { AdminOpsService } from '../admin/admin-ops.service';

/**
 * Fulfillment orchestration service
 *
 * Manages the complete fulfillment pipeline with HYBRID model:
 * 
 * FOR CUSTOM PRODUCTS (sourceType = 'custom'):
 * 1. Key is pre-uploaded to R2 by admin (key already exists)
 * 2. Generate signed URL for existing key
 * 3. Update order with download link
 * 4. Send delivery email
 *
 * FOR KINGUIN PRODUCTS (sourceType = 'kinguin'):
 * 1. Create order via Kinguin API
 * 2. Wait for Kinguin to deliver key
 * 3. Encrypt key with AES-256-GCM
 * 4. Upload encrypted key to R2
 * 5. Generate signed URL
 * 6. Update order with download link
 * 7. Send delivery email
 *
 * @example
 * const fulfillment = await fulfillmentService.fulfillOrder(orderId);
 */
@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger('FulfillmentService');

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Key) private readonly keyRepo: Repository<Key>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly kinguinClient: KinguinClient,
    private readonly r2StorageClient: R2StorageClient,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue,
    private readonly deliveryService: DeliveryService,
    private readonly emailsService: EmailsService,
    private readonly ordersService: OrdersService,
    private readonly adminOpsService: AdminOpsService,
  ) { }

  /**
   * DISPATCHER: Route fulfillment based on order sourceType
   *
   * This is the main entry point for fulfillment. It checks the order's
   * sourceType and delegates to the appropriate fulfillment method.
   *
   * @param orderId Order ID to fulfill
   * @returns FulfillmentResult with signed URL and metadata
   * @throws Error if any step fails
   * @throws ForbiddenException if feature flag is disabled
   */
  async fulfillOrder(orderId: string): Promise<FulfillmentResult> {
    this.logger.debug(`[FULFILLMENT] Starting fulfillment for order: ${orderId}`);

    // Load order with items
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (order === null || order === undefined) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }

    if (order.items === null || order.items === undefined || order.items.length === 0) {
      throw new BadRequestException(`Order has no items: ${orderId}`);
    }

    // DISPATCHER: Route based on sourceType
    const sourceType: ProductSourceType = order.sourceType ?? 'custom';
    this.logger.log(`[FULFILLMENT] Dispatching order ${orderId} to ${sourceType} fulfillment`);

    // Check feature flags before proceeding
    if (sourceType === 'kinguin' && !this.adminOpsService.isEnabled('kinguin_enabled')) {
      throw new ForbiddenException('Kinguin fulfillment is currently disabled');
    }
    if (sourceType === 'custom' && !this.adminOpsService.isEnabled('custom_products_enabled')) {
      throw new ForbiddenException('Custom product fulfillment is currently disabled');
    }

    if (sourceType === 'kinguin') {
      return this.fulfillOrderViaKinguin(order);
    } else {
      return this.fulfillOrderViaCustom(order);
    }
  }

  /**
   * CUSTOM FULFILLMENT: For products you manage yourself
   *
   * Flow:
   * 1. For each item, check if key exists in R2 (pre-uploaded by admin)
   * 2. Generate signed download URL
   * 3. Update order item with URL
   * 4. Send delivery email
   *
   * @param order Order entity with items loaded
   * @returns FulfillmentResult
   */
  private async fulfillOrderViaCustom(order: Order): Promise<FulfillmentResult> {
    this.logger.debug(`[FULFILLMENT:CUSTOM] Processing ${order.items.length} items for order ${order.id}`);

    const results: ItemFulfillmentResult[] = [];

    for (const item of order.items) {
      this.logger.debug(`[FULFILLMENT:CUSTOM] Processing item: ${item.id} (product: ${item.productId})`);

      try {
        const itemResult = await this.fulfillCustomItem(order.id, item);
        results.push(itemResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[FULFILLMENT:CUSTOM] Failed to fulfill item ${item.id}: ${message}`);
        throw error;
      }
    }

    // Update order status to fulfilled
    await this.orderRepo.update({ id: order.id }, { status: 'fulfilled' });

    // Send completion email
    await this.sendCompletionEmail(order, results);

    return {
      orderId: order.id,
      items: results,
      status: 'fulfilled',
      fulfilledAt: new Date(),
    };
  }

  /**
   * Fulfill a single CUSTOM order item
   * Key should already exist in R2 (uploaded by admin)
   */
  private async fulfillCustomItem(orderId: string, item: OrderItem): Promise<ItemFulfillmentResult> {
    // For custom products, the key is already in R2
    // Just generate a signed URL for download
    const storageRef = `products/${item.productId}/key.json`;

    // Check if key exists in R2
    const keyExists = await this.r2StorageClient.exists(storageRef);
    if (!keyExists) {
      throw new BadRequestException(
        `Key not found for custom product ${item.productId}. Admin must upload key first.`
      );
    }

    // Generate signed URL (15 minute expiry)
    const signedUrl = await this.r2StorageClient.generateSignedUrlForPath({
      path: storageRef,
      expiresInSeconds: 15 * 60,
    });

    this.logger.debug(`[FULFILLMENT:CUSTOM] Generated signed URL for ${storageRef}`);

    // Update order item with signed URL
    await this.orderItemRepo.update(
      { id: item.id },
      { signedUrl, updatedAt: new Date() },
    );

    return {
      itemId: item.id,
      productId: item.productId,
      signedUrl,
      encryptionKeySize: 32,
      status: 'fulfilled',
    };
  }

  /**
   * KINGUIN FULFILLMENT: For products sourced from Kinguin API
   *
   * Flow:
   * 1. Create order on Kinguin
   * 2. Poll for key delivery (or use webhook)
   * 3. Encrypt key with AES-256-GCM
   * 4. Upload to R2
   * 5. Generate signed URL
   * 6. Update order items
   * 7. Send delivery email
   *
   * @param order Order entity with items loaded
   * @returns FulfillmentResult
   */
  private async fulfillOrderViaKinguin(order: Order): Promise<FulfillmentResult> {
    this.logger.debug(`[FULFILLMENT:KINGUIN] Processing ${order.items.length} items for order ${order.id}`);

    // Step 1: Create reservation on Kinguin if not already done
    if (order.kinguinReservationId === null || order.kinguinReservationId === undefined || order.kinguinReservationId === '') {
      const reservation = await this.startReservation(order.id);
      this.logger.debug(`[FULFILLMENT:KINGUIN] Created reservation: ${reservation.reservationId}`);
    }

    // Step 2: For now, simulate key fetch (in production, would poll or use webhook)
    const results: ItemFulfillmentResult[] = [];

    for (const item of order.items) {
      this.logger.debug(`[FULFILLMENT:KINGUIN] Processing item: ${item.id} (product: ${item.productId})`);

      try {
        const itemResult = await this.fulfillKinguinItem(order.id, item, order.email);
        results.push(itemResult);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[FULFILLMENT:KINGUIN] Failed to fulfill item ${item.id}: ${message}`);
        throw error;
      }
    }

    // Update order status to fulfilled
    await this.orderRepo.update({ id: order.id }, { status: 'fulfilled' });

    // Send completion email
    await this.sendCompletionEmail(order, results);

    return {
      orderId: order.id,
      items: results,
      status: 'fulfilled',
      fulfilledAt: new Date(),
    };
  }

  /**
   * Fulfill a single KINGUIN order item
   * Fetches key from Kinguin API, encrypts, uploads to R2
   * 
   * Requires the order to already have a kinguinReservationId from startReservation()
   */
  private async fulfillKinguinItem(orderId: string, item: OrderItem, _customerEmail?: string): Promise<ItemFulfillmentResult> {
    try {
      // Get the order to retrieve the Kinguin reservation ID
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order === null) {
        throw new BadRequestException(`Order not found: ${orderId}`);
      }
      
      const reservationId = order.kinguinReservationId;
      if (reservationId === null || reservationId === undefined || reservationId === '') {
        throw new BadRequestException(`Order ${orderId} has no Kinguin reservation ID - call startReservation first`);
      }

      // Fetch the actual key from Kinguin API
      this.logger.debug(`[FULFILLMENT:KINGUIN] Fetching key from Kinguin for reservation: ${reservationId}`);
      
      let plainKey: string;
      try {
        plainKey = await this.kinguinClient.getKey(reservationId);
      } catch (keyError) {
        // Key might not be ready yet - Kinguin orders can take time
        const keyErrorMsg = keyError instanceof Error ? keyError.message : String(keyError);
        this.logger.warn(`[FULFILLMENT:KINGUIN] Key not ready: ${keyErrorMsg}`);
        throw new BadRequestException(`Kinguin key not ready for order ${orderId}: ${keyErrorMsg}`);
      }
      
      this.logger.debug(`[FULFILLMENT:KINGUIN] Retrieved key from Kinguin: ${plainKey.length} chars`);

      // Generate encryption key
      const encryptionKey = generateEncryptionKey();
      this.logger.debug(`[FULFILLMENT:KINGUIN] Generated encryption key: 32 bytes`);

      // Encrypt the key with AES-256-GCM
      const encrypted = encryptKey(plainKey, encryptionKey);
      this.logger.debug(
        `[FULFILLMENT:KINGUIN] Encrypted key: ${encrypted.encryptedKey.length} chars (base64)`,
      );

      // Upload to R2
      await this.r2StorageClient.uploadEncryptedKey({
        orderId,
        encryptedKey: encrypted.encryptedKey,
        encryptionIv: encrypted.iv,
        authTag: encrypted.authTag,
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Uploaded encrypted key to R2`);

      // Generate signed URL (15 minute expiry)
      const signedUrl = await this.r2StorageClient.generateSignedUrl({
        orderId,
        expiresInSeconds: 15 * 60,
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Generated signed URL (15 min expiry)`);

      // Update order item with signed URL
      await this.orderItemRepo.update(
        { id: item.id },
        {
          signedUrl,
          updatedAt: new Date(),
        },
      );

      // Create a Key record for audit (storageRef points to R2 object)
      const storageRef = `orders/${orderId}/key.json`;
      const keyEntity = this.keyRepo.create({
        orderItemId: item.id,
        storageRef,
        encryptionKey: encryptionKey.toString('base64'),
      });
      await this.keyRepo.save(keyEntity);

      this.logger.debug(`[FULFILLMENT:KINGUIN] Updated order item ${item.id} with signed URL`);

      return {
        itemId: item.id,
        productId: item.productId,
        signedUrl,
        encryptionKeySize: 32,
        status: 'fulfilled',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT:KINGUIN] Item fulfillment failed: ${message}`);
      throw error;
    }
  }

  /**
   * Send completion email with download link
   */
  private async sendCompletionEmail(order: Order, results: ItemFulfillmentResult[]): Promise<void> {
    try {
      const primary = results[0];
      if (primary !== undefined && typeof order.email === 'string' && order.email.length > 0) {
        const productName = 'Your Digital Product';
        await this.emailsService.sendOrderCompleted(order.email, {
          orderId: order.id,
          productName,
          downloadUrl: primary.signedUrl,
          expiresIn: '15 minutes',
        });
        this.logger.debug(`[FULFILLMENT] Order completion email queued for ${order.email}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[FULFILLMENT] Failed to send completion email: ${msg}`);
    }
  }

  /**
   * Start Kinguin reservation for an order (Phase 3: startReservation)
   * Saves reservation ID on the order for tracking
   * 
   * Looks up the kinguinOfferId from the Product entity for each item
   */
  async startReservation(orderId: string): Promise<{ reservationId: string; status: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }
    if (order.items === null || order.items === undefined || order.items.length === 0) {
      throw new BadRequestException(`Order has no items: ${orderId}`);
    }

    // Look up the product to get the kinguinOfferId
    const firstItem = order.items[0];
    if (firstItem === undefined) {
      throw new BadRequestException(`Order has no items: ${orderId}`);
    }
    
    const product = await this.productRepo.findOne({ where: { id: firstItem.productId } });
    if (product === null) {
      throw new BadRequestException(`Product not found: ${firstItem.productId}`);
    }
    
    // Verify this is a Kinguin product with valid offer ID
    if (product.sourceType !== 'kinguin') {
      throw new BadRequestException(`Product ${product.id} is not a Kinguin product`);
    }
    
    const offerId = product.kinguinOfferId;
    if (offerId === null || offerId === undefined || offerId === '') {
      throw new BadRequestException(`Product ${product.id} has no Kinguin offer ID configured`);
    }
    
    const quantity = order.items.length;

    this.logger.debug(
      `[FULFILLMENT] Starting reservation: order=${orderId}, offerId=${offerId}, qty=${quantity}`,
    );
    const reservation = await this.kinguinClient.createOrder({ offerId, quantity });

    await this.ordersService.setReservationId(orderId, reservation.id);

    this.logger.log(
      `[FULFILLMENT] Reservation created: order=${orderId}, reservation=${reservation.id}`,
    );
    return { reservationId: reservation.id, status: reservation.status };
  }

  /**
   * Finalize delivery using Kinguin reservation ID (Phase 3: finalizeDelivery)
   * Fetches delivered key, encrypts, uploads to R2, updates items, and sends email
   */
  async finalizeDelivery(reservationId: string): Promise<{ orderId: string; signedUrl: string }> {
    const order = await this.orderRepo.findOne({
      where: { kinguinReservationId: reservationId },
      relations: ['items'],
    });
    if (order === null) {
      throw new BadRequestException(`Order not found for reservation: ${reservationId}`);
    }

    this.logger.debug(`[FULFILLMENT] Finalizing delivery for reservation: ${reservationId}`);
    const status = await this.kinguinClient.getOrderStatus(order.id);
    if (status.status !== 'ready' || status.key === undefined || status.key === null || status.key === '') {
      throw new BadRequestException(
        `Reservation not ready for delivery: status=${status.status}`,
      );
    }

    const plainKey = status.key;
    const encryptionKey = generateEncryptionKey();
    // Removed: this.deliveryService.storeEncryptionKey(order.id, encryptionKey);

    const encrypted = encryptKey(plainKey, encryptionKey);

    await this.r2StorageClient.uploadEncryptedKey({
      orderId: order.id,
      encryptedKey: encrypted.encryptedKey,
      encryptionIv: encrypted.iv,
      authTag: encrypted.authTag,
    });

    const signedUrl = await this.r2StorageClient.generateSignedUrl({
      orderId: order.id,
      expiresInSeconds: 15 * 60,
    });

    for (const item of order.items) {
      await this.orderItemRepo.update({ id: item.id }, { signedUrl, updatedAt: new Date() });
      const storageRef = `orders/${order.id}/key.json`;
      const keyEntity = this.keyRepo.create({
        orderItemId: item.id,
        storageRef,
        encryptionKey: encryptionKey.toString('base64'),
      });
      await this.keyRepo.save(keyEntity);
    }

    try {
      if (order.email !== undefined && order.email !== '') {
        await this.emailsService.sendOrderCompleted(order.email, {
          orderId: order.id,
          productName: 'Your Digital Product',
          downloadUrl: signedUrl,
          expiresIn: '15 minutes',
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[FULFILLMENT] Email send failed: ${msg}`);
    }

    return { orderId: order.id, signedUrl };
  }

  /**
   * Enqueue fulfillment as background job
   *
   * @param orderId Order ID to fulfill
   * @returns Job ID for tracking
   */
  async enqueueFulfillment(orderId: string): Promise<string> {
    try {
      this.logger.debug(`[FULFILLMENT] Enqueuing fulfillment for order: ${orderId}`);

      // Use 'reserve' job to start async Kinguin flow
      const job = await this.fulfillmentQueue.add('reserve', { orderId });

      this.logger.debug(`[FULFILLMENT] Fulfillment enqueued with job ID: ${job.id}`);

      return job.id ?? '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT] Failed to enqueue fulfillment: ${message}`);
      throw error;
    }
  }

  /**
   * Check fulfillment status for an order
   *
   * @param orderId Order ID to check
   * @returns Current fulfillment status
   */
  async checkStatus(orderId: string): Promise<FulfillmentStatus> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (order === null || order === undefined) {
        throw new BadRequestException(`Order not found: ${orderId}`);
      }

      const itemsFulfilled = order.items.filter(
        (i) => i.signedUrl !== null && i.signedUrl !== undefined && i.signedUrl.length > 0,
      ).length;

      return {
        orderId,
        status: order.status,
        itemsFulfilled,
        itemsTotal: order.items.length,
        allFulfilled: itemsFulfilled === order.items.length,
        updatedAt: order.updatedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT] Status check failed: ${message}`);
      throw error;
    }
  }

  /**
   * Health check for fulfillment service
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      this.logger.debug(`[FULFILLMENT] Running health check`);

      // Check R2 client
      let r2Healthy = false;
      try {
        r2Healthy = await this.r2StorageClient.healthCheck();
      } catch {
        r2Healthy = false;
      }

      return {
        service: 'FulfillmentService',
        status: r2Healthy ? 'healthy' : 'degraded',
        dependencies: {
          r2Storage: r2Healthy,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT] Health check failed: ${message}`);
      return {
        service: 'FulfillmentService',
        status: 'unhealthy',
        dependencies: {
          r2Storage: false,
        },
        timestamp: new Date(),
        error: message,
      };
    }
  }
}

export interface ItemFulfillmentResult {
  itemId: string;
  productId: string;
  signedUrl: string;
  encryptionKeySize: number;
  status: 'fulfilled';
}

export interface FulfillmentResult {
  orderId: string;
  items: ItemFulfillmentResult[];
  status: string;
  fulfilledAt: Date;
}

export interface FulfillmentStatus {
  orderId: string;
  status: OrderStatus;
  itemsFulfilled: number;
  itemsTotal: number;
  allFulfilled: boolean;
  updatedAt: Date;
}

export interface HealthCheckResult {
  service: 'FulfillmentService';
  status: 'healthy' | 'degraded' | 'unhealthy';
  dependencies: {
    r2Storage: boolean;
  };
  timestamp: Date;
  error?: string;
}
