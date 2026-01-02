import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../jobs/queues';
import { WebhookLog } from '../../database/entities/webhook-log.entity';
import { KinguinService } from './kinguin.service';
import { KinguinController } from './kinguin.controller';
import { KinguinClient } from '../fulfillment/kinguin.client';
import { MockKinguinClient } from '../fulfillment/kinguin.mock';
import { OrdersModule } from '../orders/orders.module';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * Kinguin Module
 *
 * Provides integration with Kinguin Sales Manager API v1 for:
 * - Reserving stock (reservation-driven workflow)
 * - Delivering keys (transitioning reservation to delivered)
 * - Polling delivery status
 * - Receiving webhooks from Kinguin (order fulfilled notifications)
 *
 * @example
 * // In app.module.ts:
 * @Module({
 *   imports: [KinguinModule, ...]
 * })
 * export class AppModule {}
 *
 * // In a service:
 * constructor(private readonly kinguin: KinguinService) {}
 *
 * async fulfillOrder(orderId: string) {
 *   const reservation = await this.kinguin.reserve(orderId, productId, quantity);
 *   // ... later ...
 *   const delivery = await this.kinguin.give(reservationId);
 * }
 *
 * @see https://docs.kinguin.net/api/v1 - Kinguin API Documentation
 */
@Module({
  imports: [
    HttpModule,
    OrdersModule,
    TypeOrmModule.forFeature([WebhookLog]),
    BullModule.registerQueue({ name: QUEUE_NAMES.FULFILLMENT }),
    MetricsModule,
  ],
  providers: [
    // Kinguin API client - uses real client when valid credentials exist
    {
      provide: KinguinClient,
      useFactory: () => {
        const logger = new Logger('KinguinModule');
        const apiKey = process.env.KINGUIN_API_KEY ?? '';
        const baseUrl = process.env.KINGUIN_BASE_URL ?? 'https://gateway.kinguin.net/esa/api/v2';

        // Check if credentials look like mock/test credentials
        const isMockOrEmptyKey =
          apiKey === '' ||
          apiKey.includes('mock') ||
          apiKey === 'dcdd1e2280b04bf60029b250cfbf4cec';

        // Use mock client ONLY when credentials are missing/mock
        // Real sandbox credentials should use real client even in dev mode
        if (isMockOrEmptyKey) {
          logger.log('🧪 Using MockKinguinClient (no valid credentials)');
          return new MockKinguinClient() as unknown as KinguinClient;
        }

        logger.log(`✅ Using real KinguinClient (API key: ${apiKey.substring(0, 8)}...)`);
        return new KinguinClient(apiKey, baseUrl);
      },
    },
    KinguinService,
  ],
  controllers: [KinguinController],
  exports: [KinguinService, KinguinClient],
})
export class KinguinModule {}
