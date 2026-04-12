import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-red/10 py-10">
      <div className="section-shell flex flex-col gap-4 text-sm text-brand-ink/60 dark:text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-2xl text-brand-red">AahaFoods</p>
          <p className="mt-1">Homemade, premium, and rooted in authentic Indian flavors.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href={siteConfig.whatsappLink} target="_blank">
            WhatsApp
          </Link>
        </div>
      </div>
    </footer>
  );
}
