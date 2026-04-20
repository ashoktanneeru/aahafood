import { NextResponse } from "next/server";

import {
  getFirstCustomerError,
  validateCustomerInput,
} from "@/lib/customer-validation";
import { buildOrderNumber, sanitizeItems } from "@/lib/order-utils";
import { sendOrderNotifications } from "@/lib/order-notifications";
import {
  createSupabasePublicClient,
  createSupabaseServiceClient,
  type OrderPayload,
} from "@/lib/supabase";
import { CartItem } from "@/lib/types";

type ProductInventoryRecord = {
  id: string;
  name: string;
  inventory_count: number | null;
  is_active: boolean | null;
};

function isCartItem(value: unknown): value is CartItem {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "price" in value &&
      "quantity" in value &&
      typeof (value as { id: unknown }).id === "string" &&
      typeof (value as { name: unknown }).name === "string" &&
      typeof (value as { price: unknown }).price === "number" &&
      typeof (value as { quantity: unknown }).quantity === "number",
  );
}

function isOrderPayload(value: unknown): value is OrderPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "phone" in value &&
      "email" in value &&
      "address" in value &&
      "items" in value &&
      "totalPrice" in value &&
      "paymentMode" in value &&
      typeof (value as { name: unknown }).name === "string" &&
      typeof (value as { phone: unknown }).phone === "string" &&
      typeof (value as { email: unknown }).email === "string" &&
      typeof (value as { address: unknown }).address === "string" &&
      Array.isArray((value as { items: unknown[] }).items) &&
      (value as { items: unknown[] }).items.every(isCartItem) &&
      typeof (value as { totalPrice: unknown }).totalPrice === "number" &&
      ((value as { paymentMode: unknown }).paymentMode === "whatsapp" ||
        (value as { paymentMode: unknown }).paymentMode === "razorpay"),
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isOrderPayload(payload)) {
    return NextResponse.json({ error: "Incomplete order details." }, { status: 400 });
  }

  const customerValidation = validateCustomerInput({
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
  });

  if (!customerValidation.valid) {
    return NextResponse.json(
      { error: getFirstCustomerError(customerValidation.errors) },
      { status: 400 },
    );
  }

  if (payload.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  const publicClient = createSupabasePublicClient();
  const supabase = serviceClient ?? publicClient;

  if (!supabase) {
    return NextResponse.json({ error: "Order system is not configured yet." }, { status: 503 });
  }

  const uniqueIds = Array.from(new Set(payload.items.map((item) => item.id)));

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("id, name, inventory_count, is_active")
    .in("id", uniqueIds);

  if (productError) {
    return NextResponse.json({ error: "Unable to verify inventory right now." }, { status: 500 });
  }

  const inventoryMap = new Map(
    ((productData ?? []) as ProductInventoryRecord[]).map((product) => [product.id, product]),
  );

  for (const item of payload.items) {
    const record = inventoryMap.get(item.id);

    if (!record || record.is_active === false) {
      return NextResponse.json(
        { error: `${item.name} is currently unavailable.` },
        { status: 409 },
      );
    }

    if (typeof record.inventory_count === "number" && item.quantity > record.inventory_count) {
      return NextResponse.json(
        {
          error:
            record.inventory_count <= 0
              ? `${item.name} is currently sold out.`
              : `Only ${record.inventory_count} ${item.name} left in stock.`,
        },
        { status: 409 },
      );
    }
  }

  const customer = customerValidation.normalized;

  const orderNumber = buildOrderNumber();

  const extendedInsert = await supabase.from("orders").insert({
    order_number: orderNumber,
    name: customer.name,
    phone: customer.phone,
    customer_email: customer.email,
    address: customer.address,
    items: sanitizeItems(payload.items),
    subtotal: payload.totalPrice,
    shipping: 0,
    total_price: payload.totalPrice,
    status: "new",
    payment_mode: payload.paymentMode,
    payment_status: "pending",
  });

  if (extendedInsert.error) {
    const fallbackInsert = await supabase.from("orders").insert({
      order_number: orderNumber,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      items: sanitizeItems(payload.items),
      total_price: payload.totalPrice,
      status: "new",
      payment_mode: payload.paymentMode,
    });

    if (fallbackInsert.error) {
      return NextResponse.json({ error: "Unable to save your order." }, { status: 500 });
    }
  }

  if (serviceClient) {
    for (const item of payload.items) {
      const currentStock = inventoryMap.get(item.id)?.inventory_count;

      if (typeof currentStock !== "number") {
        continue;
      }

      const nextStock = Math.max(currentStock - item.quantity, 0);

      await serviceClient
        .from("products")
        .update({ inventory_count: nextStock })
        .eq("id", item.id);
    }
  }

  const notificationWarnings = await sendOrderNotifications({
    ...payload,
    ...customer,
    orderNumber,
  });

  return NextResponse.json({
    orderNumber,
    notificationWarnings,
  });
}
