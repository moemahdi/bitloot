import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * Represents a configurable section on the marketing homepage
 * Supports 6 core sections: flash-deals, trending, featured, categories, bundles, gift-cards
 */
@Entity('page_sections')
@Index(['isEnabled', 'displayOrder'])
@Index(['scheduleStart', 'scheduleEnd'])
export class PageSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'section_key', unique: true, length: 50 })
  sectionKey!: string;

  @Column({ name: 'display_name', length: 100 })
  displayName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'category', length: 50 })
  category!: 'promotional' | 'products' | 'navigation';

  @Column({ name: 'is_enabled', default: true })
  isEnabled!: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder!: number;

  @Column({ name: 'config', type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @Column({ name: 'schedule_start', type: 'timestamptz', nullable: true })
  scheduleStart?: Date;

  @Column({ name: 'schedule_end', type: 'timestamptz', nullable: true })
  scheduleEnd?: Date;

  @Column({ name: 'target_audience', type: 'jsonb', nullable: true })
  targetAudience?: {
    newUsers?: boolean;
    regions?: string[];
    userSegments?: string[];
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;
}
