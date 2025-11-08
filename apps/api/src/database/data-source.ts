import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Order } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';
import { InitOrders1710000000000 } from './migrations/1710000000000-InitOrders';

dotenv.config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order, OrderItem],
  migrations: [InitOrders1710000000000],
  logging: true,
  synchronize: false,
});
