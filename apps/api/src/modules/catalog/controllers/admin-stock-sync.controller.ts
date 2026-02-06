/**
 * Admin Stock Sync Controller
 *
 * Endpoints for manual inventory sync operations and global stats.
 *
 * @module CatalogModule
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { StockSyncService } from '../services/stock-sync.service';

/**
 * Response DTO for global inventory stats
 */
class GlobalInventoryStatsDto {
  totalProducts!: number;
  totalItems!: number;
  availableItems!: number;
  reservedItems!: number;
  soldItems!: number;
  expiredItems!: number;
  invalidItems!: number;
  lowStockProducts!: number;
  outOfStockProducts!: number;
}

/**
 * Response DTO for sync job results
 */
class SyncJobResultDto {
  expiration!: {
    expiredCount: number;
    productsAffected: number;
  };
  reservations!: {
    releasedCount: number;
    productsAffected: number;
  };
  lowStock!: Array<{
    productId: string;
    productTitle: string;
    slug: string;
    available: number;
    threshold: number;
    autoUnpublish: boolean;
  }>;
  stockSync!: {
    updatedCount: number;
  };
}

@ApiTags('Admin - Stock Sync')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/inventory/sync')
export class AdminStockSyncController {
  constructor(private readonly stockSyncService: StockSyncService) {}

  /**
   * Get global inventory statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get global inventory statistics',
    description: 'Returns aggregate statistics across all custom products inventory',
  })
  @ApiResponse({
    status: 200,
    description: 'Global inventory statistics',
    type: GlobalInventoryStatsDto,
  })
  async getGlobalStats(): Promise<GlobalInventoryStatsDto> {
    return this.stockSyncService.getGlobalStats();
  }

  /**
   * Run all sync jobs manually
   */
  @Post('run-all')
  @ApiOperation({
    summary: 'Run all inventory sync jobs',
    description:
      'Manually triggers all sync jobs: expiration, reservation cleanup, low stock check, and stock count sync',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync job results',
    type: SyncJobResultDto,
  })
  async runAllSyncJobs(): Promise<SyncJobResultDto> {
    return this.stockSyncService.runAllSyncJobs();
  }

  /**
   * Run item expiration job
   */
  @Post('expire-items')
  @ApiOperation({
    summary: 'Expire outdated inventory items',
    description: 'Marks items past their expiresAt date as expired',
  })
  @ApiResponse({
    status: 200,
    description: 'Expiration results',
    schema: {
      type: 'object',
      properties: {
        expiredCount: { type: 'number' },
        productsAffected: { type: 'number' },
      },
    },
  })
  async expireItems(): Promise<{ expiredCount: number; productsAffected: number }> {
    return this.stockSyncService.expireItems();
  }

  /**
   * Release stale reservations
   */
  @Post('release-reservations')
  @ApiOperation({
    summary: 'Release stale inventory reservations',
    description: 'Releases reservations older than 30 minutes that were not fulfilled',
  })
  @ApiResponse({
    status: 200,
    description: 'Release results',
    schema: {
      type: 'object',
      properties: {
        releasedCount: { type: 'number' },
        productsAffected: { type: 'number' },
      },
    },
  })
  async releaseReservations(): Promise<{ releasedCount: number; productsAffected: number }> {
    return this.stockSyncService.releaseStaleReservations();
  }

  /**
   * Sync stock counts
   */
  @Post('sync-counts')
  @ApiOperation({
    summary: 'Sync stock counts on products',
    description: 'Ensures product stock counts match actual inventory counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync results',
    schema: {
      type: 'object',
      properties: {
        updatedCount: { type: 'number' },
      },
    },
  })
  async syncStockCounts(): Promise<{ updatedCount: number }> {
    return this.stockSyncService.syncStockCounts();
  }

  /**
   * Check low stock
   */
  @Get('low-stock')
  @ApiOperation({
    summary: 'Check for low stock products',
    description: 'Returns products that are at or below their low stock threshold',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock alerts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          productTitle: { type: 'string' },
          slug: { type: 'string' },
          available: { type: 'number' },
          threshold: { type: 'number' },
          autoUnpublish: { type: 'boolean' },
        },
      },
    },
  })
  async checkLowStock(): Promise<
    Array<{
      productId: string;
      productTitle: string;
      slug: string;
      available: number;
      threshold: number;
      autoUnpublish: boolean;
    }>
  > {
    return this.stockSyncService.checkLowStock();
  }
}
