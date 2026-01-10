import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password (min 8 chars)', example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'New password (optional)',
    example: 'NewSecurePassword123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User UUID' })
  id!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'Whether email has been confirmed' })
  emailConfirmed!: boolean;

  @ApiProperty({ description: 'User role', enum: ['user', 'admin'] })
  role!: 'user' | 'admin';

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt!: Date;
}

export class UserProfileDto extends UserResponseDto {
  @ApiProperty({ description: 'Last login timestamp', required: false })
  lastLoginAt?: Date | null;

  @ApiProperty({ description: 'Account status' })
  status!: 'active' | 'suspended' | 'deleted';
}

/**
 * OTP Response DTOs
 */

export class RequestOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile CAPTCHA token (required if CAPTCHA enabled)',
    example: '0x4AAAAAABkpwy8Y38VB-QW9...',
    required: false,
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address associated with OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  code!: string;
}

export class OtpResponseDto {
  @ApiProperty({ description: 'Whether OTP was sent successfully', example: true })
  success!: boolean;

  @ApiProperty({
    description: 'Seconds until OTP expires',
    example: 300,
    required: false,
  })
  expiresIn?: number;

  @ApiProperty({
    description: 'Error message if OTP request failed',
    required: false,
  })
  error?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15 minute expiry)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token (7 day expiry)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Current session ID for tracking active sessions' })
  sessionId!: string;

  @ApiProperty({ description: 'User info', type: UserResponseDto })
  user!: UserResponseDto;
}

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token for token renewal' })
  @IsString()
  refreshToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Success status' })
  success!: boolean;

  @ApiProperty({ description: 'Logout message' })
  message!: string;
}

/**
 * Password Reset DTOs
 */

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address to send reset link to',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({ description: 'Whether reset email was sent', example: true })
  success!: boolean;

  @ApiProperty({
    description: 'Message to display to user',
    example: 'If an account exists with this email, you will receive a password reset link.',
  })
  message!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email link',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'NewSecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ description: 'Whether password was reset successfully', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Success message' })
  message!: string;
}

/**
 * Email Change DTOs (Dual-OTP verification: old email + new email)
 * Security: Both current and new email owners must verify the change
 */

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'New email address to change to',
    example: 'newemail@example.com',
  })
  @IsEmail()
  newEmail!: string;
}

export class VerifyEmailChangeDto {
  @ApiProperty({
    description: '6-digit OTP code sent to OLD (current) email',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  oldEmailCode!: string;

  @ApiProperty({
    description: '6-digit OTP code sent to NEW email',
    example: '654321',
  })
  @IsString()
  @MinLength(6)
  newEmailCode!: string;
}

export class EmailChangeResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;

  @ApiProperty({ description: 'New email address', required: false })
  newEmail?: string;

  @ApiProperty({ description: 'Current email address (for verification step)', required: false })
  currentEmail?: string;

  @ApiProperty({ description: 'Seconds until OTP expires', required: false })
  expiresIn?: number;

  @ApiProperty({ description: 'Indicates if dual OTP verification is required', required: false })
  requiresDualVerification?: boolean;
}

/**
 * Account Deletion DTOs (30-day grace period)
 */

export class RequestDeletionDto {
  @ApiProperty({
    description: 'Confirmation string - must be "DELETE"',
    example: 'DELETE',
  })
  @IsString()
  confirmation!: string;
}

export class DeletionResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;

  @ApiProperty({ description: 'Date when account will be permanently deleted (ISO string)', required: false })
  deletionDate?: string | null;

  @ApiProperty({ description: 'Days remaining before permanent deletion', required: false })
  daysRemaining?: number | null;
}

export class CancelDeletionResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;
}

/**
 * Cancellation Token Response DTO
 * Returns a token that can be used to redirect to the cancellation page
 */
export class CancellationTokenResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Cancellation token for redirect' })
  token!: string;

  @ApiProperty({ description: 'Full URL to the cancellation page' })
  cancelUrl!: string;
}

/**
 * Public (token-based) Cancel Deletion DTO
 * Used for cancelling deletion via email link without requiring login
 */
export class PublicCancelDeletionResponseDto {
  @ApiProperty({
    description: 'Cancellation result status',
    enum: ['success', 'already_cancelled', 'expired', 'invalid', 'error'],
    example: 'success',
  })
  status!: 'success' | 'already_cancelled' | 'expired' | 'invalid' | 'error';

  @ApiProperty({ description: 'Human-readable message' })
  message!: string;

  @ApiProperty({ description: 'User email (masked for privacy)', required: false })
  email?: string;

  @ApiProperty({ description: 'Timestamp when cancellation was processed', required: false })
  cancelledAt?: string;
}

/**
 * Session DTOs
 */

export class SessionResponseDto {
  @ApiProperty({ description: 'Session UUID' })
  id!: string;

  @ApiProperty({ description: 'Device/browser info', required: false })
  deviceInfo?: string | null;

  @ApiProperty({ description: 'IP address', required: false })
  ipAddress?: string | null;

  @ApiProperty({ description: 'Approximate location', required: false })
  location?: string | null;

  @ApiProperty({ description: 'Last activity timestamp', required: false })
  lastActiveAt?: Date | null;

  @ApiProperty({ description: 'Session creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Whether this is the current session' })
  isCurrent!: boolean;
}

export class SessionListResponseDto {
  @ApiProperty({ description: 'List of active sessions', type: [SessionResponseDto] })
  sessions!: SessionResponseDto[];

  @ApiProperty({ description: 'Total number of active sessions' })
  total!: number;
}

export class RevokeSessionResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;

  @ApiProperty({ description: 'Number of sessions revoked', required: false })
  revokedCount?: number;
}
