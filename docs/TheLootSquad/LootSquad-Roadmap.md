# Level 10 — Loot Squad: Creator & Referral System

> **Source doc:** [`docs/TheLootSquad/LootSquad.md`](./LootSquad.md)
>
> **Independence:** Core Loot Squad (Phase 1–2) ships independently of Credits. Gamification (Phase 3) integrates with Credits for quest rewards.
>
> **Prerequisite:** Levels 0–6 complete. Credits V1 recommended but not required for Phase 1.

---

## Overview

Loot Squad is a Support-A-Creator affiliate system. Creators share referral codes, earn EUR-denominated commissions on fulfilled orders (8–12% of margin, sliding scale), and get paid in USDT (BEP20). Gamification (XP, quests, leaderboards) ships in Phase 3 after core validation.

**Key mechanics:**
- **Attribution:** Last-click, 30-day window, cookie + localStorage + checkout code field
- **Commission:** Per-item, margin-based (selling price − cost), sliding scale with €0.50 floor
- **Payouts:** Manual admin → USDT BEP20, monthly batch, €15 minimum
- **Fraud:** Multi-signal scoring (0–100), self-referral hard block, hold periods

---

## Phase Structure

| Phase | Name | Duration | Deliverables |
|-------|------|----------|-------------|
| **1** | Support-A-Creator MVP | 2–3 weeks | Enrollment, codes, attribution, commission, dashboard, admin |
| **2** | Payouts & Ledger | 2–3 weeks | Payout batches, wallet verification, transaction history, code rotation |
| **3** | Gamification & Community | 4–6 weeks | XP, levels, badges, quests, leaderboards, public profiles, buyer referrals |
| **4** | Events & Analytics | Ongoing | Creator storefronts, event quests, advanced analytics, UTM insights |

---

## Phase 1: Support-A-Creator MVP

### P1-Task 1: Database Entities & Migration

**What:** Create `affiliate_codes` and `affiliate_commissions` tables. Add `ref_code` to `orders` and `product_cost_eur` to `order_items`.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/affiliates/entities/affiliate-code.entity.ts` | AffiliateCode — 1:1 with User |
| `apps/api/src/modules/affiliates/entities/affiliate-commission.entity.ts` | Per-item commission records |
| `apps/api/src/database/migrations/{timestamp}-CreateAffiliateSchema.ts` | Migration |

**`affiliate_codes` schema:**

```
id                    UUID PK
user_id               UUID FK → users (UNIQUE, 1:1)
code                  VARCHAR(20) UNIQUE NOT NULL         -- e.g. NINJALOOT
vanity_code           VARCHAR(20) UNIQUE                  -- Phase 3 unlock
status                VARCHAR(20) DEFAULT 'active'        -- active | suspended | banned
commission_rate_override  DECIMAL(5,2)                    -- NULL = sliding scale; set for Diamond
total_clicks          INT DEFAULT 0                       -- incremented by /r/:code
total_referrals       INT DEFAULT 0                       -- fulfilled referral count
total_earned          DECIMAL(20,8) DEFAULT 0             -- lifetime EUR earned
balance               DECIMAL(20,8) DEFAULT 0             -- current available EUR balance
social_links          JSONB                               -- { twitch, youtube, discord, ... }
display_name          VARCHAR(50)                         -- public profile name
avatar_url            TEXT
bio                   TEXT
wallet_address        VARCHAR(100)                        -- BEP20 (0x + 40 hex), VARCHAR(100) for future multi-chain
wallet_currency       VARCHAR(10) DEFAULT 'USDT'
wallet_network        VARCHAR(20) DEFAULT 'bep20'
wallet_verified       BOOLEAN DEFAULT false
last_wallet_change_ip VARCHAR(45)
last_wallet_change_at TIMESTAMPTZ
kyc_status            VARCHAR(20) DEFAULT 'none'          -- none | pending | verified | rejected
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()

CHECK: balance >= 0
INDEX: (user_id) UNIQUE
INDEX: (code) UNIQUE
INDEX: (vanity_code) UNIQUE WHERE vanity_code IS NOT NULL
INDEX: (status)
```

**`affiliate_commissions` schema:**

```
id                    UUID PK
affiliate_code_id     UUID FK → affiliate_codes
order_id              UUID FK → orders
order_item_id         UUID FK → order_items
gross_item_eur        DECIMAL(20,8)                       -- selling price in EUR
cost_eur              DECIMAL(20,8)                       -- frozen cost at fulfillment
margin_eur            DECIMAL(20,8)                       -- gross - cost
margin_source         VARCHAR(20)                         -- kinguin_api | admin_cost | default_pct | flat_fallback
commission_rate       DECIMAL(5,2)                        -- % at calculation time
commission_eur        DECIMAL(20,8)                       -- frozen EUR (>= €0.50 floor)
status                VARCHAR(20)                         -- pending | available | credited | paid | rejected
fraud_score           SMALLINT DEFAULT 0                  -- 0–100
is_new_buyer          BOOLEAN DEFAULT false
hold_until            TIMESTAMPTZ                         -- 48h after fulfillment
utm_source            VARCHAR(50)
utm_campaign          VARCHAR(100)
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()

INDEX: (affiliate_code_id, status)
INDEX: (affiliate_code_id, created_at DESC)
INDEX: (order_id)
INDEX: (order_item_id) UNIQUE                             -- one commission per item
INDEX: (status, hold_until)                               -- pending release query
```

**`orders` table addition:**

```
ref_code              VARCHAR(20)                         -- affiliate code used at checkout
```

**`order_items` table addition:**

```
product_cost_eur      DECIMAL(20,8)                       -- frozen product cost at order time
```

**Entity patterns:**
- Follow existing entity conventions (see `order.entity.ts`)
- `decimal(20,8)` for all monetary columns
- Add `@ManyToOne(() => User)` on AffiliateCode
- Add `@ManyToOne(() => AffiliateCode)` on AffiliateCommission
- Add `@ManyToOne(() => Order)` and `@ManyToOne(() => OrderItem)` on AffiliateCommission

**Acceptance:**
- [ ] Migration runs clean
- [ ] Both entities registered in affiliates module
- [ ] `code` and `user_id` have UNIQUE constraints
- [ ] `order_item_id` has UNIQUE constraint on commissions (one per item)
- [ ] `orders.ref_code` added without breaking existing orders (nullable)
- [ ] `order_items.product_cost_eur` added (nullable, populated on new orders)

---

### P1-Task 2: Affiliates Module & Core Service

**What:** Create `AffiliatesModule` and `AffiliatesService` for enrollment, code management, and validation.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/affiliates/affiliates.module.ts` | Module registration |
| `apps/api/src/modules/affiliates/affiliates.service.ts` | Core: enroll, validate code, get stats, balance |

**Service API:**

```typescript
class AffiliatesService {
  // Enrollment
  enroll(userId: string, code: string, displayName?: string): Promise<AffiliateCode>
  
  // Code management
  validateCode(code: string): Promise<{ valid: boolean; displayName?: string; avatarUrl?: string }>
  getAffiliateByCode(code: string): Promise<AffiliateCode | null>
  getAffiliateByUserId(userId: string): Promise<AffiliateCode | null>
  
  // Stats
  getAffiliateStats(affiliateCodeId: string): Promise<AffiliateStatsDto>
  getReferredOrders(affiliateCodeId: string, page: number, limit: number): Promise<PaginatedResult<...>>
  
  // Click tracking
  trackClick(code: string, ip: string, userAgent: string): Promise<void>
  
  // Balance
  getBalance(affiliateCodeId: string): Promise<{ available: number; pending: number; total: number }>
  
  // Admin
  getAffiliatesList(query: AdminAffiliatesQueryDto): Promise<PaginatedResult<AffiliateCode>>
  suspendAffiliate(affiliateCodeId: string, reason: string, adminId: string): Promise<void>
  banAffiliate(affiliateCodeId: string, reason: string, adminId: string): Promise<void>
  reinstateAffiliate(affiliateCodeId: string, adminId: string): Promise<void>
}
```

**Code generation rules:**
- Code must be 3–20 alphanumeric characters (uppercase, no spaces)
- Validate uniqueness (case-insensitive)
- Reserved words list: BITLOOT, ADMIN, SUPPORT, HELP, CHECKOUT, etc.
- Rate limit enrollment: 3/hour per user

**Acceptance:**
- [ ] Enrollment creates code with auto-uppercase
- [ ] Code uniqueness enforced case-insensitively
- [ ] Reserved words rejected
- [ ] `validateCode` returns affiliate display info (for checkout UI)
- [ ] `trackClick` atomic increment + rate limit check
- [ ] Self-referral check in `validateCode` context

---

### P1-Task 3: Commission Service

**What:** Calculate per-item commission from margin with sliding scale and fallback chain.

**File:** `apps/api/src/modules/affiliates/affiliate-commission.service.ts`

**Commission calculation algorithm:**

```typescript
calculateCommission(
  affiliateCodeId: string,
  orderItem: OrderItem,
  product: Product,
  isNewBuyer: boolean
): Promise<AffiliateCommission>
```

```
1. Determine cost:
   a. If product.sourceType === 'kinguin': cost = kinguin_cost (from API / frozen on order)
   b. If product.sourceType === 'custom' AND product.adminCost exists: cost = adminCost
   c. Fallback: cost = sellingPrice * (1 - defaultMarginPct)   // admin-configured default margin %
   d. If no default configured: flat_commission = €0.50, skip margin calc

2. Calculate margin:
   margin = sellingPrice - cost   (sellingPrice is AFTER promo discount)
   If margin <= 0: commission = €0.50 (floor)

3. Determine commission rate (sliding scale):
   a. Count fulfilled referrals in rolling 30 days for this affiliate
   b. baseRate = 8%
   c. performanceBonus = MIN(count * 0.1, 4.0)   // +0.1% per referral, cap +4%
   d. effectiveRate = MIN(baseRate + performanceBonus, 12.0)   // 12% cap
   e. Check for commission_rate_override (Diamond): if set, use override

4. Calculate commission:
   commission = margin * effectiveRate / 100
   If commission < 0.50: commission = 0.50   // floor
   If isNewBuyer: commission += 0.50         // new-buyer bonus

5. Create AffiliateCommission record:
   - status: 'pending'
   - hold_until: NOW() + 48 hours
   - fraud_score: computed from fraud signals (see P1-Task 7)
   - margin_source: 'kinguin_api' | 'admin_cost' | 'default_pct' | 'flat_fallback'

6. Eagerly update affiliate_codes.balance:
   IF fraud_score < 50:   // auto-approve or monitor
     atomic SET balance = balance + commission_eur
     SET total_earned = total_earned + commission_eur
     SET total_referrals = total_referrals + 1
```

**Key rules:**
- Commission calculated per ORDER ITEM, not per order
- Cost frozen at fulfillment time on `affiliate_commissions.cost_eur`
- Commission calculated on margin AFTER promo code discount
- Credit-only orders (€0 crypto) still generate commission
- Underpaid orders: NO commission (order not fulfilled)

**Acceptance:**
- [ ] Sliding scale correctly adds +0.1% per 30-day referral
- [ ] €0.50 floor enforced
- [ ] 12% cap enforced
- [ ] New-buyer bonus of €0.50 applied
- [ ] Commission rate override works for Diamond affiliates
- [ ] Margin fallback chain: kinguin_api → admin_cost → default_pct → flat_fallback
- [ ] Cost frozen at calculation time (immutable)

---

### P1-Task 4: Click Tracking Redirect Controller

**What:** `GET /r/:code` endpoint for tracking clicks and redirecting.

**File:** `apps/api/src/modules/affiliates/affiliate-redirect.controller.ts`

**Endpoint:** `GET /r/:code`

**Query params:** `dest` (optional redirect target), `utm_source`, `utm_campaign`, `utm_medium`

**Flow:**

```
1. Validate code exists and affiliate is active
2. Rate limit: max 100 clicks/day per IP per code
3. Atomic increment: UPDATE affiliate_codes SET total_clicks = total_clicks + 1 WHERE code = :code
4. Set secure HttpOnly cookie: `bitloot_ref` = code, max-age 30 days, SameSite=Lax
5. Redirect (301) to:
   a. If `dest` provided: validate it's a relative path or bitloot.io URL → redirect
   b. Else: redirect to homepage
6. Pass through UTM params on redirect URL
```

**Security:**
- Validate `dest` is a relative path or same-origin URL (prevent open redirect)
- Rate-limit per IP per code (100/day)
- Do NOT leak affiliate data in redirect response

**Acceptance:**
- [ ] Click counter increments atomically
- [ ] Cookie set with 30-day expiry
- [ ] `dest` parameter validated against open redirect
- [ ] Rate limit prevents bot inflation
- [ ] Invalid/suspended codes return 404

---

### P1-Task 5: Affiliates User Controller

**What:** User-facing endpoints for enrollment, code management, and stats.

**File:** `apps/api/src/modules/affiliates/affiliates.controller.ts`

**Endpoints:**

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/affiliates/enroll` | JWT | Join Loot Squad, get code |
| `GET` | `/affiliates/me` | JWT | Get own affiliate info + stats |
| `GET` | `/affiliates/me/orders` | JWT | Paginated referred orders |
| `GET` | `/affiliates/me/commissions` | JWT | Paginated commission history |
| `POST` | `/affiliates/validate-code` | Public | Validate code at checkout (rate-limited) |

**DTOs:**

| DTO | Fields |
|-----|--------|
| `EnrollAffiliateDto` | `code: string (3-20 chars, alphanumeric), displayName?: string` |
| `ValidateCodeDto` | `code: string` |
| `AffiliateStatsDto` | `totalClicks, totalReferrals, totalEarned, currentBalance, conversionRate, referralsThisMonth` |
| `AffiliateCodeResponseDto` | `code, displayName, avatarUrl, status, totalClicks, totalReferrals, balance, createdAt` |

**Validation rate limits:**
- `POST /affiliates/enroll`: 3/hour per user
- `POST /affiliates/validate-code`: 10/min per IP

**Acceptance:**
- [ ] Enrollment creates affiliate code
- [ ] `validate-code` returns display info for checkout UI (name, avatar)
- [ ] Stats include conversion rate calculation
- [ ] Commission history shows per-item breakdown
- [ ] Rate limits enforced

---

### P1-Task 6: Admin Affiliates Controller

**What:** Admin endpoints for managing affiliates and configuring commission.

**File:** `apps/api/src/modules/affiliates/admin-affiliates.controller.ts`

**Endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/admin/affiliates` | Paginated list with search, filter (status, fraud score) |
| `GET` | `/admin/affiliates/:id` | Detail: stats, fraud flags, orders, commissions |
| `PATCH` | `/admin/affiliates/:id/suspend` | Suspend affiliate |
| `PATCH` | `/admin/affiliates/:id/ban` | Ban affiliate (forfeits earnings) |
| `PATCH` | `/admin/affiliates/:id/reinstate` | Reinstate suspended affiliate |
| `GET` | `/admin/affiliates/config` | Get commission config (rates, defaults, exclusions) |
| `PATCH` | `/admin/affiliates/config` | Update commission config |

**Admin config DTO:**

```typescript
{
  baseCommissionRate: number;      // default 8%
  maxCommissionRate: number;       // default 12%
  performanceBonusPerReferral: number;  // default 0.1%
  performanceBonusCap: number;     // default 4%
  commissionFloor: number;         // default 0.50
  newBuyerBonus: number;           // default 0.50
  defaultMarginPercent: number;    // default 40%
  excludedCategories: string[];    // categories with 0 commission
  holdPeriodHours: number;         // default 48
}
```

**Store commission config:** Use existing feature flags infrastructure or new `affiliate_config` key-value approach in the admin module.

**Acceptance:**
- [ ] All admin endpoints require JWT + Admin guard
- [ ] Affiliate list searchable by code, email, status
- [ ] Suspend/ban/reinstate with audit logging
- [ ] Commission config persisted and used by commission service
- [ ] Detail view shows fraud score breakdown

---

### P1-Task 7: Fraud Scoring Engine

**What:** Multi-signal fraud scoring for each commission.

**File:** `apps/api/src/modules/affiliates/affiliate-fraud.service.ts`

**Fraud signals and weights:**

| Signal | Weight |
|--------|--------|
| Same device fingerprint as buyer | +40 |
| Same IP as buyer | +30 |
| > 50% of referrals from single IP | +25 |
| Buyer refund rate > 40% on affiliate orders | +25 |
| Click-to-purchase < 5 seconds | +20 |
| All referrals are new accounts < 24h old | +20 |
| Multiple affiliate codes from same household | +20 |
| New buyer account created < 1h before order | +20 |
| Conversion rate > 30% (with > 20 clicks) | +15 |
| Multiple orders from same IP in 24h | +15 |
| Order total < €5 | +10 |

**Score thresholds:**

| Score | Action |
|-------|--------|
| 0–29 | **Auto-approve** |
| 30–49 | **Monitor** — flagged for weekly review |
| 50–69 | **Hold commission** — admin must review. 7-day auto-release if no action |
| 70–84 | **Block commission + alert admin** |
| 85–100 | **Auto-suspend affiliate** — freeze all pending commissions |

**Self-referral hard block (separate from scoring):**

```
At checkout, BEFORE order creation:
1. If ref_code provided AND user is authenticated:
   a. Look up affiliate_codes.user_id for the ref_code
   b. If affiliate.user_id === order.user_id → REJECT with error
   c. Also check: same email, same IP in last 24h
2. Log repeated self-referral attempts in audit
```

**Acceptance:**
- [ ] Fraud score computed per commission
- [ ] Score is immutable once assigned (never recalculated retroactively)
- [ ] Self-referral hard block at checkout (not just flagging)
- [ ] Score thresholds trigger correct actions (hold, block, suspend)
- [ ] Admin notified on scores >= 70

---

### P1-Task 8: BullMQ Commission Processor

**What:** Async job to process commission after order item fulfillment.

**File:** `apps/api/src/jobs/affiliate-commission.processor.ts`

**Job:** `affiliate.process-commission`

**Trigger:** After per-item fulfillment in `fulfillment.service.ts`

**Flow:**

```
1. Receive job: { orderId, orderItemId }
2. Fetch order → check ref_code exists
3. If no ref_code → skip (no attribution)
4. Fetch affiliate by code → verify active status
5. Fetch order item + product
6. Freeze product cost on order_items.product_cost_eur (if not already frozen)
7. Check is_new_buyer: is this the buyer's first fulfilled order?
8. Call commissionService.calculateCommission(...)
9. Compute fraud score
10. Based on fraud_score:
    - < 50: create commission with status 'pending', hold_until = NOW() + 48h (released by cron)
    - 50-69: create commission with status 'pending' (manual review, auto-released after 7 days if no admin action)
    - 70-84: create commission with status 'rejected'
    - 85+: create commission with status 'rejected' + suspend affiliate
11. Log to audit
```

**Integration with fulfillment:**

Modify `apps/api/src/modules/fulfillment/fulfillment.service.ts`:
After successful per-item fulfillment, enqueue:
```typescript
await this.affiliateCommissionQueue.add('process-commission', {
  orderId: order.id,
  orderItemId: item.id,
});
```

**Register queue:**
Add `affiliate` queue to `apps/api/src/jobs/queues.ts`

**Acceptance:**
- [ ] Commission job enqueued per fulfilled order item (not per order)
- [ ] Only processes orders with `ref_code`
- [ ] Cost frozen at fulfillment time
- [ ] Fraud score computed and stored
- [ ] High-fraud-score commissions auto-rejected
- [ ] Idempotent — same orderItemId doesn't create duplicate commission

---

### P1-Task 8b: Commission Release Cron Job

**What:** Hourly cron job to transition commissions from `pending` → `available` after hold period expires.

**File:** `apps/api/src/jobs/affiliate-release.processor.ts`

**Job:** `affiliate.release-commissions`

**Trigger:** Cron (hourly)

**Flow:**

```
1. Find all commissions WHERE status = 'pending' AND hold_until < NOW() AND fraud_score < 50
2. Set status = 'available' for each
3. Find all commissions WHERE status = 'pending' AND fraud_score BETWEEN 50 AND 69
   AND created_at < NOW() - INTERVAL '7 days' (auto-release after 7 days with no admin action)
4. Set status = 'available' for each
5. Log count of released commissions
```

**Acceptance:**
- [ ] Low-fraud commissions released after 48h hold automatically
- [ ] Medium-fraud commissions auto-released after 7 days if not admin-reviewed
- [ ] High-fraud commissions (≥70) never auto-released
- [ ] Job is idempotent — re-running doesn't duplicate status changes

---

### P1-Task 9: Checkout Attribution (Backend)

**What:** Store affiliate attribution on orders at checkout.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/api/src/modules/orders/orders.service.ts` | Read `refCode` from DTO, validate, store on order |
| `apps/api/src/modules/orders/dto/create-order.dto.ts` | Add `refCode?: string` field |

**Flow in `createOrder()`:**

```
1. If dto.refCode provided:
   a. Validate code exists and affiliate is active
   b. Self-referral check (if user authenticated): reject if affiliate.userId === userId
   c. Store ref_code on order entity
2. If dto.refCode NOT provided:
   a. Frontend may pass refCode from cookie/localStorage (see frontend task)
   b. Same validation applies
```

**Acceptance:**
- [ ] `ref_code` stored on order
- [ ] Self-referral rejected with clear error message
- [ ] Invalid/suspended codes silently ignored (don't block checkout)
- [ ] Guest checkout supports attribution (ref_code on order, no user check)

---

### P1-Task 10: Checkout Attribution (Frontend)

**What:** "Support a creator" code field at checkout + cookie/localStorage attribution.

**Files to modify:**

| File | Change |
|------|--------|
| `apps/web/src/features/checkout/CheckoutForm.tsx` | Add creator code field |

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/features/checkout/CreatorCodeInput.tsx` | "Support a creator?" input with validation |
| `apps/web/src/hooks/useAffiliateAttribution.ts` | Hook: read/write cookie + localStorage attribution |

**UX:**

```
┌─────────────────────────────────────────────────────┐
│  🎮 Support a Creator                              │
│  ┌─────────────────────────────────┐                │
│  │ NINJALOOT                       │  ✓ Valid      │
│  └─────────────────────────────────┘                │
│  You're supporting NINJA (change)                   │
│  ℹ️ The creator earns a commission at no cost to you│
└─────────────────────────────────────────────────────┘
```

- Always visible at checkout (regardless of cookie state)
- Pre-filled from cookie/localStorage if attribution exists
- Editable — user can change or clear the code
- Validates via SDK `AffiliatesApi.validateCode()` with debounce (500ms)
- Shows creator name + avatar on valid code
- FTC disclosure text below field

**Attribution hook (`useAffiliateAttribution`):**
- On page load: check URL `?r=CODE` param
- If found: store in localStorage `bitloot_ref` + try to set cookie (redundancy)
- On checkout: read from localStorage, pass as `refCode` in CreateOrderDto
- Checkout code field takes priority over stored attribution

**Acceptance:**
- [ ] Code field always visible at checkout
- [ ] Pre-filled from stored attribution
- [ ] Editable (user can change/clear)
- [ ] Debounced validation with loading state
- [ ] FTC disclosure text shown
- [ ] Checkout code field overrides stored attribution

---

### P1-Task 11: Affiliate Dashboard (Profile Tab — Frontend)

**What:** Add "Loot Squad" tab to user profile with stats.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/features/account/LootSquadTab.tsx` | Main Loot Squad dashboard |
| `apps/web/src/features/account/AffiliateStatsCards.tsx` | Balance, clicks, orders, conversion |
| `apps/web/src/features/account/ReferredOrdersTable.tsx` | List of referred orders |
| `apps/web/src/features/account/AffiliateLinkCopy.tsx` | Copyable links with UTM builder |

**Files to modify:**

| File | Change |
|------|--------|
| `apps/web/src/app/(dashboard)/profile/page.tsx` | Add "Loot Squad" tab (or "Join Loot Squad" CTA if not enrolled) |

**Dashboard sections:**

1. **Enrollment CTA** (if not enrolled): "Join the Loot Squad — share BitLoot, earn crypto" + enroll button
2. **Overview cards** (if enrolled): Current balance, total earned, total orders, conversion rate
3. **Click & conversion chart:** Clicks vs orders over time (line chart, last 30 days)
4. **Referred orders table:** Paginated, sortable, shows status + commission per item
5. **Links & code section:**
   - Copyable affiliate link: `https://bitloot.io?r=CODE`
   - Copyable product-specific link generator
   - UTM builder: select source (YouTube, Twitch, Discord, X, Other) → generates tracked link
   - QR code for streaming
6. **Payout settings** (Phase 2 CTA): "Coming soon — earned commissions will be paid in USDT"

**Data hooks:**
- `useAffiliateMe()` → `AffiliatesApi.getMe()`
- `useAffiliateStats()` → `AffiliatesApi.getStats()`
- `useReferredOrders(page)` → `AffiliatesApi.getOrders()`
- `useCommissions(page)` → `AffiliatesApi.getCommissions()`

**Acceptance:**
- [ ] Non-enrolled users see enrollment CTA
- [ ] Enrolled users see full dashboard
- [ ] Stats cards show accurate data
- [ ] Links are copyable with feedback
- [ ] UTM builder generates valid tracked links
- [ ] Referred orders table paginated

---

### P1-Task 12: Admin Affiliate Management (Frontend)

**What:** Admin page for managing affiliates.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/app/admin/loot-squad/page.tsx` | Affiliate list page |
| `apps/web/src/app/admin/loot-squad/[id]/page.tsx` | Affiliate detail page |
| `apps/web/src/app/admin/loot-squad/config/page.tsx` | Commission config page |

**Pages:**

1. **Affiliate list** (`/admin/loot-squad`):
   - Table: code, display name, status, total clicks, total orders, total earned, fraud score
   - Search by code or email
   - Filter by status (active, suspended, banned)
   - Sort by earned, clicks, fraud score

2. **Affiliate detail** (`/admin/loot-squad/[id]`):
   - Header: avatar, display name, code, status badge
   - Stats cards: balance, earned, referrals, clicks, conversion rate
   - Action buttons: Suspend / Ban / Reinstate
   - Tabs:
     - **Commissions:** Paginated commission table with fraud scores
     - **Orders:** Referred orders with status
     - **Activity:** Audit trail of admin actions
   - Fraud indicators: visual fraud score gauge, flagged signals

3. **Config page** (`/admin/loot-squad/config`):
   - Editable fields for all commission parameters
   - Excluded categories multi-select
   - Save + audit log

**Admin nav:** Add "Loot Squad" section to admin sidebar.

**Acceptance:**
- [ ] Affiliate list searchable and filterable
- [ ] Detail page shows complete affiliate overview
- [ ] Suspend/ban/reinstate with confirmation modal + reason field
- [ ] Config page saves and applies to new commissions
- [ ] All admin actions audit-logged

---

### P1-Task 13: Email Notifications

**What:** Affiliate-related email templates.

**Add to `emails.service.ts`:**

| Template | Subject | When |
|----------|---------|------|
| `sendAffiliateWelcome` | "Welcome to the Loot Squad!" | After enrollment |
| `sendCommissionEarned` | "You earned €X from a referred sale" | After commission approved |
| `sendAffiliateWarning` | "Important: Your Loot Squad account" | Fraud flag at score 70+ |
| `sendAffiliateSuspended` | "Your Loot Squad membership is suspended" | Admin suspends |

**Acceptance:**
- [ ] Welcome email sent on enrollment
- [ ] Commission notification with amount and order reference
- [ ] Suspension email with appeal instructions

---

### P1-Task 14: SDK Regeneration & Tests

**SDK:** Run `npm run sdk:dev` → verify `AffiliatesApi` and `AdminAffiliatesApi`.

**Unit tests (`affiliate-commission.service.spec.ts`):**

| Test | Verifies |
|------|----------|
| Sliding scale at 0 referrals → 8% | Base rate |
| Sliding scale at 20 referrals → 10% | +2% bonus |
| Sliding scale at 50 referrals → 12% (capped) | Cap enforcement |
| €0.50 floor on low-margin item | Floor |
| New-buyer bonus adds €0.50 | Bonus |
| Diamond override ignores sliding scale | Override |
| Margin fallback chain (all 4 levels) | Fallback |
| Self-referral rejection | Hard block |
| Fraud score computation with multiple signals | Scoring |

**Integration tests:**

| Test | Verifies |
|------|----------|
| `POST /affiliates/enroll` creates code | Enrollment |
| `POST /affiliates/validate-code` returns info | Validation |
| `GET /r/:code` redirects and increments clicks | Click tracking |
| Order with `refCode` stores attribution | Attribution |
| Commission created after fulfillment job | End-to-end |
| Self-referral blocked at checkout | Security |

**Acceptance:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] SDK includes both client classes
- [ ] `npm run quality:full` passes

---

## Phase 2: Payouts & Ledger

> **Prerequisite:** Phase 1 complete and validated with 10–20 test creators.

### P2-Task 1: Payout & Transaction Entities

**What:** Create `affiliate_payouts`, `affiliate_payout_batches`, `affiliate_transactions`, and `affiliate_code_history` tables.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/affiliates/entities/affiliate-payout.entity.ts` | Payout records |
| `apps/api/src/modules/affiliates/entities/affiliate-payout-batch.entity.ts` | Batch grouping |
| `apps/api/src/modules/affiliates/entities/affiliate-transaction.entity.ts` | Full ledger |
| `apps/api/src/modules/affiliates/entities/affiliate-code-history.entity.ts` | Code rotation |
| `apps/api/src/database/migrations/{timestamp}-CreateAffiliatePayout.ts` | Migration |

**`affiliate_transactions` schema:**

```
id                    UUID PK
affiliate_code_id     UUID FK → affiliate_codes
type                  VARCHAR(20)         -- commission | bonus | credit_conversion | payout | adjustment | commission_reversal
amount                DECIMAL(20,8)       -- positive = credit, negative = debit (EUR)
balance_after         DECIMAL(20,8)       -- running balance snapshot
reference_id          UUID                -- order_id, payout_id, etc.
description           TEXT
created_at            TIMESTAMPTZ DEFAULT NOW()

INDEX: (affiliate_code_id, created_at DESC)
```

**`affiliate_payouts` schema:**

```
id                    UUID PK
affiliate_code_id     UUID FK → affiliate_codes
batch_id              UUID FK → affiliate_payout_batches (nullable)
amount_eur            DECIMAL(20,8)
conversion_rate       DECIMAL(12,6)       -- EUR→stablecoin rate
amount_stablecoin     DECIMAL(20,8)
payout_currency       VARCHAR(10)
wallet_address        VARCHAR(100)
wallet_network        VARCHAR(20)
provider              VARCHAR(20) DEFAULT 'manual'
tx_hash               VARCHAR(200)
fee_eur               DECIMAL(20,8)
status                VARCHAR(20)         -- pending | processing | completed | failed
created_at            TIMESTAMPTZ
paid_at               TIMESTAMPTZ

INDEX: (affiliate_code_id, status)
INDEX: (batch_id)
INDEX: (status)
```

**`affiliate_payout_batches` schema:**

```
id                    UUID PK
total_amount_eur      DECIMAL(20,8)
conversion_rate       DECIMAL(12,6)
rate_source           VARCHAR(50)         -- coingecko | manual
rate_captured_at      TIMESTAMPTZ
total_recipients      INT
status                VARCHAR(20)         -- draft | approved | processing | completed | partial | failed
approved_by           UUID FK → users
approved_at           TIMESTAMPTZ
created_at            TIMESTAMPTZ

INDEX: (status)
```

**`affiliate_code_history` schema:**

```
id                    UUID PK
affiliate_code_id     UUID FK → affiliate_codes
old_code              VARCHAR(20) NOT NULL
changed_at            TIMESTAMPTZ DEFAULT NOW()
expires_at            TIMESTAMPTZ         -- 90 days after change

INDEX: (old_code)
```

**Acceptance:**
- [ ] Migration runs clean
- [ ] All entities registered
- [ ] Transaction ledger supports all operation types
- [ ] Payout batch tracks conversion rate and admin approval

---

### P2-Task 2: Payout Service

**What:** Service for payout request, batch management, and manual processing.

**File:** `apps/api/src/modules/affiliates/affiliate-payout.service.ts`

**Methods:**

```typescript
class AffiliatePayoutService {
  requestPayout(affiliateCodeId: string): Promise<AffiliatePayout>
  createBatch(payoutIds: string[], conversionRate: number, rateSource: string): Promise<AffiliatePayoutBatch>
  approveBatch(batchId: string, adminId: string): Promise<void>
  markPaid(payoutId: string, txHash: string, adminId: string): Promise<void>
  getPayoutHistory(affiliateCodeId: string, page: number): Promise<PaginatedResult<AffiliatePayout>>
}
```

**Payout request rules:**
- Balance must be >= €15
- Wallet address must be set and valid BEP20 format
- Only one pending payout at a time per affiliate

**Manual payout flow:**
1. Affiliate requests payout → `status: 'pending'`
2. Admin creates batch → groups pending payouts
3. Admin approves batch → `status: 'approved'`
4. Admin sends USDT manually from BitLoot wallet
5. Admin enters tx hash → `status: 'completed'`
6. System sends confirmation email with BSCScan link

**Commission reversal on refund:**
- Find commission linked to refunded order item
- Create reversal transaction (negative amount)
- Deduct from affiliate balance
- If already paid out: negative balance carried to next batch

**Acceptance:**
- [ ] €15 minimum enforced
- [ ] Wallet address validated
- [ ] Batch creation groups payouts
- [ ] Admin approval required before marking paid
- [ ] Tx hash recorded for audit
- [ ] Commission reversal works for refunded items

---

### P2-Task 3: Wallet Verification

**What:** Wallet address management with security controls.

**Add to `affiliates.service.ts`:**

```typescript
setWalletAddress(affiliateCodeId: string, address: string, ip: string): Promise<void>
```

**Rules:**
- BEP20 validation: starts with `0x`, exactly 42 chars, valid hex
- Wallet change triggers 72-hour cooling period (no payouts during)
- Record `last_wallet_change_ip` and `last_wallet_change_at`
- Send security email on wallet change: "Your payout wallet was changed. If this wasn't you, contact support."

**Acceptance:**
- [ ] BEP20 address format validated
- [ ] 72-hour cooling period on wallet change
- [ ] IP recorded on change
- [ ] Security notification email sent

---

### P2-Task 4: Code Rotation

**What:** Allow affiliates to change their code, with old-code redirect.

**Add to `affiliates.service.ts`:**

```typescript
changeCode(affiliateCodeId: string, newCode: string): Promise<void>
```

**Flow:**
1. Validate new code (same rules as enrollment)
2. Store old code in `affiliate_code_history` with 90-day expiry
3. Update `affiliate_codes.code` to new code
4. `/r/:code` redirect checks `affiliate_code_history` if code not found in active codes → 301 to current

**Acceptance:**
- [ ] Old code stored in history
- [ ] Old code redirects to current code
- [ ] History entries expire after 90 days
- [ ] New code validated for uniqueness

---

### P2-Task 5: Earnings → Credits Conversion

**What:** Allow creators to convert affiliate earnings to promo credits (one-way, irreversible).

> **Requires Credits module V1 to be deployed.**

**Add endpoint to `affiliates.controller.ts`:**

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/affiliates/me/convert-to-credits` | Convert earnings → promo credits |

**DTO:** `ConvertToCreditsDto { amount: number }` (min €1)

**Flow:**

```
1. Validate amount >= €1 AND amount <= available balance (excluding pending/held)
2. Deduct from affiliate earnings balance (atomic)
3. Create affiliate_transaction (type: 'credit_conversion', negative amount)
4. Call creditsService.grantPromoCredits(userId, amount, 'affiliate_conversion', affiliateId)
5. Send confirmation email
```

**CRITICAL:** One-way only. There is NO credits → earnings endpoint. Never build one. See BitLoot-Credits.md §4.3 for exploit scenario.

**Frontend:** Add "Convert to Credits" button in Loot Squad dashboard with confirmation modal:
> "This is one-way. You will NOT be able to withdraw this amount as stablecoin. Credits expire in 90 days."

**Acceptance:**
- [ ] €1 minimum enforced
- [ ] Balance deducted atomically
- [ ] Promo credits created with 90-day expiry
- [ ] Confirmation modal with explicit warning
- [ ] No reverse conversion endpoint exists

---

### P2-Task 6: Admin Payouts Page (Frontend)

**What:** Admin page for managing payout batches.

**File:** `apps/web/src/app/admin/loot-squad/payouts/page.tsx`

**Features:**
- **Pending payouts list:** All affiliates with pending payout requests
- **Create batch:** Select payouts → enter conversion rate (EUR→USDT) → create draft
- **Approve batch:** Review batch details → approve (audit logged)
- **Mark paid:** Enter tx hash → mark individual payout as completed
- **Batch history:** Past batches with total paid, rate used, admin who approved
- **CSV export:** Export payout details for accounting

**Acceptance:**
- [ ] Shows all pending requests
- [ ] Batch creation with conversion rate
- [ ] Admin approval flow
- [ ] Tx hash entry with validation
- [ ] CSV export works

---

### P2-Task 7: Payout Email Notifications

**Add to `emails.service.ts`:**

| Template | Subject | When |
|----------|---------|------|
| `sendPayoutRequested` | "Payout request received" | Affiliate requests payout |
| `sendPayoutSent` | "€X sent to your wallet" | Admin marks paid (includes tx hash + BSCScan link) |
| `sendPayoutFailed` | "Payout processing issue" | Payout fails |
| `sendWalletChanged` | "Your payout wallet was changed" | Security alert on wallet change |
| `sendEarningsConverted` | "€X converted to BitLoot Credits" | Earnings → credits conversion |

**Acceptance:**
- [ ] All templates implemented
- [ ] BSCScan link included in payout confirmation
- [ ] Wallet change email sent as security alert

---

### P2-Task 8: Phase 2 Tests

**Unit tests:**

| Test | Verifies |
|------|----------|
| Payout request with balance < €15 rejected | Minimum threshold |
| Payout request without wallet rejected | Wallet required |
| Batch creation with valid conversion rate | Batch flow |
| Commission reversal on refund | Reversal math |
| Wallet change triggers cooling period | Security |
| Earnings → credits conversion (one-way) | Conversion flow |

**Integration tests:**

| Test | Verifies |
|------|----------|
| Full payout flow: request → batch → approve → mark paid | E2E payout |
| `/r/:oldcode` redirects to current code | Code rotation |
| Conversion creates promo credits | Credits integration |

---

## Phase 3: Gamification & Community

> **Prerequisite:** Phase 1–2 complete. Credits V1 deployed (for quest rewards).

### P3-Task 1: Quest Entities & Migration

**What:** Create `affiliate_quests`, `affiliate_quest_templates`, and `affiliate_quest_progress` tables.

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/api/src/modules/affiliates/entities/affiliate-quest.entity.ts` | Quest instances |
| `apps/api/src/modules/affiliates/entities/affiliate-quest-template.entity.ts` | Reusable templates |
| `apps/api/src/modules/affiliates/entities/affiliate-quest-progress.entity.ts` | Per-affiliate progress |
| `apps/api/src/database/migrations/{timestamp}-CreateAffiliateQuests.ts` | Migration |

**`affiliate_quests` schema:**

```
id              UUID PK
template_id     UUID FK → affiliate_quest_templates (nullable for manual)
title           VARCHAR(100)
description     TEXT
quest_type      VARCHAR(20)         -- daily | weekly | event
goal_type       VARCHAR(30)         -- referral_count | referral_revenue | new_buyers | clicks
goal_value      INT
reward_type     VARCHAR(20)         -- xp | commission_boost | credit
reward_value    DECIMAL(10,2)
starts_at       TIMESTAMPTZ
ends_at         TIMESTAMPTZ
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

**`affiliate_quest_templates` schema:**

```
id              UUID PK
title_template  VARCHAR(100)        -- e.g. "Refer {goal_value} new buyers"
quest_type      VARCHAR(20)         -- daily | weekly
goal_type       VARCHAR(30)
goal_value_min  INT                 -- random range
goal_value_max  INT
reward_type     VARCHAR(20)
reward_value    DECIMAL(10,2)
rotation_weight INT DEFAULT 1       -- higher = more likely picked
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

**`affiliate_quest_progress` schema:**

```
id              UUID PK
quest_id        UUID FK → affiliate_quests
affiliate_code_id UUID FK → affiliate_codes
current_value   INT DEFAULT 0
completed       BOOLEAN DEFAULT false
rewarded        BOOLEAN DEFAULT false
reward_choice   VARCHAR(20)         -- xp | commission_boost | credit
completed_at    TIMESTAMPTZ
UNIQUE(quest_id, affiliate_code_id)
```

**Acceptance:**
- [ ] Migration runs clean
- [ ] Unique constraint on (quest_id, affiliate_code_id) prevents double-tracking

---

### P3-Task 2: Quest Service & Rotation

**File:** `apps/api/src/modules/affiliates/affiliate-quest.service.ts`

**Methods:**

```typescript
class AffiliateQuestService {
  getActiveQuests(): Promise<AffiliateQuest[]>
  getAffiliateProgress(affiliateCodeId: string): Promise<AffiliateQuestProgress[]>
  evaluateProgress(affiliateCodeId: string, eventType: string, eventData: any): Promise<void>
  completeQuest(progressId: string, rewardChoice?: string): Promise<void>
  rotateQuests(): Promise<void>  // cron job
}
```

**Rotation cron (`affiliate.rotate-quests`, `0 0 * * *`):**
- Daily at midnight UTC: create new daily quest instances from active daily templates (weighted random)
- Weekly (Mondays): create new weekly quest instances from active weekly templates
- Event quests: admin-created with explicit dates

**Quest evaluation (`affiliate.evaluate-quests`):**
- Triggered when a commission is created
- Check all active quests for the affiliate
- Increment progress counters
- Quest completion is STICKY — refunds do NOT reverse progress

**Reward distribution on quest completion:**
- If reward_type === 'credit': call `creditsService.grantPromoCredits()` with `source: 'quest_reward'`
- If reward_type === 'xp': update affiliate XP (see P3-Task 3)
- If reward_type === 'commission_boost': create temporary rate override (48h)

**Acceptance:**
- [ ] Daily quests auto-rotate at midnight
- [ ] Weekly quests auto-rotate on Mondays
- [ ] Progress is sticky (not reversed on refund)
- [ ] Credit rewards flow through CreditsService
- [ ] Quest completion is idempotent

---

### P3-Task 3: XP, Levels & Badges

**What:** Track XP, compute levels, award badges.

**Add columns to `affiliate_codes`:**

```
xp              INT DEFAULT 0
level           SMALLINT DEFAULT 1
badges          JSONB DEFAULT '[]'      -- array of badge identifiers
```

**XP sources:**

| Action | XP |
|--------|-----|
| Fulfilled referred order | +25 |
| New customer acquired | +50 |
| Revenue milestone: €500 | +100 |
| Revenue milestone: €2,000 | +250 |
| Revenue milestone: €10,000 | +500 |
| Quest completion (daily) | +10 |
| Quest completion (weekly) | +30 |

**Level table (10 levels, lifetime, never resets):**

| Level | Cumulative XP | Unlock |
|-------|---------------|--------|
| 1 | 0 | Base access |
| 2 | 100 | "Rookie" badge |
| 3 | 300 | Vanity code slot |
| 4 | 600 | Early access to deals |
| 5 | 1,100 | Custom border flair |
| 6 | 1,800 | Featured on leaderboard |
| 7 | 2,800 | Priority support |
| 8 | 4,300 | Custom landing page |
| 9 | 6,300 | Exclusive product access |
| 10 | 9,300 | "Legend" badge |

**Badges:**
- "First Blood" — first referred sale
- "Squad Leader" — 5+ distinct new buyers in a week
- "Boss Killer" — single order > €100

**Acceptance:**
- [ ] XP granted on correct events
- [ ] Level calculated from cumulative XP
- [ ] Badges awarded on trigger conditions
- [ ] Level-up email notification
- [ ] XP never resets (lifetime)

---

### P3-Task 4: Seasonal Leaderboard

**What:** Monthly leaderboard ranking by seasonal points.

**New table:**

```
affiliate_seasonal_points
  id              UUID PK
  affiliate_code_id UUID FK → affiliate_codes
  season_key      VARCHAR(7)          -- e.g. '2026-04' (YYYY-MM)
  points          INT DEFAULT 0       -- referral_count + revenue_based_points
  rank            INT
  UNIQUE(affiliate_code_id, season_key)
```

**Public page:** `/loot-squad/leaderboard`
- Top 50 affiliates by seasonal points
- Show: rank, display name, avatar, level, badge count
- Never show earnings/money (privacy)
- Allow opt-out from public ranking

**Cron job:** `affiliate.update-leaderboard` — recalculate rankings periodically

---

### P3-Task 5: Public Creator Profiles

**What:** `/loot-squad/@[username]` public profile page.

**Features:**
- Display name, avatar, level, XP progress bar
- Badges earned
- Leaderboard rank (current season)
- Social links
- "Support this creator" button (copies code)
- "Use code CODE at checkout" CTA

**Privacy:** Never show earnings, wallet, orders, or personal data.

---

### P3-Task 6: Buyer Referral Program

**What:** Separate from Loot Squad — any buyer can share a referral link for credit rewards.

**Mechanics:**
- Referrer gets €2 promo credits when friend completes first purchase
- Friend gets €2 promo credits on first order
- Max 10 rewarded referrals per user per month
- Reuses Loot Squad attribution infrastructure

**New endpoint:** `POST /referrals/claim` (triggered after friend's first order)

**Integration with Credits module:**
- Call `creditsService.grantPromoCredits(referrerId, 2, 'referral', orderId)`
- Call `creditsService.grantPromoCredits(friendId, 2, 'referral', orderId)`

---

### P3-Task 7: Milestone Rewards (Pick Your Reward)

**What:** At milestones (every 5 completed referrals), affiliate picks from 3 options.

**Options per milestone:**

| Option A | Option B | Option C |
|----------|----------|----------|
| +50 XP | +1% commission for 48h | €2 promo credits |

**Deterministic — no randomization, no loot boxes, no paid rerolls.**

---

### P3-Task 8: Admin Quest Management (Frontend)

**File:** `apps/web/src/app/admin/loot-squad/challenges/page.tsx`

**Features:**
- CRUD for quest templates
- Set rotation type (daily/weekly), goal type, reward
- Create manual event quests with start/end dates
- View active quests and participation stats

---

## Phase 4: Events & Analytics

> **Prerequisite:** Phase 3 complete. Ship incrementally.

### P4-Task 1: Advanced Analytics Dashboard

**What:** Channel attribution (UTM), creator ROI, product-level affiliate performance.

**Metrics:**
- Revenue per creator
- Revenue per channel (YouTube vs Twitch vs Discord)
- Product-level referral performance
- Click-to-order conversion by source
- Cost efficiency: commission cost vs revenue generated per creator

### P4-Task 2: Creator Storefronts

**What:** Creators curate a public page of recommended products.

**Route:** `/loot-squad/@[username]/picks`

### P4-Task 3: Event Quests

**What:** Admin-created quests tied to flash deals, seasonal campaigns.

**Example:** "Refer 5 sales of [Game X] this week → earn €10 in promo credits"

---

## Cross-Cutting Concerns

### Security Checklist

- [ ] Self-referral hard block at checkout (server-side, not client-side)
- [ ] Fraud scoring on every commission (immutable once assigned)
- [ ] Wallet changes trigger 72h cooling + email alert
- [ ] Click tracking rate-limited (100/day per IP per code)
- [ ] Code validation rate-limited (10/min per IP)
- [ ] Enrollment rate-limited (3/hour per user)
- [ ] Open redirect prevention on `/r/:code?dest=`
- [ ] Affiliate code never exposed in API responses to other users
- [ ] Earnings cannot be converted back to credits (one-way only)
- [ ] Admin suspension freezes all balances + invalidates code

### Performance Checklist

- [ ] Click tracking uses atomic `UPDATE` (no SELECT+UPDATE race)
- [ ] Balance updated eagerly on `affiliate_codes` (no SUM on read)
- [ ] Commission queries indexed on `(affiliate_code_id, status)`
- [ ] Leaderboard cached (recalculated periodically, not per-request)
- [ ] Loot Squad dashboard lazy-loaded
- [ ] Stats charts use `staleTime: 5 * 60 * 1000`

---

## File Inventory (Complete)

### Backend — New Files

```
apps/api/src/modules/affiliates/
├── affiliates.module.ts
├── affiliates.service.ts
├── affiliate-commission.service.ts
├── affiliate-fraud.service.ts
├── affiliate-payout.service.ts          (Phase 2)
├── affiliate-quest.service.ts           (Phase 3)
├── affiliates.controller.ts
├── affiliate-redirect.controller.ts
├── admin-affiliates.controller.ts
├── entities/
│   ├── affiliate-code.entity.ts
│   ├── affiliate-commission.entity.ts
│   ├── affiliate-code-history.entity.ts      (Phase 2)
│   ├── affiliate-payout.entity.ts            (Phase 2)
│   ├── affiliate-payout-batch.entity.ts      (Phase 2)
│   ├── affiliate-transaction.entity.ts       (Phase 2)
│   ├── affiliate-quest.entity.ts             (Phase 3)
│   ├── affiliate-quest-template.entity.ts    (Phase 3)
│   └── affiliate-quest-progress.entity.ts    (Phase 3)
└── dto/
    ├── enroll-affiliate.dto.ts
    ├── validate-code.dto.ts
    ├── affiliate-stats.dto.ts
    ├── affiliate-code-response.dto.ts
    ├── admin-affiliates-query.dto.ts
    ├── admin-affiliate-config.dto.ts
    ├── convert-to-credits.dto.ts             (Phase 2)
    └── create-quest-template.dto.ts          (Phase 3)

apps/api/src/jobs/
├── affiliate-commission.processor.ts
├── affiliate-release.processor.ts            (Phase 1 — hourly cron for pending→available)
├── affiliate-quest-rotation.processor.ts     (Phase 3)
└── affiliate-leaderboard.processor.ts        (Phase 3)

apps/api/src/database/migrations/
├── {timestamp}-CreateAffiliateSchema.ts
├── {timestamp}-CreateAffiliatePayout.ts       (Phase 2)
└── {timestamp}-CreateAffiliateQuests.ts       (Phase 3)
```

### Backend — Modified Files

```
apps/api/src/modules/orders/orders.service.ts              (attribution)
apps/api/src/modules/orders/dto/create-order.dto.ts        (refCode field)
apps/api/src/modules/fulfillment/fulfillment.service.ts    (enqueue commission job)
apps/api/src/modules/emails/emails.service.ts              (affiliate emails)
apps/api/src/jobs/queues.ts                                (register affiliate queue)
apps/api/src/app.module.ts                                 (import AffiliatesModule)
```

### Frontend — New Files

```
apps/web/src/features/checkout/CreatorCodeInput.tsx
apps/web/src/features/account/LootSquadTab.tsx
apps/web/src/features/account/AffiliateStatsCards.tsx
apps/web/src/features/account/ReferredOrdersTable.tsx
apps/web/src/features/account/AffiliateLinkCopy.tsx
apps/web/src/hooks/useAffiliateAttribution.ts
apps/web/src/app/admin/loot-squad/page.tsx
apps/web/src/app/admin/loot-squad/[id]/page.tsx
apps/web/src/app/admin/loot-squad/config/page.tsx
apps/web/src/app/admin/loot-squad/payouts/page.tsx          (Phase 2)
apps/web/src/app/admin/loot-squad/challenges/page.tsx       (Phase 3)
apps/web/src/app/(marketing)/loot-squad/leaderboard/page.tsx  (Phase 3)
apps/web/src/app/(marketing)/loot-squad/[username]/page.tsx   (Phase 3)
```

### Frontend — Modified Files

```
apps/web/src/features/checkout/CheckoutForm.tsx             (creator code field)
apps/web/src/app/(dashboard)/profile/page.tsx               (Loot Squad tab)
apps/web/src/app/admin/AdminLayoutClient.tsx                (sidebar links)
```
