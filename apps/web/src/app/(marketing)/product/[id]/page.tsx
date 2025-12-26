'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CatalogApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import type { ProductResponseDto } from '@bitloot/sdk';
import Image from 'next/image';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { 
  Bitcoin, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  Globe, 
  Tag, 
  Monitor,
  Star,
  ChevronLeft,
  Share2,
  Heart,
  Check,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AddToCartButton } from '@/features/product/components/AddToCartButton';

export default function ProductPage(): React.ReactElement {
  const params = useParams();
  const slug = params.id as string;

  // Initialize SDK client
  const catalogClient = new CatalogApi(apiConfig);

  const { data: product, isLoading, isError } = useQuery<ProductResponseDto>({
    queryKey: ['product', slug],
    queryFn: () => catalogClient.catalogControllerGetProduct({ slug }),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary">
              <Zap className="h-8 w-8 animate-pulse text-cyan-glow" fill="currentColor" />
            </div>
          </div>
          <p className="text-sm text-text-muted">Loading product...</p>
          <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
        </div>
      </div>
    );
  }

  if (isError || product === undefined) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <Package className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Product Not Found</h1>
          <p className="text-text-muted mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/catalog">
            <Button className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const priceInDollars = parseFloat(product?.price ?? '0');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-0 h-[600px] w-[800px] bg-radial-cyan opacity-20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] bg-radial-purple opacity-15 blur-3xl" />
      </div>

      {/* Breadcrumb */}
      <div className="relative z-10 container mx-auto px-4 pt-6">
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-text-muted"
        >
          <Link href="/catalog" className="hover:text-cyan-glow transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
          <span>/</span>
          <span className="text-text-primary truncate max-w-[200px]">{product.title}</span>
        </motion.nav>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
          
          {/* Left Column - Image */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-glow/50 to-purple-glow/50 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary">
                <Image
                  src={product.imageUrl ?? '/placeholder-product.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-3">
              <button className="flex-1 glass rounded-xl border border-border-subtle p-3 text-text-muted hover:text-pink-featured hover:border-pink-featured/50 transition-all flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="text-sm font-medium">Add to Wishlist</span>
              </button>
              <button className="glass rounded-xl border border-border-subtle p-3 text-text-muted hover:text-cyan-glow hover:border-cyan-glow/50 transition-all">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {product.platform != null && product.platform !== '' && (
                <Badge className="bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30 px-3 py-1">
                  <Monitor className="h-3 w-3 mr-1" />
                  {product.platform}
                </Badge>
              )}
              {product.region != null && product.region !== '' && (
                <Badge className="bg-purple-glow/10 text-purple-glow border-purple-glow/30 px-3 py-1">
                  <Globe className="h-3 w-3 mr-1" />
                  {product.region}
                </Badge>
              )}
              {product.category != null && product.category !== '' && (
                <Badge className="bg-pink-featured/10 text-pink-featured border-pink-featured/30 px-3 py-1">
                  <Tag className="h-3 w-3 mr-1" />
                  {product.category}
                </Badge>
              )}
              {product.ageRating != null && product.ageRating !== '' && (
                <Badge variant="outline" className="px-3 py-1">
                  {product.ageRating}
                </Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                {product.title}
              </h1>
              {product.subtitle != null && product.subtitle !== '' && (
                <p className="mt-2 text-lg text-text-secondary">{product.subtitle}</p>
              )}
            </div>

            {/* Price Card */}
            <Card className="glass border-cyan-glow/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 to-purple-glow/5" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-text-muted mb-1">Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gradient-primary">
                        €{priceInDollars.toFixed(2)}
                      </span>
                      <span className="text-sm text-text-muted">{product.currency ?? 'EUR'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                      <Check className="h-3 w-3" />
                      In Stock
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href={`/checkout/${product.id}`} className="w-full">
                    <Button size="lg" className="w-full gap-2 text-lg bg-gradient-to-r from-cyan-glow to-cyan-glow/80 hover:from-cyan-glow/90 hover:to-cyan-glow/70 text-bg-primary font-semibold shadow-glow-cyan">
                      <Bitcoin className="h-5 w-5" />
                      Buy Now with Crypto
                    </Button>
                  </Link>
                  <AddToCartButton
                    id={product.id ?? ''}
                    title={product.title ?? 'Product'}
                    price={priceInDollars}
                    image={product.imageUrl}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl border border-border-subtle p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Instant Delivery</p>
                  <p className="text-xs text-text-muted">Key delivered immediately</p>
                </div>
              </div>
              <div className="glass rounded-xl border border-border-subtle p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/30">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Secure Payment</p>
                  <p className="text-xs text-text-muted">300+ cryptocurrencies</p>
                </div>
              </div>
            </div>

            {/* Product Details Grid */}
            <Card className="glass border-border-subtle">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-cyan-glow" />
                  Product Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.drm != null && product.drm !== '' && (
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-4 w-4 text-text-muted mt-0.5" />
                      <div>
                        <p className="text-text-muted">DRM</p>
                        <p className="text-text-primary">{product.drm}</p>
                      </div>
                    </div>
                  )}
                  {product.platform != null && product.platform !== '' && (
                    <div className="flex items-start gap-3">
                      <Monitor className="h-4 w-4 text-text-muted mt-0.5" />
                      <div>
                        <p className="text-text-muted">Platform</p>
                        <p className="text-text-primary">{product.platform}</p>
                      </div>
                    </div>
                  )}
                  {product.region != null && product.region !== '' && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-text-muted mt-0.5" />
                      <div>
                        <p className="text-text-muted">Region</p>
                        <p className="text-text-primary">{product.region}</p>
                      </div>
                    </div>
                  )}
                  {product.ageRating != null && product.ageRating !== '' && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-4 w-4 text-text-muted mt-0.5" />
                      <div>
                        <p className="text-text-muted">Age Rating</p>
                        <p className="text-text-primary">{product.ageRating}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description != null && product.description !== '' && (
              <Card className="glass border-border-subtle">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-text-secondary whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
