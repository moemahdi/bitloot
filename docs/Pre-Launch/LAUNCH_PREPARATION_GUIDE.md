# 🚀 BitLoot Production Launch Preparation Guide

**Created:** January 28, 2026  
**Status:** Pre-Launch Checklist  
**Objective:** Comprehensive step-by-step guide to prepare BitLoot for production deployment

---

## 📋 Table of Contents

1. [Overview & Launch Phases](#overview--launch-phases)
2. [Phase 1: Database Cleanup & Reset](#phase-1-database-cleanup--reset)
3. [Phase 2: Switch to Production APIs](#phase-2-switch-to-production-apis)
4. [Phase 3: Product Catalog Setup](#phase-3-product-catalog-setup)
5. [Phase 4: Frontend Polish & Bug Fixes](#phase-4-frontend-polish--bug-fixes)
6. [Phase 5: Admin Dashboard Review](#phase-5-admin-dashboard-review)
7. [Phase 6: Security & Performance Audit](#phase-6-security--performance-audit)
8. [Phase 7: Pre-Launch Testing](#phase-7-pre-launch-testing)
9. [Phase 8: Deployment & Go-Live](#phase-8-deployment--go-live)
10. [Post-Launch Monitoring](#post-launch-monitoring)

---

## Overview & Launch Phases

### Current State Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend (Next.js 16)** | ✅ Complete | 12+ user-facing pages, 12+ admin pages |
| **Backend (NestJS)** | ✅ Complete | 17 modules, 40+ migrations |
| **SDK** | ✅ Complete | Auto-generated from OpenAPI |
| **Database** | ⚠️ Needs Cleanup | Contains sandbox/test data |
| **Payments (NOWPayments)** | ⚠️ Sandbox Mode | Switch to production API |
| **Fulfillment (Kinguin)** | ⚠️ Sandbox Mode | Switch to production API |
| **Emails (Resend)** | ⚠️ Test Mode | Verify production domain |
| **Storage (R2)** | ✅ Ready | Production bucket configured |

### Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Database Cleanup | 1-2 hours | 🔴 Critical |
| Phase 2: Production APIs | 2-3 hours | 🔴 Critical |
| Phase 3: Product Catalog | 4-8 hours | 🔴 Critical |
| Phase 4: Frontend Polish | 4-8 hours | 🟡 High |
| Phase 5: Admin Review | 2-3 hours | 🟡 High |
| Phase 6: Security Audit | 2-4 hours | 🔴 Critical |
| Phase 7: Pre-Launch Testing | 4-8 hours | 🔴 Critical |
| Phase 8: Deployment | 2-4 hours | 🔴 Critical |
| **Total** | **21-40 hours** | |

---

## Phase 1: Database Cleanup & Reset ✅ COMPLETED

> **📝 Completed:** January 30, 2026 — All sandbox data cleared, admin user retained (`bitloot.biz@gmail.com`).

> **📝 Note:** This cleanup removes **data only**, not tables. Your schema, columns, indexes, and relationships remain intact — just emptied of test data.

### 1.1 Backup Current Database (Optional - For Reference)

```bash
# Create backup of sandbox data (optional - for debugging reference)
docker exec bitloot-db pg_dump -U bitloot bitloot > backup_sandbox_$(date +%Y%m%d).sql
```

### 1.2 Identify Tables to Clean

The following tables contain test/sandbox data that should be cleaned:

| Table | Action | Reason |
|-------|--------|--------|
| `orders` | **TRUNCATE** | All sandbox test orders |
| `order_items` | **TRUNCATE** | Linked to orders |
| `keys` | **TRUNCATE** | Test keys from sandbox |
| `payments` | **TRUNCATE** | Sandbox payment records |
| `webhook_logs` | **TRUNCATE** | Sandbox webhook history |
| `audit_logs` | **TRUNCATE** | Test admin actions |
| `reviews` | **TRUNCATE** | Test reviews |
| `watchlist_items` | **TRUNCATE** | Test user watchlists |
| `promo_redemptions` | **TRUNCATE** | Test promo uses |
| `sessions` | **TRUNCATE** | Old sessions |
| `products` | **SELECTIVE** | Keep structure, remove test products |
| `product_groups` | **SELECTIVE** | Keep structure, remove test groups |
| `flash_deals` | **TRUNCATE** | Test deals |
| `bundle_deals` | **TRUNCATE** | Test bundles |
| `users` | **KEEP** | Keep admin user, remove test users |
| `pricing_rules` | **KEEP** | Keep global rules |
| `feature_flags` | **KEEP** | Keep configuration |
| `system_config` | **KEEP** | Keep configuration |

### 1.3 Database Cleanup Script

Create a cleanup SQL script:

```sql
-- ============================================
-- BitLoot Production Database Cleanup Script
-- Run this BEFORE switching to production APIs
-- ============================================

BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- 1. Clear all order-related data
TRUNCATE TABLE keys CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE payments CASCADE;

-- 2. Clear webhook and audit logs
TRUNCATE TABLE webhook_logs CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

-- 3. Clear marketing data
TRUNCATE TABLE flash_deal_products CASCADE;
TRUNCATE TABLE flash_deals CASCADE;
TRUNCATE TABLE bundle_products CASCADE;
TRUNCATE TABLE bundle_deals CASCADE;
TRUNCATE TABLE section_analytics CASCADE;

-- 4. Clear user activity data
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE watchlist_items CASCADE;
TRUNCATE TABLE promo_redemptions CASCADE;
TRUNCATE TABLE sessions CASCADE;

-- 5. Clear test products (keep none initially - we'll add real ones)
TRUNCATE TABLE product_group_members CASCADE;
TRUNCATE TABLE product_groups CASCADE;
TRUNCATE TABLE product_offers CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE pricing_rules CASCADE;

-- 6. Reset sequences
SELECT setval(pg_get_serial_sequence('orders', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('payments', 'id'), 1, false);

-- 7. Keep admin user, remove test users
DELETE FROM users WHERE email NOT LIKE '%@bitloot.io' AND role != 'admin';

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

COMMIT;

-- Verify cleanup
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'users', COUNT(*) FROM users;
```

### 1.4 Run Cleanup

```bash
# Connect to database and run cleanup
docker exec -i bitloot-db psql -U bitloot bitloot < cleanup_script.sql

# Or run interactively
docker exec -it bitloot-db psql -U bitloot bitloot
# Then paste the SQL script
```

### 1.5 Verify Cleanup

```bash
# Check tables are empty
docker exec bitloot-db psql -U bitloot bitloot -c "
SELECT 'orders' as table_name, COUNT(*) FROM orders
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'payments', COUNT(*) FROM payments;"

# Expected: All counts = 0 (except users if admin kept)
```

---

## Phase 2: Switch to Production APIs

### 2.1 NOWPayments Production Setup

#### Step 1: Get Production Credentials

1. Log in to [NOWPayments Dashboard](https://account.nowpayments.io/)
2. Navigate to **API Settings**
3. Create/copy your **Production API Key**
4. Navigate to **IPN Settings**
5. Copy your **IPN Secret Key**
6. Set your **IPN Callback URL** to: `https://api.yourdomain.com/webhooks/nowpayments/ipn`

#### Step 2: Update Environment Variables

```bash
# .env.production (create this file)

# NOWPayments PRODUCTION (not sandbox!)
NOWPAYMENTS_API_KEY=your_production_api_key_here
NOWPAYMENTS_IPN_SECRET=your_production_ipn_secret_here
NOWPAYMENTS_BASE=https://api.nowpayments.io/v1
NOWPAYMENTS_CALLBACK_URL=https://api.yourdomain.com/webhooks/nowpayments/ipn
```

#### Step 3: Verify API Connection

```bash
# Test production API key
curl -X GET "https://api.nowpayments.io/v1/status" \
  -H "x-api-key: YOUR_PRODUCTION_API_KEY"

# Expected: {"message": "OK"}
```

### 2.2 Kinguin Production Setup

#### Step 1: Get Production Credentials

1. Log in to [Kinguin Integration Dashboard](https://www.kinguin.net/integration/dashboard)
2. Navigate to **Stores** → Select your store
3. Copy your **API Key** (32 characters)
4. Navigate to **Webhooks**
5. Configure webhook URL: `https://api.yourdomain.com/kinguin/webhooks`
6. Copy your **Webhook Secret**

#### Step 2: Update Environment Variables

```bash
# .env.production

# Kinguin PRODUCTION
KINGUIN_API_KEY=your_32_character_api_key_here
KINGUIN_BASE_URL=https://gateway.kinguin.net/esa/api
KINGUIN_WEBHOOK_SECRET=your_webhook_secret_here
```

#### Step 3: Verify API Connection

```bash
# Test Kinguin API
curl -X GET "https://gateway.kinguin.net/esa/api/v1/products?limit=1" \
  -H "X-Api-Key: YOUR_KINGUIN_API_KEY"

# Expected: Product listing response (not error)
```

### 2.3 Resend Email Production Setup

> **⚠️ Prerequisite:** You must **own a domain first** before configuring Resend. Without a verified domain, emails can only be sent to your own account email.

#### Step 1: Verify Domain

1. **Buy a domain** (e.g., `bitloot.io`) if you don't have one
2. Log in to [Resend Dashboard](https://resend.com/domains)
3. Add your production domain
4. Configure DNS records (SPF, DKIM, DMARC) at your domain registrar
5. Wait for verification (usually minutes, can take up to 72 hours)

#### Step 2: Update Environment Variables

```bash
# .env.production

# Resend PRODUCTION
RESEND_API_KEY=re_your_production_api_key
EMAIL_FROM=no-reply@bitloot.io
EMAIL_UNSUBSCRIBE_URL_BASE=https://bitloot.io/emails/unsubscribe
```

### 2.4 Cloudflare Turnstile Production

```bash
# .env.production

# Turnstile PRODUCTION
TURNSTILE_SITE_KEY=your_production_site_key
TURNSTILE_SECRET_KEY=your_production_secret_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_production_site_key
TURNSTILE_ENABLED=true
```

### 2.5 Security Secrets

```bash
# .env.production

# CRITICAL: Generate strong random secrets for production!
# Use: openssl rand -base64 64

JWT_SECRET=generate_a_64_character_random_string_here_very_secure
REFRESH_TOKEN_SECRET=another_64_character_random_string_different_from_jwt

# CORS - Update to your production domain
CORS_ORIGIN=https://bitloot.io,https://www.bitloot.io
```

### 2.6 Complete Production .env Template

> **💡 Tip:** Set these via your **hosting platform's dashboard** (Railway, Render, Vercel, etc.) — not the BitLoot admin panel. API keys and secrets must be environment variables, not database config.

```bash
# ============================================
# BitLoot Production Environment Configuration
# ============================================

# API
API_PORT=4000
NODE_ENV=production

# Database (use your production database URL)
DATABASE_URL=postgres://user:password@your-db-host:5432/bitloot_production

# Redis (use your production Redis)
REDIS_URL=redis://your-redis-host:6379

# Security (GENERATE NEW SECRETS!)
JWT_SECRET=<generate-64-char-secret>
REFRESH_TOKEN_SECRET=<generate-64-char-secret>
CORS_ORIGIN=https://bitloot.io,https://www.bitloot.io

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=bitloot-keys-production
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# NOWPayments (PRODUCTION)
NOWPAYMENTS_API_KEY=<production-api-key>
NOWPAYMENTS_IPN_SECRET=<production-ipn-secret>
NOWPAYMENTS_BASE=https://api.nowpayments.io/v1
NOWPAYMENTS_CALLBACK_URL=https://api.bitloot.io/webhooks/nowpayments/ipn

# Kinguin (PRODUCTION)
KINGUIN_API_KEY=<production-api-key>
KINGUIN_BASE_URL=https://gateway.kinguin.net/esa/api
KINGUIN_WEBHOOK_SECRET=<production-webhook-secret>

# Resend Emails (PRODUCTION)
RESEND_API_KEY=<production-api-key>
EMAIL_FROM=no-reply@bitloot.io
EMAIL_UNSUBSCRIBE_URL_BASE=https://bitloot.io/emails/unsubscribe

# Cloudflare Turnstile (PRODUCTION)
TURNSTILE_SITE_KEY=<production-site-key>
TURNSTILE_SECRET_KEY=<production-secret-key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<production-site-key>
TURNSTILE_ENABLED=true

# Observability
PROMETHEUS_ENABLED=true
LOG_LEVEL=info
STRUCTURED_LOG_FORMAT=json
```

---

## Phase 3: Product Catalog Setup

### 3.1 Initial Product Strategy

**Recommended Approach:**
1. Start with a small curated catalog (20-50 products)
2. Focus on popular, high-demand games
3. Set competitive pricing with healthy margins
4. Gradually expand based on sales data

### 3.2 Product Categories to Add

| Category | Priority | Initial Count |
|----------|----------|---------------|
| AAA Games (Steam) | 🔴 High | 10-15 |
| Indie Games (Steam) | 🟡 Medium | 5-10 |
| PlayStation Games | 🔴 High | 5-10 |
| Xbox Games | 🟡 Medium | 3-5 |
| Nintendo eShop | 🟡 Medium | 2-3 |
| Software (Windows) | 🟢 Low | 2-3 |

### 3.3 Kinguin Sync Strategy

**Option A: Manual Selection (Recommended for Launch)**
- Use admin panel to search and add specific products
- Set custom prices with margin rules
- Full control over catalog quality

**Option B: Automated Sync (Post-Launch)**
- Sync entire Kinguin catalog
- Apply global pricing rules
- Filter by category/platform

### 3.4 Adding Products via Admin Panel

1. Navigate to `/admin/catalog/products`
2. Click "Add Product" or use Kinguin Import
3. For each product:
   - Search by Kinguin product ID or name
   - Review product details
   - Set your retail price (apply markup)
   - Add to groups if variants exist
   - Publish when ready

### 3.5 Pricing Strategy

#### Operational Costs (Per Transaction)

| Cost Component | Amount | Notes |
|----------------|--------|-------|
| NOWPayments Fee | ~1% | Crypto payment processing |
| Cloudflare R2 | ~€0.01 | Key storage & delivery |
| Resend Emails | ~€0.01 | 2-3 emails per order |
| Infrastructure | ~€0.05 | Server, Redis, DB share |
| **Total Fixed** | **~€0.07 + 1%** | Per transaction |

#### Recommended Tiered Markup Strategy

| Cost Range | Markup | Example (Cost → Sell) | Net Profit |
|------------|--------|----------------------|------------|
| Budget (<€8) | 35% | €5 → €6.75 | ~€1.63 |
| Standard (€8-€25) | 25% | €10 → €12.49 | ~€2.24 |
| Mid-Tier (€25-€45) | 20% | €30 → €36.00 | ~€5.57 |
| Premium (€45-€70) | 15% | €50 → €57.50 | ~€6.85 |
| AAA/Deluxe (>€70) | 12% | €80 → €89.60 | ~€8.64 |

**Minimum Price Floor:** €5 (NOWPayments may fail on micro-payments)

#### Product Type Margins

| Product Type | Cost Range | Recommended Markup |
|--------------|------------|-------------------|
| AAA Games | €40-80 | 12-15% |
| Standard Games | €15-40 | 20-25% |
| Indie Games | €5-15 | 30-35% |
| Software | €30-150 | 15-20% |
| Subscriptions | €10-100 | 15-20% |
| DLC/Add-ons | €5-25 | 25-30% |

**Create Pricing Rules in Admin:**
1. Navigate to `/admin/catalog/rules`
2. Create tiered rules by cost range:
   - Budget (<€8): 35% margin
   - Standard (€8-€25): 25% margin
   - Mid-Tier (€25-€45): 20% margin
   - Premium (€45-€70): 15% margin
   - AAA/Deluxe (>€70): 12% margin
3. Set minimum price floor: €5

### 3.6 Product Checklist

For each product before publishing:

- [ ] Title is accurate and appealing
- [ ] Description is complete
- [ ] Cover image loads correctly
- [ ] Platform/region is correct
- [ ] Price is competitive
- [ ] Stock is available on Kinguin
- [ ] Category is assigned
- [ ] Published flag is enabled

---

## Phase 4: Frontend Polish & Bug Fixes

### 4.1 User-Facing Pages Checklist

#### Homepage (`/`) ✅ REVIEWED
- [x] Hero section loads correctly
- [x] Flash deals section shows active deals (or hides if none)
- [x] Trending products display correctly
- [x] Featured products by type tabs work
- [x] Bundle deals section works
- [x] Category browser links work
- [x] Benefits section displays
- [x] Social proof / live feed works (or is realistic mock)
- [x] FAQ accordion works
- [x] CTA section links work *(fixed /support → /help)*
- [x] All images load (no broken images)
- [x] Mobile responsive (test at 375px, 768px, 1024px)


#### Catalog Page (`/catalog`)
- [x] Products load correctly
- [x] Search works (full-text search)
- [x] Platform filter works
- [x] Category filter works
- [x] Region filter works
- [x] Sort options work (price, name, newest)
- [x] Pagination works
- [x] View mode toggle (grid/list) works
- [x] Empty state displays correctly
- [x] Loading skeleton shows during load
- [x] Error state shows on API failure
- [x] Mobile filters sheet works

#### Product Detail Page (`/product/[id]`)
- [x] Product info loads correctly
- [x] Cover image displays
- [x] Screenshots gallery works
- [x] System requirements display (if applicable)
- [x] Price displays correctly (with currency)
- [x] Flash deal price shows (if active)
- [x] Add to cart button works
- [x] Add to wishlist works (authenticated)
- [x] Reviews section loads
- [x] Related products display
- [x] Trust badges display
- [x] Crypto payment banner shows
- [x] Back button works
- [x] Share functionality works

#### Cart Page (`/cart`)
- [x] Cart items display correctly
- [x] Quantity can be updated
- [x] Items can be removed
- [x] Clear cart works
- [x] Promo code input works
- [x] Promo validation shows success/error
- [x] Total calculates correctly
- [x] Savings displays correctly
- [x] Checkout button works
- [x] Empty cart state displays
- Add auto-redire ct to checkout if 1 item in cart 

#### Checkout Page (`/checkout`)
- [x] Cart summary displays
- [x] Email input works
- [x] Email validation works
- [x] CAPTCHA loads and validates
- [x] Create order works
- [x] Redirects to payment page
- [x] Error handling works
- [x] Loading state displays
- [x] Empty cart state displays with link to catalog

#### Order Status Page (`/orders/[id]`) ✅ REVIEWED
- [x] Order details load
- [x] Status displays correctly
- [x] Status timeline works (progress bar with 4 stages)
- [x] Payment info displays
- [x] Items list displays (paginated, grouped by product)
- [x] Key reveal works (for fulfilled orders)
- [x] Copy key functionality works
- [x] ~~Download key works~~ *(not needed - copy works)*
- [x] ~~Email resend works~~ *(not needed - already sent on fulfillment)*
- [x] Guest access with session token works
- [x] Authentication required message (if needed)

#### Profile Page (`/profile`) ✅ REVIEWED
- [x] User info displays *(welcome banner, avatar, badges, role)*
- [x] Orders tab works with pagination *(Purchases tab: 10/page, filters, search)*
- [x] Order details expandable *(click to expand, KeyReveal for fulfilled)*
- [x] Watchlist tab loads *(stats cards, grid/list view, search, sort)*
- [x] Watchlist items can be removed *(trash button, toast confirmation)*
- [x] Add all to cart works *("Add All (X)" button with toast)*
- [x] Security tab works *(OTP status, email, sessions, deletion)*
- [x] Active sessions display *(device info, IP masked, pagination)*
- [x] Revoke session works *(confirmation dialog, "Revoke All Others")*
- [x] Account settings tab works *(profile card, User ID, role, stats)*
- [x] Email change (dual OTP) works *(OTP to both old and new email)*
- [x] Account deletion request works *(30-day grace, type "DELETE" confirm)*
- [x] Logout works *(button in banner, toast confirmation)*

#### Auth Pages (`/auth/login`) ✅ REVIEWED
- [x] OTP request form works *(onEmailSubmit → authClient.requestOtp())*
- [x] Email validation works *(Zod schema z.string().email(), error display)*
- [x] OTP input (6 digits) works *(InputOTP with 6 slots, Controller integration)*
- [x] OTP verification works *(onOTPSubmit → authClient.verifyOtp())*
- [x] Error messages display *(Alert component for API/validation errors)*
- [x] Rate limiting message shows *(SDK parses 429 error, shown in Alert)*
- [x] Redirect after login works *(router.push(returnTo), supports redirect/returnTo params)*
- [x] Remember me / session persistence *(cookies for tokens, localStorage for user, auto-restore on mount)*

### 4.2 Error Pages ✅ REVIEWED

- [x] `/not-found` - 404 page displays correctly *(115 lines, glass card, catalog/home links)*
- [x] `/error` - Error boundary works *(reset() retry, dev debug info, error logging)*
- [x] `/forbidden` - 403 page displays *(ShieldOff icon, Home/Sign In buttons)*
- [x] `/maintenance` - Maintenance mode works *(provider wraps app, admin bypass, 30s polling)*

### 4.3 Common Frontend Issues to Check

| Issue | Where to Check | Fix |
|-------|----------------|-----|
| Broken images | Product cards, detail pages | Verify image URLs, add fallback |
| Console errors | All pages (DevTools) | Fix JS errors, missing deps |
| Layout shift | Homepage, catalog | Add explicit heights to images |
| Slow loading | Large pages | Add loading skeletons |
| Form validation | Checkout, login | Test all edge cases |
| Mobile menu | Header on mobile | Test hamburger menu |
| Cart persistence | Cart page | Test localStorage |
| Auth state | Protected pages | Test login/logout cycle |

### 4.4 Design System Consistency ✅ REVIEWED

Check all pages use correct:
- [x] Color tokens (no hardcoded hex values) *(tokens used throughout; exceptions: Recharts/Framer Motion need hex)*
- [x] Typography scale (text-sm, text-lg, etc.) *(consistent Tailwind scale)*
- [x] Spacing (consistent padding/margins) *(p-4, gap-4, space-y-4 patterns)*
- [x] Border radius (rounded-lg, rounded-md) *(20+ consistent usages)*
- [x] Shadows (shadow-card-md, shadow-glow-cyan) *(20+ matches verified)*
- [x] Buttons (btn-primary, btn-secondary) *(20+ usages across pages)*
- [x] Badges (badge-success, badge-warning) *(20+ usages in admin/status)*
- [x] Form inputs (input-glow) *(20+ usages in admin forms)*

---

## Phase 5: Admin Dashboard Review

### 5.1 Admin Pages Checklist

#### Dashboard (`/admin`)
- [ ] Stats cards load correctly
- [ ] Revenue chart displays
- [ ] Recent orders table works
- [ ] Order status distribution chart works
- [ ] Quick actions work
- [ ] System health indicators work
- [ ] Kinguin balance displays
- [ ] Auto-refresh works

#### Orders (`/admin/orders`)
- [ ] Orders table loads
- [ ] Search by email works
- [ ] Filter by status works
- [ ] Filter by date range works
- [ ] Sort works
- [ ] Pagination works
- [ ] Order detail modal works
- [ ] Status update works
- [ ] Resend keys email works
- [ ] Retry fulfillment works
- [ ] Bulk select works
- [ ] Export CSV works
- [ ] Analytics widgets display

#### Payments (`/admin/payments`)
- [ ] Payments table loads
- [ ] Search works
- [ ] Filter by status works
- [ ] Payment detail modal works (4 tabs)
- [ ] IPN history viewer works
- [ ] Manual status override works
- [ ] Auto-refresh pending payments
- [ ] Statistics cards display
- [ ] Export works

#### Products (`/admin/catalog/products`)
- [ ] Products table loads
- [ ] Search works
- [ ] Filter by platform works
- [ ] Filter by category works
- [ ] Filter by status works
- [ ] Publish/unpublish toggle works
- [ ] Edit product works
- [ ] Delete product works
- [ ] Pagination works
- [ ] Create product works

#### Pricing Rules (`/admin/catalog/rules`)
- [ ] Rules table loads
- [ ] Create rule works
- [ ] Edit rule works
- [ ] Delete rule works
- [ ] Rule priority works
- [ ] Live price preview works

#### Kinguin Sync (`/admin/catalog/sync`)
- [ ] Sync status displays
- [ ] Start sync works
- [ ] Progress tracking works
- [ ] Sync history displays
- [ ] Error handling works

#### Product Groups (`/admin/catalog/groups`)
- [ ] Groups list loads
- [ ] Create group works
- [ ] Add products to group works
- [ ] Remove products works
- [ ] Edit group works
- [ ] Delete group works

#### Promos (`/admin/promos`)
- [ ] Promo codes list loads
- [ ] Create promo works
- [ ] Edit promo works
- [ ] Toggle active works
- [ ] Redemption history works
- [ ] Delete promo works

#### Reviews (`/admin/reviews`)
- [ ] Reviews list loads
- [ ] Filter by status works
- [ ] Approve review works
- [ ] Reject review works
- [ ] Bulk actions work
- [ ] Homepage curation works

#### Marketing (`/admin/marketing/*`)
- [ ] Flash deals management works
- [ ] Bundle deals management works
- [ ] Product assignment works
- [ ] Scheduling works

#### Webhooks (`/admin/webhooks`)
- [ ] Webhook logs load
- [ ] Filter by source works
- [ ] Filter by status works
- [ ] Detail view works
- [ ] Replay failed webhook works
- [ ] Timeline chart displays

#### Balances (`/admin/balances`)
- [ ] Kinguin balance displays
- [ ] Spending stats display
- [ ] Balance history chart works
- [ ] Profit analytics tab works
- [ ] Alert thresholds work

#### Queues (`/admin/queues`)
- [ ] Queue status displays
- [ ] Job counts show
- [ ] Refresh works

#### Feature Flags (`/admin/flags`)
- [ ] Flags load correctly
- [ ] Toggle works
- [ ] Confirmation modal works
- [ ] State persists

#### Audit Logs (`/admin/audit`)
- [ ] Logs load with pagination
- [ ] Filter by action works
- [ ] Filter by date works
- [ ] Search works
- [ ] Export CSV works
- [ ] Export JSON works

---

## Phase 6: Security & Performance Audit

### 6.1 Security Checklist

#### Authentication
- [x] JWT tokens expire correctly (15min access, 7d refresh)
  - ✅ Access: `expiresIn: '15m'` in auth.service.ts L51, auth.module.ts L53
  - ✅ Refresh: `expiresIn: '7d'` in auth.service.ts L58, L125
- [x] Refresh token rotation works
  - ✅ `refreshTokens()` issues new pair on every refresh (auth.service.ts L92-141)
  - ✅ Refresh tokens marked with `type: 'refresh'` to prevent misuse
- [x] OTP rate limiting works (5 requests/15min)
  - ✅ Updated to 5 requests per 15 minutes (more user-friendly)
  - ✅ Redis key: `otp:ratelimit:send:${email}` with 900s TTL
  - ✅ Returns 429 TOO_MANY_REQUESTS when exceeded
- [x] Session invalidation works
  - ✅ `revokeSession()` - single device logout (session.service.ts L293)
  - ✅ `revokeAllSessions()` - all devices logout (session.service.ts L318)
  - ✅ `revokeByRefreshToken()` - current session logout (session.service.ts L345)
  - ✅ Refresh tokens stored as SHA256 hashes, never plain

#### Authorization
- [x] Admin routes protected by AdminGuard
  - ✅ 20+ admin controllers use `@UseGuards(JwtAuthGuard, AdminGuard)`
  - ✅ admin.controller.ts, promos.controller.ts, admin-reviews.controller.ts, etc.
- [x] User routes protected by JwtAuthGuard
  - ✅ users.controller.ts, watchlist.controller.ts, reviews.controller.ts
  - ✅ fulfillment.controller.ts, orders.controller.ts (user endpoints)
- [x] Ownership checks in services
  - ✅ `findUserOrderOrThrow(orderId, userId)` in orders.service.ts L651
  - ✅ "Verify ownership" checks in fulfillment, reviews, storage services
  - ✅ ForbiddenException thrown if resource belongs to another user
- [x] No unauthorized data access
  - ✅ All user queries filter by userId
  - ✅ Services throw NotFoundException/ForbiddenException on unauthorized access

#### API Security
- [x] CORS configured correctly
  - ✅ `app.enableCors()` in main.ts L17-20
  - ✅ Origin from `CORS_ORIGIN` env var (comma-separated domains)
  - ✅ Credentials enabled for cookie-based auth
- [x] Rate limiting enabled
  - ✅ ThrottlerModule in app.module.ts L51-64
  - ✅ Default: 100 requests/60s for general endpoints
  - ✅ Strict: 10 requests/60s for webhooks/IPN
  - ✅ `@Throttle` decorators on sensitive endpoints (payments, webhooks)
- [x] Input validation on all endpoints
  - ✅ Global ValidationPipe in main.ts L39-44
  - ✅ `whitelist: true` strips unknown properties
  - ✅ `forbidNonWhitelisted: true` rejects unknown properties
  - ✅ 20+ DTOs with class-validator decorators (IsEmail, IsUUID, etc.)
- [x] SQL injection prevented (TypeORM)
  - ✅ All queries use TypeORM repositories (`findOne`, `find`, `createQueryBuilder`)
  - ✅ No raw SQL queries with string concatenation
  - ✅ Parameterized queries via TypeORM's query builder
- [x] XSS prevented (React escaping)
  - ✅ React auto-escapes all text content by default
  - ✅ No `dangerouslySetInnerHTML` usage found
  - ✅ User input never rendered as HTML

#### Webhook Security
- [x] HMAC verification enabled
  - ✅ HMAC-SHA512 in ipn-handler.service.ts L309
  - ✅ `crypto.createHmac('sha512', secret).update(payload).digest('hex')`
  - ✅ Also in hmac-verification.util.ts, kinguin-webhooks.controller.ts
- [x] Timing-safe comparison used
  - ✅ `crypto.timingSafeEqual()` in 7 locations
  - ✅ ipn-handler.service.ts L327, hmac-verification.util.ts L44
  - ✅ kinguin-webhooks.controller.ts L75, deletion-token.util.ts L96
  - ✅ email-unsubscribe.service.ts L54 (for unsubscribe tokens)
- [x] Webhook replay prevention works
  - ✅ WebhookLog entity stores all processed webhooks
  - ✅ Idempotency via unique constraint on externalId
  - ✅ Duplicate detection in ipn-handler.service.ts
  - ✅ Tests: "should detect duplicate webhooks" (spec file)
- [x] IPN secret not exposed
  - ✅ No secrets in frontend source (`apps/web/src/`)
  - ✅ Only UI labels found (`nowpayments_ipn` = display text)
  - ✅ Secrets read from `process.env` server-side only

#### Data Security
- [x] Keys encrypted (AES-256-GCM)
  - ✅ `encryption.util.ts` with `createCipheriv`/`createDecipheriv`
  - ✅ CIPHER_ALGORITHM = 'aes-256-gcm' (L27)
  - ✅ Random IV per encryption, auth tag for integrity
  - ✅ storage.service.ts encrypts before R2 upload
- [x] Signed URLs expire (configurable, default 15min-3hr)
  - ✅ `generateSignedUrl()` in r2.client.ts (default: 900s = 15min)
  - ✅ `uploadAndGetSignedUrl()` accepts `expiresInMinutes` param
  - ✅ Production default: 180 minutes (configurable per-call)
  - ✅ Keys never exposed directly, only via short-lived signed URLs
- [x] No secrets in frontend
  - ✅ Only `NEXT_PUBLIC_*` vars in frontend (safe public keys)
  - ✅ All API keys (`NOWPAYMENTS_API_KEY`, `KINGUIN_API_KEY`, `RESEND_API_KEY`, `R2_SECRET_ACCESS_KEY`) server-side only
  - ✅ JWT_SECRET, IPN_SECRET only in `process.env` on backend
- [x] Environment variables secured
  - ✅ All secrets via `process.env.*` (20+ usages in backend)
  - ✅ Fallback defaults only for development (e.g., 'dev-secret-key')
  - ✅ Production requires proper env vars in hosting platform

### 6.2 Performance Checklist

#### Frontend
- [x] Images optimized (next/image)
  - ✅ 20+ components use `import Image from 'next/image'`
  - ✅ All images have `sizes` attribute for responsive loading (20+ usages)
  - ✅ `priority={true}` for above-the-fold images (CatalogProductCard, ProductCard, Hero)
  - ✅ `loading="lazy"` for below-the-fold (RecommendedForYou, TrendingNowGrid, crypto-icons)
  - ✅ next.config.mjs: `minimumCacheTTL: 2592000` (30-day cache), `deviceSizes`, `imageSizes` configured
- [x] Code splitting works
  - ✅ Next.js 16 with Turbopack provides automatic route-based code splitting
  - ✅ App Router architecture: each page/layout in separate chunk
  - ✅ Build output shows per-page chunks (validated in .next/dev/static/chunks)
  - ✅ React Compiler enabled (`reactCompiler: true` in next.config.mjs)
- [x] Lazy loading implemented
  - ✅ `loading="lazy"` on below-the-fold images (RecommendedForYou L197, TrendingNowGrid L240)
  - ✅ `loading="lazy"` on crypto icons (crypto-icons.tsx L106)
  - ✅ Pattern: `priority={index < 4}` prioritizes first 4 items, lazy loads rest
- [x] Bundle size acceptable (<500KB)
  - ✅ First-load JS: **401KB raw / 116KB gzipped** (well under 500KB target)
  - ✅ Turbopack code-splitting: 5.8MB total split across 42 pages
  - ✅ Largest route chunk: 407KB raw / 105KB gzipped (lazy-loaded per route)
  - ✅ Build: `next build` completed successfully in 68s
- [x] First contentful paint <2s
  - ✅ **FCP: 0.4s** (excellent - well under 2s target)
  - ✅ CLS: 0.006 (excellent - no layout shift)
- [ ] Lighthouse score >80 *(currently 41 - needs optimization)*
  - ❌ Performance: 41 (target: >80)
  - ✅ Accessibility: 86, Best Practices: 96, SEO: 100
  - ⚠️ TBT: 5,500ms (main issue - JS blocking main thread)
  - ⚠️ LCP: 3.7s, Speed Index: 3.9s
  - **Optimization needed:** Reduce client-side JS, defer non-critical scripts, optimize hydration

#### Backend
- [ ] Database indexes exist on hot paths
- [ ] Pagination on all list endpoints
- [ ] Query optimization (no N+1)
- [ ] Redis caching for catalog
- [ ] BullMQ for async tasks

#### Infrastructure
- [ ] CDN configured (Cloudflare)
- [ ] Gzip compression enabled
- [ ] HTTP/2 enabled
- [ ] SSL/TLS configured

### 6.3 SEO Checklist

- [ ] Meta titles on all pages
- [ ] Meta descriptions on all pages
- [ ] Open Graph tags for sharing
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Canonical URLs set

---

## Phase 7: Pre-Launch Testing

### 7.1 End-to-End Test Scenarios

#### Scenario 1: Guest Checkout Flow
1. Browse catalog
2. Add product to cart
3. Go to checkout
4. Enter email
5. Complete CAPTCHA
6. Redirect to payment
7. (Simulate payment completion)
8. Receive order confirmation
9. Access keys via link

#### Scenario 2: Registered User Flow
1. Log in with OTP
2. Browse and add to cart
3. Apply promo code
4. Checkout
5. Complete payment
6. View order in profile
7. Download keys

#### Scenario 3: Admin Operations
1. Log in as admin
2. View dashboard
3. Manage product
4. Process order
5. View webhooks
6. Export data

### 7.2 Payment Testing

**Before going live, test with small amounts:**

1. Create a test order with lowest-price product
2. Pay with real crypto (small amount)
3. Verify:
   - Payment detected
   - Order marked paid
   - Keys delivered
   - Email sent
   - Key downloadable

### 7.3 Load Testing (Optional)

```bash
# Basic load test with k6 or similar
k6 run --vus 10 --duration 30s load-test.js
```

---

## Phase 8: Deployment & Go-Live (Railway)

> **Stack:** GitHub + Railway + Hostinger

### 8.1 Pre-Deployment Checklist

- [ ] All tests passing: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Quality gates pass: `npm run quality:full`
- [ ] Code pushed to GitHub `main` branch
- [ ] Production environment variables ready (see Phase 2)

### 8.2 Railway Project Setup

#### Step 1: Create Railway Account & Project

1. Go to [railway.app](https://railway.app) and sign up with **GitHub**
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: `bitloot-production`

#### Step 2: Add Database & Redis (2 clicks)

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Click **"+ New"** → **"Database"** → **"Redis"**
3. Click on PostgreSQL → **Variables** tab → Copy `DATABASE_URL`
4. Click on Redis → **Variables** tab → Copy `REDIS_URL`

#### Step 3: Deploy Backend API

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your **bitloot** repository
3. Railway will detect your monorepo
4. Click on the new service → **Settings**:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Go to **Variables** tab → Add all backend env vars:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=<paste from PostgreSQL>
REDIS_URL=<paste from Redis>
JWT_SECRET=<generate-64-char-secret>
REFRESH_TOKEN_SECRET=<generate-64-char-secret>
NOWPAYMENTS_API_KEY=<your-production-key>
NOWPAYMENTS_IPN_SECRET=<your-ipn-secret>
NOWPAYMENTS_BASE=https://api.nowpayments.io/v1
KINGUIN_API_KEY=<your-production-key>
KINGUIN_BASE_URL=https://gateway.kinguin.net/esa/api
KINGUIN_WEBHOOK_SECRET=<your-webhook-secret>
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET=bitloot-keys-production
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=no-reply@yourdomain.com
TURNSTILE_SECRET_KEY=<your-secret-key>
```

6. Go to **Settings** → **Networking** → Click **"Generate Domain"**
7. Copy the URL (e.g., `bitloot-api-production.up.railway.app`)

#### Step 4: Deploy Frontend Web

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the **same bitloot repository** again
3. Click on the new service → **Settings**:
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Go to **Variables** tab → Add frontend env vars:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://bitloot-api-production.up.railway.app
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-site-key>
```

5. Go to **Settings** → **Networking** → Click **"Generate Domain"**
6. Copy the URL (e.g., `bitloot-web-production.up.railway.app`)

#### Step 5: Run Database Migrations (One-Time)

Option A: Use Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations against production DB
railway run npm --workspace apps/api run migration:run
```

Option B: Temporary Start Command
1. Edit API service **Start Command** to:
   ```bash
   npm run migration:run && npm run start:prod
   ```
2. Deploy once, then change back to just `npm run start:prod`

### 8.3 Hostinger Domain Setup

#### Step 1: Buy Domain on Hostinger

1. Go to [hostinger.com](https://hostinger.com)
2. Search and purchase your domain (e.g., `bitloot.io`)
3. Complete payment

#### Step 2: Configure DNS Records

In Hostinger DNS settings, add:

| Type | Name | Target |
|------|------|--------|
| CNAME | `@` | `bitloot-web-production.up.railway.app` |
| CNAME | `www` | `bitloot-web-production.up.railway.app` |
| CNAME | `api` | `bitloot-api-production.up.railway.app` |

#### Step 3: Add Custom Domain in Railway

1. Click on **Web service** → **Settings** → **Networking**
2. Click **"+ Custom Domain"** → Enter `bitloot.io` and `www.bitloot.io`
3. Click on **API service** → **Settings** → **Networking**
4. Click **"+ Custom Domain"** → Enter `api.bitloot.io`
5. Railway will auto-provision SSL certificates

#### Step 4: Update Environment Variables

After domain is live, update:

1. **API service** → Variables:
   ```env
   CORS_ORIGIN=https://bitloot.io,https://www.bitloot.io
   NOWPAYMENTS_CALLBACK_URL=https://api.bitloot.io/webhooks/nowpayments/ipn
   EMAIL_UNSUBSCRIBE_URL_BASE=https://bitloot.io/emails/unsubscribe
   ```

2. **Web service** → Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.bitloot.io
   ```

### 8.4 Configure Webhook URLs

Update in third-party dashboards:

| Service | Setting | New URL |
|---------|---------|---------|
| **NOWPayments** | IPN Callback URL | `https://api.bitloot.io/webhooks/nowpayments/ipn` |
| **Kinguin** | Webhook URL | `https://api.bitloot.io/kinguin/webhooks` |

### 8.5 Go-Live Verification

- [ ] Homepage loads at `https://bitloot.io`
- [ ] API health check: `https://api.bitloot.io/health`
- [ ] Catalog loads with products
- [ ] Cart and checkout work
- [ ] Admin panel accessible at `/admin`
- [ ] Test small payment (real crypto)
- [ ] Verify key delivery works
- [ ] Check emails sending

### 8.6 Railway Cost Estimate

| Resource | Estimated Cost |
|----------|---------------|
| API (NestJS) | $5-15/month |
| Web (Next.js) | $5-10/month |
| PostgreSQL | $5-10/month |
| Redis | $2-5/month |
| **Total** | **$17-40/month** |

> **💡 Tip:** Start with Railway Pro plan ($20 credit included) to avoid cold starts.

---

## Post-Launch Monitoring

### Daily Checks
- [ ] Check order count
- [ ] Check payment success rate
- [ ] Check fulfillment rate
- [ ] Review failed webhooks
- [ ] Monitor Kinguin balance

### Weekly Checks
- [ ] Review analytics
- [ ] Check profit margins
- [ ] Update pricing if needed
- [ ] Add new products
- [ ] Review customer feedback

### Monitoring Tools
- Grafana dashboard (port 3001)
- Prometheus metrics
- Error tracking (Sentry recommended)
- Uptime monitoring (UptimeRobot)

---

## Quick Reference Commands

```bash
# Start development
npm run dev:all

# Run quality checks
npm run quality:full

# Generate SDK after API changes
npm run sdk:dev

# Run database migrations
npm --workspace apps/api run typeorm migration:run

# Build for production
npm run build

# Check TypeScript
npm run type-check

# Run tests
npm run test
```

---

**Document Version:** 1.0  
**Last Updated:** January 28, 2026  
**Author:** AI Assistant  
**Status:** Ready for Implementation
