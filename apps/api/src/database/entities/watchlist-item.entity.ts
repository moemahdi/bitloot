import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from '../../modules/catalog/entities/product.entity';

/**
 * WatchlistItem entity for customer product watchlists
 *
 * Features:
 * - Customers can save products for later viewing
 * - Each user can have multiple products in their watchlist
 * - Unique constraint prevents duplicate entries
 * - Links to both User and Product entities
 */
@Entity('watchlist_items')
@Unique('UQ_watchlist_user_product', ['userId', 'productId'])
@Index('IDX_watchlist_user', ['userId'])
@Index('IDX_watchlist_product', ['productId'])
@Index('IDX_watchlist_created', ['createdAt'])
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============ USER RELATIONSHIP ============

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // ============ PRODUCT RELATIONSHIP ============

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  // ============ TIMESTAMPS ============

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
