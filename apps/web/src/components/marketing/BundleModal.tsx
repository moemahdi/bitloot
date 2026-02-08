'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  Gift,
  Package,
  CreditCard,
  TrendingDown,
  X,
  Sparkles,
  Percent,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

// Types matching the backend
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

interface BundleModalProps {
  bundle: BundleDeal | null;
  isOpen: boolean;
  onClose: () => void;
}

// Format price in Euro (BitLoot uses Euro only)
function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `€${(Number.isNaN(num) ? 0 : num ?? 0).toFixed(2)}`;
}

// Calculate discounted price based on individual product discount
function calcDiscountedPrice(price: string, discountPercent: string): number {
  const pRaw = parseFloat(price);
  const dRaw = parseFloat(discountPercent);
  const p = Number.isNaN(pRaw) ? 0 : pRaw;
  const d = Number.isNaN(dRaw) ? 0 : dRaw;
  return p * (1 - d / 100);
}

/**
 * BundleModal - Modal popup showing bundle products with individual discounted prices
 * Adds bundle items to cart and navigates to checkout
 */
export function BundleModal({ bundle, isOpen, onClose }: BundleModalProps): React.ReactElement | null {
  const router = useRouter();
  const { addBundleItems } = useCart();

  if (bundle === null || bundle === undefined) return null;

  const handleProductClick = (slug: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (slug !== undefined && slug !== null && slug !== '') {
      window.open(`/product/${slug}`, '_blank');
    }
  };

  const handleCheckout = () => {
    // Build cart items from bundle products
    const cartItems = bundle.products.map((bp) => ({
      productId: bp.productId,
      title: bp.product?.title ?? 'Unknown Product',
      price: parseFloat(bp.product?.price ?? '0'),
      quantity: 1,
      image: bp.product?.coverImageUrl ?? bp.product?.coverImage ?? bp.product?.imageUrl,
      discountPercent: parseFloat(bp.discountPercent ?? '0'),
      bundleId: bundle.id,
      platform: bp.product?.platform,
    }));

    // Add all bundle items to cart (clears existing items)
    addBundleItems(bundle.id, cartItems);
    
    toast.success(`${bundle.name} added to cart!`);
    
    // Navigate to checkout
    router.push('/checkout');
    onClose();
  };

  const sortedProducts = [...(bundle.products ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const regularProducts = sortedProducts.filter((p) => !p.isBonus);
  const bonusProducts = sortedProducts.filter((p) => p.isBonus);

  // Calculate totals from individual discounts
  let totalOriginal = 0;
  let totalDiscounted = 0;
  for (const bp of sortedProducts) {
    if (bp.product !== null && bp.product !== undefined) {
      const priceRaw = parseFloat(bp.product.price);
      const price = Number.isNaN(priceRaw) ? 0 : priceRaw;
      totalOriginal += price;
      totalDiscounted += calcDiscountedPrice(bp.product.price, bp.discountPercent);
    }
  }
  const totalSavings = totalOriginal - totalDiscounted;
  const savingsPercent = totalOriginal > 0 ? (totalSavings / totalOriginal) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass border-pink-500/30 w-[calc(100vw-16px)] sm:w-[95vw] max-w-2xl lg:max-w-3xl max-h-[85vh] sm:max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <LazyMotion features={domAnimation}>
        {/* Hero Section */}
        <div className="relative shrink-0">
          {bundle.heroImage !== null && bundle.heroImage !== undefined && bundle.heroImage !== '' ? (
            <div className="relative h-24 sm:h-32 md:h-40 overflow-hidden">
              <Image
                src={bundle.heroImage}
                alt={bundle.name}
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
          )}
          
          {/* Savings Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Badge className="bg-pink-500 text-white font-bold px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm gap-1">
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {savingsPercent.toFixed(0)}% OFF
            </Badge>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 left-2 sm:top-3 sm:left-3 p-1 sm:p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </button>
        </div>

        <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 -mt-6 sm:-mt-8 relative z-10 flex-1 overflow-hidden flex flex-col">
          {/* Bundle Title */}
          <DialogHeader className="text-left mb-2 sm:mb-4 shrink-0">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-pink-400 shrink-0" />
              <span className="truncate">{bundle.name}</span>
            </DialogTitle>
            {bundle.description !== null && bundle.description !== undefined && bundle.description !== '' ? (
              <DialogDescription className="text-text-muted mt-1 text-xs sm:text-sm">
                {bundle.description}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {/* Products List */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2 text-text-muted text-xs sm:text-sm mb-2 sm:mb-3 shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{bundle.products?.length ?? 0} products in this bundle</span>
            </div>

            <ScrollArea className="flex-1 pr-1 sm:pr-2">
              <div className="space-y-2 sm:space-y-3 pb-2">
                {/* Regular Products with individual discounts */}
                {regularProducts.map((bp, index) => {
                  const discountRaw = parseFloat(bp.discountPercent);
                  const discount = Number.isNaN(discountRaw) ? 0 : discountRaw;
                  const originalPrice = bp.product?.price ?? '0';
                  const discountedPrice = calcDiscountedPrice(originalPrice, bp.discountPercent);
                  const productSlug = bp.product?.slug;
                  
                  return (
                    <m.div
                      key={bp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={(e) => handleProductClick(productSlug, e)}
                      className={`p-2 rounded-lg bg-bg-secondary border border-border-subtle transition-all ${
                        productSlug !== undefined && productSlug !== '' 
                          ? 'cursor-pointer hover:border-pink-500/50 hover:bg-bg-tertiary group' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Product Image */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-bg-tertiary shrink-0 relative">
                          {(() => {
                            const imgSrc = bp.product?.coverImageUrl ?? bp.product?.imageUrl ?? bp.product?.coverImage;
                            return imgSrc !== undefined && imgSrc !== null && imgSrc !== '' ? (
                              <Image
                                src={imgSrc}
                                alt={bp.product?.title ?? ''}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted" />
                              </div>
                            );
                          })()}
                          {productSlug !== undefined && productSlug !== '' ? (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ExternalLink className="h-3 w-3 text-white" />
                            </div>
                          ) : null}
                        </div>

                        {/* Product Info + Price */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleProductClick(productSlug, e)}
                              className={`font-medium text-xs sm:text-sm text-text-primary text-left transition-colors leading-tight ${
                                productSlug !== undefined && productSlug !== '' 
                                  ? 'hover:text-pink-400 hover:underline cursor-pointer' 
                                  : ''
                              }`}
                            >
                              {bp.product?.title ?? 'Unknown Product'}
                            </button>
                            {/* Price */}
                            <div className="text-right shrink-0">
                              {bp.product?.price !== undefined && bp.product.price !== '' ? (
                                <>
                                  <p className="text-[10px] text-text-muted line-through">
                                    {formatPrice(originalPrice)}
                                  </p>
                                  <p className="font-semibold text-xs text-green-400">
                                    {formatPrice(discountedPrice)}
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {bp.product?.platform !== undefined && bp.product.platform !== '' ? (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {bp.product.platform}
                              </Badge>
                            ) : null}
                            {discount > 0 && (
                              <Badge variant="secondary" className="text-[10px] bg-pink-500/10 text-pink-400 gap-0.5 px-1 py-0">
                                <Percent className="h-2.5 w-2.5" />
                                {discount.toFixed(0)}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </m.div>
                  );
                })}

                {/* Bonus Products (100% discount / FREE) */}
                {bonusProducts.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 pt-2">
                      <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">Bonus Items</span>
                    </div>
                    {bonusProducts.map((bp, index) => (
                      <m.div
                        key={bp.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (regularProducts.length + index) * 0.05 }}
                        onClick={(e) => handleProductClick(bp.product?.slug, e)}
                        className={`p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 transition-all ${
                          bp.product?.slug !== undefined && bp.product.slug !== '' 
                            ? 'cursor-pointer hover:bg-yellow-500/20 group' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-bg-tertiary shrink-0 relative">
                            {(() => {
                              const bonusImgSrc = bp.product?.coverImageUrl ?? bp.product?.imageUrl ?? bp.product?.coverImage;
                              return bonusImgSrc !== undefined && bonusImgSrc !== null && bonusImgSrc !== '' ? (
                                <Image
                                  src={bonusImgSrc}
                                  alt={bp.product?.title ?? ''}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                                </div>
                              );
                            })()}
                            {bp.product?.slug !== undefined && bp.product.slug !== '' ? (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="h-3 w-3 text-white" />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleProductClick(bp.product?.slug, e)}
                                className={`font-medium text-xs sm:text-sm text-text-primary text-left transition-colors leading-tight ${
                                  bp.product?.slug !== undefined && bp.product.slug !== '' 
                                    ? 'hover:text-yellow-400 hover:underline cursor-pointer' 
                                    : ''
                                }`}
                              >
                                {bp.product?.title ?? 'Bonus Product'}
                              </button>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] text-text-muted line-through">
                                  {bp.product?.price !== undefined && bp.product.price !== '' ? formatPrice(bp.product.price) : null}
                                </p>
                                <p className="font-semibold text-xs text-yellow-400">FREE</p>
                              </div>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] mt-1 px-1 py-0">
                              100% OFF
                            </Badge>
                          </div>
                        </div>
                      </m.div>
                    ))}
                  </>
                ) : null}

                {/* Empty State */}
                {sortedProducts.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-text-muted">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-text-muted/50" />
                    <p className="text-sm">No products in this bundle yet</p>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>

          {/* Pricing Summary */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border-subtle shrink-0">
            <div className="flex items-end justify-between gap-2 mb-2 sm:mb-3">
              <div>
                <p className="text-[10px] sm:text-xs text-text-muted">Bundle Total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {formatPrice(totalDiscounted)}
                  </span>
                  <span className="text-xs sm:text-sm text-text-muted line-through">
                    {formatPrice(totalOriginal)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-text-muted">You Save</p>
                <p className="text-base sm:text-lg font-bold text-pink-400">
                  {formatPrice(totalSavings)}
                </p>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={sortedProducts.length === 0}
              className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm font-semibold gap-1.5 sm:gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all"
            >
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Checkout - Save {savingsPercent.toFixed(0)}%
            </Button>
          </div>
        </div>
        </LazyMotion>
      </DialogContent>
    </Dialog>
  );
}

export default BundleModal;
