import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication Module
 *
 * Provides JWT-based authentication with Passport.js integration.
 *
 * Exports:
 * - JwtAuthGuard: Use @UseGuards(JwtAuthGuard) on routes/gateways
 * - JwtModule: Access jwtService for token generation/verification
 *
 * Configuration:
 * - JWT_SECRET: Environment variable for token signing
 * - Default expiry: 24 hours
 * - Algorithm: HS256 (symmetric)
 *
 * Usage:
 * 1. Import AuthModule in your feature module
 * 2. Use @UseGuards(JwtAuthGuard) on protected routes
 * 3. Access user via @Request() req or socket.user (WebSocket)
 *
 * Example:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // { id: string, email: string, role: string }
 * }
 */
@Module({
  imports: [
    // Passport infrastructure
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // JWT signing and verification
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: {
        expiresIn: '24h',
        algorithm: 'HS256',
      },
    }),
  ],

  // Providers
  providers: [
    JwtStrategy, // Passport strategy for JWT validation
    JwtAuthGuard, // NestJS guard for route protection
  ],

  // Exports for use in other modules
  exports: [
    JwtAuthGuard, // Export guard for use in other modules
    JwtModule, // Export JWT service for token generation
  ],
})
export class AuthModule {}
