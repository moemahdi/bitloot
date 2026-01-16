'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  price: number;           // Original price
  quantity: number;
  image?: string;
  discountPercent?: number; // 0-100, for bundle discounts
  bundleId?: string;        // Track which bundle this came from
  platform?: string;        // Product platform (Steam, etc.)
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bitloot-cart';

export function CartProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored) as { items?: CartItem[]; promoCode?: string };
        setItems(parsed.items ?? []);
        setPromoCode(parsed.promoCode ?? '');
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
        JSON.stringify({ items, promoCode })
      );
    }
  }, [items, promoCode, isHydrated]);

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
  };

  // Buy Now: Clear cart and add single item for instant checkout
  const buyNow = (item: CartItem): void => {
    setItems([{ ...item, quantity: 1 }]);
    setPromoCode('');
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
