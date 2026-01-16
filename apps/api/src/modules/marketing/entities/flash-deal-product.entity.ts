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
import { FlashDeal } from './flash-deal.entity';
import { Product } from '../../catalog/entities/product.entity';

/**
 * Links products to flash deals with specific discount pricing
 * Each product in a flash deal can have a custom discount percentage or fixed price
 */
@Entity('flash_deal_products')
@Unique(['flashDealId', 'productId'])
@Index(['flashDealId', 'displayOrder'])
export class FlashDealProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'flash_deal_id' })
  flashDealId!: string;

  @Column({ name: 'product_id' })
  productId!: string;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent?: string;

  @Column({ name: 'discount_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  discountPrice?: string;

  @Column({ name: 'original_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  originalPrice?: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'stock_limit', nullable: true })
  stockLimit?: number;

  @Column({ name: 'sold_count', default: 0 })
  soldCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => FlashDeal, (fd) => fd.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flash_deal_id' })
  flashDeal!: FlashDeal;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
