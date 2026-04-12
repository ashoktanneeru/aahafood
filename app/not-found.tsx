import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell flex min-h-[70vh] items-center justify-center py-24">
      <div className="max-w-xl rounded-[2rem] border border-brand-red/10 bg-white/80 p-10 text-center shadow-soft backdrop-blur-xl dark:bg-white/5">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-red/70">404</p>
        <h1 className="mt-4 font-heading text-4xl text-brand-red">Page not found</h1>
        <p className="mt-4 text-brand-ink/70 dark:text-stone-300/80">
          The page you’re looking for has moved or does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
