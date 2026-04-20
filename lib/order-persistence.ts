import "server-only";

import type { CartItem } from "@/lib/types";
import { createSupabaseServiceClient } from "@/lib/supabase";

type PersistOrderInput = {
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: "pending" | "paid";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
};

function serializeItems(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    sku: item.sku ?? null,
  }));
}

async function upsertOrder(input: PersistOrderInput) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const extendedPayload = {
    order_number: input.orderNumber,
    name: input.customer.name,
    phone: input.customer.phone,
    customer_email: input.customer.email,
    address: input.customer.address,
    items: serializeItems(input.items),
    subtotal: input.subtotal,
    shipping: input.shipping,
    total_price: input.total,
    status: "new",
    payment_mode: "razorpay",
    payment_status: input.paymentStatus,
    razorpay_order_id: input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId ?? null,
    payment_verified_at:
      input.paymentStatus === "paid" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("orders").upsert(extendedPayload, {
    onConflict: "order_number",
  });

  if (!error) {
    return;
  }

  const fallbackPayload = {
    order_number: input.orderNumber,
    name: input.customer.name,
    phone: input.customer.phone,
    address: input.customer.address,
    items: serializeItems(input.items),
    total_price: input.total,
    status: "new",
    payment_mode: "razorpay",
  };

  const { error: fallbackError } = await supabase.from("orders").upsert(fallbackPayload, {
    onConflict: "order_number",
  });

  if (fallbackError) {
    throw fallbackError;
  }
}

export async function persistRazorpayOrder(input: Omit<PersistOrderInput, "paymentStatus"> & { paymentStatus: "pending" }) {
  await upsertOrder(input);
}

export async function markRazorpayOrderPaid(input: Omit<PersistOrderInput, "paymentStatus">) {
  const supabase = createSupabaseServiceClient();

  if (supabase) {
    const { data } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("order_number", input.orderNumber)
      .maybeSingle();

    if ((data as { payment_status?: string } | null)?.payment_status === "paid") {
      return false;
    }
  }

  await upsertOrder({
    ...input,
    paymentStatus: "paid",
  });

  return true;
}

export async function decrementInventoryForItems(items: CartItem[]) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  for (const item of items) {
    if (typeof item.inventoryCount !== "number") {
      continue;
    }

    const nextCount = Math.max(item.inventoryCount - item.quantity, 0);

    const { error } = await supabase
      .from("products")
      .update({ inventory_count: nextCount })
      .eq("id", item.id);

    if (error) {
      throw error;
    }
  }
}
