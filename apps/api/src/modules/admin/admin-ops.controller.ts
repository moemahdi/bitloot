import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminOpsService } from './admin-ops.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { UserDeletionCleanupService } from '../../jobs/user-deletion-cleanup.processor';
import { CatalogCacheService } from '../catalog/catalog-cache.service';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

/**
 * Admin Ops Controller - Phase 3: Ops Panels & Monitoring
 * Feature flags, queue stats, balance monitoring, system health
 */
@ApiTags('Admin - Operations')
@Controller('admin/ops')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminOpsController {
  constructor(
    private readonly adminOpsService: AdminOpsService,
    private readonly userDeletionCleanupService: UserDeletionCleanupService,
    private readonly catalogCacheService: CatalogCacheService,
  ) {}

  // ============ FEATURE FLAGS ============

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({
    status: 200,
    description: 'List of all feature flags with status',
    schema: {
      type: 'array',
      items: {
        properties: {
          name: { type: 'string' },
          enabled: { type: 'boolean' },
          description: { type: 'string' },
        },
      },
    },
  })
  getFeatureFlags(): Array<{ name: string; enabled: boolean; description: string }> {
    return this.adminOpsService.getFeatureFlags();
  }

  @Get('feature-flags/:name')
  @ApiOperation({ summary: 'Get single feature flag' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag status',
    schema: {
      properties: {
        enabled: { type: 'boolean' },
        description: { type: 'string' },
      },
    },
  })
  getFeatureFlag(
    @Param('name') name: string,
  ): { enabled: boolean; description: string } | { error: string } {
    const flag = this.adminOpsService.getFeatureFlag(name);
    if (flag === null) {
      return { error: `Feature flag ${name} not found` };
    }
    return flag;
  }

  @Patch('feature-flags/:name')
  @AuditLog({
    action: 'flag.toggle',
    target: 'params.name',
    includeBodyFields: ['enabled'],
    details: 'Feature flag toggled',
  })
  @ApiOperation({ summary: 'Update feature flag' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag updated',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  updateFeatureFlag(
    @Param('name') name: string,
    @Body() { enabled }: { enabled: boolean },
  ): { success: boolean; message: string } {
    return this.adminOpsService.updateFeatureFlag(name, enabled);
  }

  @Post('feature-flags')
  @AuditLog({
    action: 'flag.create',
    target: 'body.name',
    includeBodyFields: ['name', 'enabled', 'description'],
    details: 'New feature flag created',
  })
  @ApiOperation({ summary: 'Create new feature flag' })
  @ApiResponse({
    status: 201,
    description: 'Feature flag created',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  createFeatureFlag(
    @Body() { name, enabled, description }: { name: string; enabled?: boolean; description?: string },
  ): { success: boolean; message: string } {
    return this.adminOpsService.createFeatureFlag(name, enabled, description);
  }

  // ============ QUEUE STATISTICS ============

  @Get('queues/stats')
  @ApiOperation({ summary: 'Get BullMQ queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics (waiting, active, failed, completed)',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          waiting: { type: 'number' },
          active: { type: 'number' },
          failed: { type: 'number' },
          delayed: { type: 'number' },
          paused: { type: 'number' },
          completed: { type: 'number' },
          total: { type: 'number' },
        },
      },
    },
  })
  async getQueueStats(): Promise<
    Record<
      string,
      {
        waiting: number;
        active: number;
        failed: number;
        delayed: number;
        paused: number;
        total: number;
      }
    >
  > {
    return this.adminOpsService.getQueueStats();
  }

  @Get('queues/:name/details')
  @ApiOperation({ summary: 'Get detailed queue information' })
  @ApiResponse({
    status: 200,
    description: 'Queue details including recent jobs',
    schema: {
      properties: {
        name: { type: 'string' },
        stats: {
          properties: {
            waiting: { type: 'number' },
            active: { type: 'number' },
            failed: { type: 'number' },
            delayed: { type: 'number' },
          },
        },
        recentJobs: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              data: { type: 'object' },
              state: { type: 'string' },
              progress: { type: 'number' },
              attempts: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getQueueDetails(
    @Param('name') name: string,
  ): Promise<{
    name: string;
    stats: { waiting: number; active: number; failed: number; delayed: number };
    recentJobs: Array<{
      id: string;
      data: Record<string, unknown>;
      state: string;
      progress: number;
      attempts: number;
    }>;
  }> {
    return this.adminOpsService.getQueueDetails(name);
  }

  @Get('queues/:name/failed')
  @ApiOperation({ summary: 'Get failed jobs with error details' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs with error information',
    schema: {
      type: 'object',
      properties: {
        queueName: { type: 'string' },
        total: { type: 'number' },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              data: { type: 'object' },
              failedReason: { type: 'string' },
              stacktrace: { type: 'array', items: { type: 'string' } },
              attemptsMade: { type: 'number' },
              maxAttempts: { type: 'number' },
              timestamp: { type: 'number' },
              processedOn: { type: 'number' },
              finishedOn: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getFailedJobs(
    @Param('name') name: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{
    queueName: string;
    total: number;
    jobs: Array<{
      id: string;
      name: string;
      data: Record<string, unknown>;
      failedReason: string;
      stacktrace: string[];
      attemptsMade: number;
      maxAttempts: number;
      timestamp: number;
      processedOn: number | null;
      finishedOn: number | null;
    }>;
  }> {
    return this.adminOpsService.getFailedJobs(
      name,
      limit !== undefined && limit !== '' ? parseInt(limit, 10) : 20,
      offset !== undefined && offset !== '' ? parseInt(offset, 10) : 0,
    );
  }

  @Post('queues/:name/failed/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    action: 'queue.job.retry',
    target: 'params.jobId',
    details: 'Admin retried failed job',
  })
  @ApiOperation({ summary: 'Retry a specific failed job' })
  @ApiResponse({ status: 200, description: 'Job retried successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryFailedJob(
    @Param('name') name: string,
    @Param('jobId') jobId: string,
  ): Promise<{ ok: boolean; jobId: string }> {
    return this.adminOpsService.retryFailedJob(name, jobId);
  }

  @Post('queues/:name/failed/clear')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    action: 'queue.failed.clear',
    target: 'params.name',
    details: 'Admin cleared all failed jobs',
  })
  @ApiOperation({ summary: 'Clear all failed jobs from a queue' })
  @ApiResponse({ status: 200, description: 'Failed jobs cleared' })
  async clearFailedJobs(
    @Param('name') name: string,
  ): Promise<{ ok: boolean; cleared: number }> {
    return this.adminOpsService.clearFailedJobs(name);
  }

  // ============ BALANCE MONITORING ============

  @Get('balance')
  @ApiOperation({ summary: 'Get current balance and account status' })
  @ApiResponse({
    status: 200,
    description: 'Current balance from payment provider',
    schema: {
      properties: {
        nowpayments: {
          properties: {
            available: { type: 'string' },
            currency: { type: 'string' },
            lastUpdated: { type: 'string' },
          },
        },
        status: {
          properties: {
            api_connected: { type: 'boolean' },
            webhooks_enabled: { type: 'boolean' },
            sandbox_mode: { type: 'boolean' },
          },
        },
      },
    },
  })
  getBalance(): {
    nowpayments: { available: string; currency: string; lastUpdated: string };
    status: { api_connected: boolean; webhooks_enabled: boolean; sandbox_mode: boolean };
  } {
    return this.adminOpsService.getBalance();
  }

  @Get('balance/details')
  @ApiOperation({ summary: 'Get detailed balance by currency' })
  @ApiResponse({
    status: 200,
    description: 'Detailed balance information',
    schema: {
      properties: {
        accounts: {
          type: 'array',
          items: {
            properties: {
              currency: { type: 'string' },
              balance: { type: 'string' },
              pending: { type: 'string' },
              locked: { type: 'string' },
            },
          },
        },
        totalEUR: { type: 'string' },
        lastSync: { type: 'string' },
      },
    },
  })
  getBalanceDetails(): {
    accounts: Array<{ currency: string; balance: string; pending: string; locked: string }>;
    totalEUR: string;
    lastSync: string;
  } {
    return this.adminOpsService.getBalanceDetails();
  }

  // ============ SYSTEM HEALTH ============

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: 200,
    description: 'System health check results',
    schema: {
      properties: {
        api: { properties: { healthy: { type: 'boolean' }, uptime: { type: 'string' } } },
        database: { properties: { healthy: { type: 'boolean' }, responseTime: { type: 'string' } } },
        redis: { properties: { healthy: { type: 'boolean' }, responseTime: { type: 'string' } } },
        queues: { properties: { healthy: { type: 'boolean' }, failedJobs: { type: 'number' } } },
      },
    },
  })
  async getSystemHealth(): Promise<{
    api: { healthy: boolean; uptime: string };
    database: { healthy: boolean; responseTime: string };
    redis: { healthy: boolean; responseTime: string };
    queues: { healthy: boolean; failedJobs: number };
  }> {
    return this.adminOpsService.getSystemHealth();
  }

  // ============ USER DELETION CLEANUP ============

  @Post('user-deletion-cleanup')
  @AuditLog({
    action: 'system.cleanup.user_deletion',
    target: 'user-deletion-cleanup',
    details: 'Manual user deletion cleanup triggered',
  })
  @ApiOperation({ summary: 'Manually trigger user deletion cleanup (30-day grace period expired)' })
  @ApiResponse({
    status: 200,
    description: 'Cleanup results',
    schema: {
      properties: {
        processed: { type: 'number', description: 'Number of users found for deletion' },
        deleted: { type: 'number', description: 'Number successfully deleted' },
        failed: { type: 'number', description: 'Number that failed to delete' },
      },
    },
  })
  async triggerUserDeletionCleanup(): Promise<{
    processed: number;
    deleted: number;
    failed: number;
  }> {
    return this.userDeletionCleanupService.triggerManualCleanup();
  }

  // ============ CATALOG CACHE MANAGEMENT ============

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get catalog cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
    schema: {
      properties: {
        enabled: { type: 'boolean', description: 'Whether caching is enabled' },
        connected: { type: 'boolean', description: 'Whether Redis connection is active' },
        keyCount: { type: 'number', description: 'Number of catalog cache keys' },
      },
    },
  })
  async getCacheStats(): Promise<{
    enabled: boolean;
    connected: boolean;
    keyCount: number;
  }> {
    return this.catalogCacheService.getStats();
  }

  @Delete('cache')
  @AuditLog({
    action: 'cache.invalidate.all',
    target: 'catalog-cache',
    details: 'All catalog caches invalidated',
  })
  @ApiOperation({ summary: 'Invalidate all catalog caches' })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidation result',
    schema: {
      properties: {
        success: { type: 'boolean' },
        keysInvalidated: { type: 'number' },
      },
    },
  })
  async invalidateAllCache(): Promise<{
    success: boolean;
    keysInvalidated: number;
  }> {
    const keysInvalidated = await this.catalogCacheService.invalidateAll();
    return { success: true, keysInvalidated };
  }

  @Delete('cache/featured')
  @AuditLog({
    action: 'cache.invalidate.featured',
    target: 'catalog-cache-featured',
    details: 'Featured products cache invalidated',
  })
  @ApiOperation({ summary: 'Invalidate featured products cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidation result',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async invalidateFeaturedCache(): Promise<{ success: boolean }> {
    await this.catalogCacheService.invalidateFeaturedProducts();
    await this.catalogCacheService.invalidateSectionProducts();
    return { success: true };
  }

  @Delete('cache/categories')
  @AuditLog({
    action: 'cache.invalidate.categories',
    target: 'catalog-cache-categories',
    details: 'Categories and filters cache invalidated',
  })
  @ApiOperation({ summary: 'Invalidate categories and filters cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidation result',
    schema: {
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async invalidateCategoriesCache(): Promise<{ success: boolean }> {
    await this.catalogCacheService.invalidateCategoriesAndFilters();
    return { success: true };
  }
}
