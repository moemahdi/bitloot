'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { PromosApi } from '@bitloot/sdk';
import { getApiConfig } from '@/lib/api-config';

export interface CartItem {
  productId: string;
  title: string;
  price: number;           // Original price
  quantity: number;
  image?: string;
  discountPercent?: number; // 0-100, for bundle discounts
  bundleId?: string;        // Track which bundle this came from
  platform?: string;        // Product platform (Steam, etc.)
  category?: string;        // Product category for promo scoping
}

export interface AppliedPromo {
  code: string;
  promoCodeId: string;
  discountAmount: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  buyNow: (item: CartItem) => void; // Clear cart + add single item for instant checkout
  addBundleItems: (bundleId: string, items: CartItem[]) => void; // Clear cart + add bundle items
  total: number;           // Total after discounts
  originalTotal: number;   // Total before discounts
  savings: number;         // Amount saved from discounts
  itemCount: number;
  hasBundleItems: boolean; // True if cart contains bundle items
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedPromo: AppliedPromo | null;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  finalTotal: number;      // Total after promo discount
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bitloot-cart';

export function CartProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored) as { items?: CartItem[]; promoCode?: string; appliedPromo?: AppliedPromo | null };
        setItems(parsed.items ?? []);
        setPromoCode(parsed.promoCode ?? '');
        setAppliedPromo(parsed.appliedPromo ?? null);
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items, promoCode, appliedPromo })
      );
    }
  }, [items, promoCode, appliedPromo, isHydrated]);

  // Track previous items for change detection
  const prevItemsRef = useRef<CartItem[]>([]);
  const isFirstRender = useRef(true);

  // Revalidate promo code when cart items change
  useEffect(() => {
    // Skip on first render and hydration
    if (!isHydrated || isFirstRender.current) {
      isFirstRender.current = false;
      prevItemsRef.current = items;
      return;
    }

    // Skip if no promo applied
    if (appliedPromo === null) {
      prevItemsRef.current = items;
      return;
    }

    // Check if items actually changed (not just reference)
    const itemsChanged = JSON.stringify(items) !== JSON.stringify(prevItemsRef.current);
    if (!itemsChanged) {
      return;
    }
    prevItemsRef.current = items;

    // If cart is empty, clear promo
    if (items.length === 0) {
      setAppliedPromo(null);
      setPromoCode('');
      return;
    }

    // Calculate new cart total
    const newTotal = items.reduce((sum, item) => {
      const discount = item.discountPercent ?? 0;
      const discountedPrice = item.price * (1 - discount / 100);
      return sum + discountedPrice * item.quantity;
    }, 0);

    // Revalidate promo with updated cart
    const revalidatePromo = async (): Promise<void> => {
      try {
        const api = new PromosApi(getApiConfig());
        const result = await api.promosControllerValidate({
          validatePromoDto: {
            code: appliedPromo.code,
            orderTotal: newTotal.toFixed(2),
            productIds: items.map((i) => i.productId),
            categoryIds: items.map((i) => i.category).filter((c): c is string => c !== undefined),
          },
        });

        if (result.valid !== true) {
          // Promo is no longer valid for this cart
          setAppliedPromo(null);
          setPromoCode('');
          const reason = result.message ?? 'Promo code is no longer valid for your cart';
          toast.error(reason);
        } else {
          // Update discount amount if it changed (e.g., percent discount on new total)
          setAppliedPromo({
            ...appliedPromo,
            discountAmount: result.discountAmount ?? appliedPromo.discountAmount,
          });
        }
      } catch (error) {
        console.error('Failed to revalidate promo:', error);
        // Don't clear promo on network error - server will validate at checkout
      }
    };

    void revalidatePromo();
  }, [items, appliedPromo, isHydrated]);

  const addItem = (newItem: CartItem): void => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.productId === newItem.productId);
      if (existing !== undefined) {
        return prevItems.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prevItems, newItem];
    });
  };

  const removeItem = (productId: string): void => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = (): void => {
    setItems([]);
    setPromoCode('');
    setAppliedPromo(null);
  };

  // Buy Now: Clear cart and add single item for instant checkout
  const buyNow = (item: CartItem): void => {
    setItems([{ ...item, quantity: 1 }]);
    setPromoCode('');
    setAppliedPromo(null);
  };

  // Add Bundle Items: Clear cart and add all bundle items at once
  const addBundleItems = (bundleId: string, bundleItems: CartItem[]): void => {
    const itemsWithBundle = bundleItems.map(item => ({
      ...item,
      bundleId,
      quantity: 1,
    }));
    setItems(itemsWithBundle);
    setPromoCode('');
    setAppliedPromo(null);
  };

  // Calculate totals with discount support
  const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const discount = item.discountPercent ?? 0;
    const discountedPrice = item.price * (1 - discount / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);
  const savings = originalTotal - total;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const hasBundleItems = items.some(item => item.bundleId !== undefined);
  
  // Calculate final total after promo discount
  const promoDiscount = appliedPromo !== null ? parseFloat(appliedPromo.discountAmount) : 0;
  const finalTotal = Math.max(0, total - promoDiscount);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    buyNow,
    addBundleItems,
    total,
    originalTotal,
    savings,
    itemCount,
    hasBundleItems,
    promoCode,
    setPromoCode,
    appliedPromo,
    setAppliedPromo,
    finalTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
