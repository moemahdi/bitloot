# 🎨 BitLoot Admin Design Customization System

**Feature:** Marketing Page Customization & Section Management  
**Version:** 1.0  
**Status:** Planning  
**Created:** January 15, 2026  
**Priority:** High

---

## 📋 Executive Summary

The Admin Design Customization system enables BitLoot administrators to dynamically control, configure, and customize marketing page sections without code deployments. This includes Flash Deals, Bundle Deals, Featured Products, Trending Products, Categories, and Gift Cards sections.

### Product Types Supported
BitLoot sells **4 types of digital products**:
| Type | Description | Examples |
|------|-------------|----------|
| 🎮 **Games** | Game keys for various platforms | Steam keys, Epic keys, Origin keys, PlayStation, Xbox |
| 💻 **Software** | Software licenses and keys | Windows, Office, Antivirus, VPNs, Creative tools |
| 💳 **Gift Cards** | Digital gift cards and wallet codes | Steam Wallet, PSN, Xbox, Nintendo eShop, Spotify |
| 🔄 **Subscriptions** | Recurring service subscriptions | Game Pass, PS Plus, EA Play, Ubisoft+, Netflix |

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Zero-Code Updates** - Marketing team can update promotions without developer involvement
2. **Real-Time Control** - Instant enable/disable of any section
3. **Scheduling** - Pre-schedule campaigns for holidays, sales events
4. **Visual Customization** - Adjust colors, layouts, content per section
5. **Performance Tracking** - Built-in analytics for each section

### Success Metrics
- Reduce marketing update turnaround from days to minutes
- Enable 10+ promotional campaigns per month without deployments
- Achieve 95%+ admin satisfaction with customization tools
- Track conversion rates per section configuration

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Section  │ │ Content  │ │ Visual   │ │ Analytics        │   │
│  │ Manager  │ │ Editor   │ │ Designer │ │ Dashboard        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (NestJS)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ /admin/      │ │ /admin/      │ │ /public/                 │ │
│  │ sections     │ │ campaigns    │ │ page-config              │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ sections │ │ campaigns│ │ bundles  │ │ section_analytics  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CACHING (Redis)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ page_config:{page_id} - TTL: 5 minutes                    │   │
│  │ section_config:{section_id} - TTL: 5 minutes              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Manageable Sections

### Section Registry (6 Core Sections)

| Section ID | Name | Category | Customizable Properties |
|------------|------|----------|------------------------|
| `flash-deals` | Flash Deals Banner | Promotional | Timer, products (games/software/giftcards/subscriptions), discount %, colors, urgency elements |
| `trending` | Trending Products | Products | Product selection (auto/manual), count, product type filter, auto-scroll |
| `featured` | Featured Products | Products | Tab config (by product type), products per tab, sorting, filters |
| `categories` | Categories Grid | Navigation | Categories shown, layout (grid/carousel), images, badges, product type grouping |
| `bundles` | Bundle Deals | Promotional | Bundle config, mixed product types, pricing, savings display, featured bundles |
| `gift-cards` | Gift Cards | Products | Denominations ($10-$100), platforms (Steam/PSN/Xbox/Nintendo), quick-add layout |

### Product Type Integration

Each section can be filtered or configured by product type:

```typescript
type ProductType = 'game' | 'software' | 'giftcard' | 'subscription';

// Example: Featured tabs by product type
const featuredTabs = [
  { id: 'games', label: 'Games', productType: 'game', icon: 'Gamepad2' },
  { id: 'software', label: 'Software', productType: 'software', icon: 'Monitor' },
  { id: 'giftcards', label: 'Gift Cards', productType: 'giftcard', icon: 'CreditCard' },
  { id: 'subscriptions', label: 'Subscriptions', productType: 'subscription', icon: 'Repeat' },
];
```

---

## 🗄️ Database Schema

### 1. Page Sections Table

```sql
CREATE TABLE page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'promotional', 'products', 'navigation'
    
    -- Visibility
    is_enabled BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Configuration (JSONB for flexibility)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Scheduling
    schedule_start TIMESTAMP WITH TIME ZONE,
    schedule_end TIMESTAMP WITH TIME ZONE,
    
    -- Targeting
    target_audience JSONB, -- { "new_users": true, "regions": ["US", "EU"] }
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_sections_enabled ON page_sections(is_enabled, display_order);
CREATE INDEX idx_sections_schedule ON page_sections(schedule_start, schedule_end);
```

### 2. Flash Deals Table

```sql
CREATE TABLE flash_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Deal Info
    name VARCHAR(200) NOT NULL,
    headline VARCHAR(200),
    sub_headline VARCHAR(300),
    
    -- Timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0, -- Higher = shown first if multiple active
    
    -- Visual Customization
    background_type VARCHAR(20) DEFAULT 'gradient', -- 'gradient', 'image', 'video', 'solid'
    background_value TEXT, -- gradient CSS, image URL, or color hex
    accent_color VARCHAR(7) DEFAULT '#00D9FF',
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    
    -- CTA
    cta_text VARCHAR(50) DEFAULT 'Shop Now',
    cta_link VARCHAR(200) DEFAULT '/deals',
    cta_style JSONB DEFAULT '{"variant": "primary", "size": "lg"}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_flash_deals_active ON flash_deals(is_active, starts_at, ends_at);
```

### 3. Flash Deal Products Table

```sql
CREATE TABLE flash_deal_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_deal_id UUID REFERENCES flash_deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Deal-specific pricing
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'price_override'
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Inventory control
    max_quantity INTEGER, -- NULL = unlimited
    sold_count INTEGER DEFAULT 0,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false, -- Show prominently
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(flash_deal_id, product_id)
);

CREATE INDEX idx_fdp_deal ON flash_deal_products(flash_deal_id, display_order);
```

### 4. Bundle Deals Table

```sql
CREATE TABLE bundle_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Bundle Info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(300),
    
    -- Pricing
    original_price DECIMAL(10, 2) NOT NULL, -- Sum of individual prices
    bundle_price DECIMAL(10, 2) NOT NULL, -- Discounted bundle price
    savings_display VARCHAR(50), -- "Save $30" or "Save 40%"
    
    -- Visual
    image_url TEXT,
    badge_text VARCHAR(50), -- "Best Value", "Most Popular"
    badge_color VARCHAR(7),
    background_gradient TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Scheduling
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Inventory
    max_sales INTEGER, -- NULL = unlimited
    total_sold INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bundles_active ON bundle_deals(is_active, is_featured, display_order);
```

### 5. Bundle Products Table

```sql
CREATE TABLE bundle_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES bundle_deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    display_order INTEGER DEFAULT 0,
    is_bonus BOOLEAN DEFAULT false, -- "Bonus item included!"
    
    UNIQUE(bundle_id, product_id)
);
```

### 6. Section Analytics Table

```sql
CREATE TABLE section_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(50) NOT NULL,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'conversion', 'scroll_into_view'
    event_data JSONB,
    
    -- Context
    page_path VARCHAR(200),
    session_id VARCHAR(100),
    user_id UUID REFERENCES users(id),
    
    -- Device info
    device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
    browser VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_section_analytics ON section_analytics(section_key, event_type, created_at);
```

### 7. Section Config History (Audit Trail)

```sql
CREATE TABLE section_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(50) NOT NULL,
    
    previous_config JSONB,
    new_config JSONB NOT NULL,
    
    change_summary TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_history ON section_config_history(section_key, changed_at DESC);
```

---

## 🎨 Section Configuration Schemas

### Flash Deals Config Schema

```typescript
interface FlashDealConfig {
  // Display
  enabled: boolean;
  displayOrder: number;
  
  // Active Deal
  activeDealId: string | null; // UUID of current flash deal
  
  // Layout
  layout: 'banner' | 'carousel' | 'grid' | 'spotlight';
  maxProducts: number; // 1-12
  showCountdown: boolean;
  countdownPosition: 'top' | 'inline' | 'floating';
  
  // Animation
  animation: 'pulse' | 'glow' | 'shake' | 'none';
  animationIntensity: 'subtle' | 'normal' | 'intense';
  
  // Mobile
  mobileLayout: 'stack' | 'scroll' | 'compact';
  
  // Urgency Elements
  showSoldCount: boolean;
  showStockWarning: boolean;
  stockWarningThreshold: number; // Show "Only X left!" when below
  
  // Default Styling (can be overridden per deal)
  defaultColors: {
    background: string;
    accent: string;
    text: string;
    countdown: string;
  };
}
```

### Bundle Deals Config Schema

```typescript
interface BundleDealConfig {
  enabled: boolean;
  displayOrder: number;
  
  // Section Header
  sectionTitle: string;
  sectionSubtitle: string;
  
  // Display
  layout: 'grid' | 'carousel' | 'featured-list';
  maxBundles: number; // 3-12
  columnsDesktop: 2 | 3 | 4;
  columnsMobile: 1 | 2;
  
  // Featured Bundle (larger display)
  showFeaturedBundle: boolean;
  featuredBundleId: string | null;
  featuredPosition: 'left' | 'right' | 'top';
  
  // Card Style
  cardStyle: 'minimal' | 'detailed' | 'immersive';
  showSavingsPercentage: boolean;
  showOriginalPrice: boolean;
  showProductCount: boolean;
  
  // CTA
  ctaText: string;
  ctaStyle: 'primary' | 'secondary' | 'outline';
  
  // Empty State
  emptyStateMessage: string;
  showEmptyState: boolean;
}
```

### Trending Products Config Schema

```typescript
interface TrendingConfig {
  enabled: boolean;
  displayOrder: number;
  
  // Section Header
  sectionTitle: string; // "Trending Now"
  sectionSubtitle: string;
  
  // Product Selection
  selectionMode: 'auto' | 'manual';
  autoSortBy: 'sales' | 'views' | 'rating' | 'recent';
  autoTimeWindow: '24h' | '7d' | '30d';
  manualProductIds: string[]; // If manual mode
  
  // Filtering
  productTypes: ProductType[]; // Filter by type
  maxProducts: number; // 4-20
  
  // Display
  layout: 'carousel' | 'grid' | 'list';
  showRank: boolean; // #1, #2, #3...
  showBadges: boolean; // "Hot", "Trending"
  
  // Auto-scroll (carousel only)
  autoScroll: boolean;
  autoScrollInterval: number; // ms
  pauseOnHover: boolean;
  
  // Card Style
  showPrice: boolean;
  showDiscount: boolean;
  showPlatform: boolean;
  showRating: boolean;
}
```

### Featured Products Config Schema

```typescript
interface FeaturedConfig {
  enabled: boolean;
  displayOrder: number;
  
  // Section Header
  sectionTitle: string;
  sectionSubtitle: string;
  
  // Tabs Configuration
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
    productType?: ProductType; // Filter by type
    sortBy: 'featured' | 'new' | 'bestseller' | 'rating' | 'price';
    enabled: boolean;
    order: number;
  }>;
  
  // Default tabs:
  // - Featured (staff picks)
  // - New Releases (last 30 days)
  // - Best Sellers (by sales)
  // - Games / Software / Gift Cards / Subscriptions
  
  // Display
  productsPerTab: number; // 4-12
  columnsDesktop: 3 | 4;
  columnsMobile: 1 | 2;
  
  // Card Actions
  showAddToCart: boolean;
  showBuyNow: boolean;
  showWishlist: boolean;
  
  // Loading
  showSkeletons: boolean;
  skeletonCount: number;
}
```

### Gift Cards Config Schema

```typescript
interface GiftCardsConfig {
  enabled: boolean;
  displayOrder: number;
  
  // Section Header
  sectionTitle: string; // "Gift Cards & Top-Ups"
  sectionSubtitle: string;
  
  // Platforms to Display
  platforms: Array<{
    id: string;
    name: string; // "Steam Wallet", "PlayStation Store"
    icon: string;
    enabled: boolean;
    order: number;
    color: string; // Brand color
  }>;
  
  // Denominations
  defaultDenominations: number[]; // [10, 20, 25, 50, 100]
  showCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;
  
  // Layout
  layout: 'grid' | 'carousel' | 'tabs';
  columnsDesktop: 3 | 4 | 5;
  columnsMobile: 2 | 3;
  
  // Quick Add
  enableQuickAdd: boolean; // Add to cart without page navigation
  showPopularBadge: boolean;
  
  // Styling
  cardStyle: 'minimal' | 'branded' | 'detailed';
  showPlatformLogo: boolean;
}
```

### Categories Config Schema

```typescript
interface CategoriesConfig {
  enabled: boolean;
  displayOrder: number;
  
  // Header
  sectionTitle: string;
  sectionSubtitle: string;
  
  // Layout
  layout: 'grid' | 'masonry' | 'carousel';
  columnsDesktop: 4 | 5 | 6;
  columnsMobile: 2 | 3;
  rowsToShow: number;
  showViewAll: boolean;
  
  // Categories
  categories: Array<{
    id: string;
    enabled: boolean;
    displayOrder: number;
    customLabel?: string;
    customImage?: string;
    customColor?: string;
    badge?: string; // "New", "Hot", "Sale"
  }>;
  
  // Card Style
  cardStyle: 'image-overlay' | 'icon-minimal' | 'icon-card';
  showProductCount: boolean;
  hoverEffect: 'zoom' | 'lift' | 'glow' | 'none';
}
```

### Product Type Enum

```typescript
// Shared across all section configs
enum ProductType {
  GAME = 'game',
  SOFTWARE = 'software',
  GIFTCARD = 'giftcard',
  SUBSCRIPTION = 'subscription',
}

// Product type display config
interface ProductTypeConfig {
  type: ProductType;
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  enabled: boolean;
}

const PRODUCT_TYPES: ProductTypeConfig[] = [
  { type: 'game', label: 'Game', pluralLabel: 'Games', icon: 'Gamepad2', color: '#00D9FF', enabled: true },
  { type: 'software', label: 'Software', pluralLabel: 'Software', icon: 'Monitor', color: '#A855F7', enabled: true },
  { type: 'giftcard', label: 'Gift Card', pluralLabel: 'Gift Cards', icon: 'CreditCard', color: '#22C55E', enabled: true },
  { type: 'subscription', label: 'Subscription', pluralLabel: 'Subscriptions', icon: 'Repeat', color: '#F59E0B', enabled: true },
];
```

---

## 🖥️ Admin UI Design

### 1. Section Manager Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎨 Page Customization                                    [Preview] [Save]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Page: Homepage ▼                        Last saved: 2 hours ago         │
│                                                                          │
│  ┌─ Sections ─────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  ☰ 1. 🔥 Flash Deals          [Enabled ✓]    [Edit] [Analytics]   │ │
│  │     └─ "Winter Sale - 50% Off" - Ends in 2d 14h • 12 products     │ │
│  │                                                                     │ │
│  │  ☰ 2. 📈 Trending Products    [Enabled ✓]    [Edit] [Analytics]   │ │
│  │     └─ Auto mode • Top 8 by sales • All product types             │ │
│  │                                                                     │ │
│  │  ☰ 3. ⭐ Featured Products    [Enabled ✓]    [Edit] [Analytics]   │ │
│  │     └─ 4 tabs (Games, Software, Gift Cards, Subscriptions)        │ │
│  │                                                                     │ │
│  │  ☰ 4. 📂 Categories           [Enabled ✓]    [Edit] [Analytics]   │ │
│  │     └─ 24 categories • Grid layout • All types                     │ │
│  │                                                                     │ │
│  │  ☰ 5. 📦 Bundle Deals         [Disabled]     [Edit] [Analytics]   │ │
│  │     └─ 3 bundles configured • Mixed product types                  │ │
│  │                                                                     │ │
│  │  ☰ 6. 💳 Gift Cards           [Enabled ✓]    [Edit] [Analytics]   │ │
│  │     └─ Steam, PSN, Xbox, Nintendo • Quick-add enabled             │ │
│  │                                                                     │ │
│  │  (drag to reorder sections)                                        │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Flash Deal Editor

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔥 Flash Deal Editor                               [Cancel] [Save Deal] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Deal Info ──────────────────────────────────────────────────────┐  │
│  │  Name: [Winter Mega Sale                                      ]  │  │
│  │  Headline: [Save Up to 70% on Top Games!                      ]  │  │
│  │  Sub-headline: [Limited time only - Don't miss out!           ]  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Schedule ───────────────────────────────────────────────────────┐  │
│  │  Start: [Jan 15, 2026] [10:00 AM] ─── End: [Jan 20, 2026] [11:59 PM] │
│  │                                                                   │  │
│  │  Status: 🟢 Currently Active (ends in 5d 14h 23m)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Visual Design ──────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Background:  ○ Gradient  ○ Image  ○ Solid  ○ Video              │  │
│  │               [████████████████████████████████████]              │  │
│  │               Cyan → Purple                                       │  │
│  │                                                                   │  │
│  │  Accent Color: [#00D9FF] ████     Text: [#FFFFFF] ████           │  │
│  │                                                                   │  │
│  │  ┌─ Preview ────────────────────────────────────────────────┐    │  │
│  │  │  🔥 FLASH SALE                                           │    │  │
│  │  │  Save Up to 70% on Top Games!           ⏱️ 5d 14h 23m   │    │  │
│  │  │  Limited time only - Don't miss out!     [Shop Now →]   │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Products (12 selected) ─────────────────────────────────────────┐  │
│  │  [+ Add Products]                              [Bulk Edit Prices] │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Elden    │ │ GTA V    │ │ Cyberpunk│ │ RDR2     │  ...       │  │
│  │  │ Ring     │ │          │ │ 2077     │ │          │            │  │
│  │  │──────────│ │──────────│ │──────────│ │──────────│            │  │
│  │  │ $59.99   │ │ $29.99   │ │ $59.99   │ │ $59.99   │            │  │
│  │  │ -40%     │ │ -50%     │ │ -60%     │ │ -45%     │            │  │
│  │  │ =$35.99  │ │ =$14.99  │ │ =$23.99  │ │ =$32.99  │            │  │
│  │  │  [Edit]  │ │  [Edit]  │ │  [Edit]  │ │  [Edit]  │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Bundle Deal Editor

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 Bundle Editor                                  [Cancel] [Save Bundle]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─ Bundle Info ────────────────────────────────────────────────────┐  │
│  │  Name: [AAA Gaming Starter Pack                               ]  │  │
│  │  Slug: [aaa-gaming-starter-pack                               ]  │  │
│  │  Description:                                                     │  │
│  │  [Get 5 blockbuster games at an incredible price. Perfect for   ]│  │
│  │  [new gamers or expanding your collection.                      ]│  │
│  │                                                                   │  │
│  │  Badge: [Best Value ▼]    Badge Color: [#22C55E] ████            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Pricing ────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Individual Total:  $299.95    (sum of all products)             │  │
│  │  Bundle Price:      [$149.99            ]                        │  │
│  │                                                                   │  │
│  │  Savings:           $149.96  (50% off)  ✓ Show on card           │  │
│  │  Display Text:      [Save $150!                    ]             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Products in Bundle ─────────────────────────────────────────────┐  │
│  │  [+ Add Product]                                                  │  │
│  │                                                                   │  │
│  │  1. ☰ Elden Ring              $59.99    [Remove]                 │  │
│  │  2. ☰ Cyberpunk 2077          $59.99    [Remove]                 │  │
│  │  3. ☰ Red Dead Redemption 2   $59.99    [Remove]                 │  │
│  │  4. ☰ GTA V                   $29.99    [Remove]                 │  │
│  │  5. ☰ The Witcher 3 GOTY      $49.99    [Remove]                 │  │
│  │  ─────────────────────────────────────                            │  │
│  │  6. ☰ 🎁 Bonus: Wallpaper Pack  FREE    [Remove]                 │  │
│  │                                                                   │  │
│  │  Subtotal: $299.95                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Visual ─────────────────────────────────────────────────────────┐  │
│  │  Cover Image: [Upload]  [Generate from products]                  │  │
│  │                                                                   │  │
│  │  ┌────────────────────┐                                          │  │
│  │  │                    │  Background Gradient:                    │  │
│  │  │   [Bundle Image]   │  [from-purple-900 to-cyan-900         ] │  │
│  │  │                    │                                          │  │
│  │  └────────────────────┘                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Section Analytics View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Flash Deals Analytics                         [Export] [Date Range ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Period: Last 7 Days                                                     │
│                                                                          │
│  ┌─ Key Metrics ────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │   👁️ Views        🖱️ Clicks       💰 Conversions    📈 CTR       │  │
│  │   45,231         3,892          847              8.6%           │  │
│  │   +12% ↑         +8% ↑          +23% ↑           +1.2% ↑        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Performance Over Time ──────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Views ████                                                       │  │
│  │        ████ ████                                                  │  │
│  │   ████ ████ ████ ████                                            │  │
│  │   ████ ████ ████ ████ ████ ████ ████                             │  │
│  │   Mon  Tue  Wed  Thu  Fri  Sat  Sun                              │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Top Performing Products ────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  1. Elden Ring (-40%)        234 sales    $8,426 revenue         │  │
│  │  2. GTA V (-50%)             189 sales    $2,833 revenue         │  │
│  │  3. Cyberpunk 2077 (-60%)    156 sales    $3,742 revenue         │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─ Device Breakdown ───────────────────────────────────────────────┐  │
│  │  Desktop: 58%  │  Mobile: 38%  │  Tablet: 4%                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Section Management

```typescript
// GET /admin/sections
// List all configurable sections
interface ListSectionsResponse {
  sections: SectionSummary[];
}

// GET /admin/sections/:sectionKey
// Get section configuration
interface GetSectionResponse {
  section: Section;
  config: SectionConfig;
  analytics: SectionAnalyticsSummary;
}

// PATCH /admin/sections/:sectionKey
// Update section configuration
interface UpdateSectionRequest {
  enabled?: boolean;
  displayOrder?: number;
  config?: Partial<SectionConfig>;
}

// PATCH /admin/sections/reorder
// Bulk reorder sections
interface ReorderSectionsRequest {
  order: Array<{ sectionKey: string; displayOrder: number }>;
}
```

### Flash Deals

```typescript
// GET /admin/flash-deals
// List all flash deals
interface ListFlashDealsResponse {
  deals: FlashDeal[];
  active: FlashDeal | null;
}

// POST /admin/flash-deals
// Create new flash deal
interface CreateFlashDealRequest {
  name: string;
  headline: string;
  subHeadline?: string;
  startsAt: string; // ISO date
  endsAt: string;
  backgroundType: 'gradient' | 'image' | 'solid';
  backgroundValue: string;
  accentColor: string;
  products: Array<{
    productId: string;
    discountType: 'percentage' | 'fixed' | 'price_override';
    discountValue: number;
    maxQuantity?: number;
  }>;
}

// PATCH /admin/flash-deals/:id
// Update flash deal

// DELETE /admin/flash-deals/:id
// Delete flash deal

// POST /admin/flash-deals/:id/activate
// Activate a flash deal (deactivates others)

// POST /admin/flash-deals/:id/duplicate
// Duplicate a flash deal for quick creation
```

### Bundle Deals

```typescript
// GET /admin/bundles
// List all bundles

// POST /admin/bundles
// Create bundle
interface CreateBundleRequest {
  name: string;
  slug: string;
  description: string;
  bundlePrice: number;
  productIds: string[];
  bonusProductIds?: string[];
  imageUrl?: string;
  badgeText?: string;
  startsAt?: string;
  endsAt?: string;
}

// PATCH /admin/bundles/:id
// Update bundle

// DELETE /admin/bundles/:id
// Delete bundle

// GET /admin/bundles/:id/analytics
// Get bundle performance
```

### Public API (Frontend Consumption)

```typescript
// GET /public/page-config/:pageId
// Get full page configuration for rendering
interface PageConfigResponse {
  pageId: string;
  sections: Array<{
    key: string;
    enabled: boolean;
    config: SectionConfig;
    data?: SectionData; // Preloaded data for some sections
  }>;
  flashDeal: FlashDealPublic | null;
  bundles: BundlePublic[];
  lastUpdated: string;
  cacheKey: string; // For client-side cache invalidation
}

// GET /public/flash-deal/active
// Get current active flash deal with products

// GET /public/bundles
// Get active bundles for display
```

---

## 🔄 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema creation & migrations (page_sections, flash_deals, bundles)
- [ ] Basic Section entity & service
- [ ] Section Manager admin page (list, enable/disable, reorder 6 sections)
- [ ] Redis caching for page config
- [ ] Public page-config endpoint
- [ ] Product type enum and filtering infrastructure

### Phase 2: Flash Deals (Week 3)
- [ ] Flash Deal entity & service
- [ ] Flash Deal admin CRUD pages
- [ ] Product selection modal (filter by Games/Software/Gift Cards/Subscriptions)
- [ ] Countdown timer component
- [ ] Flash Deal banner component
- [ ] Scheduling & activation logic

### Phase 3: Trending & Featured Products (Week 4)
- [ ] Trending products config & service
- [ ] Auto-selection logic (by sales, views, rating)
- [ ] Featured products tab configuration
- [ ] Product type tab filters (Games, Software, Gift Cards, Subscriptions)
- [ ] Admin editors for both sections

### Phase 4: Categories & Gift Cards (Week 5)
- [ ] Categories grid configuration
- [ ] Category management (enable/disable, reorder, custom images)
- [ ] Gift Cards section with platform configs
- [ ] Denomination quick-add functionality
- [ ] Admin editors for both sections

### Phase 5: Bundle Deals (Week 6)
- [ ] Bundle entity & service
- [ ] Bundle admin CRUD pages
- [ ] Mixed product type bundles (games + software + subscriptions)
- [ ] Bundle card component
- [ ] Bundle section component
- [ ] Checkout integration (bundle as single item)

### Phase 6: Visual Customization & Analytics (Week 7-8)
- [ ] Color picker components
- [ ] Gradient builder
- [ ] Image upload & management
- [ ] Live preview system
- [ ] Section analytics tracking
- [ ] Analytics dashboard for all 6 sections
- [ ] Performance monitoring

---

## 📱 Mobile Considerations

### Responsive Admin UI
- Collapsible section list on mobile
- Full-screen editors for complex sections
- Touch-friendly drag & drop
- Preview toggle between device sizes

### Mobile Marketing Page
- Sections may have mobile-specific configs
- Different layouts for mobile (carousel vs grid)
- Touch-optimized interactions
- Reduced animations for performance

---

## 🔒 Security & Permissions

### Role-Based Access

| Permission | Marketing Manager | Admin | Super Admin |
|------------|-------------------|-------|-------------|
| View sections | ✅ | ✅ | ✅ |
| Edit content | ✅ | ✅ | ✅ |
| Enable/disable sections | ✅ | ✅ | ✅ |
| Create flash deals | ✅ | ✅ | ✅ |
| Create bundles | ✅ | ✅ | ✅ |
| Reorder sections | ❌ | ✅ | ✅ |
| Edit visual design | ❌ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ |
| Export data | ❌ | ✅ | ✅ |
| Manage permissions | ❌ | ❌ | ✅ |

### Audit Trail
- All changes logged with user, timestamp, before/after
- Rollback capability for last 30 days
- Alert on critical changes (section disable, etc.)

---

## 🧪 Testing Strategy

### Unit Tests
- Config validation schemas
- Price calculation (discounts, bundles)
- Schedule logic (active/inactive determination)
- Cache invalidation

### Integration Tests
- Full CRUD flows for deals & bundles
- Section reordering
- Analytics event tracking
- Cache coherence

### E2E Tests
- Admin creates flash deal → appears on homepage
- Admin schedules deal → activates at correct time
- User purchases bundle → correct products delivered
- Section disable → immediately hidden

---

## 📊 Success Metrics

### Admin Experience
- Time to create new campaign: < 5 minutes
- Time to update content: < 30 seconds
- Admin satisfaction score: > 4.5/5

### Business Impact
- Flash deal conversion rate: > 5%
- Bundle attach rate: > 10%
- Revenue from promotional sections: Track weekly

### Technical
- Page config API response time: < 50ms (cached)
- Cache hit rate: > 95%
- Zero downtime deployments for config changes

---

## 🔮 Future Enhancements

### Short Term (3-6 months)
- A/B testing for section configurations
- Personalized sections based on user purchase history
- Multi-language support for section content
- Integration with email campaigns (sync deals)
- Product type-specific recommendations

### Long Term (6-12 months)
- AI-powered product recommendations per product type
- Dynamic pricing based on demand (games vs software)
- Automated deal creation based on inventory
- Cross-sell intelligence (e.g., game + subscription bundle suggestions)
- Seasonal campaign templates (Black Friday, Summer Sale, etc.)

---

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Author:** AI Assistant  
**Status:** Ready for Review
