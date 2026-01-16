import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BundleDeal } from './bundle-deal.entity';
import { Product } from '../../catalog/entities/product.entity';

/**
 * Links products to bundle deals
 * Each product has its own discount percentage
 */
@Entity('bundle_products')
@Unique(['bundleId', 'productId'])
@Index(['bundleId', 'displayOrder'])
export class BundleProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bundle_id' })
  bundleId!: string;

  @Column({ name: 'product_id' })
  productId!: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_bonus', default: false })
  isBonus!: boolean;

  /** Discount percentage for this product (0-100). Bonus items have 100% discount. */
  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => BundleDeal, (bd) => bd.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bundle_id' })
  bundle!: BundleDeal;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
