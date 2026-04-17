import { CheckoutForm } from "@/components/checkout-form";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <section className="section-shell py-24">
      <div className="mb-10 max-w-3xl">
        <span className="inline-flex rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-green">
          Checkout
        </span>
        <h1 className="mt-5 max-w-2xl font-heading text-4xl leading-tight text-brand-ink sm:text-5xl">
          One final step before your homemade box is prepared.
        </h1>
        <p className="mt-4 text-base leading-7 text-brand-ink/70 dark:text-stone-300/80">
          Share your delivery details and place the order using WhatsApp or a
          Razorpay payment link. No account required.
        </p>
      </div>
      <CheckoutForm />
    </section>
  );
}
