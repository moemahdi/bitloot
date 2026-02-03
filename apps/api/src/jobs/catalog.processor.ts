import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { CatalogService } from '../modules/catalog/catalog.service';
import { CatalogCacheService } from '../modules/catalog/catalog-cache.service';
import { KinguinCatalogClient } from '../modules/catalog/kinguin-catalog.client';

export enum CatalogJobType {
  SYNC_FULL = 'catalog.sync.full',
  SYNC_PAGE = 'catalog.sync.page',
  SYNC_SINGLE_PRODUCT = 'sync-single-product',
  SYNC_IMPORTED = 'catalog.sync.imported', // Only sync existing imported Kinguin products
  REPRICE = 'catalog.reprice',
}

export interface CatalogSyncFullJobData {
  maxPages?: number;
  startPage?: number;
}

export interface CatalogSyncPageJobData {
  page: number;
  pageSize?: number;
}

export interface CatalogRepriceJobData {
  productIds: string[];
}

/**
 * Job data for sync-imported job
 * Refreshes only products already imported from Kinguin (sourceType = 'kinguin')
 */
export interface CatalogSyncImportedJobData {
  // Optional: limit how many products to sync at once (for batching)
  batchSize?: number;
}

/**
 * Job data for sync-single-product webhook job
 * Sent by Kinguin when a product's stock/price changes
 */
export interface SyncSingleProductJobData {
  kinguinId: string;
  productId?: string;
  qty: number;
  textQty: number;
  cheapestOfferId?: string;
  updatedAt: string;
  source: 'webhook';
}

/**
 * Details about a product that was skipped during sync
 */
export interface SkippedProductInfo {
  id: string;
  title: string;
  externalId: string;
  reason: string;
}

/**
 * Details about a product that was updated during sync
 */
export interface UpdatedProductInfo {
  id: string;
  title: string;
  externalId: string;
  priceChange?: {
    oldPrice: number;
    newPrice: number;
  };
}

/**
 * Result returned from sync jobs for BullMQ to store
 * This is accessible via job.returnvalue and displayed in the admin UI
 */
export interface CatalogSyncResult {
  productsProcessed: number;
  productsUpdated: number;
  productsCreated: number;
  productsSkipped: number;
  errors: string[];
  /** Detailed info about each skipped product */
  skippedProducts?: SkippedProductInfo[];
  /** Detailed info about each updated product */
  updatedProducts?: UpdatedProductInfo[];
}

/**
 * BullMQ processor for asynchronous catalog operations
 * Handles product sync from Kinguin and batch repricing
 * 
 * IMPORTANT: This processor clears any stale sync jobs on startup to prevent
 * automatic syncing when the server restarts. Catalog sync should only be
 * triggered explicitly via admin endpoints.
 */
@Processor('catalog')
export class CatalogProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(CatalogProcessor.name);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly cacheService: CatalogCacheService,
    private readonly kinguinClient: KinguinCatalogClient,
    @InjectQueue('catalog') private readonly catalogQueue: Queue,
  ) {
    super();
  }

  /**
   * Clear any stale catalog sync jobs on server startup.
   * This prevents automatic syncing when the server restarts.
   * Catalog sync should only be triggered by admin via POST /admin/catalog/sync
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('🔄 Checking for stale catalog sync jobs...');
      
      // Get all waiting/delayed jobs in the catalog queue
      const waitingJobs = await this.catalogQueue.getJobs(['waiting', 'delayed']);
      
      // Filter for sync-related jobs only (not reprice or single-product jobs which may be intentional)
      // Use string literals since job.name is a string type
      const syncJobNames = [
        CatalogJobType.SYNC_FULL as string,
        CatalogJobType.SYNC_PAGE as string,
        CatalogJobType.SYNC_IMPORTED as string,
      ];
      const staleSyncJobs = waitingJobs.filter(job => syncJobNames.includes(job.name));
      
      if (staleSyncJobs.length > 0) {
        this.logger.warn(`⚠️ Found ${staleSyncJobs.length} stale sync jobs from previous server run`);
        
        // Remove stale sync jobs
        for (const job of staleSyncJobs) {
          await job.remove();
          this.logger.debug(`🗑️ Removed stale job ${job.id}: ${job.name}`);
        }
        
        this.logger.log(`✅ Cleared ${staleSyncJobs.length} stale sync jobs. Catalog sync will only run when triggered by admin.`);
      } else {
        this.logger.log('✅ No stale sync jobs found. Ready to process admin-triggered syncs.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to clear stale jobs: ${errorMsg}`);
      // Don't throw - allow server to start even if cleanup fails
    }
  }

  /**
   * Main job handler - routes to specific job types
   * Returns result data for sync jobs so BullMQ stores it in job.returnvalue
   */
  async process(job: Job): Promise<CatalogSyncResult | void> {
    try {
      this.logger.debug(`Processing job ${job.id}: ${job.name}`);

      const jobType = job.name as CatalogJobType;

      switch (jobType) {
        case CatalogJobType.SYNC_FULL:
          return await this.handleFullSync(job as Job<CatalogSyncFullJobData>);

        case CatalogJobType.SYNC_PAGE:
          await this.handlePageSync(job as Job<CatalogSyncPageJobData>);
          break;

        case CatalogJobType.SYNC_IMPORTED:
          return await this.handleSyncImported(job as Job<CatalogSyncImportedJobData>);

        case CatalogJobType.SYNC_SINGLE_PRODUCT:
          await this.handleSyncSingleProduct(job as Job<SyncSingleProductJobData>);
          break;

        case CatalogJobType.REPRICE:
          await this.handleReprice(job as Job<CatalogRepriceJobData>);
          break;

        default: {
          const _exhaustive: never = jobType;
          return _exhaustive; // Ensure all cases handled
        }
      }

      this.logger.log(`✅ Job ${job.id} completed: ${job.name}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Job ${job.id} failed: ${errorMsg}`);
      
      // Check if this is a configuration error that shouldn't be retried
      if (this.isNonRetryableError(error)) {
        this.logger.error(`🚫 Non-retryable error detected. Failing job permanently: ${errorMsg}`);
        // Don't throw - this prevents BullMQ from retrying
        return;
      }
      
      throw error; // BullMQ will retry based on strategy
    }
  }

  /**
   * Handle full Kinguin sync with automatic pagination
   * Processes all offers page by page, upserting each one
   * Returns result stats that are stored in BullMQ job.returnvalue for UI display
   */
  private async handleFullSync(job: Job<CatalogSyncFullJobData>): Promise<CatalogSyncResult> {
    const { maxPages, startPage = 1 } = job.data;
    let processedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    const maxPagesDisplay = maxPages ?? 'unlimited';
    this.logger.log(
      `🔄 Starting full catalog sync (maxPages: ${maxPagesDisplay}, startPage: ${startPage})`,
    );

    try {
      // Use async generator for pagination - now fetching products instead of offers
      for await (const product of this.kinguinClient.fetchAllProducts(maxPages)) {
        try {
          await this.catalogService.upsertProduct(product);
          processedCount++;
          createdCount++; // Full sync creates/updates all products

          // Update job progress every 25 products with detailed stats
          if (processedCount % 25 === 0) {
            const progress = Math.round((processedCount / 1000) * 100); // Estimate 1000 total
            await job.updateProgress({
              percent: Math.min(progress, 99),
              current: processedCount,
              total: 1000, // Estimate
              updated: createdCount,
              skipped: 0,
              errors: errors.length,
            });
            this.logger.debug(`📊 Sync progress: ${processedCount} products processed`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Product ${product.productId}: ${errorMsg}`);
          this.logger.warn(
            `⚠️ Failed to upsert product ${product.productId}: ${errorMsg}`,
          );
          // Continue processing other products on error
        }
      }

      const result: CatalogSyncResult = {
        productsProcessed: processedCount,
        productsUpdated: createdCount,
        productsCreated: createdCount,
        productsSkipped: 0,
        errors,
      };

      this.logger.log(
        `✅ Full sync completed: ${processedCount} processed, ${errors.length} errors`,
      );
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Full sync failed after ${processedCount} products: ${errorMsg}`);
      throw new Error(`Full sync failed: ${errorMsg}`);
    }
  }

  /**
   * Handle single page sync from Kinguin
   * Useful for incremental updates or manual page processing
   */
  private async handlePageSync(job: Job<CatalogSyncPageJobData>): Promise<void> {
    const { page, pageSize = 100 } = job.data;
    let processedCount = 0;
    let errorCount = 0;

    this.logger.log(`🔄 Starting page sync: page ${page} (size: ${pageSize})`);

    try {
      const response = await this.kinguinClient.fetchPage(page, pageSize);
      this.logger.debug(`📥 Fetched ${response.results.length} products from page ${page}`);

      for (const product of response.results) {
        try {
          await this.catalogService.upsertProduct(product);
          processedCount++;
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `⚠️ Failed to upsert product ${product.productId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(`✅ Page sync completed: ${processedCount} processed, ${errorCount} errors`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Page sync failed: ${errorMsg}`);
      throw new Error(`Page sync failed: ${errorMsg}`);
    }
  }

  /**
   * Handle sync-single-product job from Kinguin product.update webhook
   * Updates stock/price for a single product based on webhook data
   */
  private async handleSyncSingleProduct(job: Job<SyncSingleProductJobData>): Promise<void> {
    const { kinguinId, productId, qty, textQty, cheapestOfferId, updatedAt } = job.data;

    this.logger.log(
      `🔄 Processing single product sync: kinguinId=${kinguinId}, qty=${qty}, textQty=${textQty}`,
    );

    try {
      // Fetch latest product data from Kinguin API using the kinguinId
      const product = await this.kinguinClient.getProduct(kinguinId);

      if (product === null || product === undefined) {
        this.logger.warn(
          `⚠️ Product not found in Kinguin API: kinguinId=${kinguinId}, updating stock only`,
        );
        
        // Even if product not found, try to update stock in our database
        if (productId !== undefined && productId !== '') {
          await this.catalogService.updateProductStockByKinguinId(kinguinId, qty, textQty);
          this.logger.log(`✅ Updated stock for kinguinId=${kinguinId}`);
        }
        return;
      }

      // Upsert with latest data from Kinguin
      const upsertedProduct = await this.catalogService.upsertProduct(product);
      
      // Invalidate cache for updated product
      if (upsertedProduct !== null && upsertedProduct !== undefined) {
        await this.cacheService.invalidateProduct(upsertedProduct.slug);
        // Also invalidate featured if product is featured
        if (upsertedProduct.isFeatured) {
          await this.cacheService.invalidateFeaturedProducts();
          await this.cacheService.invalidateSectionProducts();
        }
      }

      this.logger.log(
        `✅ Single product sync completed: kinguinId=${kinguinId}, cheapestOfferId=${cheapestOfferId ?? 'N/A'}, updatedAt=${updatedAt}`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Single product sync failed for kinguinId=${kinguinId}: ${errorMsg}`);
      throw new Error(`Single product sync failed: ${errorMsg}`);
    }
  }

  /**
   * Handle batch repricing operation
   * Recomputes prices for a subset of products based on current rules
   */
  private async handleReprice(job: Job<CatalogRepriceJobData>): Promise<void> {
    const { productIds } = job.data;

    // Type guard: ensure productIds exists and is an array
    if (!Array.isArray(productIds) || productIds.length === 0) {
      this.logger.warn('Reprice job called with empty or invalid productIds');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    this.logger.log(`💰 Starting batch reprice: ${productIds.length} products`);

    try {
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        
        // Runtime check - ensure productId is a valid string
        if (typeof productId !== 'string' || productId.length === 0) {
          this.logger.warn(`Skipping invalid productId at index ${i}: ${productId}`);
          continue;
        }

        try {
          await this.catalogService.repriceProduct(productId);
          successCount++;

          // Update progress every 10 products
          if ((i + 1) % 10 === 0) {
            const progress = Math.round(((i + 1) / productIds.length) * 100);
            // @ts-expect-error BullMQ Job type includes JobProgress interface which is not directly callable
            await job.progress(progress);
            this.logger.debug(`📊 Reprice progress: ${i + 1}/${productIds.length}`);
          }
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `⚠️ Failed to reprice product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Continue repricing other products on error
        }
      }

      this.logger.log(`✅ Batch reprice completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Batch reprice failed: ${errorMsg}`);
      throw new Error(`Batch reprice failed: ${errorMsg}`);
    }
  }

  /**
   * Sync only already-imported Kinguin products (no new imports)
   * This refreshes prices, stock, and metadata for products already in the catalog
   * Returns result stats that are stored in BullMQ job.returnvalue for UI display
   */
  private async handleSyncImported(job: Job<CatalogSyncImportedJobData>): Promise<CatalogSyncResult> {
    const batchSize = job.data.batchSize ?? 50;
    const errors: string[] = [];
    const skippedProducts: SkippedProductInfo[] = [];
    const updatedProducts: UpdatedProductInfo[] = [];
    
    this.logger.log(`🔄 Starting sync of imported Kinguin products...`);

    try {
      // Get all imported Kinguin products from database
      const importedProducts = await this.catalogService.getImportedKinguinProducts();
      
      if (importedProducts.length === 0) {
        this.logger.log(`ℹ️ No imported Kinguin products to sync`);
        return {
          productsProcessed: 0,
          productsUpdated: 0,
          productsCreated: 0,
          productsSkipped: 0,
          errors: [],
          skippedProducts: [],
          updatedProducts: [],
        };
      }

      this.logger.log(`📦 Found ${importedProducts.length} imported Kinguin products to sync`);

      let updatedCount = 0;
      let skippedCount = 0;

      // Process in batches to avoid API rate limits
      for (let i = 0; i < importedProducts.length; i++) {
        const product = importedProducts[i];
        
        // Type guard for noUncheckedIndexedAccess
        if (product === undefined || product === null) {
          continue;
        }
        
        // Skip if no externalId (shouldn't happen for Kinguin products)
        if (product.externalId === undefined || product.externalId === null || product.externalId === '') {
          this.logger.warn(`⚠️ Product ${product.id} has no externalId, skipping`);
          skippedCount++;
          skippedProducts.push({
            id: product.id,
            title: product.title ?? 'Unknown',
            externalId: '',
            reason: 'No external ID - product was not properly linked to Kinguin',
          });
          errors.push(`Product ${product.id}: No external ID`);
          continue;
        }

        try {
          // Store old price for comparison
          const oldPrice = product.price;
          
          // Fetch latest data from Kinguin using V2 API (productId format)
          // externalId stores the Kinguin productId (string format like "5c9b5f6b2539a4e8f172916a")
          const kinguinProduct = await this.kinguinClient.getProductV2(product.externalId);
          
          if (kinguinProduct === undefined || kinguinProduct === null) {
            this.logger.warn(`⚠️ Product ${product.externalId} not found on Kinguin, skipping`);
            skippedCount++;
            skippedProducts.push({
              id: product.id,
              title: product.title ?? product.externalId,
              externalId: product.externalId,
              reason: 'Not found on Kinguin API - product may be out of stock or delisted',
            });
            continue;
          }

          // Update the product with fresh Kinguin data
          await this.catalogService.upsertProduct(kinguinProduct);
          updatedCount++;
          
          // Track updated product with price change info
          const newPrice = kinguinProduct.price ?? 0;
          const oldPriceNum = parseFloat(oldPrice);
          const priceChanged = !Number.isNaN(oldPriceNum) && oldPriceNum !== newPrice;
          updatedProducts.push({
            id: product.id,
            title: product.title ?? product.externalId,
            externalId: product.externalId,
            priceChange: priceChanged ? {
              oldPrice: oldPriceNum,
              newPrice: newPrice,
            } : undefined,
          });

          this.logger.debug(`✅ Synced product: ${product.title ?? product.externalId}`);

          // Update progress with intermediate stats every 5 products or at end
          if ((i + 1) % 5 === 0 || i === importedProducts.length - 1) {
            const progress = Math.round(((i + 1) / importedProducts.length) * 100);
            // Store intermediate results in job data for real-time display
            await job.updateProgress({
              percent: progress,
              current: i + 1,
              total: importedProducts.length,
              updated: updatedCount,
              skipped: skippedCount,
              errors: errors.length,
            });
            this.logger.debug(`📊 Sync progress: ${i + 1}/${importedProducts.length} (${updatedCount} updated, ${skippedCount} skipped)`);
          }

          // Rate limiting: small delay between API calls
          if ((i + 1) % batchSize === 0 && i < importedProducts.length - 1) {
            this.logger.debug(`⏳ Rate limit pause after ${batchSize} products...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          const productTitle = product.title ?? product.externalId;
          errors.push(`${productTitle}: ${errorMsg}`);
          this.logger.warn(`⚠️ Failed to sync product ${product.externalId}: ${errorMsg}`);
          // Continue syncing other products on error
        }
      }

      const result: CatalogSyncResult = {
        productsProcessed: importedProducts.length,
        productsUpdated: updatedCount,
        productsCreated: 0, // Imported sync doesn't create new products
        productsSkipped: skippedCount,
        errors,
        skippedProducts,
        updatedProducts,
      };

      // Invalidate all catalog caches after sync completes
      if (updatedCount > 0) {
        this.logger.log('🔄 Invalidating catalog caches after sync...');
        const invalidatedKeys = await this.cacheService.invalidateAll();
        this.logger.log(`✅ Invalidated ${invalidatedKeys} cache keys`);
      }

      this.logger.log(`✅ Sync completed: ${updatedCount} updated, ${errors.length} errors, ${skippedCount} skipped`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Sync imported products failed: ${errorMsg}`);
      throw new Error(`Sync imported products failed: ${errorMsg}`);
    }
  }

  /**
   * Check if error is a configuration error that shouldn't be retried
   * Returns true for HTTP 401, 403, 404, and configuration errors
   */
  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Kinguin configuration errors
      if (errorMessage.includes('kinguin integration not configured') ||
          errorMessage.includes('kinguin api key') ||
          errorMessage.includes('api key is not configured')) {
        return true;
      }
      
      // HTTP errors that indicate auth/access issues
      if (errorMessage.includes('status code 401') || // Unauthorized
          errorMessage.includes('status code 403') || // Forbidden
          errorMessage.includes('status code 404')) { // Not Found (bad endpoint/key)
        return true;
      }
    }
    
    return false;
  }
}
