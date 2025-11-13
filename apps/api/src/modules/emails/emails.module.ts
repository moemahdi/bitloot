import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsService } from './emails.service';
import { EmailUnsubscribeService } from './services/email-unsubscribe.service';
import { EmailUnsubscribeController } from './controllers/email-unsubscribe.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { RetryService } from './retry.service';
import { SuppressionListService } from './suppression-list.service';
import { EmailBounce } from '../../database/entities/email-bounce.entity';

/**
 * Emails Module
 *
 * Centralized email service for:
 * - OTP verification (Level 4)
 * - Password reset (Level 4)
 * - Order confirmations
 * - Payment status notifications (Level 4)
 * - Email unsubscribe management (Level 4, RFC 8058)
 * - Email retry with exponential backoff (Level 4)
 * - Bounce handling & suppression list (Level 4)
 *
 * Level 1: Mock implementation
 * Level 4+:
 *   - Resend API integration (real email delivery)
 *   - Exponential backoff retry (2s, 4s, 8s, 16s, 32s)
 *   - Bounce tracking & hard bounce suppression
 *   - Structured logging for email events
 *   - RFC 8058 one-click unsubscribe
 *   - Email priority headers (X-Priority, X-MSMail-Priority)
 *   - Idempotency keys for replay prevention
 *   - Email metrics (latency, success/failure, bounce rate)
 */
@Module({
  imports: [HttpModule, MetricsModule, TypeOrmModule.forFeature([EmailBounce])],
  providers: [EmailsService, EmailUnsubscribeService, RetryService, SuppressionListService],
  exports: [EmailsService, EmailUnsubscribeService, SuppressionListService],
  controllers: [EmailUnsubscribeController],
})
export class EmailsModule {}
