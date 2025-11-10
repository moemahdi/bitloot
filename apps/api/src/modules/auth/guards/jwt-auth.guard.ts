import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Protects routes and WebSocket gateways with JWT validation.
 *
 * Usage on HTTP routes:
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@Request() req) {
 *   return req.user; // { id, email, role }
 * }
 *
 * Usage on WebSocket:
 * import { UseGuards } from '@nestjs/common';
 *
 * @UseGuards(JwtAuthGuard)
 * @SubscribeMessage('subscribe:order')
 * handleSubscribeOrder(socket: Socket, data: { orderId: string }) {
 *   // Only authenticated users can subscribe
 * }
 *
 * How it works:
 * 1. Extracts JWT from Authorization header or query
 * 2. Validates signature against JWT_SECRET
 * 3. Checks token expiration
 * 4. Loads user from database
 * 5. Attaches user to request context (req.user or socket.user)
 * 6. Throws UnauthorizedException (401) if invalid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override canActivate(context: ExecutionContext): any {
    // Call parent Passport strategy
    // Returns boolean, Promise<boolean>, or Observable<boolean>
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest(err: any, user: any, _info: any): any {
    // If JWT verification failed, err will be set
    if (err !== null && err !== undefined) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user === null || user === undefined || user === false) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Return authenticated user
    return user;
  }
}
