# Level 11 — Revenue Streams: Monetization Infrastructure

> **Source doc:** [`docs/TheLootSquad/RevenueStreams.md`](./RevenueStreams.md)
>
> **Independence:** Each revenue stream activates at different points in the Credits and Loot Squad lifecycle. There is no single "Revenue Streams module" — implementations are woven into existing modules as they become viable.
>
> **Prerequisites vary by stream** (see table below).

---

## Overview

Revenue Streams defines 13 mechanisms for BitLoot to generate revenue beyond product markup. Most are passive (spread, breakage, float) and require only configuration or cron jobs, not new user-facing features. A few are active campaigns (bonus top-ups, credit-only flash sales, gift codes).

**Key principle:** Revenue streams are NOT separate modules. They are configurations, cron jobs, and minor extensions to existing Credits and Loot Squad infrastructure.

---

## Stream Dependency & Phasing

| # | Stream | Depends On | Phase | Effort |
|---|--------|-----------|-------|--------|
| 1 | Top-up spread | Credits V2 (cash top-up) | With Credits V2 | Config only |
| 2 | Promo credit breakage | Credits V1 (promo credits) | With Credits V1 | Cron job |
| 3 | Float benefit | Credits V2 (cash top-up) | With Credits V2 | Analytics only |
| 4 | Bonus top-up promos | Credits V2 (cash top-up) | After Credits V2 | Admin + backend |
| 5 | Credit-only flash sales | Credits V2 + catalog flash deals | After Credits V2 | Catalog flag |
| 6 | Gift codes | Credits V2 (cash credits) | Phase 4+ (deferred) | Full feature |
| 7 | Payout conversion spread | Loot Squad Phase 2 (payouts) | With LS Phase 2 | Config only |
| 8 | Self-funded promo quests | Loot Squad Phase 3 (quests) | With LS Phase 3 | Admin UI |
| 9 | Creator-to-credits conversion | LS Phase 2 + Credits V1 | With LS Phase 2 | Already built |
| 10 | Buyer loyalty tiers | Credits V3 | With Credits V3 | Full feature |
| 11 | Premium membership | Subscription billing | Phase 5+ (deferred) | Full feature |
| 12 | Seasonal credit events | Credits V2 + marketing | After Credits V2 | Campaign config |
| 13 | Data monetization | Scale (500+ affiliates) | Phase 5+ (deferred) | Analytics |

---

## Stream 1: Top-Up Spread

> **Ships with:** Credits V2 (cash top-up via NOWPayments)

### What

When a user tops up credits with crypto, BitLoot bakes a 1–3% spread into the crypto→EUR conversion rate. The user sees "Pay X crypto for €50 in credits" — the crypto amount is slightly above market rate.

### Implementation

**Where:** `apps/api/src/modules/credits/credits-topup.service.ts` (created in Credits V2)

**Config:** Add to admin-configurable settings:

```typescript
{
  topUpSpreadPercent: number;  // default 2.0 (%)
  spreadEnabled: boolean;      // default true
}
```

**Logic in top-up flow:**

```
1. User requests €50 top-up
2. Fetch current market rate: 1 EUR = X crypto (from NOWPayments estimate)
3. Apply spread: adjustedRate = marketRate * (1 + spreadPercent / 100)
4. Create NOWPayments invoice for adjustedRate amount
5. User pays adjusted crypto amount
6. On IPN confirmation: credit user with €50 (face value, not crypto value)
7. BitLoot profit: crypto received − crypto needed at market rate
```

**Revenue tracking:**

```
Add to each top-up transaction record:
  market_rate         DECIMAL(20,8)
  applied_rate        DECIMAL(20,8)
  spread_revenue_eur  DECIMAL(20,8)   -- computed: (applied_rate - market_rate) * amount
```

### RS1-Task 1: Implement Spread Configuration

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/credits/credits-topup.service.ts` | Apply spread to NOWPayments amount |
| Admin config entity/service | Add `topUpSpreadPercent` setting |

**Acceptance:**
- [ ] Spread applied to crypto amount (user pays slightly more crypto)
- [ ] User sees face value in EUR (€50 = €50 in credits)
- [ ] Spread revenue tracked per transaction
- [ ] Admin can toggle spread on/off and adjust percentage
- [ ] Spread capped at 5% max (hardcoded safety)

---

## Stream 2: Promo Credit Breakage

> **Ships with:** Credits V1 (promo credits with 90-day expiry)

### What

Promo credits that expire unused are recovered marketing cost. Track and report breakage rate for financial reporting.

### Implementation

**Where:** Already partially built in Credits V1 expiry cron.

### RS2-Task 1: Breakage Tracking & Reporting

**Files to modify/create:**

| File | Purpose |
|------|---------|
| `apps/api/src/jobs/credit-expiry.processor.ts` | Already expires promo credits — add breakage metrics |

**On each expiry run:**

```
1. Find all expired promo credits with remaining balance > 0
2. For each:
   a. Record expired amount in credit_transactions (type: 'expired')
   b. Zero out promo balance
3. Aggregate stats:
   - Total promo credits granted this month
   - Total promo credits expired (breakage)
   - Breakage rate = expired / granted * 100
4. Store in analytics or admin dashboard metrics
```

**Admin reporting (add to existing admin dashboard):**

| Metric | Description |
|--------|-------------|
| Monthly promo granted | Total EUR in promo credits issued |
| Monthly promo expired | Total EUR expired unused |
| Breakage rate | Percentage expired |
| Breakage revenue | EUR value of expired credits (= cost savings) |

**Acceptance:**
- [ ] Expired promo credits tracked with `type: 'expired'` transaction
- [ ] Breakage rate visible on admin dashboard
- [ ] Monthly/quarterly breakage reports available
- [ ] No user-facing changes (users don't see "breakage")

---

## Stream 3: Float Benefit

> **Ships with:** Credits V2 (cash top-up)

### What

Aggregate pre-loaded cash credit balances represent an interest-free float. This is a cash flow benefit, not direct revenue. Track for financial reporting.

### RS3-Task 1: Float Analytics

**Add to admin dashboard:**

```
Total cash credit float = SUM(all users' cash_balance)
Average dwell time = AVG(days between top-up and spend)
```

**Implementation:** Simple SQL query, exposed on admin analytics endpoint.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/admin/admin.controller.ts` | Add `/admin/analytics/float` endpoint |
| Admin dashboard frontend | Display float metrics card |

**Acceptance:**
- [ ] Total float displayed on admin dashboard
- [ ] Average dwell time calculated
- [ ] No user-facing changes

---

## Stream 4: Bonus Top-Up Promotions

> **Ships after:** Credits V2

### What

"Top up €50, get €55 in credits" — the €5 bonus is promo credits with 90-day expiry. Drives top-up volume.

### RS4-Task 1: Bonus Top-Up Configuration

**What:** Admin creates bonus promotions (e.g., "10% bonus on top-ups over €50").

**New entity:** `TopUpPromotion`

```
id              UUID PK
name            VARCHAR(100)
min_topup_eur   DECIMAL(20,8)       -- minimum top-up to qualify
bonus_percent   DECIMAL(5,2)        -- e.g., 10 (= 10% bonus)
bonus_cap_eur   DECIMAL(20,8)       -- maximum bonus per top-up
max_uses_total  INT                 -- NULL = unlimited
max_uses_per_user INT               -- NULL = unlimited
starts_at       TIMESTAMPTZ
ends_at         TIMESTAMPTZ
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/entities/topup-promotion.entity.ts` | Entity |
| `apps/api/src/database/migrations/{timestamp}-CreateTopUpPromotions.ts` | Migration |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/credits/credits-topup.service.ts` | Check for active bonus promo → grant extra promo credits |
| Admin credits controller | CRUD for bonus promos |
| Admin credits page | UI for creating/managing bonus promos |

**Flow:**

```
1. User requests €50 top-up
2. Check active TopUpPromotion: min_topup = €30, bonus_percent = 10%
3. Bonus = MIN(€50 * 10% = €5, bonus_cap)
4. After crypto payment confirmed:
   a. Grant €50 cash credits
   b. Grant €5 promo credits (source: 'topup_bonus', expires 90 days)
5. Show user: "You received €55 in credits (€5 bonus!)"
```

**Acceptance:**
- [ ] Admin can create time-limited bonus promotions
- [ ] Bonus applied automatically on qualifying top-ups
- [ ] Bonus is promo credits (not cash credits!)
- [ ] Bonus cap prevents abuse on large top-ups
- [ ] Per-user usage limits enforced
- [ ] User sees bonus notification after top-up

---

## Stream 5: Credit-Only Flash Sales

> **Ships after:** Credits V2 + existing flash deal infrastructure

### What

Products marked as "Credit-Only" can only be purchased with credits (no crypto checkout). Forces users to top up first, driving top-up volume and spread revenue.

### RS5-Task 1: Credit-Only Product Flag

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/catalog/entities/product.entity.ts` | Add `creditOnly: boolean` column |
| `apps/api/src/modules/orders/orders.service.ts` | Enforce credit-only rule at checkout |
| Product card component (frontend) | Show "Credits Only" badge |
| Checkout flow (frontend) | Skip crypto payment step if fully covered by credits |

**Checkout enforcement:**

```
At order creation:
1. For each item: if product.creditOnly === true
   a. Verify user.totalCredits >= order total
   b. If not enough credits → reject with "This product requires credits. Top up first."
2. If all items are credit-only AND credits cover 100%:
   a. Skip NOWPayments entirely
   b. Deduct credits immediately
   c. Mark order as paid
   d. Enqueue fulfillment
```

**Acceptance:**
- [ ] `creditOnly` flag on products
- [ ] Checkout rejects credit-only products without sufficient credits
- [ ] "Credits Only" badge on product cards and detail pages
- [ ] Admin can toggle credit-only flag per product
- [ ] Orders with 100% credit-only items skip crypto payment

---

## Stream 6: Gift Codes (Phase 4+ — Deferred)

> **Status:** Future feature. Admin-managed, no self-service portal.

### What

Admin generates redeemable credit codes (e.g., `BITLOOT-XXXXX-XXXXX`). Sold wholesale to distributors who resell via traditional payment methods. Buyers redeem on BitLoot for cash credits.

### RS6-Task 1: Gift Code Entity & Generation

**New entities:**

```
gift_code_batches
  id              UUID PK
  name            VARCHAR(100)
  quantity        INT
  face_value_eur  DECIMAL(20,8)
  wholesale_price_eur  DECIMAL(20,8)
  distributor     VARCHAR(100)
  generated_at    TIMESTAMPTZ
  status          VARCHAR(20)        -- draft | generated | exported | sold

gift_codes
  id              UUID PK
  batch_id        UUID FK → gift_code_batches
  code            VARCHAR(30) UNIQUE  -- e.g. BITLOOT-XXXXX-XXXXX
  face_value_eur  DECIMAL(20,8)
  status          VARCHAR(20)        -- active | redeemed | expired | voided
  redeemed_by     UUID FK → users (nullable)
  redeemed_at     TIMESTAMPTZ
  expires_at      TIMESTAMPTZ
  created_at      TIMESTAMPTZ
```

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/entities/gift-code.entity.ts` | GiftCode entity |
| `apps/api/src/modules/credits/entities/gift-code-batch.entity.ts` | GiftCodeBatch entity |
| `apps/api/src/modules/credits/gift-code.service.ts` | Generate, redeem, validate |
| `apps/api/src/modules/credits/gift-code.controller.ts` | Public redeem + admin CRUD |
| `apps/web/src/app/(dashboard)/redeem/page.tsx` | Redeem code page |
| `apps/web/src/app/admin/credits/gift-codes/page.tsx` | Admin gift code management |

**Code generation:**
- Format: `BITLOOT-XXXXX-XXXXX` (25 chars, uppercase alphanumeric segments)
- Generated with `crypto.randomBytes()` (not Math.random)
- Batch generation: admin specifies quantity + face value → system generates all codes
- Export as CSV for distributor

**Redeem endpoint:** `POST /credits/redeem`

```
1. Validate code format
2. Look up gift_codes by code
3. Verify status === 'active' AND expires_at > NOW()
4. Create credit_transaction (type: 'gift_code_redemption')
5. Grant cash credits (face value) to user
6. Mark code as redeemed
```

**Acceptance:**
- [ ] Batch generation with secure random codes
- [ ] CSV export for wholesale distribution
- [ ] Redeem endpoint grants cash credits
- [ ] Single-use enforcement
- [ ] Expire date enforced
- [ ] Rate limit on redeem endpoint (5/min per IP)
- [ ] Admin can void unused codes

---

## Stream 7: Payout Conversion Spread

> **Ships with:** Loot Squad Phase 2 (payouts)

### What

0.5–1% spread on EUR→USDT conversion when paying affiliate payouts.

### RS7-Task 1: Payout Spread Configuration

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/affiliates/affiliate-payout.service.ts` | Apply spread to conversion |
| Admin affiliate config | Add `payoutConversionSpreadPercent` setting |

**Logic in batch creation:**

```
1. Admin enters conversion rate (e.g., 1 EUR = 1.05 USDT)
2. System applies spread: effectiveRate = adminRate * (1 - spreadPercent / 100)
3. Affiliate receives: amountEur * effectiveRate USDT
4. Spread revenue: amountEur * (adminRate - effectiveRate)
5. Record spread_revenue_eur on payout batch
```

**Revenue tracking:** Add `spread_revenue_eur` column to `affiliate_payout_batches`.

**Acceptance:**
- [ ] Spread applied to conversion rate
- [ ] Affiliates see net USDT amount (not the pre-spread rate)
- [ ] Revenue from spread tracked per batch
- [ ] Admin can adjust spread percentage
- [ ] Default: 0.5%

---

## Stream 8: Self-Funded Promo Quests

> **Ships with:** Loot Squad Phase 3 (quests)

### What

BitLoot creates quests that push specific products. Rewards funded by BitLoot's own margin. Example: "Refer 5 sales of [Game X] this week → earn €10 in promo credits."

### RS8-Task 1: Product-Specific Quest Support

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/affiliates/entities/affiliate-quest.entity.ts` | Add `target_product_id` and `target_category` columns |
| `apps/api/src/modules/affiliates/affiliate-quest.service.ts` | Filter quest progress by product/category |
| Admin quest management page | Allow selecting specific products or categories |

**Quest template additions:**

```
target_product_id   UUID FK → products (nullable)
target_category     VARCHAR(50)             (nullable)
-- If set: only referrals for matching products count toward goal
```

**Acceptance:**
- [ ] Quests can target specific products or categories
- [ ] Only matching referrals count toward progress
- [ ] Admin can create product-specific quests with promo credit rewards
- [ ] Quest rewards are promo credits (breakage applies)

---

## Stream 9: Creator-to-Credits Conversion Value

> **Ships with:** Loot Squad Phase 2 + Credits V1

### What

Already implemented as part of Loot Squad Phase 2, Task 5 (earnings → credits conversion). The revenue benefit is automatic: converting €10 EUR payout liability into €10 promo credits costs BitLoot ~€7 in product cost (30% margin savings).

### RS9-Task 1: Conversion Analytics

**Files to modify:**

| File | Change |
|------|--------|
| Admin dashboard | Track total conversion volume and estimated savings |

**Metrics to display:**

```
Total conversions this month: €X
Estimated savings (30% margin): €Y
Conversion rate (% of affiliates converting): Z%
```

**Acceptance:**
- [ ] Conversion volume tracked
- [ ] Savings estimate shown to admin

---

## Stream 10: Buyer Loyalty Tiers

> **Ships with:** Credits V3

### What

Tiered buyer loyalty based on lifetime spend. Higher tiers earn more promo credit cashback.

### RS10-Task 1: Loyalty Tier Configuration

**New entity:** `LoyaltyTier`

```
id              UUID PK
name            VARCHAR(50)         -- Bronze, Silver, Gold, Platinum
min_spend_eur   DECIMAL(20,8)       -- lifetime spend threshold
cashback_percent DECIMAL(5,2)       -- promo credit cashback rate
sort_order      SMALLINT
perks           JSONB               -- { earlyAccess: true, exclusiveDeals: true }
created_at      TIMESTAMPTZ
```

**Add to `users` table:**

```
loyalty_tier_id     UUID FK → loyalty_tiers (nullable)
lifetime_spend_eur  DECIMAL(20,8) DEFAULT 0
```

**Default tiers:**

| Tier | Min Spend | Cashback |
|------|-----------|----------|
| Bronze | €0 | 1% |
| Silver | €100 | 2% |
| Gold | €500 | 3% |
| Platinum | €2,000 | 5% |

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/entities/loyalty-tier.entity.ts` | Tier definitions |
| `apps/api/src/modules/credits/loyalty.service.ts` | Tier calculation, cashback granting |
| `apps/api/src/database/migrations/{timestamp}-CreateLoyaltyTiers.ts` | Migration + seed |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/users/entities/user.entity.ts` | Add `loyaltyTierId`, `lifetimeSpendEur` |
| `apps/api/src/modules/orders/orders.service.ts` | After order fulfilled: update lifetime spend, check tier upgrade |
| `apps/api/src/modules/credits/credits.service.ts` | Grant cashback promo credits |
| Profile page (frontend) | Show current tier + progress to next |
| Admin dashboard | Tier management + override |

**Flow (after order fulfilled):**

```
1. Update user.lifetimeSpendEur += order.total
2. Check if user qualifies for higher tier
3. If upgraded: update user.loyaltyTierId, send tier-up email
4. Calculate cashback: order.total * tier.cashbackPercent / 100
5. Grant cashback as promo credits (source: 'loyalty_cashback', 90-day expiry)
```

**Acceptance:**
- [ ] Lifetime spend tracked on user entity
- [ ] Tier auto-upgrades on qualify
- [ ] Cashback granted as promo credits after fulfillment
- [ ] Tier-up email notification
- [ ] Tiers never downgrade (lifetime, not rolling)
- [ ] Admin can override user tier
- [ ] Profile shows tier badge + progress bar

---

## Stream 11: Premium Membership (Phase 5+ — Deferred)

> **Status:** Deferred. Requires subscription billing infrastructure. Not viable until 500+ active users.

### What (Future)

€4.99/month membership with 5% cashback, exclusive deals, early access, no top-up spread.

### Implementation Notes (For Future Reference)

- **Billing:** Deduct €4.99 from cash credit balance monthly (crypto has no auto-debit)
- User must maintain cash credit balance >= €4.99 or membership lapses
- **Entity:** `memberships` table with `user_id`, `status`, `started_at`, `expires_at`, `next_billing_at`
- **Cron:** Daily check for memberships due for billing → deduct from cash credits → extend 30 days
- **Perks:** Implemented as feature flags checked at relevant points (cashback rate, flash sale access, spread waiver)

**No implementation tasks created.** This is a design reference for Phase 5+.

---

## Stream 12: Seasonal Credit Events

> **Ships after:** Credits V2 + marketing infrastructure

### What

Time-limited campaigns like "Summer Loot Fest" — double cashback in promo credits for 1 week.

### RS12-Task 1: Event Campaign System

**What:** Admin creates campaigns that modify cashback rates, bonus amounts, or promo credit grants for a time window.

**New entity:** `CreditEvent`

```
id              UUID PK
name            VARCHAR(100)
event_type      VARCHAR(30)         -- double_cashback | bonus_topup | credit_rain
multiplier      DECIMAL(5,2)        -- cashback multiplier (e.g., 2.0 = double)
bonus_config    JSONB               -- event-specific config
starts_at       TIMESTAMPTZ
ends_at         TIMESTAMPTZ
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/credits/entities/credit-event.entity.ts` | Event entity |
| `apps/api/src/modules/credits/credit-event.service.ts` | Check active events, apply multipliers |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/credits/loyalty.service.ts` | Check for active `double_cashback` event → apply multiplier |
| `apps/api/src/modules/credits/credits-topup.service.ts` | Check for active `bonus_topup` event → apply extra bonus |
| Admin marketing pages | Event creation UI |
| Homepage (frontend) | Event banner when active |

**Acceptance:**
- [ ] Admin can create time-limited events
- [ ] Active events automatically modify cashback/bonus rates
- [ ] Events auto-deactivate after `ends_at`
- [ ] Homepage shows event banner during active period
- [ ] Cashback during event is still promo credits (breakage applies)

---

## Stream 13: Data & Insights Monetization (Phase 5+ — Deferred)

> **Status:** Deferred. Requires scale (500+ affiliates, significant traffic).

### What (Future)

Aggregate anonymized data from affiliate clicks, conversions, and purchases. Sell market intelligence to publishers.

**No implementation tasks created.** Requires:
- Anonymized analytics pipeline
- Legal review (GDPR, data processing agreements)
- Report generation infrastructure
- Publisher partnership framework

---

## Admin Revenue Dashboard

### RS-Admin-Task 1: Revenue Streams Overview

**What:** Single admin page showing all active revenue stream metrics.

**File:** `apps/web/src/app/admin/revenue/page.tsx`

**Sections:**

| Section | Metrics |
|---------|---------|
| Top-Up Spread | Total spread revenue, average spread %, volume |
| Breakage | Monthly promo granted vs expired, breakage rate |
| Float | Total cash credit float, average dwell time |
| Payout Spread | Total payout spread revenue, payout volume |
| Conversions | Earnings→credits volume, estimated margin savings |
| Loyalty | Active users per tier, cashback granted, tier upgrade rate |

**Data source:** Existing transaction tables with aggregation queries. Add `/admin/analytics/revenue` endpoint returning all metrics.

**Acceptance:**
- [ ] All active streams have metrics displayed
- [ ] Date range filter (7d, 30d, 90d, all time)
- [ ] Chart showing revenue stream breakdown over time
- [ ] Export as CSV

---

## Implementation Order (Recommended)

The streams are not built in isolation — they activate as their prerequisite systems ship:

```
Credits V1 ships → Stream 2 (breakage tracking) auto-activates
Credits V2 ships → Stream 1 (spread), Stream 3 (float), then Stream 4, 5, 12
Loot Squad P2 ships → Stream 7 (payout spread), Stream 9 (conversion value)
Loot Squad P3 ships → Stream 8 (promo quests)
Credits V3 ships → Stream 10 (loyalty tiers)
Phase 4+ → Stream 6 (gift codes)
Phase 5+ → Stream 11 (premium), Stream 13 (data)
```

**For the implementing AI agent:** Do NOT build these as a standalone "Revenue module." Instead, add the relevant config/logic to the module where it naturally belongs (Credits, Affiliates, Admin). The revenue dashboard (`/admin/revenue`) is the only truly new page.

---

## File Inventory (Complete)

### Backend — New Files

```
apps/api/src/modules/credits/entities/topup-promotion.entity.ts          (Stream 4)
apps/api/src/modules/credits/entities/loyalty-tier.entity.ts             (Stream 10)
apps/api/src/modules/credits/entities/credit-event.entity.ts             (Stream 12)
apps/api/src/modules/credits/entities/gift-code.entity.ts                (Stream 6, deferred)
apps/api/src/modules/credits/entities/gift-code-batch.entity.ts          (Stream 6, deferred)
apps/api/src/modules/credits/loyalty.service.ts                          (Stream 10)
apps/api/src/modules/credits/credit-event.service.ts                     (Stream 12)
apps/api/src/modules/credits/gift-code.service.ts                        (Stream 6, deferred)
apps/api/src/modules/credits/gift-code.controller.ts                     (Stream 6, deferred)

apps/api/src/database/migrations/
├── {timestamp}-CreateTopUpPromotions.ts                                  (Stream 4)
├── {timestamp}-CreateLoyaltyTiers.ts                                     (Stream 10)
├── {timestamp}-CreateCreditEvents.ts                                     (Stream 12)
└── {timestamp}-CreateGiftCodes.ts                                        (Stream 6, deferred)
```

### Backend — Modified Files

```
apps/api/src/modules/credits/credits-topup.service.ts     (spread, bonus promos, event multipliers)
apps/api/src/modules/credits/credits.service.ts            (loyalty cashback)
apps/api/src/modules/affiliates/affiliate-payout.service.ts (payout spread)
apps/api/src/modules/affiliates/entities/affiliate-quest.entity.ts (product-specific quests)
apps/api/src/modules/affiliates/affiliate-quest.service.ts  (product quest filtering)
apps/api/src/modules/catalog/entities/product.entity.ts     (creditOnly flag)
apps/api/src/modules/orders/orders.service.ts               (credit-only enforcement, cashback)
apps/api/src/modules/users/entities/user.entity.ts          (loyaltyTierId, lifetimeSpendEur)
apps/api/src/modules/admin/admin.controller.ts              (revenue analytics endpoint)
apps/api/src/jobs/credit-expiry.processor.ts                (breakage tracking)
```

### Frontend — New Files

```
apps/web/src/app/admin/revenue/page.tsx                     (Revenue dashboard)
apps/web/src/app/admin/credits/gift-codes/page.tsx          (Stream 6, deferred)
apps/web/src/app/(dashboard)/redeem/page.tsx                (Stream 6, deferred)
```

### Frontend — Modified Files

```
apps/web/src/app/admin/AdminLayoutClient.tsx                (Revenue sidebar link)
apps/web/src/app/admin/credits/page.tsx                     (Bonus promos, events sections)
apps/web/src/app/admin/loot-squad/challenges/page.tsx       (Product-specific quest creation)
Product card component                                      (Credit-only badge)
Checkout flow                                                (Credit-only enforcement)
Profile page                                                 (Loyalty tier badge + progress)
Homepage                                                     (Event banner)
```
