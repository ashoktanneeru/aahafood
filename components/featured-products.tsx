import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getFeaturedProducts } from "@/lib/catalog";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="section-shell py-24">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Featured Products"
          title="A pantry curated for comfort, celebration, and everyday indulgence."
          description="Each jar and pouch is inspired by heirloom-style recipes and made to feel gift-worthy from the very first glance."
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
