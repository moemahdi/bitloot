import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    emailConfirmed: boolean;
    type?: string;
  };
}

/**
 * Guard for /auth/refresh endpoint
 * Validates that the refresh token is present and valid
 * Attaches decoded token payload to request.user
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    try {
      // Extract refresh token from body
      const body = request.body as Record<string, unknown> | null | undefined;
      const refreshToken = body?.refreshToken;

      if (refreshToken === null || refreshToken === undefined || typeof refreshToken !== 'string') {
        this.logger.warn('❌ Refresh token missing or invalid type');
        throw new UnauthorizedException('Refresh token required');
      }

      // Verify refresh token
      const payload = this.authService.verifyAccessToken(refreshToken);

      if (payload === null || payload === undefined) {
        this.logger.warn('❌ Invalid or expired refresh token');
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Verify it's a refresh token (has type marker)
      if (payload.type !== 'refresh') {
        this.logger.warn('❌ Token is not a refresh token');
        throw new UnauthorizedException('Token must be a refresh token');
      }

      // Attach payload to request for use in controller
      request.user = payload;

      return true;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Refresh token verification failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
