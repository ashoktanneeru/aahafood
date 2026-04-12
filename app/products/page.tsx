import { ProductCatalog } from "@/components/product-catalog";
import { products } from "@/data/products";

export const metadata = {
  title: "Products",
  description: "Browse premium homemade pickles, spices, snacks, whole spices, and fox nuts.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="section-shell py-24">
      <div className="mb-10 max-w-3xl">
        <span className="inline-flex rounded-full border border-brand-red/15 bg-brand-red/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
          Our Collection
        </span>
        <h1 className="mt-5 font-heading text-4xl text-brand-red sm:text-5xl">
          Crafted in small batches, packed with home-kitchen warmth.
        </h1>
        <p className="mt-4 text-base leading-7 text-brand-ink/70 dark:text-stone-300/80">
          Discover authentic flavors across pickles, spice powders, whole spices,
          snacks, and roasted fox nuts.
        </p>
      </div>
      <ProductCatalog products={products} initialCategory={params.category ?? "all"} />
    </section>
  );
}
