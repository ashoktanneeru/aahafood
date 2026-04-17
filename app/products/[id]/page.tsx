import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product-detail";
import { getStoreProductById, getStoreProducts } from "@/lib/catalog";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getStoreProductById(id);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [product, products] = await Promise.all([getStoreProductById(id), getStoreProducts()]);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id)
    .slice(0, 3);

  return (
    <section className="section-shell py-24">
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </section>
  );
}
