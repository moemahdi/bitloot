import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';

/**
 * Payment Entity - Tracks cryptocurrency payments via NOWPayments API
 *
 * Status flow:
 * - 'created': Initial state after payment creation
 * - 'waiting': IPN received, awaiting blockchain confirmation
 * - 'confirmed': Blockchain confirmed (intermediate state)
 * - 'finished': Payment complete and meets amount requirement
 * - 'underpaid': Payment received but amount less than required (non-refundable)
 * - 'failed': Payment failed or expired
 */
@Entity('payments')
@Index(['externalId'], { unique: true })
@Index(['orderId'])
@Index(['status'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  /**
   * External Payment ID from NOWPayments API
   * Used as idempotency key: if same externalId received in IPN twice, skip processing
   */
  @Column('varchar', { unique: true })
  externalId!: string;

  /**
   * Payment provider identifier
   * Currently: 'nowpayments'
   * Future: Could support 'stripe', 'coinbase', etc.
   */
  @Column('varchar', { default: 'nowpayments' })
  provider!: string;

  /**
   * Payment status (maps to NOWPayments payment_status field)
   * - created: Just created in NOWPayments
   * - waiting: Waiting for blockchain confirmation
   * - confirmed: Blockchain confirmed
   * - finished: Payment received and validated (paid)
   * - underpaid: Received but less than required amount
   * - failed: Payment failed or expired
   */
  @Column({
    type: 'enum',
    enum: ['created', 'waiting', 'confirmed', 'finished', 'underpaid', 'failed'],
    default: 'created',
  })
  status!: 'created' | 'waiting' | 'confirmed' | 'finished' | 'underpaid' | 'failed';

  /**
   * Full IPN payload from NOWPayments
   * Stored as JSON for audit trail and debugging
   * Includes: payment_id, payment_status, order_id, price_amount, pay_amount, etc.
   */
  @Column('jsonb', { nullable: true })
  rawPayload?: Record<string, string | number | boolean | null>;

  /**
   * Price amount in EUR (or configured currency)
   * Stored in payment record for audit trail
   */
  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  priceAmount?: string;

  /**
   * Currency for price (e.g., 'eur')
   */
  @Column('varchar', { nullable: true })
  priceCurrency?: string;

  /**
   * Amount actually received in crypto
   * From NOWPayments: pay_amount field
   */
  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  payAmount?: string;

  /**
   * Cryptocurrency received (e.g., 'btc', 'eth')
   * From NOWPayments: pay_currency field
   */
  @Column('varchar', { nullable: true })
  payCurrency?: string;

  /**
   * Blockchain confirmations received
   * Incremented as IPN updates arrive
   */
  @Column('int', { default: 0 })
  confirmations!: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
