import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  const sign = amount < 0 ? "-" : "";
  const currencySymbol = "\u20B9";
  const absolute = Math.abs(amount);
  const digits = String(absolute);

  if (digits.length <= 3) {
    return `${sign}${currencySymbol}${digits}`;
  }

  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

  return `${sign}${currencySymbol}${groupedRest},${lastThree}`;
}
