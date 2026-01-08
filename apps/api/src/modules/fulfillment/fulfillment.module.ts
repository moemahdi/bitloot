import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../jobs/queues';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Key } from '../orders/key.entity';
import { Product } from '../catalog/entities/product.entity';
import { FulfillmentService } from './fulfillment.service';
import { KinguinClient } from './kinguin.client';
import { MockKinguinClient } from './kinguin.mock';
import { R2StorageClient } from '../storage/r2.client';
import { MockR2StorageClient } from '../storage/r2-storage.mock';
import { DeliveryService } from './delivery.service';
import { EmailsModule } from '../emails/emails.module';
import { MetricsModule } from '../metrics/metrics.module';
import { OrdersService } from '../orders/orders.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminOpsModule } from '../admin/admin-ops.module';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentGateway } from './fulfillment.gateway';

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
 * - TypeORM: Order, OrderItem, Key, Product repository access
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
    // Database access (includes Product for looking up kinguinOfferId)
    TypeOrmModule.forFeature([Order, OrderItem, Key, Product]),

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

    // Catalog module (provides CatalogService for OrdersService)
    CatalogModule,

    // Admin ops module (provides AdminOpsService for feature flags)
    AdminOpsModule,

    // JWT module for WebSocket authentication
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    // Kinguin API client (factory pattern for environment config)
    // Uses real client when valid Kinguin credentials exist (including sandbox)
    {
      provide: KinguinClient,
      useFactory: () => {
        const logger = new Logger('FulfillmentModule');
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

    // R2 Storage client (factory pattern for environment config)
    {
      provide: R2StorageClient,
      useFactory: () => {
        const logger = new Logger('R2StorageClientFactory');
        const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
        const endpoint = process.env.R2_ENDPOINT ?? 'https://s3.us-west-2.amazonaws.com';
        const bucketName = process.env.R2_BUCKET ?? 'bitloot-keys';

        // Check if real credentials are provided
        const hasCredentials =
          accessKeyId !== '' &&
          accessKeyId !== 'mock' &&
          secretAccessKey !== '' &&
          secretAccessKey !== 'mock';

        // Use real client when credentials are available (even in dev mode)
        if (hasCredentials) {
          logger.log(`✅ Using real R2StorageClient (bucket: ${bucketName})`);
          return new R2StorageClient({
            endpoint,
            accessKeyId,
            secretAccessKey,
            bucketName,
          });
        }

        // Fall back to mock only when credentials are missing
        logger.warn('⚠️ Using MockR2StorageClient (no R2 credentials provided)');
        return new MockR2StorageClient() as unknown as R2StorageClient;
      },
    },

    // Fulfillment orchestration service
    FulfillmentService,
    // Orders service used for setting reservationId without duplicating logic
    OrdersService,
    // Delivery service used by fulfillment
    DeliveryService,
    // WebSocket gateway for real-time updates
    FulfillmentGateway,
  ],
  controllers: [FulfillmentController],
  exports: [FulfillmentService, KinguinClient, R2StorageClient, OrdersService, DeliveryService],
})
export class FulfillmentModule { }
