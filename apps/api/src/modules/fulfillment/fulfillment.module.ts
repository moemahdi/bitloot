import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';

import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { FulfillmentService } from './fulfillment.service';
import { KinguinClient } from './kinguin.client';
import { R2StorageClient } from '../storage/r2.client';

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
    TypeOrmModule.forFeature([Order, OrderItem]),

    // BullMQ queue for async job processing
    BullModule.registerQueue({
      name: 'fulfillment',
    }),

    // HTTP client for external APIs
    HttpModule,
  ],
  providers: [
    // Kinguin API client (factory pattern for environment config)
    {
      provide: KinguinClient,
      useFactory: () => {
        const apiKey = process.env.KINGUIN_API_KEY ?? '';
        const baseUrl = process.env.KINGUIN_BASE ?? 'https://api.kinguin.io/v1';
        return new KinguinClient(apiKey, baseUrl);
      },
    },

    // R2 Storage client (factory pattern for environment config)
    {
      provide: R2StorageClient,
      useFactory: () => {
        const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
        const endpoint = process.env.R2_ENDPOINT ?? 'https://s3.us-west-2.amazonaws.com';
        const bucketName = process.env.R2_BUCKET ?? 'bitloot-keys';
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
  ],
  exports: [FulfillmentService, KinguinClient, R2StorageClient],
})
export class FulfillmentModule {}
