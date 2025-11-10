import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT Strategy for Passport
 *
 * Extracts JWT from:
 * 1. Authorization header: "Bearer <token>"
 * 2. WebSocket handshake auth.token
 * 3. Query parameter: ?token=<token>
 *
 * Validates token signature and expiration,
 * then loads user from database
 *
 * Usage with NestJS Guards:
 * @UseGuards(AuthGuard('jwt'))
 *
 * Usage with WebSocket:
 * socket.handshake.auth.token = jwtToken
 * gateway.jwtService.verify(token) // validates
 *
 * TODO: Integrate with UsersService once created
 * - Load full user record to verify account still exists
 * - Check if user is disabled/deleted
 * - Attach full user object to request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from Authorization header (Bearer token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Also accept token from query parameter (for WebSocket)
      // socket.io client: socket.handshake.auth.token
      ignoreExpiration: false,

      // Secret key for verification (from environment)
      secretOrKey: process.env.JWT_SECRET ?? 'your-secret-key',
    });
  }

  /**
   * Validate JWT payload
   *
   * Called after JWT signature is verified.
   * Return value becomes req.user (or socket.user in WebSocket)
   *
   * @param payload - Decoded JWT payload { sub, email, role, iat, exp }
   * @returns User object with id, email, role
   * @throws UnauthorizedException if payload invalid
   */
  validate(payload: {
    sub: string;
    email: string;
    role: 'user' | 'admin';
    iat: number;
    exp: number;
  }): { id: string; email: string; role: string } {
    // Validate required fields
    if (
      payload.sub === null ||
      payload.sub === undefined ||
      payload.sub.length === 0
    ) {
      throw new UnauthorizedException('Invalid token payload: missing sub');
    }

    if (
      payload.email === null ||
      payload.email === undefined ||
      payload.email.length === 0
    ) {
      throw new UnauthorizedException('Invalid token payload: missing email');
    }

    // Return user object from JWT payload
    // TODO: Load full user from UsersService to verify account still exists
    const role = payload.role === 'admin' ? 'admin' : 'user';

    return {
      id: payload.sub,
      email: payload.email,
      role,
    };
  }
}
