'use client';

import { useCart } from '@/context/CartContext';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Separator } from '@/design-system/primitives/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function CartPage(): React.ReactElement {
  const { items, removeItem, updateQuantity, total, itemCount, promoCode, setPromoCode } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="text-center">
          <CardContent className="py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to add items to your cart
            </p>
            <Button asChild>
              <Link href="/catalog">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = total;
  const tax = subtotal * 0.08; // 8% tax
  const estimatedTotal = subtotal + tax;

  const handleCheckout = (): void => {
    router.push('/checkout');
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPromoCode(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4 mb-8">
            <p className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
            </p>
            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                productId={item.productId}
                title={item.title}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
                onRemove={() => removeItem(item.productId)}
                onQuantityChange={(quantity) => updateQuantity(item.productId, quantity)}
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Promo Code */}
              <div>
                <label className="text-sm font-medium mb-2 block">Promo Code</label>
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  className="text-sm"
                />
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>€{estimatedTotal.toFixed(2)}</span>
              </div>

              {/* Payment Note */}
              <div className="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 p-3 rounded-md text-xs">
                <p className="font-semibold mb-1">Crypto Payment Available</p>
                <p>Pay with Bitcoin, Ethereum, or USDT</p>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <Link href="/catalog">Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
