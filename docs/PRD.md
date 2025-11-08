# BitLoot — Product Requirements Document (PRD)

---

## 0) Goal & Scope

**Goal:**
Launch a fast, minimal crypto-first store that sells digital keys and software with instant fulfillment and a frictionless user experience.

**Primary KPIs:**

- Checkout conversion rate
- Time-to-key (payment finished → key delivered)
- Support contact rate

**In scope (MVP):**

- Storefront (Home, Login/Signup, Product grid & **Quick View modal**, Cart dropdown, Product pages)
- **Product-Page checkout flow** (quantity → email → terms → crypto → status → key)
- Payments via **NOWPayments** (IPN webhooks)
- Fulfillment via **Kinguin API** + **Custom BitLoot Products**
- Emails via **Resend** (orders, authentication, account, promotions)
- File storage via **Cloudflare R2** (keys/attachments, signed URLs)
- Reviews + FAQ + Contact form
- Live-chat widget (3rd party)
- User dashboard (orders & key re-download)
- Admin dashboard (sync, custom products, users, orders, pricing, logs, balance monitor)

---

## 1) Personas & Top User Stories

### 1.1 Customers

- Browse, filter, sort, and search products quickly.
- Use Quick View for previews or open the full Product Page.
- Purchase instantly via crypto checkout.
- See payment status and receive keys instantly once confirmed.
- Understand that **underpayments are lost and non-refundable**.
- Receive confirmation and delivery emails.
- View purchase history and re-reveal keys securely.
- **Login/signup using email verification (6-digit code) and password setup.**
- See “Recently Viewed” items above the footer.

### 1.2 Admin / Operations

- Sync Kinguin products and manage pricing.
- Create & manage **custom BitLoot-only products**.
- Manage users (view, edit, reset password, ban/unban).
- Track sales, fulfillment, balance, logs, and analytics.
- See customer IP + location data in the admin dashboard.
- Handle all refund/issue requests manually via live chat.
- Moderate reviews and FAQs.

### 1.3 Developers

- Maintain integrations (Kinguin + NOWPayments + R2).
- Keep webhook/IPN reliability high.
- Ensure observability, logs, and testing coverage.

---

## 2) Information Architecture & Pages

### 2.1 Public

#### **Home**

- Dismissible top banner for promos/alerts.
- Header: logo (left), dark/light toggle + cart dropdown + login/signup (right).
- Hero: tagline, sold count, average rating.
- Carousel: new arrivals, trending, promotions.
- Two-column layout:
  - **Left sidebar:** categories,
  - **Topbar**: search, filters, sorting.
  - **Right:** product grid with pagination.

- Product card → Quick View modal or **Product Page**.
- Below catalog: FAQs, Contact form, global reviews.
- **Recently Viewed** section above footer.
- Footer: socials, ToS, Privacy, About.
- Live-chat icon (bottom-right).

#### **Product Quick View Modal**

- Shows title, price (USD), short description, image, platform, region, sold count, rating.
- Buttons: **Add to Cart** | **View Product**.
- No checkout inside modal.

#### **Product Page (`/product/[slug]`)**

- Full detail and checkout flow.
  - Title, price, sold count, rating, platform, region.
  - Media carousel.
  - Purchase panel (quantity, promo, checkout).
  - Tabs: **Description | Activation Instructions | Reviews | FAQs**
  - **Checkout flow:**
    - Email input (for guest checkout; no confirmation needed at this step)
    - Accept ToS
    - Choose crypto (NOWPayments)
    - ⚠️ _Warning:_ “If you send less than the total amount, your payment will not be processed or refunded.”
    - Live payment status

  - After success: show delivery page with “Reveal Key”.
  - Related products below.

#### **Auth Pages**

- **Login**
  - Step 1: Enter email
  - If email is **not confirmed**, send a **6-digit OTP** → prompt for code → verify → force user to set password. → dashboard page
  - If email is **already confirmed and password exists**, show password field directly for login.

- **Signup**
  - Collect email → send 6-digit code → verify → set password → account created.

- **Forgot Password / Reset**
  - Email link to reset password.

#### **Success / Cancel**

- Users/Customers are not forced to login/signup to create a checkout. he enters the email which is required but not forced to confirm it. however if he wants
  to login/signup using that email he needs to confirm and set a password in order to the dashboard and history of his inovices.

---

### 2.2 Authenticated Area

#### **My Account**

- Order history with statuses.
- Secure key reveal & optional invoice download.
- Edit email/password.
- Preferences (newsletter, default theme, billing info).

### 2.3 Admin Panel

- **Dashboard:** sales, errors, balance, average time-to-key, customer IP/location, analytics.
- **Products:** manage Kinguin & create/edit/delete custom products.
- **Orders:** status timeline (IPN → Kinguin → delivered), logs, delivery status.
- **Users:** view/search, edit info, reset password, ban/unban.
- **Reviews:** approve/edit/delete.
- **Settings:** pricing rules, email templates, banners, FAQs, promos.
- **Logs:** payment events, IPN/webhook errors.

---

## 3) Core Flows

### 3.1 Guest Checkout

1. User adds product to cart → proceeds to checkout.
2. Enters **email address** (no verification required).
3. Accepts ToS and initiates crypto payment.
4. IPN monitors status (`waiting → confirming → finished`).
5. On `finished`:
   - Kinguin product → create via API → fulfill via webhook.
   - Custom product → internal delivery.

6. User sees success page + receives two emails (Order Created + Completed).

### 3.2 Login / Signup Flow

**Signup or Login (New User):**

- Enter email → system detects unconfirmed → send 6-digit code.
- User enters code → verified.
- Prompt: “Set your password.”
- Once password set, user logged in and email marked confirmed.

**Returning User:**

- Enter email → system detects confirmed email → show password field → login directly.

**Forgot Password:**

- Send reset link via email.

### 3.3 Underpayment

- Payment < total amount → mark as “failed,” show “Payment lost and non-refundable.”

### 3.4 Secure Key Delivery

- Keys encrypted in R2; retrieved via signed URL (1–2 minute expiry).
- Not included in emails.

### 3.5 Emails (Resend)

- **Order Created:** summary + payment link + non-refundable notice.
- **Order Completed:** reveal key link + redemption guide.
- **Authentication:**
  - Email confirmation OTP (6 digits)
  - Password reset links

- **Promotional:** optional marketing campaigns.

---

## 4) Functional Requirements

### 4.1 Homepage

- Responsive layout.
- Sidebar filtering and sorting.
- Quick View modal.
- Dark/light theme saved per user.
- Recently Viewed section above footer.

### 4.2 Product Page Checkout

- Real-time crypto conversion.
- Clear underpayment/non-refundable warnings.
- Guest checkout supported (email only).
- Order progress tracking.

### 4.3 Authentication

- OTP-based email verification (6-digit code).
- Password setup only after email verification.
- Password login available once email confirmed.
- Token-based sessions (JWT + refresh).

### 4.4 Admin

- Manage Kinguin & custom products.
- User CRUD (view/edit/reset/ban).
- Track order timeline & metrics (avg delivery time, IP, geo).
- Review moderation.
- Balance monitor & event logs.

### 4.5 My Account

- Order history, secure key reveal.
- Change password/email.
- Newsletter & theme preferences.

---

## 5) Non-Functional Requirements

- **Performance:** LCP < 2.5s; TTFB < 200ms; ISR for product pages.
- **Accessibility:** WCAG 2.1 AA; keyboard navigation.
- **Security:**
  - HMAC verification (IPN)
  - Webhook secrets
  - OTP-based email verification
  - HTTPS enforced
  - CAPTCHA via Cloudflare

- **Resilience:** retry queues for IPN/webhooks; idempotent orders.

---

## 6) Integrations

### Kinguin

- Catalog sync, webhook fulfillment (`reserve`, `give`, `delivered`, etc.).

### NOWPayments

- Payment creation + IPN verification.
- Underpayment = failed (non-refundable).

### Resend

- OTP, password reset, transactional, promotional emails.

### Cloudflare R2

- Encrypted storage (keys, media).
- Signed URLs + “viewed_at” tracking.

---

## 7) Data Model (MVP)

**users:** id, email, password_hash, email_confirmed (bool), otp_code, otp_expires_at, status (active/banned), created_at, updated_at, last_ip, last_location
**products:** id, slug, type(`kinguin`|`custom`), kinguin_product_id?, title, description, platform, region, images[], price_usd_cents, stock, is_active, created_at
**orders:** id, user_id?, email, status, total_usd_cents, crypto_currency, np_payment_id, kinguin_reservation_id?, created_at, ip, location
**order_items:** order_id, product_id, quantity, unit_price_usd_cents
**keys:** id, order_item_id, storage_ref, viewed_at, checksum
**reviews:** id, product_id, user_id?, rating, text, created_at, approved
**payment_events:** id, np_payment_id, status, payload, created_at
**webhook_logs:** id, source, payload_json, processed_at, status, error

---

## 8) States & Edge Cases

| Case                     | Behavior                                |
| ------------------------ | --------------------------------------- |
| Underpayment             | Warn, mark failed, non-refundable       |
| Wrong asset              | Mark failed; handled via support        |
| Out of stock             | Manual support fix                      |
| Unverified email (login) | Force OTP verification + password setup |
| Verified user login      | Password field visible                  |
| Payment dropped          | Recover via My Orders or email link     |
| Connection lost          | Restore via polling/SSE                 |

---

## 9) Emails (Resend)

- **Order Created / Completed** — transactional, no raw keys.
- **OTP Email Verification** — send 6-digit code, expires in 10 minutes.
- **Password Reset** — link for reset.
- **Marketing / Newsletter** — optional.

---

## 10) Analytics (Events & KPIs)

**Events:** page_view, quick_view_open, add_to_cart, view_product, checkout_started, payment_created, payment_finished, otp_sent, otp_verified, kinguin_delivered, key_revealed, review_submitted.
**KPIs:** conversion rate, avg delivery time, underpayment rate, OTP verification success rate, average rating.

---

## 11) Acceptance Criteria (MVP)

- [ ] Guest checkout (email only) works.
- [ ] OTP email verification + password setup flow works.
- [ ] Verified users can log in with password.
- [ ] Underpayments clearly marked lost.
- [ ] Admin can create custom products & manage users.
- [ ] IPN + Kinguin webhooks verified (HMAC).
- [ ] Keys stored securely & revealed from R2.
- [ ] All transactional emails sent successfully.
- [ ] Reviews visible post-delivery.
- [ ] Recently Viewed section active.
- [ ] Fully responsive, accessible, SEO-optimized.

---

## 12) Tech Stack

| Layer          | Technology                                   | Purpose                  |
| -------------- | -------------------------------------------- | ------------------------ |
| **Frontend**   | Next.js (App Router) + React 19              | PWA storefront           |
| **UI/UX**      | Tailwind, Radix UI, shadcn/ui, Framer Motion | Modern accessible design |
| **State**      | TanStack Query, Zustand                      | Client/server state      |
| **Backend**    | NestJS (TypeScript)                          | API + integrations       |
| **DB**         | PostgreSQL + TypeORM                         | Persistent data          |
| **Cache/Jobs** | Redis + BullMQ                               | Queues, caching          |
| **Payments**   | NOWPayments                                  | Crypto checkout          |
| **Catalog**    | Kinguin + Custom                             | Hybrid inventory         |
| **Storage**    | Cloudflare R2                                | Secure key delivery      |
| **Emails**     | Resend                                       | OTP + transactional      |
| **Deployment** | Docker + Nginx + GitHub Actions              | CI/CD                    |
| **Monitoring** | Grafana + Prometheus + Sentry                | Observability            |
| **Security**   | Cloudflare CAPTCHA/WAF                       | Bot protection           |

---

## 13) Enhancements (Planned)

- Prefetch product pages for speed.
- Image CDN optimization.
- Dynamic “Trending” sorting.
- Auto promo detection.
- Schema / OpenGraph SEO.

---

## 14) Delivery Plan (4 Weeks)

**Week 1:** Auth (OTP + password), DB schema, catalog sync, frontend skeleton.
**Week 2:** NOWPayments integration, IPN, order flow, Kinguin/custom fulfillment.
**Week 3:** R2 storage, emails, reviews, user management.
**Week 4:** Admin dashboard, analytics (delivery time, IP/location), QA, launch.

---

## 15) Risks & Mitigations

| Risk                 | Mitigation                            |
| -------------------- | ------------------------------------- |
| Underpayment         | Clear warning, mark failed, no refund |
| Wrong asset          | Manual chat resolution                |
| Out of stock         | Manual chat resolution                |
| OTP delivery failure | Resend limit + fallback retry         |
| Spam users           | CAPTCHA + ban tools                   |
| Webhook/IPN failure  | Retry queues, logging                 |
| Email deliverability | DKIM/SPF setup                        |
| Data loss            | Daily DB & R2 backups                 |

---

✅ **Final Result:**
BitLoot’s PRD now includes **OTP-based authentication**, hybrid product catalog, clear crypto-payment policy, and full-stack integrations — ready for development and launch.
