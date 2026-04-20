"use client";

import { useToastContext } from "@/components/providers/toast-provider";

export function useToast() {
  return useToastContext();
}
