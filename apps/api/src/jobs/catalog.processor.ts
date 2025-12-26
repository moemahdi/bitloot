import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { CatalogService } from '../modules/catalog/catalog.service';
import { KinguinCatalogClient } from '../modules/catalog/kinguin-catalog.client';

export enum CatalogJobType {
  SYNC_FULL = 'catalog.sync.full',
  SYNC_PAGE = 'catalog.sync.page',
  SYNC_SINGLE_PRODUCT = 'sync-single-product',
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
   */
  async process(job: Job): Promise<void> {
    try {
      this.logger.debug(`Processing job ${job.id}: ${job.name}`);

      const jobType = job.name as CatalogJobType;

      switch (jobType) {
        case CatalogJobType.SYNC_FULL:
          await this.handleFullSync(job as Job<CatalogSyncFullJobData>);
          break;

        case CatalogJobType.SYNC_PAGE:
          await this.handlePageSync(job as Job<CatalogSyncPageJobData>);
          break;

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
   */
  private async handleFullSync(job: Job<CatalogSyncFullJobData>): Promise<void> {
    const { maxPages, startPage = 1 } = job.data;
    let processedCount = 0;
    let errorCount = 0;

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

          // Update job progress every 50 products
          if (processedCount % 50 === 0) {
            const progress = Math.round((processedCount / 1000) * 100); // Estimate 1000 total
            // @ts-expect-error BullMQ Job type includes JobProgress interface which is not directly callable
            await job.progress(Math.min(progress, 100));
            this.logger.debug(`📊 Sync progress: ${processedCount} products processed`);
          }
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `⚠️ Failed to upsert product ${product.productId}: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Continue processing other products on error
        }
      }

      this.logger.log(
        `✅ Full sync completed: ${processedCount} processed, ${errorCount} errors`,
      );
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
      await this.catalogService.upsertProduct(product);

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
