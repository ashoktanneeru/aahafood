import { ProductDetailSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <section className="section-shell py-24">
      <ProductDetailSkeleton />
    </section>
  );
}
