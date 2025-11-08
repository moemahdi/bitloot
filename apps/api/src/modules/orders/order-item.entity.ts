import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order!: Order;

  @Column({ type: 'varchar', length: 100 })
  productId!: string; // e.g., "demo-product"

  @Column({ type: 'text', nullable: true })
  signedUrl!: string | null;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
