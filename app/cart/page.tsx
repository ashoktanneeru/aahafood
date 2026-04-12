import { CartPageClient } from "@/components/cart-page-client";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <section className="section-shell py-24">
      <CartPageClient />
    </section>
  );
}
