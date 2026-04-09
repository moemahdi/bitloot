# BitLoot Credits — Closed-Loop Store Credit System

> **One-liner:** A store credit system where users hold EUR-denominated balances (from top-ups, rewards, or cashback) and spend them at checkout — reducing payment friction, increasing retention, and keeping value locked inside the BitLoot ecosystem. Affiliate earnings are a **separate payout balance** managed by Loot Squad, not credits.

---

## Scope & Independence

> This feature is **fully independent** of Loot Squad. It can ship on its own timeline.
>
> | Relationship | Integration point | Required? |
> |-------------|-------------------|-----------|
> | **Loot Squad** | Affiliate earnings are a **separate balance** in Loot Squad. Creators can optionally convert earnings → promo credits (one-way, manual). | No — Loot Squad works without credits |
> | **Revenue Streams** | Credits enable multiple revenue streams (top-up spread, breakage, float, gift codes). Premium membership deferred to Phase 5+. See [`RevenueStreams.md`](RevenueStreams.md). | No — credits work without revenue features |
> | **Promo Codes** | Promo credits behave like store credit, not promo codes | Parallel systems — different mechanics |
> | **Checkout** | Credits are a payment method alongside crypto | Yes — checkout integration is core |

---

## 1. Goals & Success Metrics

**Business goals:**

- Reduce payment friction for repeat purchases (no fresh crypto payment each time).
- Lock future spending into BitLoot ("money already committed" psychology).
- Lower payment processing costs (fewer on-chain crypto transactions per purchase).
- Enable instant reward payouts (quest rewards, cashback, buyer referral bonuses) without external transactions.
- Increase repeat purchase rate and customer LTV.

**KPIs:**

| Metric | What it measures | Target |
|--------|-----------------|--------|
| Credit balance utilization rate | % of loaded credits actually spent | > 80% within 90 days |
| Repeat purchase rate (credit users vs non-credit) | Retention lift from credits | +25–40% higher |
| Average time between purchases (credit users) | Purchase frequency impact | 30% shorter interval |
| Promo credit expiry rate | % of promo credits that expire unused | < 20% |
| Cash credit top-up frequency | User engagement with balance system | 2+ top-ups per active user per quarter |
| % of orders using credits (partial or full) | Adoption | > 30% of orders from credit holders |

---

## 2. Core Principles — Store Credit, Not a Wallet

BitLoot Credits is a **controlled closed-loop store credit system**, not a general-purpose financial wallet. This distinction is critical for regulatory compliance and simplicity.

| Rule | Rationale |
|------|-----------|
| Top-up only for use inside BitLoot | Avoids money-transmitter/e-money license requirements in EU/US |
| **No peer-to-peer transfers** | Prevents fraud rings, money laundering vectors, and social engineering theft |
| **No cash-out / no crypto withdrawal** | Keeps it as store credit (not a financial instrument); avoids custodial wallet regulations |
| **No interest / no yield** | Credits are not deposits; no banking license needed |
| Separate "cash credit" vs "promo credit" | Different accounting treatment, expiry rules, and refund policies |
| **Credits = liability** | BitLoot owes the user goods/services for loaded credits — accounting must be exact |
| Strong ledger + audit trail | Required for reconciliation, fraud prevention, and financial reporting |
| EUR-denominated only | Matches BitLoot's pricing currency; no multi-currency complexity |

### What BitLoot Credits is NOT

- **Not a crypto wallet.** Users don't hold crypto in BitLoot.
- **Not a bank account.** No interest, no statements, no FDIC/FSCS protection.
- **Not e-money.** No peer transfers, no withdrawal to bank — this exempts BitLoot from most e-money regulations (EU PSD2 "limited network" exemption applies to closed-loop store credits).
- **Not a promo code.** Credits are a balance on the account, not a one-time discount code.

---

## 3. The Three Balance Types in BitLoot

BitLoot has **three completely separate monetary balances**. Understanding why they exist and how they differ is critical.

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BITLOOT BALANCE TYPES                              │
├─────────────────────┬──────────────────────┬───────────────────────────────┤
│  AFFILIATE EARNINGS │    CASH CREDITS      │       PROMO CREDITS          │
│  (Loot Squad)       │    (Store Credit)    │       (Rewards)              │
├─────────────────────┼──────────────────────┼───────────────────────────────┤
│ Source:             │ Source:              │ Source:                       │
│ Referral sales      │ User paid crypto     │ Quest rewards, cashback,     │
│                     │ to top up            │ buyer referrals, admin       │
│                     │                      │ grants, converted affiliate  │
│                     │                      │ earnings                     │
├─────────────────────┼──────────────────────┼───────────────────────────────┤
│ THE CREATOR EARNED  │ THE USER PAID REAL   │ BITLOOT GAVE IT FOR FREE     │
│ THIS WITH REAL WORK │ MONEY FOR THIS       │                              │
├─────────────────────┼──────────────────────┼───────────────────────────────┤
│ ✅ Withdrawable     │ ❌ Not withdrawable  │ ❌ Not withdrawable           │
│ (stablecoin payout) │ (spend only)         │ (spend only)                 │
│                     │                      │                              │
│ ❌ Doesn't expire   │ ❌ Doesn't expire    │ ⏰ Expires in 90 days        │
│                     │                      │                              │
│ ❌ Can't spend at   │ ✅ Spend at checkout │ ✅ Spend at checkout          │
│ checkout directly   │                      │ (spent first, before cash)   │
│ (must convert first)│                      │                              │
│                     │                      │                              │
│ 🔄 Can convert to  │ 🔁 Refundable       │ ❌ Non-refundable             │
│ promo credits       │ (admin-approved)     │                              │
│ (one-way, manual)   │                      │                              │
├─────────────────────┼──────────────────────┼───────────────────────────────┤
│ Min payout: €15     │ Min top-up: €5       │ No minimum                   │
│ Monthly batch       │ Instant              │ Instant                      │
│ KYC deferred       │                      │                              │
├─────────────────────┼──────────────────────┼───────────────────────────────┤
│ Managed by:         │ Managed by:          │ Managed by:                  │
│ LOOT SQUAD module   │ CREDITS module       │ CREDITS module               │
│ (separate system)   │                      │                              │
└─────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Why three types? Why not just one?

| Problem | How 3 types solves it |
|---------|----------------------|
| Affiliate earned real revenue for BitLoot — their money shouldn't be trapped as store credit | **Affiliate Earnings** are withdrawable as stablecoin. They're real money the creator earned. |
| User topped up €50 — that's their money, BitLoot owes them products | **Cash Credits** never expire, are refundable. Treated as a financial liability. |
| BitLoot gave a €5 quest reward — that's a marketing expense, not a deposit | **Promo Credits** expire in 90 days, are non-refundable. Limits BitLoot's liability from giveaways. |
| A scammer farms quest rewards and tries to extract cash | Promo credits can't be withdrawn or refunded. Low value per exploit. |
| An affiliate farms fake referrals to withdraw stablecoin | Affiliate earnings have a hold period, fraud scoring, KYC for large amounts. |
| Accounting: how much does BitLoot owe users? | Each type has different liability treatment — earned vs deposited vs promotional. |

### 3.1 Affiliate Earnings (Loot Squad — Separate System)

> **This is NOT part of the Credits module.** Affiliate earnings live in the Loot Squad system with their own ledger, hold periods, and payout infrastructure. Documented here for comparison only — full details in [LootSquad.md](LootSquad.md).

| Property | Detail |
|----------|--------|
| **Source** | Commission on referred sales (% of margin per fulfilled order item) |
| **Denomination** | EUR (frozen at fulfillment time) |
| **Withdrawable?** | **Yes** — USDT (BEP20) manual payout to verified wallet |
| **Minimum payout** | €15 |
| **Payout schedule** | Monthly batch (1st of month), admin-approved, manual send |
| **Expires?** | **Never** — earned commissions don't expire |
| **Spendable at checkout?** | **Not directly.** Must convert to promo credits first (one-way, manual, instant). |
| **Refundable?** | N/A — it's earnings, not a deposit |
| **KYC required?** | Deferred — admin manual review sufficient for Phase 1-2 |
| **Fraud controls** | 48-hour hold post-fulfillment, multi-signal fraud scoring, self-referral hard block |

**Converting earnings → promo credits:**
A creator with €8 in affiliate earnings who wants to buy something on BitLoot NOW can manually convert any amount to promo credits:
- One-way conversion (credits → earnings is NOT possible).
- Converted amount becomes promo credits (90-day expiry, non-withdrawable).
- The creator loses the right to withdraw that amount as stablecoin.
- This is a **convenience option**, not the default. Creators are never pushed into this.

### 3.2 Cash Credits (User-Funded Store Credit)

| Property | Detail |
|----------|--------|
| **Source** | User tops up via crypto payment (NOWPayments) |
| **Denomination** | EUR |
| **Withdrawable?** | **No** — can only be spent at checkout (closed-loop store credit) |
| **Expires?** | **Never** |
| **Spendable at checkout?** | **Yes** — spent after promo credits are exhausted |
| **Refundable?** | **Yes** — admin-approved, back to cash credit balance |
| **Who pays?** | The user paid real crypto for this — BitLoot owes them products/services |
| **Accounting treatment** | **Financial liability** — tracked as outstanding obligation |

### 3.3 Promo Credits (BitLoot-Granted Rewards)

| Property | Detail |
|----------|--------|
| **Source** | Quest rewards, cashback, buyer referral bonuses, admin grants, converted affiliate earnings |
| **Denomination** | EUR |
| **Withdrawable?** | **No** |
| **Expires?** | **90 days** from grant date (configurable per source, 90–180 day range) |
| **Spendable at checkout?** | **Yes** — spent FIRST (before cash credits, FIFO by expiry date) |
| **Refundable?** | **No** — if an order paid with promo credits is refunded, promo credits are forfeited |
| **Who pays?** | BitLoot — this is a marketing/reward expense |
| **Accounting treatment** | **Promotional liability** — lower priority, expected breakage (some will expire unused) |

### Spend order at checkout

When a user pays with credits:

1. **Promo credits are deducted first** (oldest-expiry-first within promo pool — FIFO by `expires_at`).
2. **Cash credits are deducted second** (if promo credits don't cover the full amount).
3. **Remaining balance** (if credits don't cover the order) is paid in crypto via NOWPayments.

This protects BitLoot from accumulating large promo credit liability while ensuring users always spend "free" credits first.

> **Note:** Affiliate earnings CANNOT be spent at checkout directly. The creator must explicitly convert earnings → promo credits first. This is intentional — affiliate earnings are "real money" that can be withdrawn, and auto-spending them at checkout would be confusing.

### Expiry mechanics

- A **BullMQ cron job** (`credits.expire-promo`) runs daily at 2 AM UTC.
- Scans `credit_transactions` for promo credits where `expires_at < NOW()` and remaining balance > 0.
- Creates a debit `credit_transaction` of type `expiry` to zero out expired promo credits.
- Updates `user_credits.promo_balance` accordingly.
- Sends a Resend email notification 7 days before expiry: "You have €X in credits expiring on [date]."
- No partial expiry — each promo credit grant is a discrete transaction that expires as a unit.
- **Affiliate earnings never expire** (managed by Loot Squad, not this system).

---

## 4. Credit Lifecycle Flows

### 4.1 Cash Credit Top-Up

```
User → "Add Credits" page → selects amount (€5/€10/€25/€50/€100 presets or custom)
  → Creates top-up order via NOWPayments (type: 'credit_topup')
  → IPN webhook confirms payment → BullMQ job processes
  → credit_transaction created (type: 'topup', credit_type: 'cash')
  → user_credits.cash_balance incremented
  → Email: "€X added to your BitLoot balance"
```

**Top-up constraints:**

| Rule | Value |
|------|-------|
| Minimum top-up | €5 |
| Maximum top-up | €500 per transaction |
| Maximum balance | €2,000 (cash + promo combined) |
| Daily top-up limit | €1,000 (sum of all top-ups in 24h) |
| Rate limit | Max 5 top-up transactions per hour per user |

**Balance cap enforcement (€2,000):**

When a user's current balance (cash + promo combined) is at or near the €2,000 cap:
- **Reject the top-up entirely.** Do NOT allow partial top-ups (overly complex, confusing UX).
- Display: "Your credit balance is at the maximum (€2,000). Spend your credits to top up again."
- The NOWPayments payment is never created — rejection happens at the API layer before any crypto transaction.
- Promo credit grants (quests, cashback, admin) are exempt from the cap — promotional grants should never be blocked by a balance limit.
- This protects BitLoot from excessive liability and is industry standard (Steam Wallet, PlayStation Store both enforce caps).

### 4.2 Promo Credit Grant (System-Originated)

```
Source event (quest completed, referral bonus, cashback, admin grant)
  → Service calls CreditsService.grantPromoCredits(userId, amount, source, referenceId)
  → credit_transaction created (type: source, credit_type: 'promo', expires_at: NOW + 90 days)
  → user_credits.promo_balance incremented
  → Email: "You earned €X in BitLoot Credits! Expires [date]."
```

> **Phase 1–2: Global 90-day expiry for ALL promo credits.** Per-source configurable expiry (90–180 day range) ships in Phase 3 when quest campaigns may need different windows. Until then, a single global default keeps the system simple and the codebase clean. The `expires_in_days` parameter on `grantPromoCredits()` exists for future use but defaults to 90.

**Promo credit sources and default expiry:**

| Source | Default expiry | Configurable? |
|--------|---------------|---------------|
| Quest completion reward | 90 days | Per-quest template |
| Milestone "pick your reward" | 90 days | No (fixed) |
| Buyer referral bonus | 90 days | Yes, via admin config |
| Cashback (Phase 3) | 180 days | Yes, via admin config |
| Admin manual grant | Custom (set at grant time) | Yes |
| **Converted affiliate earnings** | **90 days** | No (fixed) |

> **Note:** "Affiliate commission" is no longer listed as a direct promo credit source. Affiliate commissions go to the Loot Squad earnings balance. Creators can then *manually convert* earnings → promo credits if they choose (see §4.3).

### 4.3 Affiliate Earnings → Promo Credit Conversion (Manual, One-Way)

```
Creator dashboard → Earnings tab → "Convert to Credits" button
  → Creator selects amount (partial or full earnings balance)
  → Confirmation modal: "You're converting €X to promo credits. This is one-way —
     you won't be able to withdraw this amount as stablecoin. Credits expire in 90 days."
  → Creator confirms
  → Loot Squad deducts from affiliate earnings balance
  → CreditsService.grantPromoCredits(userId, amount, 'affiliate_conversion', affiliateId)
  → credit_transaction created (type: 'affiliate_conversion', credit_type: 'promo', expires_at: NOW + 90 days)
  → user_credits.promo_balance incremented
  → Email: "You converted €X of your affiliate earnings to BitLoot Credits. Expires [date]."
```

**Conversion rules:**

| Rule | Detail |
|------|--------|
| Direction | Earnings → Credits only. **Never** Credits → Earnings. |
| Amount | Any amount from available (non-held) earnings |
| Minimum | €1 |
| Result | Promo credits (90-day expiry, non-withdrawable, non-refundable) |
| Reversible | **No** — once converted, the creator loses payout rights on that amount |
| Speed | Instant |
| Displayed as | Separate line in transaction history: "Converted from affiliate earnings" |

> ### 🔴 CRITICAL: Why Reverse Conversion (Credits → Earnings) Must NEVER Exist
>
> **This is a non-negotiable security rule. Do not build a reverse path under any circumstances.**
>
> If credits could be converted back to affiliate earnings (which are withdrawable), every free promotional credit becomes extractable cash:
>
> ```
> Exploit scenario:
> 1. Creator earns €10 commission → converts to promo credits (instant)
> 2. Creator completes a quest → receives €5 FREE promo credits from BitLoot
> 3. Creator now has €15 in promo credits (€10 earned + €5 free)
> 4. Creator converts €15 promo credits → affiliate earnings (if this existed)
> 5. Creator requests €15 stablecoin payout
> 6. Result: Creator extracted €5 of FREE promotional value as real cash
> ```
>
> At scale, this turns every quest reward, cashback bonus, buyer referral bonus, and admin grant into a **cash withdrawal vector**. BitLoot would hemorrhage money through promotional giveaways.
>
> **Admin/support handling of reversal requests:**
>
> | Scenario | Response |
> |----------|----------|
> | Creator converts and immediately regrets | Cannot be reversed. The confirmation modal warned them explicitly. |
> | Creator contacts support asking to undo | Support explains the one-way policy. No mechanism exists in the system to move credits → earnings. |
> | Admin wants to help a creator | Admin can grant new promo credits (not earnings). Admin **cannot** create affiliate earnings manually — the system has no admin endpoint for this by design. |
> | Creator says "I didn't read the warning" | Goodwill: admin can note the incident. But no reversal is possible. |
>
> **UX safeguards to prevent accidental conversion:**
>
> 1. **Confirmation modal** with explicit warning: *"This is one-way. You will NOT be able to withdraw this amount as stablecoin. Credits expire in 90 days."*
> 2. **Partial conversion** — creator chooses how much to convert. No "convert all" default.
> 3. **No pressure** — earnings never expire. No urgency to convert.
> 4. **Small test first** — €1 minimum lets creators test with a trivial amount.

### 4.4 Spending Credits at Checkout

```
User at checkout with cart total €45:
  → User has €20 promo credits + €30 cash credits = €50 total
  → User toggles "Use BitLoot Credits" ON (enabled by default if balance > 0)
  → System calculates:
      Promo applied first: €20 (depletes promo balance)
      Cash applied second: €25 (partial deduction from cash balance)
      Remaining crypto payment: €0 (fully covered by credits)
  → If partially covered:
      Credits cover €30, remaining €15 paid via NOWPayments
  → Order created with:
      creditsUsed: €45
      creditsPromoUsed: €20
      creditsCashUsed: €25
      totalCrypto: €0 (or remaining amount)
  → credit_transactions created for each debit
  → user_credits balances updated atomically (within DB transaction)
```

**Checkout toggle UX:**

The checkout sidebar displays a "Use BitLoot Credits" toggle with a line-by-line breakdown:

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

- **Toggle ON (default if balance > 0):** Credits auto-applied, promo first (FIFO by expiry), then cash. Breakdown shows each credit type deducted.
- **Toggle OFF:** Full order amount charged as crypto via NOWPayments. Credits are preserved.
- **Partial coverage:** If credits don't cover the full order, the remainder is shown as "Remaining (pay with crypto): €X.XX" and the user proceeds to NOWPayments for the difference.
- **Full coverage:** If credits cover 100%, the crypto payment section is hidden entirely and the CTA changes to "Place Order" (no NOWPayments redirect).

**Checkout integration rules:**

| Rule | Detail |
|------|--------|
| Credits apply **before** crypto payment | Credits reduce the crypto amount owed |
| Credits apply **after** promo code discount | Order total after promo is the base for credit deduction |
| Cannot use credits on credit top-up orders | Prevents circular credit loops |
| Partial credit use allowed | Use some credits + pay remainder in crypto |
| Credit deduction is atomic | All-or-nothing within a DB transaction — if order fails, credits are not deducted |
| Full-credit orders skip NOWPayments | If credits cover 100% of the order, no crypto payment is created |

### 4.5 Refund to Credits

```
Admin initiates refund on an order:
  → If order was paid with cash credits: refund back as cash credits
  → If order was paid with promo credits: **forfeited** (non-refundable)
      Exception: fulfillment failure (BitLoot's fault) → refund as new promo credits (90-day expiry)
  → If order was paid with crypto: refund as **cash credits** (user retains real value, avoids on-chain refund)
  → credit_transaction created (type: 'refund')
  → user_credits balance updated
  → Email: "€X refunded to your BitLoot Credits balance"
```

**Refund rules:**

| Payment method used | Refund destination | Requires admin approval |
|--------------------|-------------------|------------------------|
| Cash credits | **Cash credits** (back to cash balance) | Yes |
| Promo credits (any reason) | **Forfeited** — promo credits are non-refundable | N/A |
| Crypto (NOWPayments) | **Cash credits** (not promo, not crypto — user keeps real value, avoids on-chain refund) | Yes |
| Mixed (credits + crypto) | Each portion per its rule (promo forfeited, cash→cash, crypto→cash credits) | Yes |

**Exception — Fulfillment Failure (BitLoot's Fault):**

If the order fails due to BitLoot's inability to deliver (Kinguin out of stock after payment, key delivery error, system bug), ALL portions are refunded to their original source:
- Cash credits → cash credits
- Promo credits → **new promo credits** (fresh 90-day expiry)
- Crypto → cash credits (on-chain refund still avoided)

This is the ONLY scenario where promo credits are restored. Rationale: the user didn't choose to cancel — BitLoot failed to deliver. Penalizing the user's promo credits for BitLoot's failure would damage trust.

**Guest Checkout Refunds:**

Guest orders paid with crypto that qualify for refund require the user to create a BitLoot account to receive cash credits. The refund email includes a link to register. If the user doesn't register within 30 days, the refund is held in escrow (flagged for admin review).

### 4.6 Underpayment Recovery — Crypto to Cash Credits

When a crypto order is underpaid (user sends less crypto than required), instead of failing the order entirely and losing the user, BitLoot converts the received amount into cash credits.

```
NOWPayments IPN reports underpayment:
  → Validate: user paid ≥ 20% of order total (minimum threshold)
  → If below 20%: mark order as failed, standard underpayment email (too little to recover)
  → If ≥ 20%: 
      → Calculate EUR value of crypto actually received (using NOWPayments rate)
      → Cancel the original order (mark as 'underpaid')
      → Create cash credit grant: creditsService.grantCashCredits(userId, receivedEurAmount, 'underpayment_recovery', orderId)
      → credit_transaction created (type: 'underpayment_recovery', credit_type: 'cash')
      → user_credits.cash_balance incremented
      → Email: "Your payment of €X was less than the order total of €Y. 
               We've added €X to your BitLoot Credits balance. 
               You can use these credits on your next purchase."
```

**Underpayment recovery rules:**

| Rule | Detail |
|------|--------|
| Minimum threshold | User must have paid ≥ 20% of order total to qualify for credit recovery |
| Below threshold | Standard underpayment failure (no credits, user must contact support) |
| Credit type | **Cash credits** (never expire, user paid real money) |
| Credit amount | EUR value of crypto actually received (per NOWPayments exchange rate) |
| Order status | Marked as `underpaid` (not `failed` — distinct status for reporting) |
| Idempotency | Check `credit_transactions(reference_type: 'underpayment_recovery', reference_id: orderId)` before creating |

**Guest Checkout Underpayment:**

Guest users who underpay are prompted to create an account to receive their cash credits. The underpayment email includes: (1) the amount recovered, (2) a registration link, (3) a 30-day deadline. If no account is created within 30 days, the recovery is held for admin review.

> **Cross-reference:** Loot Squad fraud table (§8) references this section for affiliate orders involving underpayment.

**Underpayment on Mixed Orders (Credits + Crypto):**

If a user applies credits AND pays partial crypto, and the crypto portion is underpaid:
- **The entire order fails.** Credits that were deducted are **refunded back** to the user's balance (cash→cash, promo→restored as new grants with original expiry).
- No underpayment recovery credits are granted on top of already-applied credits — this would create a double-refund exploit (user gets more credits back than they started with).
- The user receives an email: "Your crypto payment was insufficient. Your €X in credits have been restored. Please try again."
- Rationale: Mixed payment underpayment is too complex for partial recovery. Clean failure + credit restoration is simpler, safer, and more user-friendly.

### 4.7 Account Deletion — Credit Balance Handling

When a user requests account deletion (existing 30-day grace period flow), credit balances are handled as follows:

| Balance type | Amount | Action |
|-------------|--------|--------|
| **Promo credits** | Any | **Forfeited** — promo credits are a marketing grant, not user money |
| **Cash credits** | < €15 | **Forfeited** after explicit warning: "You have €X in cash credits that will be lost. Are you sure?" |
| **Cash credits** | ≥ €15 | **Manual refund option** — user is prompted to contact support for a refund before deletion (USDT BEP20). Admin processes manually. |
| **Affiliate earnings** | Any | Same rule as cash credits — < €15 forfeited, ≥ €15 gets manual refund option (see LootSquad.md §12) |

**Flow:**

```
User requests account deletion:
  → Check credit balances (cash + promo + affiliate earnings)
  → If cash_balance + affiliate_earnings ≥ €15:
      → Deletion confirmation shows: "You have €X in refundable balance. 
         Contact support before deleting to arrange a refund."
      → User can still proceed with deletion (their choice)
      → 30-day grace period starts
      → If user doesn't contact support within 30 days: balance forfeited at deletion
  → If cash_balance + affiliate_earnings < €15:
      → Deletion confirmation shows: "You have €X in credits that will be lost."
      → 30-day grace period starts
  → Promo credits always shown as "€X in promotional credits (non-refundable) will be forfeited"
  → At deletion (after 30-day grace): zero all balances, create final 'account_deletion' transactions
```

**Rationale for €15 threshold:** Below €15, the administrative cost of processing a manual refund (staff time, blockchain tx fee) exceeds the value. Users are warned before proceeding. This is legally defensible because store credits are not deposits — they're prepaid purchase commitments.

---

## 5. Data Model

### New entities

```
user_credits
  id                UUID PK
  user_id           UUID FK → users (UNIQUE, 1:1)
  cash_balance      DECIMAL(20,8) DEFAULT 0           -- from top-ups (never expires)
  promo_balance     DECIMAL(20,8) DEFAULT 0           -- from rewards/commissions/cashback
  total_topped_up   DECIMAL(20,8) DEFAULT 0           -- lifetime top-up amount
  total_earned      DECIMAL(20,8) DEFAULT 0           -- lifetime promo credits earned
  total_spent       DECIMAL(20,8) DEFAULT 0           -- lifetime credits spent
  total_expired     DECIMAL(20,8) DEFAULT 0           -- lifetime promo credits expired
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
```

> **Uses `decimal(20, 8)`** to match BitLoot's existing entity pattern for monetary columns (see Order.price, Product.price). All monetary columns in BitLoot use this precision.

```
credit_transactions
  id                UUID PK
  user_id           UUID FK → users                   -- denormalized for fast queries
  type              VARCHAR(30) NOT NULL               -- topup | spend | reward | affiliate_conversion | referral | cashback | refund | adjustment | expiry | admin_grant | underpayment_recovery
  credit_type       VARCHAR(10) NOT NULL               -- cash | promo
  amount            DECIMAL(20,8) NOT NULL             -- positive = credit, negative = debit
  balance_after     DECIMAL(20,8) NOT NULL             -- running balance snapshot (cash or promo depending on credit_type)
  remaining         DECIMAL(20,8)                      -- for promo grants (positive amount rows): tracks unconsumed value for FIFO spending. NULL for debits and cash credits.
  reference_type    VARCHAR(30)                        -- order | quest | quest_instance | milestone | payout | topup | topup_bonus | affiliate_commission | referral | admin | underpayment_recovery
  reference_id      UUID                               -- FK to the source record (order_id, quest_id, etc.)
  description       TEXT                               -- human-readable: "Top-up via BTC", "Quest reward: Refer 3 buyers"
  expires_at        TIMESTAMPTZ                        -- for promo credits only; NULL for cash
  expired           BOOLEAN DEFAULT false              -- set to true when this grant is expired by cron
  created_at        TIMESTAMPTZ
```

```
credit_topups
  id                UUID PK
  user_id           UUID FK → users
  amount_eur        DECIMAL(20,8) NOT NULL             -- requested top-up amount in EUR
  payment_id        UUID FK → payments                 -- NOWPayments payment record
  status            VARCHAR(20) DEFAULT 'pending'      -- pending | confirmed | failed | expired
  confirmed_at      TIMESTAMPTZ
  created_at        TIMESTAMPTZ
```

### Indexes

| Index | Purpose |
|-------|---------|
| `user_credits(user_id)` UNIQUE | 1:1 lookup, enforce single record |
| `credit_transactions(user_id, created_at DESC)` | Transaction history with pagination |
| `credit_transactions(user_id, credit_type, expired)` | Promo balance recalculation |
| `credit_transactions(expires_at)` WHERE `credit_type = 'promo' AND expired = false AND amount > 0` | Expiry cron job partial index |
| `credit_transactions(reference_type, reference_id)` | Idempotency checks |
| `credit_topups(user_id, created_at)` | Top-up history |
| `credit_topups(payment_id)` | Webhook lookup |

### Existing table changes

```
orders (add columns):
  credits_used          DECIMAL(20,8) DEFAULT 0       -- total credits applied to this order
  credits_promo_used    DECIMAL(20,8) DEFAULT 0       -- promo portion
  credits_cash_used     DECIMAL(20,8) DEFAULT 0       -- cash portion
```

> **No changes to the `users` table.** The `user_credits` record is created lazily on first credit event (top-up, promo grant, or affiliate commission conversion). The 1:1 relationship is enforced by the UNIQUE constraint on `user_credits.user_id`.

---

## 6. Backend Architecture (NestJS)

### New module: `modules/credits/`

| File | Responsibility | Phase |
|------|---------------|-------|
| `user-credits.entity.ts` | UserCredits entity (1:1 with User) | V1 |
| `credit-transaction.entity.ts` | CreditTransaction ledger entity | V1 |
| `credit-topup.entity.ts` | CreditTopup entity (payment tracking) | V2 |
| `credits.service.ts` | Core service: grant, spend, refund, balance checks, expiry | V1 |
| `credits-topup.service.ts` | Top-up flow: create payment, handle webhook confirmation | V2 |
| `credits.controller.ts` | User endpoints: get balance, transaction history, top-up | V1 |
| `admin-credits.controller.ts` | Admin endpoints: grant, adjust, view user balances, audit | V1 |
| `credits-expiry.processor.ts` | BullMQ job: expiry cron (in `apps/api/src/jobs/`) | V1 |
| `credits-reconciliation.processor.ts` | BullMQ job: reconciliation cron (in `apps/api/src/jobs/`) | V1 |
| `credits.module.ts` | Module registration with imports/exports | V1 |

### Service API

```typescript
// Core operations (all wrapped in DB transactions)
class CreditsService {
  // Read
  getBalance(userId: string): Promise<{ cash: number; promo: number; total: number }>
  getTransactionHistory(userId: string, page: number, limit: number): Promise<PaginatedResult<CreditTransaction>>
  getExpiringCredits(userId: string, withinDays: number): Promise<{ amount: number; earliest: Date | null }>

  // Write — all return the created CreditTransaction
  grantPromoCredits(userId: string, amount: number, type: TransactionType, referenceType: ReferenceType, referenceId: string, expiresInDays?: number): Promise<CreditTransaction>
  grantCashCredits(userId: string, amount: number, type: TransactionType, referenceType: ReferenceType, referenceId: string): Promise<CreditTransaction>
  spendCredits(userId: string, amount: number, orderId: string): Promise<{ promoUsed: number; cashUsed: number; transactions: CreditTransaction[] }>
  refundCredits(userId: string, amount: number, creditType: 'cash' | 'promo', orderId: string): Promise<CreditTransaction>
  
  // Admin
  adminAdjust(userId: string, amount: number, creditType: 'cash' | 'promo', reason: string, adminId: string): Promise<CreditTransaction>
  adminGrant(userId: string, amount: number, expiresInDays: number, reason: string, adminId: string): Promise<CreditTransaction>

  // Internal
  confirmTopup(topupId: string, paymentId: string): Promise<CreditTransaction>  // called by webhook handler
  expirePromoCredits(): Promise<number>  // called by cron job, returns count expired
}
```

### Spending algorithm (within `spendCredits`)

```
1. Acquire row-level lock on user_credits record (SELECT ... FOR UPDATE)
2. Verify total balance >= requested amount (else throw InsufficientCreditsError)
3. Deduct from promo_balance first:
   a. Query non-expired promo credit_transactions with remaining > 0, ordered by expires_at ASC (FIFO)
   b. Debit oldest-expiry-first: decrement `remaining` on each grant row until promo portion is covered or promo balance is 0
   c. Record promo debit transaction(s) (each referencing the grant row it consumed from)
4. Deduct remainder from cash_balance:
   a. Record cash debit transaction
5. Update user_credits: cash_balance, promo_balance, total_spent
6. Return breakdown: { promoUsed, cashUsed }
7. All within a single PostgreSQL transaction — rollback on any failure
```

### Integration points with existing modules

| Module | Integration |
|--------|-------------|
| **Orders** (`orders.service.ts`) | When creating an order: call `creditsService.spendCredits()` before creating NOWPayments payment. If credits cover 100%, skip NOWPayments entirely. Store `credits_used`, `credits_promo_used`, `credits_cash_used` on order. |
| **Payments** (`payments.service.ts`) | Top-up payments use existing NOWPayments flow with `type: 'credit_topup'`. **Unified IPN webhook handler** — same endpoint URL registered with NOWPayments, handler routes by `payment.type`: if `'order'` → `ipnHandlerService.handleOrderPayment()`, if `'credit_topup'` → `creditsTopupService.confirmTopup()`. One webhook URL = simpler NOWPayments config. |
| **Loot Squad** (`affiliate.service.ts`) | Provides a "Convert to Credits" action: deducts from affiliate earnings, calls `creditsService.grantPromoCredits()` with `source: 'affiliate_conversion'`. One-way, manual, creator-initiated. |
| **Loot Squad Quests** (`quests.service.ts`) | Quest rewards call `creditsService.grantPromoCredits()` — Loot Squad decides WHEN and HOW MUCH, Credits service decides HOW (creates transaction, sets expiry, updates balance). **Credits module never calls Loot Squad.** Dependency flows one-way: Loot Squad → Credits. |
| **Promos** (`promos.service.ts`) | Credits apply after promo discount calculation. No conflict — promo reduces order total, credits pay the reduced total. |
| **Fulfillment** (`fulfillment.service.ts`) | No direct integration — credits are deducted at order creation, not fulfillment. Refunds handled separately. |
| **SDK** | Auto-generate `CreditsApi` + `AdminCreditsApi` clients from OpenAPI. |

### BullMQ jobs

| Job | Trigger | Action |
|-----|---------|--------|
| `credits.expire-promo` | Cron (daily, 2 AM UTC) | Find all promo credit grants past expiry, create `expiry` debit transactions, update balances |
| `credits.expiry-warning` | Cron (daily, 10 AM UTC) | Email users with promo credits expiring in ≤ 7 days |
| `credits.confirm-topup` | Payment IPN webhook | Confirm top-up, credit cash balance, send confirmation email |

---

## 7. Frontend Integration

### User-facing pages

| Location | Feature | Phase |
|----------|---------|-------|
| `/profile` → Credits tab | Balance display (cash + promo), transaction history, top-up button | V1 |
| `/credits/topup` | Top-up amount selector, crypto payment flow (reuse existing NOWPayments checkout) | V2 |
| Checkout sidebar | "Use BitLoot Credits" toggle with balance display, breakdown of credits applied | V1 |
| Navigation header | Small credit balance badge (if > 0) | V1 |

### Cart & Checkout integration

```
CartContext additions:
  - useCredits: boolean (default: true if balance > 0)
  - creditsToApply: number (auto-calculated or user-adjusted)

Checkout flow:
  1. Cart total after promo discount: €45
  2. User has €30 credits → auto-applied (toggle on)
  3. Display: "Credits: -€30.00 | Remaining: €15.00 (pay with crypto)"
  4. If credits cover 100%: "Fully covered by credits — no crypto payment needed"
  5. Submit order: backend deducts credits in transaction, creates order
  6. If remaining > 0: redirect to NOWPayments for crypto portion
  7. If remaining = 0: order created as paid immediately (no NOWPayments)
```

### SDK endpoints

```
// User endpoints
GET    /credits/balance              → { cash, promo, total }
GET    /credits/transactions         → paginated transaction list (limit ≤ 50)
POST   /credits/topup               → creates top-up payment, returns NOWPayments URL
GET    /credits/expiring             → promo credits expiring within 30 days

// Admin endpoints
GET    /admin/credits/users          → paginated user balances list (search, filter, sort)
GET    /admin/credits/users/:userId  → user detail: balance + transaction history
POST   /admin/credits/grant          → admin grant promo credits to user
POST   /admin/credits/adjust         → admin adjust balance (with reason, audit logged)
GET    /admin/credits/stats          → aggregate stats: total issued, total spent, total expired, outstanding liability
```

---

## 8. Fraud & Risk Controls

| Risk | Mitigation | Severity |
|------|-----------|----------|
| **Stolen accounts** | OTP auth + session management already in place; credit balance changes trigger email notification | High |
| **Top-up abuse / money laundering** | Rate limits (5/hour, €1,000/day, €2,000 max balance); flag top-ups from new accounts (< 7 days old) for manual review | High |
| **Refund loop** | No crypto→crypto refunds; crypto orders refund to promo credits only (can't extract value); promo-credit purchases are non-refundable | Medium |
| **Balance theft via account takeover** | No transfers between users; no withdrawal; balance change emails; suspicious spend patterns flagged (spending > €200 in < 1 hour) | High |
| **Promo credit farming** | Per-source limits: max €50/day in promo credits per user from automated sources (quests, cashback); admin grants unlimited but audit-logged | Medium |
| **Accounting drift** | Every balance change requires a `credit_transaction` with `balance_after` snapshot; daily reconciliation job compares `SUM(transactions)` vs `user_credits` balances; alerts on mismatch > €0.01 | Critical |
| **Double-spend (race condition)** | `SELECT ... FOR UPDATE` row lock on `user_credits` during all balance operations; all spend/grant operations in DB transactions | Critical |
| **Top-up payment not confirmed** | Top-up credits are ONLY granted after IPN webhook confirms payment; pending top-ups expire after 24 hours | Medium |
| **Credit expiry disputes** | 7-day warning email before expiry; clear expiry dates shown in UI and transaction history; no exceptions — expired credits cannot be restored (admin can re-grant as a gesture) | Low |

### Reconciliation job

A daily BullMQ cron job (`credits.reconcile`) at 3 AM UTC:

1. For each `user_credits` record, sum all `credit_transactions` grouped by `credit_type`.
2. Compare computed sum vs stored `cash_balance` / `promo_balance`.
3. If mismatch > €0.01: create an alert in `audit_logs`, send admin notification.
4. Do NOT auto-correct — mismatches require manual investigation.

---

## 9. Accounting & Reporting

### Credit liability tracking

Cash credits are a **financial liability** — BitLoot owes users goods/services for loaded credits. This must be tracked for accurate financial reporting.

| Metric | Calculation | Report frequency |
|--------|-------------|-----------------|
| **Outstanding cash credit liability** | SUM of all `user_credits.cash_balance` | Daily snapshot |
| **Outstanding promo credit liability** | SUM of all `user_credits.promo_balance` | Daily snapshot |
| **Total credits issued (lifetime)** | SUM of all positive `credit_transactions.amount` | Monthly report |
| **Total credits spent (lifetime)** | ABS(SUM of all spend `credit_transactions.amount`) | Monthly report |
| **Total credits expired (lifetime)** | ABS(SUM of all expiry `credit_transactions.amount`) | Monthly report |
| **Breakage rate** | `total_expired / total_promo_issued × 100` | Monthly report |

### Admin dashboard

`/admin/credits` page with:
- **Stats cards:** Total outstanding liability (cash + promo), credits issued this month, credits spent this month, expiry rate.
- **User balances table:** Searchable, sortable by balance amount, filterable by credit type.
- **User detail:** Full transaction history, grant/adjust actions with reason field.
- **Liability chart:** 30-day trend of outstanding credit balances.

---

## 10. Email Notifications (Resend)

| Event | Email | Template variables |
|-------|-------|--------------------|
| Cash credit top-up confirmed | "€X added to your BitLoot balance" | amount, new_balance, tx_date |
| Promo credits earned | "You earned €X in BitLoot Credits!" | amount, source_description, expires_at, new_balance |
| Affiliate earnings converted to credits | "You converted €X to BitLoot Credits" | amount, expires_at, remaining_earnings, new_credit_balance |
| Credits spent at checkout | "€X in credits applied to your order" | amount, order_id, remaining_balance |
| Promo credits expiring soon (7 days) | "€X in credits expire on [date]" | amount, expires_at, shop_link |
| Promo credits expired | "€X in credits have expired" | amount, expired_date |
| Balance adjusted by admin | "Your BitLoot Credits balance was adjusted" | amount, reason, new_balance |
| Refund to credits | "€X refunded to your BitLoot Credits" | amount, order_id, credit_type, new_balance |

All emails use idempotency keys (existing Resend pattern) to prevent duplicates on retry.

---

## 11. Rollout Phases

### V1: Promo Credits Only (2–3 weeks)

**Build:**
- `user_credits` + `credit_transactions` entities + migration.
- `CreditsService` with grant, spend, balance, transaction history.
- `credits.controller.ts` — user endpoints (balance, history).
- `admin-credits.controller.ts` — admin grant, adjust, user balances.
- Checkout integration: credits toggle, spend logic, skip NOWPayments if fully covered.
- Expiry cron job + 7-day warning emails.
- Reconciliation cron job.
- Order columns: `credits_used`, `credits_promo_used`, `credits_cash_used`.
- SDK regeneration.

**Skip in V1:** No top-ups, no `credit_topups` table, no top-up page, no cashback. Promo credits come only from admin grants, quest rewards, and buyer referral bonuses. Affiliate earnings conversion (Loot Squad → credits) ships when Loot Squad ships.

**Test with:** Admin-granted promo credits to 10 users → verify checkout spend → verify expiry → verify reconciliation.

### V2: Cash Credits (Top-Up) (2–3 weeks)

- `credit_topups` entity + migration.
- `CreditsTopupService` — create top-up order, confirm via IPN.
- `/credits/topup` page with amount presets (€5/€10/€25/€50/€100).
- Top-up rate limiting + fraud controls.
- Refund-to-credits flow for crypto-paid orders.
- Navigation balance badge.

### V3: Cashback & Loyalty (2–3 weeks)

- Admin-configurable cashback rate (X% back in promo credits on every purchase).
- Cashback calculated and granted after order fulfillment (not at checkout — prevents gaming).
- Credit-only flash deals (products purchasable only with credits).
- Expiry extension: active users (purchase in last 30 days) get promo credit expiry extended by 30 days automatically.

---

## 12. Full-Credit Orders — Special Flow

When credits cover 100% of the order total (after promo discount):

1. No NOWPayments payment is created.
2. Order status goes directly to `paid` (skipping `waiting` and `confirming`).
3. Fulfillment is triggered immediately (same BullMQ job as IPN-confirmed orders).
4. Order record stores `credits_used = totalCrypto`, `totalCrypto = 0` (or original total).
5. Email confirmation shows "Paid with BitLoot Credits" instead of crypto tx details.

**Edge case:** If fulfillment fails on a full-credit order, the refund follows the rules in §4.5 (cash credits back to cash, promo credits forfeited unless it's a fulfillment failure caused by BitLoot — in which case promo credits are restored as new grants).

---

## 13. Security Considerations

| Concern | Approach |
|---------|----------|
| **Balance manipulation** | All balance changes go through `CreditsService` — never direct column updates. Service enforces transaction records. |
| **Negative balance** | Service rejects any spend that would result in negative balance. Enforced at application layer AND database CHECK constraint (`cash_balance >= 0`, `promo_balance >= 0`). |
| **Race conditions** | `SELECT ... FOR UPDATE` on `user_credits` row for all write operations. Serializable isolation not needed — row lock is sufficient. |
| **Replay attacks** | Idempotency via `(reference_type, reference_id)` unique check on `credit_transactions` — same source event cannot create duplicate credits. |
| **Admin abuse** | All admin grant/adjust operations require `reason` field, are logged to `audit_logs`, and show up in admin activity feed. |
| **Top-up payment manipulation** | Credits are ONLY granted after IPN webhook confirmation (same HMAC verification as regular orders). Never on payment creation. |

---

## 14. API Payload Contracts

### User endpoints

```
GET /credits/balance
Response: {
  cash: 30.00,
  promo: 15.50,
  total: 45.50,
  expiringWithin30Days: 10.00
}

GET /credits/transactions?page=1&limit=20
Response: {
  items: [
    {
      id: "uuid",
      type: "reward",
      creditType: "promo",
      amount: 5.00,
      balanceAfter: 15.50,
      referenceType: "quest",
      referenceId: "uuid",
      description: "Quest reward: Refer 3 new buyers",
      expiresAt: "2026-07-05T00:00:00Z",
      createdAt: "2026-04-05T12:00:00Z"
    }
  ],
  total: 42,
  page: 1,
  limit: 20
}
```

### Checkout integration

```
POST /orders (existing endpoint — enhanced)
Body: {
  ...existing fields,
  useCredits: true  // new field — signals credit deduction
}

Response (enhanced): {
  ...existing fields,
  creditsUsed: 30.00,
  creditsPromoUsed: 15.50,
  creditsCashUsed: 14.50,
  remainingCryptoAmount: 15.00,  // amount to pay via NOWPayments (0 if fully covered)
  paymentUrl: "https://nowpayments.io/..." | null  // null if fully covered by credits
}
```

---

## 15. References

- **Steam Wallet:** Closed-loop balance, top-up via multiple methods, no withdrawal. Industry standard for game storefronts.
- **PlayStation Store / Nintendo eShop balance:** Store credit model with gift card top-ups.
- **EU PSD2 "limited network" exemption:** Closed-loop store credits used within a single platform are exempt from e-money licensing requirements in most EU jurisdictions.
- **FTC refund rules:** Store credit refunds are generally acceptable as alternative to original payment method refunds for digital goods.
- **Double-entry bookkeeping for store credits:** Each credit and debit must have a matching transaction record for audit compliance.
