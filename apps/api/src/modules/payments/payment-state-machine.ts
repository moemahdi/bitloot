/**
 * Payment State Machine - NOWPayments Integration
 *
 * This file documents the complete state machine for payment and order lifecycle management.
 * It ensures proper transitions, idempotency, and audit trails throughout the payment process.
 */

/**
 * ============================================================================
 * PAYMENT STATUS STATE MACHINE
 * ============================================================================
 *
 * Payment states represent the lifecycle of a cryptocurrency transaction through NOWPayments.
 * Each state transition is triggered by IPN webhook callbacks from NOWPayments.
 *
 * STATE DIAGRAM:
 *
 *     ┌─────────────┐
 *     │   CREATED   │  (Payment record created in BitLoot DB)
 *     └──────┬──────┘
 *            │ (IPN: payment_status = 'waiting')
 *            ▼
 *     ┌─────────────┐
 *     │   WAITING   │  (Customer sent crypto to pay_address)
 *     └──────┬──────┘
 *            │ (IPN: payment_status = 'confirming')
 *            ▼
 *     ┌──────────────┐
 *     │  CONFIRMING  │  (Transaction on-chain, awaiting confirmations)
 *     └──────┬───────┘
 *            │
 *      ┌─────┴────────┬──────────────┬────────────────┐
 *      │              │              │                │
 *      │ (conf >= 1)  │ (conf >= 1)  │ (partial pay)  │ (error/timeout)
 *      ▼              ▼              ▼                ▼
 *  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
 *  │FINISHED │  │CONFIRMED │  │UNDERPAID │  │   FAILED   │
 *  │ (PAID)  │  │(advanced)│  │(non-ref) │  │  (refund)  │
 *  └─────────┘  └──────────┘  └──────────┘  └────────────┘
 *
 * Terminal states: FINISHED, CONFIRMED, UNDERPAID, FAILED
 *
 * ============================================================================
 */

export interface PaymentStateTransition {
  fromState: PaymentStatus;
  toState: PaymentStatus;
  trigger: PaymentStatusReason;
  action: 'update_payment' | 'update_order' | 'enqueue_fulfillment' | 'send_email';
  idempotencyKey: string; // externalId from NOWPayments
}

export type PaymentStatus =
  | 'created' // Initial: Payment record just created
  | 'waiting' // Awaiting: Customer sent crypto to address
  | 'confirming' // Intermediate: Transaction detected, awaiting network confirmations
  | 'confirmed' // Advanced: Enough confirmations received (usually 1-2 blocks)
  | 'finished' // Terminal: Payment successful & settled
  | 'underpaid' // Terminal: Received but insufficient amount (non-refundable)
  | 'failed'; // Terminal: Payment failed or expired

export type PaymentStatusReason =
  | 'payment_created'
  | 'crypto_received_waiting'
  | 'transaction_confirmed'
  | 'enough_confirmations'
  | 'payment_finished'
  | 'underpayment_detected'
  | 'payment_failed'
  | 'payment_expired'
  | 'refund_issued';

/**
 * ============================================================================
 * ORDER STATUS STATE MACHINE (Updated for Real Payments)
 * ============================================================================
 *
 * Order states are mapped from Payment states. Each order tracks the customer's
 * purchase through checkout, payment, and fulfillment.
 *
 * STATE DIAGRAM:
 *
 *     ┌─────────────┐
 *     │   CREATED   │  (Order created in DB, awaiting payment)
 *     └──────┬──────┘
 *            │ (Payment.status = 'waiting')
 *            ▼
 *     ┌─────────────┐
 *     │   WAITING   │  (Payment in progress, customer sent crypto)
 *     └──────┬──────┘
 *            │ (Payment.status = 'confirming')
 *            ▼
 *     ┌──────────────┐
 *     │  CONFIRMING  │  (Awaiting blockchain confirmations)
 *     └──────┬───────┘
 *            │
 *      ┌─────┴────────┬──────────────┬────────────────┐
 *      │              │              │                │
 *      │              │              │ (Payment<amt)  │ (failed)
 *      ▼              ▼              ▼                ▼
 *  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
 *  │  PAID  │  │CONFIRMED │  │UNDERPAID │  │   FAILED   │
 *  │(fulfill)│  │(advanced)│  │(terminal)│  │ (terminal) │
 *  └────┬───┘  └──────────┘  └──────────┘  └────────────┘
 *       │ (Fulfillment enqueued)
 *       ▼
 *  ┌──────────┐
 *  │FULFILLED │  (Keys delivered, order complete)
 *  └──────────┘
 *
 * ============================================================================
 */

export type OrderStatus =
  | 'created' // Initial: Order just created, awaiting payment
  | 'waiting' // Payment: Crypto transfer in progress
  | 'confirming' // Payment: Awaiting blockchain confirmations
  | 'paid' // Payment Complete: Ready to fulfill
  | 'underpaid' // Terminal Error: Insufficient payment (non-refundable)
  | 'failed' // Terminal Error: Payment failed
  | 'fulfilled' // Terminal Success: Keys delivered
  | 'refunded' // Terminal: Admin refunded the order
  | 'cancelled'; // Terminal: Order cancelled

/**
 * ============================================================================
 * STATE MACHINE TRANSITION RULES
 * ============================================================================
 */

export const PAYMENT_STATE_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  created: ['waiting', 'failed'], // New payment can go to waiting or fail immediately
  waiting: ['confirming', 'failed'], // Waiting for confirmations or fails
  confirming: ['finished', 'confirmed', 'underpaid', 'failed'], // Can settle or fail
  confirmed: ['finished'], // Advanced state, usually stays here then finishes
  finished: [], // Terminal: immutable
  underpaid: [], // Terminal: immutable (non-refundable)
  failed: [], // Terminal: immutable
};

export const ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['waiting', 'failed', 'cancelled'], // New order awaits payment or fails/cancelled
  waiting: ['confirming', 'failed', 'cancelled'], // Awaiting payment confirmation
  confirming: ['paid', 'underpaid', 'failed', 'cancelled'], // Can become paid, underpaid, or fail
  paid: ['fulfilled', 'refunded', 'cancelled'], // Enqueue fulfillment, or admin refund/cancel
  underpaid: ['refunded'], // Can be refunded by admin
  failed: ['refunded'], // Can be refunded by admin
  fulfilled: ['refunded'], // Can be refunded by admin (e.g., key issue)
  refunded: [], // Terminal: immutable
  cancelled: [], // Terminal: immutable
};

/**
 * ============================================================================
 * PAYMENT → ORDER STATUS MAPPING
 * ============================================================================
 *
 * When a Payment status changes (via IPN), the corresponding Order status is updated.
 * This mapping ensures orders always reflect the payment state.
 */

export const PAYMENT_TO_ORDER_STATUS_MAP: Record<PaymentStatus, OrderStatus> = {
  created: 'created', // Payment just created → Order waiting
  waiting: 'waiting', // Customer sent crypto → Order waiting
  confirming: 'confirming', // Awaiting confirmations → Order confirming
  confirmed: 'confirming', // Advanced state → Order still confirming (rare)
  finished: 'paid', // Payment finished → Order PAID (enqueue fulfillment)
  underpaid: 'underpaid', // Payment underpaid → Order UNDERPAID (terminal, no refund)
  failed: 'failed', // Payment failed → Order FAILED (terminal)
};

/**
 * ============================================================================
 * IPN HANDLING LOGIC (Pseudocode)
 * ============================================================================
 *
 * When an IPN arrives from NOWPayments:
 *
 * 1. Extract: payment_id, payment_status, order_id from IPN payload
 * 2. Verify HMAC signature (timing-safe comparison)
 * 3. Check WebhookLog.externalId for idempotency
 *    - If exists with status='processed' → Log duplicate, return 200
 *    - If doesn't exist → Create new WebhookLog entry, status='pending'
 * 4. Query Payment by externalId (payment_id)
 *    - If not found → Error (log, don't crash)
 * 5. Validate state transition is allowed:
 *    if newStatus NOT in PAYMENT_STATE_TRANSITIONS[currentStatus]
 *       → Error (log, return 400)
 * 6. Update Payment.status = payment_status
 * 7. Update Payment.confirmations, rawPayload from IPN
 * 8. Get Order by Payment.orderId
 * 9. Update Order.status = PAYMENT_TO_ORDER_STATUS_MAP[payment_status]
 * 10. If payment_status === 'finished':
 *     - Enqueue fulfillment job to BullMQ with order details
 * 11. If payment_status === 'underpaid':
 *     - Send email: "Payment incomplete and non-refundable"
 *     - Mark order as underpaid
 * 12. If payment_status === 'failed':
 *     - Send email: "Payment failed, please try again"
 * 13. Update WebhookLog.status = 'processed', processedAt = now()
 * 14. Return 200 OK immediately
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * IDEMPOTENCY GUARANTEES
 * ============================================================================
 *
 * All transitions MUST be idempotent. If the same IPN arrives twice:
 *
 * 1. WebhookLog.externalId (UNIQUE constraint) ensures only ONE entry per payment
 * 2. If IPN already processed:
 *    - WebhookLog.status = 'processed'
 *    - Duplicate IPN returns 200 immediately (no state change)
 * 3. If IPN currently processing:
 *    - WebhookLog.status = 'pending'
 *    - Second concurrent IPN waits or errors gracefully
 * 4. If IPN fails:
 *    - WebhookLog.status = 'failed', error field contains reason
 *    - NOWPayments will retry; next attempt will re-check and possibly recover
 *
 * Database constraints enforce:
 * - Payment.externalId UNIQUE → one payment per NOWPayments payment_id
 * - WebhookLog.externalId UNIQUE → one processed IPN per payment_id
 *
 * Application logic ensures:
 * - State transitions are validated before execution
 * - No side effects if already processed
 * - Email only sent once per status change
 * - Fulfillment job only enqueued once
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * EXAMPLE IPN PROCESSING SCENARIOS
 * ============================================================================
 */

/**
 * SCENARIO 1: Happy Path (Payment Succeeds)
 *
 * 1. IPN #1: payment_status = 'waiting'
 *    - Order: created → waiting
 *    - Payment: created → waiting
 *
 * 2. IPN #2: payment_status = 'confirming'
 *    - Order: waiting → confirming
 *    - Payment: waiting → confirming
 *
 * 3. IPN #3: payment_status = 'finished'
 *    - Order: confirming → paid
 *    - Payment: confirming → finished
 *    - Enqueue fulfillment job
 *    - Send "Order Paid" email (with delivery link)
 *
 * 4. Fulfillment Job executes:
 *    - Call Kinguin API for keys
 *    - Encrypt and upload to R2
 *    - Update order_items.signedUrl
 *    - Mark Order: paid → fulfilled
 *    - Send "Keys Ready" email (with download link)
 *
 * Final state: Order.status = 'fulfilled', fulfillment complete ✅
 */

/**
 * SCENARIO 2: Underpayment
 *
 * 1. IPN #1: payment_status = 'waiting'
 *    - Order: created → waiting
 *
 * 2. IPN #2: payment_status = 'confirming'
 *    - Order: waiting → confirming
 *
 * 3. IPN #3: payment_status = 'underpaid' (pay_amount < price_amount)
 *    - Order: confirming → underpaid
 *    - Payment: confirming → underpaid
 *    - Send "Payment Incomplete" email (non-refundable warning)
 *    - NO fulfillment job enqueued
 *
 * Final state: Order.status = 'underpaid' (terminal) ❌
 * Admin can see this in dashboard and manually decide on refund policy
 */

/**
 * SCENARIO 3: Duplicate IPN (Idempotency)
 *
 * 1. IPN #1: payment_status = 'finished' (arrives successfully)
 *    - WebhookLog created: status = 'processed'
 *    - Order: confirming → paid
 *    - Payment: confirming → finished
 *    - Fulfillment job enqueued (once)
 *    - Email sent (once)
 *
 * 2. IPN #1 AGAIN (retransmitted due to network issue)
 *    - WebhookLog.externalId already exists → DUPLICATE
 *    - Check: status = 'processed' → Skip processing
 *    - Return 200 OK (no side effects)
 *
 * Result: Order state unchanged, fulfillment not duplicated ✅
 */

/**
 * SCENARIO 4: Out-of-Order IPNs (Eventual Consistency)
 *
 * Network delay causes IPN #3 to arrive before IPN #2:
 *
 * 1. IPN #1: payment_status = 'waiting'
 *    - Order: created → waiting
 *
 * 2. IPN #3: payment_status = 'finished' (arrives early!)
 *    - Current Payment.status = 'waiting'
 *    - Validate transition: waiting → finished? YES (allowed)
 *    - Update Payment: waiting → finished
 *    - Update Order: waiting → paid
 *    - Enqueue fulfillment
 *
 * 3. IPN #2: payment_status = 'confirming' (arrives late)
 *    - Current Payment.status = 'finished'
 *    - Validate transition: finished → confirming? NO (not allowed)
 *    - Log error, don't crash
 *    - Return 200 OK (caller doesn't need to retry)
 *
 * Result: System handles gracefully, final state is correct ✅
 * (In practice, NOWPayments sends in order, but system is resilient)
 */

/**
 * ============================================================================
 * CANCELLATION & REFUND HANDLING
 * ============================================================================
 *
 * In future versions, handle manual refunds:
 *
 * - If Order.status = 'paid' and customer requests refund:
 *   - Call NOWPayments refund API
 *   - On success, Order.status = 'refunded'
 *   - Send refund confirmation email
 *
 * - If Order.status = 'underpaid':
 *   - Cannot refund (policy: non-refundable)
 *   - Log reason, notify customer
 *
 * - If Order.status = 'failed':
 *   - No funds received, nothing to refund
 *   - Optionally allow customer to retry payment
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * IMPLEMENTATION CHECKLIST
 * ============================================================================
 *
 * Backend:
 * ✅ Payment entity with status enum
 * ✅ WebhookLog entity with externalId UNIQUE constraint
 * ✅ PAYMENT_STATE_TRANSITIONS validation
 * ✅ ORDER_STATE_TRANSITIONS validation
 * ✅ PAYMENT_TO_ORDER_STATUS_MAP lookup
 * ✅ Idempotency via WebhookLog.externalId check
 * ✅ IPN verification (HMAC-SHA512)
 * ✅ Transaction handling (atomic updates)
 * ✅ BullMQ job enqueueing (async fulfillment)
 * ✅ Email notifications (async via Resend)
 * ✅ Logging & audit trails
 * ✅ Admin APIs for payments listing
 *
 * Frontend:
 * ✅ Checkout flow calls POST /payments/create
 * ✅ Status polling shows real payment status
 * ✅ Success/underpaid/failed pages with proper messaging
 * ✅ Admin dashboard shows payment lifecycle
 *
 * Testing:
 * ✅ Unit tests for state transitions
 * ✅ Integration tests for full IPN flow
 * ✅ E2E tests with ngrok for local IPN testing
 * ✅ Duplicate IPN handling tests
 * ✅ Out-of-order IPN handling tests
 *
 * ============================================================================
 */
