import Link from "next/link";

type CheckoutStatusCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "success" | "failure";
  details?: Array<{ label: string; value: string }>;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export function CheckoutStatusCard({
  eyebrow,
  title,
  description,
  tone,
  details = [],
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CheckoutStatusCardProps) {
  const toneClasses =
    tone === "success"
      ? {
          pill: "border-brand-green/20 bg-brand-green/10 text-brand-green",
          panel: "border-brand-green/15",
          value: "text-brand-green",
        }
      : {
          pill: "border-red-500/20 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200",
          panel: "border-red-500/20",
          value: "text-red-600 dark:text-red-200",
        };

  return (
    <section className="section-shell py-24">
      <div
        className={`glass-panel mx-auto max-w-3xl rounded-[2rem] border p-8 shadow-soft sm:p-10 ${toneClasses.panel}`}
      >
        <span
          className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${toneClasses.pill}`}
        >
          {eyebrow}
        </span>
        <h1 className="mt-5 font-heading text-4xl leading-tight text-brand-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-brand-ink/70 dark:text-stone-300/80">
          {description}
        </p>

        {details.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="rounded-[1.5rem] border border-brand-red/10 bg-white/70 p-4 dark:bg-white/5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-ink/55 dark:text-stone-400">
                  {detail.label}
                </p>
                <p className={`mt-3 text-lg font-semibold ${toneClasses.value}`}>{detail.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red/90"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex h-12 items-center justify-center rounded-full border border-brand-red/10 px-6 text-sm font-semibold text-brand-red transition hover:bg-brand-red hover:text-white"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
