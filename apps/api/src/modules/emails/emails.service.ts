import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { SuppressionListService } from './suppression-list.service';
import { RetryService } from './retry.service';
import { FeatureFlagsService } from '../admin/feature-flags.service';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

// Import centralized email templates
import {
  EmailTemplates,
  type OtpEmailParams,
  type WelcomeEmailParams,
  type OrderConfirmationParams,
  type KeyDeliveryParams,
  type PasswordResetParams,
  type UnderpaymentParams,
  type PaymentFailedParams,
  type PaymentExpiredParams,
  type EmailChangedOldParams,
  type EmailChangedNewParams,
  type DeletionScheduledParams,
  type DeletionCancelledParams,
  type GenericEmailParams,
} from './templates';

// ========== EMAIL DEDUPLICATION CACHE ==========
// Prevents duplicate order confirmation emails within a short window
const emailDeduplicationCache = new Map<string, { sentAt: number }>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  for (const [key, value] of emailDeduplicationCache.entries()) {
    if (now - value.sentAt > EXPIRY_MS) {
      emailDeduplicationCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Email headers for enhanced deliverability and standards compliance
 * Used by Resend API when sending transactional emails
 */
interface EmailHeaders {
  /** Idempotency-Key: UUID v4 for preventing duplicate sends on retry */
  'Idempotency-Key': string;
  /** X-Priority: 1 = Highest priority */
  'X-Priority': '1' | '2' | '3' | '4' | '5';
  /** X-MSMail-Priority: High for Outlook compatibility */
  'X-MSMail-Priority': 'High' | 'Normal' | 'Low';
  /** List-Unsubscribe: RFC 2369 standard for email clients */
  'List-Unsubscribe'?: string;
}

/**
 * Resend API response structure (for reference, unused in mock mode)
 */
type _ResendResponse = {
  id: string;
  from: string;
  to: string[];
  created_at: string;
};

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly from = process.env.EMAIL_FROM ?? 'orders@bitloot.io';
  private readonly resendApiKey: string;
  private readonly resendBaseUrl = 'https://api.resend.com';
  private readonly isProduction: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly suppressionList: SuppressionListService,
    private readonly retry: RetryService,
    @Inject(forwardRef(() => FeatureFlagsService))
    private readonly featureFlagsService: FeatureFlagsService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    if (this.resendApiKey.length > 0) {
      this.logger.log('✅ EmailsService initialized with Resend API integration (PRODUCTION MODE)');
    } else {
      this.logger.warn('⚠️  EmailsService initialized in MOCK mode (no RESEND_API_KEY configured)');
    }
  }

  /**
   * Generate email headers for enhanced deliverability
   * Used by Resend API to prevent duplicates and prioritize important emails
   *
   * @param priority 'high' | 'normal' | 'low' - Email priority level
   * @param unsubscribeUrl Optional unsubscribe URL for marketing emails
   * @returns Headers object for Resend API
   */
  private generateEmailHeaders(priority: 'high' | 'normal' | 'low' = 'high', unsubscribeUrl?: string): EmailHeaders {
    const priorityMap = {
      high: '1' as const,
      normal: '3' as const,
      low: '5' as const,
    };

    const mspPriorityMap = {
      high: 'High' as const,
      normal: 'Normal' as const,
      low: 'Low' as const,
    };

    const headers: EmailHeaders = {
      'Idempotency-Key': randomUUID(),
      'X-Priority': priorityMap[priority],
      'X-MSMail-Priority': mspPriorityMap[priority],
    };

    if (unsubscribeUrl !== undefined) {
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
    }

    return headers;
  }

  /**
   * Core email sending method using Resend API
   * All other send methods use this internally
   */
  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    options: {
      priority?: 'high' | 'normal' | 'low';
      emailType: string;
      skipSuppressionCheck?: boolean;
      maxRetries?: number;
    },
  ): Promise<void> {
    const { priority = 'high', emailType, skipSuppressionCheck = false, maxRetries = 3 } = options;
    const headers = this.generateEmailHeaders(priority);
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] ${emailType} email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] Subject: ${subject}`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    // Check suppression list (hard bounces)
    if (!skipSuppressionCheck) {
      const isSuppressed = await this.suppressionList.isSuppressed(to);
      if (isSuppressed) {
        this.logger.warn(`⏭️  Skipping ${emailType} email to suppressed address: ${to}`);
        return;
      }
    }

    const startTime = Date.now();

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject,
        html,
      };

      // Use retry service for resilient delivery
      const response = await this.retry.executeWithRetry(
        () =>
          this.httpService.post('/emails', payload, {
            baseURL: this.resendBaseUrl,
            headers: {
              Authorization: `Bearer ${this.resendApiKey}`,
              'Idempotency-Key': idempotencyKey,
              'X-Priority': headers['X-Priority'],
              'X-MSMail-Priority': headers['X-MSMail-Priority'],
            },
          }),
        maxRetries,
        (attempt, error) => {
          this.logger.warn(`Retrying ${emailType} email (attempt ${attempt}) to ${to}: ${error.message}`);
        },
      );

      const latencyMs = Date.now() - startTime;
      this.metricsService.recordEmailLatency(emailType, latencyMs);
      this.metricsService.incrementEmailSendSuccess(emailType);

      this.logger.log(`✅ ${emailType} email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'}, latency: ${latencyMs}ms)`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send ${emailType} email to ${to}: ${errorMessage}`);
      this.metricsService.incrementEmailSendFailed(emailType);
      throw error;
    }
  }

  // ============================================================
  // PUBLIC EMAIL METHODS - Using Centralized Templates
  // ============================================================

  /**
   * Send OTP verification email
   * @param to Customer email address
   * @param code 6-digit OTP code
   */
  async sendOtpEmail(to: string, code: string): Promise<void> {
    const params: OtpEmailParams = { code, email: to };
    const { subject, html } = EmailTemplates.otpVerification(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'otp',
      priority: 'high',
      maxRetries: 5,
    });
  }

  /**
   * Send welcome email to new users
   * @param to Customer email address
   * @param userName User's name or display name
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const displayName = userName.length > 0 ? userName : 'there';
    const params: WelcomeEmailParams = { displayName, email: to };
    const { subject, html } = EmailTemplates.welcome(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'welcome',
      priority: 'high',
    });
  }

  /**
   * Send order confirmation email
   * @param to Customer email address
   * @param data Order details
   */
  async sendOrderConfirmation(
    to: string,
    data: {
      orderId: string;
      total: string;
      currency: string;
      items: Array<{ name: string; price?: string }>;
      paymentLink: string;
    },
  ): Promise<void> {
    // Feature flag check
    if (!this.featureFlagsService.isEnabled('email_notifications_enabled')) {
      this.logger.log(`⏭️  Email notifications disabled - skipping order confirmation email`);
      return;
    }

    const { orderId, total, currency, items, paymentLink } = data;
    
    // Email deduplication check
    const dedupeKey = `order-confirmation:${orderId}`;
    const cached = emailDeduplicationCache.get(dedupeKey);
    if (cached !== undefined) {
      const shortOrderId = orderId.substring(0, 8);
      this.logger.log(`⏭️  Skipping duplicate order confirmation email for order ${shortOrderId} (sent ${Math.round((Date.now() - cached.sentAt) / 1000)}s ago)`);
      return;
    }

    const params: OrderConfirmationParams = {
      orderId,
      items: items.map(item => ({
        name: item.name,
        quantity: 1,
        price: item.price ?? total,
      })),
      total,
      currency,
      paymentLink,
      email: to,
    };
    const { subject, html } = EmailTemplates.orderConfirmation(params);
    
    // Cache before sending to prevent duplicates during send
    emailDeduplicationCache.set(dedupeKey, { sentAt: Date.now() });
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'payment_created',
      priority: 'high',
    });
  }

  /**
   * Send order completion/fulfillment email with key delivery link
   * @param to Customer email address
   * @param data Order and download details
   */
  async sendOrderCompleted(
    to: string,
    data: {
      orderId: string;
      productName: string;
      downloadUrl: string;
      expiresIn?: string;
    },
  ): Promise<void> {
    // Feature flag check
    if (!this.featureFlagsService.isEnabled('email_notifications_enabled')) {
      this.logger.log(`⏭️  Email notifications disabled - skipping order completed email`);
      return;
    }

    const { orderId, productName, downloadUrl, expiresIn = '3 hours' } = data;

    const params: KeyDeliveryParams = {
      orderId,
      productName,
      downloadUrl,
      expiresIn,
      email: to,
    };
    const { subject, html } = EmailTemplates.keyDelivery(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'payment_completed',
      priority: 'high',
    });
  }

  /**
   * Send password reset email
   * @param to Customer email address
   * @param resetToken Password reset token
   * @param resetLink Full reset link URL
   */
  async sendPasswordResetEmail(to: string, resetToken: string, resetLink: string): Promise<void> {
    const params: PasswordResetParams = { resetLink, email: to };
    const { subject, html } = EmailTemplates.passwordReset(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'password_reset',
      priority: 'high',
    });
  }

  /**
   * Send underpayment notice email
   * @param to Customer email address
   * @param data Payment details
   */
  async sendUnderpaidNotice(
    to: string,
    data: { orderId: string; amountSent?: string; amountRequired?: string },
  ): Promise<void> {
    const { orderId, amountSent, amountRequired } = data;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const orderStatusUrl = `${frontendUrl}/orders/${orderId}/status`;

    const params: UnderpaymentParams = {
      orderId,
      amountSent: amountSent ?? 'N/A',
      amountRequired: amountRequired ?? 'N/A',
      orderStatusUrl,
      email: to,
    };
    const { subject, html } = EmailTemplates.underpaymentNotice(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'underpaid',
      priority: 'high',
    });
  }

  /**
   * Send failed payment notice email
   * @param to Customer email address
   * @param data Failure details
   */
  async sendPaymentFailedNotice(to: string, data: { orderId: string; reason?: string }): Promise<void> {
    const { orderId, reason } = data;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const orderStatusUrl = `${frontendUrl}/orders/${orderId}/status`;

    const params: PaymentFailedParams = {
      orderId,
      reason: reason ?? 'Payment processing error',
      orderStatusUrl,
      email: to,
    };
    const { subject, html } = EmailTemplates.paymentFailed(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'failed',
      priority: 'high',
    });
  }

  /**
   * Send expired payment notice email
   * @param to Customer email address
   * @param data Expiration details
   */
  async sendPaymentExpiredNotice(to: string, data: { orderId: string; reason?: string }): Promise<void> {
    const { orderId, reason } = data;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const retryUrl = `${frontendUrl}/checkout`;

    const params: PaymentExpiredParams = {
      orderId,
      reason: reason ?? 'Payment window timed out (1 hour)',
      retryUrl,
      email: to,
    };
    const { subject, html } = EmailTemplates.paymentExpired(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'expired',
      priority: 'normal',
    });
  }

  /**
   * Send email changed notification (to old email)
   * @param oldEmail Previous email address
   * @param newEmail New email address
   */
  async sendEmailChangedOld(oldEmail: string, newEmail: string): Promise<void> {
    const params: EmailChangedOldParams = { oldEmail, newEmail };
    const { subject, html } = EmailTemplates.emailChangedOld(params);
    
    await this.sendViaResend(oldEmail, subject, html, {
      emailType: 'email_changed',
      priority: 'high',
    });
  }

  /**
   * Send email changed welcome (to new email)
   * @param newEmail New email address
   */
  async sendEmailChangedNew(newEmail: string): Promise<void> {
    const params: EmailChangedNewParams = { newEmail };
    const { subject, html } = EmailTemplates.emailChangedNew(params);
    
    await this.sendViaResend(newEmail, subject, html, {
      emailType: 'email_changed',
      priority: 'high',
    });
  }

  /**
   * Send account deletion scheduled notification
   * @param to Customer email address
   * @param data Deletion details
   */
  async sendDeletionScheduled(
    to: string,
    data: { deletionDate: Date; daysRemaining: number; cancelUrl: string },
  ): Promise<void> {
    const params: DeletionScheduledParams = {
      email: to,
      deletionDate: data.deletionDate,
      daysRemaining: data.daysRemaining,
      cancelUrl: data.cancelUrl,
    };
    const { subject, html } = EmailTemplates.deletionScheduled(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'deletion_scheduled',
      priority: 'high',
    });
  }

  /**
   * Send account deletion cancelled notification
   * @param to Customer email address
   */
  async sendDeletionCancelled(to: string): Promise<void> {
    const params: DeletionCancelledParams = { email: to };
    const { subject, html } = EmailTemplates.deletionCancelled(params);
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'deletion_cancelled',
      priority: 'high',
    });
  }

  /**
   * Generic email sending method for custom emails
   * Used for ad-hoc emails not covered by templates
   *
   * @param options Email options
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<void> {
    const { to, subject, html, priority = 'normal' } = options;
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'generic',
      priority,
    });
  }

  /**
   * Send a generic templated email
   * Use this for custom emails that should use the BitLoot styling
   *
   * @param to Customer email address
   * @param params Generic email parameters
   */
  async sendGenericEmail(to: string, params: Omit<GenericEmailParams, 'email'>): Promise<void> {
    const { subject, html } = EmailTemplates.generic({ ...params, email: to });
    
    await this.sendViaResend(to, subject, html, {
      emailType: 'generic',
      priority: 'normal',
    });
  }
}
