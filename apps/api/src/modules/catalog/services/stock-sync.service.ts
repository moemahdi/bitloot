/**
 * Stock Sync Service
 *
 * Handles scheduled tasks for inventory management:
 * - Expire items past their expiresAt date
 * - Release stale reservations (>30 min without completion)
 * - Monitor low stock and trigger alerts/auto-unpublish
 * - Update stock counts on products
 *
 * @module CatalogModule
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Not } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductInventory } from '../entities/product-inventory.entity';
import { InventoryItemStatus } from '../types/product-delivery.types';
import { AuditLogService } from '../../audit/audit-log.service';

/**
 * Low stock alert notification payload
 */
interface LowStockAlert {
  productId: string;
  productTitle: string;
  slug: string;
  available: number;
  threshold: number;
  autoUnpublish: boolean;
}

@Injectable()
export class StockSyncService {
  private readonly logger = new Logger(StockSyncService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductInventory)
    private readonly inventoryRepo: Repository<ProductInventory>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ============================================
  // CRON JOBS
  // ============================================

  /**
   * Expire items past their expiresAt date
   * Runs every hour at minute 5
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runExpirationJob(): Promise<void> {
    this.logger.log('🕐 Running item expiration job...');

    try {
      const result = await this.expireItems();
      if (result.expiredCount > 0) {
        this.logger.log(
          `✅ Expired ${result.expiredCount} items across ${result.productsAffected} products`,
        );
      } else {
        this.logger.debug('No items to expire');
      }
    } catch (error) {
      this.logger.error('❌ Item expiration job failed:', error);
    }
  }

  /**
   * Release stale reservations that haven't been fulfilled
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async runReservationCleanup(): Promise<void> {
    this.logger.log('🕐 Running reservation cleanup job...');

    try {
      const result = await this.releaseStaleReservations();
      if (result.releasedCount > 0) {
        this.logger.log(
          `✅ Released ${result.releasedCount} stale reservations across ${result.productsAffected} products`,
        );
      } else {
        this.logger.debug('No stale reservations to release');
      }
    } catch (error) {
      this.logger.error('❌ Reservation cleanup job failed:', error);
    }
  }

  /**
   * Check for low stock products and trigger alerts
   * Runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async runLowStockCheck(): Promise<void> {
    this.logger.log('🕐 Running low stock check...');

    try {
      const alerts = await this.checkLowStock();
      if (alerts.length > 0) {
        this.logger.warn(`⚠️ Found ${alerts.length} products with low stock`);
        // Log alerts for now - can integrate with notification system later
        for (const alert of alerts) {
          this.logger.warn(
            `  📦 ${alert.productTitle} (${alert.slug}): ${alert.available}/${alert.threshold} available`,
          );
        }
      } else {
        this.logger.debug('All products have sufficient stock');
      }
    } catch (error) {
      this.logger.error('❌ Low stock check failed:', error);
    }
  }

  /**
   * Sync stock counts on products table
   * Runs every 15 minutes to ensure consistency
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async runStockCountSync(): Promise<void> {
    this.logger.log('🕐 Running stock count sync...');

    try {
      const result = await this.syncStockCounts();
      if (result.updatedCount > 0) {
        this.logger.log(`✅ Synced stock counts for ${result.updatedCount} products`);
      } else {
        this.logger.debug('All stock counts are in sync');
      }
    } catch (error) {
      this.logger.error('❌ Stock count sync failed:', error);
    }
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Expire items past their expiresAt date
   */
  async expireItems(): Promise<{ expiredCount: number; productsAffected: number }> {
    const now = new Date();

    // Find all available items that have expired
    const expiredItems = await this.inventoryRepo.find({
      where: {
        status: InventoryItemStatus.AVAILABLE,
        expiresAt: LessThan(now),
      },
      relations: ['product'],
    });

    if (expiredItems.length === 0) {
      return { expiredCount: 0, productsAffected: 0 };
    }

    // Group by product for efficient updates
    const productIds = new Set<string>();
    for (const item of expiredItems) {
      productIds.add(item.productId);
    }

    // Mark items as expired
    await this.inventoryRepo.update(
      {
        id: In(expiredItems.map((i) => i.id)),
      },
      {
        status: InventoryItemStatus.EXPIRED,
      },
    );

    // Update stock counts for affected products
    await this.updateStockCountsForProducts(Array.from(productIds));

    // Audit log
    await this.auditLogService.log(
      'system',
      'inventory_items_expired',
      'product_inventory',
      {
        expiredCount: expiredItems.length,
        productIds: Array.from(productIds),
      },
      `Expired ${expiredItems.length} items across ${productIds.size} products (cron job)`,
    );

    return {
      expiredCount: expiredItems.length,
      productsAffected: productIds.size,
    };
  }

  /**
   * Release reservations older than 30 minutes
   */
  async releaseStaleReservations(
    maxAgeMinutes = 30,
  ): Promise<{ releasedCount: number; productsAffected: number }> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    // Find stale reservations
    const staleReservations = await this.inventoryRepo.find({
      where: {
        status: InventoryItemStatus.RESERVED,
        reservedAt: LessThan(cutoffTime),
      },
    });

    if (staleReservations.length === 0) {
      return { releasedCount: 0, productsAffected: 0 };
    }

    // Group by product
    const productIds = new Set<string>();
    for (const item of staleReservations) {
      productIds.add(item.productId);
    }

    // Release reservations
    await this.inventoryRepo.update(
      {
        id: In(staleReservations.map((i) => i.id)),
      },
      {
        status: InventoryItemStatus.AVAILABLE,
        reservedAt: undefined,
        reservedForOrderId: undefined,
      },
    );

    // Update stock counts
    await this.updateStockCountsForProducts(Array.from(productIds));

    // Audit log
    await this.auditLogService.log(
      'system',
      'inventory_reservations_released',
      'product_inventory',
      {
        releasedCount: staleReservations.length,
        productIds: Array.from(productIds),
        maxAgeMinutes,
      },
      `Released ${staleReservations.length} stale reservations (>${maxAgeMinutes}min) across ${productIds.size} products`,
    );

    return {
      releasedCount: staleReservations.length,
      productsAffected: productIds.size,
    };
  }

  /**
   * Check for products with low stock
   */
  async checkLowStock(): Promise<LowStockAlert[]> {
    // Find custom products with low stock threshold set
    const products = await this.productRepo.find({
      where: {
        sourceType: 'custom',
        lowStockThreshold: Not(0), // Has threshold configured
      },
      select: [
        'id',
        'title',
        'slug',
        'stockAvailable',
        'lowStockThreshold',
        'autoUnpublishWhenOutOfStock',
        'isPublished',
      ],
    });

    const alerts: LowStockAlert[] = [];

    for (const product of products) {
      const threshold = product.lowStockThreshold ?? 0;
      const available = product.stockAvailable ?? 0;

      if (available <= threshold) {
        alerts.push({
          productId: product.id,
          productTitle: product.title,
          slug: product.slug,
          available,
          threshold,
          autoUnpublish: product.autoUnpublishWhenOutOfStock ?? false,
        });

        // Auto-unpublish if enabled and out of stock
        if (product.autoUnpublishWhenOutOfStock && available === 0 && product.isPublished) {
          await this.productRepo.update(product.id, { isPublished: false });

          await this.auditLogService.log(
            'system',
            'product_auto_unpublished',
            `product:${product.id}`,
            {
              productId: product.id,
              slug: product.slug,
              previousStock: available,
            },
            `Auto-unpublished ${product.title} due to zero stock`,
          );

          this.logger.warn(`🔴 Auto-unpublished ${product.title} (${product.slug}) - out of stock`);
        }
      }
    }

    return alerts;
  }

  /**
   * Sync stock counts on products table with actual inventory
   * This ensures consistency if counts get out of sync
   */
  async syncStockCounts(): Promise<{ updatedCount: number }> {
    // Get actual counts from inventory
    const stockCounts = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.productId', 'productId')
      .addSelect(
        `SUM(CASE WHEN inv.status = '${InventoryItemStatus.AVAILABLE}' THEN 1 ELSE 0 END)`,
        'available',
      )
      .addSelect(
        `SUM(CASE WHEN inv.status = '${InventoryItemStatus.RESERVED}' THEN 1 ELSE 0 END)`,
        'reserved',
      )
      .addSelect(
        `SUM(CASE WHEN inv.status = '${InventoryItemStatus.SOLD}' THEN 1 ELSE 0 END)`,
        'sold',
      )
      .groupBy('inv.productId')
      .getRawMany<{
        productId: string;
        available: string;
        reserved: string;
        sold: string;
      }>();

    let updatedCount = 0;

    for (const count of stockCounts) {
      const parsedAvailable = parseInt(count.available, 10);
      const parsedReserved = parseInt(count.reserved, 10);
      const parsedSold = parseInt(count.sold, 10);
      const available = Number.isNaN(parsedAvailable) ? 0 : parsedAvailable;
      const reserved = Number.isNaN(parsedReserved) ? 0 : parsedReserved;
      const sold = Number.isNaN(parsedSold) ? 0 : parsedSold;

      // Get current product values
      const product = await this.productRepo.findOne({
        where: { id: count.productId },
        select: ['id', 'stockAvailable', 'stockReserved', 'stockSold'],
      });

      if (product === null) continue;

      // Check if update needed
      if (
        product.stockAvailable !== available ||
        product.stockReserved !== reserved ||
        product.stockSold !== sold
      ) {
        await this.productRepo.update(count.productId, {
          stockAvailable: available,
          stockReserved: reserved,
          stockSold: sold,
        });
        updatedCount++;

        this.logger.debug(
          `Synced stock for product ${count.productId}: available=${available}, reserved=${reserved}, sold=${sold}`,
        );
      }
    }

    // Also check for products with inventory but zero in product table
    const customProducts = await this.productRepo.find({
      where: { sourceType: 'custom' },
      select: ['id', 'stockAvailable', 'stockReserved', 'stockSold'],
    });

    const productIdsWithInventory = new Set(stockCounts.map((c) => c.productId));

    for (const product of customProducts) {
      if (!productIdsWithInventory.has(product.id)) {
        // Product has no inventory items but might have non-zero counts
        if (
          (product.stockAvailable ?? 0) !== 0 ||
          (product.stockReserved ?? 0) !== 0 ||
          (product.stockSold ?? 0) !== 0
        ) {
          await this.productRepo.update(product.id, {
            stockAvailable: 0,
            stockReserved: 0,
            stockSold: 0,
          });
          updatedCount++;
        }
      }
    }

    return { updatedCount };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Update stock counts for specific products
   */
  private async updateStockCountsForProducts(productIds: string[]): Promise<void> {
    for (const productId of productIds) {
      const counts = await this.inventoryRepo
        .createQueryBuilder('inv')
        .select(
          `SUM(CASE WHEN inv.status = '${InventoryItemStatus.AVAILABLE}' THEN 1 ELSE 0 END)`,
          'available',
        )
        .addSelect(
          `SUM(CASE WHEN inv.status = '${InventoryItemStatus.RESERVED}' THEN 1 ELSE 0 END)`,
          'reserved',
        )
        .addSelect(
          `SUM(CASE WHEN inv.status = '${InventoryItemStatus.SOLD}' THEN 1 ELSE 0 END)`,
          'sold',
        )
        .where('inv.productId = :productId', { productId })
        .getRawOne<{ available: string; reserved: string; sold: string }>();

      if (counts !== undefined && counts !== null) {
        const parsedAvailable = parseInt(counts.available, 10);
        const parsedReserved = parseInt(counts.reserved, 10);
        const parsedSold = parseInt(counts.sold, 10);
        await this.productRepo.update(productId, {
          stockAvailable: Number.isNaN(parsedAvailable) ? 0 : parsedAvailable,
          stockReserved: Number.isNaN(parsedReserved) ? 0 : parsedReserved,
          stockSold: Number.isNaN(parsedSold) ? 0 : parsedSold,
        });
      }
    }
  }

  /**
   * Get overall inventory statistics
   */
  async getGlobalStats(): Promise<{
    totalProducts: number;
    totalItems: number;
    availableItems: number;
    reservedItems: number;
    soldItems: number;
    expiredItems: number;
    invalidItems: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  }> {
    // Count by status
    const statusCounts = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inv.status')
      .getRawMany<{ status: InventoryItemStatus; count: string }>();

    const countsByStatus = statusCounts.reduce(
      (acc, row) => {
        const parsedCount = parseInt(row.count, 10);
        acc[row.status] = Number.isNaN(parsedCount) ? 0 : parsedCount;
        return acc;
      },
      {} as Record<InventoryItemStatus, number>,
    );

    // Count products
    const productStats = await this.productRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN p."stockAvailable" <= p."lowStockThreshold" AND p."lowStockThreshold" > 0 THEN 1 ELSE 0 END)`,
        'lowStock',
      )
      .addSelect(
        `SUM(CASE WHEN p."stockAvailable" = 0 AND p."sourceType" = 'custom' THEN 1 ELSE 0 END)`,
        'outOfStock',
      )
      .where("p.sourceType = 'custom'")
      .getRawOne<{ total: string; lowStock: string; outOfStock: string }>();

    return {
      totalProducts: parseInt(productStats?.total ?? '0', 10),
      totalItems:
        (countsByStatus[InventoryItemStatus.AVAILABLE] ?? 0) +
        (countsByStatus[InventoryItemStatus.RESERVED] ?? 0) +
        (countsByStatus[InventoryItemStatus.SOLD] ?? 0) +
        (countsByStatus[InventoryItemStatus.EXPIRED] ?? 0) +
        (countsByStatus[InventoryItemStatus.INVALID] ?? 0),
      availableItems: countsByStatus[InventoryItemStatus.AVAILABLE] ?? 0,
      reservedItems: countsByStatus[InventoryItemStatus.RESERVED] ?? 0,
      soldItems: countsByStatus[InventoryItemStatus.SOLD] ?? 0,
      expiredItems: countsByStatus[InventoryItemStatus.EXPIRED] ?? 0,
      invalidItems: countsByStatus[InventoryItemStatus.INVALID] ?? 0,
      lowStockProducts: parseInt(productStats?.lowStock ?? '0', 10),
      outOfStockProducts: parseInt(productStats?.outOfStock ?? '0', 10),
    };
  }

  /**
   * Manual trigger for all sync jobs (for admin use)
   */
  async runAllSyncJobs(): Promise<{
    expiration: { expiredCount: number; productsAffected: number };
    reservations: { releasedCount: number; productsAffected: number };
    lowStock: LowStockAlert[];
    stockSync: { updatedCount: number };
  }> {
    this.logger.log('🔄 Running all sync jobs manually...');

    const expiration = await this.expireItems();
    const reservations = await this.releaseStaleReservations();
    const lowStock = await this.checkLowStock();
    const stockSync = await this.syncStockCounts();

    // Audit log
    await this.auditLogService.log(
      'system',
      'inventory_full_sync',
      'product_inventory',
      {
        expiration,
        reservations,
        lowStockCount: lowStock.length,
        stockSync,
      },
      'Manual full inventory sync triggered',
    );

    return { expiration, reservations, lowStock, stockSync };
  }
}
