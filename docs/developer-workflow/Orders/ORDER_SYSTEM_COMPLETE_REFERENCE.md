# Order System Complete Reference

**Last Updated:** January 13, 2026  
**Status:** ✅ Production-Ready  
**Branch:** `catalog-development`

---

## Table of Contents

1. [Overview](#overview)
2. [Order Checkout Flow](#order-checkout-flow)
3. [Guest Session Token Authentication](#guest-session-token-authentication)
4. [Order Admin Management](#order-admin-management)
5. [Key Delivery & Reveal System](#key-delivery--reveal-system)
6. [Database Schema](#database-schema)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Frontend Components](#frontend-components)
9. [Security Considerations](#security-considerations)
10. [Testing Guide](#testing-guide)

---

## Overview

BitLoot's order system supports both **authenticated users** and **guest checkout**. The system handles:

- Order creation with crypto payment integration (NOWPayments)
- Real-time order status tracking via WebSocket
- Automated fulfillment via Kinguin API or custom keys
- Secure key delivery via encrypted Cloudflare R2 storage
- Guest access via session tokens (no account required)

### Key Features

| Feature | Description |
|---------|-------------|
| Guest Checkout | Users can purchase without creating an account |
| Session Tokens | JWT-based tokens for guest order access |
| Real-time Updates | WebSocket notifications for payment/fulfillment status |
| Encrypted Keys | AES-256-GCM encryption for product keys |
| Signed URLs | Time-limited R2 URLs for key downloads |
| Admin Dashboard | Full order management with filtering and search |

---

## Order Checkout Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHECKOUT FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Cart → Checkout Page                                                     │
│     └── User enters email (guest) OR is authenticated                       │
│                                                                              │
│  2. Create Order (POST /orders)                                              │
│     ├── Backend creates order with status: 'pending'                         │
│     ├── Generates orderSessionToken (JWT, 1hr expiry)                        │
│     └── Returns { order, paymentUrl, orderSessionToken }                     │
│                                                                              │
│  3. Frontend stores session token                                            │
│     └── localStorage.setItem(`order_session_${orderId}`, token)              │
│                                                                              │
│  4. Redirect to NOWPayments                                                  │
│     └── User pays with crypto                                                │
│                                                                              │
│  5. Payment Confirmation (IPN Webhook)                                       │
│     ├── HMAC signature verified                                              │
│     ├── Order status updated: 'paid'                                         │
│     └── Fulfillment job queued (BullMQ)                                      │
│                                                                              │
│  6. Fulfillment Processing                                                   │
│     ├── Kinguin API or custom key assignment                                 │
│     ├── Keys encrypted with AES-256-GCM                                      │
│     ├── Uploaded to Cloudflare R2                                            │
│     └── Order status: 'fulfilled'                                            │
│                                                                              │
│  7. User Redirected to Success Page                                          │
│     └── /orders/{orderId}/success                                            │
│                                                                              │
│  8. Key Reveal                                                               │
│     ├── Validates access (session token OR auth)                             │
│     ├── Generates signed R2 URL (15min expiry)                               │
│     └── Displays decrypted key to user                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Checkout Form Component

**File:** `apps/web/src/features/checkout/CheckoutForm.tsx`

```tsx
// Key implementation details:
// 1. Uses React Hook Form + Zod validation
// 2. Integrates Cloudflare Turnstile CAPTCHA
// 3. Calls SDK to create order
// 4. Stores session token for guest access
// 5. Redirects to payment URL

const onSubmit = async (data: CheckoutFormData) => {
  const response = await ordersClient.ordersControllerCreateOrder({
    createOrderDto: {
      email: data.email,
      items: cartItems,
    },
  });
  
  // Store session token for guest access
  if (response.orderSessionToken) {
    localStorage.setItem(
      `order_session_${response.order.id}`,
      response.orderSessionToken
    );
  }
  
  // Redirect to payment
  window.location.href = response.paymentUrl;
};
```

---

## Guest Session Token Authentication

### How It Works

Guest users don't have accounts, but they need to access their orders after purchase. We solve this with **Order Session Tokens**.

### Token Structure

```typescript
// Token payload
{
  type: 'order_session',
  orderId: string,      // UUID of the order
  email: string,        // Guest email address
  iat: number,          // Issued at timestamp
  exp: number           // Expiration (1 hour from creation)
}
```

### Token Generation (Backend)

**File:** `apps/api/src/modules/orders/orders.service.ts`

```typescript
generateOrderSessionToken(orderId: string, email: string): string {
  return this.jwtService.sign(
    {
      type: 'order_session',
      orderId,
      email,
    },
    {
      expiresIn: '1h',
      secret: this.configService.get('JWT_SECRET'),
    }
  );
}

verifyOrderSessionToken(orderId: string, token: string): boolean {
  try {
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
    
    return (
      payload.type === 'order_session' &&
      payload.orderId === orderId
    );
  } catch {
    return false;
  }
}
```

### Token Storage (Frontend)

**Pattern:** `order_session_{orderId}` in localStorage

```typescript
// Store after order creation
localStorage.setItem(`order_session_${orderId}`, token);

// Retrieve when accessing order
const token = localStorage.getItem(`order_session_${orderId}`);
```

### Token Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESS VERIFICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request comes in with:                                          │
│  - Header: x-order-session-token (optional)                      │
│  - Bearer JWT token (optional)                                   │
│                                                                  │
│  Verification Priority:                                          │
│                                                                  │
│  1. Session Token Check                                          │
│     └── If valid session token for this orderId → GRANT ACCESS   │
│                                                                  │
│  2. Admin Check                                                  │
│     └── If user.role === 'admin' → GRANT ACCESS                  │
│                                                                  │
│  3. Owner Check                                                  │
│     └── If order.userId === user.id → GRANT ACCESS               │
│                                                                  │
│  4. Email Match Check                                            │
│     └── If order.email === user.email → GRANT ACCESS             │
│                                                                  │
│  5. None matched → DENY ACCESS (403 Forbidden)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### useOrderAccess Hook

**File:** `apps/web/src/hooks/useOrderAccess.ts`

```typescript
export function useOrderAccess(orderId: string) {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['order-access', orderId],
    queryFn: async () => {
      // Get session token from localStorage
      const sessionToken = localStorage.getItem(`order_session_${orderId}`);
      
      // Call backend to verify access
      const response = await ordersClient.ordersControllerCheckAccess({
        id: orderId,
        xOrderSessionToken: sessionToken ?? undefined,
      });
      
      return response;
    },
  });
}
```

---

## Order Admin Management

### Admin Dashboard Features

**File:** `apps/web/src/app/admin/orders/page.tsx`

| Feature | Description |
|---------|-------------|
| Order List | Paginated table of all orders |
| Search | Search by order ID, email, or status |
| Filters | Filter by status, date range, payment status |
| Order Details | View full order with items and payment info |
| Manual Actions | Retry fulfillment, mark as fulfilled, refund |
| Export | CSV export of order data |

### Admin Order Actions

```typescript
// Available admin actions
type AdminOrderAction =
  | 'view'           // View order details
  | 'retry'          // Retry failed fulfillment
  | 'cancel'         // Cancel pending order
  | 'refund'         // Process refund
  | 'mark_fulfilled' // Manual fulfillment marking
  | 'resend_email'   // Resend delivery email
```

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/orders` | GET | List all orders with pagination |
| `/admin/orders/:id` | GET | Get order details |
| `/admin/orders/:id/status` | PATCH | Update order status |
| `/admin/orders/:id/retry` | POST | Retry fulfillment |
| `/admin/orders/:id/refund` | POST | Process refund |

### Order Status Flow

```
pending → confirming → paid → fulfilling → fulfilled
                   ↘           ↘
                 underpaid    failed
                      ↘         ↓
                     failed   (can retry)
```

---

## Key Delivery & Reveal System

### Key Reveal Component

**File:** `apps/web/src/features/orders/components/KeyReveal.tsx`

The KeyReveal component handles displaying product keys to authorized users:

```typescript
// Access control logic
if (!canAccess && !isAuthenticated) {
  // Show login prompt only if:
  // - User doesn't have session token access AND
  // - User is not authenticated
  return <LoginPrompt />;
}

// If canAccess=true (via session token) OR authenticated with permission
// Show the key reveal interface
```

### Key Reveal API

**Endpoint:** `POST /fulfillment/orders/:id/items/:itemId/reveal`

**Headers:**
- `Authorization: Bearer <jwt>` (optional, for authenticated users)
- `x-order-session-token: <token>` (optional, for guests)

**Response:**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "revealedAt": "2026-01-13T12:00:00Z",
  "expiresAt": "2026-01-13T12:15:00Z"
}
```

### Backend Key Reveal Logic

**File:** `apps/api/src/modules/fulfillment/fulfillment.controller.ts`

```typescript
@Post('orders/:id/items/:itemId/reveal')
@UseGuards(OptionalAuthGuard)  // Allows both auth and non-auth requests
@ApiHeader({ name: 'x-order-session-token', required: false })
async revealMyKey(
  @Param('id') orderId: string,
  @Param('itemId') itemId: string,
  @Headers('x-order-session-token') sessionToken: string | undefined,
  @Request() req: any,
): Promise<KeyRevealResponseDto> {
  
  // 1. Check session token first (for guests)
  if (sessionToken) {
    const isValid = await this.ordersService.verifyOrderSessionToken(
      orderId,
      sessionToken
    );
    if (isValid) {
      return this.fulfillmentService.revealKey(orderId, itemId, 'session_token');
    }
  }
  
  // 2. Check authenticated user
  const user = req.user;
  if (user) {
    // Admin can access any order
    if (user.role === 'admin') {
      return this.fulfillmentService.revealKey(orderId, itemId, 'admin');
    }
    
    // Check ownership
    const order = await this.ordersService.findOne(orderId);
    if (order.userId === user.id || order.email === user.email) {
      return this.fulfillmentService.revealKey(orderId, itemId, 'owner');
    }
  }
  
  // 3. No access
  throw new ForbiddenException('You do not have access to this order');
}
```

---

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_id VARCHAR(255),          -- NOWPayments payment ID
  payment_status VARCHAR(50),
  np_payment_url TEXT,              -- NOWPayments checkout URL
  source_type product_source_type,  -- 'custom' or 'kinguin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP,
  
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_email (email),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at DESC)
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirming',
  'paid',
  'underpaid',
  'failed',
  'fulfilling',
  'fulfilled',
  'cancelled',
  'refunded'
);
```

### Order Items Table

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(20, 8) NOT NULL,
  total_price DECIMAL(20, 8) NOT NULL,
  key_id UUID REFERENCES keys(id),           -- Assigned key after fulfillment
  kinguin_offer_id VARCHAR(255),             -- For Kinguin products
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
);
```

### Keys Table

```sql
CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  order_item_id UUID REFERENCES order_items(id),
  encrypted_key TEXT NOT NULL,        -- AES-256-GCM encrypted
  encryption_iv VARCHAR(32) NOT NULL, -- Initialization vector
  r2_object_key VARCHAR(500),         -- Cloudflare R2 path
  status key_status NOT NULL DEFAULT 'available',
  assigned_at TIMESTAMP,
  revealed_at TIMESTAMP,
  reveal_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_keys_product_id (product_id),
  INDEX idx_keys_status (status)
);

CREATE TYPE key_status AS ENUM (
  'available',
  'reserved',
  'assigned',
  'revealed',
  'expired'
);
```

---

## API Endpoints Reference

### Public Order Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/orders` | POST | No | Create new order |
| `/orders/:id` | GET | Session/JWT | Get order details |
| `/orders/:id/status` | GET | Session/JWT | Get order status |
| `/orders/:id/access` | GET | Session/JWT | Check access permission |

### Fulfillment Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/fulfillment/orders/:id/items/:itemId/reveal` | POST | Session/JWT | Reveal product key |
| `/fulfillment/orders/:id/download` | GET | Session/JWT | Download keys as file |

### Admin Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/orders` | GET | Admin | List all orders |
| `/admin/orders/:id` | GET | Admin | Get order details |
| `/admin/orders/:id/status` | PATCH | Admin | Update status |
| `/admin/orders/:id/retry-fulfillment` | POST | Admin | Retry fulfillment |
| `/admin/orders/export` | GET | Admin | Export to CSV |

---

## Frontend Components

### Component Tree

```
orders/
├── OrderPage.tsx              # /orders/:id - Main order view
├── OrderSuccessPage.tsx       # /orders/:id/success - Post-payment
├── components/
│   ├── OrderDetails.tsx       # Order information display
│   ├── OrderItems.tsx         # List of purchased items
│   ├── OrderStatus.tsx        # Status badge and timeline
│   ├── KeyReveal.tsx          # Key reveal with access control
│   └── PaymentStatus.tsx      # Payment progress indicator

admin/orders/
├── page.tsx                   # Admin orders list
├── [id]/
│   └── page.tsx               # Admin order detail
└── components/
    ├── OrdersTable.tsx        # Sortable/filterable table
    ├── OrderFilters.tsx       # Filter controls
    ├── OrderActions.tsx       # Admin action buttons
    └── OrderTimeline.tsx      # Status history
```

### Key Components

#### KeyReveal.tsx

Handles secure key display with multi-auth support:

```typescript
interface KeyRevealProps {
  orderId: string;
  orderAccess: OrderAccessResponse;
  isAuthenticated: boolean;
  items: OrderItem[];
}

// Features:
// - Session token authentication for guests
// - JWT authentication for logged-in users
// - Copy-to-clipboard functionality
// - Reveal count tracking
// - Expiring download links
```

#### useOrderAccess Hook

```typescript
interface OrderAccessResponse {
  canAccess: boolean;
  accessType: 'owner' | 'admin' | 'session_token' | 'none';
  order: Order;
}

export function useOrderAccess(orderId: string) {
  // Returns TanStack Query result with access status
}
```

---

## Security Considerations

### Session Token Security

| Concern | Mitigation |
|---------|------------|
| Token theft | 1-hour expiration limits exposure window |
| Token reuse | Token is order-specific, can't access other orders |
| XSS attacks | Token stored in localStorage (consider httpOnly cookie for higher security) |
| Brute force | Rate limiting on access check endpoint |

### Key Protection

| Layer | Protection |
|-------|------------|
| Storage | AES-256-GCM encryption at rest |
| Transit | HTTPS + signed URLs |
| Access | Multi-factor verification (token/JWT + orderId) |
| Reveal | Audit logging of all key reveals |
| Expiry | Signed URLs expire in 15 minutes |

### Webhook Security

| Layer | Protection |
|-------|------------|
| Signature | HMAC-SHA512 verification |
| Timing | Timing-safe comparison |
| Replay | Idempotency via webhook_logs table |
| Audit | All webhooks logged with payload |

---

## Testing Guide

### Manual Testing: Guest Checkout Flow

1. **Add items to cart** and proceed to checkout
2. **Enter guest email** (no account)
3. **Complete payment** via NOWPayments sandbox
4. **Verify redirect** to `/orders/:id/success`
5. **Check localStorage** for `order_session_{orderId}`
6. **Click "Reveal Key"** - should work without login
7. **Copy the session token**, open incognito, paste into localStorage
8. **Access same order** - should work with token

### Manual Testing: Authenticated Flow

1. **Login** to existing account
2. **Complete checkout** with same email as account
3. **Verify order** appears in account order history
4. **Reveal keys** without session token (uses JWT)

### API Testing with cURL

```bash
# Create order (guest)
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"guest@example.com","items":[{"productId":"...","quantity":1}]}'

# Check access with session token
curl http://localhost:4000/orders/{orderId}/access \
  -H "x-order-session-token: {token}"

# Reveal key with session token
curl -X POST http://localhost:4000/fulfillment/orders/{orderId}/items/{itemId}/reveal \
  -H "x-order-session-token: {token}"

# Admin: List all orders
curl http://localhost:4000/admin/orders \
  -H "Authorization: Bearer {admin-jwt}"
```

---

## Files Reference

### Backend Files

| File | Purpose |
|------|---------|
| `orders.controller.ts` | Order CRUD endpoints |
| `orders.service.ts` | Order business logic + session tokens |
| `fulfillment.controller.ts` | Key reveal endpoints |
| `fulfillment.service.ts` | Key decryption and delivery |
| `order.entity.ts` | TypeORM order entity |
| `order-item.entity.ts` | TypeORM order item entity |

### Frontend Files

| File | Purpose |
|------|---------|
| `CheckoutForm.tsx` | Checkout UI with token storage |
| `KeyReveal.tsx` | Key display with access control |
| `useOrderAccess.ts` | Order access verification hook |
| `orders/[id]/page.tsx` | Order detail page |
| `orders/[id]/success/page.tsx` | Post-payment success page |
| `admin/orders/page.tsx` | Admin orders dashboard |

### SDK Files

| File | Purpose |
|------|---------|
| `OrdersApi.ts` | Generated order endpoints |
| `FulfillmentApi.ts` | Generated fulfillment endpoints |
| `models/Order.ts` | Order type definitions |
| `models/OrderItem.ts` | Order item type definitions |

---

## Changelog

| Date | Change |
|------|--------|
| Jan 13, 2026 | Fixed guest key reveal - session token now passed to reveal API |
| Jan 13, 2026 | Updated FulfillmentController to support OptionalAuthGuard |
| Jan 13, 2026 | Fixed KeyReveal access logic to check canAccess before isAuthenticated |
| Jan 12, 2026 | Implemented order session tokens for guest checkout |
| Jan 11, 2026 | Added admin order management dashboard |

---

## Summary

The BitLoot order system provides a complete e-commerce checkout flow supporting both authenticated users and guests. Key features include:

- **Session Tokens**: 1-hour JWT tokens allowing guests to access their orders
- **Multi-Auth Support**: Session tokens, JWT auth, and admin access all supported
- **Secure Key Delivery**: AES-256-GCM encryption with signed R2 URLs
- **Admin Dashboard**: Full order management with search, filters, and actions
- **Real-time Updates**: WebSocket notifications for order status changes

For questions or issues, refer to the main project documentation or contact the development team.
