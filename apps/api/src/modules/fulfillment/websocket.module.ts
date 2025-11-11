import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FulfillmentGateway } from './fulfillment.gateway';
import { FulfillmentModule } from './fulfillment.module';

/**
 * WebSocket Module for real-time fulfillment updates
 *
 * Provides WebSocket gateway for:
 * - Real-time order status updates (replaces 1s polling)
 * - Job queue event monitoring (admin only)
 * - Payment confirmation notifications
 * - Key delivery notifications
 * - Error alerts
 *
 * Features:
 * - JWT-based authentication
 * - Per-order subscriptions
 * - Admin-only system updates
 * - Automatic connection cleanup
 * - Heartbeat monitoring
 *
 * @example
 * // In NestJS module
 * @Module({
 *   imports: [WebSocketModule],
 * })
 * export class MyModule {}
 *
 * // In controller/service
 * constructor(private gateway: FulfillmentGateway) {}
 *
 * // Emit update
 * this.gateway.emitFulfillmentStatusChange({
 *   orderId: '123',
 *   status: 'paid',
 *   fulfillmentStatus: 'processing'
 * });
 */
@Module({
  imports: [
    // Import FulfillmentModule which has all required dependencies
    FulfillmentModule,
    // JWT for WebSocket authentication
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  // Only provide the gateway - all services come from FulfillmentModule
  providers: [FulfillmentGateway],
  exports: [FulfillmentGateway],
})
export class WebSocketModule {}
