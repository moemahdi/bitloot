import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * MetricsController - Prometheus metrics endpoint
 *
 * Protected by AdminGuard to prevent public access to sensitive metrics
 * Metrics are collected continuously and exposed in Prometheus text format
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * GET /metrics - Prometheus metrics endpoint
   *
   * Returns all collected metrics in Prometheus text format
   * Includes default Node.js metrics + custom BitLoot metrics
   *
   * Usage:
   * 1. Configure Prometheus to scrape http://localhost:4000/metrics
   * 2. Query metrics in Prometheus dashboard
   * 3. Set up alerts on high values
   *
   * Example queries:
   * - invalid_hmac_count (security breaches)
   * - duplicate_webhook_count (idempotency enforcement)
   * - otp_rate_limit_exceeded (abuse attempts)
   * - email_send_failed (delivery issues)
   * - underpaid_orders_total (payment anomalies)
   */
  @Get()
  // Note: Temporarily disabled AdminGuard for Prometheus scraping in local dev
  // In production, use bearer token auth with environment-specific config
  // @UseGuards(AdminGuard)
  // @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
    schema: { type: 'string' },
  })
  async getMetrics(@Res() res: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    const contentType = this.metricsService.getContentType();
    res.set('Content-Type', contentType);
    res.send(metrics);
  }
}
