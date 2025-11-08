## 🎮 **BitLoot — Project Description**

**BitLoot** is a **crypto-powered digital store** for **instant delivery** of verified **game keys, software licenses, digital subscriptions, and premium accounts** — all purchasable **exclusively with cryptocurrency**.

Designed for speed, transparency, and automation, BitLoot connects directly to the **Kinguin Sales Manager API (v1)** for product catalog synchronization and fulfillment, while using **NOWPayments** for secure, on-chain crypto transactions. Orders are delivered instantly upon blockchain confirmation — no waiting, no intermediaries.

---

### 🚀 **Core Value Proposition**

- **Instant Fulfillment:** Receive your digital key or license seconds after payment confirmation.
- **Crypto-Only Payments:** Shop using over **300 cryptocurrencies**, including BTC, ETH, USDT, BNB, and SOL.
- **Global Access:** No region locks, bank restrictions, or card failures — open to every country, 24/7.
- **Zero Friction:** Checkout in one flow — choose item → enter email → pay → receive instantly.
- **Secure Key Handling:** Keys are encrypted in **Cloudflare R2** and delivered through expiring signed URLs.
- **Transparent Policy:** Underpayments or incorrect transfers are clearly labeled as non-refundable.
- **Verified Inventory:** All listings are sourced from trusted distributors like **Kinguin** and internal BitLoot vendors.

---

### 🧩 **Platform Features**

#### 🛍️ Storefront

- Fast-loading **Next.js PWA** with product grid, Quick View modals, search, sorting, and filters.
- Real-time product sync from Kinguin’s catalog (games, software, subscriptions).
- “Recently Viewed,” global reviews, and integrated FAQs.

#### 💸 Checkout Flow

- Guest checkout with **email-only** entry (no forced signup).
- Crypto payments via **NOWPayments API**.
- Live status updates — `waiting → confirming → finished`.
- Instant fulfillment via **Kinguin Webhooks** or BitLoot internal delivery.
- Warnings for **underpayment** and **wrong asset** detection.

#### 🔑 Key Delivery

- Keys encrypted and stored on **Cloudflare R2**, accessible only through time-limited signed URLs.
- No plaintext keys in emails or logs.
- View/download available in user dashboard.

#### 👤 User Accounts

- OTP-based **email verification (6-digit code)** and password setup.
- Dashboard for viewing past orders, revealing keys, managing credentials, and preferences.

#### 🛠️ Admin Dashboard

- Manage products (Kinguin sync + custom BitLoot listings).
- View and moderate users, reviews, and FAQs.
- Monitor orders, webhooks, payment logs, and fulfillment.
- Real-time metrics: balance, time-to-key, error logs, and geolocation insights.

#### 📬 Email System (Resend)

- Order Created / Completed notifications.
- OTP and password reset flows.
- Optional marketing campaigns.

---

### ⚙️ **Technology Stack**

| Layer                  | Technology                                          | Purpose                                     |
| ---------------------- | --------------------------------------------------- | ------------------------------------------- |
| **Frontend (PWA)**     | Next.js 16 + React 19                               | SEO-optimized progressive web app           |
| **UI / UX**            | Tailwind CSS + Radix UI + shadcn/ui + Framer Motion | Responsive and animated design              |
| **State Management**   | TanStack Query + Zustand                            | Async + session state                       |
| **Forms & Validation** | React Hook Form + Zod                               | Secure checkout and auth forms              |
| **Backend**            | NestJS (TypeScript, modular architecture)           | API, integrations, and webhooks             |
| **Database**           | PostgreSQL + TypeORM                                | Persistent storage for users, orders, keys  |
| **Cache & Queues**     | Redis + BullMQ                                      | Webhook retries, payment jobs, sync queues  |
| **Payments**           | NOWPayments API                                     | 300+ crypto assets, IPN status updates      |
| **Fulfillment**        | Kinguin API                                         | Offer sync, stock reservation, key delivery |
| **Storage**            | Cloudflare R2                                       | Encrypted storage for digital assets        |
| **Emails**             | Resend                                              | Authentication and transactional messages   |
| **Deployment**         | Docker + Nginx + GitHub Actions                     | Scalable CI/CD                              |
| **Monitoring**         | Grafana + Prometheus + Sentry                       | Uptime, logs, errors                        |
| **Security**           | Cloudflare WAF + CAPTCHA + HMAC                     | Bot prevention and signature validation     |

Captcha + Throttling
Extra abuse protection

---

### 🔗 **Key Integrations**

| Integration                        | Function                   | Description                                                                      |
| ---------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| **Kinguin Sales Manager API (v1)** | Product Sync & Fulfillment | Sync 50k+ offers, manage pricing and stock, deliver keys via webhook.            |
| **NOWPayments API**                | Crypto Payments            | Create payments, handle IPN callbacks, verify signatures, process underpayments. |
| **Cloudflare R2**                  | Secure Storage             | Encrypts and delivers license keys with expiring signed URLs.                    |
| **Resend API**                     | Emails                     | Transactional messages for orders, OTP, and marketing.                           |

---

### 🔄 **End-to-End Flow**

1. **User browses** the catalog (synced via Kinguin API).
2. **Adds product to cart**, enters email, and accepts ToS.
3. **NOWPayments** creates payment → returns crypto deposit address.
4. **Customer sends crypto** → IPN callback updates order status.
5. On `finished` event:
   - **Kinguin webhook** fulfills the key → BitLoot encrypts it in R2.
   - **Custom product** fulfilled internally.

6. **Emails** (Order Created → Order Completed) are sent automatically.
7. **User receives instant delivery link** and can later re-download from dashboard.

---

### 📊 **Analytics & KPIs**

- **Checkout Conversion Rate**
- **Average Time-to-Key (payment → delivery)**
- **Underpayment Rate**
- **OTP Verification Success Rate**
- **Customer Retention (Repeat Buyers)**
- **Webhook/IPN Success Ratio**

---

### 🧱 **Architecture Overview**

```
Frontend (Next.js PWA)
   ↓
NestJS API Gateway
   ↓
────────────────────────────
• Kinguin API  ←→  Product Sync & Fulfillment
• NOWPayments  ←→  Payment Lifecycle & IPN
• Cloudflare R2 ←→  Secure Key Delivery
• Redis/BullMQ  ←→  Async Workers
• PostgreSQL    ←→  Orders, Users, Reviews
────────────────────────────
   ↓
Admin Panel & Analytics
```

---

### 🧾 **Compliance & Security**

- HMAC verification for IPN and webhooks (NOWPayments + Kinguin).
- 2FA-secured merchant operations.
- HTTPS + Cloudflare WAF.
- Data encryption for all stored keys and sensitive user info.
- Daily database and R2 backups.

---

### 📦 **MVP Deliverables**

- Crypto checkout with live payment tracking
- Kinguin + BitLoot hybrid product catalog
- Instant fulfillment via API + webhook automation
- Admin & user dashboards
- Secure R2-based key delivery
- OTP-based auth and password system
- Full email flow integration (Resend)
- Logging and monitoring suite

---

### 🌍 **Target Users**

- **Gamers & Enthusiasts** — instant, verified game keys with crypto checkout.
- **Crypto-Native Buyers** — borderless and private payments, no KYC.
- **Developers & Streamers** — quick access to software and premium tools.
- **Students & Professionals** — affordable software keys with instant activation.
- **Privacy-Focused Shoppers** — anonymous checkout via crypto only.
- **Global Market** — frictionless access regardless of location or payment restrictions.

---

### ✅ **Summary**

BitLoot is the **next-generation crypto e-commerce platform** for instant, automated digital product delivery.
By combining **NOWPayments** (for trustless crypto payments) with **Kinguin’s API** (for verified inventory and fulfillment), BitLoot delivers a **self-custodial, borderless buying experience** — blending Web3 simplicity with modern digital commerce.
