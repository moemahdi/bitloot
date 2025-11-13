import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../jobs/queues';
import { HttpModule } from '@nestjs/axios';

import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Key } from '../orders/key.entity';
import { FulfillmentService } from './fulfillment.service';
import { KinguinClient } from './kinguin.client';
import { MockKinguinClient } from './kinguin.mock';
import { R2StorageClient } from '../storage/r2.client';
import { MockR2StorageClient } from '../storage/r2-storage.mock';
import { DeliveryService } from './delivery.service';
import { EmailsModule } from '../emails/emails.module';
import { MetricsModule } from '../metrics/metrics.module';
import { OrdersService } from '../orders/orders.service';

/**
 * Fulfillment Module
 *
 * Orchestrates the fulfillment pipeline:
 * 1. Reserve product via Kinguin API
 * 2. Receive delivery via webhook
 * 3. Encrypt keys with AES-256-GCM
 * 4. Upload to Cloudflare R2
 * 5. Generate signed URLs (15-min expiry)
 * 6. Track deliveries
 *
 * Dependencies:
 * - TypeORM: Order, OrderItem repository access
 * - BullMQ: Async job queuing for fulfillment
 * - Axios: HTTP client for Kinguin API
 *
 * Exports:
 * - FulfillmentService: Orchestration logic
 * - KinguinClient: Kinguin API wrapper
 * - R2StorageClient: Cloudflare R2 integration
 */
@Module({
  imports: [
    // Database access
    TypeOrmModule.forFeature([Order, OrderItem, Key]),

    // BullMQ queue for async job processing
    BullModule.registerQueue({
      name: QUEUE_NAMES.FULFILLMENT,
    }),

    // HTTP client for external APIs
    HttpModule,

    // Emails module (provides EmailsService)
    EmailsModule,

    // Metrics module (provides MetricsService for EmailsService)
    MetricsModule,
  ],
  providers: [
    // Kinguin API client (factory pattern for environment config)
    // Uses mock client in development mode or when credentials are obviously test/mock
    {
      provide: KinguinClient,
      useFactory: () => {
        const apiKey = process.env.KINGUIN_API_KEY ?? '';
        const baseUrl = process.env.KINGUIN_BASE ?? 'https://api.kinguin.io/v1';
        const isDevMode = process.env.NODE_ENV === 'development';
        const isMockKey = apiKey.includes('mock') || apiKey === 'dcdd1e2280b04bf60029b250cfbf4cec';

        // Use mock client in dev mode or with obviously test credentials
        if (isDevMode || isMockKey) {
          return new MockKinguinClient() as unknown as KinguinClient;
        }

        return new KinguinClient(apiKey, baseUrl);
      },
    },

    // R2 Storage client (factory pattern for environment config)
    {
      provide: R2StorageClient,
      useFactory: () => {
        const isDevMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
        const endpoint = process.env.R2_ENDPOINT ?? 'https://s3.us-west-2.amazonaws.com';
        const bucketName = process.env.R2_BUCKET ?? 'bitloot-keys';

        // Use mock in dev/test mode or when credentials missing
        const hasCredentials =
          accessKeyId !== '' &&
          accessKeyId !== 'mock' &&
          secretAccessKey !== '' &&
          secretAccessKey !== 'mock';

        if (isDevMode || !hasCredentials) {
          return new MockR2StorageClient() as unknown as R2StorageClient;
        }

        return new R2StorageClient({
          endpoint,
          accessKeyId,
          secretAccessKey,
          bucketName,
        });
      },
    },

    // Fulfillment orchestration service
    FulfillmentService,
    // Orders service used for setting reservationId without duplicating logic
    OrdersService,
    // Delivery service used by fulfillment
    DeliveryService,
  ],
  exports: [FulfillmentService, KinguinClient, R2StorageClient, OrdersService, DeliveryService],
})
export class FulfillmentModule {}
