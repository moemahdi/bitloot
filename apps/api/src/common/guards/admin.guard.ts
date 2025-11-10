import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { type Request } from 'express';

/**
 * AdminGuard: Verify user has 'admin' role in JWT
 *
 * Usage: @UseGuards(AdminGuard) on controller methods
 *
 * Requires:
 * - JwtAuthGuard applied first (sets req.user)
 * - req.user.role === 'admin'
 *
 * Throws: ForbiddenException if not admin
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get user from request (set by JwtAuthGuard)
    const user = (request as unknown as Record<string, unknown>).user as
      | { id: string; role?: string }
      | undefined;

    if (user === undefined) {
      this.logger.warn('AdminGuard: No user in request');
      throw new ForbiddenException('Not authenticated');
    }

    if (user.role !== 'admin') {
      this.logger.warn(`AdminGuard: User ${user.id} is not admin (role: ${user.role ?? 'none'})`);
      throw new ForbiddenException('Admin access required');
    }

    this.logger.debug(`AdminGuard: User ${user.id} authorized (admin)`);
    return true;
  }
}
