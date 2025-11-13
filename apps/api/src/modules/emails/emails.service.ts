import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { SuppressionListService } from './suppression-list.service';
import { RetryService } from './retry.service';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

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
   *
   * @example
   * const headers = this.generateEmailHeaders('high');
   * // {
   * //   'Idempotency-Key': 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
   * //   'X-Priority': '1',
   * //   'X-MSMail-Priority': 'High',
   * //   'List-Unsubscribe': '<https://bitloot.io/unsubscribe?token=...>'
   * // }
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
   * Send OTP verification email via Resend API
   * Level 4: Transactional email for signup/login verification
   *
   * @param to Customer email address
   * @param code 6-digit OTP code
   * @returns Promise that resolves when email is sent
   * @throws Error if Resend API fails in production mode
   *
   * @example
   * await emailsService.sendOtpEmail('user@example.com', '123456');
   */
  async sendOtpEmail(to: string, code: string): Promise<void> {
    const html = `
      <p>Hi,</p>
      <p>Your BitLoot verification code is <strong>${code}</strong>.</p>
      <p>This code will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br/>The BitLoot Team</p>
    `;

    const headers = this.generateEmailHeaders('high');
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] OTP email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] Code: ${code} (expires in 5 minutes)`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    // Check suppression list (hard bounces)
    const isSuppressed = await this.suppressionList.isSuppressed(to);
    if (isSuppressed) {
      this.logger.warn(`⏭️  Skipping OTP email to suppressed address: ${to}`);
      return;
    }

    const startTime = Date.now();

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject: 'Your BitLoot OTP Code',
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
        5, // max 5 retry attempts
        (attempt, error) => {
          // Optional callback for retry tracking
          this.logger.warn(
            `Retrying OTP email (attempt ${attempt}) to ${to}: ${error.message}`,
          );
        },
      );

      const latencyMs = Date.now() - startTime;
      this.metricsService.recordEmailLatency('otp', latencyMs);
      this.metricsService.incrementEmailSendSuccess('otp');

      // Safe due to optional chaining and type cast
      this.logger.log(`✅ OTP email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'}, latency: ${latencyMs}ms)`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send OTP email to ${to}: ${errorMessage}`);
      this.metricsService.incrementEmailSendFailed('otp');
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   * Level 4: Transactional email for user onboarding
   *
   * @param to Customer email address
   * @param userName User's name or display name
   * @returns Promise that resolves when email is sent
   * @throws Error if Resend API fails in production mode
   *
   * @example
   * await emailsService.sendWelcomeEmail('user@example.com', 'John');
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const displayName = userName.length > 0 ? userName : 'there';
    
    const html = `
      <p>Hi ${displayName},</p>
      
      <p>Welcome to <strong>BitLoot</strong> — the crypto-first digital marketplace for instant key delivery!</p>
      
      <p><strong>What you can do on BitLoot:</strong></p>
      <ul>
        <li>🎮 Browse verified game keys and software licenses</li>
        <li>💳 Checkout with 300+ cryptocurrencies (Bitcoin, Ethereum, etc.)</li>
        <li>⚡ Receive your keys instantly — no waiting</li>
        <li>🔒 Secure, encrypted storage with signed download links</li>
      </ul>
      
      <p><strong>Getting Started:</strong></p>
      <ol>
        <li>Browse our catalog at <a href="https://bitloot.io">bitloot.io</a></li>
        <li>Add items to your cart</li>
        <li>Checkout with your preferred cryptocurrency</li>
        <li>Receive your keys instantly in your email</li>
      </ol>
      
      <p><strong>Quick Tips:</strong></p>
      <ul>
        <li>Your account is now active and ready to shop</li>
        <li>All payments are processed via secure blockchain transactions</li>
        <li>Keys are encrypted and never stored in plaintext</li>
        <li>Need help? Visit our <a href="https://bitloot.io/support">Support Center</a></li>
      </ul>
      
      <p>We're excited to have you onboard. Happy shopping!</p>
      <p>Best regards,<br/><strong>The BitLoot Team</strong></p>
      
      <hr/>
      <small>You received this email because you created a BitLoot account. <a href="https://bitloot.io/unsubscribe?email=${to}">Manage preferences</a></small>
    `;

    const headers = this.generateEmailHeaders('high');
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] Welcome email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] User name: ${displayName}`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject: `Welcome to BitLoot, ${displayName}!`,
        html,
      };

      const response = await firstValueFrom(
        this.httpService.post('/emails', payload, {
          baseURL: this.resendBaseUrl,
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Idempotency-Key': idempotencyKey,
            'X-Priority': headers['X-Priority'],
            'X-MSMail-Priority': headers['X-MSMail-Priority'],
          },
        }),
      );

      this.metricsService.incrementEmailSendSuccess('welcome');
      // Safe due to optional chaining and type cast
      this.logger.log(`✅ Welcome email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send welcome email to ${to}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   * Level 4: Transactional email for new orders with payment details
   *
   * @param to Customer email address
   * @param data { orderId, total, currency, items[], paymentLink }
   * @returns Promise that resolves when email is sent
   * @throws Error if Resend API fails in production mode
   *
   * @example
   * await emailsService.sendOrderConfirmation('user@example.com', {
   *   orderId: 'uuid-123',
   *   total: '0.05',
   *   currency: 'ETH',
   *   items: [{ name: 'Game Key', price: '0.05' }],
   *   paymentLink: 'https://nowpayments.io/invoice/...'
   * });
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
    const { orderId, total, currency, items, paymentLink } = data;
    const shortOrderId = orderId.substring(0, 8);
    const itemsList = items
      .map((item) => {
        const price = item.price ?? null;
        const priceStr = price !== null ? ` (${price} ${currency})` : '';
        return `<li>${item.name}${priceStr}</li>`;
      })
      .join('');

    const html = `
      <p>Hi,</p>
      
      <p>Thank you for your order! Your BitLoot purchase is ready for payment.</p>
      
      <p><strong>Order Details:</strong></p>
      <ul>
        <li><strong>Order ID:</strong> #${shortOrderId}</li>
        <li><strong>Items:</strong>
          <ul>
            ${itemsList}
          </ul>
        </li>
        <li><strong>Total:</strong> <strong>${total} ${currency}</strong></li>
      </ul>
      
      <p style="margin: 20px 0;">
        <a href="${paymentLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Pay Now with Crypto
        </a>
      </p>
      
      <p><strong>Important Information:</strong></p>
      <ul>
        <li>⏰ Payment link expires in 30 minutes</li>
        <li>💰 We accept 300+ cryptocurrencies (BTC, ETH, XRP, BNB, USDT, etc.)</li>
        <li>⚠️ <strong>Underpayments are non-refundable</strong> due to blockchain immutability</li>
        <li>✅ Once payment is confirmed, your keys will be delivered instantly</li>
        <li>🔒 Keys are never stored in plaintext and delivered via 15-minute secure links only</li>
      </ul>
      
      <p><strong>What happens next:</strong></p>
      <ol>
        <li>Click the payment button above</li>
        <li>Choose your cryptocurrency and send the exact amount</li>
        <li>Wait for blockchain confirmation (typically 1-5 minutes)</li>
        <li>Receive your keys instantly via secure email link</li>
      </ol>
      
      <p>Questions? Visit our <a href="https://bitloot.io/faq">FAQ</a> or <a href="https://bitloot.io/support">Support Center</a>.</p>
      <p>Best regards,<br/><strong>The BitLoot Team</strong></p>
      
      <hr/>
      <small>This is an automated message. Do not reply to this email.</small>
    `;

    const headers = this.generateEmailHeaders('high');
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] Order confirmation email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] Order ID: ${orderId}`);
      this.logger.debug(`[MOCK EMAIL] Total: ${total} ${currency}`);
      this.logger.debug(`[MOCK EMAIL] Items: ${items.length}`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject: `Order Confirmation #${shortOrderId} - BitLoot`,
        html,
      };

      const response = await firstValueFrom(
        this.httpService.post('/emails', payload, {
          baseURL: this.resendBaseUrl,
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Idempotency-Key': idempotencyKey,
            'X-Priority': headers['X-Priority'],
            'X-MSMail-Priority': headers['X-MSMail-Priority'],
          },
        }),
      );

      this.metricsService.incrementEmailSendSuccess('payment_created');
      // Safe due to optional chaining and type cast
      this.logger.log(`✅ Order confirmation email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send order confirmation email to ${to}: ${errorMessage}`);
      this.metricsService.incrementEmailSendFailed('payment_created');
      throw error;
    }
  }

  /**
   * Send order completion/fulfillment email with key delivery link
   * Level 4: Transactional email for successful fulfillment with secure download
   *
   * @param to Customer email address
   * @param data { orderId, productName, downloadUrl, expiresIn }
   * @returns Promise that resolves when email is sent
   * @throws Error if Resend API fails in production mode
   *
   * @example
   * await emailsService.sendOrderCompleted('user@example.com', {
   *   orderId: 'uuid-123',
   *   productName: 'The Witcher 3',
   *   downloadUrl: 'https://r2.bitloot.io/signed/...',
   *   expiresIn: '15 minutes'
   * });
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
    const { orderId, productName, downloadUrl, expiresIn = '15 minutes' } = data;
    const shortOrderId = orderId.substring(0, 8);

    const html = `
      <p>Hi,</p>
      
      <p>🎉 <strong>Your order has been fulfilled!</strong></p>
      
      <p>Your purchase of <strong>${productName}</strong> is ready to download.</p>
      
      <p style="margin: 20px 0;">
        <a href="${downloadUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Download Your Key
        </a>
      </p>
      
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Order ID: #${shortOrderId}</li>
        <li>Product: ${productName}</li>
        <li>Status: ✅ Completed</li>
      </ul>
      
      <p><strong>⚠️ Important Security Notice:</strong></p>
      <ul>
        <li>🔗 Your download link expires in <strong>${expiresIn}</strong></li>
        <li>🔒 The link is encrypted and only accessible by you</li>
        <li>📝 We never email plaintext keys — always use the secure link</li>
        <li>🚫 Do not share this link with others</li>
        <li>💾 Save your key immediately after downloading</li>
      </ul>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Click the button above to download your key</li>
        <li>Save the key file in a secure location</li>
        <li>Activate your product using the provided instructions</li>
        <li>If you need help, visit our <a href="https://bitloot.io/support">Support Center</a></li>
      </ol>
      
      <p><strong>Can't access your key?</strong></p>
      <p>Visit your <a href="https://bitloot.io/account/orders">order history</a> to regenerate the download link (available 24 hours).</p>
      
      <p>Thank you for shopping with BitLoot!</p>
      <p>Best regards,<br/><strong>The BitLoot Team</strong></p>
      
      <hr/>
      <small>This is an automated message. Do not reply to this email. <a href="https://bitloot.io/unsubscribe?email=${to}">Unsubscribe</a></small>
    `;

    const headers = this.generateEmailHeaders('high');
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] Order completed email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] Order ID: ${orderId}`);
      this.logger.debug(`[MOCK EMAIL] Product: ${productName}`);
      this.logger.debug(`[MOCK EMAIL] Download URL: ${downloadUrl}`);
      this.logger.debug(`[MOCK EMAIL] Expires in: ${expiresIn}`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject: `Your BitLoot Key is Ready — Order #${shortOrderId}`,
        html,
      };

      const response = await firstValueFrom(
        this.httpService.post('/emails', payload, {
          baseURL: this.resendBaseUrl,
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Idempotency-Key': idempotencyKey,
            'X-Priority': headers['X-Priority'],
            'X-MSMail-Priority': headers['X-MSMail-Priority'],
          },
        }),
      );

      this.metricsService.incrementEmailSendSuccess('payment_completed');
      // Safe due to optional chaining and type cast
      this.logger.log(`✅ Order completed email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send order completed email to ${to}: ${errorMessage}`);
      this.metricsService.incrementEmailSendFailed('failed');
      throw error;
    }
  }

  /**
   * Send password reset email via Resend API
   * Level 4: Transactional email for password recovery
   *
   * @param to Customer email address
   * @param resetToken Password reset token (JWT format, 1-hour expiry)
   * @param resetLink Full reset link URL (frontend URL + token)
   * @returns Promise that resolves when email is sent
   * @throws Error if Resend API fails in production mode
   *
   * @example
   * await emailsService.sendPasswordResetEmail('user@example.com', 'jwt_token', 'https://bitloot.io/reset?token=...');
   */
  async sendPasswordResetEmail(to: string, resetToken: string, resetLink: string): Promise<void> {
    const html = `
      <p>Hi,</p>
      <p>We received a request to reset your BitLoot password. Click the link below to proceed:</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p><strong>Link expires in 1 hour.</strong> If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        For security: Never share this link with anyone. We will never ask for your password via email.
      </p>
      <p>Best regards,<br/>The BitLoot Team</p>
    `;

    const headers = this.generateEmailHeaders('high');
    const idempotencyKey = headers['Idempotency-Key'];

    // In mock mode, just log
    if (this.resendApiKey.length === 0) {
      this.logger.log(`[MOCK EMAIL] Password reset email to ${to}`);
      this.logger.debug(`[MOCK EMAIL] Reset Link: ${resetLink}`);
      this.logger.debug(`[MOCK EMAIL] Token: ${resetToken.slice(0, 20)}...`);
      this.logger.debug(`[MOCK EMAIL] Idempotency-Key: ${idempotencyKey}`);
      return;
    }

    try {
      const payload = {
        from: this.from,
        to: [to],
        subject: 'Reset Your BitLoot Password',
        html,
      };

      const response = await firstValueFrom(
        this.httpService.post('/emails', payload, {
          baseURL: this.resendBaseUrl,
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Idempotency-Key': idempotencyKey,
            'X-Priority': headers['X-Priority'],
            'X-MSMail-Priority': headers['X-MSMail-Priority'],
          },
        }),
      );

      this.metricsService.incrementEmailSendSuccess('welcome');
      // Safe due to optional chaining and type cast
      this.logger.log(`✅ Password reset email sent to ${to} (ID: ${(response.data as { id?: string })?.id ?? 'unknown'})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send password reset email to ${to}: ${errorMessage}`);
      this.metricsService.incrementEmailSendFailed('failed');
      throw error;
    }
  }

  /**
   * Send underpayment notice email
   * Level 4: Notification for underpaid crypto payments
   *
   * @param to Customer email address
   * @param data { orderId, amountSent, amountRequired }
   * @returns Promise that resolves when email is queued
   */
  sendUnderpaidNotice(
    to: string,
    data: { orderId: string; amountSent?: string; amountRequired?: string },
  ): Promise<void> {
    const { orderId, amountSent, amountRequired } = data;

    const html = `
      <h2>BitLoot Payment Underpaid — Non-Refundable</h2>
      <p>Dear Customer,</p>
      <p>We received your payment for order <strong>#${orderId.substring(0, 8)}</strong>, but the amount was insufficient.</p>
      
      <p><strong>Payment Status: FAILED & NON-REFUNDABLE</strong></p>
      
      <p>Details:</p>
      <ul>
        <li>Amount Sent: <strong>${amountSent ?? 'N/A'}</strong></li>
        <li>Amount Required: <strong>${amountRequired ?? 'N/A'}</strong></li>
      </ul>
      
      <p><strong>Why is this non-refundable?</strong></p>
      <p>Blockchain transactions are irreversible. Our payment processor (NOWPayments) cannot refund underpaid amounts due to the nature of cryptocurrency transactions.</p>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Check your wallet for the transaction confirmation</li>
        <li>If you need assistance, please contact our support team</li>
        <li>To place a new order, please start fresh and send the exact amount</li>
      </ol>
      
      <p>We're sorry we couldn't complete this order. Our support team is here to help if you have questions.</p>
      <p>Best regards,<br/>The BitLoot Team</p>
      
      <hr/>
      <small>This is an automated message. Do not reply to this email. Visit our <a href="https://bitloot.io/support">Support Center</a> for help.</small>
    `;

    // Generate delivery headers (Idempotency-Key, X-Priority set to HIGH for important notice)
    const headers = this.generateEmailHeaders('high');

    this.logger.log(
      `[MOCK EMAIL - LEVEL 4] Sending underpaid notice to ${to} for order ${orderId}`,
    );
    this.logger.debug(
      `[MOCK EMAIL - LEVEL 4] Underpaid amount - sent: ${amountSent}, required: ${amountRequired}`,
    );
    this.logger.debug(`[MOCK EMAIL - LEVEL 4] Headers: ${JSON.stringify(headers)}`);
    this.logger.debug(`[MOCK EMAIL - LEVEL 4] HTML: ${html}`);
    this.metricsService.incrementEmailSendFailed('underpaid');

    // Level 4: Mock sending (will integrate with Resend in production)
    // In production, use Idempotency-Key header in headers object to prevent duplicate sends
    return Promise.resolve();
  }

  /**
   * Send failed payment notice email
   * Level 4: Notification for failed payments (non-underpayment failures)
   *
   * @param to Customer email address
   * @param data { orderId, reason }
   * @returns Promise that resolves when email is queued
   */
  sendPaymentFailedNotice(to: string, data: { orderId: string; reason?: string }): Promise<void> {
    const { orderId, reason } = data;

    const html = `
      <h2>BitLoot Payment Failed</h2>
      <p>Dear Customer,</p>
      <p>Your payment for order <strong>#${orderId.substring(0, 8)}</strong> could not be processed.</p>
      
      <p><strong>Reason:</strong> ${reason ?? 'Payment processing error'}</p>
      
      <p><strong>What happens next?</strong></p>
      <p>Your order has been cancelled and no funds have been charged. You can:</p>
      <ul>
        <li>Try placing a new order with a different payment method</li>
        <li>Contact our support team for assistance</li>
      </ul>
      
      <p>We apologize for the inconvenience. Our support team is here to help.</p>
      <p>Best regards,<br/>The BitLoot Team</p>
      
      <hr/>
      <small>This is an automated message. Do not reply to this email. Visit our <a href="https://bitloot.io/support">Support Center</a> for help.</small>
    `;

    // Generate delivery headers (Idempotency-Key, X-Priority set to HIGH for important notice)
    const headers = this.generateEmailHeaders('high');

    this.logger.log(
      `[MOCK EMAIL - LEVEL 4] Sending payment failed notice to ${to} for order ${orderId}`,
    );
    this.logger.debug(`[MOCK EMAIL - LEVEL 4] Failure reason: ${reason ?? 'unknown'}`);
    this.logger.debug(`[MOCK EMAIL - LEVEL 4] Headers: ${JSON.stringify(headers)}`);
    this.logger.debug(`[MOCK EMAIL - LEVEL 4] HTML: ${html}`);
    this.metricsService.incrementEmailSendFailed('failed');

    // Level 4: Mock sending (will integrate with Resend in production)
    return Promise.resolve();
  }
}
