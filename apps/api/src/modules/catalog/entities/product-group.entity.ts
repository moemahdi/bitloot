import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * ProductGroup Entity
 * 
 * Groups related products together (e.g., same game with different platforms/editions/regions).
 * Displays as a single card in the catalog, allowing users to choose variants.
 * 
 * Example: "Battlefield 6" group containing:
 * - Battlefield 6 PS5 Standard
 * - Battlefield 6 PS5 Phantom Edition
 * - Battlefield 6 Xbox Standard
 * - Battlefield 6 Steam Key
 * - etc.
 */
@Entity('product_groups')
@Index(['slug'], { unique: true })
@Index(['isActive', 'displayOrder'])
@Index(['isActive', 'createdAt'])
export class ProductGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Display title for the group (e.g., "Battlefield 6")
   */
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  /**
   * URL-friendly slug for the group (e.g., "battlefield-6")
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  /**
   * Optional description for the group
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Cover image URL for the group card
   * Can be inherited from the first product or set manually
   */
  @Column({ type: 'text', nullable: true })
  coverImageUrl?: string;

  /**
   * Short tagline shown on the card (e.g., "Available on 5 platforms")
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  tagline?: string;

  /**
   * Whether the group is active/visible in the catalog
   */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * Display order for sorting groups (lower = first)
   */
  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  /**
   * Minimum price among all products in the group (cached)
   * Updated when products are added/removed or prices change
   */
  @Column('decimal', { precision: 20, scale: 8, default: '0.00000000' })
  minPrice!: string;

  /**
   * Maximum price among all products in the group (cached)
   */
  @Column('decimal', { precision: 20, scale: 8, default: '0.00000000' })
  maxPrice!: string;

  /**
   * Number of products in this group (cached)
   */
  @Column({ type: 'int', default: 0 })
  productCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.group)
  products!: Product[];
}
