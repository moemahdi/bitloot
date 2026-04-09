import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from '../../payments/payment.entity';

/**
 * CreditTopup status
 */
export type CreditTopupStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

/**
 * CreditTopup — Tracks credit top-up payments via NOWPayments
 *
 * Created when user initiates a top-up. Confirmed when IPN webhook
 * confirms payment. Credits are granted only after confirmation.
 */
@Entity('credit_topups')
@Index(['userId', 'createdAt'])
@Index(['paymentId'])
export class CreditTopup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  /** Requested top-up amount in EUR */
  @Column('decimal', { precision: 20, scale: 8 })
  amountEur!: string;

  /** NOWPayments external payment ID (numeric string) */
  @Column({ type: 'varchar', length: 64, nullable: true })
  npPaymentId?: string | null;

  /** Reference to internal Payment entity (optional) */
  @Column({ type: 'uuid', nullable: true })
  paymentId?: string | null;

  @ManyToOne(() => Payment, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentId' })
  payment?: Payment;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: CreditTopupStatus;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
