import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'created' | 'paid' | 'fulfilled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ type: 'varchar', length: 20, default: 'created' })
  status!: OrderStatus;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  total!: string; // store as string to avoid FP issues

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
