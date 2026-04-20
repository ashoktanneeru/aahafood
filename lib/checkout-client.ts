import type { CheckoutCustomerInput, CheckoutItemInput } from "@/lib/checkout";

type CreateRazorpayOrderRequest = CheckoutCustomerInput & {
  items: CheckoutItemInput[];
};

type CreateRazorpayOrderResponse = {
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
  orderReference: string;
  subtotal: number;
  shipping: number;
  total: number;
};

type VerifyRazorpayPaymentRequest = CreateRazorpayOrderRequest & {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderReference: string;
};

type VerifyRazorpayPaymentResponse = {
  success: true;
  orderReference: string;
  paymentId: string;
};

async function parseJsonResponse<T>(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let message = fallbackMessage;

  try {
    const data = (await response.json()) as { error?: string };
    message = data.error ?? message;
  } catch {
    // Keep the fallback message.
  }

  throw new Error(message);
}

export async function createRazorpayOrder(payload: CreateRazorpayOrderRequest) {
  const response = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CreateRazorpayOrderResponse>(
    response,
    "Unable to start payment right now.",
  );
}

export async function verifyRazorpayPayment(payload: VerifyRazorpayPaymentRequest) {
  const response = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<VerifyRazorpayPaymentResponse>(
    response,
    "Unable to verify the payment right now.",
  );
}

export async function createWhatsAppOrder(payload: {
  name: string;
  phone: string;
  email: string;
  address: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  totalPrice: number;
  paymentMode: "whatsapp";
}) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{
    orderNumber?: string;
    notificationWarnings?: string[];
  }>(response, "Unable to place the order right now.");
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

