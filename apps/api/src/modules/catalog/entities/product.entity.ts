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

@Entity('products')
@Index(['isPublished', 'priceMinor', 'createdAt'])
@Index(['platform', 'region', 'isPublished'])
@Index(['slug'])
@Index(['category', 'isPublished'])
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

  @Column({ type: 'boolean', default: false })
  isCustom!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'bigint', default: 0 })
  costMinor!: number; // in cents/satoshis

  @Column({ type: 'char', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'bigint', default: 0 })
  priceMinor!: number; // retail price in cents

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
