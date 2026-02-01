# 🔄 Webhook Logs Admin Dashboard - Complete Implementation

**Status:** ✅ **COMPLETE**  
**Completed:** January 14, 2026  
**Author:** BitLoot Engineering Team

---

## Implementation Summary

The Webhook Logs Admin Dashboard has been fully implemented with all planned features. This document serves as both the original specification and the practical usage guide for administrators.

### What Was Built

| Feature | Status | Location |
|---------|--------|----------|
| Dashboard Overview | ✅ Complete | `/admin/webhooks` |
| Webhook Logs List | ✅ Complete | `/admin/webhooks/logs` |
| Webhook Detail Page | ✅ Complete | `/admin/webhooks/logs/[id]` |
| Order Webhook History | ✅ Complete | Embedded in `/admin/orders/[id]` |
| Statistics API | ✅ Complete | `GET /admin/webhook-logs/stats` |
| Timeline API | ✅ Complete | `GET /admin/webhook-logs/timeline` |
| Bulk Replay | ✅ Complete | `POST /admin/webhook-logs/bulk-replay` |
| Navigation (Prev/Next) | ✅ Complete | `GET /admin/webhook-logs/:id/adjacent` |

---

## 🎯 Admin Guide: Day-to-Day Usage

### Why Webhooks Matter

Webhooks are the backbone of BitLoot's payment and fulfillment system. When a customer pays:

```
Customer Pays → NOWPayments → Webhook to BitLoot → Order Fulfilled → Keys Delivered
```

If any webhook fails, orders get stuck. The webhook dashboard lets you:
- **Monitor** system health in real-time
- **Diagnose** issues when orders fail
- **Recover** from failures without customer intervention
- **Audit** all payment events for compliance

---

### 📊 Daily Health Check (2 minutes)

**When:** Start of each business day  
**Where:** `/admin/webhooks`

1. **Check the Stats Cards**
   - 🟢 **Success Rate > 95%** = Healthy
   - 🟡 **Success Rate 90-95%** = Investigate
   - 🔴 **Success Rate < 90%** = Action Required

2. **Look for Red Flags**
   - **Invalid Signatures > 0**: Possible security issue or misconfigured IPN secret
   - **Failed Count Spiking**: Backend service might be down
   - **Duplicate Count High**: Network issues causing retries

3. **Review the Activity Chart**
   - Smooth line = Normal operation
   - Sudden dips = Service outage (check when it happened)
   - Spikes in failed = Investigate those time periods

---

### 🔍 Investigating a Stuck Order

**Scenario:** Customer says "I paid but didn't get my keys"

**Steps:**

1. **Go to Order Detail Page**
   - Navigate to `/admin/orders/[order-id]`
   - Scroll to "Webhook History" section at bottom

2. **Check Webhook Status**
   
   | What You See | What It Means | Action |
   |--------------|---------------|--------|
   | No webhooks | Payment never confirmed by NOWPayments | Check NOWPayments dashboard |
   | Webhook with "Pending" | Received but not processed | Click "Replay Webhook" |
   | Webhook with "Failed" + Error | Processing failed | Read error, fix issue, replay |
   | Webhook with "Processed" ✓ | Successfully handled | Check fulfillment queue |
   | Invalid Signature ✗ | Security issue | Do NOT replay - investigate source |

3. **Use Replay Webhook**
   - Click the webhook in the history
   - Click "Replay Webhook" button
   - System will reprocess it
   - Refresh order page to see updated status

---

### 🛠️ Common Scenarios & Solutions

#### Scenario 1: "Webhook shows Failed with database error"

**Cause:** Temporary database connectivity issue  
**Solution:** 
1. Go to webhook detail page
2. Click "Replay Webhook"
3. If still fails, check database health in infrastructure monitoring

#### Scenario 2: "Multiple webhooks for same payment"

**This is normal!** NOWPayments sends webhooks for each status change:
- `waiting` → Payment created
- `confirming` → Blockchain confirmations in progress
- `confirmed` → Enough confirmations
- `sending` → Payout in progress (if applicable)
- `finished` → Payment complete ✅

Only the `finished` webhook triggers fulfillment.

#### Scenario 3: "Invalid Signature on webhook"

**⚠️ Security Alert!** This means either:
1. Your `NOWPAYMENTS_IPN_SECRET` is wrong
2. Someone is sending fake webhooks

**Do NOT replay invalid signature webhooks!**

**Solution:**
1. Check the Source IP - is it from NOWPayments?
2. Verify your IPN secret in `.env` matches NOWPayments dashboard
3. If suspicious IP, consider blocking it

#### Scenario 4: "Order fulfilled but customer says wrong key"

**Steps:**
1. Go to order detail page
2. Check the fulfillment webhook
3. Click "View Key" to see what was delivered
4. Check Kinguin order if it was Kinguin fulfillment
5. If key is wrong, contact Kinguin support with their order ID

---

### 📈 Weekly Review (10 minutes)

**When:** Weekly, Monday morning  
**Where:** `/admin/webhooks`

1. **Switch to 7-day view** using the period selector

2. **Analyze Trends**
   - Is webhook volume growing? (More sales!)
   - Any days with unusual failure rates?
   - Are there specific times with more issues?

3. **Check for Patterns**
   - Same errors repeating → Systematic bug to fix
   - Failures at specific times → Server load issues
   - Failures for specific types → Integration problem

4. **Export Data** (if needed)
   - Go to Logs page
   - Filter by "Failed" status
   - Use bulk select and export to CSV
   - Share with engineering if patterns found

---

### 🔁 Using Replay Webhook

#### When to Use Replay

✅ **DO Replay When:**
- Webhook failed due to temporary error (DB down, timeout)
- Order stuck in wrong status
- Fulfillment didn't trigger
- Email notification didn't send

❌ **DON'T Replay When:**
- Signature is invalid (security risk!)
- Webhook was already processed successfully
- You're not sure what went wrong (investigate first)

#### How Replay Works

1. **It's Idempotent** - Replaying a processed webhook won't duplicate actions
2. **It Re-triggers All Handlers** - Order update, fulfillment, emails
3. **It Creates Audit Trail** - The replay is logged for compliance

#### Bulk Replay (for multiple failures)

1. Go to `/admin/webhooks/logs`
2. Filter by Status = "Failed"
3. Select webhooks using checkboxes
4. Click "Replay Selected"
5. Review the results

---

### 🔐 Security Monitoring

#### What to Watch For

| Indicator | Normal | Suspicious |
|-----------|--------|------------|
| Invalid Signatures | 0-1 per week | More than 5 per day |
| Unknown Source IPs | 0 | Any non-NOWPayments IP |
| Duplicate Webhooks | < 5% of total | > 20% of total |
| Failed with "Unauthorized" | 0 | Any occurrence |

#### If You Suspect an Attack

1. **Check Source IPs** in webhook logs
2. **Compare with NOWPayments IPs** (documented in their API docs)
3. **Rotate IPN Secret** if compromised:
   - Update in NOWPayments dashboard
   - Update `NOWPAYMENTS_IPN_SECRET` in `.env`
   - Restart API server
4. **Report to Security Team** with exported logs

---

### 📋 Quick Reference

#### Webhook Statuses

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Processed | 🟢 Green | Successfully handled |
| Pending | 🟡 Yellow | Received, awaiting processing |
| Failed | 🔴 Red | Error during processing |

#### Payment Statuses (from NOWPayments)

| Status | Meaning |
|--------|---------|
| `waiting` | Awaiting payment |
| `confirming` | Payment received, confirming on blockchain |
| `confirmed` | Confirmed, processing |
| `sending` | Sending payout |
| `partially_paid` | Underpayment received |
| `finished` | Complete ✅ |
| `failed` | Payment failed |
| `refunded` | Refunded |
| `expired` | Timed out |

#### Keyboard Shortcuts (Detail Page)

| Key | Action |
|-----|--------|
| `←` | Previous webhook |
| `→` | Next webhook |
| `R` | Replay webhook |
| `C` | Copy webhook ID |
| `Esc` | Back to list |

---

## Original Specification

## Current State Analysis

**What exists:**
- Basic list page with minimal filtering (type, processed status)
- Basic detail page showing payload and general info
- Replay functionality
- Simple pagination

**What's missing or needs improvement:**
1. **No statistics/overview dashboard** - admins can't see at-a-glance health
2. **Limited filtering** - can't filter by date range, signature validity, order/payment ID
3. **No search functionality** - can't search by external ID
4. **Poor detail page** - doesn't show all available fields (sourceIp, attemptCount, result, signatureValid, etc.)
5. **No timeline view** - can't see webhook flow for a specific order
6. **No real-time updates** - no auto-refresh or WebSocket updates
7. **No bulk operations** - can't replay multiple failed webhooks
8. **No visual status indicators** - health/error rates not visualized
9. **Detail page missing navigation** - no previous/next webhook navigation

---

## Proposed Architecture

### 1. **Webhook Dashboard Overview** (New Page)
Path: `/admin/webhooks`

**Components:**
- **Health Stats Cards**
  - Total webhooks (last 24h / 7d / 30d)
  - Success rate (processed / total)
  - Invalid signature count (security metric)
  - Duplicate webhook count
  - Failed/Error count
  - Average processing time

- **Activity Timeline Chart**
  - Line/bar chart showing webhook volume over time
  - Color-coded by status (success, failed, invalid sig)

- **Quick Filters**
  - Webhook type tabs (All | Payment | Fulfillment | Email)
  - Date range picker (Today | 7 days | 30 days | Custom)
  - Status filter (All | Processed | Pending | Failed | Invalid)

- **Recent Activity Table**
  - Shows last 10-20 webhooks
  - Quick status indicators
  - Click to expand inline details

### 2. **Webhook Logs List** (Rewritten Page)
Path: `/admin/webhooks/logs`

**Features:**
- **Advanced Filtering Panel**
  - Webhook type (nowpayments_ipn, kinguin, resend)
  - Status (processed, pending, failed)
  - Signature validity (valid, invalid, all)
  - Date range (custom picker)
  - Search by external ID, order ID, or payment ID
  - IP address filter

- **Enhanced Table Columns**
  - ID (truncated with copy button)
  - External ID (with copy button)
  - Type (badge)
  - Status (color-coded badge: Processed/Pending/Failed)
  - Signature (✓/✗ icon)
  - Payment Status (from payload)
  - Order ID (linked to order page)
  - Source IP
  - Attempt Count
  - Timestamp (relative + absolute on hover)
  - Actions (View | Replay | Copy ID)

- **Bulk Actions Toolbar**
  - Select multiple webhooks
  - "Replay Selected" (for failed only)
  - "Export Selected" to CSV/JSON

- **Smart Pagination**
  - Row count selector (10/20/50/100)
  - Page navigation with total count
  - Jump to page input

### 3. **Webhook Detail Page** (Rewritten)
Path: `/admin/webhooks/logs/[id]`

**Sections:**

**A. Header**
- Back navigation
- Webhook ID with copy button
- Status badge (large, prominent)
- Quick actions: Replay | Copy Payload | Navigate (Prev/Next)

**B. Summary Card**
| Field | Value |
|-------|-------|
| Webhook Type | `nowpayments_ipn` |
| External ID | `abc123...` (copy) |
| Payment Status | `finished` (badge) |
| Signature Valid | ✓ Yes / ✗ No |
| Processed | ✓ Yes / ⏳ Pending / ✗ Failed |
| Attempt Count | 2 |
| Source IP | `192.168.1.1` |
| Received At | Jan 14, 2026, 10:30:45 AM |
| Last Updated | Jan 14, 2026, 10:30:46 AM |

**C. Related Entities Card**
- Order ID → Link to `/admin/orders/[id]`
- Payment ID → Link to `/admin/payments/[id]`
- Show order status, payment status inline

**D. Processing Result Card** (if exists)
- JSON formatted view of `result` field
- Expandable/collapsible
- Syntax highlighted

**E. Error Card** (if exists)
- Red highlighted error message
- Stack trace if available
- Suggested actions

**F. Raw Payload Card**
- Collapsible by default (large payloads)
- JSON syntax highlighting
- Copy button
- Pretty-printed with line numbers

**G. Webhook Timeline** (for same order)
- Show all webhooks for this order
- Mini timeline visualization
- "This webhook" highlighted

### 4. **Order Webhook History** (Component)
Reusable component to embed in:
- Order detail page
- Payment detail page

Shows all webhooks related to that entity.

---

## Backend Enhancements Needed

### New Endpoints

```typescript
// 1. Webhook Statistics
GET /admin/webhook-logs/stats
Query: { period: '24h' | '7d' | '30d' }
Response: {
  total: number;
  processed: number;
  failed: number;
  invalidSignature: number;
  duplicates: number;
  successRate: number; // percentage
  byType: { [type: string]: number };
  byStatus: { [status: string]: number };
}

// 2. Webhook Activity Timeline
GET /admin/webhook-logs/timeline
Query: { 
  period: '24h' | '7d' | '30d';
  interval: 'hour' | 'day';
}
Response: Array<{
  timestamp: Date;
  total: number;
  processed: number;
  failed: number;
  invalidSig: number;
}>

// 3. Enhanced List (extend existing)
GET /admin/webhook-logs
Additional Query Params:
- signatureValid: 'true' | 'false' | 'all'
- startDate: ISO string
- endDate: ISO string
- search: string (searches externalId, orderId, paymentId)
- sourceIp: string
- sortBy: 'createdAt' | 'paymentStatus' | 'webhookType'
- sortOrder: 'asc' | 'desc'

// 4. Bulk Replay
POST /admin/webhook-logs/bulk-replay
Body: { ids: string[] }
Response: { replayed: number; failed: number; errors: { id: string; error: string }[] }

// 5. Order Webhook History
GET /admin/orders/:orderId/webhooks
Response: WebhookLog[] // All webhooks for this order

// 6. Navigation (Prev/Next)
GET /admin/webhook-logs/:id/adjacent
Response: { previous?: string; next?: string }
```

---

## Frontend Components to Create

### Shared Components
```
/features/admin/components/webhooks/
├── WebhookStatusBadge.tsx      # Reusable status badge
├── WebhookTypeBadge.tsx        # Type badge (payment/fulfillment/etc)
├── SignatureIndicator.tsx      # ✓/✗ with tooltip
├── WebhookPayloadViewer.tsx    # Syntax highlighted JSON
├── WebhookTimelineItem.tsx     # Timeline item component
├── WebhookQuickStats.tsx       # Stats cards row
├── WebhookActivityChart.tsx    # Activity chart (recharts)
├── WebhookFilters.tsx          # Advanced filter panel
└── OrderWebhookHistory.tsx     # Embeddable order history
```

### Hooks
```
/features/admin/hooks/
├── useAdminWebhooks.ts         # Enhanced with new params
├── useWebhookStats.ts          # Stats query
├── useWebhookTimeline.ts       # Timeline data query
├── useWebhookDetail.ts         # Single webhook query
├── useWebhookBulkReplay.ts     # Bulk replay mutation
└── useOrderWebhooks.ts         # Order-specific webhooks
```

---

## Implementation Phases

### Phase 1: Backend Enhancements ✅ COMPLETE
1. ✅ Add stats endpoint
2. ✅ Add timeline endpoint
3. ✅ Enhance list endpoint with new filters
4. ✅ Add bulk replay endpoint
5. ✅ Add order webhooks endpoint
6. ✅ Add adjacent navigation endpoint

### Phase 2: Core Components ✅ COMPLETE
1. ✅ Create shared components
2. ✅ Create new hooks
3. ✅ Set up base page structures

### Phase 3: Dashboard Overview ✅ COMPLETE
1. ✅ Build stats cards
2. ✅ Build activity chart
3. ✅ Build quick filters
4. ✅ Build recent activity preview

### Phase 4: Enhanced List Page ✅ COMPLETE
1. ✅ Advanced filters panel
2. ✅ Enhanced table with all columns
3. ✅ Bulk actions toolbar
4. ✅ Improved pagination

### Phase 5: Detail Page Rewrite ✅ COMPLETE
1. ✅ Full detail layout
2. ✅ Related entities linking
3. ✅ Raw payload viewer
4. ✅ Timeline integration
5. ✅ Navigation (prev/next)

### Phase 6: Integration & Polish ✅ COMPLETE
1. ✅ Embed OrderWebhookHistory in order pages
2. ✅ Auto-refresh capabilities
3. ✅ Error handling improvements
4. ✅ Loading states optimization
5. ✅ BitLoot neon cyberpunk design system applied

---

## Questions Answered

| Question | Decision |
|----------|----------|
| Real-time updates? | ✅ Auto-refresh implemented (configurable interval) |
| Retention policy? | ⏳ Future: Add 90-day auto-archive feature |
| Notifications? | ⏳ Future: Add Slack/email alerts for error spikes |
| IP blocklist? | ⏳ Future: Consider if attack patterns emerge |

---

## Files Created/Modified

### Backend (API)
- `apps/api/src/modules/admin/admin.controller.ts` - New webhook endpoints
- `apps/api/src/modules/admin/admin.service.ts` - Stats, timeline, bulk replay logic

### Frontend Components
```
apps/web/src/features/admin/components/webhooks/
├── index.ts                    # Barrel export
├── WebhookStatusBadge.tsx      # Status badge with colors
├── WebhookTypeBadge.tsx        # Type badge (IPN, etc.)
├── SignatureIndicator.tsx      # ✓/✗ signature status
├── WebhookPayloadViewer.tsx    # JSON viewer with tabs
├── WebhookQuickStats.tsx       # Stats cards row
├── WebhookActivityChart.tsx    # Recharts timeline
├── WebhookFilters.tsx          # Advanced filter panel
├── OrderWebhookHistory.tsx     # Embeddable order history
└── RelatedWebhooks.tsx         # Related webhooks list
```

### Frontend Hooks
```
apps/web/src/features/admin/hooks/
├── useWebhookStats.ts          # Stats query
├── useWebhookTimeline.ts       # Timeline data
├── useWebhookDetail.ts         # Single webhook + navigation
├── useWebhookBulkReplay.ts     # Bulk replay mutation
└── useOrderWebhooks.ts         # Order-specific webhooks
```

### Frontend Pages
```
apps/web/src/app/admin/webhooks/
├── page.tsx                    # Dashboard overview
└── logs/
    ├── page.tsx                # Enhanced list page
    └── [id]/
        └── page.tsx            # Detail page with navigation
```

---

## Design System

All pages use the **BitLoot Neon Cyberpunk** design system:
- **Primary:** Cyan glow (`#00D9FF`)
- **Secondary:** Purple neon (`#9D4EDD`)
- **Success:** Neon green (`#39FF14`)
- **Warning:** Orange (`#FF6B00`)
- **Error:** Red with glow effect
- **Background:** Dark theme with subtle gradients
- **Cards:** `bg-surface-elevated` with `shadow-glow-subtle`

---

## Maintenance Notes

### Common Issues

**"Stats show 0 webhooks"**
- Check if webhooks are being received
- Verify database connection
- Check date range filter

**"Replay not working"**
- Check if webhook handler is registered
- Verify order/payment still exists
- Check for validation errors in webhook payload

**"Chart not loading"**
- Timeline endpoint may be slow for large datasets
- Consider adding caching for frequently accessed periods

### Performance Optimization

For production with high webhook volume:
1. Add database indexes on `createdAt`, `orderId`, `webhookType`
2. Consider Redis caching for stats (5-minute TTL)
3. Archive webhooks older than 90 days to cold storage

---

## Conclusion

The Webhook Admin Dashboard provides complete visibility and control over BitLoot's webhook infrastructure. Administrators can now:

- ✅ Monitor system health at a glance
- ✅ Investigate and resolve stuck orders
- ✅ Replay failed webhooks safely
- ✅ Track payment flows end-to-end
- ✅ Audit all webhook activity for compliance
- ✅ Identify and respond to security issues

For questions or issues, contact the engineering team.


## Configuration

Based on the webhook controller I set up, here's what you need to fill in on the Kinguin dashboard:

---

## Kinguin Webhook Configuration

### 1. **product.update**
| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_DOMAIN/webhooks/kinguin/product-update` |
| **Secret** | `64c91b5857d******************************850` |
| **Active** | ✅ Enabled |

---

### 2. **order.complete**
| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_DOMAIN/webhooks/kinguin/order-status` |
| **Secret** | `64c91b5857d*****************************850` |
| **Active** | ✅ Enabled |

---

### 3. **order.status**
| Field | Value |
|-------|-------|
| **Webhook URL** | `https://YOUR_DOMAIN/webhooks/kinguin/order-status` |
| **Secret** | `64c91b5857d*************************850` |
| **Active** | ✅ Enabled |

---

## Important Notes:

1. **Replace `YOUR_DOMAIN`** with your actual API domain, for example:
   - **Production**: `https://api.bitloot.io`
   - **Staging**: `https://staging-api.bitloot.io`
   - **Local testing with ngrok**: `https://abc123.ngrok.io`

2. **The secret** (`64c91b5857d***************850`) matches what's in your .env file as `KINGUIN_WEBHOOK_SECRET`

3. **Both order.complete and order.status** use the same endpoint (`/webhooks/kinguin/order-status`) because the controller handles all order status changes in one place

4. **For local development**, you'll need to use a tunneling service like **ngrok**:
   ```bash
   ngrok http 4000
   ```
   Then use the ngrok URL (e.g., `https://abc123.ngrok.io/webhooks/kinguin/product-update`)