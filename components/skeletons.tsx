import { cn } from "@/lib/utils";

export function ProductGridSkeleton({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className={cn("hidden", hidden ? "hidden" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3")}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[2rem] border border-brand-red/10 bg-white/80 p-5"
        >
          <div className="aspect-[4/3] animate-pulse rounded-[1.5rem] bg-brand-yellow/20" />
          <div className="mt-5 h-3 w-24 animate-pulse rounded-full bg-brand-red/10" />
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded-full bg-brand-red/10" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-brand-red/10" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="aspect-[5/4] animate-pulse rounded-[2.5rem] bg-brand-yellow/20" />
      <div className="space-y-5">
        <div className="h-4 w-28 animate-pulse rounded-full bg-brand-red/10" />
        <div className="h-12 w-3/4 animate-pulse rounded-full bg-brand-red/10" />
        <div className="h-24 w-full animate-pulse rounded-[1.5rem] bg-brand-red/10" />
      </div>
    </div>
  );
}
