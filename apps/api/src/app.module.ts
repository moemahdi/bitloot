import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { HealthController } from './health/health.controller';
import { Order } from './modules/orders/order.entity';
import { OrderItem } from './modules/orders/order-item.entity';
import { OrdersService } from './modules/orders/orders.service';
import { OrdersController } from './modules/orders/orders.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { StorageService } from './modules/storage/storage.service';
import { EmailsService } from './modules/emails/emails.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
  ],
  controllers: [HealthController, OrdersController, PaymentsController],
  providers: [OrdersService, PaymentsService, StorageService, EmailsService],
})
export class AppModule {}
