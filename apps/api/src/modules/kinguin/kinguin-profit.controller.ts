import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { KinguinProfitService } from './kinguin-profit.service';
import {
  ProfitSummaryDto,
  ProductProfitDto,
  ProductProfitListDto,
  ProfitTrendDto,
  MarginDistributionDto,
  ProfitAlertsDto,
  ProfitDashboardDto,
  ProfitPeriodQueryDto,
  ProductProfitQueryDto,
  LowMarginQueryDto,
  ProfitTrendQueryDto,
} from './dto/kinguin-profit.dto';

/**
 * Kinguin Profit Analytics Controller
 *
 * Provides endpoints for profit metrics and analytics:
 * - Profit summary (revenue, cost, margin)
 * - Per-product profitability
 * - Profit trends over time
 * - Margin distribution analysis
 * - Profit alerts and warnings
 */
@ApiTags('Admin - Kinguin Profit Analytics')
@Controller('admin/kinguin/profit')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class KinguinProfitController {
  constructor(private readonly profitService: KinguinProfitService) {}

  /**
   * GET /admin/kinguin/profit/dashboard
   * Get combined profit dashboard data (all metrics in one request)
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get profit dashboard',
    description: 'Returns all profit metrics in a single request for dashboard display',
  })
  @ApiResponse({
    status: 200,
    description: 'Profit dashboard data',
    type: ProfitDashboardDto,
  })
  async getDashboard(): Promise<ProfitDashboardDto> {
    return this.profitService.getProfitDashboard();
  }

  /**
   * GET /admin/kinguin/profit/summary
   * Get profit summary for a specified period
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get profit summary',
    description: 'Returns profit metrics (revenue, cost, margin) for the specified period',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['24h', '7d', '30d', '90d'],
    description: 'Time period for profit calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Profit summary for the period',
    type: ProfitSummaryDto,
  })
  async getSummary(@Query() query: ProfitPeriodQueryDto): Promise<ProfitSummaryDto> {
    return this.profitService.getProfitSummary(query.period ?? '30d');
  }

  /**
   * GET /admin/kinguin/profit/products
   * Get per-product profitability breakdown
   */
  @Get('products')
  @ApiOperation({
    summary: 'Get product profitability',
    description: 'Returns profitability metrics for each product, sorted by total profit',
  })
  @ApiResponse({
    status: 200,
    description: 'Product profitability list',
    type: ProductProfitListDto,
  })
  async getProductProfitability(
    @Query() query: ProductProfitQueryDto,
  ): Promise<ProductProfitListDto> {
    return this.profitService.getProductProfitability(
      query.period ?? '30d',
      query.limit ?? 20,
    );
  }

  /**
   * GET /admin/kinguin/profit/top-products
   * Get top N most profitable products
   */
  @Get('top-products')
  @ApiOperation({
    summary: 'Get top profitable products',
    description: 'Returns the most profitable products by total profit',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of products to return (default: 10)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['24h', '7d', '30d', '90d', 'total'],
    description: 'Time period for calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Top profitable products',
    type: [ProductProfitDto],
  })
  async getTopProducts(@Query() query: ProductProfitQueryDto): Promise<ProductProfitDto[]> {
    return this.profitService.getTopProducts(query.period ?? '30d', query.limit ?? 10);
  }

  /**
   * GET /admin/kinguin/profit/low-margin
   * Get products with margin below threshold
   */
  @Get('low-margin')
  @ApiOperation({
    summary: 'Get low margin products',
    description: 'Returns products with profit margin below the specified threshold',
  })
  @ApiResponse({
    status: 200,
    description: 'Low margin products',
    type: [ProductProfitDto],
  })
  async getLowMarginProducts(@Query() query: LowMarginQueryDto): Promise<ProductProfitDto[]> {
    return this.profitService.getLowMarginProducts(
      query.threshold ?? 15,
      query.limit ?? 10,
    );
  }

  /**
   * GET /admin/kinguin/profit/trend
   * Get daily profit trend for charting
   */
  @Get('trend')
  @ApiOperation({
    summary: 'Get profit trend',
    description: 'Returns daily profit data for trend visualization',
  })
  @ApiResponse({
    status: 200,
    description: 'Profit trend data',
    type: ProfitTrendDto,
  })
  async getProfitTrend(@Query() query: ProfitTrendQueryDto): Promise<ProfitTrendDto> {
    return this.profitService.getProfitTrend(query.days ?? 30);
  }

  /**
   * GET /admin/kinguin/profit/distribution
   * Get margin distribution histogram
   */
  @Get('distribution')
  @ApiOperation({
    summary: 'Get margin distribution',
    description: 'Returns margin distribution histogram for analysis',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['24h', '7d', '30d', '90d', 'total'],
    description: 'Time period for calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Margin distribution data',
    type: MarginDistributionDto,
  })
  async getMarginDistribution(
    @Query() query: ProfitPeriodQueryDto,
  ): Promise<MarginDistributionDto> {
    return this.profitService.getMarginDistribution(query.period ?? '30d');
  }

  /**
   * GET /admin/kinguin/profit/alerts
   * Get profit-related alerts and warnings
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get profit alerts',
    description: 'Returns active profit-related alerts and warnings',
  })
  @ApiResponse({
    status: 200,
    description: 'Profit alerts',
    type: ProfitAlertsDto,
  })
  async getProfitAlerts(): Promise<ProfitAlertsDto> {
    return this.profitService.getProfitAlerts();
  }
}
