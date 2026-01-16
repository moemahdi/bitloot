import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../catalog/entities/product.entity';
import { FlashDeal } from './flash-deal.entity';
import { BundleDeal } from './bundle-deal.entity';
import { User } from '../../../database/entities/user.entity';

/**
 * Tracks analytics events for marketing sections
 * Used for measuring section performance and optimizing conversions
 */
@Entity('section_analytics')
@Index(['sectionKey', 'eventType', 'createdAt'])
@Index(['productId', 'createdAt'])
export class SectionAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'section_key', length: 50 })
  sectionKey!: string;

  @Column({ name: 'event_type', length: 50 })
  eventType!: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'share';

  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData?: Record<string, unknown>;

  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @Column({ name: 'flash_deal_id', nullable: true })
  flashDealId?: string;

  @Column({ name: 'bundle_id', nullable: true })
  bundleId?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'session_id', length: 100, nullable: true })
  sessionId?: string;

  @Column({ name: 'device_type', length: 20, nullable: true })
  deviceType?: 'desktop' | 'mobile' | 'tablet';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(() => FlashDeal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'flash_deal_id' })
  flashDeal?: FlashDeal;

  @ManyToOne(() => BundleDeal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bundle_id' })
  bundleDeal?: BundleDeal;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
