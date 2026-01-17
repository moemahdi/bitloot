import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { PromoRedemption } from './promoredemption.entity';

/**
 * PromoCode discount types
 * - percent: Percentage off (0-100)
 * - fixed: Fixed amount off in EUR
 */
export type PromoDiscountType = 'percent' | 'fixed';

/**
 * PromoCode scope types
 * - global: Applies to any order
 * - category: Applies only to products in specified category
 * - product: Applies only to specific product(s)
 */
export type PromoScopeType = 'global' | 'category' | 'product';

@Entity('promocodes')
@Index(['code'], { unique: true })
@Index(['isActive', 'startsAt', 'expiresAt'])
@Index(['scopeType', 'scopeValue'])
export class PromoCode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Unique promo code string (case-insensitive, stored uppercase)
     * Max 50 characters, alphanumeric with allowed symbols
     */
    @Column({ type: 'varchar', length: 50 })
    code!: string;

    /**
     * Human-readable description for admin reference
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    /**
     * Type of discount: percent or fixed amount
     */
    @Column({
        type: 'enum',
        enum: ['percent', 'fixed'],
        default: 'percent',
    })
    discountType!: PromoDiscountType;

    /**
     * Discount value:
     * - For 'percent': 0-100 (e.g., 10 = 10% off)
     * - For 'fixed': Amount in EUR (e.g., 5.00 = €5 off)
     */
    @Column('decimal', { precision: 20, scale: 8 })
    discountValue!: string;

    /**
     * Minimum order value required to use this promo (in EUR)
     * Null = no minimum
     */
    @Column('decimal', { precision: 20, scale: 8, nullable: true })
    minOrderValue?: string;

    /**
     * Maximum total uses across all users
     * Null = unlimited
     */
    @Column({ type: 'int', nullable: true })
    maxUsesTotal?: number;

    /**
     * Maximum uses per unique user (by userId or email)
     * Null = unlimited per user
     */
    @Column({ type: 'int', nullable: true })
    maxUsesPerUser?: number;

    /**
     * Current total usage count (incremented on successful redemption)
     */
    @Column({ type: 'int', default: 0 })
    usageCount!: number;

    /**
     * Scope type: global, category, or product
     */
    @Column({
        type: 'enum',
        enum: ['global', 'category', 'product'],
        default: 'global',
    })
    scopeType!: PromoScopeType;

    /**
     * Scope value: category slug or product ID(s)
     * For global scope, this is null
     * For category: category slug (e.g., 'games')
     * For product: comma-separated product IDs or single product ID
     */
    @Column({ type: 'varchar', length: 500, nullable: true })
    scopeValue?: string;

    /**
     * When the promo code becomes active
     * Null = immediately active
     */
    @Column({ type: 'timestamptz', nullable: true })
    startsAt?: Date;

    /**
     * When the promo code expires
     * Null = never expires
     */
    @Column({ type: 'timestamptz', nullable: true })
    expiresAt?: Date;

    /**
     * Whether this promo can be combined with other promos
     * If false, order can only have one promo applied
     */
    @Column({ type: 'boolean', default: false })
    stackable!: boolean;

    /**
     * Whether the promo code is currently active
     * Admin can disable codes without deleting them
     */
    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    /**
     * All redemptions of this promo code
     */
    @OneToMany(() => PromoRedemption, (r) => r.promoCode)
    redemptions!: PromoRedemption[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
