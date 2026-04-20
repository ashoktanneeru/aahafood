import { NextResponse } from "next/server";

import type { CheckoutItemInput } from "@/lib/checkout";
import { prepareCheckoutOrder } from "@/lib/checkout";
import {
  decrementInventoryForItems,
  markRazorpayOrderPaid,
} from "@/lib/order-persistence";
import { sendOrderNotifications } from "@/lib/order-notifications";
import { createRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

type VerifyPaymentRequest = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderReference: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  items: CheckoutItemInput[];
};

function isVerifyPaymentRequest(value: unknown): value is VerifyPaymentRequest {
  return Boolean(
    value &&
      typeof value === "object" &&
      "razorpayOrderId" in value &&
      "razorpayPaymentId" in value &&
      "razorpaySignature" in value &&
      "orderReference" in value &&
      "name" in value &&
      "phone" in value &&
      "email" in value &&
      "address" in value &&
      "items" in value &&
      typeof (value as { razorpayOrderId: unknown }).razorpayOrderId === "string" &&
      typeof (value as { razorpayPaymentId: unknown }).razorpayPaymentId === "string" &&
      typeof (value as { razorpaySignature: unknown }).razorpaySignature === "string" &&
      typeof (value as { orderReference: unknown }).orderReference === "string" &&
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

  if (!isVerifyPaymentRequest(payload)) {
    return NextResponse.json({ error: "Incomplete payment response." }, { status: 400 });
  }

  try {
    const signatureIsValid = verifyRazorpaySignature({
      orderId: payload.razorpayOrderId,
      paymentId: payload.razorpayPaymentId,
      signature: payload.razorpaySignature,
    });

    if (!signatureIsValid) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const preparedOrder = await prepareCheckoutOrder(payload);
    const razorpay = createRazorpayClient();
    const payment = await razorpay.payments.fetch(payload.razorpayPaymentId);

    if (payment.order_id !== payload.razorpayOrderId) {
      return NextResponse.json({ error: "Payment does not belong to this order." }, { status: 400 });
    }

    if (payment.amount !== preparedOrder.total * 100) {
      return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
    }

    if (!["authorized", "captured"].includes(payment.status)) {
      return NextResponse.json({ error: "Payment was not completed." }, { status: 400 });
    }

    const wasMarkedPaid = await markRazorpayOrderPaid({
      orderNumber: payload.orderReference,
      customer: preparedOrder.customer,
      items: preparedOrder.items,
      subtotal: preparedOrder.subtotal,
      shipping: preparedOrder.shipping,
      total: preparedOrder.total,
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
    });

    if (wasMarkedPaid) {
      await decrementInventoryForItems(preparedOrder.items);

      await sendOrderNotifications({
        name: preparedOrder.customer.name,
        phone: preparedOrder.customer.phone,
        email: preparedOrder.customer.email,
        address: preparedOrder.customer.address,
        items: preparedOrder.items,
        totalPrice: preparedOrder.total,
        paymentMode: "razorpay",
        orderNumber: payload.orderReference,
      });
    }

    return NextResponse.json({
      success: true,
      orderReference: payload.orderReference,
      paymentId: payload.razorpayPaymentId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify the payment right now.",
      },
      { status: 400 },
    );
  }
}
