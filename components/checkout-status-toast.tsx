"use client";

import { useEffect } from "react";

import { useToast } from "@/hooks/use-toast";

export function CheckoutStatusToast({
  variant,
  title,
  description,
}: {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}) {
  const toast = useToast();

  useEffect(() => {
    toast[variant]({
      title,
      description,
      key: `checkout-status:${variant}:${title}:${description ?? ""}`,
    });
  }, [description, title, toast, variant]);

  return null;
}
