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
import { PromoCode } from './promocode.entity';
import { Order } from '../../orders/order.entity';
import { User } from '../../../database/entities/user.entity';

/**
 * PromoRedemption - Audit trail for promo code usage
 * 
 * Each record represents a successful promo code application to an order.
 * Used for:
 * - Tracking usage counts (per-user and total)
 * - Analytics and reporting
 * - Idempotency (prevent duplicate redemptions)
 */
@Entity('promoredemptions')
@Index(['promoCodeId', 'createdAt'])
@Index(['orderId'])
@Index(['userId', 'promoCodeId'])
@Unique(['promoCodeId', 'orderId']) // Prevent duplicate redemptions for same order
export class PromoRedemption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Reference to the promo code used
     */
    @Column({ type: 'uuid' })
    promoCodeId!: string;

    @ManyToOne(() => PromoCode, (p) => p.redemptions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'promoCodeId' })
    promoCode!: PromoCode;

    /**
     * Reference to the order where promo was applied
     */
    @Column({ type: 'uuid' })
    orderId!: string;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order!: Order;

    /**
     * User who redeemed (null for guest checkout)
     */
    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user?: User;

    /**
     * Email used for the order (for guest user tracking)
     */
    @Column({ type: 'varchar', length: 320 })
    email!: string;

    /**
     * Actual discount amount applied to the order (in EUR)
     * May be less than the promo value if capped to order total
     */
    @Column('decimal', { precision: 20, scale: 8 })
    discountApplied!: string;

    /**
     * Original order total before discount
     */
    @Column('decimal', { precision: 20, scale: 8 })
    originalTotal!: string;

    /**
     * Final order total after discount
     */
    @Column('decimal', { precision: 20, scale: 8 })
    finalTotal!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
