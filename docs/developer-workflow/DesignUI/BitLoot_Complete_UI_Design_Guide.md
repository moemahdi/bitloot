# 🎨 BitLoot UI/UX Design Guide — Storefront, Dashboard & Pages

**Status:** 🚧 In Progress (Implementation Started)
**Created:** November 19, 2025
**Based On:** Levels 0-6 Complete Implementation
**Scope:** Complete frontend architecture with beautiful design + full functionality.
**Current Implementation:** `apps/web/src/app`

---

## 📋 TABLE OF CONTENTS

1. [Design System Overview](#design-system-overview)
2. [Storefront Homepage](#storefront-homepage)
3. [User Dashboard](#user-dashboard)
4. [Product Page](#product-page)
5. [Checkout Flow](#checkout-flow)
6. [Authentication Pages](#authentication-pages) (`apps/web/src/app/auth/login/page.tsx`)
7. [Admin Dashboard](#admin-dashboard) (`apps/web/src/app/admin/page.tsx`)
8. [Integration Architecture](#integration-architecture)
9. [Technical Implementation](#technical-implementation)
10. [Deployment Checklist](#deployment-checklist)

---

## Design System Overview

### Color Palette (BitLoot Brand)

```
Primary Colors:
  - Primary: #2B5F7F (Deep Blue) — Main CTAs, Headers
  - Secondary: #F59E1A (Amber) — Highlights, Secondary CTAs
  - Success: #10B981 (Emerald) — Success states, Confirmations
  - Error: #EF4444 (Red) — Errors, Warnings
  - Warning: #F97316 (Orange) — Alerts

Neutrals:
  - Dark: #0F172A (Nearly Black) — Text, Backgrounds
  - Light: #F8FAFC (Off White) — Backgrounds, Cards
  - Gray: #64748B (Slate) — Secondary text, Borders

Crypto Theme:
  - Bitcoin: #F7931A (Orange)
  - Ethereum: #627EEA (Purple)
  - Crypto Gradient: Linear (#2B5F7F → #F59E1A)
```

### Typography

```
Font Family: 'Inter' (Google Fonts)
  - Headings: 600-700 weight
  - Body: 400 weight
  - Small: 500 weight

Font Sizes:
  - H1: 48px (Hero titles)
  - H2: 36px (Page titles)
  - H3: 24px (Section headers)
  - H4: 20px (Card headers)
  - Body: 16px (Main text)
  - Small: 14px (Captions)
  - Tiny: 12px (Badges)

Line Heights:
  - Headings: 1.2
  - Body: 1.6
  - Dense: 1.4
```

### Spacing System (8px base)

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
```

### Components Library

#### Button Variants

```
Primary Button
  - Background: #2B5F7F
  - Text: White
  - Padding: 12px 24px
  - Border Radius: 8px
  - Hover: Darker shade, scale 1.02
  - Active: Even darker
  - Disabled: Grayscale, opacity 0.5

Secondary Button
  - Background: transparent
  - Border: 2px #2B5F7F
  - Text: #2B5F7F
  - Hover: Light background fill

Outline Button (Ghost)
  - No background
  - Gray border
  - Gray text
  - Hover: Light gray background

Crypto Button (Orange)
  - Background: #F59E1A
  - Text: White
  - Used for: Payment CTAs, Confirmations
```

#### Form Fields

```
Text Input
  - Border: 1px #E2E8F0
  - Border Radius: 6px
  - Padding: 12px 16px
  - Font Size: 16px
  - Focus: Blue border (2px), shadow
  - Error: Red border, red text below
  - Disabled: Grayscale background

Select / Dropdown
  - Same styling as text input
  - Chevron icon on right
  - Options: Hover highlight

Checkbox / Radio
  - Custom styled (not browser default)
  - Blue when checked
  - Green checkmark
  - Label: 14px, clickable

Textarea
  - Same as text input
  - Min height: 100px
  - Resize: Vertical only
```

#### Cards & Containers

```
Product Card
  - Background: White
  - Border: 1px #E2E8F0
  - Border Radius: 12px
  - Padding: 16px
  - Box Shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Hover: Shadow increase, scale 1.02
  - Transition: 200ms ease

Status Card
  - Background: Colored (by status)
  - Border: Darker shade
  - Icon: Colored
  - Text: White or dark

Alert/Toast
  - Position: Top right, 20px from edge
  - Duration: Auto-close after 5s
  - Padding: 16px
  - Border left: 4px colored bar
  - Close button: X icon
```

---

## Storefront Homepage
**Implementation:** `apps/web/src/app/page.tsx`

### Layout Structure

```
┌─────────────────────────────────────────┐
│           Navigation Bar                │
│  [Logo] [Catalog] [Cart] [Account]      │
├─────────────────────────────────────────┤
│                                         │
│         HERO SECTION                    │
│  "Buy Digital Keys with Crypto"         │
│  [Search Box] [Browse] [Trending]       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│       FEATURED PRODUCTS GRID            │
│  [Card] [Card] [Card] [Card]            │
│  [Card] [Card] [Card] [Card]            │
│                                         │
├─────────────────────────────────────────┤
│   CATEGORY FILTERS / PAGINATION         │
├─────────────────────────────────────────┤
│                                         │
│         FEATURED SECTION               │
│  "Trending This Week"                  │
│  [Card] [Card] [Card]                   │
│                                         │
├─────────────────────────────────────────┤
│         BENEFITS / FEATURES             │
│  ✓ Instant Delivery  ✓ Secure         │
│  ✓ Low Prices       ✓ Anonymous        │
├─────────────────────────────────────────┤
│            FOOTER                       │
│  Links, Social, Newsletter              │
└─────────────────────────────────────────┘
```

### Hero Section

```
Height: 500px
Background: Gradient (#2B5F7F → #1E40AF with crypto pattern overlay)
Content Alignment: Center

Title:
  - "Buy Digital Keys with Cryptocurrency"
  - H1, 48px, white, bold
  - Max width: 600px

Subtitle:
  - "Instant delivery. Secure. Anonymous."
  - 18px, light gray, 200px max width

CTA Buttons:
  - [Browse Catalog] (Primary, 16px font)
  - [How it Works] (Ghost, 16px font)
  - Horizontal layout, 16px gap

Search Bar:
  - Width: 600px max
  - Placeholder: "Search games, software..."
  - Icon: Magnifying glass
  - Autocomplete dropdown on focus
```

### Product Grid Section

```
Title: "Featured Products" (H2, 36px, #0F172A)

Grid Layout:
  - Desktop: 4 columns
  - Tablet: 3 columns
  - Mobile: 2 columns
  - Gap: 24px
  - Max width: 1400px
  - Padding: 48px horizontal

Product Card (Responsive):
  Width: Responsive (280px min)
  
  Content:
    [Image Container]
      - Height: 200px
      - Background: #F8FAFC
      - Border: 1px #E2E8F0
      - Border radius: 8px 8px 0 0
    
    [Badge] (Top right, absolute)
      - Background: #F59E1A
      - Text: "12% OFF" (white, 12px)
      - Padding: 6px 12px
      - Border radius: 4px
    
    [Content Area]
      - Padding: 16px
      
      [Title]
        - 18px, 600 weight, #0F172A
        - 2 lines max, truncate
      
      [Description]
        - 14px, #64748B
        - 2 lines max, truncate
      
      [Footer]
        - Display: Flex, space-between
        - [Price Column]
          - Price: 24px, #2B5F7F, bold
          - USD: 12px, #64748B
        - [CTA]
          - [Buy] button (Primary, small)
          - Icon: Bitcoin, Ethereum, or Crypto
    
    Hover State:
      - Shadow increase
      - Scale 1.02
      - Image zoom 1.05
      - Button highlight

Pagination:
  - Bottom of grid
  - Page numbers: 1 2 3 4 5 ...
  - [Prev] [Next] buttons
  - Show: "Showing 1-20 of 1,234"
```

### Filters Sidebar (Left)

```
Position: Sticky, left side (Desktop)
Width: 240px
Background: #F8FAFC

Sections:
  
  [Category Filter]
    - Title: "Category" (12px caps, gray)
    - Checkboxes: Games, Software, Keys, etc.
    - Show all / Collapse toggle
  
  [Platform Filter]
    - Title: "Platform"
    - Checkboxes: Steam, Epic, GOG, etc.
  
  [Price Range]
    - Title: "Price"
    - Min: [$] Input field
    - Max: [$] Input field
    - Range slider (optional)
  
  [Rating]
    - Title: "Rating"
    - Stars: ★★★★★ & up
    - Radio buttons
  
  [Clear Filters]
    - Button, 100% width
    - Style: Ghost
```

### Mobile Responsiveness

```
Mobile (< 640px):
  - Hide sidebar, show drawer button
  - Grid: 1-2 columns
  - Hero: 300px height
  - Font sizes: -2px
  - Padding: 16px
  - Stacked layout

Tablet (640px - 1024px):
  - Grid: 2-3 columns
  - Sidebar: Collapsible drawer
  - Spacing: 20px

Desktop (> 1024px):
  - Grid: 4 columns
  - Sidebar: Always visible
  - Spacing: 24px
```

---

## User Dashboard
**Implementation:** `apps/web/src/app/profile/page.tsx`

### Layout Structure

```
┌────────────────────────────────────────────────────┐
│           Top Navigation Bar                       │
│  [Logo] [Search] [Notifications] [User Menu]       │
├─────────┬──────────────────────────────────────────┤
│         │                                          │
│ Sidebar │        DASHBOARD CONTENT                 │
│         │                                          │
│ [Home]  │  ┌──────────────────────────────────┐   │
│ [Orders]│  │   WELCOME SECTION               │   │
│ [Keys]  │  │   "Welcome back, John"          │   │
│ [Acct]  │  ├──────────────────────────────────┤   │
│ [Settings] │ QUICK STATS CARDS (4 columns)       │
│ [Logout]│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐│
│         │  │ │Orders│ │ Keys │ │Spend │ │Saved││
│         │  │ │  5   │ │  12  │ │$245  │ │$50 ││
│         │  │ └──────┘ └──────┘ └──────┘ └────┘│
│         │  ├──────────────────────────────────┤   │
│         │  │   RECENT ORDERS (Table)        │   │
│         │  │ Date | Product | Price | Stat  │   │
│         │  ├──────────────────────────────────┤   │
│         │  │   MY KEYS (Quick Access)       │   │
│         │  │ [Key] [Key] [Key] [View All]   │   │
│         │  └──────────────────────────────────┘   │
│         │                                         │
└─────────┴──────────────────────────────────────────┘
```

### Dashboard Main Content

#### Welcome Banner

```
Height: 200px
Background: Gradient (#2B5F7F → #1E40AF)
Display: Flex, center

Content:
  Title: "Welcome back, John" (H2, 36px, white)
  Subtitle: "You have 2 pending orders" (18px, light gray)
  
  CTA Buttons:
    - [View Orders] (Secondary)
    - [Browse More] (Ghost)
```

#### Quick Stats Cards (4 Columns, Responsive)

```
Card 1: Total Orders
  Icon: 📦 (large, blue)
  Title: "Total Orders" (14px, gray)
  Value: "24" (28px, blue, bold)
  Footer: "+2 this month" (12px, gray)

Card 2: Digital Keys
  Icon: 🔑 (large, green)
  Title: "Active Keys" (14px, gray)
  Value: "18" (28px, green, bold)
  Footer: "All valid" (12px, gray)

Card 3: Total Spent
  Icon: 💰 (large, orange)
  Title: "Total Spent" (14px, gray)
  Value: "$1,245.67" (28px, orange, bold)
  Footer: "Since joining" (12px, gray)

Card 4: Savings
  Icon: 💎 (large, purple)
  Title: "You Saved" (14px, gray)
  Value: "$234.56" (28px, purple, bold)
  Footer: "24% average" (12px, gray)

Card Styling:
  - Background: White
  - Border: 1px #E2E8F0
  - Padding: 24px
  - Border radius: 12px
  - Box shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Hover: Shadow increase, scale 1.02
```

#### Recent Orders Table

```
Title: "Recent Orders" (H3, 24px, #0F172A)

Columns:
  1. Date
     - Format: "Nov 15, 2024"
     - 14px, #0F172A
  
  2. Product
     - Name: "Elden Ring" (14px, blue, clickable)
     - Platform: "Steam" (12px, gray badge)
  
  3. Price
     - Format: "$39.99" (14px, bold)
     - Crypto: "0.0012 BTC" (12px, gray, below)
  
  4. Status
     - Badge styling:
       - "✓ Delivered" (green background)
       - "⏳ Processing" (orange background)
       - "✗ Failed" (red background)
  
  5. Actions
     - [Download] (Icon button, if delivered)
     - [Details] (Icon button)
     - [...] (More menu)

Row Styling:
  - Height: 60px
  - Border-bottom: 1px #E2E8F0
  - Hover: Light gray background
  - Padding: 16px

Pagination:
  - Show: "Showing 1-10 of 24"
  - [Prev] [1] [2] [3] [Next]
```

#### My Digital Keys Section

```
Title: "My Digital Keys" (H3, 24px, #0F172A)
Subtitle: "Access your purchased items"

Grid: 4 columns (responsive)

Key Card:
  Background: Gradient (light to dark blue)
  Border: 1px #E2E8F0
  Padding: 16px
  Border radius: 8px
  Height: 140px
  Position: relative
  
  Content:
    Icon: 🔑 (32px, centered)
    Title: "Elden Ring" (14px, white, centered)
    Platform: "Steam" (12px, gray, centered)
    
    Bottom:
      Date: "Dec 15, 2024" (10px, light gray)
      Status: "Active" (12px, green badge)
  
  Hover:
    - Shadow increase
    - Scale 1.05
    - Show [Copy] button overlay
    - Show [Download] button overlay

Actions on Hover:
  - [Copy Key] button
  - [Download License] button
  - [Help] button

View All Link:
  - Style: Blue text, underline
  - Position: Right of title
  - Click: Navigate to /my-keys page
```

### Sidebar Navigation

```
Position: Left, sticky
Width: 240px (Desktop), 0 (Mobile - drawer)
Background: #F8FAFC
Border-right: 1px #E2E8F0

Mobile Toggle:
  - Hamburger icon (top left)
  - Opens overlay drawer

Nav Items:
  
  [Dashboard]
    - Icon: 📊
    - Text: "Dashboard"
    - Active: Blue background, white text
  
  [Orders]
    - Icon: 📦
    - Text: "My Orders"
    - Badge: "2" (red, top right)
  
  [Digital Keys]
    - Icon: 🔑
    - Text: "Digital Keys"
    - Badge: "18" (blue)
  
  [Account]
    - Icon: 👤
    - Text: "Account Settings"
  
  [Security]
    - Icon: 🔒
    - Text: "Security & Privacy"
  
  [Logout]
    - Icon: 🚪
    - Text: "Sign Out"
    - Style: Red text

Styling:
  - Padding: 12px 16px
  - Margin bottom: 4px
  - Border radius: 6px
  - Cursor: pointer
  - Hover: Light gray background
  - Active: Blue background + text
  - Font: 14px, 500 weight
```

---

## Product Page
**Implementation:** `apps/web/src/app/product/page.tsx`

### Layout

```
┌──────────────────────────────────────┐
│   Navigation                         │
├──────────────────────────────────────┤
│                                      │
│  Breadcrumb: Home > Games > Title    │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │              │ │              │  │
│  │   Image      │ │   Details    │  │
│  │              │ │              │  │
│  │  Gallery     │ │   Price      │  │
│  │              │ │   [BUY CTA]  │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Description                 │   │
│  ├──────────────────────────────┤   │
│  │  Specifications              │   │
│  ├──────────────────────────────┤   │
│  │  Reviews                     │   │
│  │  ★★★★★ (234 reviews)        │   │
│  └──────────────────────────────┘   │
│                                      │
│  Related Products                    │
│  [Card] [Card] [Card] [Card]        │
│                                      │
└──────────────────────────────────────┘
```

### Image Gallery (Left, 40% width)

```
Main Image:
  - Size: 400x600px (aspect ratio maintained)
  - Border: 1px #E2E8F0
  - Border radius: 8px
  - Background: White
  - Zoom on hover (1.1x)
  - Cursor: zoom-in

Thumbnail Strip (Below main image):
  - Height: 100px
  - Thumbnails: 80px x 100px
  - Gap: 8px
  - Scrollable (max 5 thumbnails visible)
  - Active thumb: Blue border
  - Click: Update main image
  - Hover: Opacity 0.8

Image Actions:
  - [↗] Full screen (icon, top right)
  - [Zoom] slider (optional, bottom)
```

### Product Details (Right, 60% width)

```
Breadcrumb:
  Home > Games > Action > Elden Ring
  Font: 12px, gray, clickable

Title:
  "Elden Ring"
  H2, 36px, #0F172A, 600 weight

Platform Badge:
  "Steam" (gray background, 12px)
  Display: Inline

Rating:
  ★★★★★ 4.8/5 (234 reviews)
  Font: 14px, blue
  Clickable: Jump to reviews

Price Section:
  USD Price: "$59.99" (H3, 32px, orange, bold)
  Crypto Prices:
    - BTC: "0.0012 BTC" (14px, gray)
    - ETH: "0.031 ETH" (14px, gray)
  
  Discount (if any):
    - "Save 20%" (red, bold)
    - Original: $74.99 (strikethrough)

CTA Buttons:
  ┌────────────────────┐
  │   [ADD TO CART]    │ (Primary, full width, 16px)
  │   [BUY NOW]        │ (Crypto button, full width, 16px)
  └────────────────────┘
  Gap: 12px between buttons
  On mobile: Stack vertically

Stock Status:
  "✓ In Stock" (green, 14px)
  or
  "Out of Stock" (red, 14px, buttons disabled)

Delivery Info:
  ✓ Instant delivery
  ✓ Secure transaction
  ✓ Lifetime license
  Format: Checkmark icon + text, 14px, gray
  Gap: 12px

Share Section:
  "Share this product:"
  [Facebook] [Twitter] [Copy Link]
  Icon buttons, 16px icons
```

### Description Tab

```
Title: "Description" (H3, 24px)

Content:
  - Full product description
  - Font: 14px, #0F172A
  - Line height: 1.6
  - Max width: 800px
  - Paragraphs: 16px gap

Features List:
  • Feature 1
  • Feature 2
  • Feature 3
  Format: Bullet points, 14px, blue dots
```

### Specifications Tab

```
Title: "Specifications" (H3, 24px)

Content: 2-column layout
  
  Column 1:
    - Label: "Platform" (12px, bold)
    - Value: "Steam, Epic Games" (14px)
  
  Column 2:
    - Label: "Genre" (12px, bold)
    - Value: "Action RPG" (14px)
  
  (Repeat for all specs)
```

### Reviews Section

```
Title: "Reviews" (H3, 24px)

Rating Summary Card:
  - Average: 4.8 ★ (28px, bold)
  - "Based on 234 reviews"
  - Rating breakdown bars
    - 5★: ████████░░ 78%
    - 4★: ██████░░░░ 18%
    - 3★: ██░░░░░░░░ 2%
    - 2★: █░░░░░░░░░ 1%
    - 1★: ░░░░░░░░░░ 1%

Individual Reviews:
  [Review Card]
    - Author: "John D." (14px, bold)
    - Rating: ★★★★★ (12px, yellow)
    - Date: "5 days ago" (12px, gray)
    - Title: "Amazing game!" (14px, bold)
    - Text: "Review text..." (14px, #0F172A)
    - Helpful: "[👍] [👎]" (12px)
    - Reply: "[Reply]" link

Pagination:
  - Show: "Showing 1-10 of 234"
  - [Prev] [1] [2] [3] [Next]

Write Review (if purchased):
  Button: "Write a Review" (Primary, full width)
```

---

## Checkout Flow
**Implementation:** `apps/web/src/app/pay/page.tsx`

### Step 1: Cart Review

```
Title: "Review Your Order"

Items Table:
  Columns: Product | Quantity | Price | Total
  
  Product: Image + Title + Platform
  Quantity: [−] [1] [+]
  Price: $39.99
  Total: $39.99
  
  Remove: [X] button

Summary Card (Right side, sticky):
  - Subtotal: $39.99
  - Tax: $0.00 (if applicable)
  - Discount: -$5.00 (if coupon)
  - Total: $39.99
  
  [Promo Code] input field
  [Apply] button
  
  [Continue to Payment] (Primary, full width)
  [Continue Shopping] (Secondary)
```

### Step 2: Payment Information

```
Title: "Select Payment Method"

Payment Options:
  ┌─────────────────────┐
  │ ◯ Bitcoin (BTC)     │
  │   0.0012 BTC        │
  └─────────────────────┘
  
  ┌─────────────────────┐
  │ ◉ Ethereum (ETH)    │
  │   0.031 ETH         │
  └─────────────────────┘
  
  ┌─────────────────────┐
  │ ◯ USDT (Polygon)    │
  │   $39.99            │
  └─────────────────────┘

Display Selected:
  - Icon (large, 48px)
  - Amount (24px, bold)
  - Network info (12px, gray)
  - Conversion rate (12px, gray)

Email Confirmation:
  [Email Input Field]
  Label: "We'll send your keys here"
  Placeholder: "john@example.com"
  Required: *

Terms:
  ☑ I agree to Terms of Service
  Link: "Read terms" (underlined, blue)

CTA Buttons:
  [Proceed to Payment] (Crypto Button, full width)
  [Back] (Secondary)
```

### Step 3: Payment Processing

```
Title: "Complete Your Payment"

QR Code / Payment Address:
  - Large QR code (280x280px) or
  - Payment address (monospace, selectable)
  - [Copy] button (icon, right)

Amount Display:
  "Send exactly:" (14px, gray)
  0.0012 BTC (24px, bold)
  
  "to this address:" (14px, gray)
  3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy (12px, monospace, gray)

Status:
  ⏳ Waiting for payment...
  
  Auto-refresh: "Checking every 5 seconds"
  [Check Now] button

Countdown:
  "Payment expires in: 25:45" (14px, orange)

Alternative:
  [Use payment link instead] (blue, underlined)

Support:
  Questions? [Contact Support] (link, 12px)
```

### Step 4: Payment Confirmed

```
Background: Gradient (light green)
Icon: ✓ (large, 64px, green)

Title: "Payment Confirmed!" (H2, 36px, green)
Subtitle: "Your order is being processed"

Order Details Card:
  Order ID: #ORD-2024-1234
  Amount: 0.0012 BTC ($39.99)
  Product: Elden Ring (Steam)
  Date: Nov 19, 2024, 14:32 UTC

Key Status:
  ⏳ Keys are being delivered...
  Auto-refresh in 3 seconds...
  
  [Refresh Now] button

Next Steps:
  1. Keys will be sent to john@example.com
  2. Download from your dashboard
  3. Activate on your platform

CTA Buttons:
  [View Order Details] (Primary)
  [Go to Dashboard] (Secondary)
  [Browse More] (Ghost)
```

---

## Authentication Pages

### OTP Login Page

```
Layout: Center, single column

Background:
  - Left 50%: Gradient (#2B5F7F → #1E40AF)
  - Right 50%: White
  - Mobile: Full white with top gradient

Left Side (Desktop only):
  - Logo (large, white)
  - "Buy with Crypto" (H2, white)
  - "Fast. Secure. Private." (18px, light gray)
  - Benefits list (white checkmarks)

Right Side / Center (Mobile):
  Content Box:
    Width: 400px (desktop), 90% (mobile)
    Background: White
    Padding: 48px
    Border radius: 8px
    Box shadow: 0 4px 6px rgba(0,0,0,0.1)

    Logo: 48x48px (centered)
    
    Title: "Sign In" (H2, 32px, #0F172A)
    Subtitle: "Enter your email to get started" (14px, gray)
    
    Email Input:
      [_______________] 
      Label: "Email Address"
      Placeholder: "you@example.com"
      Required: *
    
    Buttons:
      [Send OTP] (Primary, full width, 16px)
      
      Divider: "or"
      
      [Sign up instead] (Ghost link, blue, underlined)
    
    Footer:
      "By signing in, you agree to our Terms"
      Links: Terms | Privacy
      Font: 12px, gray

Error State (if email invalid):
  - Red border on input
  - Red text: "Invalid email address"
  - Input focus

Loading State:
  - Button text: "Sending..." 
  - Spinner icon in button
  - Button disabled

Success State:
  - Show green checkmark
  - Button text: "✓ OTP Sent"
  - Show "Check your email" message
  - Auto-redirect to OTP verification in 2s
```

### OTP Verification Page

```
Similar layout to login

Content Box:
  Title: "Enter Your Code" (H2, 32px)
  Subtitle: "We sent a 6-digit code to john@example.com" (14px, gray)
  
  [Change Email] (link, blue, 12px, below subtitle)

OTP Input Fields:
  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
  │  _  │ │  _  │ │  _  │ │  _  │ │  _  │ │  _  │
  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
  
  - 6 input fields (1 char each)
  - Auto-focus next field
  - Auto-submit on 6th digit
  - Border: 2px, blue on focus
  - Font: 24px, monospace, centered
  - Error state: Red border

Resend Code:
  "Didn't receive code?" (14px, gray)
  [Resend] link (blue, 14px)
  
  Countdown (if available):
    "Resend in 45 seconds"
    Font: 12px, gray

Support:
  [Need help?] (link, 12px)

Buttons:
  [Verify & Sign In] (Primary, full width)
  [Back] (Secondary)

Loading State:
  - Spinner in button
  - Button disabled
  - Fields disabled

Success State:
  - Green checkmark
  - "✓ Verified"
  - Auto-redirect to dashboard
```

### Account Settings Page

```
Layout: 2 columns (left sidebar, right content)

Sidebar:
  Sections (clickable):
    • Profile
    • Security & Password
    • Email Preferences
    • Notification Settings
    • API Keys (if applicable)
    • Billing
    • Account Deletion

Main Content:

  [Profile Section]
    Avatar Upload:
      [Upload Photo] (drop area)
      Current: profile_pic.png (12px, gray)
    
    Name Field:
      Label: "Full Name"
      [___________________]
    
    Email Field:
      Label: "Email Address"
      [john@example.com] (disabled)
      [Edit] link
    
    Buttons:
      [Save Changes] (Primary)
      [Cancel] (Secondary)

  [Security Section]
    Password Change:
      Label: "Current Password"
      [___________________]
      
      Label: "New Password"
      [___________________]
      Requirements: (checkmarks)
        ✓ At least 8 characters
        ○ One uppercase letter
        ○ One number
      
      Label: "Confirm Password"
      [___________________]
      
      Buttons:
        [Update Password] (Primary)
    
    Two-Factor Auth:
      Status: "Not enabled"
      [Enable 2FA] (Secondary)
    
    Active Sessions:
      Device | Location | Last Active | Action
      Chrome on Desktop | New York, US | 2 min ago | [Logout]
      Safari on Mobile | Los Angeles, US | 1 hr ago | [Logout]
      
      [Logout All] (Red, Secondary)
```

---

## Admin Dashboard

### Admin Homepage

```
Layout: Full width, 3-column grid

Top KPI Cards (4 columns):
  [Today's Revenue]   [Active Orders]   [Failed Payments]   [Support Tickets]
  $2,456.78           234              12                   3

Charts Section (2 columns):
  [Revenue Chart]         [Order Status Breakdown]
  Line chart (7 days)      Pie chart
  
  [Payment Methods]       [Top Products]
  Bar chart               Table (top 5)

Latest Orders (Full width):
  Table with filters
  Status | Customer | Amount | Time | Action

Alert Section:
  - Failed payments
  - Pending reviews
  - System alerts
```

### Orders Management

```
Title: "Order Management"

Filters:
  [Status: All] [Date: Last 7 days] [Limit: 25]
  Search: [_______________]

Table:
  Order ID | Customer | Product | Amount | Status | Date | Actions

Status Badges:
  - ✓ Fulfilled (green)
  - ⏳ Processing (orange)
  - ✗ Failed (red)
  - ⌛ Pending (gray)

Row Actions:
  [View Details] [Refund] [Retry] [...]

Detail Modal:
  Order ID, Customer Info, Products, Payment Info, Timeline
```

### Payments Management

```
Title: "Payments"

Filters:
  [Method: All] [Status: All] [Date Range]

Table:
  Payment ID | Customer | Amount | Method | Status | Date | Actions

Status Badges:
  - ✓ Confirmed
  - ⏳ Pending
  - ✗ Failed
  - ↺ Refunded

Row Actions:
  [View Details] [Download Receipt] [Refund]

Stats:
  Today: $5,234.56 | This Month: $45,234.56 | Success Rate: 98.2%
```

### Webhooks & IPN Logs

```
Title: "Webhook Logs"

Filters:
  [Source: All] [Status: All] [Date Range]

Table:
  Timestamp | Source | Event | Status | Response | Actions

Status:
  - ✓ Success
  - ✗ Failed
  - ⟳ Retrying

Row Actions:
  [View Payload] [Replay] [View Response]

Detail Modal:
  - Raw payload (JSON)
  - Headers
  - Response
  - Retry count
  - [Replay] button
```

### Feature Flags

```
Title: "Feature Flags"

Flags List:
  Flag Name | Status | Updated | Actions

  "CRYPTO_PAYMENTS_ENABLED"
    Status: ✓ ON
    Updated: 2 hours ago
    [OFF] button

  "EARLY_ACCESS_FEATURES"
    Status: ✗ OFF
    Updated: 1 day ago
    [ON] button

Create Flag:
  [+ New Flag] button
  Modal: Name, Default Value, [Create]
```

### Queue Management

```
Title: "Job Queues"

Queue Stats:
  [Payments Queue]     [Fulfillment Queue]   [Email Queue]
  Pending: 45          Pending: 12           Pending: 234
  Failed: 2            Failed: 0             Failed: 5
  [View]               [View]                [View]

Queue Detail:
  Table: Job ID | Status | Attempt | Next Retry | Actions
  
  Actions:
    [View Log] [Retry] [Delete]

Queue Controls:
  [Pause Queue] [Clear Failed] [Drain All]
```

---

## Integration Architecture

### Component Data Flow

```
User
  ↓
[Frontend Component]
  ↓
[SDK Client]  (Type-safe)
  ↓
[API Endpoint]  (NestJS)
  ↓
[Service Layer]  (Business logic)
  ↓
[Database / External API]
  ↓
[Response]
  ↓
[Frontend UI Update]
```

### State Management

```
React Context API (Auth)
  ├─ Current user
  ├─ JWT tokens
  └─ User role

TanStack Query (Data Fetching)
  ├─ useQuery (read)
  ├─ useMutation (write)
  ├─ useInfiniteQuery (pagination)
  └─ Automatic caching/refetching

React Hook Form (Forms)
  ├─ Form state
  ├─ Validation (Zod)
  └─ Error handling

Zustand (Optional, Local UI State)
  ├─ Sidebar open/close
  ├─ Theme (dark/light)
  └─ User preferences
```

### API Integration Points

```
Authentication:
  POST /auth/request-otp
  POST /auth/verify-otp
  POST /auth/refresh
  POST /auth/logout

Products:
  GET /products (search, filter, paginate)
  GET /products/{id}
  POST /products/search (full-text)

Orders:
  POST /orders (create)
  GET /orders (list)
  GET /orders/{id} (detail)
  PATCH /orders/{id}

Payments:
  POST /payments/create
  GET /payments/{id}
  POST /webhooks/nowpayments/ipn

User:
  GET /users/me
  PATCH /users/me
  PATCH /users/me/password

Admin:
  GET /admin/orders
  GET /admin/payments
  GET /admin/webhooks
  POST /admin/webhooks/{id}/replay
  GET /admin/products
  POST /admin/products
  PATCH /admin/products/{id}
  DELETE /admin/products/{id}
```

---

## Technical Implementation

### Frontend Stack

```
Core:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript (strict mode)

UI/UX:
  - Tailwind CSS (for styling)
  - Radix UI (headless components)
  - Framer Motion (animations)
  - Lucide Icons

Forms:
  - React Hook Form
  - Zod (validation)

Data Fetching:
  - TanStack Query (caching, refetching)
  - Axios (HTTP client)
  - @bitloot/sdk (auto-generated)

State Management:
  - React Context (Auth)
  - Zustand (UI state)
  - React Query (server state)

Accessibility:
  - ARIA labels
  - Keyboard navigation
  - Focus management
  - Screen reader support

Performance:
  - Code splitting
  - Image optimization
  - Lazy loading
  - Virtualization for lists
```

### Component Structure

```
apps/web/src/
├─ app/
│  ├─ (auth)/                    # Auth pages
│  │  ├─ login/page.tsx
│  │  └─ verify-otp/page.tsx
│  ├─ (store)/                   # Public store pages
│  │  ├─ page.tsx               # Homepage
│  │  ├─ catalog/page.tsx       # Browse all
│  │  ├─ product/[id]/page.tsx  # Product detail
│  │  └─ checkout/page.tsx      # Checkout flow
│  ├─ (dashboard)/              # User dashboard
│  │  ├─ page.tsx               # Dashboard home
│  │  ├─ orders/page.tsx        # My orders
│  │  ├─ keys/page.tsx          # Digital keys
│  │  └─ account/page.tsx       # Settings
│  ├─ (admin)/                  # Admin only
│  │  ├─ page.tsx               # Admin home
│  │  ├─ orders/page.tsx
│  │  ├─ payments/page.tsx
│  │  ├─ webhooks/page.tsx
│  │  ├─ flags/page.tsx
│  │  └─ settings/page.tsx
│  ├─ layout.tsx                # Root layout
│  └─ globals.css               # Global styles
│
├─ components/
│  ├─ ui/                        # Reusable UI
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  ├─ Card.tsx
│  │  ├─ Modal.tsx
│  │  ├─ Table.tsx
│  │  └─ ...
│  ├─ layout/                    # Layout components
│  │  ├─ Header.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Sidebar.tsx
│  │  └─ Navigation.tsx
│  └─ common/                    # Common components
│     ├─ Loading.tsx
│     ├─ ErrorBoundary.tsx
│     └─ ...
│
├─ features/
│  ├─ auth/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ store/
│  │  └─ types/
│  ├─ store/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ types/
│  ├─ checkout/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ types/
│  ├─ dashboard/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ types/
│  └─ admin/
│     ├─ components/
│     ├─ hooks/
│     └─ types/
│
├─ lib/
│  ├─ sdk.ts                    # SDK client setup
│  ├─ api.ts                    # API helpers
│  ├─ utils.ts                  # Utilities
│  ├─ hooks.ts                  # Common hooks
│  └─ validators.ts             # Zod schemas
│
└─ types/
   ├─ index.ts                  # Type exports
   └─ ...
```

### Key Hooks

```
// Authentication
useAuth()           // Get current user, JWT tokens
useLogout()         // Logout handler
useRequireAuth()    // Redirect if not logged in
useRequireAdmin()   // Redirect if not admin

// Data Fetching
useProducts()       // List products with filters
useProduct(id)      // Single product detail
useOrders()         // User's orders
useOrder(id)        // Single order detail

// Forms
useLoginForm()      // OTP login form state
useCheckoutForm()   // Checkout form state
useSettingsForm()   // Settings form state

// UI State
useModal()          // Modal open/close
useToast()          // Toast notifications
usePagination()     // Pagination state
useFilters()        // Filter state
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All pages designed and reviewed
- [ ] All API endpoints implemented and tested
- [ ] SDK generated and validated
- [ ] Database migrations executed
- [ ] Environment variables set (.env.production)
- [ ] HTTPS certificates configured
- [ ] CDN setup (images, static assets)
- [ ] Domain DNS configured
- [ ] Email service configured (OTP emails)
- [ ] Payment provider credentials added
- [ ] External APIs integrated (Kinguin, NOWPayments, R2)

### Frontend Deployment

- [ ] Run `npm run build` (no errors)
- [ ] Run `npm run lint` (no violations)
- [ ] Run `npm run type-check` (no errors)
- [ ] Run `npm run test` (all passing)
- [ ] Check bundle size
- [ ] Test all pages on target devices
- [ ] Test all forms and validations
- [ ] Test all flows (checkout, auth, etc.)
- [ ] Check accessibility (axe, wave)
- [ ] Test performance (Lighthouse)

### Backend Deployment

- [ ] Run all migrations
- [ ] Verify database schemas
- [ ] Start background job queues
- [ ] Test all API endpoints
- [ ] Check rate limiting
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Configure security headers
- [ ] Set up logging/monitoring
- [ ] Test webhook receivers

### Post-Deployment

- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Verify payment processing
- [ ] Verify email delivery
- [ ] Verify database backups
- [ ] Set up uptime monitoring
- [ ] Create runbooks for common issues
- [ ] Communicate with users
- [ ] Gather feedback

---

## Summary

This comprehensive design guide provides:

✅ **Beautiful, cohesive design system** — Colors, typography, spacing, components
✅ **Complete page layouts** — Homepage, dashboard, products, checkout, admin
✅ **Detailed component specs** — Buttons, forms, cards, tables, modals
✅ **Responsive design patterns** — Desktop, tablet, mobile
✅ **Integration architecture** — How frontend connects to backend
✅ **Technical implementation** — Component structure, hooks, state management
✅ **Deployment checklist** — Ready for production launch

All designs are based on the complete Level 0-6 implementation and ready for front-end developer execution. Every component has:
- Exact sizing and spacing
- Color specifications
- Interaction states (hover, active, disabled)
- Responsive behavior
- Accessibility considerations
- Integration points with the backend API

**Ready for development! 🚀**