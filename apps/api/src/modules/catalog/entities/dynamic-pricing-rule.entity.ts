import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('dynamic_pricing_rules')
@Index(['productId', 'priority', 'isActive'])
@Index(['rule_type', 'createdAt'])
@Index(['minCostMinor', 'maxCostMinor', 'isActive']) // Cost range lookup index
export class DynamicPricingRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  productId?: string | null;

  @Column({
    type: 'enum',
    enum: ['margin_percent', 'fixed_markup', 'floor_cap', 'dynamic_adjust'],
  })
  rule_type!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  marginPercent?: string; // e.g., "35.50" for 35.5%

  @Column({ type: 'bigint', nullable: true })
  fixedMarkupMinor?: number; // in cents

  @Column({ type: 'bigint', nullable: true })
  floorMinor?: number; // minimum selling price in cents

  @Column({ type: 'bigint', nullable: true })
  capMinor?: number; // maximum selling price in cents

  @Column({ type: 'bigint', nullable: true })
  minCostMinor?: number; // minimum cost in cents for rule to apply (inclusive)

  @Column({ type: 'bigint', nullable: true })
  maxCostMinor?: number; // maximum cost in cents for rule to apply (exclusive)

  @Column({ type: 'int', default: 0 })
  priority!: number; // 0 = highest

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations - optional for global rules (productId = null)
  @ManyToOne(() => Product, (product) => product.pricingRules, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'productId' })
  product?: Product | null;
}
