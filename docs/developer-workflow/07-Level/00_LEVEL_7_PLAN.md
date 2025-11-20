# Level 7: Marketing & Emails - Implementation Plan

**Status:** 🚧 In Progress
**Start Date:** November 19, 2025

## Overview
Level 7 focuses on growth and retention features:
1. **Campaign Emails:** Segmented, scheduled, and measurable email campaigns via Resend.
2. **Referral System:** User referral codes, attribution, and anti-abuse measures.
3. **Promotional Codes:** Fixed/percentage discounts, validity rules, and usage caps.

## Phase 1: Database & Infrastructure
- [ ] Create `subscribers` table (email, status, source, unsub_token)
- [ ] Create `campaigns` table (name, subject, html, audience, status)
- [ ] Create `campaign_sends` table (tracking individual sends)
- [ ] Create `email_events` table (webhooks: delivered, open, click, etc.)
- [ ] Create `promo_codes` table (code, kind, value, scope, limits)
- [ ] Create `promo_redemptions` table (tracking usage)
- [ ] Create `referrals` table (referrer, referee, status)
- [ ] Set up BullMQ queues for `campaign-delivery` and `email-events`

## Phase 2: Backend Services (NestJS)
- [ ] **Subscribers Service:** Manage subscriptions, unsubscriptions (RFC 8058), and imports.
- [ ] **Campaigns Service:** CRUD for campaigns, audience segmentation logic.
- [ ] **Email Engine:** Integration with Resend, template rendering, idempotency.
- [ ] **Promo Service:** Validate and apply promo codes during checkout.
- [ ] **Referral Service:** Generate codes, track attributions, reward logic.
- [ ] **Webhooks:** Handle Resend webhooks (delivery, opens, clicks).

## Phase 3: API & SDK
- [ ] **Admin API:** Campaign management, promo code management, subscriber lists.
- [ ] **Public API:** Subscribe/unsubscribe endpoints, validate promo code.
- [ ] **SDK Updates:** Generate new clients for frontend usage.

## Phase 4: Frontend (Next.js)
- [ ] **Admin / Marketing / Campaigns:** Campaign list, composer, scheduler.
- [ ] **Admin / Marketing / Promos:** Promo code manager.
- [ ] **Admin / Marketing / Subscribers:** Subscriber list and segmentation.
- [ ] **Checkout:** Add "Enter Promo Code" field.
- [ ] **Profile:** "Refer a Friend" section with unique link.
- [ ] **Public:** Unsubscribe page.

## Phase 5: Observability & Analytics
- [ ] **Metrics:** Campaign open rates, click rates, promo usage stats.
- [ ] **Dashboards:** Marketing performance dashboard in Admin.

## Execution Order
1. **Database Migrations:** Create all necessary tables.
2. **Backend Core:** Implement services and entities.
3. **API Layer:** Expose endpoints and update SDK.
4. **Frontend Admin:** Build management UIs.
5. **Frontend User:** Update checkout and profile.
6. **Testing & QA:** Verify flows and security.
