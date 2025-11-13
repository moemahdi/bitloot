import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: 'user' | 'admin' };
}

/**
 * OwnershipGuard ensures users can only access their own resources.
 * Must be used after JwtAuthGuard, which sets req.user.
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, OwnershipGuard)
 * 
 * The route param should be named 'id' or override via constructor parameter.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private paramName: string = 'id') {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // User should already be attached by JwtAuthGuard
    const user = request.user;
    if (user === null || user === undefined) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get the resource ID from route params
    const resourceId = request.params[this.paramName];
    if (resourceId === null || resourceId === undefined || resourceId === '') {
      throw new ForbiddenException('Resource ID not provided');
    }

    // Check if resource ID matches user ID
    if (resourceId !== user.id) {
      throw new ForbiddenException('Access denied: resource does not belong to you');
    }

    return true;
  }
}
