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

  @ApiProperty({ description: 'User info' })
  user!: {
    id: string;
    email: string;
    emailConfirmed: boolean;
    createdAt: Date;
  };
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

