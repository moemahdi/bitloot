import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { FlashDealProduct } from './flash-deal-product.entity';

/**
 * Represents a Flash Deal campaign with time-limited pricing
 * Flash deals create urgency with countdown timers and limited-time discounts
 */
@Entity('flash_deals')
@Index(['isActive', 'startsAt', 'endsAt'])
@Index(['slug'])
export class FlashDeal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ unique: true, length: 200 })
  slug!: string;

  @Column({ name: 'headline', length: 300, nullable: true })
  headline?: string;

  @Column({ name: 'sub_headline', length: 300, nullable: true })
  subHeadline?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: false })
  isActive!: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  // Visual customization
  @Column({ name: 'background_type', length: 20, default: 'gradient' })
  backgroundType!: 'gradient' | 'solid' | 'image' | 'video';

  @Column({ name: 'background_value', length: 500, nullable: true })
  backgroundValue?: string;

  @Column({ name: 'accent_color', length: 20, default: '#00D9FF' })
  accentColor!: string;

  @Column({ name: 'text_color', length: 20, default: '#FFFFFF' })
  textColor!: string;

  @Column({ name: 'badge_text', length: 50, nullable: true })
  badgeText?: string;

  @Column({ name: 'badge_color', length: 20, nullable: true })
  badgeColor?: string;

  @Column({ name: 'cta_text', length: 50, default: 'Shop Now' })
  ctaText!: string;

  @Column({ name: 'cta_link', length: 500, nullable: true })
  ctaLink?: string;

  // Display options
  @Column({ name: 'show_countdown', default: true })
  showCountdown!: boolean;

  @Column({ name: 'show_products', default: true })
  showProducts!: boolean;

  @Column({ name: 'products_count', default: 8 })
  productsCount!: number;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  /**
   * Display type determines where the flash deal appears:
   * - 'inline': Shows in the regular page flow (default position)
   * - 'sticky': Shows at the top of the page, above the header, as a sticky bar
   */
  @Column({ name: 'display_type', length: 20, default: 'inline' })
  displayType!: 'inline' | 'sticky';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @OneToMany(() => FlashDealProduct, (fdp) => fdp.flashDeal)
  products?: FlashDealProduct[];
}
