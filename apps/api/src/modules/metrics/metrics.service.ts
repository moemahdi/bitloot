import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from 'prom-client';

/**
 * MetricsService - Prometheus metrics collection for BitLoot
 *
 * Tracks critical operational metrics:
 * - Invalid HMAC signatures (webhook security)
 * - Duplicate webhooks (idempotency)
 * - OTP rate limits & failures (auth security)
 * - Email send failures & success (delivery reliability)
 * - Email bounce rates (sender reputation)
 * - Email send latency (performance)
 * - Underpaid orders (payment anomalies)
 */
@Injectable()
export class MetricsService {
  private invalidHmacCount!: Counter;
  private duplicateWebhookCount!: Counter;
  private otpRateLimitExceeded!: Counter;
  private otpVerificationFailed!: Counter;
  private emailSendFailed!: Counter;
  private emailSendSuccess!: Counter;
  private emailBounceRate!: Gauge;
  private emailLatency!: Histogram;
  private underpaidOrdersTotal!: Counter;
  
  private static initialized = false;
  private static instance: MetricsService;

  constructor() {
    // Singleton pattern: initialize metrics only once globally
    if (!MetricsService.initialized) {
      this.initializeMetrics();
      MetricsService.initialized = true;
      MetricsService.instance = this;
    } else {
      // On subsequent instantiations, reuse the existing instance's metrics
      const existingInstance = MetricsService.instance;
      this.invalidHmacCount = existingInstance.invalidHmacCount;
      this.duplicateWebhookCount = existingInstance.duplicateWebhookCount;
      this.otpRateLimitExceeded = existingInstance.otpRateLimitExceeded;
      this.otpVerificationFailed = existingInstance.otpVerificationFailed;
      this.emailSendFailed = existingInstance.emailSendFailed;
      this.emailSendSuccess = existingInstance.emailSendSuccess;
      this.emailBounceRate = existingInstance.emailBounceRate;
      this.emailLatency = existingInstance.emailLatency;
      this.underpaidOrdersTotal = existingInstance.underpaidOrdersTotal;
    }
  }

  private initializeMetrics(): void {
    // Collect default metrics (nodejs_*, process_*, etc) - only once
    collectDefaultMetrics();

    // ============ WEBHOOK & SECURITY METRICS ============

    /**
     * Invalid HMAC Count: Tracks failed webhook signature verifications
     * High values indicate potential tampering or configuration issues
     */
    this.invalidHmacCount = new Counter({
      name: 'invalid_hmac_count',
      help: 'Total number of webhook requests with invalid HMAC signatures',
      labelNames: ['provider'], // 'nowpayments' or 'kinguin'
    });

    /**
     * Duplicate Webhook Count: Tracks idempotency enforcement
     * High values are normal (indicate retry logic working)
     */
    this.duplicateWebhookCount = new Counter({
      name: 'duplicate_webhook_count',
      help: 'Total number of duplicate webhooks detected and skipped',
      labelNames: ['provider', 'type'], // provider: 'nowpayments'/'kinguin', type: 'payment'/'fulfillment'
    });

    // ============ OTP & AUTH METRICS ============

    /**
     * OTP Rate Limit Exceeded: Tracks abuse attempts
     * Indicates suspicious activity or legitimate power users
     */
    this.otpRateLimitExceeded = new Counter({
      name: 'otp_rate_limit_exceeded',
      help: 'Total number of OTP request rate limit violations',
      labelNames: ['operation'], // 'issue' or 'verify'
    });

    /**
     * OTP Verification Failed: Tracks authentication failures
     * High values indicate wrong codes or brute-force attempts
     */
    this.otpVerificationFailed = new Counter({
      name: 'otp_verification_failed',
      help: 'Total number of failed OTP verification attempts',
      labelNames: ['reason'], // 'invalid_code' or 'expired'
    });

    // ============ EMAIL & DELIVERY METRICS ============

    /**
     * Email Send Failed: Tracks email delivery issues
     * Helps identify Resend API problems or configuration issues
     */
    this.emailSendFailed = new Counter({
      name: 'email_send_failed',
      help: 'Total number of failed email sends',
      labelNames: ['type'], // 'otp', 'payment_created', 'payment_completed', 'underpaid', 'failed'
    });

    /**
     * Email Send Success: Tracks successful email sends
     * Monitors delivery success rate
     */
    this.emailSendSuccess = new Counter({
      name: 'email_send_success',
      help: 'Total number of successful email sends',
      labelNames: ['type'], // 'otp', 'payment_created', 'payment_completed', 'underpaid', 'welcome'
    });

    /**
     * Email Bounce Rate: Percentage of emails bounced
     * Used to monitor sender reputation health
     * Hard bounces should be <1%, soft bounces <5%
     */
    this.emailBounceRate = new Gauge({
      name: 'email_bounce_rate_percent',
      help: 'Percentage of emails bounced (by type: hard/soft/complaint)',
      labelNames: ['type'], // 'hard', 'soft', 'complaint'
    });

    /**
     * Email Send Latency: Time taken to send email via Resend
     * Helps identify performance issues or API slowdowns
     */
    this.emailLatency = new Histogram({
      name: 'email_send_latency_ms',
      help: 'Email send latency in milliseconds',
      labelNames: ['type'], // 'otp', 'payment_created', 'payment_completed', etc
      buckets: [50, 100, 200, 500, 1000, 2000, 5000], // ms
    });

    // ============ PAYMENT & ORDER METRICS ============

    /**
     * Underpaid Orders Total: Tracks payment anomalies
     * Indicates market volatility or user error; non-refundable per policy
     */
    this.underpaidOrdersTotal = new Counter({
      name: 'underpaid_orders_total',
      help: 'Total number of orders marked as underpaid (non-refundable)',
      labelNames: ['asset'], // 'btc', 'eth', 'usdt', etc
    });
  }

  /**
   * Increment invalid HMAC counter
   * Call when webhook signature verification fails
   */
  incrementInvalidHmac(provider: string): void {
    this.invalidHmacCount.inc({ provider });
  }

  /**
   * Increment duplicate webhook counter
   * Call when idempotency check detects replayed webhook
   */
  incrementDuplicateWebhook(provider: string, type: string): void {
    this.duplicateWebhookCount.inc({ provider, type });
  }

  /**
   * Increment OTP rate limit counter
   * Call when OTP request exceeds rate limit (3 per 15 min)
   */
  incrementOtpRateLimit(operation: 'issue' | 'verify'): void {
    this.otpRateLimitExceeded.inc({ operation });
  }

  /**
   * Increment OTP verification failed counter
   * Call when OTP code doesn't match or is expired
   */
  incrementOtpVerificationFailed(reason: 'invalid_code' | 'expired'): void {
    this.otpVerificationFailed.inc({ reason });
  }

  /**
   * Increment email send failed counter
   * Call when Resend API call fails or times out
   */
  incrementEmailSendFailed(type: string): void {
    this.emailSendFailed.inc({ type });
  }

  /**
   * Increment email send success counter
   * Call when email successfully sent via Resend
   */
  incrementEmailSendSuccess(type: string): void {
    this.emailSendSuccess.inc({ type });
  }

  /**
   * Record email bounce rate (percentage)
   * Call periodically (e.g., via scheduled job) to update bounce rate gauge
   */
  recordEmailBounceRate(bounceType: 'hard' | 'soft' | 'complaint', percentage: number): void {
    this.emailBounceRate.set({ type: bounceType }, percentage);
  }

  /**
   * Record email send latency
   * Call after successful email send to track performance
   *
   * @param type Email type
   * @param latencyMs Time taken in milliseconds
   */
  recordEmailLatency(type: string, latencyMs: number): void {
    this.emailLatency.labels(type).observe(latencyMs);
  }

  /**
   * Increment underpaid orders counter
   * Call when order marked as underpaid (non-refundable)
   */
  incrementUnderpaidOrders(asset: string): void {
    this.underpaidOrdersTotal.inc({ asset });
  }

  /**
   * Get Prometheus metrics in text format
   * Exported at GET /metrics endpoint
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get metrics content type for HTTP response
   */
  getContentType(): string {
    return register.contentType;
  }
}
