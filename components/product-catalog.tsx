"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { categories } from "@/data/products";
import { Product } from "@/lib/types";

export function ProductCatalog({
  products,
  initialCategory = "all",
}: {
  products: Product[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categorySlug === selectedCategory;
      const normalized = query.trim().toLowerCase();
      const matchesQuery =
        normalized.length === 0 ||
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-[2rem] p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-red/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pickles, podis, snacks..."
              className="h-12 w-full rounded-full border border-brand-red/10 bg-white pl-11 pr-4 text-sm outline-none ring-0 transition placeholder:text-brand-ink/40 focus:border-brand-yellow dark:bg-white/5"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-brand-red text-white"
                  : "border border-brand-red/10 bg-white text-brand-ink dark:bg-white/5"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category.slug
                    ? "bg-brand-red text-white"
                    : "border border-brand-red/10 bg-white text-brand-ink dark:bg-white/5"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-brand-red/20 p-10 text-center">
          <p className="font-heading text-3xl text-brand-ink">No products found</p>
          <p className="mt-3 text-brand-ink/70 dark:text-stone-300/80">
            Try a different search term or switch the category filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
