"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { CartLineItem } from "@/components/cart-line-item";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, subtotal, totalItems, clearCart } = useCart();

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl text-brand-red sm:text-5xl">Your Cart</h1>
          <p className="mt-3 text-brand-ink/70 dark:text-stone-300/80">
            Review your handmade picks before checkout.
          </p>
        </div>
        {items.length > 0 ? (
          <button
            onClick={clearCart}
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-red/20 px-5 text-sm font-medium text-brand-red transition hover:bg-brand-red hover:text-white"
          >
            Clear cart
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-10 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-red">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-heading text-3xl text-brand-red">Your cart is empty</h2>
          <p className="mx-auto mt-4 max-w-md text-brand-ink/70 dark:text-stone-300/80">
            Explore our small-batch pantry and add a few favorites.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red/90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
          </div>
          <aside className="glass-panel h-fit rounded-[2rem] p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-red/70">
              Order Summary
            </p>
            <div className="mt-6 space-y-3 text-sm text-brand-ink/80 dark:text-stone-200/80">
              <div className="flex items-center justify-between">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span>Calculated on confirmation</span>
              </div>
            </div>
            <div className="mt-6 border-t border-brand-red/10 pt-6">
              <div className="flex items-center justify-between font-semibold text-brand-red">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white transition hover:bg-brand-green/90"
              >
                Proceed to checkout
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
