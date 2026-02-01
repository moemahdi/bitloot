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
import { BundleProduct } from './bundle-product.entity';

/**
 * Represents a Bundle Deal - a curated package of products at a discounted price
 * Bundles can mix different product types (games, software, subscriptions)
 */
@Entity('bundle_deals')
@Index(['isActive', 'isFeatured', 'displayOrder'])
@Index(['slug'])
export class BundleDeal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ unique: true, length: 200 })
  slug!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'short_description', length: 300, nullable: true })
  shortDescription?: string;

  // Pricing
  @Column({ name: 'bundle_price', type: 'decimal', precision: 20, scale: 8 })
  bundlePrice!: string;

  @Column({ name: 'original_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  originalPrice?: string;

  @Column({ name: 'savings_amount', type: 'decimal', precision: 20, scale: 8, nullable: true })
  savingsAmount?: string;

  @Column({ name: 'savings_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  savingsPercent?: string;

  @Column({ name: 'currency', length: 10, default: 'USD' })
  currency!: string;

  // Status and scheduling
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt?: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date;

  // Visual customization
  @Column({ name: 'cover_image', length: 500, nullable: true })
  coverImage?: string;

  @Column({ name: 'hero_image', length: 500, nullable: true })
  heroImage?: string;

  @Column({ name: 'category', length: 100, nullable: true })
  category?: string;

  @Column({ name: 'badge_text', length: 50, nullable: true })
  badgeText?: string;

  @Column({ name: 'badge_color', length: 20, nullable: true })
  badgeColor?: string;

  @Column({ name: 'background_gradient', length: 200, nullable: true })
  backgroundGradient?: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  // Inventory
  @Column({ name: 'stock_limit', nullable: true })
  stockLimit?: number;

  @Column({ name: 'sold_count', default: 0 })
  soldCount!: number;

  // Product type filter for mixed bundles
  @Column({ name: 'product_types', type: 'jsonb', default: [] })
  productTypes!: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @OneToMany(() => BundleProduct, (bp) => bp.bundle)
  products?: BundleProduct[];
}
