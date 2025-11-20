'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
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

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
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
