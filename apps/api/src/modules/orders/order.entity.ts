import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';
import { Key } from './key.entity';
import { User } from '../../database/entities/user.entity';
import type { ProductSourceType } from '../catalog/entities/product.entity';

/**
 * OrderStatus — Comprehensive order lifecycle states
 *
 * Mapping to Payment states:
 * - 'created':      Payment not yet created
 * - 'waiting':      Payment waiting (IPN: payment_status = 'waiting')
 * - 'confirming':   Payment confirming (IPN: payment_status = 'confirming')
 * - 'paid':         Payment finished successfully → Enqueue fulfillment (IPN: payment_status = 'finished')
 * - 'underpaid':    Payment insufficient (IPN: payment_status = 'underpaid') - TERMINAL, non-refundable
 * - 'failed':       Payment failed (IPN: payment_status = 'failed') - TERMINAL
 * - 'fulfilled':    Fulfillment complete, keys delivered - TERMINAL success
 */
export type OrderStatus =
  | 'created' // Initial: Order created, awaiting payment
  | 'waiting' // Payment in progress: Crypto transfer detected
  | 'confirming' // Payment in progress: Awaiting blockchain confirmations
  | 'paid' // Payment successful: Ready to fulfill
  | 'underpaid' // Payment failed: Insufficient amount (non-refundable)
  | 'failed' // Payment failed: Error or expired (refundable)
  | 'fulfilled'; // Success: Keys delivered, order complete

@Entity('orders')
@Index(['userId', 'createdAt']) // For user order lookups sorted by date
@Index(['status', 'createdAt']) // For status filtering
@Index(['sourceType']) // For filtering by source type
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  /**
   * User ID - foreign key to User entity
   * Null for guest checkouts (allowed in Level 4 before auth is mandatory)
   * Indexed for user order lookups
   */
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * Source type for fulfillment routing
   * - 'custom': Manual fulfillment (keys already uploaded to R2)
   * - 'kinguin': Automatic fulfillment via Kinguin API
   * Derived from product sourceType at order creation time
   */
  @Column({
    type: 'enum',
    enum: ['custom', 'kinguin'],
    default: 'custom',
  })
  sourceType!: ProductSourceType;

  /**
   * Status field — updated via Payment status machine
   * - created: Initial, awaiting payment creation
   * - waiting: Payment waiting (customer transferred crypto)
   * - confirming: Payment confirming (awaiting blockchain confirmations)
   * - paid: Payment success (enqueue fulfillment)
   * - underpaid: Payment failed (insufficient amount, non-refundable)
   * - failed: Payment failed (error/expired, potentially refundable)
   * - fulfilled: Order complete (keys delivered)
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'created',
  })
  status!: OrderStatus;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  totalCrypto!: string; // store as string to avoid FP issues

  /**
   * Kinguin reservation ID for tracking fulfillment status
   * Populated when fulfillment job is created (payment confirmed)
   * Used to link order to Kinguin's internal reservation system
   * Nullable until fulfillment begins
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  kinguinReservationId?: string;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => Payment, (p) => p.order)
  payments!: Payment[];

  /**
   * Keys delivered to customer for this order
   * Populated during fulfillment (after Kinguin provides keys)
   * Each order item can have multiple keys (bundle purchases)
   * Cascade delete ensures keys are removed if order is deleted
   */
  @OneToMany(() => Key, (k) => k.orderItem)
  keys!: Key[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
