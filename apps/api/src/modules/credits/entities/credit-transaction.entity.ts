import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Transaction types
 */
export type CreditTransactionType =
  | 'topup'
  | 'spend'
  | 'reward'
  | 'affiliate_conversion'
  | 'referral'
  | 'cashback'
  | 'refund'
  | 'adjustment'
  | 'expiry'
  | 'admin_grant'
  | 'underpayment_recovery'
  | 'forfeit';  // Account deletion forfeiture

/**
 * Reference types — the source entity of the transaction
 */
export type CreditReferenceType =
  | 'order'
  | 'quest'
  | 'quest_instance'
  | 'milestone'
  | 'payout'
  | 'topup'
  | 'topup_bonus'
  | 'affiliate_commission'
  | 'referral'
  | 'admin'
  | 'underpayment_recovery';

/**
 * Credit type — cash or promo
 */
export type CreditType = 'cash' | 'promo';

/**
 * CreditTransaction — Double-entry ledger for all balance changes
 *
 * Every balance change is recorded as a transaction row.
 * Positive amount = credit (incoming), negative = debit (outgoing).
 *
 * For promo grants (positive amount, credit_type='promo'):
 *   `remaining` tracks unconsumed value for FIFO spending.
 * For debits and cash credits: `remaining` is NULL.
 */
@Entity('credit_transactions')
@Index(['userId', 'createdAt'])
@Index(['userId', 'creditType', 'expired'])
@Index(['referenceType', 'referenceId'])
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  type!: CreditTransactionType;

  @Column({ type: 'varchar', length: 10 })
  creditType!: CreditType;

  /** Positive = credit, negative = debit */
  @Column('decimal', { precision: 20, scale: 8 })
  amount!: string;

  /** Running balance snapshot after this transaction */
  @Column('decimal', { precision: 20, scale: 8 })
  balanceAfter!: string;

  /**
   * For promo grants: tracks unconsumed value for FIFO spending.
   * NULL for debits and cash credits.
   */
  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  remaining?: string | null;

  /** Source entity type */
  @Column({ type: 'varchar', length: 30, nullable: true })
  referenceType?: CreditReferenceType | null;

  /** Source entity ID */
  @Column({ type: 'uuid', nullable: true })
  referenceId?: string | null;

  /** Human-readable description */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Promo credits only — expiry date. NULL for cash. */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  /** Set true by expiry cron when this grant expires */
  @Column({ type: 'boolean', default: false })
  expired!: boolean;

  /** Set true if this promo grant was extended for active users */
  @Column({ type: 'boolean', default: false })
  extended!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
