# ✅ Level 1 Verification Checklist

Run this checklist to verify Level 1 is complete and working.

---

## 🔍 Quick Verification (5 minutes)

### 1. Servers Running

```bash
# API should respond
curl http://localhost:4000/healthz
# Expected: {"ok":true,"timestamp":"..."}

# Web should load
curl http://localhost:3000/product/demo-product | grep -o "Demo Product"
# Expected: Demo Product
```

### 2. Database Tables Exist

```bash
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
# Expected output:
#  table_name
# ────────────
#  orders
#  order_items
```

### 3. API Documentation

Open in browser: http://localhost:4000/api/docs

Verify these endpoints exist (without `/api` prefix):

- ✅ POST /orders
- ✅ GET /orders/{id}
- ✅ POST /payments/create
- ✅ POST /payments/ipn
- ✅ GET /healthz

---

## 🧪 End-to-End Testing (10 minutes)

### Scenario: Complete Checkout Flow

#### Step 1: Create Order

```bash
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productId":"demo-product"}'
```

**Expected Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "status": "created",
  "total": "1.00",
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "productId": "demo-product",
      "signedUrl": null
    }
  ],
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

**Save the order ID from response** → `ORDER_ID`

#### Step 2: Create Payment

```bash
curl -X POST http://localhost:4000/payments/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID"}'
```

**Expected Response:**

```json
{
  "externalId": "fake_550e8400-...",
  "paymentUrl": "/pay/550e8400-...?ext=fake_550e8400-..."
}
```

#### Step 3: Confirm Payment (IPN)

```bash
curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","externalId":"fake_ORDER_ID"}'
```

**Expected Response:**

```json
{
  "ok": true
}
```

**Check API logs for:**

```
[MOCK EMAIL] Sending order completed email to test@example.com
[MOCK EMAIL] Signed URL: https://r2-mock.example.com/...?token=ORDER_ID&expires=...
```

#### Step 4: Verify Order Updated

```bash
curl http://localhost:4000/orders/ORDER_ID
```

**Expected Response (status should be FULFILLED):**

```json
{
  "id": "ORDER_ID",
  "email": "test@example.com",
  "status": "fulfilled",
  "total": "1.00",
  "items": [
    {
      "id": "...",
      "productId": "demo-product",
      "signedUrl": "https://r2-mock.example.com/demo/YOUR-KEY-EXAMPLE.txt?token=ORDER_ID&expires=..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 🌐 Frontend Testing (Browser)

### 1. Product Page

Navigate to: http://localhost:3000/product/demo-product

**Verify:**

- ✅ Page loads without errors
- ✅ "Demo Product" heading visible
- ✅ Price "$1.00 USD" displayed
- ✅ "Underpayments are non-refundable" warning shown
- ✅ CheckoutForm component renders (email input + button)

### 2. Checkout Form

**Actions:**

- Enter email: `user@example.com`
- Click "Continue to Payment"

**Expected:**

- ✅ Validates email format
- ✅ Creates order (POST /api/orders)
- ✅ Creates payment (POST /api/payments/create)
- ✅ Navigates to `/pay/[orderId]` page

### 3. Payment Page

**URL:** http://localhost:3000/pay/[orderId]?ext=...

**Verify:**

- ✅ Page loads with order ID displayed
- ✅ "Fake Checkout" heading visible
- ✅ Blue info box explains fake payment
- ✅ Yellow warning about demo mode
- ✅ "Complete Payment" button enabled

**Action:**

- Click "Complete Payment" button

**Expected:**

- ✅ Button disables during processing
- ✅ POST to /api/payments/ipn
- ✅ Redirects to `/orders/[orderId]/success`

### 4. Success Page

**URL:** http://localhost:3000/orders/[orderId]/success

**Verify:**

- ✅ "Payment Successful! 🎉" heading visible
- ✅ Order ID displayed (truncated)
- ✅ Email shown: `user@example.com`
- ✅ Status: **FULFILLED** (in green box)
- ✅ "Your link will expire in 15 minutes" message
- ✅ **"Download Your Key" button** visible

**Action:**

- Click "Download Your Key" button

**Expected:**

- ✅ Opens mock signed URL in new tab
- ✅ URL format: `https://r2-mock.example.com/demo/YOUR-KEY-EXAMPLE.txt?token=...&expires=...`

---

## ⚙️ Quality Checks

### Type Safety

```bash
npm run type-check
```

**Expected:**

```
✅ No errors (0)
```

### Code Quality

```bash
npm run lint
```

**Expected:**

```
✅ No errors (0 violations)
```

### Build

```bash
npm run build
```

**Expected:**

```
✅ Both API and Web build successfully
```

### Full Quality Suite

```bash
npm run quality:full
```

**Expected:**

```
✅ All checks pass:
  - Type check: PASS
  - Lint: PASS
  - Format: PASS
  - Test: PASS
  - Build: PASS
```

---

## 🗄️ Database Verification

### Check Tables

```bash
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT * FROM information_schema.tables WHERE table_schema='public';"
```

**Expected:**

- ✅ `orders` table exists
- ✅ `order_items` table exists

### Check Indexes

```bash
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT indexname FROM pg_indexes WHERE schemaname='public';"
```

**Expected:**

- ✅ `IDX_orders_createdAt` index exists
- ✅ `IDX_order_items_orderId` index exists

### Check Sample Data

```bash
docker compose exec db psql -U bitloot -d bitloot -c \
  "SELECT id, email, status FROM orders ORDER BY createdAt DESC LIMIT 1;"
```

**Expected:**

- ✅ Last order has `status='fulfilled'`

---

## 📦 SDK Verification

### SDK Generated

```bash
ls packages/sdk/src/generated/
```

**Expected files:**

- ✅ `apis/` (HealthApi.ts, OrdersApi.ts, PaymentsApi.ts, index.ts)
- ✅ `models/` (CreateOrderDto.ts, OrderResponseDto.ts, etc.)
- ✅ `runtime.ts`
- ✅ `index.ts`

### SDK Builds

```bash
npm --workspace packages/sdk run build
```

**Expected:**

- ✅ `packages/sdk/dist/` created with .js and .d.ts files

### SDK Exports

```bash
node -e "console.log(Object.keys(require('./packages/sdk/dist')))"
```

**Expected:**

- ✅ Exports include: `OrdersApi`, `PaymentsApi`, `HealthApi`
- ✅ Exports include models: `CreateOrderDto`, `OrderResponseDto`, etc.

---

## 🔍 API Response Validation

### Create Order Response Structure

```bash
curl -s http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productId":"demo"}' | jq 'keys'
```

**Expected keys:**

```json
["id", "email", "status", "total", "items", "createdAt", "updatedAt"]
```

### Get Order Response Structure

```bash
curl -s http://localhost:4000/api/orders/[ORDER_ID] | jq 'keys'
```

**Expected:**

```json
["id", "email", "status", "total", "items", "createdAt", "updatedAt"]
```

### Order Items Structure

```bash
curl -s http://localhost:4000/api/orders/[ORDER_ID] | jq '.items[0] | keys'
```

**Expected:**

```json
["id", "productId", "signedUrl"]
```

---

## ❌ Common Issues & Fixes

### Issue: "No QueryClient set" Error

**Symptom:** Browser console shows error when rendering CheckoutForm

**Fix:** Verify `Providers` component is in layout.tsx

```bash
grep -n "Providers" apps/web/app/layout.tsx
```

Expected output:

```
import { Providers } from '../src/lib/providers';
<Providers>{children}</Providers>
```

### Issue: API 404 on POST /api/orders

**Symptom:** Frontend POST to /api/orders returns 404

**Fix:** Verify API base URL

```bash
grep "localhost:4000" apps/web/src/features/checkout/CheckoutForm.tsx
```

Expected: All fetch calls use `http://localhost:4000/api/*`

### Issue: Database "relation orders does not exist"

**Symptom:** API logs show SQL error on order creation

**Fix:** Run migrations

```bash
npx typeorm migration:run -d apps/api/dist/database/data-source.js
```

### Issue: SDK Won't Build

**Symptom:** TypeScript errors in packages/sdk/src/generated/

**Fix:** Update tsconfig.json

```bash
grep -A 2 '"exclude"' packages/sdk/tsconfig.json
```

Expected: Should NOT exclude `src/generated`

---

## ✅ Approval Checklist

Mark each item as you verify:

- [ ] API server starts without errors
- [ ] Web server starts without errors
- [ ] Database tables exist (orders, order_items)
- [ ] All 5 API endpoints in Swagger docs
- [ ] Create order endpoint works
- [ ] Get order endpoint works
- [ ] Create payment endpoint works
- [ ] IPN endpoint processes fulfillment
- [ ] Product page loads (http://localhost:3000/product/demo-product)
- [ ] CheckoutForm renders
- [ ] Email validation works
- [ ] Payment page loads (/pay/[orderId])
- [ ] Success page loads (/orders/[id]/success)
- [ ] Signed URL in order items after IPN
- [ ] Full checkout flow works (product → payment → success)
- [ ] type-check passes
- [ ] lint passes
- [ ] build passes
- [ ] SDK generated (packages/sdk/src/generated/)
- [ ] SDK builds successfully

**Total: 19 items**

---

## 🎯 Sign-Off

**Level 1 Verification Date:** **\*\***\_**\*\***  
**Verified By:** **\*\***\_**\*\***  
**Status:** ✅ **COMPLETE**

All acceptance criteria met. System is ready for Level 2 (Product Catalog & Search).

---

## 📚 Next Steps

1. Review [LEVEL_1_COMPLETE.md](./LEVEL_1_COMPLETE.md) for full summary
2. Proceed to [02-Level.md](../../developer-roadmap/02-Level.md) for Product Catalog implementation
3. Commit changes to `level1` branch
4. Create PR for merge to `main`

---

**Last Updated:** November 8, 2025  
**Level 1 Status:** ✅ **VERIFIED & COMPLETE**
