import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { UserService } from './user.service';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { User } from '../../database/entities/user.entity';
import { Session } from '../../database/entities/session.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { MetricsModule } from '../metrics/metrics.module';
import { EmailsModule } from '../emails/emails.module';
import { OrdersModule } from '../orders/orders.module';

/**
 * Authentication Module
 * Phase 2: OTP-based passwordless authentication
 *
 * Features:
 * - 6-digit OTP email verification
 * - JWT token generation (15m access, 7d refresh)
 * - Refresh token rotation
 * - Rate limiting (3 OTP requests/15min, 5 verifies/60s)
 * - Automatic user creation on first OTP verification
 *
 * Exports:
 * - AuthService: Token generation and validation
 * - OtpService: OTP generation and verification
 * - UserService: User account management
 * - JwtAuthGuard: Route protection
 * - RefreshTokenGuard: Refresh token validation
 *
 * Usage:
 * 1. POST /auth/request-otp → Send OTP to email
 * 2. POST /auth/verify-otp → Verify code, get JWT tokens
 * 3. POST /auth/refresh → Get new access token
 * 4. Use @UseGuards(JwtAuthGuard) to protect routes
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-key',
      signOptions: {
        expiresIn: '15m',
        algorithm: 'HS256',
      },
    }),
    MetricsModule,
    forwardRef(() => EmailsModule),
    forwardRef(() => OrdersModule), // Link guest orders to users on login
  ],

  controllers: [AuthController, SessionController],

  providers: [
    AuthService,
    OtpService,
    UserService,
    SessionService,
    JwtStrategy,
    JwtAuthGuard,
    RefreshTokenGuard,
  ],

  exports: [
    AuthService,
    OtpService,
    UserService,
    SessionService,
    JwtAuthGuard,
    RefreshTokenGuard,
    JwtModule,
  ],
})
export class AuthModule {}
