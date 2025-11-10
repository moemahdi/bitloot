import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';

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
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

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
  total!: string; // store as string to avoid FP issues

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => Payment, (p) => p.order, { lazy: true })
  payments!: Payment[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
