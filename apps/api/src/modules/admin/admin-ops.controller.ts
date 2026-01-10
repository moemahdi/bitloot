import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminOpsService } from './admin-ops.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { UserDeletionCleanupService } from '../../jobs/user-deletion-cleanup.processor';

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
    description: 'Queue statistics (waiting, active, failed)',
    schema: {
      type: 'object',
      additionalProperties: {
        properties: {
          waiting: { type: 'number' },
          active: { type: 'number' },
          failed: { type: 'number' },
          delayed: { type: 'number' },
          paused: { type: 'number' },
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
}
