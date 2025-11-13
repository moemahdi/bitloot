import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { User } from '../../database/entities/user.entity';

interface TokenPayload {
  sub: string;
  email: string;
  emailConfirmed: boolean;
  type?: 'access' | 'refresh' | 'reset';
  iat?: number;
  exp?: number;
}

/**
 * Auth Service: Manages JWT token generation and verification
 * Handles access tokens (15m), refresh tokens (7d), and token validation
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-change-in-production';
    this.refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? this.jwtSecret;
  }

  /**
   * Generate JWT access and refresh tokens for user
   * @param user User entity
   * @returns Object with accessToken and refreshToken
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      emailConfirmed: user.emailConfirmed,
    };

    // Access token: 15 minutes
    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: '15m',
    });

    // Refresh token: 7 days (includes type marker)
    const refreshPayload = { ...payload, type: 'refresh' as const };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: '7d',
    });

    this.logger.log(`✅ Tokens generated for user ${user.id} (${user.email})`);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode JWT access token
   * @param token JWT token string
   * @returns Decoded payload or null if invalid
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtSecret,
      });

      if (decoded.type === 'refresh') {
        this.logger.warn('Attempted to use refresh token as access token');
        return null;
      }

      return decoded;
    } catch (error: unknown) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Verify refresh token and generate new token pair
   * @param refreshToken Refresh token string
   * @returns New token pair or null if invalid
   */
  refreshTokens(refreshToken: string): { accessToken: string; refreshToken: string } | null {
    try {
      const decoded = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      if (decoded.type !== 'refresh') {
        this.logger.warn('Attempted to refresh with non-refresh token');
        return null;
      }

      // Create new payload without type marker
      const newPayload: TokenPayload = {
        sub: decoded.sub,
        email: decoded.email,
        emailConfirmed: decoded.emailConfirmed,
      };

      // Issue new token pair
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.jwtSecret,
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, type: 'refresh' as const },
        {
          secret: this.refreshTokenSecret,
          expiresIn: '7d',
        },
      );

      this.logger.log(`✅ Tokens refreshed for user ${decoded.sub}`);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error: unknown) {
      this.logger.error(
        `Token refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Generate password reset token (1 hour expiry)
   * @param userId User ID
   * @param email User email
   * @returns Reset token string
   */
  generateResetToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      emailConfirmed: false,
      type: 'reset',
    };

    const resetToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: '1h',
    });

    this.logger.log(`✅ Password reset token generated for ${email}`);
    return resetToken;
  }

  /**
   * Verify password reset token
   * @param token Reset token string
   * @returns Decoded payload (user ID + email) or null if invalid
   */
  verifyResetToken(token: string): TokenPayload | null {
    try {
      const decoded = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtSecret,
      });

      if (decoded.type !== 'reset') {
        this.logger.warn('Attempted to use non-reset token as reset token');
        return null;
      }

      return decoded;
    } catch (error: unknown) {
      this.logger.warn(
        `Reset token verification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }
}
