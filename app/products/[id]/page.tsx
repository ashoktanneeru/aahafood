import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product-detail";
import { products } from "@/data/products";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);

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
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <section className="section-shell py-24">
      <ProductDetail product={product} />
    </section>
  );
}
