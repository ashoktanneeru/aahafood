"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-brand-red/10 bg-white/85 shadow-soft transition hover:-translate-y-1 dark:bg-white/5">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
      </Link>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red/60">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="mt-3 font-heading text-2xl text-brand-red">{product.name}</h3>
        </Link>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-brand-ink/70 dark:text-stone-300/80">
          {product.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-lg font-semibold text-brand-green">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={() => addItem(product)}
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red/90"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
