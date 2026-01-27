import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiProperty,
  ApiExtraModels,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { KinguinCatalogClient } from './kinguin-catalog.client';

// ============ DTOs ============

/**
 * Details about a product that was skipped during sync
 */
export class SkippedProductInfoDto {
  @ApiProperty({ description: 'Product ID in BitLoot database' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  title!: string;

  @ApiProperty({ description: 'Kinguin external product ID' })
  externalId!: string;

  @ApiProperty({ description: 'Reason why the product was skipped' })
  reason!: string;
}

/**
 * Details about a product that was updated during sync
 */
export class UpdatedProductInfoDto {
  @ApiProperty({ description: 'Product ID in BitLoot database' })
  id!: string;

  @ApiProperty({ description: 'Product title' })
  title!: string;

  @ApiProperty({ description: 'Kinguin external product ID' })
  externalId!: string;

  @ApiProperty({
    description: 'Price change details if price was updated',
    required: false,
    type: 'object',
    properties: {
      oldPrice: { type: 'number', description: 'Previous price' },
      newPrice: { type: 'number', description: 'New price after sync' },
    },
  })
  priceChange?: {
    oldPrice: number;
    newPrice: number;
  };
}

export class SyncJobResponseDto {
  @ApiProperty({ description: 'BullMQ job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Job status (e.g., queued, running, completed)' })
  status!: string;

  @ApiProperty({ description: 'Status message' })
  message!: string;
}

@ApiExtraModels(SkippedProductInfoDto, UpdatedProductInfoDto)
export class SyncJobStatusResponseDto {
  @ApiProperty({ description: 'BullMQ job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Job status (waiting, active, completed, failed)' })
  status!: string;

  @ApiProperty({ description: 'Progress percentage (0-100)', required: false })
  progress?: number;

  @ApiProperty({
    description: 'Detailed progress data with live stats',
    required: false,
    type: 'object',
    properties: {
      percent: { type: 'number', description: 'Progress percentage 0-100' },
      current: { type: 'number', description: 'Current product index' },
      total: { type: 'number', description: 'Total products to process' },
      updated: { type: 'number', description: 'Products updated so far' },
      skipped: { type: 'number', description: 'Products skipped so far' },
      errors: { type: 'number', description: 'Errors encountered so far' },
    },
  })
  progressData?: {
    percent?: number;
    current?: number;
    total?: number;
    updated?: number;
    skipped?: number;
    errors?: number;
  };

  @ApiProperty({
    description: 'Job result data (available after completion)',
    required: false,
    type: 'object',
    properties: {
      productsProcessed: { type: 'number' },
      productsCreated: { type: 'number' },
      productsUpdated: { type: 'number' },
      productsSkipped: { type: 'number' },
      errors: { type: 'array', items: { type: 'string' } },
      skippedProducts: { type: 'array', items: { $ref: '#/components/schemas/SkippedProductInfoDto' } },
      updatedProducts: { type: 'array', items: { $ref: '#/components/schemas/UpdatedProductInfoDto' } },
    },
  })
  result?: {
    productsProcessed?: number;
    productsCreated?: number;
    productsUpdated?: number;
    productsSkipped?: number;
    errors?: string[];
    skippedProducts?: SkippedProductInfoDto[];
    updatedProducts?: UpdatedProductInfoDto[];
  };

  @ApiProperty({ description: 'Failure reason if job failed', required: false })
  failedReason?: string;

  @ApiProperty({ description: 'Job creation timestamp', required: false })
  createdAt?: Date;

  @ApiProperty({ description: 'Processing start timestamp', required: false })
  processedOn?: Date;

  @ApiProperty({ description: 'Completion timestamp', required: false })
  finishedOn?: Date;
}

export class SyncConfigStatusDto {
  @ApiProperty({ description: 'Whether Kinguin API is properly configured' })
  configured!: boolean;

  @ApiProperty({ description: 'Configuration status message' })
  message!: string;
}

export class SyncHistoryResponseDto {
  @ApiProperty({ description: 'List of sync jobs', type: [SyncJobStatusResponseDto] })
  jobs!: SyncJobStatusResponseDto[];

  @ApiProperty({ description: 'Total count of jobs in history' })
  total!: number;
}

@ApiTags('Admin - Catalog Sync')
@ApiExtraModels(SkippedProductInfoDto, UpdatedProductInfoDto)
@Controller('admin/catalog/sync')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminSyncController {
  constructor(
    @InjectQueue('catalog') private readonly catalogQueue: Queue,
    private readonly kinguinClient: KinguinCatalogClient,
  ) {}

  /**
   * POST /admin/catalog/sync
   * Trigger a sync of already-imported Kinguin products (updates existing products only)
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Sync imported Kinguin products',
    description:
      'Updates all previously-imported Kinguin products with latest data from Kinguin API. Does NOT import new products.',
  })
  @ApiResponse({
    status: 202,
    description: 'Sync job enqueued successfully',
    type: SyncJobResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async triggerSync(): Promise<SyncJobResponseDto> {
    // Check if Kinguin integration is configured
    if (!this.kinguinClient.isConfigured()) {
      throw new BadRequestException(
        `Cannot start sync: ${this.kinguinClient.getConfigurationStatus()}`,
      );
    }

    const job = await this.catalogQueue.add(
      'catalog.sync.imported', // Sync only already-imported products
      {
        batchSize: 50,
        triggeredAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        // Keep completed jobs for 60 seconds so frontend can poll final status
        removeOnComplete: {
          age: 60, // seconds
          count: 100, // keep last 100 jobs
        },
        removeOnFail: {
          age: 300, // 5 minutes for failed jobs
          count: 50,
        },
      },
    );

    return {
      jobId: job.id ?? 'unknown',
      status: 'enqueued',
      message: 'Sync job enqueued - will update all imported Kinguin products',
    };
  }

  /**
   * GET /admin/catalog/sync/config
   * Check Kinguin integration configuration status
   */
  @Get('config')
  @ApiOperation({
    summary: 'Check Kinguin integration status',
    description: 'Verify if Kinguin API is properly configured and accessible',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration status',
    type: SyncConfigStatusDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getConfigStatus(): SyncConfigStatusDto {
    return {
      configured: this.kinguinClient.isConfigured(),
      message: this.kinguinClient.getConfigurationStatus(),
    };
  }

  /**
   * GET /admin/catalog/sync/status
   * Check status of a sync job
   */
  @Get('status')
  @ApiOperation({
    summary: 'Check sync job status',
    description: 'Get detailed status of a specific Kinguin sync job by ID',
  })
  @ApiQuery({
    name: 'jobId',
    required: true,
    description: 'The BullMQ job ID to check',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    type: SyncJobStatusResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'No job ID provided or invalid' })
  async getSyncStatus(
    @Query('jobId') jobId: string,
  ): Promise<SyncJobStatusResponseDto> {
    // Handle missing or empty job ID
    if (jobId === undefined || jobId === '' || jobId.trim() === '') {
      throw new BadRequestException(
        'No sync job is currently running. Please trigger a sync first.',
      );
    }

    const job = await this.catalogQueue.getJob(jobId);

    if (job === null || job === undefined) {
      throw new NotFoundException(`Sync job ${jobId} not found. It may have completed or been removed.`);
    }

    const state = await job.getState();
    
    // Progress can be a number (legacy) or an object with detailed stats
    const rawProgress = job.progress;
    let progressPercent: number | undefined;
    let progressData: SyncJobStatusResponseDto['progressData'];
    
    if (typeof rawProgress === 'number') {
      progressPercent = rawProgress;
    } else if (typeof rawProgress === 'object' && rawProgress !== null) {
      const pd = rawProgress as { percent?: number; current?: number; total?: number; updated?: number; skipped?: number; errors?: number };
      progressPercent = pd.percent;
      progressData = {
        percent: pd.percent,
        current: pd.current,
        total: pd.total,
        updated: pd.updated,
        skipped: pd.skipped,
        errors: pd.errors,
      };
    }

    return {
      jobId: job.id ?? 'unknown',
      status: state,
      progress: progressPercent,
      progressData,
      result: job.returnvalue as
        | {
            productsProcessed?: number;
            productsCreated?: number;
            productsUpdated?: number;
            productsSkipped?: number;
            errors?: string[];
            skippedProducts?: SkippedProductInfoDto[];
            updatedProducts?: UpdatedProductInfoDto[];
          }
        | undefined,
      failedReason: job.failedReason,
      createdAt:
        job.timestamp !== null &&
        job.timestamp !== undefined &&
        job.timestamp !== 0 &&
        !Number.isNaN(job.timestamp)
          ? new Date(job.timestamp)
          : undefined,
      processedOn:
        job.processedOn !== null &&
        job.processedOn !== undefined &&
        job.processedOn !== 0 &&
        !Number.isNaN(job.processedOn)
          ? new Date(job.processedOn)
          : undefined,
      finishedOn:
        job.finishedOn !== null &&
        job.finishedOn !== undefined &&
        job.finishedOn !== 0 &&
        !Number.isNaN(job.finishedOn)
          ? new Date(job.finishedOn)
          : undefined,
    };
  }

  /**
   * GET /admin/catalog/sync/history
   * Get history of sync jobs
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get sync job history',
    description: 'Retrieve the history of completed and failed sync jobs',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of jobs to return (default: 10, max: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync history retrieved',
    type: SyncHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getSyncHistory(
    @Query('limit') limitParam?: string,
  ): Promise<SyncHistoryResponseDto> {
    const parsedLimit = parseInt(limitParam ?? '10', 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 1), 50);
    
    // Get completed and failed jobs, sorted by timestamp descending
    const completedJobs = await this.catalogQueue.getJobs(['completed', 'failed'], 0, limit);
    
    // Filter to only sync jobs (not reprice or other catalog jobs)
    const syncJobs = completedJobs.filter(
      (job) => job.name === 'catalog.sync.imported' || job.name === 'catalog.sync.full',
    );

    const jobs = await Promise.all(
      syncJobs.slice(0, limit).map(async (job) => {
        const state = await job.getState();
        return {
          jobId: job.id ?? 'unknown',
          status: state,
          progress: typeof job.progress === 'number' ? job.progress : (job.progress as { percent?: number } | undefined)?.percent,
          result: job.returnvalue as
            | {
                productsProcessed?: number;
                productsCreated?: number;
                productsUpdated?: number;
                productsSkipped?: number;
                errors?: string[];
                skippedProducts?: SkippedProductInfoDto[];
                updatedProducts?: UpdatedProductInfoDto[];
              }
            | undefined,
          failedReason: job.failedReason,
          createdAt:
            job.timestamp !== null &&
            job.timestamp !== undefined &&
            job.timestamp !== 0 &&
            !Number.isNaN(job.timestamp)
              ? new Date(job.timestamp)
              : undefined,
          processedOn:
            job.processedOn !== null &&
            job.processedOn !== undefined &&
            job.processedOn !== 0 &&
            !Number.isNaN(job.processedOn)
              ? new Date(job.processedOn)
              : undefined,
          finishedOn:
            job.finishedOn !== null &&
            job.finishedOn !== undefined &&
            job.finishedOn !== 0 &&
            !Number.isNaN(job.finishedOn)
              ? new Date(job.finishedOn)
              : undefined,
        };
      }),
    );

    return {
      jobs,
      total: syncJobs.length,
    };
  }
}
