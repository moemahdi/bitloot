import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreditsService } from './credits.service';
import { EmailsService } from '../emails/emails.service';

/**
 * Credits Expiry Cron Jobs
 *
 * Runs multiple daily jobs:
 * 1. 2 AM: Expire promo credits past their expiresAt date
 * 2. 3 AM: Reconcile credit balances (detect mismatches)
 * 3. 10 AM: Send warning emails for credits expiring in 7 days
 *
 * (V3) Also extends expiry for active users who purchased in last 30 days
 */
@Injectable()
export class CreditsExpiryService {
  private readonly logger = new Logger(CreditsExpiryService.name);

  constructor(
    private readonly creditsService: CreditsService,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Process credit expiry daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCreditExpiry(): Promise<void> {
    this.logger.log('Starting daily credit expiry check...');

    try {
      const expiredCount = await this.creditsService.expirePromoCredits();
      this.logger.log(`Credit expiry complete: ${expiredCount} expired`);
    } catch (error) {
      this.logger.error('Credit expiry job failed', error instanceof Error ? error.stack : error);
    }
  }

  /**
   * Reconcile credit balances daily at 3 AM
   * Detects mismatches between user_credits.promoBalance and sum of transactions
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleReconciliation(): Promise<void> {
    this.logger.log('Starting daily credit reconciliation...');

    try {
      const result = await this.creditsService.reconcile();
      this.logger.log(`Reconciliation complete: ${result.checked} checked, ${result.mismatches} mismatches`);

      if (result.mismatches > 0) {
        this.logger.warn(`⚠️ Found ${result.mismatches} credit balance mismatches during reconciliation`);

        // Send admin notification email
        try {
          const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? 'admin@bitloot.io';
          await this.emailsService.sendCreditExpiryWarning(adminEmail, {
            expiringAmount: `${result.mismatches} mismatches found`,
            expiresAt: new Date().toISOString(),
            currentBalance: `${result.checked} users checked`,
          });
          this.logger.log(`Admin notification sent for ${result.mismatches} reconciliation mismatches`);
        } catch (emailError) {
          this.logger.error('Failed to send reconciliation mismatch admin notification:', emailError);
        }
      }
    } catch (error) {
      this.logger.error('Credit reconciliation job failed', error instanceof Error ? error.stack : error);
    }
  }

  /**
   * Send expiry warning emails daily at 10 AM
   * Warns users whose promo credits are expiring within 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleExpiryWarnings(): Promise<void> {
    this.logger.log('Starting credit expiry warning emails...');

    try {
      const usersWithExpiring = await this.creditsService.getUsersWithExpiringCredits(7);

      if (usersWithExpiring.length === 0) {
        this.logger.log('No users with expiring credits in the next 7 days');
        return;
      }

      this.logger.log(`Found ${usersWithExpiring.length} users with credits expiring in 7 days`);

      let sentCount = 0;
      let errorCount = 0;

      for (const user of usersWithExpiring) {
        try {
          await this.emailsService.sendCreditExpiryWarning(user.userEmail, {
            expiringAmount: user.expiringAmount.toFixed(2),
            expiresAt: user.expiresAt.toISOString(),
            currentBalance: user.currentBalance.toFixed(2),
          }, user.userId);
          sentCount++;
        } catch (emailError) {
          errorCount++;
          this.logger.error(
            `Failed to send expiry warning to ${user.userEmail}:`,
            emailError instanceof Error ? emailError.message : emailError,
          );
        }
      }

      this.logger.log(`Expiry warning emails complete: ${sentCount} sent, ${errorCount} errors`);
    } catch (error) {
      this.logger.error('Credit expiry warning job failed', error instanceof Error ? error.stack : error);
    }
  }
}
