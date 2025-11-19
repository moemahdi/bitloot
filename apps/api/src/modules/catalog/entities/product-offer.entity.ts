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

@Entity('product_offers')
@Index(['productId', 'isActive', 'costMinor'])
@Index(['provider', 'providerSku'], { unique: true })
export class ProductOffer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 30 })
  provider!: string; // 'kinguin', 'steam', etc.

  @Column({ type: 'varchar', length: 100 })
  providerSku!: string; // external product ID

  @Column({ type: 'int', nullable: true })
  stock?: number;

  @Column({ type: 'bigint' })
  costMinor!: number; // source cost in cents

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  lastSeenAt!: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.offers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;
}
