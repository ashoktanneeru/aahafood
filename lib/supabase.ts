import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { CartItem } from "@/lib/types";

export type OrderPayload = {
  name: string;
  phone: string;
  email: string;
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
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
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

export function createSupabaseServiceClient() {
  const config = getSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient(config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getProductMediaBucket() {
  return PRODUCT_MEDIA_BUCKET;
}

export async function saveOrder(payload: OrderPayload) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Unable to place the order right now.";

    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // Keep the fallback error message.
    }

    throw new Error(message);
  }

  return (await response.json()) as {
    orderId?: string;
    orderNumber?: string;
    notificationWarnings?: string[];
  };
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
