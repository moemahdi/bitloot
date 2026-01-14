import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Kinguin Balance DTO
 * Returns current Kinguin account balance and API status
 */
export class KinguinBalanceDto {
  @ApiProperty({ description: 'Current balance in EUR', example: 1234.56 })
  @IsNumber()
  balance!: number;

  @ApiProperty({ description: 'Currency (always EUR for Kinguin)', default: 'EUR' })
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Timestamp of balance fetch', example: '2026-01-14T10:30:00.000Z' })
  @IsString()
  fetchedAt!: string;

  @ApiProperty({ description: 'Whether Kinguin API is reachable', example: true })
  @IsBoolean()
  apiConnected!: boolean;

  @ApiProperty({
    description: 'Environment (sandbox or production)',
    enum: ['sandbox', 'production'],
    example: 'sandbox',
  })
  @IsEnum(['sandbox', 'production'])
  environment!: 'sandbox' | 'production';
}

/**
 * Top Product DTO - Product with spending/order stats
 */
export class TopProductDto {
  @ApiProperty({ description: 'Product name', example: 'CS:GO Key' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Number of orders for this product', example: 15 })
  @IsNumber()
  count!: number;

  @ApiProperty({ description: 'Total cost in EUR', example: 75.50 })
  @IsNumber()
  totalCost!: number;
}

/**
 * Spending Stats DTO
 * Aggregated spending statistics for a given period
 */
export class SpendingStatsDto {
  @ApiProperty({ description: 'Period label', example: '24h' })
  @IsString()
  period!: string;

  @ApiProperty({ description: 'Total amount spent in EUR', example: 312.78 })
  @IsNumber()
  totalSpent!: number;

  @ApiProperty({ description: 'Number of orders in period', example: 89 })
  @IsNumber()
  orderCount!: number;

  @ApiProperty({ description: 'Average cost per order in EUR', example: 3.52 })
  @IsNumber()
  averageOrderCost!: number;

  @ApiProperty({ description: 'Top products by spending', type: [TopProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopProductDto)
  topProducts!: TopProductDto[];
}

/**
 * Kinguin Order Product Summary
 */
export class OrderProductSummaryDto {
  @ApiProperty({ description: 'Product name', example: 'CS:GO Key' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Quantity ordered', example: 1 })
  @IsNumber()
  qty!: number;
}

/**
 * Kinguin Order Summary DTO
 * Simplified order information for display
 */
export class KinguinOrderSummaryDto {
  @ApiProperty({ description: 'Kinguin order ID', example: 'PHS84FJAG5U' })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ description: 'External order ID (if set)', example: 'BITLOOT-12345' })
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @ApiProperty({ description: 'Products in order', type: [OrderProductSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductSummaryDto)
  products!: OrderProductSummaryDto[];

  @ApiProperty({ description: 'Total payment price in EUR', example: 5.29 })
  @IsNumber()
  paymentPrice!: number;

  @ApiProperty({
    description: 'Order status',
    enum: ['processing', 'completed', 'canceled', 'refunded'],
    example: 'completed',
  })
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Order creation timestamp', example: '2026-01-14T10:30:00.000Z' })
  @IsString()
  createdAt!: string;
}

/**
 * Balance Alert DTO
 * Alert notification for low balance or other issues
 */
export class BalanceAlertDto {
  @ApiProperty({
    description: 'Alert severity',
    enum: ['warning', 'critical', 'info'],
    example: 'warning',
  })
  @IsEnum(['warning', 'critical', 'info'])
  type!: 'warning' | 'critical' | 'info';

  @ApiProperty({ description: 'Alert message', example: 'Low balance warning: Below €500' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Threshold value that triggered alert', example: 500 })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional({ description: 'Current value', example: 234.56 })
  @IsOptional()
  @IsNumber()
  currentValue?: number;
}

/**
 * Balance History Point DTO
 * Single point in balance history for charts
 */
export class BalanceHistoryPointDto {
  @ApiProperty({ description: 'Date label', example: '2026-01-14' })
  @IsString()
  date!: string;

  @ApiProperty({ description: 'Estimated balance on this date', example: 1500.00 })
  @IsNumber()
  balance!: number;

  @ApiProperty({ description: 'Spending on this date', example: 45.23 })
  @IsNumber()
  spending!: number;
}

/**
 * Kinguin Health Check DTO
 */
export class KinguinHealthDto {
  @ApiProperty({ description: 'Whether API is healthy', example: true })
  @IsBoolean()
  healthy!: boolean;

  @ApiProperty({ description: 'API response time in ms', example: 125 })
  @IsNumber()
  responseTimeMs!: number;

  @ApiProperty({ description: 'Environment', enum: ['sandbox', 'production'] })
  @IsString()
  environment!: string;

  @ApiProperty({ description: 'Timestamp of check' })
  @IsString()
  checkedAt!: string;
}

/**
 * Complete Kinguin Dashboard Data DTO
 * All data needed for the dashboard in one response
 */
export class KinguinDashboardDto {
  @ApiProperty({ description: 'Current balance info', type: KinguinBalanceDto })
  @ValidateNested()
  @Type(() => KinguinBalanceDto)
  balance!: KinguinBalanceDto;

  @ApiProperty({ description: '24h spending stats', type: SpendingStatsDto })
  @ValidateNested()
  @Type(() => SpendingStatsDto)
  spending24h!: SpendingStatsDto;

  @ApiProperty({ description: '7d spending stats', type: SpendingStatsDto })
  @ValidateNested()
  @Type(() => SpendingStatsDto)
  spending7d!: SpendingStatsDto;

  @ApiProperty({ description: '30d spending stats', type: SpendingStatsDto })
  @ValidateNested()
  @Type(() => SpendingStatsDto)
  spending30d!: SpendingStatsDto;

  @ApiProperty({ description: 'Recent orders', type: [KinguinOrderSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KinguinOrderSummaryDto)
  recentOrders!: KinguinOrderSummaryDto[];

  @ApiProperty({ description: 'Active alerts', type: [BalanceAlertDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceAlertDto)
  alerts!: BalanceAlertDto[];

  @ApiProperty({ description: 'Estimated runway in days at current spending rate', example: 27 })
  @IsNumber()
  runwayDays!: number;
}

/**
 * Query params for spending stats
 */
export class SpendingQueryDto {
  @ApiPropertyOptional({
    description: 'Period for spending calculation',
    enum: ['24h', '7d', '30d'],
    default: '24h',
  })
  @IsOptional()
  @IsEnum(['24h', '7d', '30d'])
  period?: '24h' | '7d' | '30d';
}

/**
 * Query params for recent orders
 */
export class RecentOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Number of orders to return',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

/**
 * Query params for balance history
 */
export class BalanceHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days to include',
    minimum: 1,
    maximum: 90,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  days?: number;
}
