'use client';

import { useCart } from '@/context/CartContext';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Separator } from '@/design-system/primitives/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap,
  Bitcoin,
  Wallet,
  ChevronLeft,
  Trash2
} from 'lucide-react';

export default function CartPage(): React.ReactElement {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount, promoCode, setPromoCode } = useCart();
  const router = useRouter();

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-neon/5 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-glow/5 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center bg-bg-secondary/80 backdrop-blur-xl border border-border-subtle shadow-card-lg">
              <CardContent className="py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-cyan-glow/20 blur-xl rounded-full animate-pulse" />
                  <ShoppingCart className="h-16 w-16 mx-auto text-text-muted relative z-10" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Your cart is empty</h2>
                <p className="text-text-muted mb-8 max-w-md mx-auto">
                  Looks like you haven&apos;t added anything yet. Explore our catalog and find your next digital adventure.
                </p>
                <Button 
                  asChild
                  className="bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-semibold"
                  size="lg"
                >
                  <Link href="/catalog">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Browse Catalog
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const subtotal = total;
  const estimatedTotal = subtotal;

  const handleCheckout = (): void => {
    router.push('/checkout');
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPromoCode(e.target.value);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-neon/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-glow/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 text-text-muted hover:text-cyan-glow transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-glow to-purple-neon">
                Shopping Cart
              </h1>
              <p className="text-text-muted mt-1">
                {itemCount} item{itemCount !== 1 ? 's' : ''} ready for checkout
              </p>
            </div>
            
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-text-muted hover:text-red-error hover:bg-red-error/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <CartItemRow
                    productId={item.productId}
                    title={item.title}
                    price={item.price}
                    quantity={item.quantity}
                    image={item.image}
                    onRemove={() => removeItem(item.productId)}
                    onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              {[
                { icon: Zap, text: 'Instant Delivery', color: 'text-cyan-glow' },
                { icon: Shield, text: 'Secure Payment', color: 'text-green-success' },
                { icon: Bitcoin, text: 'Crypto Accepted', color: 'text-orange-warning' },
              ].map((badge) => (
                <div 
                  key={badge.text}
                  className="flex items-center gap-2 p-3 rounded-xl bg-bg-secondary/50 border border-border-subtle"
                >
                  <badge.icon className={`h-5 w-5 ${badge.color}`} />
                  <span className="text-xs font-medium text-text-secondary">{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-4 bg-bg-secondary/80 backdrop-blur-xl border border-border-subtle shadow-card-lg">
              <CardHeader className="border-b border-border-subtle pb-4">
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-cyan-glow" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Promo Code */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={handlePromoCodeChange}
                      className="flex-1 bg-bg-tertiary border-border-subtle text-text-primary placeholder:text-text-muted focus:border-cyan-glow focus:ring-cyan-glow/20"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-border-subtle text-text-secondary hover:bg-bg-tertiary"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <Separator className="bg-border-subtle" />

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal ({itemCount} items)</span>
                    <span className="text-text-secondary">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Processing Fee</span>
                    <span className="text-green-success">Free</span>
                  </div>
                </div>

                <Separator className="bg-border-subtle" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-text-primary">Total</span>
                  <span className="text-2xl font-bold text-cyan-glow">€{estimatedTotal.toFixed(2)}</span>
                </div>

                {/* Crypto Payment Info */}
                <div className="p-4 rounded-xl bg-linear-to-r from-cyan-glow/5 to-purple-neon/5 border border-cyan-glow/20">
                  <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <Bitcoin className="h-4 w-4 text-orange-warning" />
                    Pay with Crypto
                  </p>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-warning" />BTC
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-neon" />ETH
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-success" />USDT
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />LTC
                    </span>
                  </div>
                </div>

                <Separator className="bg-border-subtle" />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-12 bg-cyan-glow text-bg-primary hover:shadow-glow-cyan font-bold text-base"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-xs text-text-muted text-center">
                    Secure checkout • Instant key delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
