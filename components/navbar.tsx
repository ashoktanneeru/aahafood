"use client";

import Link from "next/link";
import { Menu, MoonStar, ShoppingBag, SunMedium, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

export function Navbar() {
  const { totalItems } = useCart();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-red/10 bg-brand-cream/75 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/70">
      <div className="section-shell flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-lg font-bold text-white shadow-lg shadow-brand-red/20">
            A
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-heading text-xl font-semibold text-brand-red">
              AahaFoods
            </p>
            <p className="truncate pt-1 text-[11px] uppercase tracking-[0.28em] text-brand-ink/50 dark:text-stone-400">
              Homemade Luxury
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-brand-ink/80 transition hover:bg-white hover:text-brand-red dark:text-stone-200 dark:hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-red/10 bg-white/80 text-brand-red transition hover:scale-105 dark:border-white/10 dark:bg-white/5 dark:text-brand-yellow"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>
          <Link
            href="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-red text-white shadow-lg shadow-brand-red/20 transition hover:scale-105"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-semibold text-brand-red">
                {totalItems}
              </span>
            ) : null}
          </Link>
          <button
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-red/10 bg-white/80 text-brand-red lg:hidden dark:border-white/10 dark:bg-white/5"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-brand-red/10 bg-brand-cream/95 p-4 dark:border-white/10 dark:bg-stone-950/95 lg:hidden"
          >
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-medium text-brand-ink/80 transition hover:bg-white hover:text-brand-red",
                    "dark:text-stone-200 dark:hover:bg-white/10",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
