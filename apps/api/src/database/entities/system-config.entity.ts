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
import { User } from './user.entity';

/**
 * SystemConfig entity for API credentials and system settings
 *
 * Stores encrypted API keys and configuration for:
 * - NOWPayments (payments)
 * - Kinguin (fulfillment)
 * - Resend (emails)
 * - Cloudflare R2 (storage)
 * - Cloudflare Turnstile (bot protection)
 *
 * Supports sandbox/production environment switching
 */
@Entity('system_configs')
@Index(['provider', 'key', 'environment'], { unique: true })
@Index(['provider', 'environment'])
@Index(['isActive'])
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Integration provider name
   * e.g., 'nowpayments', 'kinguin', 'resend', 'r2', 'turnstile'
   */
  @Column({ length: 50 })
  provider!: string;

  /**
   * Configuration key name
   * e.g., 'api_key', 'secret_key', 'base_url', 'callback_url'
   */
  @Column({ length: 100 })
  key!: string;

  /**
   * Configuration value (encrypted for secrets, plain for URLs)
   * Use `isSecret: true` for encrypted values
   */
  @Column({ type: 'text' })
  value!: string;

  /**
   * Whether this value is a secret (encrypted in database)
   */
  @Column({ default: false })
  isSecret!: boolean;

  /**
   * Environment: 'sandbox' or 'production'
   */
  @Column({
    type: 'enum',
    enum: ['sandbox', 'production'],
    default: 'sandbox',
  })
  environment!: 'sandbox' | 'production';

  /**
   * Whether this config is currently active
   * Only one environment per provider should be active
   */
  @Column({ default: true })
  isActive!: boolean;

  /**
   * Human-readable description
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Validation pattern (regex) for the value
   * Used for frontend validation hints
   */
  @Column({ length: 255, nullable: true })
  validationPattern?: string;

  /**
   * Display order for UI grouping
   */
  @Column({ default: 0 })
  displayOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Admin user who last updated this config
   */
  @Column({ type: 'uuid', nullable: true })
  updatedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User;
}
