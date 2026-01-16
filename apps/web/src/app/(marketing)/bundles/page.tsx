'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Gift, Package, TrendingDown, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { Configuration } from '@bitloot/sdk';
import { BundleModal } from '@/components/marketing/BundleModal';

const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});

// Bundle types
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

// Fetch all bundles
async function fetchAllBundles(): Promise<BundleDeal[]> {
  const response = await fetch(`${apiConfig.basePath}/public/marketing/bundles?limit=50`);
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
function BundlesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
      ))}
    </div>
  );
}

/**
 * Bundles Page - Display all available bundles
 */
export default function BundlesPage(): React.ReactElement {
  const [selectedBundle, setSelectedBundle] = useState<BundleDeal | null>(null);
  
  const { data: bundles, isLoading, error } = useQuery({
    queryKey: ['public', 'marketing', 'bundles', 'all'],
    queryFn: fetchAllBundles,
    staleTime: 5 * 60_000, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary">
      {/* Hero Header */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(236,72,153,0.15),transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Back Link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="p-4 rounded-xl bg-pink-500/20 border border-pink-500/30"
            >
              <Gift className="h-10 w-10 text-pink-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary flex items-center gap-3">
                Bundle Deals
                <Sparkles className="h-8 w-8 text-pink-400" />
              </h1>
              <p className="text-lg text-text-muted mt-2">
                Save big with our curated product bundles
              </p>
            </div>
          </div>

          {/* Stats */}
          {bundles && bundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              <div className="glass rounded-xl p-4 text-center border border-border-subtle">
                <div className="text-2xl font-bold text-pink-400">{bundles.length}</div>
                <div className="text-sm text-text-muted">Available Bundles</div>
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
      </div>

      {/* Bundles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <BundlesSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-text-muted/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">Failed to load bundles</h3>
            <p className="text-text-muted">Please try again later</p>
          </div>
        ) : bundles && bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle, index) => (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BundleCard bundle={bundle} onSelect={setSelectedBundle} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gift className="h-16 w-16 text-text-muted/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No bundles available</h3>
            <p className="text-text-muted mb-6">Check back later for new bundle deals</p>
            <Button asChild>
              <Link href="/catalog">Browse Products</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Bundle Modal */}
      <BundleModal
        bundle={selectedBundle}
        isOpen={!!selectedBundle}
        onClose={() => setSelectedBundle(null)}
      />
    </div>
  );
}
