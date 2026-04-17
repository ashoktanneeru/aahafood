import Link from "next/link";

export function HomeCta() {
  return (
    <section className="section-shell pb-24">
      <div className="overflow-hidden rounded-[2.5rem] bg-brand-green p-8 text-white shadow-float sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-yellow">
          Ready To Order
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="max-w-xl font-heading text-4xl leading-tight text-white sm:text-5xl">
              Bring home the taste of slow-crafted Indian comfort.
            </h2>
            <p className="mt-4 max-w-xl text-white/84">
              Shop online, save favorites, and place your order in minutes through
              WhatsApp or Razorpay.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
            >
              Explore all products
            </Link>
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Checkout now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
