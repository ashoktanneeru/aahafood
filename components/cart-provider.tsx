"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: (options?: { silent?: boolean }) => void;
};

const STORAGE_KEY = "aahafoods-cart";
const CartContext = createContext<CartContextValue | null>(null);

function isLegacyCartEntry(value: unknown): value is { id: string; quantity: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "quantity" in value &&
      typeof (value as { id: unknown }).id === "string" &&
      typeof (value as { quantity: unknown }).quantity === "number",
  );
}

function isStoredCartItem(value: unknown): value is CartItem {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "price" in value &&
      "quantity" in value &&
      typeof (value as { id: unknown }).id === "string" &&
      typeof (value as { name: unknown }).name === "string" &&
      typeof (value as { price: unknown }).price === "number" &&
      typeof (value as { quantity: unknown }).quantity === "number",
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const toast = useToast();

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid cart payload");
      }

      if (parsed.every(isStoredCartItem)) {
        setItems(parsed);
        return;
      }

      if (parsed.every(isLegacyCartEntry)) {
        const hydrated = parsed
          .map(({ id, quantity }) => {
            const product = products.find((item) => item.id === id);
            return product ? { ...product, quantity } : null;
          })
          .filter(Boolean) as CartItem[];
        setItems(hydrated);
        return;
      }

      throw new Error("Unsupported cart format");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      totalItems,
      subtotal,
      addItem: (product, quantity = 1) => {
        if (typeof product.inventoryCount === "number" && product.inventoryCount <= 0) {
          toast.warning({
            title: `${product.name} is sold out`,
            description: "Pick another pantry favorite or check back soon.",
            key: `sold-out:${product.id}`,
          });
          return;
        }

        let addedQuantity = 0;
        let blockedByStock = false;

        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);

          const maxAddable =
            typeof product.inventoryCount === "number"
              ? Math.max(product.inventoryCount - (existing?.quantity ?? 0), 0)
              : quantity;

          addedQuantity =
            typeof product.inventoryCount === "number"
              ? Math.min(quantity, maxAddable)
              : quantity;

          blockedByStock = addedQuantity < quantity;

          if (addedQuantity <= 0) {
            return current;
          }

          if (existing) {
            return current.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + addedQuantity }
                : item,
            );
          }

          return [...current, { ...product, quantity: addedQuantity }];
        });

        if (addedQuantity > 0) {
          toast.success({
            title:
              addedQuantity > 1
                ? `${addedQuantity} ${product.name} added`
                : `${product.name} added to cart`,
            description: blockedByStock
              ? "We added the remaining available stock."
              : "Ready for checkout whenever you are.",
            key: `add:${product.id}:${addedQuantity}:${blockedByStock}`,
          });
        } else if (blockedByStock) {
          toast.warning({
            title: `No more ${product.name} available`,
            description: "You already have the available stock in your cart.",
            key: `stock-limit:${product.id}`,
          });
        }
      },
      removeItem: (id) => {
        let removedName = "Item";

        setItems((current) => {
          const existing = current.find((item) => item.id === id);

          if (existing) {
            removedName = existing.name;
          }

          return current.filter((item) => item.id !== id);
        });

        toast.info({
          title: `${removedName} removed`,
          description: "Your cart has been updated.",
          key: `remove:${id}`,
        });
      },
      updateQuantity: (id, quantity) => {
        let nextQuantity = quantity;
        let itemName = "Item";
        let removed = false;
        let hitLimit = false;

        setItems((current) =>
          current
            .map((item) => {
              if (item.id !== id) {
                return item;
              }

              itemName = item.name;
              const maxQuantity =
                typeof item.inventoryCount === "number" ? Math.max(item.inventoryCount, 0) : null;
              nextQuantity =
                maxQuantity === null ? quantity : Math.min(Math.max(quantity, 0), maxQuantity);
              removed = nextQuantity <= 0;
              hitLimit = maxQuantity !== null && quantity > maxQuantity;

              return {
                ...item,
                quantity: nextQuantity,
              };
            })
            .filter((item) => item.quantity > 0),
        );

        if (removed) {
          toast.info({
            title: `${itemName} removed`,
            description: "Your cart has been updated.",
            key: `remove-via-quantity:${id}`,
          });
          return;
        }

        if (hitLimit) {
          toast.warning({
            title: `Only ${nextQuantity} ${itemName} available`,
            description: "We adjusted the quantity to the available stock.",
            key: `quantity-limit:${id}:${nextQuantity}`,
          });
          return;
        }

        toast.info({
          title: `${itemName} quantity updated`,
          description: `Now ${nextQuantity} in your cart.`,
          key: `quantity-update:${id}:${nextQuantity}`,
        });
      },
      clearCart: (options) => {
        setItems([]);

        if (!options?.silent) {
          toast.info({
            title: "Cart cleared",
            description: "You can always add your favorites back in.",
            key: "clear-cart",
          });
        }
      },
    };
  }, [items, toast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
