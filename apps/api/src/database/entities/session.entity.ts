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
import { User } from './user.entity';

/**
 * Session entity for tracking user login sessions
 * Enables "Active Sessions" management in user dashboard
 * Stores device info, IP address, and allows session revocation
 */
@Entity('user_sessions')
@Index(['userId', 'isRevoked'])
@Index(['expiresAt'])
@Index(['refreshTokenHash'], { unique: true })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /**
   * Hashed refresh token for validation
   * When user presents refresh token, hash it and compare
   */
  @Column()
  refreshTokenHash!: string;

  /**
   * Device/browser information parsed from User-Agent
   * Example: "Chrome 120 on Windows 10"
   */
  @Column({ nullable: true })
  deviceInfo?: string;

  /**
   * User-Agent header for detailed device detection
   */
  @Column({ nullable: true, length: 500 })
  userAgent?: string;

  /**
   * Client IP address (for location display)
   */
  @Column({ nullable: true })
  ipAddress?: string;

  /**
   * Approximate location derived from IP (optional)
   * Example: "New York, US"
   */
  @Column({ nullable: true })
  location?: string;

  /**
   * Last activity timestamp (updated on token refresh)
   */
  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

  /**
   * Session expiration (matches refresh token expiry - 7 days)
   */
  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Whether this session has been manually revoked
   */
  @Column({ default: false })
  isRevoked!: boolean;

  /**
   * When the session was revoked (for audit)
   */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  /**
   * Is this the current session making the request?
   * Transient field - not stored in DB, computed at runtime
   */
  isCurrent?: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
