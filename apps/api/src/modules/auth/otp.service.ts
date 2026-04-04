import { Injectable, BadRequestException, HttpException, HttpStatus, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import Redis from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';
import { EmailsService } from '../emails/emails.service';

/**
 * OTP Service: Manages one-time password generation, verification, and rate limiting
 * Uses Redis for fast storage with automatic expiration (TTL)
 */
@Injectable()
export class OtpService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_TTL = 300; // 5 minutes
  private readonly MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per 15 minutes
  private readonly REQUEST_WINDOW_SECONDS = 900; // 15 minutes
  private readonly MAX_VERIFY_ATTEMPTS = 5; // 5 attempts per minute
  private readonly VERIFY_WINDOW_SECONDS = 60; // 1 minute

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly emailsService: EmailsService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  /**
   * Log structured JSON event for observability
   */
  private logStructured(
    level: 'info' | 'warn' | 'error',
    operation: string,
    status: string,
    context: Record<string, unknown>,
  ): void {
    const structuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: 'OtpService',
      operation,
      status,
      context,
    };

    const logMessage = JSON.stringify(structuredLog);
    if (level === 'error') {
      this.logger.error(logMessage);
    } else if (level === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  /**
   * Generate and send OTP code to user email
   * @param email - User email address
   * @returns { success: boolean, expiresIn: number }
   * @throws HttpException if rate limit exceeded
   */
  async issue(email: string): Promise<{ success: boolean; expiresIn: number }> {
    // Normalize email to prevent case-based rate limit bypass
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitKey = `otp:ratelimit:send:${normalizedEmail}`;

    try {
      // Atomically increment and set TTL to prevent orphaned keys
      // (if server crashes between INCR and EXPIRE, key would persist forever)
      const pipeline = this.redis.pipeline();
      pipeline.incr(rateLimitKey);
      pipeline.expire(rateLimitKey, this.REQUEST_WINDOW_SECONDS);
      const results = await pipeline.exec();

      // Extract attempt count from pipeline result
      const attempts = (results?.[0]?.[1] as number) ?? 0;

      if (attempts > this.MAX_REQUESTS_PER_WINDOW) {
        const ttl = await this.redis.ttl(rateLimitKey);
        console.warn(`⏱️  OTP rate limit exceeded for ${normalizedEmail} (attempt ${attempts}, ttl=${ttl}s)`);
        this.metricsService.incrementOtpRateLimit('issue');
        this.logStructured('warn', 'issue:rate_limit_exceeded', 'rate_limit_violation', {
          email: normalizedEmail,
          attempts,
          maxAttempts: this.MAX_REQUESTS_PER_WINDOW,
          windowSeconds: this.REQUEST_WINDOW_SECONDS,
          remainingTtl: ttl,
        });
        throw new HttpException(
          'Too many OTP requests. Please try again in 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Generate 6-digit OTP
      const code = randomInt(0, 999999).toString().padStart(6, '0');
      const otpKey = `otp:verify:${normalizedEmail}`;

      // Store OTP in Redis with TTL
      await this.redis.set(otpKey, code, 'EX', this.OTP_TTL);

      this.logStructured('info', 'issue:success', 'otp_generated', {
        email: normalizedEmail,
        expiresIn: this.OTP_TTL,
        attempt: attempts,
      });

      // Log (never full code!)
      console.warn(
        `✅ OTP issued for ${normalizedEmail} (last 2 digits: ${code.slice(-2)}) - expires in ${this.OTP_TTL}s`,
      );

      // Send OTP via Resend email (Level 4+)
      await this.emailsService.sendOtpEmail(normalizedEmail, code);

      return {
        success: true,
        expiresIn: this.OTP_TTL,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logStructured('error', 'issue:failed', 'otp_generation_error', {
        email: normalizedEmail,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
      });
      console.error('OTP generation error:', error);
      throw new BadRequestException('Failed to generate OTP code');
    }
  }

  /**
   * Verify OTP code with rate limiting
   * @param email - User email address
   * @param code - 6-digit OTP code
   * @returns true if verification successful, false otherwise
   * @throws HttpException if too many failed attempts
   */
  async verify(email: string, code: string): Promise<boolean> {
    // Normalize email to match issue() normalization
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitKey = `otp:ratelimit:verify:${normalizedEmail}`;
    const otpKey = `otp:verify:${normalizedEmail}`;

    try {
      // Atomically increment and set TTL to prevent orphaned keys
      const pipeline = this.redis.pipeline();
      pipeline.incr(rateLimitKey);
      pipeline.expire(rateLimitKey, this.VERIFY_WINDOW_SECONDS);
      const results = await pipeline.exec();

      const attempts = (results?.[0]?.[1] as number) ?? 0;

      if (attempts > this.MAX_VERIFY_ATTEMPTS) {
        console.warn(`❌ OTP verification rate limit exceeded for ${normalizedEmail}`);
        this.metricsService.incrementOtpRateLimit('verify');
        this.logStructured('warn', 'verify:rate_limit_exceeded', 'verification_rate_limit', {
          email: normalizedEmail,
          attempts,
          maxAttempts: this.MAX_VERIFY_ATTEMPTS,
          windowSeconds: this.VERIFY_WINDOW_SECONDS,
        });
        throw new HttpException(
          'Too many verification attempts. Please request a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Get stored OTP
      const storedCode = await this.redis.get(otpKey);

      if (storedCode === null || storedCode === undefined) {
        console.warn(`❌ OTP expired or not found for ${normalizedEmail}`);
        this.metricsService.incrementOtpVerificationFailed('expired');
        this.logStructured('warn', 'verify:otp_expired', 'verification_failed', {
          email: normalizedEmail,
          attempt: attempts,
          reason: 'otp_not_found_or_expired',
        });
        return false;
      }

      // Validate OTP format: must be exactly 6 digits
      const trimmedCode = code.trim();
      if (!/^\d{6}$/.test(trimmedCode)) {
        this.metricsService.incrementOtpVerificationFailed('invalid_format');
        this.logStructured('warn', 'verify:invalid_format', 'verification_failed', {
          email: normalizedEmail,
          attempt: attempts,
          reason: 'invalid_code_format',
        });
        return false;
      }

      // Verify code (exact match — OTP is numeric)
      const isValid = storedCode === trimmedCode;

      if (!isValid) {
        console.warn(`❌ Invalid OTP for ${normalizedEmail} (attempt ${attempts}/5)`);
        this.metricsService.incrementOtpVerificationFailed('invalid_code');
        this.logStructured('warn', 'verify:invalid_code', 'verification_failed', {
          email: normalizedEmail,
          attempt: attempts,
          maxAttempts: this.MAX_VERIFY_ATTEMPTS,
          reason: 'code_mismatch',
        });
        return false;
      }

      // Valid: clean up
      await this.redis.del(otpKey);
      await this.redis.del(rateLimitKey);

      this.logStructured('info', 'verify:success', 'verification_complete', {
        email: normalizedEmail,
        attempt: attempts,
      });

      console.warn(`✅ OTP verified for ${normalizedEmail}`);
      return true;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logStructured('error', 'verify:failed', 'verification_error', {
        email: normalizedEmail,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
      });
      console.error('OTP verification error:', error);
      return false;
    }
  }

  /**
   * Clean up expired OTP codes (called periodically)
   * Redis automatically handles TTL expiration, but this can be used for cleanup
   */
  cleanupExpired(): void {
    // Redis handles cleanup automatically with TTL
    // This method can be used for manual cleanup if needed
    console.warn('🧹 OTP cleanup completed (Redis TTL handles expiration)');
  }

  /**
   * Get OTP TTL remaining in seconds
   * Returns the configured OTP TTL as a constant to prevent email enumeration.
   * The actual Redis TTL is not exposed to avoid revealing whether an OTP exists.
   *
   * @param email - User email address
   * @returns Constant TTL value (OTP_TTL seconds) to prevent enumeration
   */
  getTtl(_email: string): number {
    // Return constant value to prevent email enumeration
    // Attackers cannot distinguish between existing and non-existing OTPs
    return this.OTP_TTL;
  }

  /**
   * Get OTP request rate limit status
   * @param email - User email address
   * @returns Remaining requests or 0 if at limit
   */
  async getRateLimitStatus(email: string): Promise<number> {
    const rateLimitKey = `otp:ratelimit:send:${email}`;
    const attempts = await this.redis.get(rateLimitKey);
    const used = attempts !== null && attempts !== undefined ? parseInt(attempts, 10) : 0;
    return Math.max(0, this.MAX_REQUESTS_PER_WINDOW - used);
  }

  /**
   * TEST ONLY: Get OTP code from Redis (for E2E testing)
   * Only available in non-production environments.
   * @param email Email address to retrieve OTP for
   * @returns OTP code or null if not found
   */
  async getOtpCodeForTesting(email: string): Promise<string | null> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('[SECURITY] getOtpCodeForTesting called in production - denied');
      return null;
    }
    const otpKey = `otp:verify:${email}`;
    const code = await this.redis.get(otpKey);
    return code ?? null;
  }

  /**
   * Close Redis connection on module destroy (graceful shutdown)
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch (error) {
      this.logger.error('Failed to close Redis connection:', error);
    }
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
