# BitLoot — Product Requirements Document (PRD)

***

## 0) Goal & Scope

**Goal:**  
Launch a fast, minimal crypto-first store selling digital keys and software with instant fulfillment and smooth user experience.

**Primary KPIs:**  
- Checkout conversion rate  
- Time-to-key (payment completed → key delivered)  
- Support contact rate  

**MVP Scope:**  
- Storefront (Home, Login/Signup, Product grid with Quick View modal, Cart dropdown, Product pages)  
- Product-page checkout flow: quantity → email → terms → crypto → status → key  
- Payments via NOWPayments (with IPN webhooks)  
- Fulfillment via Kinguin API + custom BitLoot products  
- Emails via Resend (orders, authentication, account, promotions)  
- File storage with Cloudflare R2 (keys and attachments, signed URLs)  
- Reviews, FAQ, Contact form  
- Live-chat widget (3rd party)  
- User dashboard for orders and key re-download  
- Admin dashboard for product sync, custom products, users, orders, pricing, logs, balance monitoring  

***

## 1) Personas & User Stories

### 1.1 Customers  
- Browse, filter, and search products quickly  
- Use Quick View or full Product Page  
- Instant crypto checkout and payment status tracking  
- Understand that underpayments are non-refundable  
- Receive email confirmations and delivery notifications  
- Securely view purchase history and re-reveal keys  
- Login/signup using email verification (6-digit OTP) and password setup  
- Recently Viewed items available  

### 1.2 Admin / Operations  
- Sync Kinguin products and manage pricing  
- Create/manage custom BitLoot-only products  
- Manage users (view, edit, reset passwords, ban/unban)  
- Track sales, fulfillment, logs, balance, analytics  
- View customer IP and location data  
- Handle refund/issue requests via live chat  
- Moderate reviews and FAQs  

### 1.3 Developers  
- Maintain integrations (Kinguin, NOWPayments, Cloudflare R2)  
- Ensure webhook/IPN reliability  
- Monitor logs and maintain testing coverage  

***

## 2) Information Architecture & Pages

### 2.1 Public  

**Home:**  
- Promo banner, header with logo, theme toggle, cart, login/signup  
- Hero with tagline, sold count, rating  
- Carousel for new, trending, promotions  
- Left sidebar (categories), topbar filters and search  
- Product grid with pagination  
- Product cards open Quick View modal or Product Page  
- FAQs, contact form, global reviews below catalog  
- Recently Viewed section above footer  
- Footer with socials, ToS, Privacy, About  
- Live chat icon bottom-right  

**Quick View Modal:**  
- Shows basic product info and buttons to add to cart or view product  
- No checkout in modal  

**Product Page:**  
- Full product details, media carousel  
- Purchase panel (quantity, promo, checkout)  
- Tabs: Description, Activation Instructions, Reviews, FAQs  
- Checkout flow: email input (guest OK), ToS acceptance, crypto payment, live status  
- Warning for underpayments (non-refunded)  
- On success, delivery page with "Reveal Key"  
- Related products below  

**Auth Pages:**  
- Login and Signup with email + 6-digit OTP + password setup  
- Forgot password with email link  
- Users may checkout without login, but login/signup needed for dashboard/history  

### 2.2 Authenticated Area  

**My Account:**  
- Order history with statuses  
- Secure key reveal and invoice download  
- Edit email/password and preferences  

### 2.3 Admin Panel  
- Dashboard with sales, errors, balance, time-to-key, customer data, analytics  
- Manage products (Kinguin and custom), orders, users, reviews, settings, logs  

***

## 3) Core Flows

### 3.1 Guest Checkout  
- Add product → checkout → enter email (no verification) → accept ToS → pay by crypto  
- IPN tracks payment status from waiting to finished  
- On finished: Kinguin fulfillment API called or internal delivery for custom products  
- Success page plus Order Created and Completed emails sent  

### 3.2 Login / Signup  
- New users: email entered → OTP sent → code verified → prompt for password → login and email confirmed  
- Returning users: password login directly after email verified  
- Forgot password via email reset link  

### 3.3 Underpayments  
- Payments less than total → marked failed and non-refundable  

### 3.4 Secure Key Delivery  
- Keys encrypted in R2, delivered via signed URL expiring after 1–2 minutes  
- Keys not included in emails  

### 3.5 Emails (Resend)  
- Order Created: summary, payment link, non-refundable notice  
- Order Completed: reveal key link and instructions  
- Authentication: OTP and password reset  
- Optional promotional emails  

***

## 4) Functional Requirements

### 4.1 Homepage  
- Responsive with filtering, quick view modal, dark/light theme, recently viewed  

### 4.2 Product Page Checkout  
- Real-time crypto conversion, underpayment warnings, guest checkout support, order tracking  

### 4.3 Authentication  
- OTP email verification  
- Password setup after verification  
- JWT-based sessions with refresh tokens  

### 4.4 Admin  
- Manage Kinguin/custom products, user CRUD, order timeline, review moderation, balance monitoring  

### 4.5 My Account  
- Order history, secure key reveal, password/email change, preferences  

***

## 5) Non-Functional Requirements

- Performance: LCP < 2.5s, TTFB < 200ms, ISR on product pages  
- Accessibility: WCAG 2.1 AA, keyboard navigation  
- Security: HMAC webhook verification, email OTP, HTTPS, CAPTCHA protection  
- Resilience: retry queues for IPN/webhooks, idempotency  

***

## 6) Integrations

- Kinguin: catalog sync and fulfillment webhooks  
- NOWPayments: payments and IPN verification  
- Resend: OTP, password reset, transactional, promotional emails  
- Cloudflare R2: encrypted storage, signed URL delivery, "viewed_at" tracking  

***

## 7) Data Model Highlights (MVP)

- Users: emails, passwords, OTP, status, IP/location  
- Products: Kinguin and custom products with attributes  
- Orders, order items, keys with encrypted storage refs  
- Reviews, payment events, webhook logs  

***

## 8) States & Edge Cases

- Underpayments fail and non-refundable  
- Wrong asset or out-of-stock resolved via support  
- Unverified login forces OTP + password setup  
- Payment failures recoverable via dashboard or email  
- Connection disruptions handled with polling/SSE  

***

## 9) Emails (Resend)

- Transactional emails avoid raw keys  
- OTP code expires in 10 minutes  
- Password reset with secure link  
- Optional marketing newsletters  

***

## 10) Analytics & KPIs

- Track events: pageviews, cart actions, payments, OTP flows, deliveries, reviews  
- KPIs: conversion rate, delivery time, underpayment rate, OTP success, average rating  

***

## 11) Acceptance Criteria (MVP)

- Guest checkout and OTP email verification working  
- Password login for verified users  
- Underpayments clearly lost  
- Admin product/user management functional  
- IPN and Kinguin webhook HMAC verified  
- Keys securely stored and revealed  
- Transactional emails sent successfully  
- Reviews visible  
- Recently Viewed section active  
- Fully responsive, accessible, SEO-optimized  

***

## 12) Tech Stack

| Layer       | Technology                            | Purpose                   |
| ----------- | ---------------------------------- | ------------------------- |
| Frontend    | Next.js (App Router) + React 19     | PWA storefront            |
| UI/UX       | Tailwind, Radix UI, shadcn/ui, Framer Motion | Modern accessible design   |
| State       | TanStack Query, Zustand              | Client/server state       |
| Backend     | NestJS (TypeScript)                  | API and integrations      |
| DB          | PostgreSQL + TypeORM                 | Persistent data           |
| Cache/Jobs  | Redis + BullMQ                      | Queues and caching        |
| Payments    | NOWPayments                        | Crypto checkout           |
| Catalog     | Kinguin + Custom                    | Hybrid inventory          |
| Storage     | Cloudflare R2                      | Secure key delivery       |
| Emails      | Resend                            | OTP and transactional     |
| Deployment  | Docker + Nginx + GitHub Actions    | CI/CD                     |
| Monitoring  | Grafana + Prometheus + Sentry      | Observability             |
| Security    | Cloudflare CAPTCHA/WAF              | Bot protection            |

***

## 13) Planned Enhancements

- Prefetch product pages  
- Image CDN optimization  
- Dynamic Trending sorting  
- Auto promo detection  
- Schema and OpenGraph SEO  

***

## 14) Delivery Plan (4 Weeks)

- Week 1: Auth, DB schema, catalog skeleton  
- Week 2: Payments integration, IPN, order flow, fulfillment  
- Week 3: Storage, emails, reviews, user management  
- Week 4: Admin dashboard, analytics, QA, launch  

***

## 15) Risks & Mitigations

| Risk            | Mitigation                         |
| --------------- | --------------------------------- |
| Underpayment    | Clear warnings, mark failed, no refund  |
| Wrong asset     | Manual support resolution          |
| Out of stock    | Manual support resolution          |
| OTP delivery   | Resend limits and retry            |
| Spam users     | CAPTCHA and bans                   |
| Webhook/IPN failure | Retry queues, logging            |
| Email deliverability | DKIM/SPF setup                  |
| Data loss      | Daily DB and R2 backups            |