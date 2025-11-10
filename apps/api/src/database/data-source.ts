import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Payment } from '../modules/payments/payment.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { InitOrders1710000000000 } from './migrations/1710000000000-InitOrders';
import { CreatePayments1730000000001 } from './migrations/1730000000001-CreatePayments';
import { CreateWebhookLogs1730000000002 } from './migrations/1730000000002-CreateWebhookLogs';
import { UpdateOrdersStatusEnum1730000000003 } from './migrations/1730000000003-UpdateOrdersStatusEnum';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order, OrderItem, Payment, WebhookLog],
  migrations: [
    InitOrders1710000000000,
    CreatePayments1730000000001,
    CreateWebhookLogs1730000000002,
    UpdateOrdersStatusEnum1730000000003,
  ],
  logging: true,
  synchronize: false,
});
