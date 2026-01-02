import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

/**
 * WebhookLog Entity
 *
 * Tracks all incoming webhooks for:
 * - Idempotency (prevents duplicate processing)
 * - Audit trail (compliance and debugging)
 * - Replay protection (timing-based deduplication)
 *
 * @example
 * Store webhook: payment_id=123 from NOWPayments
 * On retry with same payment_id: mark as processed=true, skip side effects
 * Audit: query by orderId to see all webhook history
 */
@Entity('webhook_logs')
@Index(['externalId', 'webhookType', 'createdAt'])
@Index(['orderId', 'createdAt'])
@Index(['webhookType', 'processed', 'createdAt'])
@Unique('UQ_webhook_idempotency', ['externalId', 'webhookType', 'paymentStatus'])
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * External webhook ID (e.g., payment_id from NOWPayments)
   * Used for idempotency key
   * @example "5ea7a3ce-9b8f-4e4f-a8a1-5c5b5c5c5c5c"
   */
  @Column('varchar', { length: 255 })
  @Index()
  externalId!: string;

  /**
   * Webhook type identifier
   * Allows multiple webhook sources (NOWPayments, Kinguin, Resend, etc.)
   * @example "nowpayments_ipn"
   */
  @Column('varchar', { length: 50 })
  webhookType!: string;

  /**
   * Raw webhook payload (JSON)
   * Stored as-is for debugging and replay
   * Never expose to frontend
   */
  @Column('jsonb')
  payload!: Record<string, unknown>;

  /**
   * Raw webhook signature/token (if provided)
   * DO NOT LOG THIS FIELD
   * Used for HMAC verification only
   */
  @Column('text', { nullable: true })
  signature?: string;

  /**
   * Whether signature verification passed
   * false = rejected (bad signature, replay, etc.)
   * true = accepted (signature valid)
   */
  @Column('boolean', { default: false })
  signatureValid!: boolean;

  /**
   * Whether this webhook has been processed
   * Used for idempotency:
   * - false: first receipt, process side effects
   * - true: duplicate receipt, skip side effects
   */
  @Column('boolean', { default: false })
  processed!: boolean;

  /**
   * Order this webhook pertains to (UUID string)
   * Links webhook to business entity
   * Allows query: "Get all webhooks for order X"
   * Stored as string to avoid circular dependency
   */
  @Column('uuid', { nullable: true })
  @Index()
  orderId?: string;

  /**
   * Payment ID associated with this webhook (if applicable)
   * De-normalized from payload for easier queries
   * Used for quick lookup: "Find webhook by payment_id"
   */
  @Column('varchar', { length: 255, nullable: true })
  paymentId?: string;

  /**
   * Processing result (status after handling)
   * Stored as JSON for flexibility
   *
   * @example
   * ```json
   * {
   *   "success": true,
   *   "action": "marked_paid",
   *   "fulfillmentQueued": true,
   *   "timestamp": "2025-11-08T10:30:00Z"
   * }
   * ```
   */
  @Column('jsonb', { nullable: true })
  result?: Record<string, unknown>;

  /**
   * Status from webhook payload
   * De-normalized for easier queries
   * @example "finished", "waiting", "failed", "underpaid"
   */
  @Column('varchar', { length: 50, nullable: true })
  paymentStatus?: string;

  /**
   * Error details if processing failed
   * Stored for debugging and support
   */
  @Column('text', { nullable: true })
  error?: string;

  /**
   * IP address of webhook sender (if available)
   * Used for security audit
   */
  @Column('varchar', { length: 45, nullable: true })
  sourceIp?: string;

  /**
   * Number of processing attempts
   * Prevents infinite retry loops
   */
  @Column('int', { default: 1 })
  attemptCount!: number;

  /**
   * Timestamp when created (webhook received)
   * Indexed for time-series queries
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Timestamp when last updated
   * Tracks retry attempts
   */
  @UpdateDateColumn()
  updatedAt!: Date;
}
