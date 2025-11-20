---
trigger: always_on
---

BitLoot — Full Product Requirements Document (Unified PRD)

Version: 1.0
Status: Final
Scope: MVP + Core Platform Foundations
Audience: Product, Engineering, Design, QA, DevOps

0) Executive Summary

BitLoot is a crypto-only digital storefront for instant delivery of game keys, software licenses, subscriptions, and premium digital accounts.
Customers pay exclusively with cryptocurrency, and keys are fulfilled instantly through:

NOWPayments → crypto payments, IPN lifecycle

Kinguin Sales Manager API v1 → catalog + order fulfillment

Cloudflare R2 → encrypted key storage with expiring signed URLs

BitLoot combines Web3-style frictionless checkout with e-commerce reliability via stable integrations, secure automation, and global accessibility.

1) Goals & KPIs
🎯 Primary Goal

Launch a fast, secure, crypto-native store with instant fulfillment, minimal friction, and global availability.

📈 Primary KPIs

Checkout Conversion Rate

Average Time-to-Key (payment confirmation → key delivered)

After-Sale Contact Rate

Return Buyer Rate

IPN/Webhook Success Ratio

2) Core Value Proposition

⚡ Instant key delivery — seconds after blockchain confirmation

🌍 Global & permissionless — no banks, no KYC, no region locks

🔐 Secure delivery — encrypted keys in R2, only accessible via temporary signed URLs

💱 300+ crypto assets accepted

🤝 Verified inventory from Kinguin + internal vendors

🧩 Hybrid catalog — automatic sync + custom BitLoot products

📦 No account required (guest checkout supported)

3) Personas
👤 Customers

Browse/search/filter products quickly

Checkout with email-only (guest OK)

Track payment → fulfillment → delivery

Reveal keys securely

Login with OTP verification

🛠️ Admin / Operations

Manage products (Kinguin sync + custom)

Track sales, fulfillment, payments

Moderate users, reviews, FAQs

Monitor logs, balance, analytics

👨‍💻 Developers

Maintain integrations

Ensure webhook/ipn reliability

Keep codebase type-safe and test-covered

4) End-to-End User Journey

User browses product catalog

Adds product → opens checkout modal

Enters email (guest OK) + accepts ToS

NOWPayments creates payment → returns wallet address + amount

User sends crypto → blockchain confirmation

IPN → order status updates to finished

Kinguin API (or custom fulfillment) provides key

BitLoot encrypts key → stores in R2 → generates expiring signed URL

User receives Order Completed email with link

User can re-download key from dashboard

5) Features
🛍️ 5.1 Storefront

Next.js 16 PWA

Hero banners, carousels, trending, promotions

Product grid with filters, search, sorting

Quick View modal

Recently Viewed

Global FAQs and Review section

Live-chat widget (3rd-party)

📄 5.2 Product Page

Media carousel

Full description + activation instructions

Purchase panel (qty, email, ToS, checkout)

Reviews, ratings, FAQs

Related products

Live crypto price conversion

Checkout panel with real-time status

💸 5.3 Checkout

Email-only guest checkout

ToS acceptance mandatory

NOWPayments integration

Real-time status stream (polling / SSE)

Underpayment → marked failed/non-refundable

Wrong asset → support resolution

Success → instant delivery page + reveal key

🔐 5.4 Secure Key Delivery

Keys never appear in plaintext anywhere (logs/emails/UI)

Encrypted AES-256 payload stored in R2

Delivered via signed URLs (1–2 min expiry)

Key reveal only for authenticated users or one-time link

👤 5.5 User Accounts

OTP verification (6-digit code)

Password setup after OTP

JWT-based sessions with refresh tokens

My Account: order history, secure key reveal, profile settings

🛠️ 5.6 Admin Dashboard

Product management (Kinguin + custom)

Sync jobs & logs

Price overrides & dynamic pricing rules

Orders timeline (payment→fulfillment→delivery)

Users CRUD & bans

Reviews & FAQs moderation

Webhook/log browser

Balance monitoring & payments analytics

System metrics:

Time-to-key

IPN fail rates

Region heatmap

Error logs

📬 5.7 Email System (Resend)

Order Created

Order Completed

OTP verification

Password reset

Marketing/promotional campaigns

6) Architecture & Technical Overview
🧱 6.1 High-Level Architecture
Next.js PWA (frontend)
   ↓
NestJS API Gateway
   ↓
────────────────────────────────────
• Kinguin API      ←→  Sync + Fulfillment
• NOWPayments      ←→  Payments + IPN
• Cloudflare R2    ←→  Encrypted key storage
• Redis + BullMQ   ←→  Queues + retries + caching
• PostgreSQL       ←→  Users, Orders, Products
────────────────────────────────────
   ↓
Admin Panel + Analytics

7) Technology Stack
Layer	Technology	Purpose
Frontend	Next.js 16, React 19	PWA storefront
UI	Tailwind v4, Radix UI, shadcn/ui, Framer Motion	Modern UI/UX
State	TanStack Query, Zustand	Client & server state
Forms	React Hook Form + Zod	Validation
Backend	NestJS (modular TS architecture)	API + integrations
DB	PostgreSQL + TypeORM	Persistent storage
Cache & Jobs	Redis + BullMQ	Queues, webhook retries
Payments	NOWPayments	Crypto checkout
Catalog	Kinguin Sales Manager API v1	Inventory sync + fulfillment
Storage	Cloudflare R2	Encrypted key storage
Emails	Resend	OTP + transactional + marketing
Deploy	Docker, Nginx, GitHub Actions	CI/CD
Monitoring	Grafana, Prometheus, Sentry	Observability
Security	Cloudflare WAF, HMAC, CAPTCHA	Abuse prevention
8) Integrations
🔗 8.1 Kinguin Sales Manager API (v1)

Sync 50k+ products with delta updates

Get offers, pricing, stock

Order creation + fulfillment callback

Webhook/HMAC validation

🪙 8.2 NOWPayments

Create payments

Track payment lifecycle

Validate underpayments

IPN signature verification (HMAC)

☁️ 8.3 Cloudflare R2

AES-256 encrypted value

Signed URL delivery

No raw keys stored locally

✉️ 8.4 Resend

OTP, reset password, order emails

Marketing broadcasts

RFC 8058 unsubscribe

9) Core Flows
9.1 Guest Checkout (Main User Flow)

Add product

Checkout modal

Enter email → ToS

Get crypto address

User sends payment

IPN updates order status

Fulfillment triggered

Key encrypted → R2 → signed URL

Delivery on success screen + email

9.2 Authentication Flow

Email → OTP (6-digit)

OTP verified → password setup

Login → access/refresh JWT

Forgot password → email link

9.3 Underpayment Handling

Underpayment flagged as failed

Non-refundable (explicit warnings)

Email + dashboard status

9.4 Delivery Flow

Key decrypted in backend only

R2 signed URL generated

User views key → audit logged

URL expires to prevent leakage

10) Data Model (MVP)
Users

email, password hash

otp_code, otp_expires

device info, IP/location

created_at, updated_at

Products

id, name, type (kinguin/custom)

media, description, instructions

pricing rules, cost, margin

stock, region, attributes

Orders

items[], email

payment info

fulfillment info

delivery status

R2 encrypted key references

Reviews & FAQs

Small CMS-like tables for content.

Logs

payment events

webhook events

system errors

sync jobs

11) Functional Requirements
11.1 Homepage

Fully responsive

Filters, search, categories

Trending & promotions

Recently viewed

SEO + OpenGraph

11.2 Product Page Checkout

Real-time crypto conversion

Underpayment warnings

Guest checkout

Status progress UI

11.3 Authentication

Email OTP

Password setup

JWT with refresh

Rate limiting + CAPTCHA

11.4 Admin

Full CRUD for products, users, orders

Price controls & overrides

Logs & metrics

Webhook inspector

Import/export data

11.5 My Account

Order history

Secure key reveal

Profile settings

Session management

12) Non-Functional Requirements

Performance:

LCP < 2.5s

API TTFB < 200ms

Product pages ISR for speed

Accessibility: WCAG 2.1 AA

Security:

HMAC verification

CAPTCHA

OTP + password

HTTPS-only

JWT + refresh rotation

Reliability:

Retry queues (IPN/webhooks)

Idempotency keys

Backups: daily DB + R2

13) States & Edge Cases

Underpayments → failed

Wrong asset → support resolution

Out-of-stock → admin/manual

Kinguin timeout → retry queue

OTP not delivered → resend + rate-limit

Payment stuck → manual resolution via admin

Delivery URL expired → regenerate from dashboard

14) Emails (Resend)
Transactional

Order Created

Order Completed

OTP (10 min expiry)

Password reset

Marketing (optional)

Promotions

Trending games

Price drops

No email ever contains plaintext keys.

15) Analytics & KPIs

Track events:

Pageviews

Add to cart

Checkout started

OTP success/fail

Payment created

Payment completed

Delivery success

User retention

Repeat buyers

Dashboard KPIs:

Conversion rate

Average time-to-key

Underpayment rate

IPN/webhook failure rate

OTP verification rate

Average rating

16) Acceptance Criteria (MVP)

Guest checkout works end-to-end

OTP auth + password login

NOWPayments + Kinguin + R2 fully integrated

Order status updates correctly

Underpayments flagged & explained

End-to-end encryption for keys

Signed URL delivery working

Admin panel operational

SEO & responsive

Complete logging and monitoring

Reviews visible

Recently viewed active

17) Delivery Plan (4 Weeks)
Week 1

Auth system

DB schema

Catalog & product infrastructure

Week 2

Payments, IPN lifecycle

Order flow

Fulfillment logic

Week 3

R2 encrypted storage

Emails

Reviews & users

Week 4

Admin dashboard

Analytics

QA + launch

18) Risks & Mitigations
Risk	Mitigation
Underpayments	Clear warnings + non-refundable policy
Wrong asset	Manual support
Out of stock	Admin resolution
OTP failures	Retry logic + fallback
Spam attacks	CAPTCHA, bans
Webhook failures	Retry queues
Email deliverability	DKIM + SPF
Data Loss	Daily backups
19) Summary

BitLoot is a crypto-native, instant-delivery e-commerce platform powered by a hybrid product catalog, on-chain payments, and automated fulfillment.
It delivers secure, global, fast purchasing with minimal friction and maximum transparency, backed by modern engineering standards, monitoring, and operational control.