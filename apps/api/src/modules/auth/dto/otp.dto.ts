import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

/**
 * DTO for requesting OTP code via email
 */
export class RequestOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP code to',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Optional Cloudflare Turnstile CAPTCHA token for bot protection',
    required: false,
  })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

/**
 * DTO for verifying OTP code
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address that received the OTP code',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '6-digit OTP code sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}

/**
 * DTO for OTP request response
 */
export class RequestOtpResponseDto {
  @ApiProperty({
    description: 'Whether OTP was successfully sent',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Number of seconds until OTP expires',
    example: 300,
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'Optional message for user',
    example: 'OTP code sent to your email. Valid for 5 minutes.',
  })
  message?: string;
}

/**
 * DTO for OTP verification response
 */
export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Whether OTP was successfully verified',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token for refreshing access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'User object with basic info',
    example: {
      id: 'uuid-string',
      email: 'user@example.com',
      emailConfirmed: true,
      createdAt: '2025-11-11T10:00:00Z',
    },
  })
  user!: {
    id: string;
    email: string;
    emailConfirmed: boolean;
    createdAt: Date;
  };
}

/**
 * DTO for refresh token request
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token to exchange for new access token',
  })
  @IsString()
  refreshToken!: string;
}

/**
 * DTO for refresh token response
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'New JWT refresh token',
  })
  refreshToken!: string;
}

/**
 * DTO for logout request
 */
export class LogoutDto {
  @ApiProperty({
    description: 'JWT refresh token to invalidate',
  })
  @IsString()
  refreshToken!: string;
}

/**
 * DTO for logout response
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Whether logout was successful',
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message',
  })
  message?: string;
}
