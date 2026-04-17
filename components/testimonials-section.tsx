"use client";

import { motion } from "framer-motion";

import { SectionHeading } from "@/components/section-heading";

const testimonials = [
  {
    name: "Kavya R.",
    quote: "The mango pickle tastes exactly like what my grandmother used to make. Rich, balanced, and beautifully packed.",
  },
  {
    name: "Rahul S.",
    quote: "The podi and roasted makhana combo has become a repeat order in our house. It feels boutique, but deeply comforting.",
  },
  {
    name: "Shreya P.",
    quote: "Finally found a homemade food brand that looks gift-ready and still tastes like it came from a family kitchen.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-shell py-24">
      <SectionHeading
        eyebrow="Loved By Customers"
        title="A modern storefront for the flavors people trust and return to."
        description="Real customers come back for the aroma, the balance of spice, and the feeling that each order was packed with care."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.blockquote
            key={item.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.12, duration: 0.5 }}
            className="flex h-full flex-col rounded-[2rem] border border-brand-red/10 bg-white/80 p-6 shadow-soft dark:bg-white/5"
          >
            <p className="flex-1 text-lg leading-8 text-brand-ink/80 dark:text-stone-200/90">
              “{item.quote}”
            </p>
            <footer className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand-ink/65 dark:text-stone-300/80">
              {item.name}
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
