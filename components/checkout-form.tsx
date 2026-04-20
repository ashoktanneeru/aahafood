"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, MessageCircleMore } from "lucide-react";

import {
  createRazorpayOrder,
  createWhatsAppOrder,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "@/lib/checkout-client";
import type { CheckoutItemInput } from "@/lib/checkout";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/hooks/use-toast";
import {
  getFirstCustomerError,
  type CustomerField,
  type CustomerFieldErrors,
  validateCustomerInput,
} from "@/lib/customer-validation";
import { siteConfig } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";

type DeliveryForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const initialState: DeliveryForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

const initialTouchedState: Record<CustomerField, boolean> = {
  name: false,
  phone: false,
  email: false,
  address: false,
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const toast = useToast();
  const [form, setForm] = useState<DeliveryForm>(initialState);
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [touched, setTouched] = useState<Record<CustomerField, boolean>>(initialTouchedState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const soldOutItems = items.filter(
    (item) => typeof item.inventoryCount === "number" && item.inventoryCount <= 0,
  );
  const checkoutDisabled = isProcessing || soldOutItems.length > 0;
  const checkoutItems = useMemo<CheckoutItemInput[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    [items],
  );

  const orderSummary = useMemo(() => {
    return items
      .map((item) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
      .join("%0A");
  }, [items]);

  function updateField(field: CustomerField, value: string) {
    const nextValue =
      field === "phone" ? value.replace(/[^\d()+\-\s]/g, "").slice(0, 20) : value;
    const nextForm = { ...form, [field]: nextValue };
    setForm(nextForm);

    if (touched[field]) {
      setErrors(validateCustomerInput(nextForm).errors);
    }
  }

  function handleBlur(field: CustomerField) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validateCustomerInput(form).errors);
  }

  async function handleCheckout(mode: "whatsapp" | "razorpay") {
    if (items.length === 0) {
      toast.warning({
        title: "Your cart is empty",
        description: "Add a few AahaFood favorites before checkout.",
        key: "checkout-empty-cart",
      });
      return;
    }

    if (soldOutItems.length > 0) {
      toast.warning({
        title: "Remove sold-out items first",
        description: "Update your cart before starting checkout.",
        key: "checkout-sold-out-items",
      });
      return;
    }

    const customerValidation = validateCustomerInput(form);

    if (!customerValidation.valid) {
      setTouched({
        name: true,
        phone: true,
        email: true,
        address: true,
      });
      setErrors(customerValidation.errors);
      toast.warning({
        title: "Check your delivery details",
        description: getFirstCustomerError(customerValidation.errors),
        key: "checkout-invalid-fields",
      });
      return;
    }

    const customer = customerValidation.normalized;

    setPaymentMessage(null);

    setIsProcessing(true);

    try {
      if (mode === "whatsapp") {
        toast.info({
          title: "Preparing WhatsApp order",
          description: "We are putting together your order summary.",
          key: "checkout-whatsapp-start",
        });

        const result = await createWhatsAppOrder({
          ...customer,
          items,
          totalPrice: subtotal,
          paymentMode: "whatsapp",
        });

        const message = [
          `Hello AahaFoods, I'd like to place an order.`,
          ``,
          result.orderNumber ? `Order: ${result.orderNumber}` : null,
          `Name: ${customer.name}`,
          `Phone: ${customer.phone}`,
          `Email: ${customer.email}`,
          `Address: ${customer.address}`,
          ``,
          `Items:`,
          decodeURIComponent(orderSummary),
          ``,
          `Subtotal: ${formatCurrency(subtotal)}`,
        ]
          .filter(Boolean)
          .join("\n");

        window.open(
          `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`,
          "_blank",
          "noopener,noreferrer",
        );
        clearCart({ silent: true });
        router.push(
          "/checkout/success?mode=whatsapp&order=" +
            encodeURIComponent(result.orderNumber ?? "manual"),
        );
      } else {
        toast.info({
          title: "Starting secure checkout",
          description: "Creating your Razorpay order now.",
          key: "checkout-razorpay-start",
        });
        setPaymentMessage("Preparing secure payment...");

        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded || !window.Razorpay) {
          throw new Error("Razorpay checkout could not be loaded. Please try again.");
        }

        const order = await createRazorpayOrder({
          ...customer,
          items: checkoutItems,
        });

        setPaymentMessage("Opening Razorpay...");

        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "AahaFood",
          description: `Order ${order.orderReference}`,
          image: "/brand/icon.png",
          order_id: order.orderId,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
          notes: {
            order_reference: order.orderReference,
          },
          theme: {
            color: "#2F7D32",
          },
          retry: {
            enabled: true,
            max_count: 2,
          },
          modal: {
            confirm_close: true,
            ondismiss: () => {
              setIsProcessing(false);
              setPaymentMessage(null);
              router.push(
                `/checkout/failed?order=${encodeURIComponent(order.orderReference)}&reason=${encodeURIComponent("Payment cancelled")}`,
              );
            },
          },
          handler: async (response) => {
            try {
              setPaymentMessage("Verifying payment...");

              const verification = await verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderReference: order.orderReference,
                ...customer,
                items: checkoutItems,
              });

              clearCart({ silent: true });
              router.push(
                `/checkout/success?mode=razorpay&order=${encodeURIComponent(verification.orderReference)}&payment=${encodeURIComponent(verification.paymentId)}`,
              );
            } catch (verificationError) {
              setIsProcessing(false);
              setPaymentMessage(null);
              const message =
                verificationError instanceof Error
                  ? verificationError.message
                  : "Payment verification failed.";

              toast.error({
                title: "Payment verification failed",
                description: message,
                key: `verification-failed:${order.orderReference}`,
              });
              router.push(
                `/checkout/failed?order=${encodeURIComponent(order.orderReference)}&reason=${encodeURIComponent(message)}`,
              );
            }
          },
        });

        razorpay.on("payment.failed", (response) => {
          setIsProcessing(false);
          setPaymentMessage(null);
          const reason =
            response.error.description ||
            response.error.reason ||
            "Payment failed before confirmation.";

          toast.error({
            title: "Payment failed",
            description: reason,
            key: `payment-failed:${order.orderReference}`,
          });
          router.push(
            `/checkout/failed?order=${encodeURIComponent(order.orderReference)}&reason=${encodeURIComponent(reason)}`,
          );
        });

        razorpay.open();
      }
    } catch (checkoutError) {
      setIsProcessing(false);
      setPaymentMessage(null);
      toast.error({
        title: "Checkout could not continue",
        description:
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to place your order right now.",
        key: "checkout-error",
      });
    } finally {
      if (mode === "whatsapp") {
        setIsProcessing(false);
        setPaymentMessage(null);
      }
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Full name</label>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              onBlur={() => handleBlur("name")}
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "checkout-name-error" : undefined}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none focus:border-brand-yellow dark:bg-white/5 ${
                errors.name ? "border-red-300 focus:border-red-500" : "border-brand-red/10"
              }`}
              placeholder="Your name"
            />
            {touched.name && errors.name ? (
              <p id="checkout-name-error" className="mt-2 text-xs text-red-600">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Phone number</label>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              onBlur={() => handleBlur("phone")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              minLength={10}
              maxLength={20}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none focus:border-brand-yellow dark:bg-white/5 ${
                errors.phone ? "border-red-300 focus:border-red-500" : "border-brand-red/10"
              }`}
              placeholder="+91"
            />
            {touched.phone && errors.phone ? (
              <p id="checkout-phone-error" className="mt-2 text-xs text-red-600">
                {errors.phone}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              onBlur={() => handleBlur("email")}
              autoComplete="email"
              required
              maxLength={120}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "checkout-email-error" : undefined}
              className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none focus:border-brand-yellow dark:bg-white/5 ${
                errors.email ? "border-red-300 focus:border-red-500" : "border-brand-red/10"
              }`}
              placeholder="you@example.com"
            />
            {touched.email && errors.email ? (
              <p id="checkout-email-error" className="mt-2 text-xs text-red-600">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-red">Delivery address</label>
            <textarea
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              onBlur={() => handleBlur("address")}
              autoComplete="street-address"
              required
              minLength={12}
              maxLength={240}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "checkout-address-error" : undefined}
              className={`min-h-36 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-brand-yellow dark:bg-white/5 ${
                errors.address ? "border-red-300 focus:border-red-500" : "border-brand-red/10"
              }`}
              placeholder="House number, street, area, city, pincode"
            />
            {touched.address && errors.address ? (
              <p id="checkout-address-error" className="mt-2 text-xs text-red-600">
                {errors.address}
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-xs leading-6 text-brand-ink/55 dark:text-stone-400">
          Please use your real name, a reachable phone number, a valid email, and a complete
          delivery address.
        </p>
        {soldOutItems.length > 0 ? (
          <p className="mt-4 text-sm text-red-600">
            Remove sold-out items from your cart before placing the order.
          </p>
        ) : null}
        {paymentMessage ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {paymentMessage}
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleCheckout("whatsapp")}
            disabled={checkoutDisabled}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:bg-brand-ink/25 disabled:text-white/80"
          >
            {isProcessing ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircleMore className="mr-2 h-4 w-4" />
            )}
            Order on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void handleCheckout("razorpay")}
            disabled={checkoutDisabled}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:bg-brand-ink/25 disabled:text-white/80"
          >
            {isProcessing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
            Pay Securely with Razorpay
          </button>
        </div>
        <p className="mt-4 text-xs leading-6 text-brand-ink/55 dark:text-stone-400">
          Your payment stays tied to a server-created Razorpay order, so the amount cannot be
          altered in the browser and the order is only confirmed after signature verification.
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
          <div className="mb-3 flex items-center justify-between text-sm text-brand-ink/70 dark:text-stone-300/80">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex items-center justify-between text-lg font-semibold text-brand-red">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
