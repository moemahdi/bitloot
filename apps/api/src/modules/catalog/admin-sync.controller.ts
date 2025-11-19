import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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

@ApiTags('Admin - Catalog Sync')
@Controller('admin/catalog/sync')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminSyncController {
  constructor(
    @InjectQueue('catalog') private readonly catalogQueue: Queue,
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
    const isFullSync =
      fullSync !== null &&
      fullSync !== undefined &&
      fullSync !== '' &&
      (fullSync === 'true' || fullSync === '1');

    const job = await this.catalogQueue.add(
      'kinguin-sync',
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
  async getSyncStatus(
    @Query('jobId') jobId: string,
  ): Promise<SyncJobStatusResponseDto> {
    const job = await this.catalogQueue.getJob(jobId);

    if (job === null || job === undefined) {
      throw new Error(`Job ${jobId} not found`);
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
