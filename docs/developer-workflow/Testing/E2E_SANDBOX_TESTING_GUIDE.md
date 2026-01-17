# 🧪 Complete E2E Sandbox Testing Guide

**Date:** January 2, 2026  
**Purpose:** Test complete Payment → Fulfillment flow using sandbox APIs  
**Services:** NOWPayments Sandbox + Kinguin Sandbox

---

## 📋 Prerequisites

### 1. Install ngrok (Required for Webhooks)

Both NOWPayments and Kinguin need to send webhooks to your local server. You need a public URL.

```bash
# Install ngrok (if not already installed)
# Option 1: npm
npm install -g ngrok

# Option 2: Download from https://ngrok.com/download
# Windows: choco install ngrok (if using Chocolatey)
```

### 2. Start ngrok Tunnel

```bash
# Start tunnel to your local API (port 4000)
ngrok http 4000

# You'll see output like:
# Forwarding    https://abc123.ngrok-free.app -> http://localhost:4000
#
# Copy this URL! You'll need it for webhook configuration.
```

**Example ngrok URL:** `https://abc123.ngrok-free.app`

---

## 🔧 Step 1: Configure Environment Variables

Update your `.env` file with sandbox credentials:

```bash
# Open .env file and update these values:

# ============ NOWPAYMENTS SANDBOX ============
# Get these from: https://account.sandbox.nowpayments.io/
NOWPAYMENTS_API_KEY=your_sandbox_api_key
NOWPAYMENTS_IPN_SECRET=your_sandbox_ipn_secret
NOWPAYMENTS_BASE=https://api-sandbox.nowpayments.io
NOWPAYMENTS_CALLBACK_URL=https://YOUR_NGROK_URL/webhooks/nowpayments/ipn

# ============ KINGUIN SANDBOX ============
# Get these from: https://www.kinguin.net/integration/dashboard/stores
# Note: Kinguin may provide a sandbox store or you can use production API 
# with test orders (they have specific test product IDs)
KINGUIN_API_KEY=your_kinguin_api_key
KINGUIN_BASE_URL=https://gateway.kinguin.net/esa/api
KINGUIN_WEBHOOK_SECRET=your_kinguin_webhook_secret
```

---

## 🌐 Step 2: Configure NOWPayments Webhook

### 2.1 Login to NOWPayments Sandbox Dashboard

1. Go to: **https://account.sandbox.nowpayments.io/**
2. Navigate to: **Settings → IPN Settings**

### 2.2 Configure IPN Settings

| Field | Value |
|-------|-------|
| **IPN Secret Key** | Generate and copy to `NOWPAYMENTS_IPN_SECRET` in .env |
| **IPN Callback URL** | `https://YOUR_NGROK_URL/webhooks/nowpayments/ipn` |
| **IPN Status** | Enabled ✅ |

**Example IPN URL:** `https://abc123.ngrok-free.app/webhooks/nowpayments/ipn`

---

## 👑 Step 3: Configure Kinguin Webhooks

### 3.1 Login to Kinguin Integration Dashboard

1. Go to: **https://www.kinguin.net/integration/dashboard/stores**
2. Select your store
3. Click **WEBHOOKS** button

### 3.2 Configure Each Webhook Type

#### Webhook 1: `order.status` (Most Important!)

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_NGROK_URL/kinguin/webhooks` |
| **Secret** | Generate and copy to `KINGUIN_WEBHOOK_SECRET` in .env |
| **Active** | ✅ Yes |

**This webhook fires when:**
- Order is dispatched
- Order is completed  
- Order is canceled
- Keys are ready

#### Webhook 2: `product.update` (Optional for Catalog Sync)

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_NGROK_URL/kinguin/webhooks` |
| **Secret** | Same as above |
| **Active** | ✅ Yes (optional) |

**This webhook fires when:**
- Product price changes
- Product stock changes
- New offers available

#### Webhook 3: `order.complete` (Optional, similar to order.status)

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_NGROK_URL/kinguin/webhooks` |
| **Secret** | Same as above |
| **Active** | ✅ Yes (optional) |

### 3.3 Test Webhook URL

Before saving, click **TEST URL** button to verify your endpoint responds correctly.

---

## 🚀 Step 4: Start Your Development Environment

### Terminal 1: Start Infrastructure
```bash
cd c:\Users\beast\bitloot
docker-compose up -d
```

### Terminal 2: Start API
```bash
cd c:\Users\beast\bitloot
npm run dev:api
```

### Terminal 3: Start Web
```bash
cd c:\Users\beast\bitloot
npm run dev:web
```

### Terminal 4: Keep ngrok Running
```bash
ngrok http 4000
# Keep this running! Copy the https URL
```

---

## 🧪 Step 5: Test Complete Flow in Browser

### 5.1 Open Your Local Frontend

1. Open browser: **http://localhost:3000**
2. Browse products catalog
3. Add a product to cart
4. Proceed to checkout

### 5.2 Create a Test Order

1. Enter email address
2. Select crypto currency (BTC, ETH, etc.)
3. Click "Pay with Crypto"

### 5.3 NOWPayments Payment Flow

1. You'll be redirected to NOWPayments sandbox payment page
2. In sandbox mode, you can simulate payment completion
3. NOWPayments will send IPN webhook to your ngrok URL

### 5.4 Monitor Webhooks

Watch your API terminal for webhook logs:

```
[NOWPAYMENTS_IPN] ✅ Received webhook for payment_id=123456
[NOWPAYMENTS_IPN] ✅ Signature verified
[NOWPAYMENTS_IPN] ✅ Payment status: finished
[FULFILLMENT] 🚀 Starting fulfillment for order=xxx
[KINGUIN] 📦 Creating order with Kinguin...
[KINGUIN_WEBHOOK] ✅ Received order.status webhook
[KINGUIN_WEBHOOK] ✅ Order dispatched, keys ready
[FULFILLMENT] ✅ Keys delivered to customer
```

---

## 📊 Step 6: Test Individual Endpoints

### Test NOWPayments IPN Manually

```bash
# Simulate a NOWPayments webhook (from your API terminal)
curl -X POST "https://YOUR_NGROK_URL/webhooks/nowpayments/ipn" \
  -H "Content-Type: application/json" \
  -H "X-NOWPAYMENTS-SIGNATURE: test_signature" \
  -d '{
    "payment_id": "123456789",
    "order_id": "YOUR_ORDER_UUID",
    "payment_status": "finished",
    "price_amount": 10.00,
    "price_currency": "usd",
    "pay_amount": 0.00025,
    "pay_currency": "btc"
  }'
```

### Test Kinguin Webhook Manually

```bash
# Simulate a Kinguin order.status webhook
curl -X POST "https://YOUR_NGROK_URL/kinguin/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Event-Name: order.status" \
  -H "X-Event-Secret: YOUR_KINGUIN_WEBHOOK_SECRET" \
  -d '{
    "orderId": "PHS84FJAG5U",
    "orderExternalId": "YOUR_ORDER_UUID",
    "status": "completed",
    "updatedAt": "2026-01-02T12:00:00.000Z"
  }'
```

---

## 🔍 Step 7: View Admin Dashboard

### Check Webhook Logs

1. Open: **http://localhost:3000/admin/webhooks**
2. You should see all received webhooks
3. Check signature verification status

### Check Order Status

1. Open: **http://localhost:3000/admin/orders**
2. Find your test order
3. Verify status progression: `pending` → `confirming` → `paid` → `fulfilled`

### Check Payments

1. Open: **http://localhost:3000/admin/payments**
2. See payment details from NOWPayments

---

## 🐛 Troubleshooting

### Webhook Not Received?

1. **Check ngrok is running** - Make sure the tunnel is active
2. **Check ngrok URL matches** - Verify URL in dashboard matches your current tunnel
3. **Check ngrok logs** - ngrok shows all incoming requests in terminal
4. **Check firewall** - Windows Firewall might block incoming requests

### Signature Verification Failed?

1. **Check secret matches** - Verify `KINGUIN_WEBHOOK_SECRET` matches dashboard
2. **Check IPN secret matches** - Verify `NOWPAYMENTS_IPN_SECRET` matches dashboard
3. **Restart API** - After changing .env, restart the API server

### Order Not Found?

1. **Check order UUID** - The `order_id` in webhook must match your database
2. **Check Kinguin order ID** - For Kinguin webhooks, we look up by `kinguinReservationId`

---

## 📝 Webhook Endpoint Summary

| Service | Endpoint | Headers | Purpose |
|---------|----------|---------|---------|
| **NOWPayments** | `POST /webhooks/nowpayments/ipn` | `X-NOWPAYMENTS-SIGNATURE` | Payment status updates |
| **Kinguin** | `POST /kinguin/webhooks` | `X-Event-Name`, `X-Event-Secret` | Order status updates |
| **Resend** | `POST /webhooks/resend/bounce` | (varies) | Email bounce handling |

---

## ✅ Testing Checklist

- [ ] ngrok tunnel running on port 4000
- [ ] NOWPayments IPN URL configured with ngrok URL
- [ ] NOWPayments IPN secret copied to `.env`
- [ ] Kinguin webhooks configured with ngrok URL
- [ ] Kinguin webhook secret copied to `.env`
- [ ] Docker containers running (Postgres, Redis)
- [ ] API server running (`npm run dev:api`)
- [ ] Web server running (`npm run dev:web`)
- [ ] Created test order in browser
- [ ] Received NOWPayments IPN webhook
- [ ] Payment status updated to `finished`
- [ ] Fulfillment process started
- [ ] Kinguin order created
- [ ] Received Kinguin order.status webhook
- [ ] Keys delivered to customer
- [ ] Order status updated to `fulfilled`

---

## 🎯 Quick Start Commands

```bash
# Terminal 1: Start infrastructure
cd c:\Users\beast\bitloot && docker-compose up -d

# Terminal 2: Start API
cd c:\Users\beast\bitloot && npm run dev:api

# Terminal 3: Start Web
cd c:\Users\beast\bitloot && npm run dev:web

# Terminal 4: Start ngrok tunnel
ngrok http 4000

# Then update .env with ngrok URL and configure webhooks in dashboards
```

---

## 📚 Reference Links

- **NOWPayments Sandbox:** https://account.sandbox.nowpayments.io/
- **NOWPayments API Docs:** https://documenter.getpostman.com/view/7907941/S1a32n38
- **Kinguin Dashboard:** https://www.kinguin.net/integration/dashboard/stores
- **Kinguin API Docs:** See `docs/Kinguin-eCommerce-API-master/`
- **ngrok Dashboard:** https://dashboard.ngrok.com/

