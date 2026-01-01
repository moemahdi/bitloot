import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductOffer } from './product-offer.entity';
import { DynamicPricingRule } from './dynamic-pricing-rule.entity';
import { ProductGroup } from './product-group.entity';

/**
 * Product source type for hybrid fulfillment model
 * - 'custom': Fulfilled manually (admin uploads keys to R2)
 * - 'kinguin': Fulfilled automatically via Kinguin API
 */
export type ProductSourceType = 'custom' | 'kinguin';

/**
 * Video object from Kinguin API
 */
export interface KinguinVideo {
  video_id: string;
}

/**
 * Screenshot object from Kinguin API
 */
export interface KinguinScreenshot {
  url: string;
  thumbnail: string;
}

/**
 * System requirement object from Kinguin API
 */
export interface KinguinSystemRequirement {
  system: string;
  requirement: string[];
}

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

  /** Kinguin kinguinId (integer ID) */
  @Column({ type: 'int', nullable: true })
  kinguinId?: number;

  /** Kinguin productId (string ID) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  kinguinProductId?: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  title!: string;

  /** Original name from Kinguin */
  @Column({ type: 'text', nullable: true })
  originalName?: string;

  @Column({ type: 'text', nullable: true })
  subtitle?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string;

  @Column({ type: 'text', nullable: true })
  drm?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ageRating?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  // ============================================
  // KINGUIN API EXTENDED FIELDS
  // ============================================

  /** Array of developer names */
  @Column('simple-array', { nullable: true })
  developers?: string[];

  /** Array of publisher names */
  @Column('simple-array', { nullable: true })
  publishers?: string[];

  /** Array of genre names */
  @Column('simple-array', { nullable: true })
  genres?: string[];

  /** Release date (YYYY-MM-DD format) */
  @Column({ type: 'varchar', length: 20, nullable: true })
  releaseDate?: string;

  /** Total cheapest offers quantity */
  @Column({ type: 'int', nullable: true })
  qty?: number;

  /** Quantity of text serials */
  @Column({ type: 'int', nullable: true })
  textQty?: number;

  /** Total number of offers */
  @Column({ type: 'int', nullable: true })
  offersCount?: number;

  /** Total quantity from all offers */
  @Column({ type: 'int', nullable: true })
  totalQty?: number;

  /** Is this a pre-order product */
  @Column({ type: 'boolean', default: false })
  isPreorder!: boolean;

  /** Metacritic score (0-100) */
  @Column({ type: 'int', nullable: true })
  metacriticScore?: number;

  /** Region name (e.g., "Region free", "Europe") */
  @Column({ type: 'varchar', length: 100, nullable: true })
  regionalLimitations?: string;

  /** List of excluded country codes (ISO 2-letter) */
  @Column('simple-array', { nullable: true })
  countryLimitation?: string[];

  /** Kinguin region ID */
  @Column({ type: 'int', nullable: true })
  regionId?: number;

  /** Activation details / instructions */
  @Column({ type: 'text', nullable: true })
  activationDetails?: string;

  /** Array of video objects with video_id (YouTube) */
  @Column('jsonb', { nullable: true })
  videos?: KinguinVideo[];

  /** Array of supported languages */
  @Column('simple-array', { nullable: true })
  languages?: string[];

  /** System requirements by OS */
  @Column('jsonb', { nullable: true })
  systemRequirements?: KinguinSystemRequirement[];

  /** Product tags (e.g., "base", "dlc") */
  @Column('simple-array', { nullable: true })
  tags?: string[];

  /** Array of cheapest offer seller names */
  @Column('simple-array', { nullable: true })
  merchantName?: string[];

  /** Steam app ID */
  @Column({ type: 'varchar', length: 50, nullable: true })
  steam?: string;

  /** Product screenshots */
  @Column('jsonb', { nullable: true })
  screenshots?: KinguinScreenshot[];

  /** Cover image thumbnail URL */
  @Column({ type: 'text', nullable: true })
  coverThumbnailUrl?: string;

  /** Cheapest offer IDs */
  @Column('simple-array', { nullable: true })
  cheapestOfferId?: string[];

  // ============================================
  // END KINGUIN API EXTENDED FIELDS
  // ============================================

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

  // ============================================
  // PRODUCT GROUP (for variant grouping)
  // ============================================

  /**
   * Optional group ID - when set, this product belongs to a group
   * Groups allow showing multiple variants (platforms/editions/regions)
   * as a single card in the catalog
   */
  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @ManyToOne(() => ProductGroup, (group) => group.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'groupId' })
  group?: ProductGroup;

  // Relations
  @OneToMany(() => ProductOffer, (offer) => offer.product, { cascade: true })
  offers!: ProductOffer[];

  @OneToMany(() => DynamicPricingRule, (rule) => rule.product, { cascade: true })
  pricingRules!: DynamicPricingRule[];
}
