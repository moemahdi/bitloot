import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * User entity for OTP-based authentication
 * Stores user account information and email confirmation status
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['emailConfirmed', 'createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  email!: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  emailConfirmed!: boolean;

  @Column({ nullable: true })
  confirmationTokenHash?: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role!: 'user' | 'admin';

  /**
   * Pending email address during email change verification
   * Will replace current email after OTP verification
   */
  @Column({ nullable: true })
  pendingEmail?: string;

  /**
   * Timestamp when user requested account deletion
   * Account will be permanently deleted 30 days after this date
   * User can cancel deletion before the 30-day period ends
   */
  @Column({ type: 'timestamptz', nullable: true })
  deletionRequestedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
