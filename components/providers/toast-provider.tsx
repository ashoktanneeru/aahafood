"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ToastViewport, type ToastItem, type ToastVariant } from "@/components/ui/toast";

type ShowToastInput = {
  title: string;
  description?: string;
  duration?: number;
  key?: string;
};

type ToastContextValue = {
  show: (variant: ToastVariant, input: ShowToastInput | string) => string | null;
  dismiss: (id: string) => void;
  success: (input: ShowToastInput | string) => string | null;
  error: (input: ShowToastInput | string) => string | null;
  warning: (input: ShowToastInput | string) => string | null;
  info: (input: ShowToastInput | string) => string | null;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3200;
const MAX_TOASTS = 4;
const DEDUPE_WINDOW = 1200;

function normalizeToastInput(input: ShowToastInput | string) {
  if (typeof input === "string") {
    return {
      title: input,
      duration: DEFAULT_DURATION,
      key: input,
    };
  }

  return {
    ...input,
    duration: input.duration ?? DEFAULT_DURATION,
    key: input.key ?? `${input.title}:${input.description ?? ""}`,
  };
}

function createToastId() {
  return `toast-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutMap = useRef(new Map<string, number>());
  const recentMap = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timeout = timeoutMap.current.get(id);

    if (timeout) {
      window.clearTimeout(timeout);
      timeoutMap.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, input: ShowToastInput | string) => {
      const normalized = normalizeToastInput(input);
      const now = Date.now();
      const lastShownAt = recentMap.current.get(`${variant}:${normalized.key}`);

      if (lastShownAt && now - lastShownAt < DEDUPE_WINDOW) {
        return null;
      }

      recentMap.current.set(`${variant}:${normalized.key}`, now);

      const id = createToastId();
      const nextToast: ToastItem = {
        id,
        title: normalized.title,
        description: normalized.description,
        variant,
        duration: normalized.duration,
      };

      setToasts((current) => {
        const next = [nextToast, ...current];
        return next.slice(0, MAX_TOASTS);
      });

      const timeout = window.setTimeout(() => {
        dismiss(id);
      }, normalized.duration);

      timeoutMap.current.set(id, timeout);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      timeoutMap.current.forEach((timeout) => window.clearTimeout(timeout));
      timeoutMap.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      success: (input) => show("success", input),
      error: (input) => show("error", input),
      warning: (input) => show("warning", input),
      info: (input) => show("info", input),
    }),
    [dismiss, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
