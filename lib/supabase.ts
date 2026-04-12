import { createClient } from "@supabase/supabase-js";

import { CartItem } from "@/lib/types";

type OrderPayload = {
  name: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalPrice: number;
};

export async function saveOrder(payload: OrderPayload) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return;
  }

  try {
    const supabase = createClient(url, anonKey);
    await supabase.from("orders").insert({
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      items: payload.items,
      total_price: payload.totalPrice,
    });
  } catch {
    // Keep checkout resilient even if optional Supabase logging is not configured.
  }
}
