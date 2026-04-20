"use client";

import { motion } from "framer-motion";

import { SectionHeading } from "@/components/section-heading";
import { Testimonial } from "@/lib/types";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
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
            initial={false}
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
