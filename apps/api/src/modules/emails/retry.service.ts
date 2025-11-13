import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import * as crypto from 'crypto';

/**
 * Email Retry Service
 * Implements exponential backoff with jitter for resilient email sending
 *
 * Retry Strategy:
 * - Attempts: 1s, 2s, 4s, 8s, 16s (5 total attempts, ~31s max window)
 * - Jitter: +random(0-500ms) per attempt prevents thundering herd
 * - Total window: ~31 seconds (acceptable for transactional emails)
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Send HTTP request with exponential backoff retry
   *
   * @param httpRequest Function that returns the HTTP request observable
   * @param maxAttempts Maximum number of retry attempts (default: 5)
   * @param onRetry Optional callback before each retry
   * @returns Response from successful request
   * @throws Error if all retry attempts exhausted
   */
  async executeWithRetry<T>(
    httpRequest: () => Observable<T>,
    maxAttempts: number = 5,
    onRetry?: (attempt: number, error: Error) => void,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Execute the HTTP request
        const response = await firstValueFrom(httpRequest());
        
        if (attempt > 1) {
          this.logger.log(
            `✅ Request succeeded on attempt ${attempt}/${maxAttempts} (after retry)`,
          );
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts) {
          // Calculate exponential backoff delay
          const baseDelayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
          const jitterMs = crypto.randomInt(0, 500); // 0-500ms jitter (cryptographically safe)
          const totalDelayMs = baseDelayMs + jitterMs;

          this.logger.warn(
            `⏳ Request failed (attempt ${attempt}/${maxAttempts}): ${lastError.message}. ` +
            `Retrying in ${totalDelayMs.toFixed(0)}ms...`,
          );

          // Invoke optional callback before retry
          if (onRetry !== null && onRetry !== undefined) {
            onRetry(attempt, lastError);
          }

          // Wait before next retry
          await this.sleep(totalDelayMs);
        }
      }
    }

    // All attempts exhausted
    this.logger.error(
      `❌ Request failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`,
    );
    if (lastError === null) {
      throw new Error('Unknown error occurred during retry attempts');
    }
    throw lastError;
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get retry metrics for logging/observability
   *
   * @param maxAttempts Number of attempts
   * @returns Object with retry configuration details
   */
  getRetryMetrics(maxAttempts: number = 5): {
    attempts: number[];
    totalWindowMs: number;
    description: string;
  } {
    const attempts: number[] = [];
    let totalMs = 0;

    for (let i = 1; i < maxAttempts; i++) {
      const delayMs = Math.pow(2, i - 1) * 1000 + 250; // Base + avg jitter
      attempts.push(delayMs);
      totalMs += delayMs;
    }

    return {
      attempts,
      totalWindowMs: totalMs,
      description: `Exponential backoff: ${attempts.map((ms) => `${(ms / 1000).toFixed(1)}s`).join(', ')} (total ~${(totalMs / 1000).toFixed(0)}s)`,
    };
  }
}
