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

## Phase 1: Database Cleanup & Reset

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
| PlayStation Gift Cards | 🔴 High | 3-5 |
| Xbox Gift Cards | 🔴 High | 3-5 |
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

**Recommended Pricing Rules:**

| Product Type | Cost | Markup | Retail Price |
|--------------|------|--------|--------------|
| AAA Games | €40 | 15-20% | €46-48 |
| Indie Games | €15 | 20-25% | €18-19 |
| Gift Cards | €25 | 5-8% | €26-27 |
| Software | €50 | 10-15% | €55-58 |

**Create Pricing Rules in Admin:**
1. Navigate to `/admin/catalog/rules`
2. Create global rule: 15% margin default
3. Create category-specific rules:
   - Games: 18% margin
   - Gift Cards: 6% margin
   - Software: 12% margin

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

#### Homepage (`/`)
- [ ] Hero section loads correctly
- [ ] Flash deals section shows active deals (or hides if none)
- [ ] Trending products display correctly
- [ ] Featured products by type tabs work
- [ ] Bundle deals section works
- [ ] Category browser links work
- [ ] Gift card quick buy works
- [ ] Benefits section displays
- [ ] Social proof / live feed works (or is realistic mock)
- [ ] FAQ accordion works
- [ ] CTA section links work
- [ ] All images load (no broken images)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)

#### Catalog Page (`/catalog`)
- [ ] Products load correctly
- [ ] Search works (full-text search)
- [ ] Platform filter works
- [ ] Category filter works
- [ ] Region filter works
- [ ] Sort options work (price, name, newest)
- [ ] Pagination works
- [ ] View mode toggle (grid/list) works
- [ ] Empty state displays correctly
- [ ] Loading skeleton shows during load
- [ ] Error state shows on API failure
- [ ] Mobile filters sheet works

#### Product Detail Page (`/product/[id]`)
- [ ] Product info loads correctly
- [ ] Cover image displays
- [ ] Screenshots gallery works
- [ ] System requirements display (if applicable)
- [ ] Price displays correctly (with currency)
- [ ] Flash deal price shows (if active)
- [ ] Add to cart button works
- [ ] Add to wishlist works (authenticated)
- [ ] Reviews section loads
- [ ] Related products display
- [ ] Trust badges display
- [ ] Crypto payment banner shows
- [ ] Back button works
- [ ] Share functionality works

#### Cart Page (`/cart`)
- [ ] Cart items display correctly
- [ ] Quantity can be updated
- [ ] Items can be removed
- [ ] Clear cart works
- [ ] Promo code input works
- [ ] Promo validation shows success/error
- [ ] Total calculates correctly
- [ ] Savings displays correctly
- [ ] Checkout button works
- [ ] Empty cart state displays
- [ ] Continue shopping link works

#### Checkout Page (`/checkout`)
- [ ] Cart summary displays
- [ ] Email input works
- [ ] Email validation works
- [ ] CAPTCHA loads and validates
- [ ] Create order works
- [ ] Redirects to payment page
- [ ] Error handling works
- [ ] Loading state displays
- [ ] Empty cart redirects to catalog

#### Order Status Page (`/orders/[id]`)
- [ ] Order details load
- [ ] Status displays correctly
- [ ] Status timeline works
- [ ] Payment info displays
- [ ] Items list displays
- [ ] Key reveal works (for fulfilled orders)
- [ ] Copy key functionality works
- [ ] Download key works
- [ ] Email resend works
- [ ] Guest access with session token works
- [ ] Authentication required message (if needed)

#### Profile Page (`/profile`)
- [ ] User info displays
- [ ] Orders tab works with pagination
- [ ] Order details expandable
- [ ] Watchlist tab loads
- [ ] Watchlist items can be removed
- [ ] Add all to cart works
- [ ] Security tab works
- [ ] Change password works
- [ ] Active sessions display
- [ ] Revoke session works
- [ ] Account settings tab works
- [ ] Email change (dual OTP) works
- [ ] Account deletion request works
- [ ] Logout works

#### Auth Pages (`/auth/login`)
- [ ] OTP request form works
- [ ] Email validation works
- [ ] OTP input (6 digits) works
- [ ] OTP verification works
- [ ] Error messages display
- [ ] Rate limiting message shows
- [ ] Redirect after login works
- [ ] Remember me / session persistence

### 4.2 Error Pages

- [ ] `/not-found` - 404 page displays correctly
- [ ] `/error` - Error boundary works
- [ ] `/forbidden` - 403 page displays
- [ ] `/maintenance` - Maintenance mode works

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

### 4.4 Design System Consistency

Check all pages use correct:
- [ ] Color tokens (no hardcoded hex values)
- [ ] Typography scale (text-sm, text-lg, etc.)
- [ ] Spacing (consistent padding/margins)
- [ ] Border radius (rounded-lg, rounded-md)
- [ ] Shadows (shadow-card-md, shadow-glow-cyan)
- [ ] Buttons (btn-primary, btn-secondary)
- [ ] Badges (badge-success, badge-warning)
- [ ] Form inputs (input-glow)

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
- [ ] JWT tokens expire correctly (15min access, 7d refresh)
- [ ] Refresh token rotation works
- [ ] OTP rate limiting works (3 requests/min)
- [ ] Password hashing uses bcrypt (10 rounds)
- [ ] Session invalidation works

#### Authorization
- [ ] Admin routes protected by AdminGuard
- [ ] User routes protected by JwtAuthGuard
- [ ] Ownership checks in services
- [ ] No unauthorized data access

#### API Security
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (TypeORM)
- [ ] XSS prevented (React escaping)

#### Webhook Security
- [ ] HMAC verification enabled
- [ ] Timing-safe comparison used
- [ ] Webhook replay prevention works
- [ ] IPN secret not exposed

#### Data Security
- [ ] Keys encrypted (AES-256-GCM)
- [ ] Signed URLs expire (15min)
- [ ] No secrets in frontend
- [ ] Environment variables secured

### 6.2 Performance Checklist

#### Frontend
- [ ] Images optimized (next/image)
- [ ] Code splitting works
- [ ] Lazy loading implemented
- [ ] Bundle size acceptable (<500KB)
- [ ] First contentful paint <2s
- [ ] Lighthouse score >80

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
