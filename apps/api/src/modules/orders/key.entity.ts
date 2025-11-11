import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

/**
 * Key Entity - Represents a license key or product code delivered to customer
 *
 * Tracks:
 * - Association to OrderItem (1:1 or 1:N from Kinguin)
 * - Storage reference (R2 object key where encrypted key is stored)
 * - Access audit (when customer revealed/viewed the key)
 */
@Entity('keys')
@Index(['orderItemId'])
@Index(['createdAt'])
export class Key {
  /**
   * Unique identifier for this key record
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Foreign key to order_items table
   * Links this key to a specific order line item
   */
  @Column('uuid')
  orderItemId!: string;

  /**
   * Reference to order item in database
   * Establishes 1:many relationship (each order item can have multiple keys)
   */
  @ManyToOne(() => OrderItem, (orderItem) => orderItem.keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem!: OrderItem;

  /**
   * Storage reference (R2 object key)
   * Format: "keys/{orderId}/{keyId}.json"
   * Contains encrypted key data accessible via signed URL
   */
  @Column('text', { nullable: true })
  storageRef?: string;

  /**
   * Timestamp when customer revealed/viewed the key
   * Used for audit trail and access tracking
   * null = key not yet viewed
   */
  @Column('timestamp', { nullable: true })
  viewedAt?: Date;

  /**
   * Timestamp when key record was created
   * Automatically set on insert
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Timestamp when key record was last updated
   * Automatically updated on modify
   */
  @UpdateDateColumn()
  updatedAt!: Date;
}
