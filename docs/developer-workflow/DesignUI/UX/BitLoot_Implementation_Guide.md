# 🔌 BitLoot Frontend Implementation Guide — Complete Wiring & Integration

**Status:** 🚀 Ready for Development  
**Created:** November 19, 2025  
**Target:** Production Launch  
**Scope:** Complete SDK integration, API wiring, and component implementation

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [SDK Integration](#sdk-integration)
5. [Authentication Flow](#authentication-flow)
6. [Component Implementation](#component-implementation)
7. [API Integration Patterns](#api-integration-patterns)
8. [State Management](#state-management)
9. [Page Routing](#page-routing)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Generate SDK from running API
npm run sdk:gen

# Start development
npm run dev:all

# Open browser
http://localhost:3000
```

### Project Setup (If Starting Fresh)

```bash
# Create web app with Next.js 16 + React 19
npx create-next-app@16 apps/web --app \
  --typescript \
  --tailwind \
  --eslint \
  --src-dir

# Install required dependencies
npm install -D @hookform/resolvers zod react-query axios
npm install @hookform/resolvers zod react-query axios

# Copy design system (globals.css) from design guide
# Setup .env.local with API_URL

# Generate SDK
npm run sdk:gen
```

---

## Project Structure

```
apps/web/
├─ app/
│  ├─ (auth)/
│  │  ├─ layout.tsx                    # Auth layout (no header/footer)
│  │  ├─ page.tsx                      # Redirect to login
│  │  ├─ login/
│  │  │  └─ page.tsx                  # OTP login
│  │  └─ verify-otp/
│  │     └─ page.tsx                  # OTP verification
│  │
│  ├─ (store)/
│  │  ├─ layout.tsx                   # Store layout (header/footer)
│  │  ├─ page.tsx                     # Homepage
│  │  ├─ catalog/
│  │  │  └─ page.tsx                 # Product listing
│  │  ├─ product/
│  │  │  └─ [id]/page.tsx            # Product detail
│  │  ├─ cart/
│  │  │  └─ page.tsx                 # Shopping cart
│  │  └─ checkout/
│  │     └─ page.tsx                 # Checkout flow
│  │
│  ├─ (dashboard)/
│  │  ├─ layout.tsx                   # Dashboard layout (sidebar)
│  │  ├─ page.tsx                     # Dashboard home
│  │  ├─ orders/
│  │  │  ├─ page.tsx                 # My orders list
│  │  │  └─ [id]/page.tsx            # Order detail
│  │  ├─ keys/
│  │  │  └─ page.tsx                 # Digital keys
│  │  ├─ account/
│  │  │  └─ page.tsx                 # Account settings
│  │  └─ security/
│  │     └─ page.tsx                 # Security settings
│  │
│  ├─ (admin)/                        # Admin only pages
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ orders/page.tsx
│  │  ├─ payments/page.tsx
│  │  ├─ webhooks/page.tsx
│  │  ├─ products/page.tsx
│  │  ├─ flags/page.tsx
│  │  └─ settings/page.tsx
│  │
│  ├─ layout.tsx                      # Root layout
│  ├─ globals.css                     # Global styles
│  └─ favicon.ico
│
├─ src/
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ Button.tsx               # Button component
│  │  │  ├─ Input.tsx                # Input component
│  │  │  ├─ Card.tsx                 # Card component
│  │  │  ├─ Modal.tsx                # Modal component
│  │  │  ├─ Table.tsx                # Table component
│  │  │  ├─ Badge.tsx                # Badge component
│  │  │  ├─ Loading.tsx              # Loading spinner
│  │  │  ├─ ErrorBoundary.tsx        # Error boundary
│  │  │  ├─ Toast.tsx                # Toast notifications
│  │  │  └─ index.ts                 # Re-exports
│  │  │
│  │  ├─ layout/
│  │  │  ├─ Header.tsx               # Navigation header
│  │  │  ├─ Footer.tsx               # Footer
│  │  │  ├─ Sidebar.tsx              # Dashboard sidebar
│  │  │  ├─ Navigation.tsx           # Main nav component
│  │  │  └─ index.ts                 # Re-exports
│  │  │
│  │  └─ common/
│  │     ├─ ProtectedRoute.tsx       # Auth guard wrapper
│  │     ├─ AdminRoute.tsx           # Admin guard wrapper
│  │     ├─ Breadcrumb.tsx           # Breadcrumb nav
│  │     └─ index.ts                 # Re-exports
│  │
│  ├─ features/
│  │  ├─ auth/
│  │  │  ├─ components/
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  ├─ OTPVerificationForm.tsx
│  │  │  │  └─ LogoutButton.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useAuth.ts            # Auth context hook
│  │  │  │  ├─ useLogin.ts           # Login logic
│  │  │  │  ├─ useVerifyOTP.ts       # OTP verification
│  │  │  │  └─ useRequireAuth.ts     # Protected route guard
│  │  │  ├─ context/
│  │  │  │  └─ AuthContext.tsx       # React Context
│  │  │  ├─ types/
│  │  │  │  └─ index.ts              # Auth types
│  │  │  └─ index.ts                 # Re-exports
│  │  │
│  │  ├─ store/
│  │  │  ├─ components/
│  │  │  │  ├─ ProductGrid.tsx       # Product listing
│  │  │  │  ├─ ProductCard.tsx       # Single product card
│  │  │  │  ├─ FilterSidebar.tsx     # Product filters
│  │  │  │  └─ SearchBar.tsx         # Search component
│  │  │  ├─ hooks/
│  │  │  │  ├─ useProducts.ts        # Fetch products
│  │  │  │  ├─ useProduct.ts         # Fetch single product
│  │  │  │  ├─ useSearch.ts          # Search products
│  │  │  │  └─ useFilters.ts         # Filter state
│  │  │  ├─ types/
│  │  │  │  └─ index.ts
│  │  │  └─ index.ts
│  │  │
│  │  ├─ checkout/
│  │  │  ├─ components/
│  │  │  │  ├─ CheckoutForm.tsx      # Checkout form
│  │  │  │  ├─ PaymentMethod.tsx     # Payment selection
│  │  │  │  ├─ OrderReview.tsx       # Order summary
│  │  │  │  └─ PaymentConfirm.tsx    # Payment confirmation
│  │  │  ├─ hooks/
│  │  │  │  ├─ useCheckout.ts        # Checkout logic
│  │  │  │  ├─ useCart.ts            # Cart state
│  │  │  │  └─ useCreateOrder.ts     # Create order
│  │  │  ├─ types/
│  │  │  │  └─ index.ts
│  │  │  └─ index.ts
│  │  │
│  │  ├─ dashboard/
│  │  │  ├─ components/
│  │  │  │  ├─ OrdersList.tsx
│  │  │  │  ├─ KeysList.tsx
│  │  │  │  ├─ Stats.tsx
│  │  │  │  └─ WelcomeBanner.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useOrders.ts
│  │  │  │  ├─ useOrder.ts
│  │  │  │  └─ useProfile.ts
│  │  │  ├─ types/
│  │  │  │  └─ index.ts
│  │  │  └─ index.ts
│  │  │
│  │  └─ admin/
│  │     ├─ components/
│  │     │  ├─ AdminTable.tsx
│  │     │  ├─ FilterBar.tsx
│  │     │  └─ DetailModal.tsx
│  │     ├─ hooks/
│  │     │  ├─ useAdminOrders.ts
│  │     │  ├─ useAdminPayments.ts
│  │     │  └─ useAdminWebhooks.ts
│  │     ├─ types/
│  │     │  └─ index.ts
│  │     └─ index.ts
│  │
│  ├─ lib/
│  │  ├─ sdk.ts                      # SDK client instance
│  │  ├─ api.ts                      # API helpers
│  │  ├─ hooks.ts                    # Common hooks
│  │  ├─ utils.ts                    # Utilities
│  │  └─ validators.ts               # Zod schemas
│  │
│  ├─ hooks/
│  │  ├─ useQuery.ts                 # TanStack Query wrapper
│  │  ├─ useMutation.ts              # Mutation wrapper
│  │  ├─ useToast.ts                 # Toast hook
│  │  ├─ useModal.ts                 # Modal hook
│  │  └─ useLocalStorage.ts          # Local storage hook
│  │
│  ├─ types/
│  │  ├─ index.ts                    # Type exports
│  │  ├─ auth.ts                     # Auth types
│  │  ├─ products.ts                 # Product types
│  │  ├─ orders.ts                   # Order types
│  │  └─ api.ts                      # API types
│  │
│  ├─ context/
│  │  ├─ AuthContext.tsx             # Auth provider
│  │  ├─ ToastContext.tsx            # Toast provider
│  │  └─ QueryProvider.tsx           # React Query provider
│  │
│  └─ config/
│     ├─ env.ts                      # Environment config
│     ├─ routes.ts                   # Route constants
│     └─ constants.ts                # App constants
│
├─ public/
│  ├─ images/
│  ├─ icons/
│  └─ manifest.json                  # PWA manifest
│
├─ .env.example                      # Environment template
├─ .env.local                        # Local env (ignored)
├─ package.json
├─ tsconfig.json
├─ next.config.mjs
└─ README.md
```

---

## Environment Setup

### .env.local

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_TIMEOUT=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_CRYPTO_PAYMENTS=true
NEXT_PUBLIC_ENABLE_ADMIN_PANEL=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=

# Crypto / Payment
NEXT_PUBLIC_BITCOIN_NETWORK=testnet
NEXT_PUBLIC_ETHEREUM_NETWORK=sepolia

# Captcha (Cloudflare Turnstile)
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_key_here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=admin@bitloot.local
```

### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // API proxying (optional)
  rewrites: async () => ({
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ],
  }),

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirect security
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

---

## SDK Integration

### SDK Client Setup (lib/sdk.ts)

```typescript
import { Configuration, OrdersApi, PaymentsApi, AuthApi, UsersApi } from '@bitloot/sdk';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
    // Add auth token dynamically via interceptor
  },
  credentials: 'include', // Include cookies
  middleware: [
    {
      pre: async (context) => {
        // Add auth token to requests
        const token = localStorage.getItem('accessToken');
        if (token) {
          context.init.headers = {
            ...context.init.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return context;
      },
    },
  ],
});

export const ordersApi = new OrdersApi(apiConfig);
export const paymentsApi = new PaymentsApi(apiConfig);
export const authApi = new AuthApi(apiConfig);
export const usersApi = new UsersApi(apiConfig);

// Export all for convenience
export { Configuration, OrdersApi, PaymentsApi, AuthApi, UsersApi };
```

### Using SDK Clients

```typescript
// In a hook or component
import { ordersApi } from '@/lib/sdk';

// Fetch orders
const response = await ordersApi.getOrders({
  limit: 10,
  offset: 0,
});

// Create order
const order = await ordersApi.createOrder({
  email: 'user@example.com',
  productId: 'prod_123',
});

// Handle errors
try {
  const data = await ordersApi.getOrder({ id: 'ord_123' });
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Refresh token
    } else if (error.status === 404) {
      // Not found
    }
  }
}
```

---

## Authentication Flow

### 1. Create Auth Context (src/context/AuthContext.tsx)

```typescript
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/lib/sdk';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Verify token is still valid
          // Fetch user profile
          const response = await authApi.getMe();
          setUser(response.user);
        }
      } catch {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string) => {
    const response = await authApi.requestOtp({ email });
    // Response indicates OTP sent
    return response;
  }, []);

  const verifyOTP = useCallback(async (email: string, code: string) => {
    const response = await authApi.verifyOtp({
      email,
      code,
    });

    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    // Store user
    setUser(response.user);

    // Setup auto-refresh
    scheduleTokenRefresh(response.expiresIn);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await authApi.refresh({ refreshToken });

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      scheduleTokenRefresh(response.expiresIn);
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifyOTP,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function scheduleTokenRefresh(expiresIn: number) {
  // Refresh 1 minute before expiry
  const timeout = (expiresIn - 60) * 1000;
  setTimeout(() => {
    // Refresh token
  }, timeout);
}
```

### 2. Create Login Page (app/(auth)/login/page.tsx)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';
import { LoginForm } from '@/features/auth/components';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email);
      // Navigate to OTP verification
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Sign In</h1>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
          />
        </label>

        {error && <p className="mt-2 text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
}
```

### 3. Create OTP Verification Page

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks';

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const { verifyOTP } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!email) throw new Error('Email missing');
      await verifyOTP(email, code);
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg"
      >
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Verify OTP</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter the 6-digit code sent to {email}
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
          maxLength={6}
          placeholder="000000"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-2xl tracking-widest"
        />

        {error && <p className="mt-2 text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify & Sign In'}
        </button>
      </form>
    </div>
  );
}
```

---

## Component Implementation

### Product Card Component

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-102"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-lg">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
          />

          {/* Badge */}
          {product.discount && (
            <div className="absolute top-3 right-3 bg-amber-400 text-white px-3 py-1 rounded text-sm font-semibold">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.title}
          </h3>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                ${product.price}
              </p>
              <p className="text-xs text-gray-500">
                {product.platform}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product.id);
              }}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### Product Grid Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { ordersApi } from '@/lib/sdk';

interface ProductGridProps {
  search?: string;
  category?: string;
  platform?: string;
  page?: number;
  limit?: number;
}

export function ProductGrid({
  search,
  category,
  platform,
  page = 1,
  limit = 20,
}: ProductGridProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { search, category, platform, page, limit }],
    queryFn: async () => {
      // Implement search with filters
      const response = await ordersApi.getProducts({
        q: search,
        category,
        platform,
        limit,
        offset: (page - 1) * limit,
      });
      return response;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data?.items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## API Integration Patterns

### Custom Hook for API Calls

```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/sdk';

export function useProducts(options?: {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      const response = await ordersApi.getProducts(options);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await ordersApi.getProduct({ id });
      return response;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      return await ordersApi.createOrder(data);
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      return data;
    },
  });
}
```

### Using in Components

```typescript
'use client';

import { useProducts } from '@/features/store/hooks';
import { ProductCard } from '@/features/store/components';

export function CatalogPage() {
  const { data, isLoading, error } = useProducts({ limit: 20 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="grid grid-cols-4 gap-6">
      {data?.items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## State Management

### Auth State (React Context)

```typescript
// Already implemented above in Authentication Flow
// Use: const { user, isAuthenticated, login, logout } = useAuth();
```

### Cart State (Zustand - Optional)

```typescript
// lib/store/cart.ts
import { create } from 'zustand';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  total: 0,
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
      total: state.total + item.price * item.quantity,
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  clear: () => set({ items: [], total: 0 }),
}));
```

---

## Page Routing

### Route Protection

```typescript
// components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;

  return isAuthenticated ? <>{children}</> : null;
}
```

### Admin Route Protection

```typescript
// components/AdminRoute.tsx
'use client';

import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/features/auth/hooks';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
```

### Wrap Pages with Protection

```typescript
// app/(dashboard)/page.tsx
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/components';

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

// app/(admin)/page.tsx
import { AdminRoute } from '@/components/common/AdminRoute';
import { AdminDashboard } from '@/features/admin/components';

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

```typescript
// features/auth/components/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('renders email input', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('submits form with email', async () => {
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText(/email/i);
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    const button = screen.getByRole('button', { name: /send/i });
    fireEvent.click(button);

    expect(handleSubmit).toHaveBeenCalledWith('test@example.com');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  // Navigate to product
  await page.goto('/product/elden-ring');

  // Add to cart
  await page.click('button:has-text("Buy")');

  // Verify cart
  expect(await page.locator('text=1 item').isVisible()).toBeTruthy();

  // Go to checkout
  await page.click('button:has-text("Checkout")');

  // Fill email
  await page.fill('input[type="email"]', 'test@example.com');

  // Submit
  await page.click('button:has-text("Continue to Payment")');

  // Verify payment page
  expect(page.url()).toContain('/checkout');
});
```

---

## Deployment

### Build & Test

```bash
# Build
npm run build

# Test
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_BASE_URL https://api.bitloot.com
```

### Deploy to Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## Summary

This guide provides:

✅ **Complete project structure** — Ready-to-implement layout
✅ **SDK integration** — Typed API clients
✅ **Authentication flow** — Full OTP login
✅ **Component examples** — Product cards, grid, etc.
✅ **API patterns** — Custom hooks for data fetching
✅ **State management** — Auth context + Zustand
✅ **Route protection** — Auth guards
✅ **Testing strategy** — Unit + E2E tests
✅ **Deployment** — Vercel + Docker

**Ready to build! 🚀**