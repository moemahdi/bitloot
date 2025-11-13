import { Injectable, Logger } from '@nestjs/common';
import { Repository, type DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailBounce } from '../../database/entities/email-bounce.entity';

/**
 * Email Suppression List Service
 * Manages bounce history and prevents sending to addresses with hard bounces
 *
 * Bounce Types:
 * - hard: Permanent delivery failure (invalid email, blocked sender) - NEVER send again
 * - soft: Temporary failure (mailbox full, server down) - Retry after 24h
 * - complaint: User complained (spam report) - Manual review needed
 */
@Injectable()
export class SuppressionListService {
  private readonly logger = new Logger(SuppressionListService.name);

  constructor(
    @InjectRepository(EmailBounce)
    private readonly bounceRepo: Repository<EmailBounce>,
  ) {}

  /**
   * Check if email address is suppressed (hard bounce)
   * Hard bounces should never be sent to again
   *
   * @param email Email address to check
   * @returns true if email has hard bounce history, false otherwise
   */
  async isSuppressed(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    const hardBounce = await this.bounceRepo.findOneBy({
      email: normalizedEmail,
      type: 'hard',
    });

    if (hardBounce !== null) {
      this.logger.debug(`⏭️  Email suppressed (hard bounce): ${normalizedEmail}`);
      return true;
    }

    return false;
  }

  /**
   * Add bounce record for email address
   *
   * @param email Email address
   * @param type Bounce type: 'hard', 'soft', or 'complaint'
   * @param reason Bounce reason (optional)
   * @param externalBounceId Reference ID from Resend (optional)
   */
  async addBounce(
    email: string,
    type: 'hard' | 'soft' | 'complaint',
    reason?: string,
    externalBounceId?: string,
  ): Promise<EmailBounce> {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

    // Check if bounce already exists (idempotency)
    const existing = await this.bounceRepo.findOneBy({
      email: normalizedEmail,
      type,
    });

    if (existing !== null) {
      this.logger.debug(`📝 Bounce record already exists: ${normalizedEmail} (${type})`);
      return existing;
    }

    // Create new bounce record (use DeepPartial to avoid overload ambiguity)
    const bounceData: DeepPartial<EmailBounce> = {
      email: normalizedEmail,
      type,
      reason: reason ?? undefined,
      externalBounceId: externalBounceId ?? undefined,
      bouncedAt: new Date(),
    };

    const bounce = this.bounceRepo.create(bounceData);

  const saved = await this.bounceRepo.save(bounce);
  const reasonSuffix = reason != null ? ` - ${reason}` : '';
  this.logger.log(`📬 Bounce recorded: ${normalizedEmail} (type: ${type})${reasonSuffix}`);

    return saved;
  }

  /**
   * Get bounce history for email address
   *
   * @param email Email address
   * @returns Array of bounce records
   */
  async getBounceHistory(email: string): Promise<EmailBounce[]> {
    const history = await this.bounceRepo.find({
      where: {
        email: email.toLowerCase(),
      },
      order: {
        bouncedAt: 'DESC',
      },
    });

    return history;
  }

  /**
   * Get bounce statistics
   *
   * @returns Object with bounce counts by type
   */
  async getBounceStats(): Promise<{
    hardBounces: number;
    softBounces: number;
    complaints: number;
    totalUniqueDomains: number;
  }> {
    const bounces = await this.bounceRepo.find();

    const hardBounces = bounces.filter((b) => b.type === 'hard').length;
    const softBounces = bounces.filter((b) => b.type === 'soft').length;
    const complaints = bounces.filter((b) => b.type === 'complaint').length;

    // Count unique domains
    const domains = new Set(
      bounces.map((b) => {
        const domain = b.email.split('@')[1];
        return domain ?? 'unknown';
      }),
    );

    return {
      hardBounces,
      softBounces,
      complaints,
      totalUniqueDomains: domains.size,
    };
  }

  /**
   * Clear soft bounce after 24h retry window
   * (Called by scheduled job after 24h delay)
   *
   * @param email Email address
   */
  async clearSoftBounce(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    const softBounce = await this.bounceRepo.findOne({
      where: {
        email: normalizedEmail,
        type: 'soft',
      },
    });

    if (softBounce !== null) {
      await this.bounceRepo.remove(softBounce);
      this.logger.log(`✅ Soft bounce cleared (24h retry window): ${email}`);
    }
  }

  /**
   * Remove bounce record (admin operation)
   * Use with caution - only if address confirmed as valid
   *
   * @param email Email address
   * @param type Optional: specific bounce type to remove
   */
  async removeBounce(email: string, type?: 'hard' | 'soft' | 'complaint'): Promise<number> {
    const normalizedEmail = email.toLowerCase();

    if (type !== null && type !== undefined) {
      const deleted = await this.bounceRepo.delete({
        email: normalizedEmail,
        type,
      });
      return deleted.affected ?? 0;
    }

    // Remove all bounce records for this email
    const deleted = await this.bounceRepo.delete({
      email: normalizedEmail,
    });
    return deleted.affected ?? 0;
  }
}
