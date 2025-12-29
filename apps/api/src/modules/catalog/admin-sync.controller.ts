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
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { KinguinCatalogClient } from './kinguin-catalog.client';

// ============ DTOs ============
export class SyncJobResponseDto {
  @ApiProperty({ description: 'BullMQ job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Job status (e.g., queued, running, completed)' })
  status!: string;

  @ApiProperty({ description: 'Status message' })
  message!: string;
}

export class SyncJobStatusResponseDto {
  @ApiProperty({ description: 'BullMQ job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Job status (waiting, active, completed, failed)' })
  status!: string;

  @ApiProperty({ description: 'Progress percentage (0-100)', required: false })
  progress?: number;

  @ApiProperty({
    description: 'Job result data',
    required: false,
    type: 'object',
    properties: {
      productsProcessed: { type: 'number' },
      productsCreated: { type: 'number' },
      productsUpdated: { type: 'number' },
      errors: { type: 'array', items: { type: 'string' } },
    },
  })
  result?: {
    productsProcessed?: number;
    productsCreated?: number;
    productsUpdated?: number;
    errors?: string[];
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

@ApiTags('Admin - Catalog Sync')
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
    const progress = job.progress as number | undefined;

    return {
      jobId: job.id ?? 'unknown',
      status: state,
      progress,
      result: job.returnvalue as
        | {
            productsProcessed?: number;
            productsCreated?: number;
            productsUpdated?: number;
            errors?: string[];
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
}
