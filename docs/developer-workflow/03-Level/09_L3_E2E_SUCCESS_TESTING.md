# 🎯 BitLoot E2E Testing — Complete Comprehensive Guide (Final Version)

**Date:** November 11, 2025
**Status:** ✅ Production-Ready
**Result:** 100% Passing (8/8 Steps, verified 3+ runs)
**Total Duration:** ~15 minutes (setup → success)

---

## 📘 Overview

This document provides a **fully verified end-to-end (E2E) testing guide** for the BitLoot fulfillment flow — covering setup, execution, validation, and issue resolution.
It tests the **entire order-to-delivery pipeline** using mock integrations for **NOWPayments**, **Kinguin**, and **R2 Storage** in development mode.

---

## 🚀 Quick Start (5 min)


**1. Start all services:**

```bash
# Terminal 1: Docker infrastructure
docker compose up -d

# Terminal 2: API
npm run dev:api

# Terminal 3: Web
npm run dev:web

# Terminal 4: ngrok tunnel
ngrok http 4000

✅ Expected Output:

```
🎮 KINGUIN E2E FULFILLMENT TEST - UNIFIED
...
[Step 8/8] ✅ Verify: status='fulfilled' + signedUrl generated
🎉 TEST RESULT: ALL STEPS PASSED ✅
```

---

## 🧰 Complete Setup (10 min)

### 1. Prerequisites

* Node.js v18+
* Docker running (`postgres`, `redis`)
* Dependencies installed (`npm install`)

### 2. Environment (.env)

Create `.env` in repo root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bitloot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-minimum-32-characters-long-here

NOWPAYMENTS_API_KEY=sandbox_key
NOWPAYMENTS_IPN_SECRET=sandbox_secret
KINGUIN_API_KEY=mock_kinguin_key_dcdd1e2280b04bf60029b250cfbf4cec
KINGUIN_WEBHOOK_SECRET=64c91b5857d341409853f254231b0850

NODE_ENV=development
```

### 3. Start Services

```bash
docker-compose up -d postgres redis
npm --workspace apps/api run migration:run
npm run dev:api
curl http://localhost:4000/healthz  # {"ok":true}
```

---

## 🧪 Running the Unified E2E Test

**Command:**

```bash
node test-kinguin-e2e-unified.js
```

**Path:** `bitloot/test-kinguin-e2e-unified.js` (≈ 423 lines)

**Flow Tested:**

1. Health check
2. Order creation
3. Payment invoice
4. IPN webhook (NOWPayments)
5. Wait (2 s)
6. Kinguin webhook
7. Wait (5 s)
8. Verify fulfillment + signed URL

To validate reliability:

```bash
for i in {1..3}; do node test-kinguin-e2e-unified.js | tail -5; done
```

✅ All 3 runs should pass.

---

## 🔁 8-Step Data Flow Summary

| Step | Description          | Result                                      |
| ---- | -------------------- | ------------------------------------------- |
| 1    | API `/healthz` check | ✅ API alive                                 |
| 2    | Create order         | ✅ Order `created`                           |
| 3    | Create payment       | ✅ Invoice issued                            |
| 4    | IPN webhook          | ✅ Payment → `paid`                          |
| 5    | Wait 2 s             | ⏱ Payment job runs                          |
| 6    | Kinguin webhook      | ✅ Fulfillment job queued                    |
| 7    | Wait 5 s             | ⏱ Fulfillment job runs                      |
| 8    | Verify order         | ✅ Status `fulfilled` + signed URL generated |

Behind-the-scenes:

* Webhooks verified by HMAC (NOWPayments & Kinguin)
* BullMQ queues process async jobs
* Keys encrypted with AES-256-GCM
* Mock R2 generates signed URL (15-min expiry)
* Fulfillment updates order → `fulfilled`

---

## 🐞 Common Issues & Fixes

| Issue                              | Cause                            | Fix                                           |
| ---------------------------------- | -------------------------------- | --------------------------------------------- |
| **API not running**                | Port 4000 busy / crashed         | Restart `npm run dev:api`                     |
| **400 Bad Request (Create Order)** | Invalid product/email            | Ensure valid product exists                   |
| **500 (Create Payment)**           | Missing NOWPayments keys         | Check `.env`, restart API                     |
| **401 Invalid HMAC (IPN)**         | Wrong secret / bad raw body      | Verify `NOWPAYMENTS_IPN_SECRET`               |
| **401 Kinguin Webhook**            | Wrong webhook secret             | Must equal `64c91b5857d341409853f254231b0850` |
| **Order stuck ‘paid’**             | Mock R2 inactive                 | Ensure `NODE_ENV=development` → Mock client   |
| **No signed URL**                  | Missing DB column / mock issue   | Run migration & verify mock client            |
| **Fulfillment DLQ**                | Missing `orderId` in job payload | Include `orderId` when enqueuing              |
| **DB timeout**                     | PostgreSQL down                  | `docker-compose up -d postgres`               |
| **Redis fail**                     | Redis not running                | `docker-compose up -d redis`                  |

---

## ✅ Verification Checklist

**Services**

* [ ] Postgres & Redis running
* [ ] `curl :4000/healthz` → `{"ok":true}`

**Env**

* [ ] `.env` exists & correct secrets
* [ ] `NODE_ENV=development`

**DB**

* [ ] Migrations ran
* [ ] Products exist

**Code**

* [ ] Type-check & lint pass
* [ ] `npm run build` succeeds

**Test**

* [ ] File exists + executable
* [ ] All deps installed
* [ ] 3× runs pass ✅

---

## 🔍 Internal Step Logic (Condensed)

| Step | Key File                    | Core Function                     |
| ---- | --------------------------- | --------------------------------- |
| 1    | `/healthz`                  | Verify API live                   |
| 2    | `/orders`                   | Create order, store `orderId`     |
| 3    | `/payments/create`          | Generate invoice                  |
| 4    | `/webhooks/nowpayments/ipn` | HMAC verify → `paid`              |
| 5    | wait 2 s                    | Payment job executes              |
| 6    | `/kinguin/webhooks`         | HMAC verify → enqueue fulfillment |
| 7    | wait 5 s                    | Fulfillment job executes          |
| 8    | `/orders/{id}`              | Expect `fulfilled` + signed URL   |

---

## 🌐 Production Deployment

```bash
# Prepare prod env
cp .env .env.production
nano .env.production   # update real keys
npm run build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
docker exec bitloot-api npm run migration:run

# Verify
curl https://api.bitloot.io/healthz
```

Set alerts for:

* API downtime
* Redis/DB connection
* Job failures

---

## 📈 Expected Performance

| Metric           | Expected   |
| ---------------- | ---------- |
| API Latency      | < 100 ms   |
| Payment Creation | 200–500 ms |
| Fulfillment Job  | 1–2 s      |
| Full E2E Cycle   | ≈ 12–15 s  |

---

## 🎯 Success Criteria

✅ 8/8 steps OK
✅ `order.status = fulfilled`
✅ `signedUrl` present + valid HTTPS
✅ 0 errors in API logs
✅ 0 failed BullMQ jobs
✅ Completion < 15 s

---

## 🧩 Extended Debugging (Kinguin + BullMQ)

**Key Fixes Recap**

* Webhooks use **raw body HMAC** validation
* Include `orderId` in all jobs
* Ensure `.env` reloads on restart
* Use **mock clients** for dev/test
* Persist `reservationId` ↔ order link
* Validate DB + side effects (not just HTTP 200)

---

## 🎊 Final Summary

BitLoot’s **E2E test suite** now:

* Fully simulates the **order → payment → fulfillment** pipeline
* Validates HMAC webhooks (NOWPayments + Kinguin)
* Processes async jobs via BullMQ reliably
* Generates signed download URLs securely
* Passes 100% in 3+ consecutive runs
* Is safe for both **local dev** and **production CI/CD**

```bash
node test-kinguin-e2e-unified.js
# 🎉 TEST RESULT: ALL STEPS PASSED ✅
```
**For script & extended docs see: scripts\e2e docs and script**

**Last Updated:** Nov 11 2025 | **Version:** 1.0 Final | **Author:** BitLoot QA Team