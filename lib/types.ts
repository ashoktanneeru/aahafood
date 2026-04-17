export type Diet = "veg" | "non-veg";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  videos?: string[];
  diet?: Diet;
  description: string;
  category: string;
  categorySlug: string;
  sku?: string;
  inventoryCount?: number;
  inventoryThreshold?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = Product & {
  quantity: number;
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMode = "whatsapp" | "razorpay";

export type Order = {
  id: string;
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMode: PaymentMode;
  createdAt: string;
  updatedAt?: string;
};

export type VisitorEvent = {
  id: string;
  sessionId: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  device?: string | null;
  eventType: string;
  createdAt: string;
};

export type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt?: string;
};

export type StorageAsset = {
  name: string;
  path: string;
  url: string;
  type: "image" | "video" | "other";
  updatedAt?: string;
};
