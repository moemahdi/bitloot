# Level 9 — BitLoot Credits: Closed-Loop Store Credit System

> **Source doc:** [`docs/TheLootSquad/BitLoot-Credits.md`](./BitLoot-Credits.md)
>
> **Independence:** Ships independently of Loot Squad. No dependency on affiliates module.
>
> **Prerequisite:** Levels 0–6 complete (orders, payments, fulfillment, auth, promos, catalog all working).

---

## Overview

BitLoot Credits is a EUR-denominated store credit system with two balance types:

- **Cash Credits** — user-funded via crypto top-up, never expires, refundable
- **Promo Credits** — BitLoot-granted (rewards, admin, cashback), expires 90 days, non-refundable, spent first (FIFO by expiry)

At checkout: promo credits → cash credits → remaining paid via crypto (NOWPayments).

**NOT a wallet.** No peer transfers, no withdrawal, no interest, no multi-currency. Closed-loop store credit only.

---

## Phase Structure

| Phase | Name | Duration | Deliverables |
|-------|------|----------|-------------|
| **V1** | Promo Credits Only | 2–3 weeks | Entities, grant/spend/expire, checkout integration, admin |
| **V2** | Cash Credits (Top-Up) | 2–3 weeks | NOWPayments top-up flow, refund-to-credits, underpayment recovery |
| **V3** | Cashback & Loyalty | 2–3 weeks | Auto-cashback on fulfillment, credit-only flash deals, expiry extension |

---

## V1: Promo Credits Only

### V1-Task 1: Database Entities & Migration

**What:** Create `user_credits` and `credit_transactions` tables. Add 3 columns to `orders`.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/entities/user-credits.entity.ts` | 1:1 with User — cash_balance, promo_balance, totals |
| `apps/api/src/modules/credits/entities/credit-transaction.entity.ts` | Double-entry ledger — every balance change is a row |
| `apps/api/src/database/migrations/{timestamp}-CreateCreditsSchema.ts` | Migration for both tables + order columns |

**`user_credits` schema:**

```
id                UUID PK (generated)
user_id           UUID FK → users (UNIQUE, 1:1)
cash_balance      DECIMAL(20,8) DEFAULT 0     -- from top-ups (never expires)
promo_balance     DECIMAL(20,8) DEFAULT 0     -- from rewards (expires 90 days)
total_topped_up   DECIMAL(20,8) DEFAULT 0     -- lifetime top-up amount
total_earned      DECIMAL(20,8) DEFAULT 0     -- lifetime promo credits earned
total_spent       DECIMAL(20,8) DEFAULT 0     -- lifetime credits spent
total_expired     DECIMAL(20,8) DEFAULT 0     -- lifetime promo credits expired
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

CHECK: cash_balance >= 0
CHECK: promo_balance >= 0
INDEX: user_credits(user_id) UNIQUE
```

**`credit_transactions` schema:**

```
id                UUID PK (generated)
user_id           UUID FK → users
type              VARCHAR(30) NOT NULL
                  -- topup | spend | reward | affiliate_conversion | referral |
                  -- cashback | refund | adjustment | expiry | admin_grant
                  -- underpayment_recovery
credit_type       VARCHAR(10) NOT NULL     -- 'cash' | 'promo'
amount            DECIMAL(20,8) NOT NULL   -- positive = credit, negative = debit
balance_after     DECIMAL(20,8) NOT NULL   -- snapshot after this transaction
remaining         DECIMAL(20,8)            -- for promo grants: tracks unconsumed value for FIFO
                                           -- NULL for debits and cash credits
reference_type    VARCHAR(30)              -- order | quest | quest_instance | milestone | payout | topup |
                                           -- topup_bonus | affiliate_commission | referral | admin |
                                           -- underpayment_recovery
reference_id      UUID                     -- FK to source record
description       TEXT                     -- human-readable
expires_at        TIMESTAMPTZ              -- promo credits only; NULL for cash
expired           BOOLEAN DEFAULT false    -- set true by expiry cron
created_at        TIMESTAMPTZ DEFAULT NOW()

INDEX: (user_id, created_at DESC)          -- transaction history pagination
INDEX: (user_id, credit_type, expired)     -- promo balance recalculation
INDEX: (expires_at) WHERE credit_type='promo' AND expired=false AND amount>0  -- expiry cron partial
INDEX: (reference_type, reference_id)      -- idempotency checks
```

**`orders` table additions (alter):**

```
credits_used          DECIMAL(20,8) DEFAULT 0   -- total credits applied
credits_promo_used    DECIMAL(20,8) DEFAULT 0   -- promo portion
credits_cash_used     DECIMAL(20,8) DEFAULT 0   -- cash portion
```

**Entity patterns:**
- Follow existing entity conventions (see `order.entity.ts`, `payment.entity.ts`)
- Use `@Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })` for monetary columns
- `user_credits` record is created lazily on first credit event (not on user registration)
- Add `@OneToOne(() => User)` with `@JoinColumn()` on UserCredits

**Acceptance:**
- [ ] Migration runs clean on fresh DB and existing DB
- [ ] Both entities are registered in the credits module
- [ ] `user_credits.user_id` has UNIQUE constraint
- [ ] CHECK constraints enforce non-negative balances
- [ ] Order entity updated with 3 new columns (default 0, no breaking change)

---

### V1-Task 2: Credits Module & Core Service

**What:** Create `CreditsModule` and `CreditsService` with core operations.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/credits.module.ts` | Module registration |
| `apps/api/src/modules/credits/credits.service.ts` | Core service: grant, spend, balance, refund, expiry |
| `apps/api/src/modules/credits/credits.errors.ts` | Custom error classes |

**Service API (all methods wrapped in DB transactions):**

```typescript
class CreditsService {
  // --- Read ---
  getBalance(userId: string): Promise<{ cash: number; promo: number; total: number }>
  getTransactionHistory(userId: string, page: number, limit: number): Promise<PaginatedResult<CreditTransaction>>
  getExpiringCredits(userId: string, withinDays: number): Promise<{ amount: number; earliest: Date | null }>

  // --- Write (all create CreditTransaction records) ---
  grantPromoCredits(userId: string, amount: number, source: ReferenceType, referenceId: string, expiresInDays?: number): Promise<CreditTransaction>
  spendCredits(userId: string, amount: number, orderId: string): Promise<{ promoUsed: number; cashUsed: number; transactions: CreditTransaction[] }>
  refundCredits(userId: string, amount: number, creditType: 'cash' | 'promo', orderId: string): Promise<CreditTransaction>

  // --- Admin ---
  adminAdjust(userId: string, amount: number, creditType: 'cash' | 'promo', reason: string, adminId: string): Promise<CreditTransaction>
  adminGrant(userId: string, amount: number, expiresInDays: number, reason: string, adminId: string): Promise<CreditTransaction>

  // --- Internal ---
  expirePromoCredits(): Promise<number>  // cron, returns count expired

  // --- Helper ---
  getOrCreateUserCredits(userId: string): Promise<UserCredits>  // lazy creation
}
```

**Spending algorithm (`spendCredits`):**

```
1. Acquire row-level lock: SELECT ... FOR UPDATE on user_credits
2. Verify total balance >= requested amount → throw InsufficientCreditsError
3. Deduct promo_balance FIRST:
   a. Query non-expired promo grants with remaining > 0, ORDER BY expires_at ASC (FIFO)
   b. Consume oldest-expiry-first: decrement `remaining` on each grant row
   c. Create debit credit_transaction for each consumed grant
4. Deduct remainder from cash_balance:
   a. Create cash debit credit_transaction
5. Update user_credits: cash_balance, promo_balance, total_spent
6. Return breakdown: { promoUsed, cashUsed, transactions }
7. ALL in single PostgreSQL transaction — rollback entirely on any failure
```

**Idempotency:** Before granting, check `(reference_type, reference_id)` pair doesn't already exist in `credit_transactions`. If it does, return existing transaction (no duplicate grant).

**Key rules:**
- `grantPromoCredits` defaults `expiresInDays` to 90
- All writes use `queryRunner.manager` (not repository) within transaction
- `getOrCreateUserCredits` uses `INSERT ... ON CONFLICT DO NOTHING` + `SELECT` for race safety
- Never update `user_credits` columns directly — always go through service methods

**Acceptance:**
- [ ] `spendCredits` correctly implements FIFO promo-first spending
- [ ] Row-level lock prevents double-spend race conditions
- [ ] `balance_after` snapshot is accurate on every transaction
- [ ] Idempotency prevents duplicate grants for same reference
- [ ] `expirePromoCredits` correctly expires only promo grants past `expires_at`

---

### V1-Task 3: Credits Controller (User Endpoints)

**What:** User-facing REST endpoints for balance and history.

**File:** `apps/api/src/modules/credits/credits.controller.ts`

**Endpoints:**

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/credits/balance` | `@UseGuards(JwtAuthGuard)` | Get user's cash + promo + total balance |
| `GET` | `/credits/transactions` | `@UseGuards(JwtAuthGuard)` | Paginated transaction history (limit ≤ 50) |
| `GET` | `/credits/expiring` | `@UseGuards(JwtAuthGuard)` | Promo credits expiring within 30 days |

**DTOs to create:**

| File | DTO |
|------|-----|
| `credits/dto/credit-balance.dto.ts` | `CreditBalanceDto { cash, promo, total, expiringWithin30Days }` |
| `credits/dto/credit-transaction.dto.ts` | `CreditTransactionDto { id, type, creditType, amount, balanceAfter, referenceType, referenceId, description, expiresAt, createdAt }` |
| `credits/dto/credit-transactions-query.dto.ts` | `CreditTransactionsQueryDto { page, limit }` with validation |

**OpenAPI decorators:** Full `@ApiResponse`, `@ApiOperation`, `@ApiParam` for SDK generation.

**Acceptance:**
- [ ] All endpoints require JWT auth
- [ ] Pagination works with `page` + `limit` (max 50)
- [ ] Response DTOs match the API payload contracts in BitLoot-Credits.md §14
- [ ] SDK regeneration produces `CreditsApi` client

---

### V1-Task 4: Admin Credits Controller

**What:** Admin endpoints for granting, adjusting, and viewing user balances.

**File:** `apps/api/src/modules/credits/admin-credits.controller.ts`

**Endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/admin/credits/users` | Paginated user balances list (search email, filter, sort by balance) |
| `GET` | `/admin/credits/users/:userId` | Single user balance + transaction history |
| `POST` | `/admin/credits/grant` | Grant promo credits to user (with reason, audit logged) |
| `POST` | `/admin/credits/adjust` | Adjust balance up/down (with reason, audit logged) |
| `GET` | `/admin/credits/stats` | Aggregate: total issued, spent, expired, outstanding liability |

**DTOs:**

| DTO | Fields |
|-----|--------|
| `AdminGrantCreditsDto` | `userId, amount, expiresInDays (default 90), reason` |
| `AdminAdjustCreditsDto` | `userId, amount (can be negative), creditType, reason` |
| `AdminCreditsStatsDto` | `totalCashOutstanding, totalPromoOutstanding, issuedThisMonth, spentThisMonth, expiryRate` |

**Guards:** `@UseGuards(JwtAuthGuard, AdminGuard)` on all endpoints.

**Audit logging:** Every grant/adjust calls `auditLogService.log()` with admin ID, action, amount, reason.

**Acceptance:**
- [ ] All admin endpoints protected with both JWT + Admin guards
- [ ] Grant creates audit log entry
- [ ] Adjust creates audit log entry with reason
- [ ] Stats endpoint returns accurate aggregate numbers
- [ ] SDK generates `AdminCreditsApi` client

---

### V1-Task 5: Checkout Integration — Backend

**What:** Modify order creation to accept and deduct credits. Handle full-credit orders (skip NOWPayments).

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/orders/orders.service.ts` | Add `useCredits` flag handling in `createOrder()` |
| `apps/api/src/modules/orders/dto/create-order.dto.ts` | Add `useCredits: boolean` field |
| `apps/api/src/modules/orders/dto/order-response.dto.ts` | Add credit breakdown fields |

**Logic in `createOrder()`:**

```
1. Calculate finalTotal (after promo discount — existing logic)
2. If dto.useCredits AND user is authenticated:
   a. Call creditsService.getBalance(userId)
   b. creditsToApply = Math.min(balance.total, finalTotal)
   c. If creditsToApply > 0:
      - Call creditsService.spendCredits(userId, creditsToApply, orderId)
      - Store credits_used, credits_promo_used, credits_cash_used on order
   d. remainingAmount = finalTotal - creditsToApply
3. If remainingAmount === 0:
   a. Skip NOWPayments payment creation entirely
   b. Set order status directly to 'paid'
   c. Enqueue fulfillment job immediately
   d. Return response with paymentUrl: null
4. If remainingAmount > 0:
   a. Create NOWPayments payment for remainingAmount only
   b. Return response with paymentUrl + credit breakdown
```

**Prevent credit loops:** If order contains a `credit_topup` type → reject if `useCredits: true` (cannot pay for credits with credits).

**Full-credit order email:** "Paid with BitLoot Credits" instead of crypto transaction details.

**Acceptance:**
- [ ] `useCredits: true` deducts credits atomically with order creation
- [ ] Full-credit orders skip NOWPayments and go directly to `paid` status
- [ ] Partial-credit orders create NOWPayments payment for remaining amount only
- [ ] Credits are NOT deducted for guest checkout (no userId)
- [ ] Credit deduction rolls back if order creation fails
- [ ] Response includes `creditsUsed`, `creditsPromoUsed`, `creditsCashUsed`, `remainingCryptoAmount`

---

### V1-Task 6: Checkout Integration — Frontend

**What:** Add credits toggle to checkout sidebar. Show balance breakdown. Handle full-credit "Place Order" flow.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/web/src/context/CartContext.tsx` | Add `useCredits` state, credit balance tracking |
| `apps/web/src/features/checkout/CheckoutForm.tsx` | Add credits toggle with breakdown display |

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/features/checkout/CreditsSummary.tsx` | Credits toggle + breakdown component |

**UX behavior:**

```
┌─────────────────────────────────────────────────┐
│  💰 Use BitLoot Credits                   [ON]  │
│                                                 │
│  Promo Credits Applied:         -€20.00         │
│  Cash Credits Applied:          -€25.00         │
│  ─────────────────────────────────────────────  │
│  Credits Total:                 -€45.00         │
│  Remaining (pay with crypto):    €0.00          │
│                                                 │
│  ℹ️ Promo credits are used first (oldest first) │
└─────────────────────────────────────────────────┘
```

- Toggle ON by default if user is logged in AND has credits > 0
- Toggle OFF: full amount charged as crypto
- If credits cover 100%: CTA changes to "Place Order" (no NOWPayments redirect)
- If partial: show remaining amount + proceed to NOWPayments for difference
- Only show for authenticated users (guest checkout = no credits)

**Data fetching:**
- Use SDK `CreditsApi.getBalance()` via TanStack Query
- `staleTime: 30_000` (user-specific data)
- `enabled: !!user` (only fetch when logged in)

**Acceptance:**
- [ ] Credits toggle only visible for authenticated users with balance > 0
- [ ] Breakdown shows promo vs cash split
- [ ] Full-credit orders show "Place Order" and complete without NOWPayments redirect
- [ ] Toggle OFF preserves credits (no deduction)
- [ ] Cart total updates dynamically when toggle changes

---

### V1-Task 7: Expiry Cron Job & Warning Emails

**What:** BullMQ cron job to expire promo credits. Warning email 7 days before expiry.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/jobs/credits-expiry.processor.ts` | Cron: daily 2AM UTC — expire promo credits |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/jobs/queues.ts` | Register `credits` queue |
| `apps/api/src/modules/emails/emails.service.ts` | Add `sendCreditExpiryWarning()` and `sendCreditsExpired()` |

**Expiry job (`credits.expire-promo`, cron: `0 2 * * *`):**

```
1. Query credit_transactions WHERE credit_type='promo' AND expired=false
   AND expires_at < NOW() AND amount > 0 AND remaining > 0
2. For each expired grant:
   a. Create debit credit_transaction (type='expiry', amount=-remaining)
   b. Set expired=true on the grant row
   c. Update user_credits.promo_balance -= remaining
   d. Update user_credits.total_expired += remaining
3. Log count of expired grants
```

**Warning job (`credits.expiry-warning`, cron: `0 10 * * *`):**

```
1. Query credit_transactions WHERE credit_type='promo' AND expired=false
   AND expires_at BETWEEN NOW() AND NOW() + 7 days AND remaining > 0
2. Group by user_id, SUM remaining amounts
3. For each user with expiring credits:
   a. Send email: "You have €X in credits expiring on [date]"
   b. Use idempotency key: `credit-expiry-warning-{userId}-{date}` (send once per day per user)
```

**Email templates:**

| Template | Subject | Variables |
|----------|---------|-----------|
| `sendCreditExpiryWarning` | "€X in credits expire on [date]" | amount, expires_at, shop_link |
| `sendCreditsExpired` | "€X in credits have expired" | amount, expired_date |

**Acceptance:**
- [ ] Expiry cron runs daily at 2AM UTC
- [ ] Only promo credits with `remaining > 0` and past `expires_at` are expired
- [ ] `user_credits.promo_balance` stays in sync after expiry
- [ ] Warning email sent exactly once per user per day (idempotency)
- [ ] Warning goes out 7 days before, not after expiry

---

### V1-Task 8: Reconciliation Cron Job

**What:** Daily integrity check — verifies `user_credits` balances match sum of `credit_transactions`.

**File to create:** `apps/api/src/jobs/credits-reconciliation.processor.ts`

**Job (`credits.reconcile`, cron: `0 3 * * *`):**

```
1. For each user_credits record:
   a. SUM all credit_transactions WHERE credit_type='cash' → computed_cash
   b. SUM all credit_transactions WHERE credit_type='promo' → computed_promo
   c. Compare vs stored cash_balance / promo_balance
   d. If |stored - computed| > 0.01:
      - Create audit_log entry (action: 'credit_balance_mismatch', details with both values)
      - Send admin notification email
2. Do NOT auto-correct — mismatches require manual investigation
3. Log: "Reconciliation complete. X users checked, Y mismatches found."
```

**Acceptance:**
- [ ] Runs daily at 3AM UTC (after expiry at 2AM)
- [ ] Detects mismatches > €0.01
- [ ] Creates audit log on mismatch (does NOT auto-fix)
- [ ] Sends admin notification on mismatch

---

### V1-Task 9: Profile Credits Tab (Frontend)

**What:** Add "Credits" tab to user profile dashboard showing balance and transaction history.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/features/account/CreditsTab.tsx` | Main credits tab component |
| `apps/web/src/features/account/CreditTransactionList.tsx` | Paginated transaction history |
| `apps/web/src/features/account/CreditBalanceCard.tsx` | Balance display card |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/web/src/app/(dashboard)/profile/page.tsx` | Add "Credits" tab alongside Orders, Watchlist, etc. |

**UI components:**

1. **Balance card:** Cash balance + Promo balance + Total. Show expiring amount if > 0.
2. **Transaction history:** Paginated table with type icon, description, amount (+/-), date. Color: green for credits, red for debits.
3. **Expiring soon alert:** If promo credits expiring within 7 days, show warning banner with shop link.

**Data hooks:**
- `useCreditsBalance()` — TanStack Query wrapping `CreditsApi.getBalance()`
- `useCreditsTransactions(page)` — TanStack Query wrapping `CreditsApi.getTransactions()`

**Acceptance:**
- [ ] Credits tab shows in profile dashboard
- [ ] Balance card displays cash, promo, and total
- [ ] Transaction history is paginated
- [ ] Expiry warning shown when applicable
- [ ] Empty state message when no credits: "You don't have any credits yet"

---

### V1-Task 10: Navigation Balance Badge (Frontend)

**What:** Small credit balance indicator in the header navigation (if balance > 0).

**Files to modify:**

| File | Change |
|------|--------|
| Header/Navbar component | Show small "€XX.XX" badge next to cart icon when credits > 0 |

**Behavior:**
- Only visible for authenticated users
- Shows total balance (cash + promo)
- Clicking navigates to `/profile?tab=credits`
- Fetch with `staleTime: 60_000` (refresh once per minute)
- Hide if balance is 0

**Acceptance:**
- [ ] Badge visible only for logged-in users with balance > 0
- [ ] Clicking badge navigates to credits tab
- [ ] Does not flash/jump on page load (skeleton or suspense)

---

### V1-Task 11: Admin Credits Dashboard (Frontend)

**What:** Admin page for viewing/managing user credit balances.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/app/admin/credits/page.tsx` | Admin credits dashboard |

**Features:**

1. **Stats cards:** Total cash outstanding, total promo outstanding, issued this month, spent this month, expiry rate
2. **User balances table:** Searchable by email, sortable by balance, filterable by credit type (cash/promo/both)
3. **User detail modal:** Full transaction history + grant/adjust actions with reason field
4. **Grant form:** Select user → enter amount, expiry days, reason → confirm
5. **Adjust form:** Select user → enter amount (+/-), credit type, reason → confirm

**Admin nav:** Add "Credits" link to existing admin sidebar (`AdminLayoutClient.tsx`).

**Acceptance:**
- [ ] Admin-only page with proper guards
- [ ] Stats cards show accurate aggregates
- [ ] Can search users by email
- [ ] Can grant promo credits with reason
- [ ] Can adjust balance with reason
- [ ] All actions create audit log entries

---

### V1-Task 12: SDK Regeneration & Tests

**What:** Regenerate SDK, write unit tests for core service, integration tests for endpoints.

**SDK:** Run `npm run sdk:dev` → verify `CreditsApi` and `AdminCreditsApi` are generated.

**Unit tests (`credits.service.spec.ts`):**

| Test | What it verifies |
|------|-----------------|
| `grantPromoCredits` creates transaction and updates balance | Basic grant flow |
| `grantPromoCredits` with same referenceId is idempotent | No duplicate grants |
| `spendCredits` deducts promo first (FIFO by expiry) | Spending algorithm |
| `spendCredits` deducts cash after promo exhausted | Mixed spend |
| `spendCredits` throws InsufficientCreditsError when balance too low | Insufficient funds |
| `expirePromoCredits` expires only past-due grants | Expiry logic |
| `expirePromoCredits` skips already-expired grants | Idempotent expiry |
| `balance_after` is accurate after sequential operations | Ledger integrity |
| `getOrCreateUserCredits` is race-safe | Concurrent creation |

**Integration tests:**

| Test | What it verifies |
|------|-----------------|
| `GET /credits/balance` returns correct amounts | User endpoint |
| `GET /credits/transactions` paginates correctly | Pagination |
| `POST /admin/credits/grant` with valid admin token | Admin grant |
| `POST /admin/credits/grant` without admin rejects | Auth guard |
| Full checkout flow with credits | End-to-end |
| Full-credit order skips NOWPayments | Full coverage path |

**Acceptance:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] SDK includes `CreditsApi` + `AdminCreditsApi` with correct methods
- [ ] `npm run quality:full` passes

---

## V2: Cash Credits (Top-Up)

> **Prerequisite:** V1 complete and tested.

### V2-Task 1: Credit Top-Up Entity & Migration

**What:** Create `credit_topups` table for tracking top-up payments.

**File:** `apps/api/src/modules/credits/entities/credit-topup.entity.ts`

**Schema:**

```
credit_topups
  id                UUID PK
  user_id           UUID FK → users
  amount_eur        DECIMAL(20,8) NOT NULL     -- requested EUR amount
  payment_id        UUID FK → payments         -- NOWPayments payment record
  status            VARCHAR(20) DEFAULT 'pending'  -- pending | confirmed | failed | expired
  confirmed_at      TIMESTAMPTZ
  created_at        TIMESTAMPTZ

INDEX: (user_id, created_at)     -- history
INDEX: (payment_id)              -- webhook lookup
```

**Acceptance:**
- [ ] Migration runs clean
- [ ] Entity registered in credits module

---

### V2-Task 2: Top-Up Service

**What:** Service to create top-up payments and confirm them via IPN.

**File:** `apps/api/src/modules/credits/credits-topup.service.ts`

**Methods:**

```typescript
class CreditsTopupService {
  createTopup(userId: string, amountEur: number): Promise<{ topupId: string; paymentUrl: string }>
  confirmTopup(topupId: string, paymentId: string): Promise<CreditTransaction>
  getUserTopupHistory(userId: string, page: number): Promise<PaginatedResult<CreditTopup>>
}
```

**`createTopup` validation:**

```
1. Validate amount: min €5, max €500
2. Check user balance: cash + promo < €2,000 cap
   If (currentBalance + amount > 2000) → reject: "Balance at maximum"
3. Check daily limit: SUM of confirmed top-ups in last 24h < €1,000
4. Check rate limit: COUNT of top-ups in last hour < 5
5. Create CreditTopup record (status: 'pending')
6. Create NOWPayments payment (type: 'credit_topup', amount: amountEur)
7. Store payment_id on CreditTopup
8. Return paymentUrl for frontend redirect
```

**`confirmTopup` (called by IPN handler):**

```
1. Find CreditTopup by payment reference
2. Verify status is 'pending' (idempotent: if 'confirmed', return existing)
3. Update status → 'confirmed', set confirmed_at
4. Call creditsService.grantCashCredits(userId, amountEur, 'topup', topupId)
   - Create credit_transaction (type: 'topup', credit_type: 'cash')
   - Update user_credits.cash_balance += amountEur
   - Update user_credits.total_topped_up += amountEur
5. Send confirmation email
```

**IPN handler modification:** The existing `ipn-handler.service.ts` must route by payment type:
- If payment is for a regular order → existing flow
- If payment is for a credit top-up → call `creditsTopupService.confirmTopup()`

**Acceptance:**
- [ ] Min/max validation enforced (€5–€500)
- [ ] €2,000 balance cap prevents over-loading
- [ ] Daily limit (€1,000) and rate limit (5/hour) enforced
- [ ] IPN handler routes top-up payments correctly
- [ ] Credits granted only after IPN confirmation (never on creation)
- [ ] Idempotent — confirming same topup twice returns existing transaction

---

### V2-Task 3: Top-Up Endpoint

**What:** User endpoint to initiate a credit top-up.

**Add to `credits.controller.ts`:**

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/credits/topup` | Create top-up payment, returns NOWPayments URL |

**DTO:** `CreateTopupDto { amount: number }` (validated: min 5, max 500)

**Response:** `{ topupId: string, paymentUrl: string }`

**Acceptance:**
- [ ] Requires JWT auth
- [ ] Returns NOWPayments payment URL
- [ ] Validates amount range
- [ ] SDK generates `topup` method on `CreditsApi`

---

### V2-Task 4: Top-Up Frontend Page

**What:** `/credits/topup` page with amount presets and custom input.

**File:** `apps/web/src/app/(dashboard)/credits/topup/page.tsx`

**UI:**
- Amount presets: €5 / €10 / €25 / €50 / €100 buttons
- Custom amount input (validated: min 5, max 500)
- Show current balance and what new balance will be
- If at cap (€2,000): show message, disable top-up
- Submit → calls SDK `CreditsApi.createTopup()` → redirects to NOWPayments

**Acceptance:**
- [ ] Preset buttons work
- [ ] Custom amount validates range
- [ ] Shows current balance
- [ ] Redirects to NOWPayments on submit
- [ ] Shows error on cap/limit violations

---

### V2-Task 5: Refund-to-Credits Flow

**What:** When a crypto-paid order is refunded, refund as cash credits (not on-chain).

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/admin/admin.service.ts` | Modify refund logic to create credit transactions |

**Refund rules:**

| Original payment method | Refund destination |
|------------------------|-------------------|
| Cash credits | → Cash credits (back to cash balance) |
| Promo credits | → Forfeited (non-refundable) |
| Crypto (NOWPayments) | → Cash credits (user keeps real value) |
| Mixed | Each portion per its rule |

**Exception:** If refund is due to fulfillment failure (BitLoot's fault):
- Cash → cash credits
- Promo → NEW promo credits (fresh 90-day expiry)
- Crypto → cash credits

**Acceptance:**
- [ ] Crypto refunds create cash credits (no on-chain refund)
- [ ] Promo credits are forfeited on refund (normal scenario)
- [ ] Fulfillment-failure refunds restore promo credits as new grants
- [ ] Mixed-payment refunds handle each portion correctly
- [ ] Guest checkout refunds prompt account creation

---

### V2-Task 6: Underpayment Recovery

**What:** Convert underpaid crypto to cash credits (instead of total loss).

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/webhooks/ipn-handler.service.ts` | Add underpayment recovery logic |

**Logic (in IPN handler when `payment_status === 'underpaid'`):**

```
1. Calculate received EUR amount (from NOWPayments rate)
2. Check: received >= 20% of order total?
   - If NO: standard underpayment failure (no recovery)
   - If YES:
     a. Mark order as 'underpaid' (not 'failed')
     b. Create cash credit grant for received EUR amount
     c. Send recovery email: "We've added €X to your balance"
3. Idempotency: check credit_transactions(reference_type='underpayment_recovery', reference_id=orderId)
```

**Mixed payment underpayment (credits + crypto, crypto portion underpaid):**
- Entire order fails
- Credits that were deducted are REFUNDED back (cash→cash, promo→restored)
- No recovery credits granted (prevents double-refund exploit)
- Email: "Your crypto payment was insufficient. Credits have been restored."

**Acceptance:**
- [ ] >= 20% threshold triggers recovery
- [ ] < 20% falls through to standard failure
- [ ] Recovery creates cash credits (never expire)
- [ ] Mixed-payment underpayment restores credits and fails cleanly
- [ ] Idempotent — same underpayment IPN doesn't create duplicate credits

---

### V2-Task 7: Account Deletion Credit Handling

**What:** Handle credit balances when user requests account deletion.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/auth/auth.controller.ts` | Add credit balance check to deletion flow |
| Deletion confirmation frontend | Show credit balance warning |

**Rules:**

| Balance | Amount | Action |
|---------|--------|--------|
| Promo credits | Any | Forfeited |
| Cash credits | < €15 | Forfeited (with warning) |
| Cash credits | >= €15 | Show "contact support for refund" message |

**Acceptance:**
- [ ] Deletion confirmation shows credit balance warning
- [ ] After 30-day grace period, all balances zeroed
- [ ] Final `account_deletion` transaction created in ledger

---

### V2-Task 8: Top-Up Email Notifications

**What:** Add email templates for top-up confirmation.

**Add to `emails.service.ts`:**

| Template | Subject | Variables |
|----------|---------|-----------|
| `sendTopupConfirmed` | "€X added to your BitLoot balance" | amount, new_balance, tx_date |
| `sendPromoCreditsEarned` | "You earned €X in BitLoot Credits!" | amount, source_description, expires_at, new_balance |
| `sendCreditsSpent` | "€X in credits applied to your order" | amount, order_id, remaining_balance |
| `sendCreditRefund` | "€X refunded to your BitLoot Credits" | amount, order_id, credit_type, new_balance |
| `sendBalanceAdjusted` | "Your credits balance was adjusted" | amount, reason, new_balance |

**Acceptance:**
- [ ] All email templates implemented
- [ ] Idempotency keys on all sends
- [ ] Variables substituted correctly

---

## V3: Cashback & Loyalty

> **Prerequisite:** V2 complete and tested.

### V3-Task 1: Cashback on Fulfillment

**What:** Auto-grant promo credits as cashback when order is fulfilled.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/fulfillment/fulfillment.service.ts` | After successful fulfillment, calculate and grant cashback |

**Logic:**

```
1. After order fulfillment completes:
2. Read admin-configurable cashback rate (e.g., 3% in promo credits)
3. Calculate: cashback_amount = order.total * cashbackRate
4. If cashback_amount > 0 AND user is registered:
   a. creditsService.grantPromoCredits(userId, cashbackAmount, 'cashback', orderId, 180)
   b. Send email: "You earned €X cashback in BitLoot Credits!"
5. Respect per-user daily limit: max €50/day in automated promo credit grants
```

- Cashback calculated AFTER fulfillment (not at checkout — prevents gaming)
- Cashback rate configurable via admin config (stored in feature flags or config table)
- Default expiry for cashback: 180 days (longer than standard 90)

**Acceptance:**
- [ ] Cashback granted only after successful fulfillment
- [ ] Respects daily per-user cap (€50)
- [ ] Admin can configure cashback rate
- [ ] Does not grant cashback on credit-only orders (optional — configurable)

---

### V3-Task 2: Credit-Only Flash Deals

**What:** Products purchasable ONLY with credits (forces top-up for new users).

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/products/entities/product.entity.ts` | Add `creditOnly: boolean` column (default false) |
| Checkout logic | Enforce credit-only for marked products |

**Logic:**
- If `product.creditOnly === true`:
  - Checkout rejects crypto payment for these items
  - User must have sufficient credits OR top up first
  - UI shows "Credits Only" badge on product card

**Acceptance:**
- [ ] Credit-only flag on flash deals
- [ ] Checkout enforces credit-only for marked items
- [ ] "Credits Only" badge shown in product UI

---

### V3-Task 3: Expiry Extension for Active Users

**What:** Active users (purchase in last 30 days) get promo credit expiry extended by 30 days automatically.

**Add to expiry cron job:**

```
Before expiring a promo credit grant:
1. Check if user has a fulfilled order in the last 30 days
2. If yes AND credit is within 30 days of original expiry:
   - Extend expires_at by 30 days (one extension only per grant)
   - Mark grant as 'extended' (prevent infinite extensions)
   - Send email: "Your credits expiry has been extended to [new_date]"
3. If no recent purchase: expire normally
```

**Acceptance:**
- [ ] Active users get one extension per credit grant
- [ ] Extension is exactly 30 days
- [ ] Cannot extend more than once per grant
- [ ] Extension email sent

---

## Cross-Cutting Concerns

### Security Checklist (All Phases)

- [ ] All balance mutations go through `CreditsService` — never direct column updates
- [ ] `SELECT ... FOR UPDATE` row lock on all write operations
- [ ] `cash_balance >= 0` and `promo_balance >= 0` enforced via DB CHECK constraints
- [ ] Idempotency via `(reference_type, reference_id)` on grants
- [ ] Top-up credits only granted after IPN confirmation (never on payment creation)
- [ ] All admin actions audit-logged with reason
- [ ] Rate limits on top-up endpoint (5/hour, €1,000/day)
- [ ] Balance cap enforcement (€2,000) at API layer
- [ ] No peer transfers, no withdrawal, no interest

### Performance Checklist

- [ ] `getBalance()` reads from `user_credits` (O(1)) — not SUM of transactions
- [ ] Expiry cron uses partial index for efficiency
- [ ] Transaction history paginated (max 50 per page)
- [ ] Profile credits tab lazy-loaded (`next/dynamic`, `ssr: false`)
- [ ] Balance badge uses `staleTime: 60_000` (not real-time)

### SDK Regeneration

After each phase:
1. Run `npm run sdk:dev`
2. Verify `CreditsApi` and `AdminCreditsApi` include all new endpoints
3. Update frontend to use generated client methods
4. Do NOT use raw fetch/axios — SDK only

---

## File Inventory (Complete)

### Backend — New Files

```
apps/api/src/modules/credits/
├── credits.module.ts
├── credits.service.ts
├── credits-topup.service.ts           (V2)
├── credits.controller.ts
├── admin-credits.controller.ts
├── credits.errors.ts
├── entities/
│   ├── user-credits.entity.ts
│   ├── credit-transaction.entity.ts
│   └── credit-topup.entity.ts         (V2)
└── dto/
    ├── credit-balance.dto.ts
    ├── credit-transaction.dto.ts
    ├── credit-transactions-query.dto.ts
    ├── create-topup.dto.ts             (V2)
    ├── admin-grant-credits.dto.ts
    └── admin-adjust-credits.dto.ts

apps/api/src/jobs/
├── credits-expiry.processor.ts
└── credits-reconciliation.processor.ts

apps/api/src/database/migrations/
├── {timestamp}-CreateCreditsSchema.ts
└── {timestamp}-CreateCreditTopups.ts    (V2)
```

### Backend — Modified Files

```
apps/api/src/modules/orders/orders.service.ts          (checkout integration)
apps/api/src/modules/orders/dto/create-order.dto.ts    (useCredits field)
apps/api/src/modules/orders/dto/order-response.dto.ts  (credit breakdown)
apps/api/src/modules/webhooks/ipn-handler.service.ts   (top-up routing, underpayment recovery)
apps/api/src/modules/admin/admin.service.ts            (refund-to-credits)
apps/api/src/modules/auth/auth.controller.ts           (deletion credit warning)
apps/api/src/modules/emails/emails.service.ts          (6 new email templates)
apps/api/src/modules/fulfillment/fulfillment.service.ts (cashback, V3)
apps/api/src/jobs/queues.ts                            (register credits queue)
apps/api/src/app.module.ts                             (import CreditsModule)
```

### Frontend — New Files

```
apps/web/src/features/checkout/CreditsSummary.tsx
apps/web/src/features/account/CreditsTab.tsx
apps/web/src/features/account/CreditTransactionList.tsx
apps/web/src/features/account/CreditBalanceCard.tsx
apps/web/src/app/(dashboard)/credits/topup/page.tsx     (V2)
apps/web/src/app/admin/credits/page.tsx
```

### Frontend — Modified Files

```
apps/web/src/context/CartContext.tsx                    (useCredits state)
apps/web/src/features/checkout/CheckoutForm.tsx         (credits toggle)
apps/web/src/app/(dashboard)/profile/page.tsx           (credits tab)
apps/web/src/app/admin/AdminLayoutClient.tsx            (sidebar link)
Header/Navbar component                                (balance badge)
```
