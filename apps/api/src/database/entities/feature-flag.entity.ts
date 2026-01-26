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
 * FeatureFlag entity for runtime feature toggles
 * Persisted to database (replaces in-memory Map)
 *
 * Categories:
 * - Payments: payment_processing_enabled
 * - Fulfillment: fulfillment_enabled, auto_fulfill_enabled
 * - Products: kinguin_enabled, custom_products_enabled
 * - Notifications: email_notifications_enabled
 * - Security: captcha_enabled
 * - System: maintenance_mode
 */
@Entity('feature_flags')
@Index(['name'], { unique: true })
@Index(['category', 'enabled'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  @Index()
  name!: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, default: 'System' })
  category!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Admin user who last updated this flag
   */
  @Column({ type: 'uuid', nullable: true })
  updatedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User;
}
