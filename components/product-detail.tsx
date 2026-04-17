"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { products } from "@/data/products";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const gallery = product.images?.length ? product.images : [product.image];
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(gallery[0]);

  useEffect(() => {
    setSelectedImage(gallery[0]);
  }, [gallery, product.id]);

  const related = products
    .filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id)
    .slice(0, 3);

  return (
    <div className="space-y-16">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2.5rem] border border-brand-red/10 shadow-soft">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
          {gallery.length > 1 ? (
            <div className="grid grid-cols-2 gap-4 sm:max-w-md">
              {gallery.map((image, index) => {
                const isActive = image === selectedImage;

                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border transition ${
                      isActive
                        ? "border-brand-green shadow-soft ring-2 ring-brand-green/20"
                        : "border-brand-red/10 hover:border-brand-green/30"
                    }`}
                    aria-label={`View ${product.name} image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} preview ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-red/60">
            {product.category}
          </p>
          <h1 className="mt-4 max-w-xl font-heading text-4xl leading-tight text-brand-ink sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-5 text-base leading-8 text-brand-ink/75 dark:text-stone-300/85">
            {product.description}
          </p>
          <p className="mt-6 text-3xl font-semibold text-brand-red">
            {formatCurrency(product.price)}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex h-12 items-center rounded-full border border-brand-red/10 bg-white px-2 dark:bg-white/5">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-red"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((value) => value + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-red"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                for (let count = 0; count < quantity; count += 1) {
                  addItem(product);
                }
              }}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red/90"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add to cart
            </button>
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-full border border-brand-green/20 px-6 text-sm font-semibold text-brand-green transition hover:bg-brand-green hover:text-white"
            >
              Buy now
            </Link>
          </div>
          <div className="mt-8 rounded-[2rem] border border-brand-red/10 bg-white/70 p-5 dark:bg-white/5">
            <p className="text-sm leading-7 text-brand-ink/75 dark:text-stone-300/85">
              Best served with steamed rice, dosa, idli, curd rice, or as a quick
              flavor boost for everyday meals and festive gifting.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <div>
          <h2 className="font-heading text-3xl text-brand-ink">You may also like</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="flex h-full flex-col rounded-[2rem] border border-brand-red/10 bg-white/80 p-4 shadow-soft dark:bg-white/5"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <h3 className="mt-4 min-h-[3.5rem] font-heading text-2xl leading-tight text-brand-ink">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm text-brand-red">{formatCurrency(item.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
