import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as crypto from 'crypto';
import { Product } from '../entities/product.entity';
import { ProductInventory } from '../entities/product-inventory.entity';
import {
  InventoryItemStatus,
  createMaskedPreview,
  validateItemData,
  ItemData,
} from '../types/product-delivery.types';
import {
  AddInventoryItemDto,
  BulkImportInventoryDto,
  InventoryQueryDto,
  UpdateItemStatusDto,
  InventoryItemResponseDto,
  InventoryStatsDto,
  BulkImportResultDto,
  PaginatedInventoryDto,
} from '../dto/inventory.dto';
import { AuditLogService } from '../../audit/audit-log.service';

// AES-256-GCM encryption parameters
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// Note: AUTH_TAG_LENGTH is automatically handled by crypto.createCipheriv

@Injectable()
export class AdminInventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductInventory)
    private readonly inventoryRepo: Repository<ProductInventory>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ============================================
  // ENCRYPTION UTILITIES
  // ============================================

  /**
   * Encrypt item data using AES-256-GCM
   */
  private encryptItemData(data: ItemData): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    const encryptionKey = this.getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

    const json = JSON.stringify(data);
    let encrypted = cipher.update(json, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Decrypt item data
   */
  private decryptItemData(
    encrypted: string,
    iv: string,
    authTag: string,
  ): ItemData {
    const encryptionKey = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      encryptionKey,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as ItemData;
  }

  /**
   * Get encryption key from environment
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.INVENTORY_ENCRYPTION_KEY;
    if (key === undefined || key === '') {
      throw new Error('INVENTORY_ENCRYPTION_KEY not set in environment');
    }
    // Key should be 32 bytes (256 bits) for AES-256, stored as 64-character hex string
    return Buffer.from(key, 'hex');
  }

  /**
   * Generate SHA-256 hash for duplicate detection
   */
  private generateItemHash(data: ItemData): string {
    // Create a canonical representation for hashing
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  // ============================================
  // CORE INVENTORY OPERATIONS
  // ============================================

  /**
   * Add a single item to product inventory
   */
  async addItem(
    productId: string,
    dto: AddInventoryItemDto,
    adminId: string,
  ): Promise<InventoryItemResponseDto> {
    // Validate product exists and is custom type
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (product === null) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.sourceType !== 'custom') {
      throw new BadRequestException(
        'Cannot add inventory to Kinguin products. Only custom products support inventory.',
      );
    }

    // Validate item data matches product delivery type
    const itemData = dto.itemData as unknown as ItemData;
    if (itemData.type !== (product.deliveryType as string)) {
      throw new BadRequestException(
        `Item type "${itemData.type}" does not match product delivery type "${product.deliveryType}"`,
      );
    }

    const validationResult = validateItemData(product.deliveryType, itemData);
    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.error);
    }

    // Check for duplicates
    const itemHash = this.generateItemHash(itemData);
    const existing = await this.inventoryRepo.findOne({
      where: { productId, itemHash },
    });

    if (existing !== null) {
      throw new ConflictException(
        'This item already exists in inventory (duplicate detected)',
      );
    }

    // Encrypt the item data
    const { encrypted, iv, authTag } = this.encryptItemData(itemData);
    const maskedPreview = createMaskedPreview(itemData);

    // Create inventory item
    return this.dataSource.transaction(async (manager) => {
      const item = manager.create(ProductInventory, {
        productId,
        deliveryType: product.deliveryType,
        itemDataEncrypted: encrypted,
        encryptionIv: iv,
        authTag,
        itemHash,
        maskedPreview,
        status: InventoryItemStatus.AVAILABLE,
        expiresAt: dto.expiresAt !== undefined && dto.expiresAt !== '' ? new Date(dto.expiresAt) : undefined,
        supplier: dto.supplier,
        cost: dto.cost !== undefined ? String(dto.cost) : undefined,
        notes: dto.notes,
        uploadedAt: new Date(),
        uploadedById: adminId,
      } as Partial<ProductInventory>);

      const saved = await manager.save(ProductInventory, item);

      // Update product stock count
      await manager.increment(Product, { id: productId }, 'stockAvailable', 1);

      // Audit log
      await this.auditLogService.log(
        adminId,
        'inventory:add',
        `product:${productId}`,
        { itemId: saved.id },
        `Added inventory item ${saved.id} (${maskedPreview})`,
      );

      return this.toResponseDto(saved);
    });
  }

  /**
   * Bulk import items to product inventory
   */
  async bulkImport(
    productId: string,
    dto: BulkImportInventoryDto,
    adminId: string,
  ): Promise<BulkImportResultDto> {
    // Validate product exists and is custom type
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (product === null) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.sourceType !== 'custom') {
      throw new BadRequestException(
        'Cannot add inventory to Kinguin products.',
      );
    }

    const result: BulkImportResultDto = {
      imported: 0,
      skippedDuplicates: 0,
      failed: 0,
      errors: [],
    };

    const skipDuplicates = dto.skipDuplicates ?? true;

    // Process in transaction for consistency
    await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i]!;
        const itemData = itemDto.itemData as unknown as ItemData;

        try {
          // Validate item type
          if (itemData.type !== (product.deliveryType as string)) {
            result.failed++;
            result.errors.push(
              `Item ${i + 1}: Type mismatch (${itemData.type} vs ${product.deliveryType})`,
            );
            continue;
          }

          const validationResult = validateItemData(
            product.deliveryType,
            itemData,
          );
          if (!validationResult.valid) {
            result.failed++;
            result.errors.push(`Item ${i + 1}: ${validationResult.error}`);
            continue;
          }

          // Check for duplicates
          const itemHash = this.generateItemHash(itemData);
          const existing = await manager.findOne(ProductInventory, {
            where: { productId, itemHash },
          });

          if (existing !== null) {
            if (skipDuplicates) {
              result.skippedDuplicates++;
              continue;
            } else {
              result.failed++;
              result.errors.push(`Item ${i + 1}: Duplicate item`);
              continue;
            }
          }

          // Encrypt and create
          const { encrypted, iv, authTag } = this.encryptItemData(itemData);
          const maskedPreview = createMaskedPreview(itemData);

          const costValue = itemDto.cost ?? dto.costPerItem;
          const item = manager.create(ProductInventory, {
            productId,
            deliveryType: product.deliveryType,
            itemDataEncrypted: encrypted,
            encryptionIv: iv,
            authTag,
            itemHash,
            maskedPreview,
            status: InventoryItemStatus.AVAILABLE,
            expiresAt: itemDto.expiresAt !== undefined && itemDto.expiresAt !== ''
              ? new Date(itemDto.expiresAt)
              : undefined,
            supplier: itemDto.supplier ?? dto.supplier,
            cost: costValue !== undefined ? String(costValue) : undefined,
            notes: itemDto.notes,
            uploadedAt: new Date(),
            uploadedById: adminId,
          } as Partial<ProductInventory>);

          await manager.save(ProductInventory, item);
          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Update product stock count
      if (result.imported > 0) {
        await manager.increment(
          Product,
          { id: productId },
          'stockAvailable',
          result.imported,
        );
      }
    });

    // Audit log
    await this.auditLogService.log(
      adminId,
      'inventory:bulk-import',
      `product:${productId}`,
      { imported: result.imported, skipped: result.skippedDuplicates, failed: result.failed },
      `Bulk imported ${result.imported} items, skipped ${result.skippedDuplicates}, failed ${result.failed}`,
    );

    return result;
  }

  /**
   * List inventory items for a product
   */
  async listItems(
    productId: string,
    query: InventoryQueryDto,
  ): Promise<PaginatedInventoryDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const qb = this.inventoryRepo
      .createQueryBuilder('item')
      .where('item.productId = :productId', { productId });

    if (query.status !== undefined) {
      qb.andWhere('item.status = :status', { status: query.status });
    }

    if (query.supplier !== undefined && query.supplier !== '') {
      qb.andWhere('item.supplier = :supplier', { supplier: query.supplier });
    }

    const sortBy = query.sortBy ?? 'uploadedAt';
    const sortDir = (query.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`item.${sortBy}`, sortDir);

    const [items, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: items.map((item) => this.toResponseDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get inventory statistics for a product
   */
  async getStats(productId: string): Promise<InventoryStatsDto> {
    const stats = await this.inventoryRepo
      .createQueryBuilder('item')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN item.status = '${InventoryItemStatus.AVAILABLE}' THEN 1 ELSE 0 END) as available`,
        `SUM(CASE WHEN item.status = '${InventoryItemStatus.RESERVED}' THEN 1 ELSE 0 END) as reserved`,
        `SUM(CASE WHEN item.status = '${InventoryItemStatus.SOLD}' THEN 1 ELSE 0 END) as sold`,
        `SUM(CASE WHEN item.status = '${InventoryItemStatus.EXPIRED}' THEN 1 ELSE 0 END) as expired`,
        `SUM(CASE WHEN item.status = '${InventoryItemStatus.INVALID}' THEN 1 ELSE 0 END) as invalid`,
        'COALESCE(SUM(item.cost), 0) as "totalCost"',
        'COALESCE(AVG(item.cost), 0) as "avgCost"',
        `COALESCE(SUM(CASE WHEN item.status = '${InventoryItemStatus.SOLD}' THEN item."soldPrice" ELSE 0 END), 0) as "totalRevenue"`,
      ])
      .where('item.productId = :productId', { productId })
      .getRawOne<{
        total: string;
        available: string;
        reserved: string;
        sold: string;
        expired: string;
        invalid: string;
        totalCost: string;
        avgCost: string;
        totalRevenue: string;
      }>();

    const totalCost = parseFloat(stats?.totalCost ?? '0');
    const totalRevenue = parseFloat(stats?.totalRevenue ?? '0');

    return {
      total: parseInt(stats?.total ?? '0', 10),
      available: parseInt(stats?.available ?? '0', 10),
      reserved: parseInt(stats?.reserved ?? '0', 10),
      sold: parseInt(stats?.sold ?? '0', 10),
      expired: parseInt(stats?.expired ?? '0', 10),
      invalid: parseInt(stats?.invalid ?? '0', 10),
      totalCost,
      avgCost: parseFloat(stats?.avgCost ?? '0'),
      totalRevenue,
      totalProfit: totalRevenue - totalCost,
    };
  }

  /**
   * Update item status (mark as invalid/available)
   */
  async updateStatus(
    productId: string,
    itemId: string,
    dto: UpdateItemStatusDto,
    adminId: string,
  ): Promise<InventoryItemResponseDto> {
    const item = await this.inventoryRepo.findOne({
      where: { id: itemId, productId },
    });

    if (item === null) {
      throw new NotFoundException('Inventory item not found');
    }

    // Cannot change status of sold items
    if (item.status === InventoryItemStatus.SOLD) {
      throw new BadRequestException('Cannot change status of sold items');
    }

    const oldStatus = item.status;

    return this.dataSource.transaction(async (manager) => {
      // Update item
      item.status = dto.status;

      if (dto.status === InventoryItemStatus.INVALID) {
        item.invalidReason = dto.reason;
        item.invalidatedById = adminId;
        item.invalidatedAt = new Date();
      } else {
        // Restoring to available
        item.invalidReason = undefined;
        item.invalidatedById = undefined;
        item.invalidatedAt = undefined;
      }

      const saved = await manager.save(ProductInventory, item);

      // Update stock counts
      if (
        oldStatus === InventoryItemStatus.AVAILABLE &&
        dto.status === InventoryItemStatus.INVALID
      ) {
        await manager.decrement(
          Product,
          { id: productId },
          'stockAvailable',
          1,
        );
      } else if (
        oldStatus === InventoryItemStatus.INVALID &&
        dto.status === InventoryItemStatus.AVAILABLE
      ) {
        await manager.increment(
          Product,
          { id: productId },
          'stockAvailable',
          1,
        );
      }

      // Audit log
      await this.auditLogService.log(
        adminId,
        'inventory:status-change',
        `product:${productId}/item:${itemId}`,
        { oldStatus, newStatus: dto.status },
        `Changed status from ${oldStatus} to ${dto.status}${dto.reason !== undefined && dto.reason !== '' ? `: ${dto.reason}` : ''}`,
      );

      return this.toResponseDto(saved);
    });
  }

  /**
   * Delete an inventory item (only if available)
   */
  async deleteItem(
    productId: string,
    itemId: string,
    adminId: string,
  ): Promise<void> {
    const item = await this.inventoryRepo.findOne({
      where: { id: itemId, productId },
    });

    if (item === null) {
      throw new NotFoundException('Inventory item not found');
    }

    if (item.status !== InventoryItemStatus.AVAILABLE) {
      throw new BadRequestException(
        `Cannot delete item with status "${item.status}". Only available items can be deleted.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(ProductInventory, item);

      // Update stock count
      await manager.decrement(Product, { id: productId }, 'stockAvailable', 1);
    });

    // Audit log
    await this.auditLogService.log(
      adminId,
      'inventory:delete',
      `product:${productId}/item:${itemId}`,
      { itemId },
      `Deleted inventory item (${item.maskedPreview})`,
    );
  }

  // ============================================
  // FULFILLMENT METHODS (Used by Fulfillment Service)
  // ============================================

  /**
   * Reserve an available item for an order (FIFO)
   */
  async reserveItem(
    productId: string,
    orderId: string,
  ): Promise<ProductInventory | null> {
    return this.dataSource.transaction(async (manager) => {
      // Use FIFO - get oldest available item
      const item = await manager
        .createQueryBuilder(ProductInventory, 'item')
        .where('item.productId = :productId', { productId })
        .andWhere('item.status = :status', {
          status: InventoryItemStatus.AVAILABLE,
        })
        .andWhere(
          '(item.expiresAt IS NULL OR item.expiresAt > :now)',
          { now: new Date() },
        )
        .orderBy('item.uploadedAt', 'ASC')
        .setLock('pessimistic_write')
        .getOne();

      if (item === null) {
        return null;
      }

      // Reserve the item
      item.status = InventoryItemStatus.RESERVED;
      item.reservedForOrderId = orderId;
      item.reservedAt = new Date();

      await manager.save(ProductInventory, item);

      // Update stock counts
      await manager.decrement(Product, { id: productId }, 'stockAvailable', 1);
      await manager.increment(Product, { id: productId }, 'stockReserved', 1);

      return item;
    });
  }

  /**
   * Mark reserved item as sold
   */
  async markAsSold(
    itemId: string,
    orderId: string,
    soldPrice: string,
  ): Promise<ProductInventory> {
    const item = await this.inventoryRepo.findOne({
      where: { id: itemId },
    });

    if (item === null) {
      throw new NotFoundException('Inventory item not found');
    }

    if (item.status !== InventoryItemStatus.RESERVED) {
      throw new BadRequestException(
        `Cannot mark item as sold - status is "${item.status}", expected "reserved"`,
      );
    }

    if (item.reservedForOrderId !== orderId) {
      throw new BadRequestException(
        'Item is reserved for a different order',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      item.status = InventoryItemStatus.SOLD;
      item.soldToOrderId = orderId;
      item.soldAt = new Date();
      item.soldPrice = soldPrice;

      await manager.save(ProductInventory, item);

      // Update stock counts
      await manager.decrement(
        Product,
        { id: item.productId },
        'stockReserved',
        1,
      );
      await manager.increment(Product, { id: item.productId }, 'stockSold', 1);

      return item;
    });
  }

  /**
   * Release a reserved item back to available
   */
  async releaseReservation(itemId: string): Promise<ProductInventory> {
    const item = await this.inventoryRepo.findOne({
      where: { id: itemId },
    });

    if (item === null) {
      throw new NotFoundException('Inventory item not found');
    }

    if (item.status !== InventoryItemStatus.RESERVED) {
      throw new BadRequestException(
        `Cannot release item - status is "${item.status}", expected "reserved"`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      item.status = InventoryItemStatus.AVAILABLE;
      item.reservedForOrderId = undefined;
      item.reservedAt = undefined;

      await manager.save(ProductInventory, item);

      // Update stock counts
      await manager.decrement(
        Product,
        { id: item.productId },
        'stockReserved',
        1,
      );
      await manager.increment(
        Product,
        { id: item.productId },
        'stockAvailable',
        1,
      );

      return item;
    });
  }

  /**
   * Get decrypted item data for delivery
   */
  async getItemDataForDelivery(itemId: string): Promise<{
    item: ProductInventory;
    data: ItemData;
  }> {
    const item = await this.inventoryRepo.findOne({
      where: { id: itemId },
    });

    if (item === null) {
      throw new NotFoundException('Inventory item not found');
    }

    const data = this.decryptItemData(
      item.itemDataEncrypted,
      item.encryptionIv,
      item.authTag,
    );

    return { item, data };
  }

  /**
   * Get items by order ID
   */
  async getItemsByOrderId(orderId: string): Promise<ProductInventory[]> {
    return this.inventoryRepo.find({
      where: [
        { soldToOrderId: orderId },
        { reservedForOrderId: orderId },
      ],
    });
  }

  // ============================================
  // STOCK MANAGEMENT
  // ============================================

  /**
   * Get products with low stock
   */
  async getProductsWithLowStock(): Promise<
    Array<{
      productId: string;
      productTitle: string;
      available: number;
      threshold: number;
    }>
  > {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.title',
        'p.stockAvailable',
        'p.lowStockThreshold',
      ])
      .where('p.sourceType = :sourceType', { sourceType: 'custom' })
      .andWhere('p.stockAvailable <= p.lowStockThreshold')
      .andWhere('p.lowStockThreshold > 0')
      .getMany();

    return products.map((p) => ({
      productId: p.id,
      productTitle: p.title,
      available: p.stockAvailable ?? 0,
      threshold: p.lowStockThreshold ?? 0,
    }));
  }

  /**
   * Expire items that have passed their expiration date
   */
  async expireItems(): Promise<number> {
    const result = await this.dataSource.transaction(async (manager) => {
      // Find items to expire
      const items = await manager.find(ProductInventory, {
        where: {
          status: InventoryItemStatus.AVAILABLE,
        },
      });

      const now = new Date();
      const toExpire = items.filter(
        (item) => item.expiresAt !== null && item.expiresAt !== undefined && item.expiresAt < now,
      );

      if (toExpire.length === 0) {
        return 0;
      }

      // Group by product for stock update
      const productCounts = new Map<string, number>();
      for (const item of toExpire) {
        const current = productCounts.get(item.productId) ?? 0;
        productCounts.set(item.productId, current + 1);
      }

      // Update items
      await manager.update(
        ProductInventory,
        { id: In(toExpire.map((i) => i.id)) },
        { status: InventoryItemStatus.EXPIRED },
      );

      // Update product stock counts
      for (const [productId, count] of productCounts) {
        await manager.decrement(
          Product,
          { id: productId },
          'stockAvailable',
          count,
        );
      }

      return toExpire.length;
    });

    return result;
  }

  /**
   * Release expired reservations
   */
  async releaseExpiredReservations(maxAgeMinutes: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const reservedItems = await this.inventoryRepo.find({
      where: {
        status: InventoryItemStatus.RESERVED,
      },
    });

    const toRelease = reservedItems.filter(
      (item) => item.reservedAt !== null && item.reservedAt !== undefined && item.reservedAt < cutoff,
    );

    for (const item of toRelease) {
      await this.releaseReservation(item.id);
    }

    return toRelease.length;
  }

  // ============================================
  // HELPERS
  // ============================================

  private toResponseDto(item: ProductInventory): InventoryItemResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      deliveryType: item.deliveryType,
      maskedPreview: item.maskedPreview,
      status: item.status,
      expiresAt: item.expiresAt ?? undefined,
      supplier: item.supplier ?? undefined,
      cost: item.cost !== null && item.cost !== undefined ? parseFloat(item.cost) : undefined,
      notes: item.notes ?? undefined,
      uploadedAt: item.uploadedAt,
      uploadedById: item.uploadedById,
      soldAt: item.soldAt ?? undefined,
      soldPrice: item.soldPrice !== null && item.soldPrice !== undefined ? parseFloat(item.soldPrice) : undefined,
      soldToOrderId: item.soldToOrderId ?? undefined,
      wasReported: item.wasReported,
    };
  }
}
