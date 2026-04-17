import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-red/10 py-10">
      <div className="section-shell flex flex-col gap-4 text-sm text-brand-ink/60 dark:text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex rounded-xl bg-white/90 px-3 py-2 shadow-soft">
            <Image
              src="/brand/logo-full-color.png"
              alt="AahaFoods"
              width={796}
              height={241}
              className="h-10 w-auto"
            />
          </div>
          <p className="mt-3">Homemade, premium, and rooted in authentic Indian flavors.</p>
          <p className="mt-2 font-semibold text-brand-green">{siteConfig.phoneDisplay}</p>
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
