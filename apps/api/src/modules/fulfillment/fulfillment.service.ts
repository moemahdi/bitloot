import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

/**
 * Fulfillment orchestration service
 *
 * Manages the complete fulfillment pipeline:
 * 1. Fetch product key from Kinguin
 * 2. Encrypt the key with AES-256-GCM
 * 3. Upload encrypted key to Cloudflare R2
 * 4. Generate short-lived signed URL
 * 5. Update order with delivery link
 * 6. Log delivery for audit trail
 *
 * @example
 * const fulfillment = await fulfillmentService.fulfillOrder(orderId);
 * // {
 * //   orderId: 'order-123',
 * //   signedUrl: 'https://r2.../...?token=xyz&expires=...',
 * //   encryptionKeyId: 'key-456',
 * //   status: 'fulfilled',
 * //   fulfilledAt: Date
 * // }
 */
@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger('FulfillmentService');

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Key) private readonly keyRepo: Repository<Key>,
    private readonly kinguinClient: KinguinClient,
    private readonly r2StorageClient: R2StorageClient,
    @InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue,
    private readonly deliveryService: DeliveryService,
    private readonly emailsService: EmailsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Orchestrate complete fulfillment for an order
   *
   * Steps:
   * 1. Verify order and product exist
   * 2. Fetch key from Kinguin (simulated in MVP)
   * 3. Generate encryption key
   * 4. Encrypt key with AES-256-GCM
   * 5. Upload to R2
   * 6. Generate signed URL
   * 7. Update order items with URL
   *
   * @param orderId Order ID to fulfill
   * @returns FulfillmentResult with signed URL and metadata
   * @throws Error if any step fails
   */
  async fulfillOrder(orderId: string): Promise<FulfillmentResult> {
    try {
      this.logger.debug(`[FULFILLMENT] Starting fulfillment for order: ${orderId}`);

      // Verify order exists
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

      this.logger.debug(`[FULFILLMENT] Order found with ${order.items.length} items`);

      // Process each item
      const results: ItemFulfillmentResult[] = [];

      for (const item of order.items) {
        this.logger.debug(`[FULFILLMENT] Processing item: ${item.id} (product: ${item.productId})`);

        try {
          const itemResult = await this.fulfillItem(orderId, item, order.email);
          results.push(itemResult);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`[FULFILLMENT] Failed to fulfill item ${item.id}: ${message}`);
          throw error;
        }
      }

      // Send completion email once with primary signed URL
      try {
        const primary = results[0];
        if (primary !== undefined && typeof order.email === 'string' && order.email.length > 0) {
          // Use generic product name (full product info will be in Level 6)
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

      return {
        orderId,
        items: results,
        status: 'fulfilled',
        fulfilledAt: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT] Order fulfillment failed: ${message}`);
      throw error;
    }
  }

  /**
   * Fulfill a single order item
   *
   * @param orderId Parent order ID
   * @param item Order item to fulfill
   * @returns Item fulfillment result with signed URL
   */
  private async fulfillItem(orderId: string, item: OrderItem, _customerEmail?: string): Promise<ItemFulfillmentResult> {
    try {
      // In MVP, simulate key fetching
      this.logger.debug(`[FULFILLMENT] Simulating key fetch for product: ${item.productId}`);

      const plainKey = `key-for-${item.productId}-${orderId}`;
      this.logger.debug(`[FULFILLMENT] Simulated key: ${plainKey.length} chars`);

      // Generate encryption key
      const encryptionKey = generateEncryptionKey();
      this.logger.debug(`[FULFILLMENT] Generated encryption key: 32 bytes`);

      // Store encryption key in delivery service vault (MVP in-memory)
      try {
        this.deliveryService.storeEncryptionKey(orderId, encryptionKey);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`[FULFILLMENT] Failed to store encryption key: ${msg}`);
        throw e;
      }

      // Encrypt the key with AES-256-GCM
      const encrypted = encryptKey(plainKey, encryptionKey);
      this.logger.debug(
        `[FULFILLMENT] Encrypted key: ${encrypted.encryptedKey.length} chars (base64)`,
      );

      // Upload to R2
      await this.r2StorageClient.uploadEncryptedKey({
        orderId,
        encryptedKey: encrypted.encryptedKey,
        encryptionIv: encrypted.iv,
        authTag: encrypted.authTag,
      });
      this.logger.debug(`[FULFILLMENT] Uploaded encrypted key to R2`);

      // Generate signed URL (15 minute expiry)
      const signedUrl = await this.r2StorageClient.generateSignedUrl({
        orderId,
        expiresInSeconds: 15 * 60,
      });
      this.logger.debug(`[FULFILLMENT] Generated signed URL (15 min expiry)`);

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
      const keyEntity = this.keyRepo.create({ orderItemId: item.id, storageRef });
      await this.keyRepo.save(keyEntity);

      this.logger.debug(`[FULFILLMENT] Updated order item ${item.id} with signed URL`);

      return {
        itemId: item.id,
        productId: item.productId,
        signedUrl,
        encryptionKeySize: 32,
        status: 'fulfilled',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[FULFILLMENT] Item fulfillment failed: ${message}`);
      throw error;
    }
  }

  /**
   * Start Kinguin reservation for an order (Phase 3: startReservation)
   * Saves reservation ID on the order for tracking
   */
  async startReservation(orderId: string): Promise<{ reservationId: string; status: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }
    if (order.items === null || order.items === undefined || order.items.length === 0) {
      throw new BadRequestException(`Order has no items: ${orderId}`);
    }

    const offerId = order.items[0]?.productId ?? 'demo-product';
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
    this.deliveryService.storeEncryptionKey(order.id, encryptionKey);

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
      const keyEntity = this.keyRepo.create({ orderItemId: item.id, storageRef });
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

      const job = await this.fulfillmentQueue.add('fulfillOrder', { orderId });

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
