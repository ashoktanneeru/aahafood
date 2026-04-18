import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { getStoreCategories } from "@/lib/catalog";

export async function CategoriesSection() {
  const categories = await getStoreCategories();

  return (
    <section className="section-shell py-24">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow="Shop By Category"
          title="Traditional staples and modern snackable favorites."
          description="Explore the full range of pickles, spice powders, snacks, whole spices, and fox nuts arranged for easy gifting and repeat orders."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex h-full flex-col rounded-[2rem] border border-brand-red/10 bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-yellow/40 dark:bg-white/5"
            >
              <div
                className="mb-6 h-36 rounded-[1.5rem]"
                style={{ background: category.gradient }}
              />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red/60">
                0{index + 1}
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-2xl leading-tight text-brand-ink">
                    {category.label}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-brand-ink/70 dark:text-stone-300/80">
                    {category.description}
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-brand-red transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
