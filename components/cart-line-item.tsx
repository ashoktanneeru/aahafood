"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { CartItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function CartLineItem({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-[2rem] p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] sm:w-32">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-red/60">
          {item.category}
        </p>
        <h2 className="mt-2 font-heading text-2xl text-brand-red">{item.name}</h2>
        <p className="mt-2 text-sm leading-6 text-brand-ink/70 dark:text-stone-300/80">
          {item.description}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:items-end">
        <span className="text-lg font-semibold text-brand-green">
          {formatCurrency(item.price * item.quantity)}
        </span>
        <div className="inline-flex h-11 items-center rounded-full border border-brand-red/10 bg-white px-2 dark:bg-white/5">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-red"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-red"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-red"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );
}
