import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 *
 * Allows both authenticated and unauthenticated access.
 * If a valid JWT is provided, user is attached to request.
 * If no JWT or invalid JWT, request continues without user.
 *
 * Usage:
 * @UseGuards(OptionalAuthGuard)
 * async createReview(@Request() req) {
 *   const userId = req.user?.id; // undefined if guest
 *   // Handle both authenticated and guest users
 * }
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override canActivate(context: ExecutionContext): any {
    // Call parent Passport strategy
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest(err: any, user: any, _info: any): any {
    // Unlike JwtAuthGuard, we don't throw on invalid/missing token
    // Just return null or the user
    if (err !== null && err !== undefined) {
      return null;
    }

    if (user === null || user === undefined || user === false) {
      return null;
    }

    return user;
  }
}
