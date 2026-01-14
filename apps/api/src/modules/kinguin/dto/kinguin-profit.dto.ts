import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Profit Period Query DTO
 * Used for specifying the time period for profit calculations
 */
export class ProfitPeriodQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for profit calculation',
    enum: ['24h', '7d', '30d', '90d', 'total'],
    default: '30d',
  })
  @IsOptional()
  @IsEnum(['24h', '7d', '30d', '90d', 'total'])
  period?: '24h' | '7d' | '30d' | '90d' | 'total' = '30d';
}

/**
 * Product Profit Query DTO
 */
export class ProductProfitQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of products to return',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Time period for profit calculation',
    enum: ['24h', '7d', '30d', '90d', 'total'],
    default: '30d',
  })
  @IsOptional()
  @IsEnum(['24h', '7d', '30d', '90d', 'total'])
  period?: '24h' | '7d' | '30d' | '90d' | 'total' = '30d';
}

/**
 * Low Margin Query DTO
 */
export class LowMarginQueryDto {
  @ApiPropertyOptional({
    description: 'Margin threshold percentage (products below this are considered low margin)',
    default: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  threshold?: number = 15;

  @ApiPropertyOptional({
    description: 'Maximum number of products to return',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

/**
 * Profit Trend Query DTO
 */
export class ProfitTrendQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days for trend data',
    default: 30,
    minimum: 7,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(90)
  days?: number = 30;
}

// ========== RESPONSE DTOs ==========

/**
 * Profit Summary DTO
 * Provides high-level profit metrics for a given period
 */
export class ProfitSummaryDto {
  @ApiProperty({ description: 'Total revenue from BitLoot sales (EUR)' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Total cost paid to Kinguin (EUR)' })
  totalCost!: number;

  @ApiProperty({ description: 'Gross profit = Revenue - Cost (EUR)' })
  grossProfit!: number;

  @ApiProperty({ description: 'Profit margin percentage = (Profit / Revenue) × 100' })
  profitMarginPercent!: number;

  @ApiProperty({ description: 'Number of fulfilled orders in period' })
  orderCount!: number;

  @ApiProperty({ description: 'Average profit per order (EUR)' })
  avgProfitPerOrder!: number;

  @ApiProperty({ description: 'Average revenue per order (EUR)' })
  avgRevenuePerOrder!: number;

  @ApiProperty({ description: 'Average cost per order (EUR)' })
  avgCostPerOrder!: number;

  @ApiProperty({ description: 'ROI percentage = (Profit / Cost) × 100' })
  roiPercent!: number;

  @ApiProperty({ description: 'Time period for this summary', enum: ['24h', '7d', '30d', '90d', 'total'] })
  period!: string;

  @ApiProperty({ description: 'Timestamp when data was fetched' })
  fetchedAt!: string;
}

/**
 * Product Profit DTO
 * Per-product profitability breakdown
 */
export class ProductProfitDto {
  @ApiProperty({ description: 'Product name' })
  productName!: string;

  @ApiProperty({ description: 'Product ID (BitLoot internal)' })
  productId!: string;

  @ApiProperty({ description: 'Total units sold' })
  unitsSold!: number;

  @ApiProperty({ description: 'Total revenue from this product (EUR)' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Total cost for this product (EUR)' })
  totalCost!: number;

  @ApiProperty({ description: 'Total profit from this product (EUR)' })
  totalProfit!: number;

  @ApiProperty({ description: 'Profit margin percentage' })
  marginPercent!: number;

  @ApiProperty({ description: 'Average selling price (EUR)' })
  avgSellPrice!: number;

  @ApiProperty({ description: 'Average cost price from Kinguin (EUR)' })
  avgCostPrice!: number;

  @ApiProperty({ description: 'Average profit per unit (EUR)' })
  avgProfitPerUnit!: number;
}

/**
 * Paginated Product Profit Response DTO
 */
export class ProductProfitListDto {
  @ApiProperty({ description: 'List of products with profit data', type: [ProductProfitDto] })
  products!: ProductProfitDto[];

  @ApiProperty({ description: 'Total number of products' })
  total!: number;

  @ApiProperty({ description: 'Time period for this data' })
  period!: string;
}

/**
 * Profit Trend Point DTO
 * Single data point for profit trend charting
 */
export class ProfitTrendPointDto {
  @ApiProperty({ description: 'Date for this data point (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ description: 'Revenue for this day (EUR)' })
  revenue!: number;

  @ApiProperty({ description: 'Cost for this day (EUR)' })
  cost!: number;

  @ApiProperty({ description: 'Profit for this day (EUR)' })
  profit!: number;

  @ApiProperty({ description: 'Profit margin percentage for this day' })
  marginPercent!: number;

  @ApiProperty({ description: 'Number of orders on this day' })
  orderCount!: number;
}

/**
 * Profit Trend Response DTO
 */
export class ProfitTrendDto {
  @ApiProperty({ description: 'Daily profit trend data', type: [ProfitTrendPointDto] })
  trend!: ProfitTrendPointDto[];

  @ApiProperty({ description: 'Number of days in trend' })
  days!: number;

  @ApiProperty({ description: 'Total revenue over period' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Total cost over period' })
  totalCost!: number;

  @ApiProperty({ description: 'Total profit over period' })
  totalProfit!: number;

  @ApiProperty({ description: 'Average daily profit' })
  avgDailyProfit!: number;

  @ApiProperty({ description: 'Best day profit' })
  bestDayProfit!: number;

  @ApiProperty({ description: 'Best day date' })
  bestDayDate!: string;
}

/**
 * Margin Distribution Bucket DTO
 * For margin distribution histogram
 */
export class MarginDistributionBucketDto {
  @ApiProperty({ description: 'Margin range label (e.g., "0-10%")' })
  range!: string;

  @ApiProperty({ description: 'Minimum margin in this bucket' })
  minMargin!: number;

  @ApiProperty({ description: 'Maximum margin in this bucket' })
  maxMargin!: number;

  @ApiProperty({ description: 'Number of products in this range' })
  productCount!: number;

  @ApiProperty({ description: 'Percentage of total products' })
  percentOfTotal!: number;

  @ApiProperty({ description: 'Total profit from products in this range (EUR)' })
  totalProfit!: number;

  @ApiProperty({ description: 'Total revenue from products in this range (EUR)' })
  totalRevenue!: number;
}

/**
 * Margin Distribution Response DTO
 */
export class MarginDistributionDto {
  @ApiProperty({ description: 'Distribution buckets', type: [MarginDistributionBucketDto] })
  distribution!: MarginDistributionBucketDto[];

  @ApiProperty({ description: 'Total products analyzed' })
  totalProducts!: number;

  @ApiProperty({ description: 'Overall average margin' })
  avgMargin!: number;

  @ApiProperty({ description: 'Median margin' })
  medianMargin!: number;

  @ApiProperty({ description: 'Time period for analysis' })
  period!: string;
}

/**
 * Profit Alert DTO
 * For profit-related warnings and notifications
 */
export class ProfitAlertDto {
  @ApiProperty({ description: 'Alert severity', enum: ['success', 'warning', 'danger', 'info'] })
  type!: 'success' | 'warning' | 'danger' | 'info';

  @ApiProperty({ description: 'Metric that triggered the alert' })
  metric!: string;

  @ApiProperty({ description: 'Human-readable alert message' })
  message!: string;

  @ApiProperty({ description: 'Current value of the metric' })
  currentValue!: number;

  @ApiPropertyOptional({ description: 'Threshold that was crossed (if applicable)' })
  threshold?: number;

  @ApiPropertyOptional({ description: 'Recommended action' })
  recommendation?: string;
}

/**
 * Profit Alerts Response DTO
 */
export class ProfitAlertsDto {
  @ApiProperty({ description: 'Active profit alerts', type: [ProfitAlertDto] })
  alerts!: ProfitAlertDto[];

  @ApiProperty({ description: 'Timestamp when alerts were generated' })
  fetchedAt!: string;

  @ApiProperty({ description: 'Overall health status', enum: ['healthy', 'warning', 'critical'] })
  overallStatus!: 'healthy' | 'warning' | 'critical';
}

/**
 * Combined Profit Dashboard DTO
 * All profit data in a single response for dashboard loading
 */
export class ProfitDashboardDto {
  @ApiProperty({ description: 'All-time profit summary', type: ProfitSummaryDto })
  summaryTotal!: ProfitSummaryDto;

  @ApiProperty({ description: '24h profit summary', type: ProfitSummaryDto })
  summary24h!: ProfitSummaryDto;

  @ApiProperty({ description: '7d profit summary', type: ProfitSummaryDto })
  summary7d!: ProfitSummaryDto;

  @ApiProperty({ description: '30d profit summary', type: ProfitSummaryDto })
  summary30d!: ProfitSummaryDto;

  @ApiProperty({ description: 'Top 10 most profitable products', type: [ProductProfitDto] })
  topProducts!: ProductProfitDto[];

  @ApiProperty({ description: 'Low margin products (< 15%)', type: [ProductProfitDto] })
  lowMarginProducts!: ProductProfitDto[];

  @ApiProperty({ description: '30-day profit trend', type: [ProfitTrendPointDto] })
  profitTrend!: ProfitTrendPointDto[];

  @ApiProperty({ description: 'Margin distribution buckets', type: [MarginDistributionBucketDto] })
  marginDistribution!: MarginDistributionBucketDto[];

  @ApiProperty({ description: 'Active profit alerts', type: [ProfitAlertDto] })
  alerts!: ProfitAlertDto[];

  @ApiProperty({ description: 'Timestamp when data was fetched' })
  fetchedAt!: string;
}
