"use client";

import type { ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

const variantConfig: Record<
  ToastVariant,
  {
    icon: ComponentType<{ className?: string }>;
    shell: string;
    iconWrap: string;
    iconColor: string;
    progress: string;
    title: string;
    description: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    shell:
      "border-[#2E7D32]/20 bg-[linear-gradient(135deg,rgba(46,125,50,0.14),rgba(255,248,231,0.96))] text-[#1E5A26] shadow-[0_20px_60px_rgba(46,125,50,0.16)]",
    iconWrap: "bg-[#2E7D32]/12",
    iconColor: "text-[#2E7D32]",
    progress: "bg-[#2E7D32]",
    title: "text-[#1E5A26]",
    description: "text-[#1E5A26]/75",
  },
  error: {
    icon: XCircle,
    shell:
      "border-[#8B0000]/20 bg-[linear-gradient(135deg,rgba(139,0,0,0.12),rgba(255,248,231,0.96))] text-[#6E0000] shadow-[0_20px_60px_rgba(139,0,0,0.16)]",
    iconWrap: "bg-[#8B0000]/10",
    iconColor: "text-[#8B0000]",
    progress: "bg-[#8B0000]",
    title: "text-[#6E0000]",
    description: "text-[#6E0000]/78",
  },
  warning: {
    icon: AlertTriangle,
    shell:
      "border-[#E6A817]/28 bg-[linear-gradient(135deg,rgba(230,168,23,0.18),rgba(255,248,231,0.98))] text-[#7F4A00] shadow-[0_20px_60px_rgba(230,168,23,0.18)]",
    iconWrap: "bg-[#E6A817]/14",
    iconColor: "text-[#B57600]",
    progress: "bg-[#E6A817]",
    title: "text-[#7F4A00]",
    description: "text-[#7F4A00]/78",
  },
  info: {
    icon: Bell,
    shell:
      "border-[#8B0000]/12 bg-[linear-gradient(135deg,rgba(255,248,231,0.98),rgba(230,168,23,0.08))] text-[#4B3422] shadow-[0_20px_60px_rgba(75,52,34,0.14)]",
    iconWrap: "bg-[#8B0000]/8",
    iconColor: "text-[#8B0000]",
    progress: "bg-[#8B0000]",
    title: "text-[#4B3422]",
    description: "text-[#4B3422]/76",
  },
};

export function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <motion.li
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 36, scale: 0.96 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 18, scale: 0.98 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-[1rem] border backdrop-blur-xl",
        "sm:max-w-sm",
        config.shell,
      )}
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3 p-4 pr-12">
        <div
          className={cn(
            "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem]",
            config.iconWrap,
          )}
        >
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold leading-6", config.title)}>{toast.title}</p>
          {toast.description ? (
            <p className={cn("mt-1 text-sm leading-6", config.description)}>{toast.description}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/45 transition hover:bg-white/60 hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 dark:hover:bg-white/10 dark:hover:text-stone-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      <motion.div
        className={cn("h-1 origin-left", config.progress)}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: "linear" }}
      />
    </motion.li>
  );
}

export function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4 sm:top-5 sm:justify-end sm:px-5"
      aria-live="polite"
      aria-atomic="true"
    >
      <ol className="flex w-full max-w-[min(100%,24rem)] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
