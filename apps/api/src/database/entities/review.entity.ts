import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from '../../modules/orders/order.entity';
import { Product } from '../../modules/catalog/entities/product.entity';

/**
 * Review status for moderation workflow
 */
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Review entity for customer product/order reviews
 * 
 * Features:
 * - Customer reviews with star ratings (1-5)
 * - Admin moderation workflow (pending → approved/rejected)
 * - Homepage display flag for featured reviews
 * - Links to orders, users, and optionally specific products
 * - Verified purchase tracking
 * - Soft delete support
 */
@Entity('reviews')
@Index('IDX_reviews_order', ['orderId'])
@Index('IDX_reviews_user', ['userId'])
@Index('IDX_reviews_product', ['productId'])
@Index('IDX_reviews_status_created', ['status', 'createdAt'])
@Index('IDX_reviews_homepage', ['displayOnHomepage', 'status', 'createdAt'])
@Index('IDX_reviews_rating', ['rating', 'status'])
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============ RELATIONSHIPS ============

  @Column('uuid')
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column('uuid', { nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column('uuid', { nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product!: Product | null;

  // ============ REVIEW CONTENT ============

  /**
   * Star rating (1-5)
   */
  @Column('integer')
  rating!: number;

  /**
   * Review title/headline (optional)
   */
  @Column('varchar', { length: 255, nullable: true })
  title!: string | null;

  /**
   * Review body text
   */
  @Column('text')
  content!: string;

  /**
   * Display name for the reviewer
   * - Auto-populated from user.email (first part) if not provided
   * - Can be overridden by admin
   */
  @Column('varchar', { length: 100, nullable: true })
  authorName!: string | null;

  // ============ MODERATION ============

  /**
   * Moderation status: pending, approved, rejected
   */
  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status!: ReviewStatus;

  /**
   * Whether to display this review on the homepage
   * Only effective when status is 'approved'
   */
  @Column('boolean', { default: false })
  displayOnHomepage!: boolean;

  /**
   * Whether this is from a verified purchase
   * False for admin-created reviews
   */
  @Column('boolean', { default: true })
  isVerifiedPurchase!: boolean;

  /**
   * Internal admin notes (not shown to customers)
   */
  @Column('text', { nullable: true })
  adminNotes!: string | null;

  /**
   * Admin user who approved/rejected the review
   */
  @Column('uuid', { nullable: true })
  approvedById!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy!: User | null;

  /**
   * When the review was approved/rejected
   */
  @Column('timestamptz', { nullable: true })
  approvedAt!: Date | null;

  // ============ TIMESTAMPS ============

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  // ============ COMPUTED PROPERTIES ============

  /**
   * Get the display name for this review
   */
  getDisplayName(): string {
    if (this.authorName !== undefined && this.authorName !== null && this.authorName !== '') {
      return this.authorName;
    }
    if (this.user?.email != null && this.user.email !== '') {
      // Extract username from email
      const username = this.user.email.split('@')[0];
      // Mask part of it for privacy (e.g., "john***")
      if (username !== undefined && username.length > 3) {
        return username.substring(0, 3) + '***';
      }
      return username ?? 'Anonymous';
    }
    return 'Anonymous';
  }

  /**
   * Check if this review is publicly visible
   */
  isPublic(): boolean {
    return this.status === ReviewStatus.APPROVED && this.deletedAt === null;
  }
}
