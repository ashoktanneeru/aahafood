import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { CartItem } from "@/lib/types";

type OrderPayload = {
  name: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalPrice: number;
  paymentMode: "whatsapp" | "razorpay";
};

type VisitorPayload = {
  sessionId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  device?: string;
  eventType?: string;
};

const PRODUCT_MEDIA_BUCKET = "product-media";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function createSupabasePublicClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(config.url, config.anonKey);
  }

  return browserClient;
}

export function getProductMediaBucket() {
  return PRODUCT_MEDIA_BUCKET;
}

function sanitizeItems(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    sku: item.sku ?? null,
  }));
}

function buildOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `AAHA-${stamp}-${suffix}`;
}

export async function saveOrder(payload: OrderPayload) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return;
  }

  try {
    await supabase.from("orders").insert({
      order_number: buildOrderNumber(),
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      items: sanitizeItems(payload.items),
      total_price: payload.totalPrice,
      status: "new",
      payment_mode: payload.paymentMode,
    });
  } catch {
    // Keep checkout resilient even if optional Supabase logging is not configured.
  }
}

export async function logVisitorEvent(payload: VisitorPayload) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return;
  }

  try {
    await supabase.from("visitor_events").insert({
      session_id: payload.sessionId,
      path: payload.path,
      referrer: payload.referrer ?? null,
      user_agent: payload.userAgent ?? null,
      device: payload.device ?? null,
      event_type: payload.eventType ?? "page_view",
    });
  } catch {
    // Visitor logging is best-effort and should never interrupt browsing.
  }
}

export function getPublicAssetUrl(path: string) {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return "";
  }

  const { data } = supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
