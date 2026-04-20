import { CartItem } from "@/lib/types";

export function buildOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `AAHA-${stamp}-${suffix}`;
}

export function sanitizeItems(items: CartItem[]) {
  return items.map((item) => ({
    ...item,
    sku: item.sku ?? null,
  }));
}

export function buildOrderMessage({
  orderNumber,
  name,
  phone,
  email,
  address,
  items,
  totalPrice,
  paymentMode,
}: {
  orderNumber?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  items: CartItem[];
  totalPrice: number;
  paymentMode: "whatsapp" | "razorpay";
}) {
  const itemLines = items
    .map((item) => `${item.name} x${item.quantity} - INR ${item.price * item.quantity}`)
    .join("\n");

  return [
    "New AahaFood order received",
    "",
    orderNumber ? `Order: ${orderNumber}` : null,
    `Customer: ${name}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    `Address: ${address}`,
    `Payment mode: ${paymentMode}`,
    "",
    "Items:",
    itemLines,
    "",
    `Total: INR ${totalPrice}`,
  ]
    .filter(Boolean)
    .join("\n");
}
