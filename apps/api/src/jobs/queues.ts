/**
 * BullMQ Queue Configuration
 *
 * Centralized queue definitions for all async operations:
 * - payments-queue: Payment creation and status tracking
 * - fulfillment-queue: Kinguin order fulfillment and key delivery
 *
 * Each queue configured with:
 * - Retry strategy (exponential backoff up to 3 retries)
 * - Default job options (remove on complete after 24h, remove on failure)
 * - Dead-letter queue for failed jobs
 * - Observability (event listeners for tracking)
 */

import { BullModule } from '@nestjs/bullmq';

/**
 * Queue names used throughout the application
 * Must match queue names in processors
 */
export const QUEUE_NAMES = {
  PAYMENTS: 'payments-queue',
  FULFILLMENT: 'fulfillment-queue',
};

/**
 * Default job options for all queues
 * Applied to every job enqueued
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s initial delay
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours for audit
  },
  removeOnFail: false, // Keep failed jobs for debugging (they move to DLQ)
};

/**
 * Export BullModule root configuration
 * Place in AppModule imports array
 *
 * Usage:
 * @Module({
 *   imports: [BullQueues, ...]
 * })
 */
export const BullQueues = BullModule.forRoot({
  connection: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

/**
 * Export individual queue registrations
 * Use these in feature modules that enqueue jobs
 *
 * Usage in a service:
 * @Module({
 *   imports: [PaymentsQueue, ...]
 * })
 */
export const PaymentsQueue = BullModule.registerQueue({
  name: QUEUE_NAMES.PAYMENTS,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const FulfillmentQueue = BullModule.registerQueue({
  name: QUEUE_NAMES.FULFILLMENT,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

/**
 * Dead-Letter Queue for failed jobs
 * Stores permanently failed jobs (after max retries)
 */
export const DeadLetterQueue = BullModule.registerQueue({
  name: 'dlq-failed-jobs',
  defaultJobOptions: {
    // DLQ jobs don't retry, just stored for analysis
    removeOnComplete: {
      age: 604800, // Keep for 7 days
    },
  },
});

/**
 * BullMQ Job Type Definitions
 * Used for type-safe job data
 */

export interface PaymentJobData {
  orderId: string;
  email: string;
  priceAmount: string;
  priceCurrency: string;
  payCurrency?: string;
  userId?: string;
  idempotencyKey?: string;
}

export interface FulfillmentJobData {
  orderId: string;
  paymentId: string;
  kinguinOfferId: string;
  userEmail: string;
  quantity: number;
}

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  attempt?: number;
  timestamp: string;
}

/**
 * Queue Event Names for observability
 * Subscribe to these in monitoring/logging service
 */
export const QUEUE_EVENTS = {
  // Payment Queue Events
  PAYMENT_QUEUED: 'payment:queued',
  PAYMENT_STARTED: 'payment:started',
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_RETRYING: 'payment:retrying',

  // Fulfillment Queue Events
  FULFILLMENT_QUEUED: 'fulfillment:queued',
  FULFILLMENT_STARTED: 'fulfillment:started',
  FULFILLMENT_COMPLETED: 'fulfillment:completed',
  FULFILLMENT_FAILED: 'fulfillment:failed',
  FULFILLMENT_RETRYING: 'fulfillment:retrying',

  // DLQ Events
  JOB_DLQ: 'job:dlq', // Job moved to dead-letter queue
};
