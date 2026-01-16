'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
    if (slug !== undefined && slug !== null && slug !== '') {
      router.push(`/product/${slug}`);
      onClose();
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
      <DialogContent className="glass border-pink-500/30 w-[95vw] max-w-2xl lg:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        {/* Hero Section */}
        <div className="relative">
          {bundle.heroImage !== null && bundle.heroImage !== undefined && bundle.heroImage !== '' ? (
            <div className="relative h-32 sm:h-40 overflow-hidden">
              <Image
                src={bundle.heroImage}
                alt={bundle.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
          )}
          
          {/* Savings Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-pink-500 text-white font-bold px-3 py-1 text-sm gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              {savingsPercent.toFixed(0)}% OFF
            </Badge>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-6 -mt-8 relative z-10">
          {/* Bundle Title */}
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
              {bundle.name}
            </DialogTitle>
            {bundle.description !== null && bundle.description !== undefined && bundle.description !== '' ? (
              <DialogDescription className="text-text-muted mt-1">
                {bundle.description}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {/* Products List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Package className="h-4 w-4" />
              <span>{bundle.products?.length ?? 0} products in this bundle</span>
            </div>

            <ScrollArea className="h-[250px] sm:h-[300px] pr-4">
              <div className="space-y-3">
                {/* Regular Products with individual discounts */}
                {regularProducts.map((bp, index) => {
                  const discountRaw = parseFloat(bp.discountPercent);
                  const discount = Number.isNaN(discountRaw) ? 0 : discountRaw;
                  const originalPrice = bp.product?.price ?? '0';
                  const discountedPrice = calcDiscountedPrice(originalPrice, bp.discountPercent);
                  const productSlug = bp.product?.slug;
                  
                  return (
                    <motion.div
                      key={bp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={(e) => handleProductClick(productSlug, e)}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-border-subtle transition-all ${
                        productSlug !== undefined && productSlug !== '' 
                          ? 'cursor-pointer hover:border-pink-500/50 hover:bg-bg-tertiary group' 
                          : ''
                      }`}
                    >
                      {/* Product Image */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-bg-tertiary flex-shrink-0 relative">
                        {(() => {
                          const imgSrc = bp.product?.coverImageUrl ?? bp.product?.imageUrl ?? bp.product?.coverImage;
                          return imgSrc !== undefined && imgSrc !== null && imgSrc !== '' ? (
                            <Image
                              src={imgSrc}
                              alt={bp.product?.title ?? ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-text-muted" />
                            </div>
                          );
                        })()}
                        {productSlug !== undefined && productSlug !== '' ? (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="h-4 w-4 text-white" />
                          </div>
                        ) : null}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm sm:text-base text-text-primary truncate group-hover:text-pink-400 transition-colors">
                          {bp.product?.title ?? 'Unknown Product'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {bp.product?.platform !== undefined && bp.product.platform !== '' ? (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {bp.product.platform}
                            </Badge>
                          ) : null}
                          {discount > 0 && (
                            <Badge variant="secondary" className="text-xs bg-pink-500/10 text-pink-400 gap-1 flex-shrink-0">
                              <Percent className="h-3 w-3" />
                              {discount.toFixed(0)}% OFF
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Price with individual discount - fixed width to prevent cutoff */}
                      <div className="text-right flex-shrink-0 min-w-[70px]">
                        {bp.product?.price !== undefined && bp.product.price !== '' ? (
                          <>
                            <p className="text-xs text-text-muted line-through whitespace-nowrap">
                              {formatPrice(originalPrice)}
                            </p>
                            <p className="font-semibold text-green-400 whitespace-nowrap">
                              {formatPrice(discountedPrice)}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Bonus Products (100% discount / FREE) */}
                {bonusProducts.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 pt-2">
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">Bonus Items</span>
                    </div>
                    {bonusProducts.map((bp, index) => (
                      <motion.div
                        key={bp.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (regularProducts.length + index) * 0.05 }}
                        onClick={(e) => handleProductClick(bp.product?.slug, e)}
                        className={`flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 transition-all ${
                          bp.product?.slug !== undefined && bp.product.slug !== '' 
                            ? 'cursor-pointer hover:bg-yellow-500/20 group' 
                            : ''
                        }`}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-bg-tertiary flex-shrink-0 relative">
                          {(() => {
                            const bonusImgSrc = bp.product?.coverImageUrl ?? bp.product?.imageUrl ?? bp.product?.coverImage;
                            return bonusImgSrc !== undefined && bonusImgSrc !== null && bonusImgSrc !== '' ? (
                              <Image
                                src={bonusImgSrc}
                                alt={bp.product?.title ?? ''}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gift className="h-6 w-6 text-yellow-400" />
                              </div>
                            );
                          })()}
                          {bp.product?.slug !== undefined && bp.product.slug !== '' ? (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium text-sm sm:text-base text-text-primary truncate group-hover:text-yellow-400 transition-colors">
                            {bp.product?.title ?? 'Bonus Product'}
                          </p>
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs mt-1">
                            100% OFF - FREE
                          </Badge>
                        </div>
                        <div className="text-right flex-shrink-0 min-w-[70px]">
                          <p className="text-xs text-text-muted line-through whitespace-nowrap">
                            {bp.product?.price !== undefined && bp.product.price !== '' ? formatPrice(bp.product.price) : null}
                          </p>
                          <p className="font-semibold text-yellow-400 whitespace-nowrap">FREE</p>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : null}

                {/* Empty State */}
                {sortedProducts.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Package className="h-10 w-10 mx-auto mb-3 text-text-muted/50" />
                    <p>No products in this bundle yet</p>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>

          {/* Pricing Summary */}
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-text-muted">Bundle Total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {formatPrice(totalDiscounted)}
                  </span>
                  <span className="text-lg text-text-muted line-through">
                    {formatPrice(totalOriginal)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-muted">You Save</p>
                <p className="text-xl font-bold text-pink-400">
                  {formatPrice(totalSavings)}
                </p>
              </div>
            </div>

            {/* Checkout Button - NOT add to cart */}
            <Button
              onClick={handleCheckout}
              disabled={sortedProducts.length === 0}
              className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all"
            >
              <CreditCard className="h-5 w-5" />
              Checkout Bundle - Save {savingsPercent.toFixed(0)}%
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BundleModal;
