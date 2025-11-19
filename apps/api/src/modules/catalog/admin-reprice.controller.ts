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
class RepriceJobResponseDto {
  jobId!: string;
  status!: string;
  message!: string;
}

class RepriceJobStatusResponseDto {
  jobId!: string;
  status!: string;
  progress?: number;
  result?: unknown;
  failedReason?: string;
  createdAt?: Date;
  processedOn?: Date;
  finishedOn?: Date;
}

@ApiTags('Admin - Catalog Repricing')
@Controller('admin/catalog/reprice')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminRepriceController {
  constructor(
    @InjectQueue('catalog') private readonly catalogQueue: Queue,
  ) {}

  /**
   * POST /admin/catalog/reprice
   * Trigger a repricing job for all products or a specific product
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger repricing job',
    description:
      'Enqueues a BullMQ job to recalculate prices for all products or a specific product based on dynamic pricing rules',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Optional: Reprice only this product ID',
  })
  @ApiResponse({
    status: 202,
    description: 'Repricing job enqueued successfully',
    type: RepriceJobResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async triggerReprice(
    @Query('productId') productId?: string,
  ): Promise<RepriceJobResponseDto> {
    const job = await this.catalogQueue.add(
      'reprice',
      {
        productId: productId ?? null,
        triggeredAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return {
      jobId: job.id ?? 'unknown',
      status: 'enqueued',
      message:
        productId !== null && productId !== undefined && productId !== ''
          ? `Repricing job enqueued for product ${productId}`
          : 'Repricing job enqueued for all products',
    };
  }

  /**
   * GET /admin/catalog/reprice/status
   * Check status of a repricing job
   */
  @Get('status')
  @ApiOperation({
    summary: 'Check repricing job status',
    description: 'Get detailed status of a specific repricing job by ID',
  })
  @ApiQuery({
    name: 'jobId',
    required: true,
    description: 'The BullMQ job ID to check',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    type: RepriceJobStatusResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getRepriceStatus(
    @Query('jobId') jobId: string,
  ): Promise<RepriceJobStatusResponseDto> {
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
      result: job.returnvalue,
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
