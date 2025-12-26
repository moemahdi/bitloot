import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProductOffer } from './product-offer.entity';
import { DynamicPricingRule } from './dynamic-pricing-rule.entity';

/**
 * Product source type for hybrid fulfillment model
 * - 'custom': Fulfilled manually (admin uploads keys to R2)
 * - 'kinguin': Fulfilled automatically via Kinguin API
 */
export type ProductSourceType = 'custom' | 'kinguin';

@Entity('products')
@Index(['isPublished', 'price', 'createdAt'])
@Index(['platform', 'region', 'isPublished'])
@Index(['slug'])
@Index(['category', 'isPublished'])
@Index(['sourceType'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId?: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  region?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  drm?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ageRating?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  /**
   * Source type for fulfillment routing
   * - 'custom': Manual fulfillment (you upload the key)
   * - 'kinguin': Automatic fulfillment via Kinguin API
   */
  @Column({
    type: 'enum',
    enum: ['custom', 'kinguin'],
    default: 'custom',
  })
  sourceType!: ProductSourceType;

  /**
   * Kinguin offer ID - required when sourceType = 'kinguin'
   * This is the offer ID from Kinguin's catalog
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  kinguinOfferId?: string;

  /**
   * Cover image URL for product display
   * Fetched from Kinguin API images.cover.url or set manually for custom products
   */
  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  /**
   * @deprecated Use sourceType instead. Kept for backward compatibility.
   */
  @Column({ type: 'boolean', default: false })
  isCustom!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column('decimal', { precision: 20, scale: 8, default: '0.00000000' })
  cost!: string; // Cost in EUR (from Kinguin)

  @Column({ type: 'char', length: 3, default: 'EUR' })
  currency!: string;

  @Column('decimal', { precision: 20, scale: 8, default: '0.00000000' })
  price!: string; // Selling price in crypto

  @Column({ type: 'int', default: 0 })
  priceVersion!: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'tsvector', nullable: true })
  searchTsv?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ProductOffer, (offer) => offer.product, { cascade: true })
  offers!: ProductOffer[];

  @OneToMany(() => DynamicPricingRule, (rule) => rule.product, { cascade: true })
  pricingRules!: DynamicPricingRule[];
}
