import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FulfillmentGateway } from './fulfillment.gateway';
import { FulfillmentService } from './fulfillment.service';

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
 * 
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
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [FulfillmentGateway, FulfillmentService],
  exports: [FulfillmentGateway],
})
export class WebSocketModule {}
