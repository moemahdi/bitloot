import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['adminUserId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['target', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  adminUserId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminUserId' })
  admin?: User | null;

  @Column()
  action!: string;

  @Column()
  target!: string;

  @Column('jsonb', { nullable: true })
  payload?: Record<string, unknown> | null;

  @Column({ nullable: true })
  details?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
