import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Email Bounce Entity
 * Tracks email delivery failures for suppression list management
 *
 * Used to prevent sending to addresses with hard bounces
 * and to analyze email deliverability issues
 */
@Entity('email_bounces')
@Index(['email', 'type'])
@Index(['type', 'createdAt'])
@Index(['bouncedAt'])
export class EmailBounce {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @Index()
  email!: string; // Normalized to lowercase

  @Column({
    type: 'enum',
    enum: ['hard', 'soft', 'complaint'],
    nullable: false,
  })
  type!: 'hard' | 'soft' | 'complaint';

  @Column({
    type: 'text',
    nullable: true,
  })
  reason?: string; // e.g., "Invalid mailbox", "Mailbox full", "User complaint"

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  externalBounceId?: string; // Reference ID from Resend webhook

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  bouncedAt!: Date; // When the bounce occurred

  @CreateDateColumn()
  createdAt!: Date; // When record was created locally
}
