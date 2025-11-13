import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { EmailsService } from '../emails/emails.service';
import { verifyCaptchaToken } from '../../utils/captcha.util';
import {
  RequestOtpDto,
  VerifyOtpDto,
  OtpResponseDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/user.dto';

/**
 * Auth Controller: Handles OTP-based authentication flow
 * Phase 2: Passwordless login via 6-digit OTP codes
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Request OTP code via email
   * Rate limited: 3 requests per 15 minutes per email
   *
   * @param dto Request containing email and optional CAPTCHA token
   * @returns Response with success status and expiration time
   */
  @Post('request-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request OTP code via email' })
  @ApiResponse({ status: 200, type: OtpResponseDto })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<OtpResponseDto> {
    this.logger.log(`📧 OTP request for ${dto.email}`);

    try {
      // ✅ Verify CAPTCHA token if provided or enabled
      const turnstileEnabled = process.env.TURNSTILE_ENABLED === 'true';
      if (turnstileEnabled) {
        const captchaToken = dto.captchaToken ?? '';
        if (captchaToken.length === 0) {
          throw new BadRequestException('CAPTCHA token is required');
        }
        await verifyCaptchaToken(captchaToken);
        this.logger.debug(`✅ CAPTCHA verified for ${dto.email}`);
      }

      await this.otpService.issue(dto.email);

      return {
        success: true,
        expiresIn: 300, // 5 minutes
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ OTP request failed for ${dto.email}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `OTP request failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Verify OTP code and issue JWT tokens
   * Rate limited: 5 attempts per minute per email
   * Auto-creates user on first successful verification
   *
   * @param dto Request containing email and 6-digit code
   * @returns Response with JWT tokens and user info
   */
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP code and get JWT tokens' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    this.logger.log(`🔐 OTP verification for ${dto.email}`);

    try {
      // Verify OTP code
      const isValid = await this.otpService.verify(dto.email, dto.code);

      if (!isValid) {
        throw new BadRequestException('Invalid or expired OTP code');
      }

      // Find or create user
      let user = await this.userService.findByEmail(dto.email);

      if (user === null || user === undefined) {
        user = await this.userService.create(dto.email);
        this.logger.log(`✨ New user created: ${dto.email}`);

        // Send welcome email to new users
        try {
          const userName = dto.email.split('@')[0] ?? dto.email;
          await this.emailsService.sendWelcomeEmail(dto.email, userName);
          this.logger.debug(`📬 Welcome email queued for ${dto.email}`);
        } catch (emailError) {
          const msg = emailError instanceof Error ? emailError.message : 'Unknown error';
          this.logger.warn(`⚠️  Failed to send welcome email: ${msg}`);
        }
      }

      // Mark email as confirmed
      await this.userService.confirmEmail(dto.email);

      // Generate JWT tokens
      const { accessToken, refreshToken } = this.authService.generateTokens(user);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.emailConfirmed,
          createdAt: user.createdAt,
        },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ OTP verification failed for ${dto.email}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `OTP verification failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * Issues new token pair
   *
   * @param body Request containing refresh token
   * @returns Response with new access and refresh tokens
   */
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh JWT access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(@Body() body: { refreshToken: string }): Record<string, string> {
    this.logger.log('🔄 Token refresh requested');

    try {
      if (body.refreshToken === null || body.refreshToken === undefined || body.refreshToken === '') {
        throw new BadRequestException('Refresh token required');
      }

      const tokens = this.authService.refreshTokens(body.refreshToken);

      if (tokens === null) {
        throw new BadRequestException('Failed to refresh tokens');
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Token refresh failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException('Failed to refresh tokens', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Request password reset email
   * Rate limited: 3 requests per 15 minutes per email
   *
   * @param dto Request containing email
   * @returns Response with success status (never reveal if account exists for security)
   */
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, type: ForgotPasswordResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`🔐 Password reset requested for ${dto.email}`);

    try {
      // Find user by email
      const user = await this.userService.findByEmail(dto.email);

      if (user === null) {
        // Security: Don't reveal whether account exists
        this.logger.warn(`Password reset requested for non-existent email: ${dto.email}`);
        return {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        };
      }

      // Generate reset token (1 hour expiry)
      const resetToken = this.authService.generateResetToken(user.id, user.email);

      // Build reset link (frontend should consume this)
      const resetLink = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

      // Send reset email
      await this.emailsService.sendPasswordResetEmail(user.email, resetToken, resetLink);

      this.logger.log(`✅ Password reset email sent to ${user.email}`);

      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Password reset request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      // Don't expose error to user for security
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    }
  }

  /**
   * Reset password using reset token
   * Token must be valid and not expired (1 hour expiry)
   *
   * @param dto Request containing reset token and new password
   * @returns Success response
   */
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, type: ResetPasswordResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    this.logger.log('🔐 Password reset attempt');

    try {
      // Verify reset token
      const payload = this.authService.verifyResetToken(dto.token);

      if (payload === null) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Find user
      const user = await this.userService.findById(payload.sub);

      if (user === null) {
        throw new BadRequestException('User not found');
      }

      // Verify token email matches user email (prevents token swapping)
      if (payload.email !== user.email) {
        throw new BadRequestException('Token does not match user email');
      }

      // Update password
      await this.userService.updatePassword(user.id, dto.password);

      this.logger.log(`✅ Password reset successfully for ${user.email}`);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Password reset failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * Logout user (invalidates tokens by clearing cookies on frontend)
   * Note: JWT tokens are stateless, so no backend action needed
   * Frontend should clear tokens from httpOnly cookies
   *
   * @returns Success response
   */
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 204 })
  logout(): void {
    // JWT is stateless - token invalidation happens on frontend
    // Optional: In future, could add token to blacklist or revocation list
    this.logger.log('👋 User logged out');
  }

  /**
   * TEST ONLY: Get OTP code from Redis for testing purposes
   * This endpoint is only available in development mode for E2E testing
   * DO NOT USE IN PRODUCTION
   *
   * @param email Email address to retrieve OTP for
   * @returns OTP code if available
   */
  @Post('test/get-otp')
  @HttpCode(200)
  @ApiOperation({ summary: '[TEST ONLY] Get OTP for testing' })
  @ApiResponse({ status: 200, schema: { example: { code: '123456' } } })
  async getOtpForTesting(@Body() body: { email: string }): Promise<{ code: string | null }> {
    // Only available in development
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('This endpoint is only available in development');
    }

    this.logger.debug(`[TEST] Retrieving OTP for ${body.email}`);
    const code = await this.otpService.getOtpCodeForTesting(body.email);

    if (code === null || code === undefined) {
      this.logger.warn(`[TEST] No OTP found for ${body.email}`);
      return { code: null };
    }

    this.logger.debug(`[TEST] OTP retrieved for ${body.email}: ${code}`);
    return { code };
  }
}
