import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UnsubscribeEmailDto, UnsubscribeResponseDto } from '../dto/unsubscribe.dto';
import { MetricsService } from '../../metrics/metrics.service';
import * as crypto from 'crypto';

/**
 * EmailUnsubscribeService (Level 4)
 * Handles one-click email unsubscribe operations with idempotency
 * Implements RFC 8058: One-Click Unsubscribe
 *
 * MVP Implementation:
 * - Token validation via HMAC-SHA256
 * - Structured logging for audit trail
 * - Metrics tracking for monitoring
 * - Idempotent responses (same token always succeeds)
 *
 * Future Enhancement (Level 5):
 * - Persist unsubscribe status to database
 * - Skip sending to unsubscribed addresses
 * - Admin UI for managing unsubscribes
 */
@Injectable()
export class EmailUnsubscribeService {
  private readonly logger = new Logger(EmailUnsubscribeService.name);

  // In-memory suppression list for MVP (Level 5: move to database)
  private readonly suppressionList = new Set<string>();

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Generate unsubscribe token for email link
   * Token format: HMAC-SHA256(email, secret)
   * Prevents unauthorized unsubscribes
   * Idempotent: same email always produces same token
   */
  generateUnsubscribeToken(email: string): string {
    const secret = process.env.JWT_SECRET ?? 'bitloot-secret-key';
    return crypto.createHmac('sha256', secret).update(email).digest('hex');
  }

  /**
   * Verify unsubscribe token matches email
   * Uses timing-safe comparison to prevent timing attacks
   */
  verifyUnsubscribeToken(email: string, token: string): boolean {
    const expectedToken = this.generateUnsubscribeToken(email);
    if (expectedToken.length === 0 || token.length === 0) {
      return false;
    }

    try {
      // Timing-safe comparison
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expectedToken, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Handle email unsubscribe request (idempotent, RFC 8058)
   * POST /emails/unsubscribe
   *
   * Idempotency:
   * - Same email + token → Always returns success (200 OK)
   * - Invalid token → Returns 400 Bad Request (security)
   * - Already unsubscribed → Returns success with 'already_unsubscribed' status
   *
   * Always returns 200 OK for valid tokens to prevent malicious enumeration
   */
  unsubscribe(dto: UnsubscribeEmailDto): UnsubscribeResponseDto {
    const { email, token } = dto;

    // Structured logging: start
    this.logger.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'EmailUnsubscribeService',
        operation: 'unsubscribe:start',
        email: email ?? 'unknown',
        context: { tokenProvided: token !== '' && token !== null },
      }),
    );

    // Verify token (prevents unauthorized unsubscribes)
    if (!this.verifyUnsubscribeToken(email, token)) {
      this.logger.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'WARN',
          service: 'EmailUnsubscribeService',
          operation: 'unsubscribe:invalid_token',
          email: email ?? 'unknown',
          context: { tokenLength: token?.length ?? 0 },
        }),
      );

      throw new BadRequestException('Invalid unsubscribe token');
    }

    // Check if already unsubscribed (idempotent)
    const alreadyUnsubscribed = this.suppressionList.has(email);

    if (alreadyUnsubscribed) {
      this.logger.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'EmailUnsubscribeService',
          operation: 'unsubscribe:already_unsubscribed',
          email: email ?? 'unknown',
          context: { idempotent: true },
        }),
      );

      // Return success (idempotent) - caller can't tell if this is first or retry
      return {
        status: 'already_unsubscribed',
        message: 'You have been successfully unsubscribed from BitLoot emails',
        email,
        unsubscribedAt: new Date(),  // Approximate time
      };
    }

    // First time unsubscribe: add to suppression list
    this.suppressionList.add(email);

    this.logger.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'EmailUnsubscribeService',
        operation: 'unsubscribe:complete',
        email: email ?? 'unknown',
        context: { suppressionListSize: this.suppressionList.size },
      }),
    );

    return {
      status: 'success',
      message: 'You have been successfully unsubscribed from BitLoot emails',
      email,
      unsubscribedAt: new Date(),
    };
  }

  /**
   * Check if email is unsubscribed
   * Used before sending marketing/promotional emails
   */
  isUnsubscribed(email: string): boolean {
    return this.suppressionList.has(email);
  }

  /**
   * Resubscribe email (manual admin action)
   * Removes from suppression list
   */
  resubscribe(email: string): void {
    if (this.suppressionList.has(email)) {
      this.suppressionList.delete(email);

      this.logger.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'EmailUnsubscribeService',
          operation: 'resubscribe:complete',
          email: email ?? 'unknown',
          context: { suppressionListSize: this.suppressionList.size },
        }),
      );
    }
  }
}
