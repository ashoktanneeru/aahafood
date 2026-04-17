import { Leaf, ShieldCheck, Soup } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";

const points = [
  {
    icon: Leaf,
    title: "No preservatives",
    description: "Ingredients are selected for freshness and balance, without artificial shortcuts.",
  },
  {
    icon: Soup,
    title: "Homemade in small batches",
    description: "We prioritize texture, aroma, and consistency the way a home kitchen would.",
  },
  {
    icon: ShieldCheck,
    title: "Freshly prepared",
    description: "Orders are packed thoughtfully so every delivery feels close to home.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-shell py-24">
      <div className="rounded-[2.5rem] border border-brand-red/10 bg-gradient-to-br from-brand-sand via-white to-brand-cream p-8 shadow-soft dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 sm:p-10">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="Premium presentation, deeply familiar taste."
          description="AahaFoods is built for customers who want the honesty of homemade food with the polish of a premium gifting brand."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-[2rem] border border-white/60 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red text-white">
                <point.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-heading text-2xl leading-tight text-brand-ink">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-brand-ink/70 dark:text-stone-300/80">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
