"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isSoldOut = typeof product.inventoryCount === "number" && product.inventoryCount <= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-brand-red/10 bg-white/85 shadow-soft transition hover:-translate-y-1 dark:bg-white/5">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        {isSoldOut ? (
          <div className="absolute inset-0 bg-stone-950/38" />
        ) : null}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {isSoldOut ? (
            <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Sold out
            </span>
          ) : typeof product.inventoryCount === "number" && product.inventoryCount <= 5 ? (
            <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
              Only {product.inventoryCount} left
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red/60">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-3 min-h-[3.5rem] font-heading text-2xl leading-tight text-brand-ink">
            {product.name}
          </h3>
        </Link>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-brand-ink/70 dark:text-stone-300/80">
          {product.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-brand-red">
            {formatCurrency(product.price)}
          </span>
          <button
            type="button"
            onClick={() => addItem(product)}
            disabled={isSoldOut}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:bg-brand-ink/25 disabled:text-white/80"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            {isSoldOut ? "Sold out" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}
