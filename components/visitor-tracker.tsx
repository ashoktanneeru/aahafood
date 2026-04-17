"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { logVisitorEvent } from "@/lib/supabase";

const SESSION_KEY = "aahafoods-visitor-session";

function getVisitorSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);

  if (existing) {
    return existing;
  }

  const created =
    window.crypto?.randomUUID?.() ??
    `visit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function detectDevice() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1280) {
    return "tablet";
  }

  return "desktop";
}

export function VisitorTracker({ disabled = false }: { disabled?: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (disabled || !pathname) {
      return;
    }

    void logVisitorEvent({
      sessionId: getVisitorSessionId(),
      path: pathname,
      referrer: document.referrer || "",
      userAgent: navigator.userAgent,
      device: detectDevice(),
      eventType: "page_view",
    });
  }, [disabled, pathname]);

  return null;
}
