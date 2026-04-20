import { NextResponse } from "next/server";

import type { CheckoutItemInput } from "@/lib/checkout";
import { prepareCheckoutOrder } from "@/lib/checkout";
import { persistRazorpayOrder } from "@/lib/order-persistence";
import { buildOrderNumber } from "@/lib/order-utils";
import { createRazorpayClient, getRazorpayPublicKeyId, isRazorpayConfigured } from "@/lib/razorpay";

export const runtime = "nodejs";

type CreateRazorpayOrderRequest = {
  name: string;
  phone: string;
  email: string;
  address: string;
  items: CheckoutItemInput[];
};

function isCreateOrderRequest(value: unknown): value is CreateRazorpayOrderRequest {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "phone" in value &&
      "email" in value &&
      "address" in value &&
      "items" in value &&
      typeof (value as { name: unknown }).name === "string" &&
      typeof (value as { phone: unknown }).phone === "string" &&
      typeof (value as { email: unknown }).email === "string" &&
      typeof (value as { address: unknown }).address === "string" &&
      Array.isArray((value as { items: unknown }).items),
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isCreateOrderRequest(payload)) {
    return NextResponse.json({ error: "Incomplete checkout details." }, { status: 400 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not configured yet. Add your API keys and redeploy." },
      { status: 503 },
    );
  }

  try {
    const preparedOrder = await prepareCheckoutOrder(payload);
    const orderReference = buildOrderNumber();
    const razorpay = createRazorpayClient();
    const keyId = getRazorpayPublicKeyId();

    if (!keyId) {
      throw new Error("Razorpay public key is missing.");
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: preparedOrder.total * 100,
      currency: "INR",
      receipt: orderReference.slice(0, 40),
      notes: {
        order_reference: orderReference,
        customer_name: preparedOrder.customer.name.slice(0, 256),
        customer_phone: preparedOrder.customer.phone.slice(0, 256),
      },
    });

    await persistRazorpayOrder({
      orderNumber: orderReference,
      customer: preparedOrder.customer,
      items: preparedOrder.items,
      subtotal: preparedOrder.subtotal,
      shipping: preparedOrder.shipping,
      total: preparedOrder.total,
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
    });

    return NextResponse.json({
      keyId,
      orderId: razorpayOrder.id,
      orderReference,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      subtotal: preparedOrder.subtotal,
      shipping: preparedOrder.shipping,
      total: preparedOrder.total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start payment right now.",
      },
      { status: 400 },
    );
  }
}
