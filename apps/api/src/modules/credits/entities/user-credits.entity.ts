import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * UserCredits — 1:1 with User
 *
 * Stores aggregate credit balances for a user.
 * Created lazily on first credit event (not on user registration).
 *
 * Two balance types:
 * - cash_balance: from crypto top-ups, never expires, refundable
 * - promo_balance: from rewards/grants, expires 90 days, non-refundable
 *
 * CHECK constraints enforce non-negative balances at database level.
 */
@Entity('user_credits')
@Index(['userId'], { unique: true })
export class UserCredits {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Cash balance from top-ups — never expires */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  cashBalance!: string;

  /** Promo balance from rewards — expires 90 days */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  promoBalance!: string;

  /** Lifetime top-up amount */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalToppedUp!: string;

  /** Lifetime promo credits earned */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalEarned!: string;

  /** Lifetime credits spent */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalSpent!: string;

  /** Lifetime promo credits expired */
  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalExpired!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
