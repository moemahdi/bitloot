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
@Index(['isSpotlight', 'isActive', 'spotlightOrder'])
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

  // ============================================
  // SPOTLIGHT FIELDS
  // ============================================

  /**
   * Whether this group should appear on spotlight/games pages
   */
  @Column({ type: 'boolean', default: false })
  isSpotlight!: boolean;

  /**
   * Full-width hero banner/poster image URL
   */
  @Column({ type: 'text', nullable: true })
  heroImageUrl?: string;

  /**
   * YouTube/Vimeo embed URL for trailer
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  heroVideoUrl?: string;

  /**
   * Release date for "COMING SOON" countdown
   */
  @Column({ type: 'timestamp', nullable: true })
  releaseDate?: Date;

  /**
   * Rich marketing copy for spotlight page
   */
  @Column({ type: 'text', nullable: true })
  longDescription?: string;

  /**
   * Per-game accent color for theming (e.g., "#FF6B00")
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  accentColor?: string;

  /**
   * Badge text like "NEW RELEASE", "COMING SOON", "PRE-ORDER"
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  badgeText?: string;

  /**
   * Metacritic score (0-100)
   */
  @Column({ type: 'int', nullable: true })
  metacriticScore?: number;

  /**
   * Game developer name
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  developerName?: string;

  /**
   * Game publisher name
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  publisherName?: string;

  /**
   * Array of genre strings (e.g., ['Action', 'Open World'])
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  genres!: string[];

  /**
    * Array of structured feature highlights for the spotlight page
    * Format: [{ title: string, description: string }]
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
    features!: Array<{ title: string; description: string }>;

  /**
   * Array of FAQ items for the spotlight page
   * Format: [{ question: string, answer: string }]
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  faqItems!: Array<{ question: string; answer: string }>;

  /**
   * Display order in spotlight carousel (lower = first)
   */
  @Column({ type: 'int', default: 0 })
  spotlightOrder!: number;

  // Relations
  @OneToMany(() => Product, (product) => product.group)
  products!: Product[];
}
