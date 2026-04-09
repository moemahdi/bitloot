# Loot Squad — BitLoot Creator & Referral System

> **One-liner:** A Support-A-Creator system for BitLoot — users share referral codes, earn EUR-denominated commissions on fulfilled orders, and get paid in stablecoin. Gamification and credits are planned as independent follow-on features with their own timelines.

---

## Scope Boundaries

> **This document covers 4 independent systems** that integrate but ship separately. Each has its own timeline and can be built without the others.
>
> | System | Document | Ships in | Depends on |
> |--------|----------|----------|------------|
> | **Loot Squad (affiliate/referral)** | This doc, §1–13 | Phase 1–2 | Nothing |
> | **Gamification engine** (XP, levels, quests) | This doc, §5 | Phase 3 | Loot Squad |
> | **BitLoot Credits** (closed-loop balance) | Separate doc: `BitLoot-Credits.md` | Independent | Nothing |
> | **Revenue streams** (monetization beyond product sales) | Separate doc: `RevenueStreams.md` | Independent | Credits + Loot Squad |
>
> **Phase 1 is a pure Support-A-Creator MVP.** No XP, no quests, no credits, no leaderboards. Ship in 2–3 weeks, validate demand, then layer gamification.

---

## 1. Goals & Success Metrics

**Business goals (Phase 1 only):**

- Increase orders and revenue driven by creators and user referrals.
- Acquire new customers at a predictable, capped cost (commission tied to margin, not GMV).
- Build BitLoot's brand in gaming communities (Discord, Twitch, YouTube, TikTok, X) by making "Loot Squad member" a badge of honor — inspired by Epic's Support-A-Creator model.

**KPIs:**

| Metric | What it measures |
|--------|-----------------|
| % of orders with Loot Squad attribution | Adoption |
| New customers per member per month | Acquisition power |
| Affiliate-driven conversion rate vs organic | Quality of traffic |
| Click-to-order conversion rate per affiliate | Traffic quality |
| Net revenue minus commission cost | Profitability |
| Repeat purchase rate of affiliate-acquired users | Retention |

---

## 2. Target Segments

Loot Squad (creator commissions) and Buyer Referrals are **two separate programs** sharing attribution infrastructure but with different mechanics:

### Loot Squad — Creator & Community Program

| Segment | Description | Example use |
|---------|-------------|-------------|
| **Creators & streamers** | Twitch, YouTube, Kick, TikTok, Discord owners | Link in video description / stream panel / bot command |
| **Community admins** | Discord & Telegram server owners | `!bitloot` bot command drops a tracked link |

Creators earn commission on referred sales. Earnings accumulate in a separate payout balance — creators request stablecoin payouts (€15 min, monthly) or optionally convert to BitLoot credits for instant spending.

### Buyer Referral Program (Separate, Simpler System)

| Mechanic | Detail |
|----------|--------|
| **Trigger** | Any buyer shares a personal referral link after purchase |
| **Buyer reward** | €2 in promo credits when their friend completes a first purchase |
| **Friend reward** | €2 in promo credits on first order (applied at checkout) |
| **Limit** | Max 10 rewarded referrals per user per month |
| **Implementation** | Reuses Loot Squad attribution tracking but separate reward logic — no tiers, no commission, no payouts |

> **Phase 1 ships Loot Squad only.** Buyer Referral Program ships as a standalone feature in Phase 3+.

---

## 3. Why "Loot Squad" (Not "Affiliate Program")

"Affiliate" sounds transactional. **Loot Squad** positions BitLoot as a gamified platform where users earn crypto, build status, and unlock loot. It matches BitLoot's crypto-gaming identity.

**Marketing line:** *"Join the Loot Squad — share BitLoot, earn crypto, level up."*

---

## 4. Core Mechanics

### 4.1 Enrollment

- Any logged-in user clicks **"Join Loot Squad"** → gets a unique code (e.g. `NINJALOOT`) + shareable links.
- Optional **Creator application** for bigger partners (submit social links, audience size) → manual admin approval for elevated commission rates.
- Members receive:
  - Unique code + vanity code option (unlocked at higher tiers).
  - Global link: `https://bitloot.io?r=NINJALOOT`
  - Product-specific links: `https://bitloot.io/product/elden-ring?r=NINJALOOT`
  - Campaign-tracked links: `https://bitloot.io?r=NINJALOOT&utm_source=youtube&utm_campaign=summer-sale`

### 4.2 Code Rotation & History

- Affiliates can **change their code** (e.g. `NINJALOOT` → `NINJAGAMING`) via the dashboard.
- Old code is stored in `affiliate_code_history` for redirect mapping.
- Links using old codes **redirect** to the current code's URL (301 redirect via `/r/:code` endpoint).
- Each affiliate can hold 1 active code + 1 vanity code at a time. Past codes remain reserved for 90 days to prevent hijacking.

### 4.3 Attribution Model

**Last-click with 30-day window**, with multi-layer storage for resilience:

1. Buyer arrives via `?r=CODE` → click is tracked via `GET /r/:code` redirect endpoint (increments click counter) → frontend stores attribution in **both** secure HttpOnly cookie and `localStorage` (redundancy for incognito/cookie-clearing scenarios).
2. At checkout, the order stores the `ref_code` directly on the `orders` table. In Phase 1, the order itself *is* the attribution record — no separate `affiliate_attributions` table needed.
3. **Checkout code field (always visible):** "Support a creator?" input is shown at checkout **regardless** of cookie state. If a cookie/localStorage value exists, the field is pre-filled but editable.
4. **Guest checkout compatible:** attribution ties to the order directly, not to a user account.
5. **UTM campaign tracking:** `utm_source`, `utm_campaign`, and `utm_medium` params are stored alongside the attribution for channel analytics.

**Multi-touch attribution rule:** The checkout code field always takes priority (explicit user intent). If no code is entered, the stored cookie/localStorage value is used. This is intentional — Epic's Support-A-Creator works the same way. The "hijacking" risk is accepted because it means the buyer *chose* to support that creator.

### 4.4 Click Tracking

Every referral link routes through a lightweight redirect endpoint:

```
GET /r/:code?dest=/product/elden-ring&utm_source=youtube
```

- Increments `affiliate_codes.total_clicks` counter (atomic `UPDATE ... SET total_clicks = total_clicks + 1`).
- Stores attribution cookie + localStorage.
- Redirects to `dest` (or homepage if no dest).
- Rate-limited: max 100 clicks/day per IP per code (prevents bot inflation).
- Enables affiliates to see: "I sent 500 clicks → 20 orders → 4% conversion rate."

### 4.5 Commission Engine

Commission is calculated on **BitLoot's margin** (selling price − cost), not raw GMV. This prevents losses on deeply discounted products.

**Margin calculation by source type:**

| Product source | Margin calculation | Fallback when cost is unknown |
|----------------|-------------------|-------------------------------|
| **Kinguin** | `selling_price - kinguin_cost` (from API) | Never unknown — Kinguin always provides cost |
| **Custom (cost tracked)** | `selling_price - admin_set_cost` | — |
| **Custom (cost unknown)** | Falls back to **admin-configured default margin %** (e.g. 40% of selling price) | If no default configured → **flat commission of €0.50** per item |

> **Critical rule:** Commission is never $0 due to missing data. The fallback chain ensures every fulfilled referral earns something.

**Cost freezing:** Per-item cost is frozen at fulfillment time on `affiliate_commissions.cost_eur`. The commission calculation uses the cost at the moment of fulfillment — never a later lookup from the product table. If a product's cost changes after the order, it does NOT affect already-calculated commissions. This ensures audit accuracy and prevents retroactive commission adjustments.

**Commission rate model — Sliding scale (not fixed tiers):**

Instead of cliff-based tiers (Bronze/Silver/Gold), commission uses a **continuous sliding scale** that rewards every additional sale:

| Component | Rate | Cap |
|-----------|------|-----|
| **Base commission** | 8% of margin | — |
| **Performance bonus** | +0.1% per fulfilled referral in rolling 30 days | Capped at +4% (= 40 referrals) |
| **New-buyer bonus** | +€0.50 flat bonus when referral is a first-time customer | — |
| **Commission floor** | **€0.50 per fulfilled item** OR calculated %, whichever is **higher** | — |
| **Commission cap** | 12% of margin max | — |
| **Diamond (invite-only)** | Custom rate negotiated per creator | No cap |

**Why sliding scale > fixed tiers:**
- At 9 sales, fixed tiers pay the same as at 1 sale (both Bronze). Sliding scale rewards every sale.
- No "cliff frustration" where affiliates feel stuck just below a tier threshold.
- Continuous motivation rather than big gaps between jumps.

**Per-item commission (partial fulfillment):**

Commission is calculated **per order item**, not per order. If an order has 3 items and only 2 fulfill:
- Commission is generated for the 2 fulfilled items.
- The unfulfilled item generates no commission.
- Each commission record references the specific `order_item_id`.

**Commission rules:**

- Only on **paid + fulfilled** order items (not waiting, failed, underpaid, refunded, or cancelled).
- **Commission is calculated on margin AFTER promo code discount.** If a €50 item has a €5 promo discount, the selling price for margin calculation is €45, not €50. This is fair to both sides — BitLoot doesn't pay commission on revenue it didn't receive, and the €0.50 floor protects affiliates from zero-commission scenarios on heavily discounted items.
- **Promo codes and affiliate codes are fully independent.** Both can be used on the same order. Promo codes reduce the selling price (affecting margin), while affiliate codes drive attribution (affecting commission). There is no conflict or stacking restriction between them.
- **Credit-only orders (€0 crypto) still generate commission.** Credits are a payment method, not a discount — the selling price and margin are unchanged regardless of how the buyer pays.
- Admin-configurable: heavily discounted orders (flash deals, large promos) can have reduced/blocked commission.
- Low-margin categories can be excluded or assigned reduced rates via admin config.
- Commission amount is **frozen in EUR at fulfillment time** (see section 7).
- Payout method: Commissions accumulate in the **affiliate earnings balance** (a separate ledger in Loot Squad). Creators request stablecoin payouts (monthly, €15 min) or optionally convert earnings → BitLoot promo credits for instant spending (one-way, manual). See section 7.

**Commission + promo discount example:**

```
Item price:          €50
Kinguin cost:        -€30
Gross margin:        €20

Promo code applied:  -€5 (off selling price)
Net selling price:   €45
Adjusted margin:     €45 - €30 = €15

Commission (8%):     €1.20 (on €15 margin)
Floor check:         €1.20 > €0.50 ✓
```

---

## 5. Gamification Layer (Phase 3 — Ships After Core Loot Squad Is Validated)

> **Not in Phase 1 or 2.** The gamification layer ships only after the core Support-A-Creator MVP is live, tested, and generating real affiliate-driven sales. Do not start this until Phase 1+2 are complete.

### 5.1 XP, Levels & Badges

**XP sources (concrete values):**

| Action | XP earned |
|--------|-----------|
| Fulfilled referred order | +25 XP |
| New customer acquired (first-time buyer) | +50 XP bonus |
| Revenue milestone: €500 lifetime referred revenue | +100 XP bonus |
| Revenue milestone: €2,000 lifetime referred revenue | +250 XP bonus |
| Revenue milestone: €10,000 lifetime referred revenue | +500 XP bonus |
| Quest completion (daily) | +10 XP |
| Quest completion (weekly) | +30 XP |

**Level progression table:**

| Level | XP required | Cumulative XP | Unlock |
|-------|------------|---------------|--------|
| 1 | 0 | 0 | Base access |
| 2 | 100 | 100 | Profile badge: "Rookie" |
| 3 | 200 | 300 | Vanity code slot |
| 4 | 300 | 600 | Early access to selected deals |
| 5 | 500 | 1,100 | Profile flair: custom border |
| 6 | 700 | 1,800 | Featured on leaderboard sidebar |
| 7 | 1,000 | 2,800 | Priority support |
| 8 | 1,500 | 4,300 | Custom landing page template |
| 9 | 2,000 | 6,300 | Exclusive product access |
| 10 | 3,000 | 9,300 | "Legend" badge + permanent leaderboard entry |

> **Note:** XP levels are **lifetime (never reset)**. They represent earned prestige. Seasonal leaderboards are a separate ranking (see §5.2).

**Badges** (cosmetic motivation):
- *"First Blood"* — First referred sale.
- *"Squad Leader"* — 5+ distinct new buyers in a week.
- *"Boss Killer"* — Single high-ticket order above €100.

### 5.2 Seasons & Leaderboards — Dual-Track System

Two separate ranking systems to avoid punishing loyal affiliates:

| System | Resets? | Purpose |
|--------|---------|---------|
| **Lifetime prestige level** (§5.1) | **Never resets** | Rewards long-term loyalty and cumulative effort |
| **Seasonal leaderboard** | **Resets monthly** | Drives short-term competition and engagement spikes |

- **Seasonal leaderboard** ranks affiliates by **seasonal points** (referred orders + revenue in the current season).
- **Leaderboards:** Global + niche boards (Steam, Xbox, Nintendo, etc.) using existing catalog metadata.
- **Season rewards:** Top N affiliates get bonus commission, crypto prizes, or free game keys.
- Lifetime level and badges are always visible on profiles regardless of seasonal reset.

### 5.3 Quests & Challenges — Template Rotation System

Battle-pass-inspired quests with **automated rotation** (no manual daily admin work):

**Quest template system:**
1. Admin creates **quest templates** via `/admin/loot-squad/challenges` (e.g. "Refer N new buyers", "Sell N keys from category X").
2. Templates have a `rotation_type`: `daily`, `weekly`, or `event` (manual).
3. A **BullMQ cron job** (`affiliate.rotate-quests`) runs at midnight UTC:
   - Creates new daily quest instances from active daily templates (random selection if multiple templates exist).
   - Creates new weekly quest instances every Monday from active weekly templates.
   - Event quests are created manually by admin with explicit start/end dates.
4. Quest progress is tracked per-affiliate, per-instance.

| Type | Template example | Reward | Rotation |
|------|-----------------|--------|----------|
| **Daily** | Get 1 qualified click | +10 XP | Auto-generated daily at midnight |
| **Weekly** | Refer 1 new buyer | +30 XP + milestone reward | Auto-generated Monday midnight |
| **Event** | Sell 3 games from featured collection | Boosted commission for period | Admin-created with dates |

Quests are surfaced in the Loot Squad dashboard and via email notifications (Resend).

**Quest progress on refunds:**

Quest progress is **sticky and one-way**. If a referred order is refunded after contributing to quest progress:
- The quest progress does NOT revert. A completed quest stays completed.
- The commission linked to that order IS reversed (see §8 "Commission Reversal on Order Refund") — but commission and quest progress are separate accounting.
- Rationale: Reverting quest progress creates exploit loops (refer → refund → re-refer → repeat for infinite quest completions). Sticky progress prevents this. The commission reversal already handles the financial side.

### 5.4 Milestone Rewards — "Pick Your Reward" (Deterministic, Not Random)

Awarded at milestones (e.g. every 5 completed orders in a season, reaching a new level). **No loot boxes. No randomization. No paid rerolls.**

At each milestone, the affiliate is presented with **3 choices** and picks one:

| Option A | Option B | Option C |
|----------|----------|----------|
| +50 XP boost | +1% commission bump for 48 hours | €2 in promo credits |

**Why deterministic rewards > loot boxes:**
- **Zero regulatory risk.** Paid loot box rerolls constitute gambling mechanics under EU, UK, and Australian law regardless of framing. Deterministic choices avoid this entirely.
- **More agency.** Affiliates feel empowered choosing their reward, not subject to RNG.
- **Same dopamine hit** from reaching the milestone, without randomization controversy.
- **No "reroll for a fee" needed** — removes the conflict between "no gambling" and "monetize loot boxes."

---

## 6. Community Layer — Public Visibility (Phase 3+)

> Ships with gamification in Phase 3. Not in MVP.

Loot Squad needs a **public social layer** to create community, competition, and discovery — not just a closed private dashboard.

### Public surfaces

| Surface | Route | Purpose |
|---------|-------|---------|
| **Leaderboard** | `/loot-squad/leaderboard` | Ranked members with avatar, username, tier, XP, badges, season points |
| **Creator profile** | `/loot-squad/@username` | Public profile with tier, badges, rank, social links, "support this creator" button |

### What is public vs private

| Public (visible to all) | Private (dashboard only) |
|--------------------------|--------------------------|
| Display name / avatar | Actual earnings |
| Tier, level, XP | Wallet address |
| Badges | Payout amounts |
| Leaderboard rank | Order details |
| Social links | Buyer data |
| Creator code + "support" button | Email / account info |

### Privacy controls

- Users choose a public username on enrollment.
- Allow opt-out from public ranking.
- Show only rank/tier/XP publicly — never money.
- Seasonal resets keep rankings fresh and fair.

### Why this matters for sales

Public visibility transforms Loot Squad from personal rewards into **active competition**:

| Effect | Sales impact |
|--------|-------------|
| **Competition** — users see ranks, compete to climb | More sharing/referrals |
| **Motivation** — visible progress/status drives effort | Repeat engagement |
| **Discovery** — buyers find top creators, use their codes | Direct traffic |
| **Social proof** — badges/ranks build trust for new users | Higher signups |
| **Virality** — users share their rank/profile externally | Organic growth |

---

## 7. Payout System

### The volatility problem

Crypto prices fluctuate. If commissions are stored as "0.005 ETH" and paid out weeks later, the real value drifts. The fix: **EUR-denominated, stablecoin-settled.**

### Currency model

All BitLoot prices, costs, and margins are in **EUR**. Commissions are calculated and frozen in **EUR** at fulfillment time. No EUR→USD conversion is needed — the entire financial chain stays in EUR until the final stablecoin settlement:

1. Order completes → commission calculated in **EUR** based on margin.
2. EUR value is **frozen** in the internal ledger at that moment.
3. At payout time, EUR amount is converted to stablecoin equivalent using a rate from a reliable API (CoinGecko or similar) captured at batch creation time.
4. The conversion rate and timestamp are stored on the payout record for audit.

**Core rule:** *If a sale earns €10 commission today, the affiliate receives €10 worth of stablecoin later — regardless of BTC/ETH price movement. The EUR→stablecoin conversion happens once, at payout time.*

### Payout methods — Earnings balance (always)

| Method | When | Minimum | Timing |
|--------|------|---------|--------|
| **Stablecoin payout** | Creator requests payout from earnings balance | **€15** | Monthly batch (1st of month) |
| **Convert to BitLoot Credits** | Creator manually converts earnings → promo credits | **€1** | Instant (one-way, irreversible) |

All commissions accumulate in the **affiliate earnings balance** — a separate EUR-denominated ledger managed by Loot Squad. This is NOT store credit. This is real money the creator earned through real work.

**Stablecoin payout (primary option):**
Once earnings reach €15, creators can request a payout. On the 1st of each month, admin reviews and processes payout batches. Creators receive **USDT (BEP20)** to their verified wallet. Payouts are **manual** — admin reviews the request, sends USDT from BitLoot's wallet, and records the transaction hash. **Single admin approval** is sufficient for Phase 1–2. Dual-approval can be added later if fraud risk or payout volume warrants it.

**Manual payout flow:**
1. Affiliate requests payout from dashboard (≥€15 balance)
2. Request appears in `/admin/loot-squad/payouts`
3. Admin verifies: wallet address, payout amount, fraud flags, account history
4. Admin sends USDT BEP20 manually from BitLoot's wallet
5. Admin marks payout as "sent" + enters tx hash in the system
6. System records: tx hash, timestamp, conversion rate, admin who approved
7. Affiliate receives email with tx hash + BSCScan explorer link

**Convert to credits (convenience option):**
A creator with €8 in earnings who wants to buy something on BitLoot NOW can manually convert any amount (min €1) to promo credits. This is one-way — converted amounts can no longer be withdrawn as stablecoin. The converted credits expire in 90 days (standard promo credit rules). Creators are never auto-enrolled or pushed into this — it's a voluntary convenience for those who prefer to shop.

> **Why earnings-first, not credits-first:** Creators earned real revenue for BitLoot. Defaulting their payout to expiring store credit is unfair and undermines trust. An affiliate program that traps earnings as Monopoly money won't attract serious creators. The people who actually drive volume need to know they can get paid.

> **🔴 CRITICAL: Conversion is ONE-WAY and IRREVERSIBLE.** Earnings → credits only. There is no credits → earnings path and one must never be built. If reverse conversion existed, free promotional credits (quests, cashback, referral bonuses) could be laundered through the earnings balance and withdrawn as stablecoin — turning every BitLoot giveaway into a cash extraction vector. See [BitLoot-Credits.md §4.3](BitLoot-Credits.md) for the full exploit scenario and admin handling policy.

### Payout model

1. Sale fulfills → commission calculated in **EUR** based on per-item margin.
2. EUR value is **frozen** in the internal ledger.
3. Commission stays **pending** during a hold window (fraud check, dispute window).
4. After hold, moves to **available** in the affiliate earnings balance.
5. Earnings sit in the balance — **no expiry, ever.**
6. **Creator has two options at any time:**
   - **Request stablecoin payout:** Available on the 1st of each month if balance ≥ €15. Admin reviews → sends USDT BEP20 manually to verified wallet.
   - **Convert to credits:** Manually convert any amount (min €1) to BitLoot promo credits for instant spending. One-way, irreversible, 90-day expiry on resulting credits.
7. If stablecoin payout: Admin sends USDT BEP20 from BitLoot's wallet to the affiliate's verified address.
8. Admin enters transaction hash in the system. Hash, fees, conversion rate, admin who approved, and status are stored for audit.

### V1 payout rules

| Rule | Value |
|------|-------|
| Earnings balance | EUR-denominated, no expiry, accumulates per fulfilled sale |
| Stablecoin minimum threshold | €15 |
| Stablecoin payout schedule | Monthly (1st of month) |
| Stablecoin currency | USDT BEP20 only (BSC network) |
| Credit conversion minimum | €1 |
| Credit conversion result | Promo credits (90-day expiry, non-withdrawable) |
| Approval | Manual admin approval before stablecoin send |
| Eligible orders | Paid + fulfilled items only |
| Hold period | 48 hours post-fulfillment |

### Payout process — Fully manual (Phase 1–2)

> **Payouts are handled manually by admin.** No automated payout provider integration (NOWPayments or otherwise). Admin sends USDT BEP20 directly from BitLoot's wallet after reviewing each payout request. This is the simplest, most controllable approach for early phases.
>
> **Future automation (Phase 4+):** If payout volume grows beyond manual capacity (50+ payouts/month), evaluate automated payout providers or direct on-chain batch transactions.

### Wallet verification flow

Before first stablecoin payout, affiliates must verify their wallet:

1. **Wallet address validation:** Must be a valid BEP20 address (starts with `0x`, exactly 42 characters, passes EIP-55 checksum). Stored as `wallet_address VARCHAR(100)`, `wallet_network: 'bep20'` (hardcoded for now, future-proof column).
2. **Admin review:** Admin manually reviews wallet address before approving each payout. Wallet is flagged as "verified" after first successful payout.
3. **All affiliates:** Wallet address change triggers a 72-hour cooling period + email notification to prevent theft. System records `last_wallet_change_ip` and `last_wallet_change_at` for admin review.
4. **KYC: Deferred.** No identity verification required in Phase 1–2. Will be evaluated later based on regulatory requirements and payout volumes.

> **Note:** Since payouts are manual, admin has full visibility into wallet changes, IP addresses, and account history before sending any funds. This provides sufficient protection without automated KYC.

### Payout notifications

Affiliates receive Resend emails when:
- A payout batch is created.
- Payout is sent (with tx hash + blockchain explorer link).
- Payout is confirmed on-chain.
- Payout fails (retry instructions).
- Wallet address is changed (security alert).

---

## 8. Fraud & Abuse Controls

### Multi-signal fraud detection

| Threat | Mitigation |
|--------|-----------|
| **Self-referral (hard block)** | **Server-side hard block:** At checkout, backend checks `affiliate_codes.user_id === order.user_id`. If match → reject with error: "You cannot use your own referral code." Also checks: same email, same device fingerprint, same IP in last 24h. Repeated self-referral attempts are logged in audit and increase fraud score. This is NOT a flag — it is a **hard block** enforced at the API layer. |
| **Self-referral (advanced evasion)** | Flag when buyer IP matches affiliate's known IPs (from session logs), or device fingerprint matches, or orders cluster from same /24 subnet within short windows. These cover cases where the affiliate uses a different account to bypass the basic check. |
| **Velocity abuse** | Flag affiliates with >10 orders from different "new" accounts within 24 hours for manual review |
| **Same-household detection** | Track IP + user-agent patterns; if multiple "new buyers" share the same IP over days, flag for review (don't auto-block — shared IPs are common) |
| **Same-device/IP loops** | Flag many small orders from same IP for manual review (existing IP/session tracking) |
| **Fake accounts** | Hold period + admin review before payout |
| **Low-quality traffic** | Conversion rate monitoring per affiliate; flag if click-to-order ratio < 0.5% sustained |
| **Refund abuse** | Commission only after fulfilled status + hold window |
| **Underpaid orders** | Underpaid amounts are now recovered as cash credits (see BitLoot-Credits.md §4.6). No commission is generated on underpaid orders — the order is not fulfilled, so no commission applies. |
| **Click inflation** | Rate-limit: max 100 referral clicks/day per IP per code; track unique vs repeat visitors |
| **Bad actors** | Admin can ban affiliate → code becomes invalid, balance frozen, pending commissions rejected |
| **Wallet verification** | Required before first stablecoin payout (see §7 for flow) |
| **Code enumeration** | Rate-limit code validation endpoint: 10 requests/minute per IP (see §8.2) |

**Affiliate suspension messaging:**

When an affiliate is suspended or banned, their Loot Squad dashboard is replaced with a banner:
> "Your Loot Squad membership has been suspended due to a policy violation. Contact support@bitloot.io to appeal."

- Dashboard data is hidden (stats, earnings, referred orders).
- Affiliate code becomes invalid — buyers see "Invalid code" at checkout.
- Login is not blocked (user can still access their BitLoot account for purchases).
- If the affiliate has cash credits, those remain accessible for purchases (cash credits are the user's money — see ban policy below).

### Affiliate Suspension & Ban Policy

When an affiliate is banned for fraud, manipulation, or malicious activity:

| Balance type | On ban | Rationale |
|---|---|---|
| **Pending commissions** | **Forfeited** — all pending/held commissions rejected | Earned through fraudulent activity |
| **Available affiliate earnings** | **Forfeited** — frozen and zeroed | Fraudulently obtained |
| **Promo credits** | **Forfeited** — zeroed immediately | Free credits, no legal obligation |
| **Cash credits (user-deposited money)** | **Refunded** — admin initiates manual USDT refund to user's last known wallet, or holds for 90 days for user to claim via support | Cash credits are legally the user's money. EU consumer protection makes forfeiting deposited funds legally risky, even for banned users. Steam/Epic/PlayStation all refund wallet balances on bans. |

**Process:**
1. Admin bans affiliate → system freezes all balances instantly
2. Affiliate code becomes invalid (no new clicks or commissions)
3. Admin reviews → promo credits + affiliate earnings: forfeited
4. Cash credits: admin contacts user for refund wallet OR holds 90 days
5. Decision is **final**. User can appeal by contacting support.
6. All ban actions logged in `audit_logs` with reason.

### Commission Reversal on Order Refund

When a referred order item is refunded after commission was generated:

1. Find the `affiliate_commission` record linked to the refunded `order_item_id`.
2. Create a reversal `affiliate_transaction` with `type: 'commission_reversal'`, negative amount = original commission for that item.
3. Deduct from affiliate's available balance.
4. **If commission hasn't been paid out yet:** Simple deduction from available balance.
5. **If commission was already paid out:** Record as negative balance — deducted from the next payout batch. This is standard (Amazon Associates uses the same model).
6. Per-item reversal only — if 1 of 3 items is refunded, only that item's commission reverses.

### 8.1 Fraud scoring

Each commission gets a `fraud_score` (0–100) computed from weighted signals:

| Signal | Weight | Why |
|---|---|---|
| Same device fingerprint as buyer | +40 | Strongest self-referral indicator |
| Same IP as buyer | +30 | Strong self-referral indicator |
| > 50% of referrals from single IP | +25 | Fake traffic ring |
| Buyer refund rate > 40% on affiliate orders | +25 | Refund fraud ring |
| Click-to-purchase < 5 seconds | +20 | Bot or pre-planned self-purchase |
| All referrals are new accounts < 24h old | +20 | Manufactured accounts |
| Multiple affiliate codes from same household | +20 | Multi-account abuse |
| Conversion rate > 30% (with > 20 clicks) | +15 | Suspiciously high — possibly only referring themselves |
| Multiple orders from same IP in 24h | +15 | Same-device loop |
| New buyer account created < 1 hour before order | +20 | Manufactured accounts |
| Order total < €5 | +10 | Low-value fraud testing |

**Score thresholds (ship with these, tune after 30 days of real data):**

> **Fraud scores are immutable once assigned.** When a commission's fraud score is computed, it is frozen on the `affiliate_commissions.fraud_score` column and never recalculated. If admin tunes the thresholds later (e.g., changes "hold" from 50 to 45), the change applies only to **new commissions going forward**. Historical commissions retain their original scores and actions. This ensures audit trail integrity and prevents retroactive changes to already-reviewed decisions.

| Score range | Action |
|---|---|
| 0–29 | **Auto-approve** — normal affiliate activity |
| 30–49 | **Monitor** — flagged for weekly review, no action taken |
| 50–69 | **Hold commission** — admin must manually review before release. 7-day auto-release if no admin action |
| 70–84 | **Block commission + alert admin** — commission withheld, admin notification sent, affiliate warned |
| 85–100 | **Auto-suspend affiliate** — account suspended, all pending commissions frozen, admin review required to reinstate |

### 8.2 Rate limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `GET /r/:code` (click tracking) | 100/day | Per IP per code |
| `POST /affiliates/validate-code` | 10/min | Per IP |
| `POST /affiliates/enroll` | 3/hour | Per user |
| `GET /affiliates/leaderboard` | 30/min | Per IP |

All manual overrides are logged via the existing audit log system.

---

## 9. Checkout UX Changes

Minimal but impactful:

- **Always show "Support a creator" code field** at checkout, regardless of cookie state. If a cookie/localStorage attribution exists, the field is **pre-filled** with the creator's code and shows their name/avatar. The buyer can clear or change it.
- **If valid attribution present:** Show "You're supporting **CREATOR_NAME**" in the checkout sidebar (small avatar if available). Editable — buyer can click "change" to enter a different code or remove it.
- **SDK validation:** Code field validates via SDK (`POST /affiliates/validate-code`) with debounce. Rate-limited to prevent enumeration (see §8.2).
- **Order confirmation page + emails:** "This order supported CREATOR_NAME" (no financials exposed).
- **Creator disclosure:** Small text below the code field: "The creator earns a commission on your purchase." (FTC disclosure requirement).

---

## 10. Dashboard & Admin Pages

### User dashboard — Loot Squad tab

Add a **Loot Squad** tab inside the existing `/profile` dashboard (not a separate app):

**Phase 1 (MVP — ships first):**
- **Overview cards:** Current balance, total earned, total orders, conversion rate.
- **Click & conversion stats:** Total clicks, orders, conversion rate chart over time.
- **Referred orders table** with status, commission earned per item.
- **Links & code:** Copyable links (with UTM builder), QR code for streaming/offline.
- **Payout settings:** Stablecoin wallet setup + optional "Convert to Credits" button for convenience spending.

**Phase 3+ (gamification add-ons):**
- Current tier, XP/level, badges.
- Active quests with progress bars.
- "Pick your reward" milestone interactions.
- Seasonal leaderboard rank.

### Admin pages

| Route | Purpose | Phase |
|-------|---------|-------|
| `/admin/loot-squad` | Affiliate list with search, filter by status/performance, fraud score flags | Phase 1 |
| `/admin/loot-squad/[id]` | Detail view: stats, fraud flags, referred orders, transaction ledger, audit trail | Phase 1 |
| `/admin/loot-squad/payouts` | Pending/completed payouts, batch creation, CSV export, mark paid | Phase 2 |
| `/admin/loot-squad/config` | Default commission rates, margin fallback %, excluded categories, sliding scale params | Phase 1 |
| `/admin/loot-squad/challenges` | CRUD for quest templates + rotation config | Phase 3 |

These follow existing admin patterns: tables with filters, CSV export, audit logging, pagination.

---

## 11. Data Model

### Phase 1 entities (MVP — minimal tables)

> **Phase 1 uses only 2 new tables + 1 column change.** The order itself is the attribution record. No separate attributions table, no transactions ledger, no quest tables. Add those in later phases.

```
affiliate_codes
  id              UUID PK
  user_id         UUID FK → users (unique, 1:1)
  code            VARCHAR(20) UNIQUE NOT NULL         -- e.g. NINJALOOT
  vanity_code     VARCHAR(20) UNIQUE                  -- unlocked at higher levels (Phase 3)
  status          VARCHAR(20) DEFAULT 'active'        -- active | suspended | banned
  commission_rate_override DECIMAL(5,2)               -- NULL = use sliding scale; set for Diamond/custom
  total_clicks    INT DEFAULT 0                       -- incremented by /r/:code endpoint
  total_referrals INT DEFAULT 0                       -- fulfilled referral order count
  total_earned    DECIMAL(20,8) DEFAULT 0             -- lifetime EUR earned
  balance         DECIMAL(20,8) DEFAULT 0             -- current available EUR balance (eagerly updated)
  social_links    JSONB                               -- { twitch, youtube, discord, ... }
  display_name    VARCHAR(50)                         -- public profile name
  avatar_url      TEXT
  bio             TEXT
  wallet_address  VARCHAR(100)                        -- BEP20 address (0x + 40 hex chars), VARCHAR(100) for future multi-chain
  wallet_currency VARCHAR(10) DEFAULT 'USDT'           -- USDT only (hardcoded for now)
  wallet_network  VARCHAR(20) DEFAULT 'bep20'          -- BEP20 only (future-proof column)
  wallet_verified BOOLEAN DEFAULT false
  last_wallet_change_ip VARCHAR(45)                    -- IP recorded on wallet address change
  last_wallet_change_at TIMESTAMPTZ                    -- timestamp of last wallet change
  kyc_status      VARCHAR(20) DEFAULT 'none'          -- none | pending | verified | rejected (deferred)
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

affiliate_commissions
  id              UUID PK
  affiliate_code_id UUID FK → affiliate_codes
  order_id        UUID FK → orders
  order_item_id   UUID FK → order_items              -- per-item commission (partial fulfillment)
  gross_item_eur  DECIMAL(20,8)                       -- item selling price in EUR
  cost_eur        DECIMAL(20,8)                       -- Kinguin/custom cost in EUR
  margin_eur      DECIMAL(20,8)                       -- gross - cost
  margin_source   VARCHAR(20)                         -- 'kinguin_api' | 'admin_cost' | 'default_pct' | 'flat_fallback'
  commission_rate DECIMAL(5,2)                        -- % at time of calculation (from sliding scale)
  commission_eur  DECIMAL(20,8)                       -- frozen EUR value (>= €0.50 floor)
  status          VARCHAR(20)                         -- pending | available | credited | paid | rejected
                                                      -- pending: created, in hold period (48h) or under fraud review
                                                      -- available: hold expired, balance updated, ready for payout
                                                      -- credited: converted to promo credits (one-way)
                                                      -- paid: included in completed payout batch
                                                      -- rejected: fraud-flagged or admin-rejected
  fraud_score     SMALLINT DEFAULT 0                  -- 0-100, computed from fraud signals
  is_new_buyer    BOOLEAN DEFAULT false
  hold_until      TIMESTAMPTZ                         -- 48h after fulfillment
  utm_source      VARCHAR(50)                         -- from attribution tracking
  utm_campaign    VARCHAR(100)                        -- from attribution tracking
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
```

### Phase 2 entities (payouts + code history)

```
affiliate_code_history
  id              UUID PK
  affiliate_code_id UUID FK → affiliate_codes
  old_code        VARCHAR(20) NOT NULL                -- previous code value
  changed_at      TIMESTAMPTZ DEFAULT NOW()
  expires_at      TIMESTAMPTZ                         -- 90 days after change; redirect stops after

affiliate_payouts
  id              UUID PK
  affiliate_code_id UUID FK → affiliate_codes
  batch_id        UUID FK → affiliate_payout_batches
  amount_eur      DECIMAL(20,8)                       -- EUR value being paid
  conversion_rate DECIMAL(12,6)                       -- EUR→stablecoin rate at payout time
  amount_stablecoin DECIMAL(20,8)                     -- actual stablecoin amount sent
  payout_currency VARCHAR(10)
  wallet_address  VARCHAR(100)
  wallet_network  VARCHAR(20)
  provider        VARCHAR(20) DEFAULT 'manual'        -- 'manual' | 'direct' (Phase 1-2 are manual)
  provider_payout_id VARCHAR(100)
  tx_hash         VARCHAR(200)
  fee_eur         DECIMAL(20,8)
  status          VARCHAR(20)                         -- pending | processing | completed | failed
  created_at      TIMESTAMPTZ
  paid_at         TIMESTAMPTZ

affiliate_payout_batches
  id              UUID PK
  total_amount_eur DECIMAL(20,8)
  conversion_rate DECIMAL(12,6)                       -- EUR→stablecoin rate used
  rate_source     VARCHAR(50)                         -- 'coingecko' | 'manual'
  rate_captured_at TIMESTAMPTZ                        -- when rate was fetched
  total_recipients INT
  status          VARCHAR(20)                         -- draft | approved | processing | completed | partial | failed
  approved_by     UUID FK → users                    -- admin who approved
  approved_at     TIMESTAMPTZ
  created_at      TIMESTAMPTZ

affiliate_transactions
  id              UUID PK
  affiliate_code_id UUID FK → affiliate_codes
  type            VARCHAR(20)                         -- commission | bonus | credit_conversion | payout | adjustment | commission_reversal
  amount          DECIMAL(20,8)                       -- positive = credit, negative = debit (EUR)
  balance_after   DECIMAL(20,8)                       -- running balance snapshot
  reference_id    UUID                                -- order_id, payout_id, or quest_id
  description     TEXT
  created_at      TIMESTAMPTZ
```

### Phase 3 entities (gamification)

```
affiliate_quests
  id              UUID PK
  template_id     UUID FK → affiliate_quest_templates (NULL for manually created)
  title           VARCHAR(100)
  description     TEXT
  quest_type      VARCHAR(20)                         -- daily | weekly | event
  goal_type       VARCHAR(30)                         -- referral_count | referral_revenue | new_buyers | clicks
  goal_value      INT
  reward_type     VARCHAR(20)                         -- xp | commission_boost | credit
  reward_value    DECIMAL(10,2)
  starts_at       TIMESTAMPTZ
  ends_at         TIMESTAMPTZ
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMPTZ

affiliate_quest_templates
  id              UUID PK
  title_template  VARCHAR(100)                        -- e.g. "Refer {goal_value} new buyers"
  quest_type      VARCHAR(20)                         -- daily | weekly
  goal_type       VARCHAR(30)
  goal_value_min  INT                                 -- random range for variety
  goal_value_max  INT
  reward_type     VARCHAR(20)
  reward_value    DECIMAL(10,2)
  rotation_weight INT DEFAULT 1                       -- higher = more likely to be picked
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMPTZ

affiliate_quest_progress
  id              UUID PK
  quest_id        UUID FK → affiliate_quests
  affiliate_code_id UUID FK → affiliate_codes
  current_value   INT DEFAULT 0
  completed       BOOLEAN DEFAULT false
  rewarded        BOOLEAN DEFAULT false
  reward_choice   VARCHAR(20)                         -- 'xp' | 'commission_boost' | 'credit' (for milestone picks)
  completed_at    TIMESTAMPTZ
  UNIQUE(quest_id, affiliate_code_id)
```

**Key indexes:** `affiliate_codes(user_id)`, `affiliate_codes(code)`, `affiliate_codes(vanity_code)`, `affiliate_commissions(affiliate_code_id, status)`, `affiliate_commissions(order_id)`, `affiliate_commissions(order_item_id)`, `affiliate_code_history(old_code)`, `affiliate_transactions(affiliate_code_id, created_at)`, `affiliate_quest_progress(quest_id, affiliate_code_id)`.

### Existing table changes

- `orders` → add `ref_code VARCHAR(20)` column (stores the affiliate code used at checkout time). This is the Phase 1 attribution record — no separate attributions table needed.
- `order_items` → add `product_cost_eur DECIMAL(20,8)` column (frozen product cost at order time for accurate margin calculation. Kinguin cost from API, custom cost from admin `products.admin_cost`. If cost changes after order, commission uses the frozen value).

> **Note:** `user_credits` and `credit_transactions` tables are defined in the separate `BitLoot-Credits.md` document. Loot Squad does not depend on credits for Phase 1 or Phase 2.

---

## 12. Backend Architecture (NestJS)

### New module: `modules/affiliates/`

**Phase 1 (MVP — minimal files):**

| File | Responsibility |
|------|---------------|
| `affiliate-code.entity.ts` | AffiliateCode entity |
| `affiliate-commission.entity.ts` | AffiliateCommission entity |
| `affiliates.service.ts` | Code generation, validation, click tracking, balance management |
| `affiliate-commission.service.ts` | Compute per-item commission from margin (with fallback chain), update balance |
| `affiliates.controller.ts` | User endpoints: enroll, get code, stats, validate code |
| `affiliate-redirect.controller.ts` | `GET /r/:code` — click tracking + redirect endpoint |
| `admin-affiliates.controller.ts` | Admin endpoints: affiliate list, detail, config |
| `affiliate-commission.processor.ts` | BullMQ job: commission processing after fulfillment (in `apps/api/src/jobs/`) |

**Phase 2 (payouts):**

| File | Responsibility |
|------|---------------|
| `affiliate-code-history.entity.ts` | Code rotation history + redirect mapping |
| `affiliate-payout.entity.ts` | AffiliatePayout + batch entities |
| `affiliate-transaction.entity.ts` | AffiliateTransaction ledger entity |
| `affiliate-payout.service.ts` | Batch creation, payout execution, status tracking |

### Account Deletion — Affiliate Earnings Handling

When an affiliate requests account deletion (existing 30-day grace period), affiliate earnings follow the **same €15 rule as cash credits** (see BitLoot-Credits.md §4.7):

| Balance | Amount | Action |
|---------|--------|--------|
| **Affiliate earnings** | < €15 | **Forfeited** after explicit warning. Admin cost of manual payout exceeds value. |
| **Affiliate earnings** | ≥ €15 | **Manual refund option** — user prompted to request payout or contact support before deletion. Admin sends USDT BEP20 to last-known verified wallet. |
| **Pending commissions** (in hold period) | Any | **Forfeited** — not yet available, not yet earned. |

If the user proceeds with deletion without claiming their ≥ €15 balance, it is forfeited after the 30-day grace period. All forfeited amounts are logged in `audit_logs` with reason `'account_deletion'`.

**Phase 3 (gamification):**

| File | Responsibility |
|------|---------------|
| `affiliate-quest.entity.ts` | AffiliateQuest + template + progress entities |
| `affiliate-quest.service.ts` | Quest evaluation, progress updates, reward distribution, rotation |

### Integration points with existing modules

| Existing module | Integration |
|----------------|-------------|
| **Orders** (`orders.service.ts`) | On order creation: read `refCode` from request/cookie, store on order as `ref_code` |
| **Fulfillment** (`fulfillment.service.ts`) | After per-item fulfillment: enqueue `affiliate.process-commission` BullMQ job per fulfilled item |
| **Kinguin profit** (`kinguin-profit.service.ts`) | Commission service calls into profit analytics to get cost per item (Kinguin source) |
| **Products** (`products.service.ts`) | Commission service reads `admin_cost` field for custom products; falls back to config default margin % |
| **Promos** (`promos.service.ts`) | Check promo-affiliate stacking rules before commission calculation |
| **Credits** (`credits.service.ts`) | **Quest reward module boundary (Phase 3):** When a quest grants promo credits, Loot Squad's quest evaluator calls `creditsService.grantPromoCredits()` with `type: 'reward'`, `referenceType: 'quest_instance'`, `referenceId: questProgressId`. Loot Squad decides WHEN to grant (quest completed) and HOW MUCH; Credits decides HOW (creates transaction, updates balance, sets expiry). This prevents double-counting in analytics. |
| **SDK** | Auto-generate `AffiliatesApi` + `AdminAffiliatesApi` clients from OpenAPI |

### BullMQ jobs

| Job | Trigger | Action | Phase |
|-----|---------|--------|-------|
| `affiliate.process-commission` | Order item fulfilled | Calculate per-item margin (with fallback chain), apply sliding scale %, enforce €0.50 floor, freeze EUR, create commission record, **eagerly update `affiliate_codes.balance`** (atomic `SET balance = balance + commission_eur` in same transaction as commission insert — keeps reads fast, no aggregation query needed) | Phase 1 |
| `affiliate.update-sliding-scale` | Commission created | Recompute affiliate's rolling 30-day stats for sliding scale rate | Phase 1 |
| `affiliate.release-commissions` | Cron (hourly) | Release `pending` commissions past `hold_until` with `fraud_score < 50` → set status `available`. Auto-release commissions with `fraud_score 50–69` held > 7 days with no admin action. | Phase 1 |
| `affiliate.process-payout-batch` | Admin approves batch | Record batch approval, update affiliate balances, mark commissions as `paid` | Phase 2 |
| `affiliate.payout-status-check` | Manual (admin marks sent) | Admin enters tx hash → system updates payout status to `completed`, sends confirmation email to affiliate | Phase 2 |
| `affiliate.rotate-quests` | Cron (midnight UTC) | Generate daily/weekly quest instances from active templates | Phase 3 |
| `affiliate.evaluate-quests` | Commission created | Check all active quests for progress, award completions | Phase 3 |

---

## 13. Frontend Routes (Next.js)

| Route | Access | Purpose | Phase |
|-------|--------|---------|-------|
| `/profile` → Loot Squad tab | Authenticated | Private dashboard: code, stats, clicks, earnings, payouts | Phase 1 |
| `/r/:code` | Public | Click tracking redirect (server-side, no page rendered) | Phase 1 |
| `/loot-squad/leaderboard` | Public | Seasonal leaderboard with rankings | Phase 3 |
| `/loot-squad/@[username]` | Public | Creator public profile with code + "support" button | Phase 3 |
| `/admin/loot-squad` | Admin | Affiliate management list + fraud flags | Phase 1 |
| `/admin/loot-squad/[id]` | Admin | Affiliate detail + fraud review | Phase 1 |
| `/admin/loot-squad/config` | Admin | Commission rates, margin defaults, sliding scale params | Phase 1 |
| `/admin/loot-squad/payouts` | Admin | Payout batch management | Phase 2 |
| `/admin/loot-squad/challenges` | Admin | Quest template CRUD + rotation config | Phase 3 |

---

## 14. Revenue Model — How BitLoot Earns From Loot Squad

This system is not a cost center. It's a **profit engine** with variable costs and multiple revenue streams.

### 14.1 Direct revenue from affiliate-driven sales

| Source | How it works | Example |
|--------|-------------|---------|
| **Key sales (core)** | Affiliates drive more purchases; BitLoot keeps full margin minus commission (8–12% of margin). | 200 extra sales × €10 margin = €2k revenue, €200 commission = **€1,800 net profit** |
| **Commission control** | Pay only on completed, fulfilled items — never on clicks, failed payments, or underpayments. | Zero risk; payout only after revenue is locked. |
| **Lower acquisition cost** | Affiliate-driven traffic is cheaper than paid ads (no CPC/CPM upfront). | Target: 15–20% of sales from affiliates at ~10% margin cost vs 20–40% ad cost. |

### 14.2 Future revenue streams (Phase 3+ — aspirational, requires scale)

> **⚠️ These require significant affiliate adoption and traffic volume.** Do not plan for this revenue until Loot Squad has 50+ active affiliates generating consistent sales.

| Stream | Description | Profit potential | Earliest phase |
|--------|-------------|-----------------|----------------|
| **Elevated creator partnerships** | BitLoot pays top creators higher commissions + early access in exchange for exclusive promotion commitments. Not a fee — BitLoot invests in creators. | Higher volume from committed creators | Phase 3 |
| **Self-funded promotional quests** | BitLoot runs its own quest campaigns to push high-margin or slow-moving inventory. Rewards are promo credits (breakage applies). No publisher dependency. | Margin-funded (indirect) | Phase 3 |
| **Store credit recycling** | Creators who opt to convert earnings to credits spend that value back on BitLoot instead of withdrawing as stablecoin. | Value stays in ecosystem | Phase 2 |
| **Creator storefronts** | Creators curate a public page of recommended products; BitLoot earns from all resulting sales. | Higher AOV from curated recommendations | Phase 3 |

### 14.3 Profit maximization tactics

**1. Acquisition flywheel**
Affiliates share links, driving traffic cheaper than paid ads. Conservative target: **15–20% of sales from affiliates** within 6 months of launch (not 30% — that requires mature creator network).

**2. Higher LTV**
Users acquired via creators tend to have higher trust and return rate — increasing repeat purchases by 15–25%.

**3. Margin optimization**
- Sliding scale commissions cap total payout at 12% of margin (Diamond excluded).
- €0.50 floor ensures affiliates are always motivated, even on low-margin items.
- Exclude low-margin categories from commission or assign fixed €0.50 via admin config.

**4. Low-cost retention (Phase 3+)**
Badges, leaderboards, and seasonal resets cost nothing to run but boost engagement 20–50%.

**5. Data leverage**
Click + UTM tracking reveals which channels, creators, and products drive the most revenue. This data informs dynamic pricing, featured product decisions, and creator partnership investments.

### 14.4 Projected economics — Conservative scenario

| Metric | Without Loot Squad | With Loot Squad (6 months in) | Delta |
|--------|-------------------|-------------------------------|-------|
| Monthly sales | 1,000 | 1,150–1,200 | +15–20% |
| Avg margin per sale | €10 | €10 | — |
| Affiliate commission cost | €0 | €200–300 (avg ~10% of margin on attributed sales) | −€200–300 |
| **Net profit** | **€10,000** | **€11,200–11,700** | **+12–17%** |

| Metric | Optimistic (12 months, 50+ creators) | Delta |
|--------|--------------------------------------|-------|
| Monthly sales | 1,400 | +40% |
| Affiliate commission cost | €500 | −€500 |
| **Net profit** | **€13,500** | **+35%** |

**Bottom line:** Even the conservative scenario pays for itself. The optimistic scenario requires 50+ active creators — achievable but not guaranteed in year one.

---

## 15. Revenue Streams — Monetizing Loot Squad & Credits Beyond Product Sales

> **Full details in separate doc: [`RevenueStreams.md`](RevenueStreams.md).** This section is a summary of how Loot Squad and BitLoot Credits generate revenue beyond the core product margin.

| Stream | System | How it works |
|--------|--------|-------------|
| **Payout conversion spread** | Loot Squad | 0.5–1% spread on EUR→stablecoin conversion when paying affiliates |
| **Creator-to-credits conversion** | Loot Squad + Credits | When creators convert earnings → promo credits, cash liability becomes product liability (~30% savings) |
| **Self-funded promo quests** | Loot Squad | BitLoot funds quest rewards from margin on promoted products; promo credit breakage reduces cost |
| **Top-up spread** | Credits | 1–3% baked into crypto→credit conversion rate |
| **Promo credit breakage** | Credits | 10–20% of promo credits expire unused = recovered marketing cost |
| **Float** | Credits | Pre-loaded balances smooth cash flow (interest-free capital) |
| **Bonus top-up promos** | Credits | "Top up €50, get €55" — drives top-up volume, bonus has breakage |
| **Credit-only flash sales** | Credits | Forces top-ups for exclusive deals |
| **Gift codes (external)** | Credits | Redeemable codes sold via third-party sites (PayPal, credit card) — opens non-crypto market |
| **Premium membership** | Cross-system | €4.99/mo subscription with cashback, exclusive deals, priority support — **Deferred to Phase 5+** (requires subscription billing system; not viable until 500+ active users) |
| **Buyer loyalty tiers** | Cross-system | Tiered cashback in promo credits based on lifetime spend |
| **Seasonal credit events** | Cross-system | Double cashback campaigns drive purchase spikes |

---

## 16. BitLoot Credits — Closed-Loop Balance System

> **⚠️ This is an independent feature with its own timeline.** BitLoot Credits does NOT depend on Loot Squad and vice versa. Full design, data model, and implementation plan should be documented in a separate `BitLoot-Credits.md` file. This section provides a summary for context on how the two systems integrate.

### 16.1 Summary

A BitLoot Credits system enables store-credit balances for faster checkout and locked-in spending. It functions as a **controlled closed-loop credits system** (not a wallet):

- **No peer-to-peer transfers.** No cash-out. No crypto withdrawal.
- **Three balance types:** Affiliate earnings (from Loot Squad, withdrawable as stablecoin), cash credits (from top-ups, never expire), and promo credits (from rewards, expire 90 days).
- **Promo credits spent first**, cash credits second. Affiliate earnings are a separate balance — not spendable at checkout directly (must convert to credits first).
- **Double-entry ledger** with `balance_after` snapshots for exact accounting.

### 16.2 Integration with Loot Squad

| Use case | Flow |
|----------|------|
| **Stablecoin payout (primary)** | Commissions accumulate in EUR earnings balance → creator requests payout (monthly batch, €15 min) → stablecoin sent to verified wallet. |
| **Convert to credits (convenience)** | Creator manually converts any amount (€1 min) from earnings → promo credits. One-way, irreversible, 90-day expiry. |
| **Quest rewards (Phase 3)** | Completing quests grants promo credits directly (not earnings). |
| **Milestone rewards (Phase 3)** | "Pick your reward" option can include credit amounts. |
| **Checkout** | Users can pay with credits, crypto, or a mix. Promo credits apply first, cash credits second, remaining paid in crypto. |

### 16.3 Rollout (independent of Loot Squad)

1. **V1: Promo credits only** — Quest rewards and buyer referral bonuses grant promo credits directly. Creators can manually convert affiliate earnings → promo credits (one-way). Users spend credits at checkout.
2. **V2: Cash credits (top-up)** — Users can load credits via crypto. Faster repeat checkout, stickier retention.
3. **V3: Cashback & loyalty** — X% back in promo credits on every purchase. Credit-only flash deals.

> **Full data model, fraud controls, and accounting rules:** See `BitLoot-Credits.md`.

---

## 17. Rollout Phases

### Phase 1 — Support-A-Creator MVP (2–3 weeks)

> **Goal:** Ship the simplest possible affiliate system, validate demand with 10–20 creators.

**Build:**
- **1 new table:** `affiliate_codes` + 1 column on `orders` (`ref_code`).
- **1 commission table:** `affiliate_commissions` (per-item, with margin fallback chain + €0.50 floor).
- **Backend:** Enroll endpoint, code validation, click-tracking redirect (`/r/:code`), commission processing BullMQ job.
- **Admin:** Affiliate list page + config page (commission rates, excluded categories, default margin %).
- **Checkout:** "Support a creator?" code field (always visible), attribution via cookie + localStorage.
- **Dashboard:** Loot Squad tab in `/profile` with balance, clicks, conversion rate, referred orders.

**Skip in Phase 1:** No tiers, no XP, no quests, no leaderboards, no credits, no payouts (commissions accrue but aren't paid out until Phase 2). No separate `affiliate_attributions` or `affiliate_transactions` tables.

**Scope:** Limited to 10–20 trusted creators for testing. Manual enrollment via admin.

### Phase 2 — Payouts, Ledger & Code Management (2–3 weeks)

- **Payout system:** Manual admin process — affiliate requests payout → admin reviews in `/admin/loot-squad/payouts` → admin sends USDT BEP20 manually → enters tx hash. Monthly batches (€15 min).
- **No automated payout provider** — fully manual for Phase 1–2.
- Creators can also manually convert earnings to BitLoot Credits for instant spending (opt-in convenience, one-way).
- **Transaction ledger:** `affiliate_transactions` table for full audit trail.
- **Code rotation:** `affiliate_code_history` table with old-code redirect mapping.
- **Wallet verification flow:** BEP20 address validation + 72-hour cooling period + IP recording on changes (see §7).
- **Sliding scale commission** auto-recalculation on rolling 30-day window.
- **Open enrollment** to more creators/communities (self-serve with admin approval).

### Phase 3 — Gamification & Community (4–6 weeks)

- XP, levels (concrete table from §5.1), badges.
- Seasonal leaderboards (public page) + lifetime prestige (never resets).
- Public creator profiles (`/loot-squad/@username`).
- Quest template system with automated daily/weekly rotation.
- Milestone "Pick Your Reward" system (deterministic, no loot boxes).
- Email notifications for level-ups, season results (Resend).
- **Buyer Referral Program** as separate simple system (§2).

### Phase 4 — Events, Expansion & Analytics (ongoing)

- Event quests tied to flash deals and marketing module.
- Creator storefronts (curated product pages).
- Self-funded promotional quests to push high-margin/slow-moving inventory.
- Advanced analytics: channel attribution (UTM), creator ROI, product-level affiliate performance.
- **Revenue stream features:** gift codes, buyer loyalty tiers (separate `RevenueStreams.md`). Premium membership deferred to Phase 5+ (requires subscription billing).
- **BitLoot Credits cash top-up** (separate `BitLoot-Credits.md`).

### Combined Build Order (Credits + Loot Squad together)

Since Credits and Loot Squad are being built together, the recommended implementation sequence is:

```
Week 1-2: Shared Foundation
├── Database migrations (all entities for Credits + Loot Squad)
├── Credit types, balance tracking, transaction ledger
└── Affiliate codes, attribution, commission tables

Week 3-4: Credits V1 (Promo Credits Only)
├── Promo credit grant/spend/expire services
├── Checkout integration (toggle + breakdown)
├── Admin credit management
└── Expiry cron job + email warnings

Week 5-6: Loot Squad Phase 1 (Core Affiliate)
├── Enrollment, code generation, click tracking
├── Attribution at checkout (code field + cookie/localStorage)
├── Commission calculation on fulfillment
├── Affiliate dashboard (profile tab)
└── Admin affiliate management

Week 7-8: Credits V2 (Cash Top-ups) + Integration
├── NOWPayments top-up flow
├── Underpayment → cash credit recovery
├── Mixed payment refunds
├── Conversion: earnings → promo credits
└── Full checkout flow (credits + crypto + affiliate code)

Week 9-10: Loot Squad Phase 2 (Payouts)
├── Payout request system
├── Admin payout review + manual send
├── Wallet validation (USDT BEP20)
├── Fraud scoring engine
└── Payout history + tx hash recording
```

Gamification (Phase 3), gift codes, and premium membership are all post-launch features.

---

## 18. Legal & Compliance

> **Non-negotiable requirements** that must be implemented before launching Loot Squad publicly.

### 18.1 Affiliate Terms of Service

All affiliates must accept a Terms of Service on enrollment. Key terms:

| Requirement | Detail |
|-------------|--------|
| **FTC disclosure** | Affiliates must clearly disclose their relationship when promoting BitLoot ("Affiliate link — I earn a commission"). BitLoot provides standard disclosure text. |
| **Prohibited methods** | No spam, no misleading claims ("free games"), no trademark bidding on ads, no fake reviews, no incentivized clicks. |
| **Content restrictions** | No hate speech, NSFW, or illegal content alongside BitLoot promotion. |
| **Termination** | BitLoot can suspend or ban affiliates at any time. Banned for fraud: promo credits + affiliate earnings forfeited; cash credits refunded (see §8 Suspension & Ban Policy). Decision is final; user can appeal via support. |
| **Tax responsibility** | Affiliates are responsible for reporting their own earnings. BitLoot provides annual earning summaries. |
| **IP rights** | Affiliates may use BitLoot branding per provided guidelines; no modification of logos/marks. |

### 18.2 Checkout disclosure

The checkout page must include a small disclosure near the creator code field:

> "The creator earns a commission on your purchase at no extra cost to you."

### 18.3 Regulatory notes

- **No gambling mechanics:** Milestone rewards are deterministic (pick your reward), not random. No paid rerolls. No loot boxes.
- **Credits are store credit, not currency:** No peer-to-peer transfers, no withdrawals. See `BitLoot-Credits.md` for regulatory analysis.
- **KYC deferred:** No identity verification in Phase 1–2. Admin manually reviews all payouts. KYC requirements will be evaluated later based on payout volumes and regulatory needs.

---

## 19. Revenue Impact — Why This Works

| Mechanism | Effect |
|-----------|--------|
| **Margin-based commission** | Predictable cost; never lose money on a referral |
| **€0.50 floor per item** | Keeps commissions meaningful even on low-margin products |
| **Sliding scale (not fixed tiers)** | Every sale improves the rate — continuous motivation |
| **Creator codes at checkout** | Zero friction; gamers already understand Support-A-Creator |
| **Earnings-first payout** | Creators trust the system — real money out, credit conversion as opt-in convenience |
| **Stablecoin payouts** | Eliminates volatility complaints for serious creators |
| **Click + UTM tracking** | Affiliates can optimize; BitLoot gets channel intelligence |
| **Guest checkout support** | Maximizes attribution — no registration wall |
| **Dual-sided buyer referral (Phase 3)** | New-buyer bonus benefits both referrer and referee |
| **Per-item commission** | Handles partial fulfillment cleanly; accurate accounting |
| **Fraud scoring** | Catches abuse before payout, not after |

### Success / failure factors

**Will succeed if:**
- Sharing flow is simple (one-click copy link with UTM).
- Commission is meaningful (€0.50+ per sale even worst case).
- Code entry at checkout is always visible and low-friction.
- Dashboard shows clicks AND orders (not just earnings).
- Payouts are simple — stablecoin monthly, credit conversion instant.
- Legal requirements are met from day one.

**Will fail if:**
- Commission too low to motivate (solved by €0.50 floor + 8% base).
- No click tracking (solved — `/r/:code` redirect with counter).
- Payouts delayed behind high threshold (solved — stablecoin at €15, credit conversion at €1).
- System feels hidden or complicated.
- It looks like a generic affiliate tool instead of a gaming rewards system.

---

## 20. References & Inspiration

- **Epic Games Support-A-Creator:** Creator tag at checkout, revenue share, creator pages on fortnite.com. Validated model for gaming audiences.
- **Green Man Gaming / G2A / Eneba:** 2–12% rev-share, tiered creator programs. Industry benchmarks for commission rates.
- **Gamified loyalty programs:** Starbucks (tiered), Domino's (game-linked points) — points + progress bars + tiers increase engagement 20–50%.
- **Stablecoin payroll patterns:** Bitwage, Deel — EUR/USD-locked value, stablecoin settlement eliminates volatility.
- **Store credit models:** Steam Wallet, PlayStation Store balance — closed-loop credits that lock spending into the platform.
- **FTC endorsement guidelines:** 16 CFR Part 255 — requires clear disclosure of affiliate relationships.
- **EU Unfair Commercial Practices Directive:** Requires transparency in influencer/affiliate marketing.