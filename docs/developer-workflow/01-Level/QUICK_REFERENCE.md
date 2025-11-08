# ⚡ Level 1 Quick Reference

## 🚀 Start Development

```bash
# Install & setup
npm install
docker compose up -d

# Run migrations
npm --workspace apps/api run build
npx typeorm migration:run -d apps/api/dist/database/data-source.js

# Start servers (separate terminals)
npm run dev:api
npm run dev:web
```

---

## 🔗 Quick Links

| Link                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| http://localhost:3000                      | Web app                           |
| http://localhost:3000/product/demo-product | Product page                      |
| http://localhost:4000/api/docs             | Swagger API docs                  |
| http://localhost:4000/healthz              | API health check (no /api prefix) |

---

## 📝 Key Files

| Path                                        | Purpose                 |
| ------------------------------------------- | ----------------------- |
| `apps/api/src/modules/orders/`              | Order entities & logic  |
| `apps/api/src/modules/payments/`            | Payment endpoints & IPN |
| `apps/api/src/database/migrations/`         | Database schema         |
| `apps/web/app/product/[id]/page.tsx`        | Product page            |
| `apps/web/app/pay/[orderId]/page.tsx`       | Payment page            |
| `apps/web/app/orders/[id]/success/page.tsx` | Success page            |
| `packages/sdk/src/generated/`               | Generated API clients   |

---

## ✅ Quality Commands

```bash
npm run type-check    # TypeScript validation
npm run lint          # Code quality
npm run build         # Build all workspaces
npm run quality:full  # All checks
```

---

## 🧪 Manual Testing

**Create Order:**

```bash
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","productId":"demo-product"}'
```

**Simulate Payment:**

```bash
curl -X POST http://localhost:4000/payments/ipn \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","externalId":"fake_<ORDER_ID>"}'
```

**Check Order:**

```bash
curl http://localhost:4000/orders/<ORDER_ID>
```

---

## 📊 Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| API      | NestJS + Swagger                     |
| Frontend | Next.js 16 + React 19                |
| Database | PostgreSQL + TypeORM                 |
| State    | TanStack Query                       |
| SDK      | TypeScript-Fetch (OpenAPI generated) |
| Queue    | BullMQ (configured, not used in L1)  |

---

## 🎯 Architecture

```
User Browser
    ↓
[Next.js 16 App] ← TanStack Query ← Fetch
    ↓
http://localhost:3000/product/demo-product
    ↓
User enters email → POST /api/orders
    ↓
[NestJS API] → TypeORM → PostgreSQL
    ↓
Response: { id, email, status='created', items[] }
    ↓
POST /api/payments/create → paymentUrl
    ↓
Navigate to /pay/[orderId]
    ↓
Click "Complete Payment"
    ↓
POST /api/payments/ipn
    ↓
Backend: markPaid() → fulfill() → sendEmail()
    ↓
Redirect to /orders/[id]/success
    ↓
Fetch order → show signed URL
    ↓
User clicks "Reveal Key" → Opens mock signed URL
```

---

## 💾 Database Schema

**Orders:**

- `id` (UUID PK)
- `email` (varchar)
- `status` (created|paid|fulfilled)
- `total` (numeric)
- `createdAt`, `updatedAt` (timestamps)

**Order Items:**

- `id` (UUID PK)
- `orderId` (FK → orders, CASCADE delete)
- `productId` (varchar)
- `signedUrl` (text, nullable)
- `createdAt`, `updatedAt` (timestamps)

---

## 🔄 API Endpoints

| Method | Path             | Purpose                       |
| ------ | ---------------- | ----------------------------- |
| POST   | /orders          | Create order                  |
| GET    | /orders/{id}     | Get order details             |
| POST   | /payments/create | Generate fake payment URL     |
| POST   | /payments/ipn    | Process payment (IPN webhook) |
| GET    | /healthz         | Health check                  |

---

## 🎭 Checkout Flow (User)

```
1. Visit /product/demo-product
2. Enter email
3. Click "Continue to Payment"
   ↓ (API: order created)
4. See fake payment page (/pay/...)
5. Click "Complete Payment"
   ↓ (API: order fulfilled)
6. Redirected to success page (/orders/.../success)
7. Click "Reveal Key"
   ↓ (Opens mock signed URL)
```

---

## 🐛 Debugging

**Check API logs:**

```bash
# Should show: Mock email log entry after IPN
npm run dev:api
# Look for: [MOCK EMAIL] Sending order completed email to ...
```

**Check database:**

```bash
docker compose exec db psql -U bitloot -d bitloot
# \dt — list tables
# SELECT * FROM orders; — view orders
```

**Check browser console:**

- F12 → Console tab
- Look for fetch errors or React errors

---

## 📦 SDK Usage (Future)

When frontend switches to SDK instead of fetch:

```typescript
import { OrdersApi, CreateOrderDto } from '@bitloot/sdk';

const ordersClient = new OrdersApi();
const response = await ordersClient.ordersControllerCreate({
  createOrderDto: { email: 'user@example.com', productId: 'demo' },
});
```

---

## 🎯 Next Phase (Level 2)

- Kinguin product catalog integration
- Product search & filtering
- Shopping cart support
- Multiple items per order

See: `docs/developer-roadmap/02-Level.md`

---

**Level 1 Complete ✅ — Ready for Level 2 🚀**
