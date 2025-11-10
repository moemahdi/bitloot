import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './queues';

/**
 * DLQ (Dead-Letter Queue) Handler Service
 *
 * Monitors and handles failed jobs that exceed retry limits.
 * Responsible for:
 * 1. Tracking failed job metadata (jobId, orderId, error, attempt count)
 * 2. Logging failures for observability
 * 3. Moving jobs to separate DLQ for manual inspection
 * 4. Alerting on critical failures
 * 5. Providing visibility into failed fulfillment/payment operations
 *
 * Job Lifecycle:
 * - Job created → Processor attempts execution
 * - Error occurs → BullMQ retries with exponential backoff (3 attempts)
 * - Max retries exceeded → Job moved to DLQ
 * - DLQ Handler logs and tracks the failure
 * - Admin/monitoring system can query failed jobs for manual intervention
 */
@Injectable()
export class DLQHandlerService {
  private readonly logger = new Logger(DLQHandlerService.name);

  constructor(@InjectQueue(QUEUE_NAMES.FULFILLMENT) private readonly fulfillmentQueue: Queue) {
    this.setupDLQListeners();
  }

  /**
   * Setup event listeners for job failures
   * Called during service initialization to query and monitor failed jobs
   * Note: Event listeners are registered in the Processor, not here
   */
  private setupDLQListeners(): void {
    // Monitor jobs in fulfillment queue
    // Event listeners are set up in payment-processor.service and fulfillment-processor.service
    // This service focuses on querying failed jobs and providing monitoring/recovery operations
    this.logger.log('[DLQ Handler] Service initialized for job monitoring and recovery');
  }

  /**
   * Handle failed job - called after max retries exceeded
   * Logs failure details and moves to DLQ for inspection
   *
   * @param job Failed job object (may be undefined)
   * @param error Error that caused failure
   */
  private handleJobFailed(job: Job | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    const jobData = job?.data as Record<string, string | number | undefined> | undefined;
    const attemptCount = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 3;

    this.logger.error(
      `[DLQ] Job failed: jobId=${jobId}, orderId=${jobData?.orderId ?? 'unknown'}, ` +
        `attempts=${attemptCount}/${maxAttempts}, error=${error.message}`,
    );

    // Track failure metadata for monitoring
    const failureMetadata = {
      jobId,
      orderId: jobData?.orderId,
      jobType: job?.name,
      error: error.message,
      stack: error.stack,
      attemptsMade: attemptCount,
      maxAttempts,
      failedAt: new Date().toISOString(),
      jobData: this.sanitizeJobData(jobData),
    };

    // In production, send this to monitoring/alerting system (Datadog, New Relic, etc.)
    this.logger.error(`[DLQ] Failed job metadata: ${JSON.stringify(failureMetadata, null, 2)}`);

    // Classify failure severity for alerting
    this.classifyAndAlert(failureMetadata);
  }

  /**
   * Handle job completed - called on successful execution
   * Logs completion for observability
   *
   * @param job Completed job object
   */
  private handleJobCompleted(job: Job): void {
    const jobId = job.id;
    const jobData = job.data as Record<string, string | number | undefined> | undefined;
    const attemptsMade = job.attemptsMade ?? 0;
    const duration = Date.now() - (job.processedOn ?? job.timestamp ?? Date.now());

    this.logger.log(
      `[DLQ] Job completed: jobId=${jobId}, orderId=${jobData?.orderId ?? 'unknown'}, ` +
        `attempts=${attemptsMade}, duration=${duration}ms`,
    );

    // Log successful completions for metrics/analytics
    if (attemptsMade > 0) {
      this.logger.warn(
        `[DLQ] Job succeeded after ${attemptsMade} retry attempt(s): jobId=${jobId}`,
      );
    }
  }

  /**
   * Handle stalled job - called when job processing times out
   * Indicates potential processor hang or resource exhaustion
   *
   * @param jobId ID of stalled job
   */
  private handleJobStalled(jobId: string): void {
    this.logger.warn(
      `[DLQ] Job stalled (processing timeout): jobId=${jobId}. ` +
        `Job will be retried or moved to DLQ if max retries exceeded.`,
    );

    // In production, trigger alert for stalled jobs (potential hanging processors)
  }

  /**
   * Sanitize job data for logging (remove sensitive information)
   * Prevents logging of sensitive fields like API keys, user data, etc.
   *
   * @param jobData Job payload to sanitize
   * @returns Sanitized job data safe for logging
   */
  private sanitizeJobData(
    jobData: Record<string, string | number | undefined> | undefined,
  ): Record<string, unknown> | null {
    if (jobData === null || jobData === undefined) {
      return null;
    }

    return {
      orderId: jobData.orderId,
      quantity: jobData.quantity,
      kinguinOfferId: jobData.kinguinOfferId,
      // Don't log: userEmail, paymentId (sensitive)
    };
  }

  /**
   * Classify failure and trigger appropriate alerts
   * Different failure types warrant different alerting strategies
   *
   * @param metadata Failure metadata object
   */
  private classifyAndAlert(metadata: Record<string, unknown>): void {
    const error = String(metadata.error);
    const orderId = String(metadata.orderId);

    // Critical failures that need immediate alert
    if (error.includes('Kinguin API') || error.includes('R2 upload failed')) {
      this.logger.error(
        `[DLQ] CRITICAL: Fulfillment infrastructure failure detected for order ${orderId}. ` +
          `Requires immediate investigation. Error: ${error}`,
      );
      // In production: Send alert to on-call engineer
    }

    // Payment-related failures
    if (error.includes('NOWPayments') || error.includes('payment')) {
      this.logger.error(
        `[DLQ] PAYMENT FAILURE: Order ${orderId} fulfillment failed due to payment issue. ` +
          `May require customer communication. Error: ${error}`,
      );
      // In production: Flag order for manual review
    }

    // Transient failures (network, timeout) - retry later
    if (
      error.includes('ECONNREFUSED') ||
      error.includes('timeout') ||
      error.includes('ECONNRESET')
    ) {
      this.logger.warn(
        `[DLQ] TRANSIENT FAILURE: Network/timeout issue for order ${orderId}. ` +
          `May be recoverable. Error: ${error}`,
      );
      // In production: Queue for manual retry after delay
    }

    // Business logic failures (order not found, invalid state)
    if (
      error.includes('not found') ||
      error.includes('invalid state') ||
      error.includes('validation failed')
    ) {
      this.logger.error(
        `[DLQ] BUSINESS LOGIC FAILURE: Order ${orderId} fulfillment failed due to data issue. ` +
          `Requires manual investigation. Error: ${error}`,
      );
      // In production: Flag for support team review
    }
  }

  /**
   * Get failed jobs from queue for dashboard/monitoring
   * Returns list of jobs that have failed and moved to DLQ
   *
   * @param limit Maximum number of failed jobs to return
   * @returns Array of failed job metadata
   */
  async getFailedJobs(limit: number = 100): Promise<Array<Record<string, unknown>>> {
    const failedJobs: Array<Record<string, unknown>> = [];

    try {
      // Get failed jobs from queue (up to limit)
      const jobs = await this.fulfillmentQueue.getFailed(0, limit);

      for (const job of jobs) {
        const jobData = job.data as Record<string, string | number | undefined> | undefined;
        failedJobs.push({
          id: job.id,
          name: job.name,
          orderId: jobData?.orderId,
          error: job.failedReason,
          attempts: job.attemptsMade,
          data: this.sanitizeJobData(jobData),
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve failed jobs: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    return failedJobs;
  }

  /**
   * Retry a specific failed job
   * Allows manual intervention to retry a job that previously failed
   *
   * @param jobId Job ID to retry
   * @returns Result of retry operation
   */
  async retryFailedJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const job = await this.fulfillmentQueue.getJob(jobId);

      if (job === null || job === undefined) {
        return {
          success: false,
          message: `Job ${jobId} not found in fulfillment queue`,
        };
      }

      // Get current state and check if failed
      const state = await job.getState();
      if (state !== 'failed') {
        return {
          success: false,
          message: `Job ${jobId} is not in failed state (current state: ${state})`,
        };
      }

      // Reset failure count and re-queue job
      await job.retry();

      this.logger.log(`[DLQ] Manual retry triggered for job ${jobId}`);

      return {
        success: true,
        message: `Job ${jobId} queued for retry`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.error(`Failed to retry job ${jobId}: ${message}`);

      return {
        success: false,
        message: `Failed to retry job: ${message}`,
      };
    }
  }

  /**
   * Clean old failed jobs from queue
   * Prevents DLQ from growing unbounded over time
   *
   * @param olderThanDays Delete failed jobs older than this many days
   * @returns Number of jobs deleted
   */
  async cleanOldFailedJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      const failedJobs = await this.fulfillmentQueue.getFailed(0, -1);

      let deletedCount = 0;

      for (const job of failedJobs) {
        // Use finishedOn timestamp to check age (BullMQ property name)
        if ((job.finishedOn ?? 0) < cutoffDate) {
          await job.remove();
          deletedCount += 1;
        }
      }

      this.logger.log(
        `[DLQ] Cleanup complete: removed ${deletedCount} jobs older than ${olderThanDays} days`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to clean old failed jobs: ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      return 0;
    }
  }

  /**
   * Get queue statistics including failure counts
   * Useful for monitoring and alerting on queue health
   *
   * @returns Queue statistics object
   */
  async getQueueStats(): Promise<Record<string, number>> {
    try {
      const counts = await this.fulfillmentQueue.getJobCounts();

      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        paused: counts.paused ?? 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get queue stats: ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      return {
        error: 1,
      };
    }
  }
}
