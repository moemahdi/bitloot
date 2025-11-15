import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { Key } from '../modules/orders/key.entity';
import { Payment } from '../modules/payments/payment.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { User } from './entities/user.entity';
import { AuditLog } from './entities/audit-log.entity';
import { InitOrders1710000000000 } from './migrations/1710000000000-InitOrders';
import { AddKeysReservation1720000000000 } from './migrations/1720000000000-add-keys-reservation';
import { CreatePayments1730000000001 } from './migrations/1730000000001-CreatePayments';
import { CreateWebhookLogs1730000000002 } from './migrations/1730000000002-CreateWebhookLogs';
import { UpdateOrdersStatusEnum1730000000003 } from './migrations/1730000000003-UpdateOrdersStatusEnum';
import { CreateUsers1735000000000 } from './migrations/1735000000000-CreateUsers';
import { CreateAuditLogs1731700000000 } from './migrations/1731700000000-CreateAuditLogs';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order, OrderItem, Key, Payment, WebhookLog, User, AuditLog],
  migrations: [
    InitOrders1710000000000,
    AddKeysReservation1720000000000,
    CreatePayments1730000000001,
    CreateWebhookLogs1730000000002,
    UpdateOrdersStatusEnum1730000000003,
    CreateUsers1735000000000,
    CreateAuditLogs1731700000000,
  ],
  logging: true,
  synchronize: false,
});
