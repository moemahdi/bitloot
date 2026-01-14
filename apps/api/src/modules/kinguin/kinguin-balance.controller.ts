import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KinguinBalanceService } from './kinguin-balance.service';
import {
  KinguinBalanceDto,
  SpendingStatsDto,
  KinguinOrderSummaryDto,
  BalanceAlertDto,
  BalanceHistoryPointDto,
  KinguinDashboardDto,
  KinguinHealthDto,
  SpendingQueryDto,
  RecentOrdersQueryDto,
  BalanceHistoryQueryDto,
} from './dto/kinguin-balance.dto';

/**
 * Kinguin Balance Controller
 *
 * Admin endpoints for Kinguin balance monitoring, spending analytics, and alerts.
 * All endpoints require admin authentication.
 */
@ApiTags('Admin - Kinguin Balance')
@Controller('admin/kinguin/balance')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class KinguinBalanceController {
  constructor(private readonly balanceService: KinguinBalanceService) {}

  /**
   * Get complete dashboard data in a single call
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get complete Kinguin dashboard data',
    description:
      'Returns all balance data, spending stats, recent orders, and alerts in a single response. Optimized for dashboard loading.',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete dashboard data',
    type: KinguinDashboardDto,
  })
  async getDashboard(): Promise<KinguinDashboardDto> {
    return this.balanceService.getDashboard();
  }

  /**
   * Get current Kinguin balance
   */
  @Get()
  @ApiOperation({
    summary: 'Get current Kinguin balance',
    description:
      'Returns current account balance in EUR with API connection status and environment info.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current balance information',
    type: KinguinBalanceDto,
  })
  async getBalance(): Promise<KinguinBalanceDto> {
    return this.balanceService.getBalance();
  }

  /**
   * Get spending statistics
   */
  @Get('spending')
  @ApiOperation({
    summary: 'Get spending statistics for a period',
    description:
      'Returns aggregated spending data including total spent, order count, average order cost, and top products.',
  })
  @ApiQuery({
    name: 'period',
    enum: ['24h', '7d', '30d'],
    required: false,
    description: 'Period for spending calculation (default: 24h)',
  })
  @ApiResponse({
    status: 200,
    description: 'Spending statistics',
    type: SpendingStatsDto,
  })
  async getSpending(@Query() query: SpendingQueryDto): Promise<SpendingStatsDto> {
    const period = query.period ?? '24h';
    return this.balanceService.getSpendingStats(period);
  }

  /**
   * Get recent Kinguin orders
   */
  @Get('orders')
  @ApiOperation({
    summary: 'Get recent Kinguin orders',
    description:
      'Returns a list of recent Kinguin orders with product details, costs, and status.',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of orders to return (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recent orders',
    type: [KinguinOrderSummaryDto],
  })
  async getRecentOrders(
    @Query() query: RecentOrdersQueryDto,
  ): Promise<KinguinOrderSummaryDto[]> {
    const limit = query.limit ?? 10;
    return this.balanceService.getRecentOrders(limit);
  }

  /**
   * Get balance alerts
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get balance alerts',
    description:
      'Returns active alerts based on balance thresholds and API status. Includes critical, warning, and info alerts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active alerts',
    type: [BalanceAlertDto],
  })
  async getAlerts(): Promise<BalanceAlertDto[]> {
    return this.balanceService.getAlerts();
  }

  /**
   * Get balance history for charting
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get balance history for charts',
    description:
      'Returns estimated historical balance data for trend visualization. Balance is estimated by working backwards from current balance using order costs.',
  })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: false,
    description: 'Number of days to include (default: 30, max: 90)',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance history points',
    type: [BalanceHistoryPointDto],
  })
  async getBalanceHistory(
    @Query() query: BalanceHistoryQueryDto,
  ): Promise<BalanceHistoryPointDto[]> {
    const days = query.days ?? 30;
    return this.balanceService.getBalanceHistory(days);
  }

  /**
   * Health check for Kinguin API
   */
  @Get('health')
  @ApiOperation({
    summary: 'Kinguin API health check',
    description:
      'Performs a health check on the Kinguin API connection and returns status with response time.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check result',
    type: KinguinHealthDto,
  })
  async healthCheck(): Promise<KinguinHealthDto> {
    return this.balanceService.healthCheck();
  }
}
