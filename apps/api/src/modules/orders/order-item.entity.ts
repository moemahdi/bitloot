import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Key } from './key.entity';
import type { ProductSourceType } from '../catalog/entities/product.entity';

@Entity('order_items')
@Index(['productSourceType'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order!: Order;

  @Column({ type: 'varchar', length: 100 })
  productId!: string; // e.g., "demo-product"

  /**
   * Captured from product at time of order creation
   * Used for fulfillment routing:
   * - 'custom': Retrieve pre-uploaded key from R2
   * - 'kinguin': Purchase from Kinguin API
   */
  @Column({
    type: 'enum',
    enum: ['custom', 'kinguin'],
    default: 'custom',
  })
  productSourceType!: ProductSourceType;

  @Column({ type: 'text', nullable: true })
  signedUrl!: string | null;

  /**
   * Keys delivered for this specific order item
   * Each item can have multiple keys (e.g., license key + activation code)
   * Cascade delete ensures keys are removed if item is deleted
   */
  @OneToMany(() => Key, (k) => k.orderItem, { cascade: true })
  keys!: Key[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
