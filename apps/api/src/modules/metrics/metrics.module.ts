import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * MetricsModule - Prometheus metrics collection
 *
 * Provides:
 * - MetricsService: Collects and manages metrics
 * - MetricsController: Exposes GET /metrics endpoint
 *
 * Metrics tracked:
 * 1. invalid_hmac_count - Webhook signature failures
 * 2. duplicate_webhook_count - Idempotency enforcement
 * 3. otp_rate_limit_exceeded - OTP rate limit violations
 * 4. otp_verification_failed - Failed OTP verifications
 * 5. email_send_failed - Email delivery failures
 * 6. underpaid_orders_total - Underpaid orders
 *
 * Usage:
 * - Inject MetricsService into any service
 * - Call increment methods when events occur
 * - Prometheus scrapes /metrics endpoint (admin protected)
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
