"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { LoaderCircle, MessageCircleMore } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { siteConfig } from "@/lib/site-config";
import { saveOrder } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

type DeliveryForm = {
  name: string;
  phone: string;
  address: string;
};

const initialState: DeliveryForm = {
  name: "",
  phone: "",
  address: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<DeliveryForm>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const orderSummary = useMemo(() => {
    return items
      .map((item) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
      .join("%0A");
  }, [items]);

  async function handleCheckout(mode: "whatsapp" | "razorpay") {
    if (items.length === 0) {
      setError("Your cart is empty. Add products before checkout.");
      return;
    }

    if (!form.name || !form.phone || !form.address) {
      setError("Please fill in your name, phone, and delivery address.");
      return;
    }

    setError(null);

    startTransition(async () => {
      await saveOrder({
        ...form,
        items,
        totalPrice: subtotal,
      });

      const message = [
        `Hello AahaFoods, I'd like to place an order.`,
        ``,
        `Name: ${form.name}`,
        `Phone: ${form.phone}`,
        `Address: ${form.address}`,
        ``,
        `Items:`,
        decodeURIComponent(orderSummary),
        ``,
        `Subtotal: ${formatCurrency(subtotal)}`,
      ].join("\n");

      if (mode === "whatsapp") {
        window.open(
          `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        const base = siteConfig.razorpayLink;
        const url = base.includes("?")
          ? `${base}&amount=${subtotal * 100}&notes=${encodeURIComponent(form.name)}`
          : `${base}?amount=${subtotal * 100}&notes=${encodeURIComponent(form.name)}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }

      clearCart();
      router.push("/");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Full name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-yellow dark:bg-white/5"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Phone number</label>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-yellow dark:bg-white/5"
              placeholder="+91"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Delivery address</label>
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="min-h-36 w-full rounded-2xl border border-brand-red/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-yellow dark:bg-white/5"
              placeholder="House number, street, area, city, pincode"
            />
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleCheckout("whatsapp")}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white transition hover:bg-brand-green/90"
          >
            {isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircleMore className="mr-2 h-4 w-4" />
            )}
            Order on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void handleCheckout("razorpay")}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red/90"
          >
            {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Pay with Razorpay Link
          </button>
        </div>
        <p className="mt-4 text-xs leading-6 text-brand-ink/55 dark:text-stone-400">
          Razorpay uses a hosted payment page. Replace the demo payment link in{" "}
          <code>NEXT_PUBLIC_RAZORPAY_LINK</code> with your live payment link before launch.
        </p>
      </div>

      <aside className="glass-panel rounded-[2rem] p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-red/70">Order Summary</p>
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-brand-red/20 p-6 text-center">
              <p className="text-sm text-brand-ink/70 dark:text-stone-300/80">
                Your cart is empty. Add products to continue.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-5 text-sm font-semibold text-white"
              >
                Browse products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-brand-red/10 bg-white/70 p-4 dark:bg-white/5"
              >
                <div>
                  <p className="font-medium text-brand-red">{item.name}</p>
                  <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                    Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-brand-green">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 border-t border-brand-red/10 pt-6">
          <div className="flex items-center justify-between text-lg font-semibold text-brand-red">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
