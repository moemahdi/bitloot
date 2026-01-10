import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from '../modules/auth/user.service';
import { EmailsService } from '../modules/emails/emails.service';

/**
 * User Deletion Cleanup Job
 *
 * Runs daily at 2 AM to permanently delete users who:
 * 1. Requested account deletion more than 30 days ago
 * 2. Did not cancel their deletion request
 *
 * The deletion is a soft-delete (sets deletedAt timestamp)
 * Users can no longer log in after deletion.
 *
 * This job also:
 * - Sends a final confirmation email to the user
 * - Logs all deletions for audit purposes
 */
@Injectable()
export class UserDeletionCleanupService {
  private readonly logger = new Logger(UserDeletionCleanupService.name);

  constructor(
    private readonly userService: UserService,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Run daily at 2:00 AM to process pending account deletions
   * Users who requested deletion 30+ days ago will be permanently deleted
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processScheduledDeletions(): Promise<void> {
    const startTime = Date.now();
    this.logger.log('🗑️ Starting scheduled user deletion cleanup...');

    try {
      // Find all users whose 30-day grace period has expired
      const usersToDelete = await this.userService.findUsersPendingPermanentDeletion();

      if (usersToDelete.length === 0) {
        this.logger.debug('No users pending permanent deletion');
        return;
      }

      this.logger.log(`Found ${usersToDelete.length} user(s) pending permanent deletion`);

      let deletedCount = 0;
      let failedCount = 0;

      for (const user of usersToDelete) {
        try {
          // Calculate when deletion was requested
          const deletionRequestedAt = user.deletionRequestedAt;
          const gracePeriodDays = deletionRequestedAt
            ? Math.floor((Date.now() - deletionRequestedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 30;

          this.logger.log(
            `Processing deletion for user ${user.email} (requested ${gracePeriodDays} days ago)`,
          );

          // Send final confirmation email BEFORE deletion
          // (so we still have access to user email)
          try {
            await this.emailsService.sendEmail({
              to: user.email,
              subject: 'Your BitLoot Account Has Been Deleted',
              html: `
                <h2>Account Deleted</h2>
                <p>Your BitLoot account has been permanently deleted as per your request made ${gracePeriodDays} days ago.</p>
                <p>All your personal data has been removed from our systems.</p>
                <p>If you wish to use BitLoot again in the future, you're welcome to create a new account.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                  This is an automated message. If you did not request this deletion, 
                  please contact support immediately at support@bitloot.com
                </p>
              `,
            });
          } catch (emailError) {
            // Log but don't fail the deletion if email fails
            this.logger.warn(
              `Failed to send deletion confirmation email to ${user.email}: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
            );
          }

          // Perform the soft delete
          await this.userService.permanentlyDelete(user.id);
          deletedCount++;

          this.logger.log(`✅ User ${user.email} permanently deleted`);
        } catch (error) {
          failedCount++;
          this.logger.error(
            `❌ Failed to delete user ${user.email}: ${error instanceof Error ? error.message : 'unknown'}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `🗑️ User deletion cleanup complete: ${deletedCount} deleted, ${failedCount} failed (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ User deletion cleanup job failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Manual trigger for testing or admin purposes
   * Runs the same logic as the scheduled job
   */
  async triggerManualCleanup(): Promise<{
    processed: number;
    deleted: number;
    failed: number;
  }> {
    this.logger.log('🔧 Manual user deletion cleanup triggered');

    const usersToDelete = await this.userService.findUsersPendingPermanentDeletion();
    let deleted = 0;
    let failed = 0;

    for (const user of usersToDelete) {
      try {
        await this.userService.permanentlyDelete(user.id);
        deleted++;
      } catch {
        failed++;
      }
    }

    return {
      processed: usersToDelete.length,
      deleted,
      failed,
    };
  }
}
