# BitLoot Neon Cyberpunk Design System

**Date:** January 17, 2026  
**Status:** ✅ COMPLETE & PRODUCTION-READY  
**Theme:** Neon Cyberpunk Gaming (Deep Space Dark Mode)

---

## 🎯 Design Philosophy

BitLoot uses a **neon cyberpunk gaming aesthetic** with electric accents on a deep space dark background:

- **Trustworthy & Secure** – Professional, approachable, built for gaming & crypto
- **Neon Cyberpunk** – Electric cyan, vibrant purples, modern gaming aesthetic
- **Instant & Responsive** – Snappy interactions, smooth animations, real-time feedback
- **Clear Hierarchy** – Information always organized, never overwhelming
- **Gaming-Forward** – Glowing accents, hover effects, premium feel

---

## 🎨 Color System (Non-Negotiable)

### Primary Neon Accent Colors

| Color | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| **Cyan Glow** | `190 100% 50%` | `#00D9FF` | Primary action, focus ring, glow effects |
| **Purple Neon** | `277 66% 59%` | `#9D4EDD` | Secondary accent, featured content |
| **Green Success** | `123 100% 54%` | `#39FF14` | Success states, positive feedback |
| **Orange Warning** | `25 100% 50%` | `#FF6B00` | Warnings, caution states |
| **Pink Featured** | `331 100% 50%` | `#FF006E` | Featured products, highlights |

### Background Colors (Deep Space)

| Color | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| **Background** | `220 40% 7%` | `#0A0E1A` | Primary background (all pages) |
| **Card/Secondary** | `220 35% 10%` | `#0F1420` | Card, popover, sidebar backgrounds |
| **Elevated/Tertiary** | `220 30% 14%` | `#161D2A` | Elevated surfaces, modals, tooltips |

### Text Colors

| Color | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| **Primary** | `0 0% 100%` | `#FFFFFF` | Main text, high contrast |
| **Secondary** | `218 25% 75%` | `#B4BDD0` | Subtext, descriptions, labels |
| **Muted** | `218 20% 55%` | `#7A8599` | Disabled, subtle text, hints |

### Border Colors

| Color | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| **Border Subtle** | `220 25% 20%` | `#2A3344` | Soft dividers (default borders) |
| **Border Accent** | `220 25% 26%` | `#363F52` | Emphasized borders, hover states |
| **Sidebar Border** | `220 25% 15%` | — | Sidebar-specific borders |

### Tailwind CSS Color Classes

```tsx
// Neon Accents
text-cyan-glow, text-purple-neon, text-green-success, text-orange-warning, text-pink-featured

// Backgrounds
bg-bg-primary, bg-bg-secondary, bg-bg-tertiary

// Text
text-text-primary, text-text-secondary, text-text-muted

// Borders
border-border-subtle, border-border-accent

// ⚠️ NEVER hardcode hex values – Always use CSS variables via Tailwind classes
```

---

## 🌟 Glow & Neon Effects (BitLoot Signature)

### Box Shadow Glows

| Class | Effect | Usage |
|-------|--------|-------|
| `shadow-glow-cyan` | `0 0 20px cyan/0.4, 0 0 40px cyan/0.2` | Standard cyan glow |
| `shadow-glow-cyan-sm` | `0 0 10px cyan/0.3, 0 0 20px cyan/0.15` | Small cyan glow |
| `shadow-glow-cyan-lg` | `0 0 30px cyan/0.5, 0 0 60px cyan/0.25` | Large cyan glow |
| `shadow-glow-purple` | Standard purple glow | Secondary elements |
| `shadow-glow-purple-sm` | Small purple glow | Subtle accents |
| `shadow-glow-success` | Green glow | Success states |
| `shadow-glow-error` | Orange/red glow | Error states |
| `shadow-glow-pink` | Pink glow | Featured items |

### Card Shadows

| Class | Effect |
|-------|--------|
| `shadow-card-sm` | `0 1px 2px bg-primary/0.5` |
| `shadow-card-md` | `0 4px 6px -1px bg-primary/0.5, 0 2px 4px -2px bg-primary/0.25` |
| `shadow-card-lg` | `0 10px 15px -3px bg-primary/0.5, 0 4px 6px -4px bg-primary/0.25` |
| `shadow-inset-glow` | `inset 0 0 10px cyan/0.1` (for inputs) |

### Gradient Utilities

```tsx
// Background gradients
bg-gradient-primary         // Cyan → Purple diagonal (135deg)
bg-gradient-primary-subtle  // Subtle opacity version (20%)
bg-gradient-success         // Green gradient for positive states
bg-gradient-featured        // Pink → Purple for featured products
bg-gradient-dark            // Dark vertical gradient
bg-mesh-gradient            // Complex mesh gradient for hero sections
```

### Glass Morphism

```tsx
.glass          // backdrop-blur-md bg-bg-secondary/70 border border-border-subtle/50
.glass-strong   // backdrop-blur-xl bg-bg-secondary/90 border border-border-subtle
```

### Text Effects

```tsx
// Text Gradients
.text-gradient-primary    // Cyan to purple text gradient
.text-gradient-featured   // Pink to purple text gradient
.text-gradient-success    // Green to cyan text gradient

// Text Glow
.text-glow-cyan    // Cyan text shadow glow
.text-glow-purple  // Purple text shadow glow
.text-glow-pink    // Pink text shadow glow
```

### Neon Borders

```tsx
.border-neon-cyan    // border-cyan-glow + shadow-glow-cyan-sm
.border-neon-purple  // border-purple-neon + shadow-glow-purple-sm
```

---

## ✨ Animations

### Available Animations

| Animation | Duration | Description |
|-----------|----------|-------------|
| `animate-glow-pulse` | 2s infinite | Cyan glow pulsing |
| `animate-float` | 3s infinite | Subtle float up/down |
| `animate-slide-in-right` | 0.3s | Slide in from right |
| `animate-slide-in-left` | 0.3s | Slide in from left |
| `animate-slide-up` | 0.3s | Slide up |
| `animate-fade-in` | 0.3s | Fade in |
| `animate-scale-in` | 0.2s | Scale in with fade |
| `animate-shimmer` | 2s infinite | Shimmer effect for loading |
| `animate-spin-glow` | 1s infinite | Spinner with cyan glow |
| `animate-bounce-subtle` | 1s infinite | Subtle bounce |
| `animate-pulse-ring` | 1.5s infinite | Expanding ring pulse |
| `animate-gradient-shift` | 3s infinite | Gradient color shift |
| `animate-accordion-down/up` | 0.2s | Accordion open/close |
| `animate-collapsible-down/up` | 0.2s | Collapsible open/close |

### Transition Timing Functions

```tsx
transition-smooth        // cubic-bezier(0.4, 0, 0.2, 1)
transition-bounce-in     // cubic-bezier(0.68, -0.55, 0.265, 1.55)
transition-ease-out-expo // cubic-bezier(0.19, 1, 0.22, 1)
transition-gaming        // cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Custom Durations

```tsx
duration-250  // 250ms
duration-350  // 350ms
duration-400  // 400ms
```

---

## 🔤 Typography System

### Font Families

```css
--font-sans: 'Geist', 'Inter', system-ui, sans-serif;  /* via font-sans */
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace; /* via font-mono */
```

### Font Sizes

| Size | Value | Line Height |
|------|-------|-------------|
| `text-xs` | 0.75rem | 1rem |
| `text-sm` | 0.875rem | 1.25rem |
| `text-base` | 1rem | 1.5rem |
| `text-lg` | 1.125rem | 1.75rem |
| `text-xl` | 1.25rem | 1.75rem |
| `text-2xl` | 1.5rem | 2rem |
| `text-3xl` | 1.875rem | 2.25rem |
| `text-4xl` | 2.25rem | 2.5rem |

### Heading Styles

```tsx
h1: text-3xl sm:text-4xl font-semibold tracking-tight
h2: text-2xl sm:text-3xl font-semibold tracking-tight
h3: text-xl sm:text-2xl font-semibold tracking-tight
h4: text-lg sm:text-xl font-semibold tracking-tight
```

### Code Styling

```tsx
// Inline code
<code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-cyan-glow font-mono text-sm">
  code
</code>

// Code blocks
<pre className="bg-bg-secondary border border-border-subtle rounded-lg p-4 overflow-x-auto font-mono text-sm">
  code block
</pre>
```

---

## 📐 Layout & Spacing

### Border Radius

```tsx
rounded-lg  // var(--radius) = 0.625rem (10px)
rounded-md  // calc(var(--radius) - 2px) = 8px
rounded-sm  // calc(var(--radius) - 4px) = 6px
```

### Custom Spacing

```tsx
spacing-4.5   // 1.125rem
spacing-13    // 3.25rem
spacing-15    // 3.75rem
spacing-18    // 4.5rem
spacing-22    // 5.5rem
```

### Max Widths

```tsx
max-w-6xl  // Standard pages
max-w-7xl  // Dashboards
max-w-8xl  // 88rem
max-w-9xl  // 96rem
```

### Safe Area Padding (PWA)

```tsx
.safe-top     // padding-top: env(safe-area-inset-top)
.safe-bottom  // padding-bottom: env(safe-area-inset-bottom)
.safe-left    // padding-left: env(safe-area-inset-left)
.safe-right   // padding-right: env(safe-area-inset-right)
.safe-all     // all safe areas
```

---

## 🧩 Component Classes

### Button Variants

```tsx
.btn-primary    // bg-cyan-glow, hover glow, active scale
.btn-secondary  // bg-purple-neon, hover glow, active scale
.btn-ghost      // transparent, hover:bg-tertiary
.btn-outline    // bordered, hover:cyan glow
.btn-glow-cyan  // hover/active glow states
.btn-glow-purple // hover/active glow states
```

### Input Variants

```tsx
.input-glow  // bg-bg-secondary with cyan glow focus
```

### Badge Variants

```tsx
.badge-success   // green bg/text/border
.badge-warning   // orange bg/text/border
.badge-error     // red bg/text/border
.badge-info      // cyan bg/text/border
.badge-featured  // pink bg/text/border
```

### Card Variants

```tsx
.card-interactive       // hover:border-accent, hover:shadow-card-md
.card-interactive-glow  // + hover:shadow-glow-cyan-sm, hover:border-cyan-glow/50
```

### Empty State

```tsx
.empty-state              // flex col, center, py-16
.empty-state-icon         // w-16 h-16 text-text-muted
.empty-state-title        // text-lg font-medium
.empty-state-description  // text-sm text-text-secondary max-w-sm
```

### Status Indicators

```tsx
.status-dot           // w-2 h-2 rounded-full
.status-dot-success   // green + glow
.status-dot-warning   // orange + glow
.status-dot-error     // red + glow
.status-dot-info      // cyan + glow
```

### Other Utilities

```tsx
.skeleton              // Loading skeleton with shimmer
.shimmer               // Shimmer animation
.divider-with-label    // Divider with centered text
.crypto-amount         // font-mono tabular-nums
.line-clamp-1/2/3      // Text truncation
.scrollbar-thin        // Custom thin scrollbar (8px)
.scrollbar-hidden      // Hide scrollbar
.focus-ring            // Outset focus ring
.focus-ring-inset      // Inset focus ring
.pulse-notification    // Pulsing notification badge
.bg-animated-gradient  // Animated background gradient
```

---

## 🧱 shadcn/ui Components (46 Total)

### Layout & Display (9)

- Accordion, Alert Dialog, Alert, Aspect Ratio, Avatar, Badge, Breadcrumb, Card, Carousel

### Forms & Input (9)

- Checkbox, Form, Input, Input OTP, Label, Radio Group, Select, Textarea, Toggle, Toggle Group

### Navigation & Menu (7)

- Breadcrumb, Context Menu, Dropdown Menu, Menubar, Navigation Menu, Pagination, Sidebar

### Interactions & Modals (5)

- Dialog, Drawer, Popover, Sheet, Hover Card

### Data Display (8)

- Calendar, Chart, Command, Progress, Skeleton, Slider, Table, Tabs

### Utilities (8)

- Collapsible, Resizable, Scroll Area, Separator, Sonner, Switch, Tooltip

---

## ⚙️ Configuration Files

### components.json (Shadcn)

```json
{
  "aliases": {
    "components": "@/design-system",
    "utils": "@/design-system/utils",
    "ui": "@/design-system/primitives",
    "lib": "@/design-system/lib",
    "hooks": "@/design-system/hooks"
  },
  "tailwind": {
    "css": "src/design-system/styles/globals.css",
    "config": "tailwind.config.ts"
  }
}
```

### Installation Paths

| Path | Content |
|------|---------|
| `src/design-system/primitives/` | UI components |
| `src/design-system/utils/utils.ts` | Utility functions |
| `src/design-system/hooks/` | Custom hooks |
| `src/design-system/styles/` | Global CSS |
| `src/design-system/lib/` | Library code |

### PostCSS Config

```mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

## 📋 State Handling (All Required)

| State | Implementation |
|-------|----------------|
| **Default** | `text-text-secondary`, `border-border-subtle`, `bg-bg-secondary` |
| **Hover** | `hover:text-cyan-glow`, `hover:shadow-glow-cyan`, `hover:border-border-accent` |
| **Focus** | `ring-2 ring-cyan-glow ring-offset-2 ring-offset-bg-primary` |
| **Active/Pressed** | `ring-2 ring-cyan-glow`, `active:scale-[0.98]` |
| **Disabled** | `opacity-50 cursor-not-allowed` |
| **Loading** | `.skeleton` with `animate-shimmer` or `animate-spin-glow` |
| **Error** | `.badge-error`, `text-orange-warning` or `text-destructive` |
| **Success** | `.badge-success`, `text-green-success`, `shadow-glow-success` |
| **Empty** | `.empty-state` with icon + title + description + CTA |

---

## ♿ Accessibility

- **Color Contrast:** 4.5:1 for text, 3:1 for large text (cyan-glow on dark: ~7:1 ✓)
- **Focus Rings:** Auto-styled via globals.css
- **Reduced Motion:** Respects `prefers-reduced-motion: reduce`
- **Keyboard Nav:** All interactive elements are tabbable
- **Selection:** `::selection` styled as `bg-cyan-glow/30 text-text-primary`

---

## 🚀 Usage Examples

### Import Components

```tsx
import { Button } from '@/design-system/primitives/button';
import { Card, CardHeader, CardContent } from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';

// Or via barrel export
import { Button, Card, Input } from '@/design-system/primitives';
```

### Primary CTA Button

```tsx
<Button className="btn-primary shadow-glow-cyan hover:shadow-glow-cyan-lg">
  Buy Now with Crypto
</Button>
```

### Interactive Card

```tsx
<div className="card-interactive-glow p-6">
  <h3 className="text-text-primary">Game Key</h3>
  <p className="text-text-secondary">Instant delivery</p>
</div>
```

### Status Badge

```tsx
<span className="badge-success">Paid</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Failed</span>
```

### Text with Glow

```tsx
<h1 className="text-gradient-primary text-glow-cyan">
  BitLoot
</h1>
```

### Empty State

```tsx
<div className="empty-state">
  <PackageIcon className="empty-state-icon" />
  <h3 className="empty-state-title">No Orders Yet</h3>
  <p className="empty-state-description">
    Start shopping to see your orders here.
  </p>
  <Button className="btn-primary mt-4">Browse Products</Button>
</div>
```

---

## 📊 Component Status

| Category | Components | Status |
|----------|------------|--------|
| Layout | 9 | ✅ Installed |
| Forms | 9 | ✅ Installed |
| Navigation | 7 | ✅ Installed |
| Interactions | 5 | ✅ Installed |
| Data Display | 8 | ✅ Installed |
| Utilities | 8 | ✅ Installed |
| **Total** | **46** | **✅ COMPLETE** |

---

## ⚠️ Important Notes

- **Dark Mode Only:** BitLoot uses a permanent dark theme (neon cyberpunk)
- **Never Hardcode Colors:** Always use CSS variables via Tailwind classes
- **Icon Library:** Lucide icons ONLY
- **No Bouncy Animations:** Keep gaming aesthetic professional
- **Touch Targets:** Minimum 44px for buttons and interactive elements
- **Max Width:** `max-w-6xl` for pages, `max-w-7xl` for dashboards

---

**All components are ready to use!** 🎮✨
