import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import {
  ProductDeliveryType,
  InventoryItemStatus,
} from '../types/product-delivery.types';

/**
 * Product Inventory Entity
 *
 * Stores digital items (keys, accounts, codes, etc.) for custom products.
 * Each row represents a single sellable item that can be delivered to a customer.
 *
 * Item data is encrypted using AES-256-GCM for security.
 *
 * @example
 * // Key item stored in itemDataEncrypted:
 * { "type": "key", "key": "XXXXX-XXXXX-XXXXX-XXXXX" }
 *
 * // Account item stored in itemDataEncrypted:
 * { "type": "account", "username": "user@email.com", "password": "secret123" }
 */
@Entity('product_inventory')
@Index(['productId', 'status'])
@Index(['status'])
@Index(['itemHash'])
@Index(['expiresAt'])
@Index(['reservedAt'])
export class ProductInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Reference to the product this item belongs to
   */
  @Column('uuid')
  @Index()
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  /**
   * Delivery type of this item (matches product's deliveryType)
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: ProductDeliveryType.KEY,
  })
  deliveryType!: ProductDeliveryType;

  // ============================================
  // ENCRYPTED ITEM DATA
  // ============================================

  /**
   * AES-256-GCM encrypted JSON of ItemData
   * Contains the actual key, credentials, or other delivery content
   */
  @Column({ type: 'text' })
  itemDataEncrypted!: string;

  /**
   * Initialization vector used for encryption
   * Each item has a unique IV for security
   */
  @Column({ type: 'varchar', length: 32 })
  encryptionIv!: string;

  /**
   * Authentication tag from AES-GCM encryption
   * Used to verify data integrity during decryption
   */
  @Column({ type: 'varchar', length: 32 })
  authTag!: string;

  // ============================================
  // STATUS TRACKING
  // ============================================

  /**
   * Current status of the inventory item
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: InventoryItemStatus.AVAILABLE,
  })
  @Index()
  status!: InventoryItemStatus;

  /**
   * Order ID this item is reserved for (during payment processing)
   */
  @Column({ type: 'uuid', nullable: true })
  reservedForOrderId?: string;

  /**
   * When the item was reserved
   * Used to auto-release expired reservations
   */
  @Column({ type: 'timestamptz', nullable: true })
  reservedAt?: Date;

  /**
   * Order ID this item was sold to
   */
  @Column({ type: 'uuid', nullable: true })
  soldToOrderId?: string;

  /**
   * When the item was sold
   */
  @Column({ type: 'timestamptz', nullable: true })
  soldAt?: Date;

  /**
   * Expiration date for time-limited items
   * Item will be marked as expired after this date
   */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  // ============================================
  // AUDIT & TRACKING
  // ============================================

  /**
   * When the item was uploaded
   */
  @CreateDateColumn({ type: 'timestamptz' })
  uploadedAt!: Date;

  /**
   * Admin user who uploaded this item
   */
  @Column({ type: 'uuid', nullable: true })
  uploadedById?: string;

  /**
   * Supplier or source of this item (e.g., "Kinguin", "G2A", "Manual")
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier?: string;

  /**
   * Acquisition cost for profit tracking
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: string;

  /**
   * Selling price when sold (snapshot for profit calculation)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  soldPrice?: string;

  /**
   * Admin notes about this item
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ============================================
  // INTEGRITY
  // ============================================

  /**
   * SHA-256 hash of the item data (before encryption)
   * Used for duplicate detection
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  itemHash?: string;

  /**
   * Masked preview of the item for admin display
   * e.g., "XXXX-****-****-XXXX" for keys
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  maskedPreview?: string;

  // ============================================
  // QUALITY TRACKING
  // ============================================

  /**
   * Whether this item has been reported as invalid by a customer
   */
  @Column({ type: 'boolean', default: false })
  wasReported!: boolean;

  /**
   * Reason for invalid status if marked invalid
   */
  @Column({ type: 'text', nullable: true })
  invalidReason?: string;

  /**
   * Admin who marked this item as invalid
   */
  @Column({ type: 'uuid', nullable: true })
  invalidatedById?: string;

  /**
   * When this item was marked as invalid
   */
  @Column({ type: 'timestamptz', nullable: true })
  invalidatedAt?: Date;
}
