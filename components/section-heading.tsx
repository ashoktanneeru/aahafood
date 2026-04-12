type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-red/70">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-4xl text-brand-red sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-brand-ink/70 dark:text-stone-300/80">
        {description}
      </p>
    </div>
  );
}
