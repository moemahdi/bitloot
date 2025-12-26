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
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { KinguinCatalogClient } from './kinguin-catalog.client';

// ============ DTOs ============
class SyncJobResponseDto {
  jobId!: string;
  status!: string;
  message!: string;
}

class SyncJobStatusResponseDto {
  jobId!: string;
  status!: string;
  progress?: number;
  result?: {
    productsProcessed?: number;
    productsCreated?: number;
    productsUpdated?: number;
    errors?: string[];
  };
  failedReason?: string;
  createdAt?: Date;
  processedOn?: Date;
  finishedOn?: Date;
}

class SyncConfigStatusDto {
  configured!: boolean;
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
   * Trigger a Kinguin catalog synchronization job
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger Kinguin catalog sync',
    description:
      'Enqueues a BullMQ job to fetch latest products from Kinguin API and update local database',
  })
  @ApiQuery({
    name: 'fullSync',
    required: false,
    type: Boolean,
    description: 'If true, performs full sync. Otherwise, incremental sync',
  })
  @ApiResponse({
    status: 202,
    description: 'Sync job enqueued successfully',
    type: SyncJobResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async triggerSync(
    @Query('fullSync') fullSync?: string,
  ): Promise<SyncJobResponseDto> {
    // Check if Kinguin integration is configured
    if (!this.kinguinClient.isConfigured()) {
      throw new BadRequestException(
        `Cannot start sync: ${this.kinguinClient.getConfigurationStatus()}`,
      );
    }

    const isFullSync =
      fullSync !== null &&
      fullSync !== undefined &&
      fullSync !== '' &&
      (fullSync === 'true' || fullSync === '1');

    const job = await this.catalogQueue.add(
      'catalog.sync.full', // Use the correct job name that the processor expects
      {
        fullSync: isFullSync,
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
      message: isFullSync
        ? 'Full catalog sync job enqueued'
        : 'Incremental catalog sync job enqueued',
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
  async getConfigStatus(): Promise<SyncConfigStatusDto> {
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
    if (!jobId || jobId.trim() === '') {
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
