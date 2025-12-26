import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CatalogService } from '../modules/catalog/catalog.service';
import { KinguinCatalogClient } from '../modules/catalog/kinguin-catalog.client';

export enum CatalogJobType {
  SYNC_FULL = 'catalog.sync.full',
  SYNC_PAGE = 'catalog.sync.page',
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
 * BullMQ processor for asynchronous catalog operations
 * Handles product sync from Kinguin and batch repricing
 */
@Processor('catalog')
export class CatalogProcessor extends WorkerHost {
  private readonly logger = new Logger(CatalogProcessor.name);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly kinguinClient: KinguinCatalogClient,
  ) {
    super();
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
      // Use async generator for pagination
      for await (const offer of this.kinguinClient.fetchAllOffers(maxPages)) {
        try {
          await this.catalogService.upsertProduct(offer);
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
            `⚠️ Failed to upsert offer ${offer.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Continue processing other offers on error
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
      this.logger.debug(`📥 Fetched ${response.offers.length} offers from page ${page}`);

      for (const offer of response.offers) {
        try {
          await this.catalogService.upsertProduct(offer);
          processedCount++;
        } catch (error) {
          errorCount++;
          this.logger.warn(
            `⚠️ Failed to upsert offer ${offer.id}: ${error instanceof Error ? error.message : String(error)}`,
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
