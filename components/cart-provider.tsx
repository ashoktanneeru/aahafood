"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { products } from "@/data/products";
import { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "aahafoods-cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed: Array<{ id: string; quantity: number }> = JSON.parse(saved);
      const hydrated = parsed
        .map(({ id, quantity }) => {
          const product = products.find((item) => item.id === id);
          return product ? { ...product, quantity } : null;
        })
        .filter(Boolean) as CartItem[];
      setItems(hydrated);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const serialized = items.map(({ id, quantity }) => ({ id, quantity }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      totalItems,
      subtotal,
      addItem: (product) => {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);
          if (existing) {
            return current.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            );
          }

          return [...current, { ...product, quantity: 1 }];
        });
      },
      removeItem: (id) => {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      updateQuantity: (id, quantity) => {
        setItems((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      clearCart: () => {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
