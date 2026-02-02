'use client';

import { ShoppingCart, X, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/design-system/primitives/button';
import { ScrollArea } from '@/design-system/primitives/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/design-system/primitives/popover';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/context/CartContext';
import { useState } from 'react';

interface CartDropdownItemProps {
  item: CartItem;
  onRemove: () => void;
}

function CartDropdownItem({ item, onRemove }: CartDropdownItemProps): React.ReactElement {
  const hasDiscount = (item.discountPercent ?? 0) > 0;
  const discountedPrice = hasDiscount 
    ? item.price * (1 - (item.discountPercent ?? 0) / 100) 
    : item.price;
  const itemTotal = discountedPrice * item.quantity;

  return (
    <div className="group flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-bg-tertiary/50 transition-colors">
      {/* Product Image */}
      <div className="relative shrink-0 w-12 h-12 bg-bg-tertiary rounded overflow-hidden border border-border-subtle/50">
        {item.image !== undefined && item.image.length > 0 ? (
          <Image
            src={item.image}
            alt={item.title}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <Package className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Product Info & Price */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
              {item.title}
            </h4>
            {/* Platform/Category & Quantity Row */}
            <div className="flex items-center gap-2 mt-1">
              {item.platform !== undefined && item.platform !== '' ? (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 capitalize">
                  {item.platform}
                </span>
              ) : item.category !== undefined && item.category !== '' ? (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-neon/10 text-purple-neon border border-purple-neon/30 capitalize">
                  {item.category}
                </span>
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-bg-tertiary text-text-muted border border-border-subtle/50">
                  Digital Key
                </span>
              )}
              {item.quantity > 1 && (
                <span className="text-[11px] text-text-muted">×{item.quantity}</span>
              )}
            </div>
          </div>
          {/* Remove Button - always visible on mobile, hover on desktop */}
          <button
            className="shrink-0 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all rounded hover:bg-red-400/10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remove {item.title}</span>
          </button>
        </div>
        {/* Price Row */}
        <div className="flex items-center justify-end mt-1.5">
          {hasDiscount ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted line-through">€{(item.price * item.quantity).toFixed(2)}</span>
              <span className="text-sm font-semibold text-green-success">€{itemTotal.toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-text-primary">€{itemTotal.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CartDropdown(): React.ReactElement {
  const { items, removeItem, itemCount, finalTotal, savings, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-text-muted hover:text-cyan-glow hover:bg-cyan-glow/10 hover:shadow-glow-cyan-sm transition-all duration-200"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-purple-neon text-white shadow-glow-purple-sm animate-scale-in">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
          <span className="sr-only">Cart{itemCount > 0 ? ` (${itemCount} items)` : ''}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        sideOffset={8}
        alignOffset={-8}
        className="w-[340px] p-0 bg-bg-secondary/95 backdrop-blur-xl border-border-subtle shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle/50 bg-bg-tertiary/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-cyan-glow" />
            <span className="text-sm font-medium text-text-primary">Cart</span>
            {itemCount > 0 && (
              <span className="text-xs text-text-muted">({itemCount})</span>
            )}
          </div>
          {items.length > 1 && (
            <button
              className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
              onClick={() => clearCart()}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <ShoppingCart className="h-8 w-8 text-text-muted/50 mx-auto mb-2" />
            <p className="text-sm text-text-muted mb-3">Your cart is empty</p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/catalog">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {items.length <= 3 ? (
              <div className="p-1.5 space-y-0.5">
                {items.map((item) => (
                  <CartDropdownItem
                    key={item.productId}
                    item={item}
                    onRemove={() => removeItem(item.productId)}
                  />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="p-1.5 space-y-0.5">
                  {items.map((item) => (
                    <CartDropdownItem
                      key={item.productId}
                      item={item}
                      onRemove={() => removeItem(item.productId)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            <div className="border-t border-border-subtle/50 p-3 space-y-2.5 bg-bg-tertiary/20">
              {/* Savings & Total Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-text-muted">Subtotal</span>
                  {savings > 0 && (
                    <span className="text-[10px] text-green-success font-medium">-€{savings.toFixed(2)} saved</span>
                  )}
                </div>
                <span className="text-base font-bold text-text-primary">€{finalTotal.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 h-8 text-xs bg-cyan-glow text-bg-primary hover:bg-cyan-300 font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/checkout" className="flex items-center justify-center gap-1">
                    Checkout
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
