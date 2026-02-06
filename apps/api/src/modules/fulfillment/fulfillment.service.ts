import { Injectable, Logger, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../jobs/queues';
import { Order, type OrderStatus } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { KinguinClient } from './kinguin.client';
import { R2StorageClient } from '../storage/r2.client';
import { DeliveryService } from './delivery.service';
import { EmailsService } from '../emails/emails.service';
import { Key } from '../orders/key.entity';
import { OrdersService, invalidateOrderCache } from '../orders/orders.service';
import { Product, type ProductSourceType } from '../catalog/entities/product.entity';
import { AdminOpsService } from '../admin/admin-ops.service';
import { AdminInventoryService } from '../catalog/services/admin-inventory.service';
import {
  ProductDeliveryType,
  DeliveryContent,
} from '../catalog/types/product-delivery.types';

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
    @Inject(forwardRef(() => AdminInventoryService))
    private readonly inventoryService: AdminInventoryService,
  ) { }

  /**
   * Build items array for order completion email
   * Fetches product titles from the catalog and maps to email format
   */
  private async buildEmailItems(order: Order): Promise<{ items: Array<{ name: string; quantity: number; price: string }>; total: string }> {
    const items = order.items ?? [];
    const productIds = items.map((item) => item.productId);
    
    // Fetch product titles in batch
    const products = await this.productRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.title'])
      .where('p.id IN (:...ids)', { ids: productIds.length > 0 ? productIds : [''] })
      .getMany();
    
    const productMap = new Map(products.map((p) => [p.id, p.title]));
    
    const emailItems = items.map((item) => ({
      name: productMap.get(item.productId) ?? 'Digital Product',
      quantity: item.quantity ?? 1,
      price: item.unitPrice ?? '0.00',
    }));
    
    return {
      items: emailItems,
      total: order.totalCrypto ?? '0.00',
    };
  }

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

    // Idempotency check: if already fulfilled, return success (handles duplicate jobs)
    if (order.status === 'fulfilled') {
      this.logger.debug(`[FULFILLMENT] Order ${orderId} is already fulfilled (idempotent success)`);
      return {
        orderId: order.id,
        items: order.items.map((item) => ({
          itemId: item.id,
          productId: item.productId,
          signedUrl: item.signedUrl ?? '',
          encryptionKeySize: 256, // Already stored encrypted key
          status: 'fulfilled' as const,
        })),
        status: 'fulfilled',
        fulfilledAt: order.updatedAt,
      };
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
    
    // CRITICAL: Invalidate cache after status change to 'fulfilled'
    invalidateOrderCache(order.id);

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
   * 
   * NEW INVENTORY SYSTEM:
   * 1. Reserve item from product_inventory table (FIFO)
   * 2. Get decrypted item data
   * 3. Build delivery content based on delivery type
   * 4. Upload delivery content to R2
   * 5. Generate signed URL
   * 6. Mark item as sold
   * 
   * LEGACY FALLBACK (if no inventory items):
   * Falls back to checking for key.json in R2 (old system)
   */
  private async fulfillCustomItem(orderId: string, item: OrderItem): Promise<ItemFulfillmentResult> {
    this.logger.debug(`[FULFILLMENT:CUSTOM] Processing item: ${item.id} for order: ${orderId}`);

    // Get product to check delivery type
    const product = await this.productRepo.findOne({ where: { id: item.productId } });
    if (product === null) {
      throw new BadRequestException(`Product ${item.productId} not found`);
    }

    // Try NEW inventory system first
    const inventoryItem = await this.inventoryService.reserveItem(item.productId, orderId);

    if (inventoryItem !== null) {
      // NEW INVENTORY SYSTEM: Item reserved from inventory
      this.logger.debug(`[FULFILLMENT:CUSTOM:INVENTORY] Reserved item ${inventoryItem.id} for order ${orderId}`);

      try {
        // Get decrypted item data
        const { data: itemData } = await this.inventoryService.getItemDataForDelivery(inventoryItem.id);

        // Build delivery content based on type
        const deliveryContent = this.buildDeliveryContent(itemData, product);

        // Upload delivery content to R2 (unique path per order item)
        const storageRef = `orders/${orderId}/items/${item.id}/delivery.json`;
        await this.r2StorageClient.uploadToPath({
          path: storageRef,
          data: deliveryContent as unknown as Record<string, unknown>,
          metadata: {
            'order-id': orderId,
            'order-item-id': item.id,
            'product-id': item.productId,
            'delivery-type': product.deliveryType ?? 'key',
            'inventory-item-id': inventoryItem.id,
          },
        });
        this.logger.debug(`[FULFILLMENT:CUSTOM:INVENTORY] Uploaded delivery content to ${storageRef}`);

        // Generate signed URL (3 hour expiry)
        const signedUrl = await this.r2StorageClient.generateSignedUrlForPath({
          path: storageRef,
          expiresInSeconds: 3 * 60 * 60, // 3 hours
        });

        // Mark inventory item as sold
        const unitPrice = item.unitPrice ?? product.price ?? '0';
        await this.inventoryService.markAsSold(inventoryItem.id, orderId, unitPrice);
        this.logger.debug(`[FULFILLMENT:CUSTOM:INVENTORY] Marked item ${inventoryItem.id} as sold`);

        // Update order item with signed URL and inventory reference
        await this.orderItemRepo.update(
          { id: item.id },
          {
            signedUrl,
            inventoryItemId: inventoryItem.id,
            updatedAt: new Date(),
          },
        );

        // Create Key record for audit
        const keyEntity = this.keyRepo.create({
          orderItemId: item.id,
          storageRef,
          encryptionKey: `inventory:${inventoryItem.id}`,
        });
        await this.keyRepo.save(keyEntity);

        return {
          itemId: item.id,
          productId: item.productId,
          signedUrl,
          encryptionKeySize: 256,
          status: 'fulfilled',
        };
      } catch (error) {
        // If fulfillment fails, release the reservation
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`[FULFILLMENT:CUSTOM:INVENTORY] Failed, releasing reservation: ${errorMessage}`);
        await this.inventoryService.releaseReservation(inventoryItem.id);
        throw error;
      }
    }

    // LEGACY FALLBACK: Check old R2 path (single key per product)
    this.logger.debug(`[FULFILLMENT:CUSTOM:LEGACY] No inventory items, trying legacy R2 path`);
    const legacyStorageRef = `products/${item.productId}/key.json`;

    const keyExists = await this.r2StorageClient.exists(legacyStorageRef);
    if (!keyExists) {
      throw new BadRequestException(
        `No inventory available for product ${item.productId}. Out of stock.`
      );
    }

    // Generate signed URL for legacy path (3 hour expiry)
    const signedUrl = await this.r2StorageClient.generateSignedUrlForPath({
      path: legacyStorageRef,
      expiresInSeconds: 3 * 60 * 60, // 3 hours
    });

    this.logger.debug(`[FULFILLMENT:CUSTOM:LEGACY] Generated signed URL for ${legacyStorageRef}`);

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

    // Step 2: Fetch ALL keys from Kinguin at once (they return all keys for the order)
    let kinguinReservationId = order.kinguinReservationId;
    if ((kinguinReservationId === null || kinguinReservationId === undefined || kinguinReservationId.length === 0)) {
      // Re-fetch order to get the reservation ID after startReservation
      const refreshedOrder = await this.orderRepo.findOne({ where: { id: order.id } });
      if ((refreshedOrder?.kinguinReservationId === null || refreshedOrder?.kinguinReservationId === undefined || (refreshedOrder?.kinguinReservationId?.length ?? 0) === 0)) {
        throw new BadRequestException(`Order ${order.id} has no Kinguin reservation ID`);
      }
      kinguinReservationId = refreshedOrder.kinguinReservationId;
    }

    this.logger.debug(`[FULFILLMENT:KINGUIN] Fetching all keys from Kinguin for reservation: ${kinguinReservationId}`);
    const allKeys = await this.kinguinClient.getKeysV2(kinguinReservationId);
    this.logger.debug(`[FULFILLMENT:KINGUIN] Retrieved ${allKeys.length} keys from Kinguin`);

    if (allKeys.length === 0) {
      throw new BadRequestException(`No keys returned from Kinguin for order ${order.id}`);
    }

    // Step 3: Fetch products for matching keys to items
    const productIds = order.items.map((item) => item.productId);
    const products = await this.productRepo.find({
      where: productIds.map((id) => ({ id })),
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Step 4: Match and fulfill each item with its corresponding key
    const results: ItemFulfillmentResult[] = [];
    const usedKeyIndices = new Set<number>();

    for (const item of order.items) {
      this.logger.debug(`[FULFILLMENT:KINGUIN] Processing item: ${item.id} (product: ${item.productId})`);

      const product = productMap.get(item.productId);
      if (product === undefined) {
        throw new BadRequestException(`Product ${item.productId} not found for item ${item.id}`);
      }

      // Find a matching key by kinguinProductId (Kinguin's productId in key matches our product's kinguinProductId)
      let matchedKey: (typeof allKeys)[0] | undefined;
      let matchedIndex = -1;

      for (let i = 0; i < allKeys.length; i++) {
        if (usedKeyIndices.has(i)) continue; // Skip already used keys

        const key = allKeys[i];
        if (key === undefined) continue;

        // Match by Kinguin productId (our product.kinguinProductId === key.productId)
        if (key.productId === product.kinguinProductId) {
          matchedKey = key;
          matchedIndex = i;
          break;
        }
      }

      if (matchedKey === undefined || matchedIndex === -1) {
        throw new BadRequestException(
          `No matching key found for item ${item.id} (product: ${product.kinguinProductId})`,
        );
      }

      usedKeyIndices.add(matchedIndex);
      this.logger.debug(
        `[FULFILLMENT:KINGUIN] Matched key for item ${item.id}: ${matchedKey.serial.length} chars, type: ${matchedKey.type}`,
      );

      // Upload this item's key to R2 with unique path (includes orderItemId)
      const uploadResult = await this.r2StorageClient.uploadRawKey({
        orderId: order.id,
        orderItemId: item.id,
        content: matchedKey.serial,
        contentType: matchedKey.type,
        filename: matchedKey.name,
        metadata: {
          'order-item-id': item.id,
          'kinguin-reservation-id': kinguinReservationId,
          'kinguin-product-id': matchedKey.productId,
        },
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Uploaded key to R2: ${uploadResult.objectKey}`);

      // Generate signed URL for this specific item
      const signedUrl = await this.r2StorageClient.generateSignedUrlForRawKey({
        orderId: order.id,
        orderItemId: item.id,
        contentType: matchedKey.type,
        expiresInSeconds: 3 * 60 * 60, // 3 hours
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Generated signed URL for item ${item.id}`);

      // Update order item with signed URL
      await this.orderItemRepo.update(
        { id: item.id },
        {
          signedUrl,
          updatedAt: new Date(),
        },
      );

      // Create a Key record for audit
      const keyEntity = this.keyRepo.create({
        orderItemId: item.id,
        storageRef: uploadResult.objectKey,
        encryptionKey: `raw:${matchedKey.type}`,
      });
      await this.keyRepo.save(keyEntity);

      results.push({
        itemId: item.id,
        productId: item.productId,
        signedUrl,
        encryptionKeySize: 0,
        status: 'fulfilled',
      });
    }

    // Update order status to fulfilled
    await this.orderRepo.update({ id: order.id }, { status: 'fulfilled' });
    
    // CRITICAL: Invalidate cache after status change to 'fulfilled'
    invalidateOrderCache(order.id);

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
   * Fetches key from Kinguin API and uploads to R2 in original format (no encryption)
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

      // Fetch the actual key from Kinguin API (v2 endpoint returns full key object with type)
      this.logger.debug(`[FULFILLMENT:KINGUIN] Fetching key from Kinguin for reservation: ${reservationId}`);
      
      let keyObject: { serial: string; type: string; name?: string };
      try {
        const keys = await this.kinguinClient.getKeysV2(reservationId);
        if (keys.length === 0) {
          throw new BadRequestException(`No keys returned from Kinguin for order ${orderId}`);
        }
        // Use the first key (most orders have a single key)
        const firstKey = keys[0];
        if (firstKey === undefined) {
          throw new BadRequestException(`First key is undefined for order ${orderId}`);
        }
        keyObject = {
          serial: firstKey.serial,
          type: firstKey.type,
          name: firstKey.name,
        };
      } catch (keyError) {
        // Key might not be ready yet - Kinguin orders can take time
        const keyErrorMsg = keyError instanceof Error ? keyError.message : String(keyError);
        this.logger.warn(`[FULFILLMENT:KINGUIN] Key not ready: ${keyErrorMsg}`);
        throw new BadRequestException(`Kinguin key not ready for order ${orderId}: ${keyErrorMsg}`);
      }
      
      this.logger.debug(`[FULFILLMENT:KINGUIN] Retrieved key from Kinguin: ${keyObject.serial.length} chars, type: ${keyObject.type}`);

      // Upload raw key to R2 (no encryption - R2 is credential-protected)
      const uploadResult = await this.r2StorageClient.uploadRawKey({
        orderId,
        content: keyObject.serial,
        contentType: keyObject.type,
        filename: keyObject.name,
        metadata: {
          'order-item-id': item.id,
          'kinguin-reservation-id': reservationId,
        },
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Uploaded raw key to R2: ${uploadResult.objectKey}`);

      // Generate signed URL (3 hour expiry)
      const signedUrl = await this.r2StorageClient.generateSignedUrlForRawKey({
        orderId,
        contentType: keyObject.type,
        expiresInSeconds: 3 * 60 * 60, // 3 hours
      });
      this.logger.debug(`[FULFILLMENT:KINGUIN] Generated signed URL (3 hour expiry)`);

      // Update order item with signed URL
      await this.orderItemRepo.update(
        { id: item.id },
        {
          signedUrl,
          updatedAt: new Date(),
        },
      );

      // Create a Key record for audit (storageRef points to R2 object, no encryptionKey needed)
      const keyEntity = this.keyRepo.create({
        orderItemId: item.id,
        storageRef: uploadResult.objectKey,
        // Store contentType instead of encryptionKey (no encryption used)
        encryptionKey: `raw:${keyObject.type}`,
      });
      await this.keyRepo.save(keyEntity);

      this.logger.debug(`[FULFILLMENT:KINGUIN] Updated order item ${item.id} with signed URL`);

      return {
        itemId: item.id,
        productId: item.productId,
        signedUrl,
        encryptionKeySize: 0, // No encryption used
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
   * IDEMPOTENT: Checks completionEmailSent flag to prevent duplicate emails
   */
  private async sendCompletionEmail(order: Order, results: ItemFulfillmentResult[]): Promise<void> {
    try {
      // IDEMPOTENCY CHECK: Only send email once per order
      if (order.completionEmailSent) {
        this.logger.debug(`[FULFILLMENT] Completion email already sent for order ${order.id}, skipping`);
        return;
      }

      const primary = results[0];
      if (primary !== undefined && typeof order.email === 'string' && order.email.length > 0) {
        // Build items array with real product titles and prices
        const { items, total } = await this.buildEmailItems(order);
        
        await this.emailsService.sendOrderCompleted(order.email, {
          orderId: order.id,
          items,
          total,
        });
        
        // Mark email as sent AFTER successful send (idempotency)
        await this.orderRepo.update(order.id, { completionEmailSent: true });
        this.logger.debug(`[FULFILLMENT] Order completion email sent for ${order.email}, flag set to true`);
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
   * Uses Kinguin v2 API with productId (offerId) and price from product.cost
   * Supports multi-item orders with multiple different products
   * 
   * IDEMPOTENT: If order already has a kinguinReservationId, returns existing reservation
   */
  async startReservation(orderId: string): Promise<{ reservationId: string; status: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
    if (order === null) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }
    if (order.items === null || order.items === undefined || order.items.length === 0) {
      throw new BadRequestException(`Order has no items: ${orderId}`);
    }

    // IDEMPOTENCY CHECK: If reservation already exists, return it instead of creating a new one
    if (order.kinguinReservationId !== null && order.kinguinReservationId !== undefined && order.kinguinReservationId !== '') {
      this.logger.log(
        `[FULFILLMENT] Reservation already exists for order ${orderId}: ${order.kinguinReservationId} (idempotent)`,
      );
      return { reservationId: order.kinguinReservationId, status: 'existing' };
    }

    // Aggregate items by productId to handle multiple different products
    // Each productId can appear multiple times (for quantity > 1)
    const productQuantities = new Map<string, number>();
    for (const item of order.items) {
      const current = productQuantities.get(item.productId) ?? 0;
      productQuantities.set(item.productId, current + 1);
    }

    // Fetch all unique products
    const productIds = Array.from(productQuantities.keys());
    const products = await this.productRepo.find({
      where: productIds.map((id) => ({ id })),
    });

    // Build products array for Kinguin API
    const kinguinProducts: Array<{
      productId: string;
      qty: number;
      price: number;
      offerId?: string;
    }> = [];

    for (const product of products) {
      // Verify this is a Kinguin product with valid product ID
      if (product.sourceType !== 'kinguin') {
        throw new BadRequestException(`Product ${product.id} is not a Kinguin product`);
      }
      
      // Get the Kinguin productId (required for v2 API)
      const kinguinProductId = product.kinguinProductId;
      if (kinguinProductId === null || kinguinProductId === undefined || kinguinProductId === '') {
        throw new BadRequestException(`Product ${product.id} has no Kinguin product ID configured`);
      }
      
      // Get the cost price for the API call
      const cost = parseFloat(product.cost);
      if (isNaN(cost) || cost <= 0) {
        throw new BadRequestException(`Product ${product.id} has invalid cost: ${product.cost}`);
      }
      
      const quantity = productQuantities.get(product.id) ?? 1;
      const offerId = product.kinguinOfferId;

      this.logger.debug(
        `[FULFILLMENT] Adding to reservation: productId=${kinguinProductId}, offerId=${offerId ?? 'none'}, cost=${cost}, qty=${quantity}`,
      );

      kinguinProducts.push({
        productId: kinguinProductId,
        qty: quantity,
        price: cost,
        ...(offerId !== null && offerId !== undefined && offerId !== '' ? { offerId } : {}),
      });
    }

    this.logger.debug(
      `[FULFILLMENT] Starting reservation: order=${orderId}, ${kinguinProducts.length} product(s), total items=${order.items.length}`,
    );
    
    // Use placeOrderV2 with all products in a single Kinguin order
    // Handle "orderExternalId already used" error by recovering existing order
    let kinguinOrder: { orderId: string; status: string };
    
    try {
      kinguinOrder = await this.kinguinClient.placeOrderV2({
        products: kinguinProducts,
        orderExternalId: orderId, // Link to our order for tracking
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is a "orderExternalId already used" error
      if (errorMessage.includes('already used') || errorMessage.includes('ConstraintViolation')) {
        this.logger.warn(
          `[FULFILLMENT] Order ${orderId} already exists in Kinguin, attempting to recover...`,
        );
        
        // Search for the existing order by orderExternalId
        const searchResult = await this.kinguinClient.searchOrders({
          orderExternalId: orderId,
          limit: 1,
        });
        
        if (searchResult.results.length === 0) {
          throw new BadRequestException(
            `Kinguin order creation failed and could not find existing order: ${errorMessage}`,
          );
        }
        
        const existingOrder = searchResult.results[0];
        if (existingOrder === undefined) {
          throw new BadRequestException(
            `Kinguin order creation failed and recovery returned undefined: ${errorMessage}`,
          );
        }
        
        // Found the existing order - use it
        kinguinOrder = {
          orderId: existingOrder.orderId,
          status: existingOrder.status,
        };
        
        this.logger.log(
          `[FULFILLMENT] Recovered existing Kinguin order: ${kinguinOrder.orderId} (status: ${kinguinOrder.status})`,
        );
      } else {
        // Not a duplicate error, rethrow
        throw error;
      }
    }

    await this.ordersService.setReservationId(orderId, kinguinOrder.orderId);

    this.logger.log(
      `[FULFILLMENT] Reservation created: order=${orderId}, reservation=${kinguinOrder.orderId}`,
    );
    return { reservationId: kinguinOrder.orderId, status: kinguinOrder.status };
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
    
    // IMPORTANT: Use reservationId (Kinguin order ID), not order.id (BitLoot order ID)
    const status = await this.kinguinClient.getOrderStatus(reservationId);
    if (status.status !== 'ready' || status.key === undefined || status.key === null || status.key === '') {
      throw new BadRequestException(
        `Reservation not ready for delivery: status=${status.status}`,
      );
    }

    const plainKey = status.key;
    const keyType = status.keyType ?? 'text/plain';

    // Upload raw key to R2 (no encryption - R2 is already credential-protected)
    await this.r2StorageClient.uploadRawKey({
      orderId: order.id,
      content: plainKey,
      contentType: keyType,
    });

    // Generate signed URL for raw file download (3 hours)
    const signedUrl = await this.r2StorageClient.generateSignedUrlForRawKey({
      orderId: order.id,
      contentType: keyType,
      expiresInSeconds: 3 * 60 * 60, // 3 hours
    });

    // Determine file extension for storage reference
    const extensionMap: Record<string, string> = {
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
    };
    const extension = extensionMap[keyType] ?? 'txt';
    const storageRef = `orders/${order.id}/key.${extension}`;

    for (const item of order.items) {
      await this.orderItemRepo.update({ id: item.id }, { signedUrl, updatedAt: new Date() });
      const keyEntity = this.keyRepo.create({
        orderItemId: item.id,
        storageRef,
        encryptionKey: `raw:${keyType}`, // Mark as raw (no encryption)
        contentType: keyType,
      });
      await this.keyRepo.save(keyEntity);
    }

    try {
      if (order.email !== undefined && order.email !== '') {
        // Build items array with real product titles and prices
        const { items, total } = await this.buildEmailItems(order);
        
        await this.emailsService.sendOrderCompleted(order.email, {
          orderId: order.id,
          items,
          total,
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
   * RECOVERY: Recover signed URLs for orders that have keys in R2 but no signedUrl
   *
   * This handles the case where:
   * 1. Payment was successful
   * 2. Key was uploaded to R2 (Kinguin delivered or custom uploaded)
   * 3. But signedUrl was never populated (webhook failed, job crashed, etc.)
   *
   * The method checks if keys exist in R2 and regenerates signed URLs.
   *
   * @param orderId Order ID to recover
   * @returns Updated order items with fresh signed URLs
   */
  async recoverOrderKeys(orderId: string): Promise<{ recovered: boolean; items: Array<{ itemId: string; signedUrl: string | null }> }> {
    this.logger.debug(`[RECOVERY] Starting key recovery for order: ${orderId}`);

    // Load order with items and keys
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.keys'],
    });

    if (order === null || order === undefined) {
      this.logger.warn(`[RECOVERY] Order not found: ${orderId}`);
      return { recovered: false, items: [] };
    }

    // Only recover orders that are paid but not fulfilled
    if (order.status !== 'paid') {
      this.logger.debug(`[RECOVERY] Order ${orderId} has status '${order.status}', skipping recovery`);
      return { recovered: false, items: order.items.map(i => ({ itemId: i.id, signedUrl: i.signedUrl })) };
    }

    const recoveredItems: Array<{ itemId: string; signedUrl: string | null }> = [];
    let anyRecovered = false;

    for (const item of order.items) {
      // Skip items that already have a signed URL
      if (item.signedUrl !== null && item.signedUrl !== undefined && item.signedUrl.length > 0) {
        recoveredItems.push({ itemId: item.id, signedUrl: item.signedUrl });
        continue;
      }

      // Try to recover key from R2
      try {
        // Get the key record to find contentType
        const key = item.keys?.[0];
        const contentType = key?.contentType ?? 'text/plain';

        // Map content type to file extension
        const extensionMap: Record<string, string> = {
          'text/plain': 'txt',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'application/octet-stream': 'bin',
        };
        const extension = extensionMap[contentType] ?? 'txt';

        // Check if file exists in R2
        const keyPath = `orders/${orderId}/key.${extension}`;
        const keyExists = await this.r2StorageClient.exists(keyPath);

        if (!keyExists) {
          this.logger.warn(`[RECOVERY] Key not found at ${keyPath} for order ${orderId}`);
          recoveredItems.push({ itemId: item.id, signedUrl: null });
          continue;
        }

        // Generate fresh signed URL
        const signedUrl = await this.r2StorageClient.generateSignedUrlForRawKey({
          orderId,
          contentType,
          expiresInSeconds: 10800, // 3 hours
        });

        // Update order item with signed URL
        await this.orderItemRepo.update(item.id, { signedUrl });

        this.logger.log(`[RECOVERY] Successfully recovered key for order ${orderId}, item ${item.id}`);
        recoveredItems.push({ itemId: item.id, signedUrl });
        anyRecovered = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`[RECOVERY] Failed to recover item ${item.id}: ${message}`);
        recoveredItems.push({ itemId: item.id, signedUrl: null });
      }
    }

    // If all items now have signed URLs, mark order as fulfilled
    const allItemsHaveUrls = recoveredItems.every(i => i.signedUrl !== null);
    if (anyRecovered && allItemsHaveUrls) {
      await this.ordersService.markFulfilled(orderId);
      this.logger.log(`[RECOVERY] Order ${orderId} marked as fulfilled after recovery`);

      // Send delivery email
      try {
        const freshOrder = await this.orderRepo.findOne({
          where: { id: orderId },
          relations: ['items'],
        });
        if (freshOrder !== null && freshOrder !== undefined) {
          // Build items array with real product titles and prices
          const { items, total } = await this.buildEmailItems(freshOrder);
          
          await this.emailsService.sendOrderCompleted(freshOrder.email, {
            orderId,
            items,
            total,
          });
          this.logger.log(`[RECOVERY] Delivery email sent for order ${orderId}`);
        }
      } catch (emailError) {
        this.logger.warn(`[RECOVERY] Failed to send delivery email: ${String(emailError)}`);
      }
    }

    return { recovered: anyRecovered, items: recoveredItems };
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

  /**
   * Build delivery content from inventory item data
   * Converts internal item data format to customer-facing delivery content
   */
  private buildDeliveryContent(
    itemData: {
      type: string;
      key?: string;
      username?: string;
      password?: string;
      email?: string;
      recoveryEmail?: string;
      securityAnswers?: Record<string, string>;
      notes?: string;
      code?: string;
      pin?: string;
      value?: number;
      currency?: string;
      licenseKey?: string;
      licensedTo?: string;
      seats?: number;
      expiresAt?: string;
      activationUrl?: string;
      downloadUrl?: string;
      items?: Array<{
        type: string;
        label?: string;
        value: string;
        username?: string;
        password?: string;
        pin?: string;
      }>;
      fields?: Array<{
        label: string;
        value: string;
        sensitive?: boolean;
      }>;
    },
    product: Product,
  ): DeliveryContent {
    const baseContent: DeliveryContent = {
      productTitle: product.title,
      deliveryType: product.deliveryType ?? ProductDeliveryType.KEY,
      deliveredAt: new Date().toISOString(),
      deliveryInstructions: product.deliveryInstructions ?? undefined,
      items: [],
    };

    switch (itemData.type) {
      case 'key':
        baseContent.items.push({
          type: 'key',
          label: 'Activation Key',
          value: itemData.key ?? '',
        });
        break;

      case 'account':
        baseContent.items.push({
          type: 'credential',
          label: 'Username/Email',
          value: itemData.username ?? '',
        });
        baseContent.items.push({
          type: 'credential',
          label: 'Password',
          value: itemData.password ?? '',
          sensitive: true,
        });
        if (itemData.email !== undefined && itemData.email !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Account Email',
            value: itemData.email,
          });
        }
        if (itemData.recoveryEmail !== undefined && itemData.recoveryEmail !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Recovery Email',
            value: itemData.recoveryEmail,
          });
        }
        if (itemData.securityAnswers !== undefined && itemData.securityAnswers !== null) {
          for (const [question, answer] of Object.entries(itemData.securityAnswers)) {
            baseContent.items.push({
              type: 'info',
              label: `Security Q: ${question}`,
              value: answer,
              sensitive: true,
            });
          }
        }
        if (itemData.notes !== undefined && itemData.notes !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Important Notes',
            value: itemData.notes,
          });
        }
        break;

      case 'code':
        baseContent.items.push({
          type: 'key',
          label: itemData.value !== undefined ? `Gift Card (${itemData.value} ${itemData.currency ?? ''})` : 'Code',
          value: itemData.code ?? '',
        });
        if (itemData.pin !== undefined && itemData.pin !== '') {
          baseContent.items.push({
            type: 'key',
            label: 'PIN',
            value: itemData.pin,
            sensitive: true,
          });
        }
        break;

      case 'license':
        baseContent.items.push({
          type: 'key',
          label: 'License Key',
          value: itemData.licenseKey ?? '',
        });
        if (itemData.licensedTo !== undefined && itemData.licensedTo !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Licensed To',
            value: itemData.licensedTo,
          });
        }
        if (itemData.seats !== undefined && itemData.seats !== null) {
          baseContent.items.push({
            type: 'info',
            label: 'Seats/Activations',
            value: String(itemData.seats),
          });
        }
        if (itemData.expiresAt !== undefined && itemData.expiresAt !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Expires',
            value: itemData.expiresAt,
          });
        }
        if (itemData.activationUrl !== undefined && itemData.activationUrl !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Activation URL',
            value: itemData.activationUrl,
          });
          baseContent.activationUrl = itemData.activationUrl;
        }
        if (itemData.downloadUrl !== undefined && itemData.downloadUrl !== '') {
          baseContent.items.push({
            type: 'info',
            label: 'Download URL',
            value: itemData.downloadUrl,
          });
        }
        break;

      case 'bundle':
        if (itemData.items !== undefined && itemData.items !== null && itemData.items.length > 0) {
          for (let i = 0; i < itemData.items.length; i++) {
            const bundleItem = itemData.items[i]!;
            const prefix = bundleItem.label ?? `Item ${i + 1}`;
            
            if (bundleItem.type === 'account') {
              baseContent.items.push({
                type: 'credential',
                label: `${prefix} - Username`,
                value: bundleItem.username ?? bundleItem.value,
              });
              if (bundleItem.password !== undefined && bundleItem.password !== '') {
                baseContent.items.push({
                  type: 'credential',
                  label: `${prefix} - Password`,
                  value: bundleItem.password,
                  sensitive: true,
                });
              }
            } else {
              baseContent.items.push({
                type: 'key',
                label: prefix,
                value: bundleItem.value,
              });
              if (bundleItem.pin !== undefined && bundleItem.pin !== '') {
                baseContent.items.push({
                  type: 'key',
                  label: `${prefix} - PIN`,
                  value: bundleItem.pin,
                  sensitive: true,
                });
              }
            }
          }
        }
        break;

      case 'custom':
        if (itemData.fields !== undefined && itemData.fields !== null && itemData.fields.length > 0) {
          for (const field of itemData.fields) {
            baseContent.items.push({
              type: field.sensitive === true ? 'credential' : 'info',
              label: field.label,
              value: field.value,
              sensitive: field.sensitive,
            });
          }
        }
        break;

      default:
        // Fallback: try to put the data as-is
        baseContent.items.push({
          type: 'info',
          label: 'Content',
          value: JSON.stringify(itemData),
        });
    }

    return baseContent;
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
