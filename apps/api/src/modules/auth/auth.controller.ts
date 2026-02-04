import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Req,
  Param,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { EmailsService } from '../emails/emails.service';
import { OrdersService } from '../orders/orders.service';
import { SessionService } from './session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { verifyCaptchaToken } from '../../utils/captcha.util';
import {
  generateDeletionCancelToken,
  verifyDeletionCancelToken,
  maskEmail,
} from './deletion-token.util';
import {
  RequestOtpDto,
  VerifyOtpDto,
  OtpResponseDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
  EmailChangeResponseDto,
  RequestDeletionDto,
  DeletionResponseDto,
  CancelDeletionResponseDto,
  CancellationTokenResponseDto,
  PublicCancelDeletionResponseDto,
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
    private readonly ordersService: OrdersService,
    private readonly sessionService: SessionService,
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
      // ✅ Check if email belongs to a deleted account
      const isDeleted = await this.userService.isEmailDeleted(dto.email);
      if (isDeleted) {
        this.logger.warn(`🚫 Login attempt for deleted account: ${dto.email}`);
        throw new BadRequestException(
          'This account has been deleted. Please contact support if you believe this is an error.',
        );
      }

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
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: ExpressRequest,
  ): Promise<AuthResponseDto> {
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
      }

      // Mark email as confirmed
      await this.userService.confirmEmail(dto.email);

      // Link any guest orders to this user by email match
      const linkedOrders = await this.ordersService.linkOrdersByEmail(user.id, dto.email);
      if (linkedOrders > 0) {
        this.logger.log(`🔗 Linked ${linkedOrders} guest orders to user ${dto.email}`);
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = this.authService.generateTokens(user);

      // Create session for "Active Sessions" feature
      const userAgent = req.headers['user-agent'];
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? req.socket.remoteAddress;
      
      const session = await this.sessionService.create({
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
      });

      // Update last login timestamp
      await this.userService.updateLastLogin(user.id);

      this.logger.log(`✅ Session created for user ${user.id} (session: ${session.id})`);

      return {
        accessToken,
        refreshToken,
        sessionId: session.id, // Return sessionId for frontend to track current session
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.emailConfirmed,
          role: user.role, // Include role for RBAC
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
  async refresh(@Body() body: { refreshToken: string }): Promise<Record<string, string>> {
    this.logger.log('🔄 Token refresh requested');

    try {
      if (body.refreshToken === null || body.refreshToken === undefined || body.refreshToken === '') {
        throw new BadRequestException('Refresh token required');
      }

      // Find existing session by old refresh token
      // This will return null if session is revoked or expired
      const existingSession = await this.sessionService.findByRefreshToken(body.refreshToken);

      // If no valid session found, reject the refresh request
      // This handles revoked sessions properly
      if (existingSession === null) {
        this.logger.warn('❌ Refresh failed: Session not found or revoked');
        throw new HttpException('Session expired or revoked', HttpStatus.UNAUTHORIZED);
      }

      const tokens = this.authService.refreshTokens(body.refreshToken);

      if (tokens === null) {
        throw new BadRequestException('Failed to refresh tokens');
      }

      // Update session with new refresh token
      await this.sessionService.updateActivity(existingSession.id, tokens.refreshToken);

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

      // Password reset not implemented - log for now
      this.logger.log(`🔐 Password reset requested for ${user.email} (reset link: ${resetLink})`);

      // TODO: Implement password reset flow if needed in future
      // For now, users use OTP-based authentication

      this.logger.log(`✅ Password reset request processed for ${user.email}`);

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

  // ============================================================
  // ACCOUNT MANAGEMENT ENDPOINTS
  // ============================================================

  /**
   * Request email change - sends OTP to BOTH old and new email (dual verification)
   * User must be authenticated
   * 
   * Security: This dual-OTP approach ensures:
   * 1. The account owner authorized the change (old email OTP)
   * 2. The new email is accessible (new email OTP)
   *
   * @param req Express request containing authenticated user
   * @param dto Request containing new email
   * @returns Response with success status
   */
  @Post('email-change/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request email change (sends OTP to BOTH old and new email)' })
  @ApiResponse({ status: 200, type: EmailChangeResponseDto })
  async requestEmailChange(
    @Request() req: { user: { id: string; email: string } },
    @Body() dto: RequestEmailChangeDto,
  ): Promise<EmailChangeResponseDto> {
    const userId = req.user.id;
    const currentEmail = req.user.email;
    const newEmail = dto.newEmail.toLowerCase().trim();

    this.logger.log(`📧 Email change requested for user ${userId}: ${currentEmail} → ${newEmail}`);

    try {
      // Check if new email is same as current
      if (newEmail === currentEmail) {
        throw new BadRequestException('New email must be different from current email');
      }

      // Check if new email is already in use by another user
      const existingUser = await this.userService.findByEmail(newEmail);
      if (existingUser !== null && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use by another account');
      }

      // Store pending email
      await this.userService.setPendingEmail(userId, newEmail);

      // Send OTP to BOTH email addresses (dual verification)
      // 1. OTP to old/current email (proves owner authorized the change)
      await this.otpService.issue(currentEmail);

      // 2. OTP to new email (proves new email is accessible)
      await this.otpService.issue(newEmail);

      this.logger.log(`📧 Dual OTP sent for email change: ${currentEmail} and ${newEmail}`);

      return {
        success: true,
        message: `Verification codes sent to both ${currentEmail} and ${newEmail}. Please enter both codes to complete the change.`,
        newEmail,
        currentEmail,
        expiresIn: 300, // 5 minutes
        requiresDualVerification: true,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ Email change request failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `Email change request failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Verify email change - completes the email change process
   * User must be authenticated and provide OTP code(s)
   * 
   * Security: In production with verified domain, both codes are required.
   * In testing mode (Resend limitations), only old email code is required.
   *
   * @param req Express request containing authenticated user
   * @param dto Request containing OTP code(s)
   * @returns Response with updated email
   */
  @Post('email-change/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email change with OTP code(s)' })
  @ApiResponse({ status: 200, type: EmailChangeResponseDto })
  async verifyEmailChange(
    @Request() req: { user: { id: string; email: string } },
    @Body() dto: VerifyEmailChangeDto,
  ): Promise<EmailChangeResponseDto> {
    const userId = req.user.id;
    const currentEmail = req.user.email;

    this.logger.log(`🔐 Email change verification for user ${userId}`);

    try {
      // Get pending email
      const pendingEmail = await this.userService.getPendingEmail(userId);
      if (pendingEmail === null) {
        throw new BadRequestException(
          'No pending email change found. Please request a new email change.',
        );
      }

      // Verify OTP code against OLD/current email first (proves ownership)
      const oldEmailValid = await this.otpService.verify(currentEmail, dto.oldEmailCode);
      if (!oldEmailValid) {
        throw new BadRequestException('Invalid or expired verification code for current email');
      }

      // Verify OTP code against NEW email (proves accessibility)
      const newEmailValid = await this.otpService.verify(pendingEmail, dto.newEmailCode);
      if (!newEmailValid) {
        throw new BadRequestException('Invalid or expired verification code for new email');
      }

      this.logger.log(`✅ Both OTP codes verified for user ${userId}`);

      // Complete email change
      await this.userService.confirmEmailChange(userId);

      this.logger.log(`✅ Email changed for user ${userId}: ${currentEmail} → ${pendingEmail}`);

      // Send confirmation notification to old email
      try {
        await this.emailsService.sendEmailChangedOld(currentEmail, pendingEmail);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send email change notification: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
        );
      }

      // Send welcome notification to new email
      try {
        await this.emailsService.sendEmailChangedNew(pendingEmail);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send welcome notification to new email: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
        );
      }

      return {
        success: true,
        message: 'Email address updated successfully.',
        newEmail: pendingEmail,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ Email change verification failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `Email change verification failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Request account deletion with 30-day grace period
   * User must type "DELETE" to confirm
   *
   * @param req Express request containing authenticated user
   * @param dto Request containing confirmation text
   * @returns Response with deletion date and days remaining
   */
  @Post('account/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request account deletion (30-day grace period)' })
  @ApiResponse({ status: 200, type: DeletionResponseDto })
  async requestAccountDeletion(
    @Request() req: { user: { id: string; email: string } },
    @Body() dto: RequestDeletionDto,
  ): Promise<DeletionResponseDto> {
    const userId = req.user.id;
    const userEmail = req.user.email;

    this.logger.log(`🗑️ Account deletion requested for user ${userId} (${userEmail})`);

    try {
      // Verify confirmation text
      if (dto.confirmation !== 'DELETE') {
        throw new BadRequestException('Please type "DELETE" to confirm account deletion');
      }

      // Request deletion (sets 30-day grace period)
      const deletionDate = await this.userService.requestDeletion(userId);

      const daysRemaining = Math.ceil(
        (deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      this.logger.log(
        `⏰ Account deletion scheduled for ${userEmail} on ${deletionDate.toISOString()} (${daysRemaining} days)`,
      );

      // Generate secure cancellation token for email link
      const cancelToken = generateDeletionCancelToken(userId);
      const cancelUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/cancel-deletion/${cancelToken}`;

      // Send confirmation email with secure cancel link
      try {
        await this.emailsService.sendDeletionScheduled(userEmail, {
          deletionDate,
          daysRemaining,
          cancelUrl,
        });
      } catch (emailError) {
        this.logger.warn(
          `Failed to send deletion confirmation email: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
        );
      }

      return {
        success: true,
        message: `Your account will be deleted on ${deletionDate.toLocaleDateString()}. You can cancel this request within the next ${daysRemaining} days.`,
        deletionDate: deletionDate.toISOString(),
        daysRemaining,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ Account deletion request failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `Account deletion request failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Cancel pending account deletion
   * User must have a pending deletion request
   *
   * @param req Express request containing authenticated user
   * @returns Response confirming cancellation
   */
  @Post('account/delete/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel pending account deletion' })
  @ApiResponse({ status: 200, type: CancelDeletionResponseDto })
  async cancelAccountDeletion(
    @Request() req: { user: { id: string; email: string } },
  ): Promise<CancelDeletionResponseDto> {
    const userId = req.user.id;
    const userEmail = req.user.email;

    this.logger.log(`🔄 Account deletion cancellation for user ${userId} (${userEmail})`);

    try {
      await this.userService.cancelDeletion(userId);

      this.logger.log(`✅ Account deletion cancelled for ${userEmail}`);

      // Send confirmation email
      try {
        await this.emailsService.sendDeletionCancelled(userEmail);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send deletion cancellation email: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
        );
      }

      return {
        success: true,
        message: 'Account deletion has been cancelled. Your account is now active.',
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `❌ Account deletion cancellation failed for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `Account deletion cancellation failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * Get cancellation token for authenticated users
   * Returns a token that can be used to redirect to the cancellation page
   * This provides a consistent UX between in-app and email cancellation
   *
   * @param req Express request containing authenticated user
   * @returns Token and cancellation URL
   */
  @Get('account/delete/cancel-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get cancellation token for redirect' })
  @ApiResponse({ status: 200, type: CancellationTokenResponseDto })
  async getCancellationToken(
    @Request() req: { user: { id: string; email: string } },
  ): Promise<CancellationTokenResponseDto> {
    const userId = req.user.id;
    const userEmail = req.user.email;

    this.logger.log(`🔑 Generating cancellation token for user ${userId} (${userEmail})`);

    // Check if user has a pending deletion
    const status = await this.userService.getDeletionStatus(userId);
    if (status === null) {
      throw new BadRequestException('No pending deletion request to cancel');
    }

    // Generate the cancellation token
    const token = generateDeletionCancelToken(userId);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const cancelUrl = `${frontendUrl}/cancel-deletion/${token}`;

    this.logger.log(`✅ Generated cancellation token for ${userEmail}`);

    return {
      success: true,
      token,
      cancelUrl,
    };
  }

  /**
   * Get account deletion status
   * Returns pending deletion date and days remaining if scheduled
   *
   * @param req Express request containing authenticated user
   * @returns Response with deletion status
   */
  @Get('account/delete/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get account deletion status' })
  @ApiResponse({ status: 200, type: DeletionResponseDto })
  async getAccountDeletionStatus(
    @Request() req: { user: { id: string } },
  ): Promise<DeletionResponseDto> {
    const userId = req.user.id;

    try {
      const status = await this.userService.getDeletionStatus(userId);

      if (status === null) {
        return {
          success: true,
          message: 'No pending deletion request.',
          deletionDate: null,
          daysRemaining: null,
        };
      }

      return {
        success: true,
        message: `Your account will be deleted on ${new Date(status.deletionDate).toLocaleDateString()}. You have ${status.daysRemaining} days to cancel.`,
        deletionDate: status.deletionDate.toISOString(),
        daysRemaining: status.daysRemaining,
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to get deletion status for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      throw new BadRequestException(
        `Failed to get deletion status: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  /**
   * PUBLIC: Cancel account deletion via secure token (no login required)
   *
   * This endpoint allows users to cancel their account deletion directly from
   * the email link without needing to log in. The token is HMAC-signed and
   * contains the user ID and timestamp.
   *
   * Security:
   * - Token is HMAC-SHA256 signed with JWT_SECRET
   * - Token expires after 30 days (matches deletion grace period)
   * - Timing-safe comparison prevents timing attacks
   *
   * @param token - Base64URL-encoded cancellation token from email
   * @returns Status indicating success, already cancelled, expired, or invalid
   */
  @Get('account/delete/cancel/:token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cancel account deletion via email link (public, no auth required)',
    description:
      'Allows users to cancel their account deletion from the email link without logging in. ' +
      'The token is secure and expires after 30 days.',
  })
  @ApiParam({
    name: 'token',
    description: 'Secure cancellation token from email',
    example: 'YWJjZGVmMTIzNDU2Nzg5MC4xNzAwMDAwMDAwMDAwLmFiY2RlZjEyMzQ1Njc4OTA=',
  })
  @ApiResponse({
    status: 200,
    type: PublicCancelDeletionResponseDto,
    description: 'Cancellation result (success, already_cancelled, expired, or invalid)',
  })
  async cancelDeletionViaToken(
    @Param('token') token: string,
  ): Promise<PublicCancelDeletionResponseDto> {
    this.logger.log(`🔗 Public deletion cancellation attempt via token`);

    // Validate token
    const verification = verifyDeletionCancelToken(token);

    if (!verification.valid) {
      // Check if token is expired vs invalid
      if (verification.expired === true && verification.userId !== undefined) {
        this.logger.warn(
          `⏰ Expired deletion cancellation token for user ${verification.userId}`,
        );
        return {
          status: 'expired',
          message:
            'This cancellation link has expired. Please log in to your account to cancel the deletion.',
        };
      }

      this.logger.warn(`❌ Invalid deletion cancellation token: ${verification.error}`);
      return {
        status: 'invalid',
        message:
          'This cancellation link is invalid. Please log in to your account or contact support.',
      };
    }

    const userId = verification.userId!;

    try {
      // Get user to check their deletion status
      const user = await this.userService.findById(userId);

      if (user === null || user === undefined) {
        this.logger.warn(`❌ User not found for deletion cancellation: ${userId}`);
        return {
          status: 'invalid',
          message: 'This account could not be found. It may have already been deleted.',
        };
      }

      // Check if deletion is actually pending
      const deletionStatus = await this.userService.getDeletionStatus(userId);

      if (deletionStatus === null) {
        this.logger.log(`ℹ️ No pending deletion for user ${userId} - already cancelled`);
        return {
          status: 'already_cancelled',
          message: 'Good news! Your account deletion has already been cancelled.',
          email: maskEmail(user.email),
        };
      }

      // Cancel the deletion
      await this.userService.cancelDeletion(userId);

      this.logger.log(`✅ Account deletion cancelled via token for ${user.email}`);

      // Send confirmation email
      try {
        await this.emailsService.sendDeletionCancelled(user.email);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send cancellation confirmation email: ${emailError instanceof Error ? emailError.message : 'unknown'}`,
        );
      }

      return {
        status: 'success',
        message: 'Your account deletion has been cancelled. Your account is now active.',
        email: maskEmail(user.email),
        cancelledAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to cancel deletion via token for ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );

      return {
        status: 'error',
        message:
          'An error occurred while cancelling your account deletion. Please try again or contact support.',
      };
    }
  }
}
