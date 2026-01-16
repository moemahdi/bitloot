'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Gift, Package, ChevronRight, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Configuration } from '@bitloot/sdk';
import { BundleModal } from './BundleModal';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

// Bundle types - matching backend Product entity
interface BundleProductInfo {
  id: string;
  title: string;
  slug: string;
  price: string;
  currency?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  coverImage?: string;
  platform?: string;
}

interface BundleProduct {
  id: string;
  productId: string;
  displayOrder: number;
  isBonus: boolean;
  discountPercent: string;
  product?: BundleProductInfo;
}

interface BundleDeal {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  originalPrice: string;
  bundlePrice: string;
  savingsPercent: number;
  isActive: boolean;
  heroImage: string | null;
  category: string;
  products: BundleProduct[];
}

// Fetch active bundles
async function fetchActiveBundles(): Promise<BundleDeal[]> {
  const response = await fetch(`${apiConfig.basePath}/public/marketing/bundles`);
  if (!response.ok) {
    throw new Error('Failed to fetch bundles');
  }
  return response.json();
}

// Format price in Euro (BitLoot uses Euro only)
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `€${(num || 0).toFixed(2)}`;
}

// Bundle card component
function BundleCard({ bundle, onSelect }: { bundle: BundleDeal; onSelect: (bundle: BundleDeal) => void }) {
  const originalPrice = parseFloat(bundle.originalPrice) || 0;
  const bundlePrice = parseFloat(bundle.bundlePrice) || 0;
  const savings = originalPrice - bundlePrice;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <button 
        type="button"
        onClick={() => onSelect(bundle)}
        className="text-left w-full h-full"
      >
        <Card className="glass border-border-accent hover:border-pink-500/50 transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col">
            {/* Hero Image */}
            <div className="relative aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 overflow-hidden">
              {bundle.heroImage ? (
                <img
                  src={bundle.heroImage}
                  alt={bundle.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift className="h-16 w-16 text-pink-400/50" />
                </div>
              )}
              
              {/* Savings Badge */}
              <Badge className="absolute top-3 left-3 bg-pink-500 text-white font-bold gap-1 shadow-lg">
                <TrendingDown className="h-3 w-3" />
                Save {bundle.savingsPercent}%
              </Badge>

              {/* Category Badge */}
              <Badge 
                variant="secondary" 
                className="absolute top-3 right-3 bg-bg-primary/80 backdrop-blur-sm capitalize"
              >
                {bundle.category}
              </Badge>

              {/* Product Count Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 text-white">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {bundle.products.length} items included
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-text-primary group-hover:text-pink-400 transition-colors mb-2">
                {bundle.name}
              </h3>

              {bundle.description && (
                <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">
                  {bundle.description}
                </p>
              )}

              {/* Product Thumbnails */}
              {bundle.products.length > 0 && (
                <div className="flex -space-x-2 mb-4">
                  {bundle.products.slice(0, 4).map((product, index) => (
                    <div
                      key={product.id}
                      className="w-10 h-10 rounded-lg border-2 border-bg-primary bg-bg-tertiary overflow-hidden shadow-md"
                      style={{ zIndex: 4 - index }}
                    >
                      {(product.product?.coverImageUrl || product.product?.coverImage || product.product?.imageUrl) ? (
                        <img
                          src={product.product?.coverImageUrl ?? product.product?.coverImage ?? product.product?.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-text-muted" />
                        </div>
                      )}
                    </div>
                  ))}
                  {bundle.products.length > 4 && (
                    <div className="w-10 h-10 rounded-lg border-2 border-bg-primary bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted">
                      +{bundle.products.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing */}
              <div className="flex items-end justify-between pt-4 border-t border-border-subtle">
                <div>
                  <div className="text-sm text-text-muted line-through">
                    {formatPrice(bundle.originalPrice)}
                  </div>
                  <div className="text-2xl font-bold text-pink-400">
                    {formatPrice(bundle.bundlePrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">You save</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatPrice(savings.toString())}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>
    </motion.div>
  );
}

// Loading skeleton
function BundleSkeleton() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * BundleDealsSection - Showcase product bundles with savings
 * 
 * Features:
 * - Bundle cards with hero images
 * - Product thumbnails preview
 * - Modal popup with product details (no dedicated page)
 * - Individual product discounts
 * - Direct checkout flow (not cart)
 * - Responsive grid layout
 */
export function BundleDealsSection(): React.ReactElement | null {
  const [selectedBundle, setSelectedBundle] = useState<BundleDeal | null>(null);
  
  const { data: bundles, isLoading, error } = useQuery({
    queryKey: ['public', 'marketing', 'bundles'],
    queryFn: fetchActiveBundles,
    staleTime: 5 * 60_000, // 5 minutes
  });

  // Don't render if loading
  if (isLoading) {
    return <BundleSkeleton />;
  }

  // Don't render if no bundles or error
  if (error || !bundles || bundles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"
            >
              <Gift className="h-8 w-8 text-pink-400" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                Bundle Deals
                <Sparkles className="h-6 w-6 text-pink-400" />
              </h2>
              <p className="text-text-muted mt-1">
                Save big with our curated bundles
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="gap-2 border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
            asChild
          >
            <Link href="/bundles">
              View All Bundles
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.slice(0, 6).map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <BundleCard bundle={bundle} onSelect={setSelectedBundle} />
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        {bundles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="glass rounded-xl p-4 text-center border border-border-subtle">
              <div className="text-2xl font-bold text-pink-400">{bundles.length}</div>
              <div className="text-sm text-text-muted">Active Bundles</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-border-subtle">
              <div className="text-2xl font-bold text-green-400">
                Up to {Math.max(...bundles.map(b => b.savingsPercent))}%
              </div>
              <div className="text-sm text-text-muted">Max Savings</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-border-subtle">
              <div className="text-2xl font-bold text-purple-400">
                {bundles.reduce((acc, b) => acc + b.products.length, 0)}
              </div>
              <div className="text-sm text-text-muted">Products Bundled</div>
            </div>
            <div className="glass rounded-xl p-4 text-center border border-border-subtle">
              <div className="text-2xl font-bold text-cyan-400">Instant</div>
              <div className="text-sm text-text-muted">Key Delivery</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bundle Modal - shows product list when clicking on a bundle */}
      <BundleModal
        bundle={selectedBundle}
        isOpen={!!selectedBundle}
        onClose={() => setSelectedBundle(null)}
      />
    </section>
  );
}
