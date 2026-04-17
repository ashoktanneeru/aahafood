"use client";

import type { Session } from "@supabase/supabase-js";
import {
  BarChart3,
  Boxes,
  Eye,
  LoaderCircle,
  LogOut,
  PackageSearch,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { categories, products as starterProducts } from "@/data/products";
import {
  createSupabaseBrowserClient,
  getProductMediaBucket,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  type CustomerSummary,
  type Diet,
  type Order,
  type OrderStatus,
  type Product,
  type StorageAsset,
  type VisitorEvent,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type AdminSection =
  | "overview"
  | "products"
  | "orders"
  | "inventory"
  | "customers"
  | "media"
  | "visitors";

type ProductFormState = {
  id: string;
  name: string;
  price: string;
  description: string;
  categorySlug: string;
  diet: Diet;
  sku: string;
  inventoryCount: string;
  inventoryThreshold: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  videos: string[];
  imageInput: string;
  videoInput: string;
};

type ProductRecord = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  images: string[] | null;
  videos: string[] | null;
  description: string;
  category: string;
  category_slug: string;
  diet: Diet | null;
  sku: string | null;
  inventory_count: number | null;
  inventory_threshold: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type OrderRecord = {
  id: string;
  order_number: string;
  name: string;
  phone: string;
  address: string;
  items: Array<Product & { quantity?: number }>;
  total_price: number;
  status: OrderStatus;
  payment_mode: "whatsapp" | "razorpay";
  created_at: string;
  updated_at: string | null;
};

type VisitorRecord = {
  id: string;
  session_id: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  device: string | null;
  event_type: string | null;
  created_at: string;
};

const sections: Array<{ id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Dashboard", icon: BarChart3 },
  { id: "products", label: "Products", icon: PackageSearch },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "customers", label: "Users", icon: Users },
  { id: "media", label: "Media", icon: Upload },
  { id: "visitors", label: "Visitors", icon: Eye },
];

const orderStatuses: OrderStatus[] = [
  "new",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeProduct(record: ProductRecord): Product {
  const images = record.images?.filter(Boolean) ?? [];
  const fallbackImage = record.image || images[0] || "/brand/logo-full-color.png";

  return {
    id: record.id,
    name: record.name,
    price: Number(record.price ?? 0),
    image: fallbackImage,
    images: images.length > 0 ? images : [fallbackImage],
    videos: record.videos?.filter(Boolean) ?? [],
    description: record.description,
    category: record.category,
    categorySlug: record.category_slug,
    diet: record.diet ?? "veg",
    sku: record.sku ?? "",
    inventoryCount: record.inventory_count ?? 0,
    inventoryThreshold: record.inventory_threshold ?? 5,
    isActive: record.is_active ?? true,
    isFeatured: record.is_featured ?? false,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
  };
}

function normalizeOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    orderNumber: record.order_number,
    name: record.name,
    phone: record.phone,
    address: record.address,
    items: Array.isArray(record.items) ? (record.items as Order["items"]) : [],
    totalPrice: Number(record.total_price ?? 0),
    status: record.status ?? "new",
    paymentMode: record.payment_mode ?? "whatsapp",
    createdAt: record.created_at,
    updatedAt: record.updated_at ?? undefined,
  };
}

function normalizeVisitor(record: VisitorRecord): VisitorEvent {
  return {
    id: record.id,
    sessionId: record.session_id,
    path: record.path,
    referrer: record.referrer ?? null,
    userAgent: record.user_agent ?? null,
    device: record.device ?? null,
    eventType: record.event_type ?? "page_view",
    createdAt: record.created_at,
  };
}

function createEmptyProductForm(): ProductFormState {
  return {
    id: "",
    name: "",
    price: "",
    description: "",
    categorySlug: categories[0]?.slug ?? "pickles",
    diet: "veg",
    sku: "",
    inventoryCount: "0",
    inventoryThreshold: "5",
    isActive: true,
    isFeatured: false,
    images: [],
    videos: [],
    imageInput: "",
    videoInput: "",
  };
}

function productToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    price: String(product.price),
    description: product.description,
    categorySlug: product.categorySlug,
    diet: product.diet ?? "veg",
    sku: product.sku ?? "",
    inventoryCount: String(product.inventoryCount ?? 0),
    inventoryThreshold: String(product.inventoryThreshold ?? 5),
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
    images: product.images?.length ? product.images : [product.image],
    videos: product.videos ?? [],
    imageInput: "",
    videoInput: "",
  };
}

function toCustomerSummaries(orders: Order[]): CustomerSummary[] {
  const grouped = new Map<string, CustomerSummary>();

  orders.forEach((order) => {
    const key = order.phone || order.name;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        name: order.name,
        phone: order.phone,
        address: order.address,
        totalOrders: 1,
        totalSpend: order.totalPrice,
        lastOrderAt: order.createdAt,
      });
      return;
    }

    existing.totalOrders += 1;
    existing.totalSpend += order.totalPrice;

    if (!existing.lastOrderAt || new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = order.createdAt;
      existing.address = order.address;
      existing.name = order.name;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    return new Date(b.lastOrderAt ?? 0).getTime() - new Date(a.lastOrderAt ?? 0).getTime();
  });
}

function getAssetType(name: string): StorageAsset["type"] {
  const extension = name.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension ?? "")) {
    return "image";
  }

  if (["mp4", "mov", "webm", "m4v"].includes(extension ?? "")) {
    return "video";
  }

  return "other";
}

function MiniBarChart({
  points,
  colorClass,
}: {
  points: Array<{ label: string; value: number }>;
  colorClass: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="space-y-3">
      {points.map((point) => (
        <div key={point.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-ink/60 dark:text-stone-400">
            <span>{point.label}</span>
            <span>{point.value}</span>
          </div>
          <div className="h-2 rounded-full bg-brand-ink/8 dark:bg-white/10">
            <div
              className={cn("h-2 rounded-full", colorClass)}
              style={{ width: `${Math.max((point.value / max) * 100, point.value > 0 ? 12 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string;
  tone: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/40 bg-white/85 p-5 shadow-soft dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-ink/50 dark:text-stone-400">
        {label}
      </p>
      <p className={cn("mt-3 text-3xl font-bold", tone)}>{value}</p>
      {helper ? (
        <p className="mt-2 text-sm text-brand-ink/60 dark:text-stone-400">{helper}</p>
      ) : null}
    </div>
  );
}

export function AdminApp() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [visitors, setVisitors] = useState<VisitorEvent[]>([]);
  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createEmptyProductForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [orderSavingId, setOrderSavingId] = useState<string | null>(null);
  const [inventorySavingId, setInventorySavingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function loadAdminData() {
    if (!supabase || !session) {
      return;
    }

    setDataLoading(true);
    setDataError(null);

    const bucket = getProductMediaBucket();

    try {
      const [productResponse, orderResponse, visitorResponse, mediaResponse] = await Promise.all([
        supabase.from("products").select("*").order("updated_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("visitor_events").select("*").order("created_at", { ascending: false }).limit(400),
        supabase.storage.from(bucket).list("library", {
          limit: 200,
          sortBy: { column: "updated_at", order: "desc" },
        }),
      ]);

      if (productResponse.error) {
        throw productResponse.error;
      }

      if (orderResponse.error) {
        throw orderResponse.error;
      }

      if (visitorResponse.error) {
        throw visitorResponse.error;
      }

      setProducts(((productResponse.data ?? []) as ProductRecord[]).map(normalizeProduct));
      setOrders(((orderResponse.data ?? []) as OrderRecord[]).map(normalizeOrder));
      setVisitors(((visitorResponse.data ?? []) as VisitorRecord[]).map(normalizeVisitor));

      const nextAssets =
        mediaResponse.data?.map((file) => {
          const path = `library/${file.name}`;
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);

          return {
            name: file.name,
            path,
            url: data.publicUrl,
            type: getAssetType(file.name),
            updatedAt: file.updated_at ?? undefined,
          } satisfies StorageAsset;
        }) ?? [];

      setAssets(nextAssets);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (!session) {
      setProducts([]);
      setOrders([]);
      setVisitors([]);
      setAssets([]);
      return;
    }

    void loadAdminData();
  }, [session]);

  const customerSummaries = useMemo(() => toCustomerSummaries(orders), [orders]);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalPrice, 0),
    [orders],
  );

  const uniqueVisitorCount = useMemo(
    () => new Set(visitors.map((visitor) => visitor.sessionId)).size,
    [visitors],
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((product) => (product.inventoryCount ?? 0) <= (product.inventoryThreshold ?? 5)),
    [products],
  );

  const dailyRevenue = useMemo(() => {
    const byDay = new Map<string, number>();

    orders.forEach((order) => {
      const label = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(
        new Date(order.createdAt),
      );
      byDay.set(label, (byDay.get(label) ?? 0) + order.totalPrice);
    });

    return Array.from(byDay.entries())
      .map(([label, value]) => ({ label, value }))
      .slice(0, 7)
      .reverse();
  }, [orders]);

  const topPages = useMemo(() => {
    const counts = new Map<string, number>();

    visitors.forEach((visitor) => {
      counts.set(visitor.path, (counts.get(visitor.path) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [visitors]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.id} ${product.category} ${product.sku ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [productSearch, products]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) =>
      `${order.orderNumber} ${order.name} ${order.phone} ${order.status} ${order.paymentMode}`
        .toLowerCase()
        .includes(query),
    );
  }, [orderSearch, orders]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customerSummaries;
    }

    return customerSummaries.filter((customer) =>
      `${customer.name} ${customer.phone} ${customer.address}`.toLowerCase().includes(query),
    );
  }, [customerSearch, customerSummaries]);

  const filteredVisitors = useMemo(() => {
    const query = visitorSearch.trim().toLowerCase();

    if (!query) {
      return visitors;
    }

    return visitors.filter((visitor) =>
      `${visitor.path} ${visitor.device ?? ""} ${visitor.referrer ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [visitorSearch, visitors]);

  function resetProductForm() {
    setForm(createEmptyProductForm());
    setEditingId(null);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  async function handleSaveProduct() {
    if (!supabase) {
      return;
    }

    if (!form.name.trim()) {
      setDataError("Product name is required.");
      return;
    }

    setSaveLoading(true);
    setDataError(null);

    const category = categories.find((item) => item.slug === form.categorySlug);
    const id = (editingId ?? form.id.trim()) || slugify(form.name);

    try {
      const { error } = await supabase.from("products").upsert({
        id,
        name: form.name.trim(),
        price: Number(form.price || 0),
        image: form.images[0] ?? "/brand/logo-full-color.png",
        images: form.images,
        videos: form.videos,
        description: form.description.trim(),
        category: category?.label ?? form.categorySlug,
        category_slug: form.categorySlug,
        diet: form.diet,
        sku: form.sku.trim() || null,
        inventory_count: Number(form.inventoryCount || 0),
        inventory_threshold: Number(form.inventoryThreshold || 5),
        is_active: form.isActive,
        is_featured: form.isFeatured,
      });

      if (error) {
        throw error;
      }

      await loadAdminData();
      resetProductForm();
      setActiveSection("products");
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!supabase || !window.confirm("Delete this product?")) {
      return;
    }

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        throw error;
      }

      if (editingId === id) {
        resetProductForm();
      }

      await loadAdminData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to delete product.");
    }
  }

  async function handleSeedCatalog() {
    if (!supabase) {
      return;
    }

    setSeedLoading(true);
    setDataError(null);

    try {
      const rows = starterProducts.map((product, index) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        images: product.images ?? [product.image],
        videos: product.videos ?? [],
        description: product.description,
        category: product.category,
        category_slug: product.categorySlug,
        diet: product.diet ?? "veg",
        sku: product.sku ?? `AAHA-${String(index + 1).padStart(3, "0")}`,
        inventory_count: product.inventoryCount ?? 24,
        inventory_threshold: product.inventoryThreshold ?? 5,
        is_active: product.isActive ?? true,
        is_featured: product.isFeatured ?? index < 4,
      }));

      const { error } = await supabase.from("products").upsert(rows);

      if (error) {
        throw error;
      }

      await loadAdminData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to seed starter catalog.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleUploadFiles(
    event: React.ChangeEvent<HTMLInputElement>,
    target: "images" | "videos",
  ) {
    const files = Array.from(event.target.files ?? []);

    if (!supabase || files.length === 0) {
      return;
    }

    setUploading(true);
    setDataError(null);

    try {
      const bucket = getProductMediaBucket();
      const urls: string[] = [];

      for (const file of files) {
        const extension = file.name.split(".").pop() ?? "bin";
        const safeBase = slugify(file.name.replace(/\.[^.]+$/, "")) || "asset";
        const path = `library/${Date.now()}-${safeBase}.${extension}`;

        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) {
          throw error;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      setForm((current) => ({
        ...current,
        [target]: [...current[target], ...urls],
      }));

      await loadAdminData();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to upload media.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleOrderStatusChange(orderId: string, status: OrderStatus) {
    if (!supabase) {
      return;
    }

    setOrderSavingId(orderId);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order)),
      );
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to update order status.");
    } finally {
      setOrderSavingId(null);
    }
  }

  async function handleInventoryChange(productId: string, inventoryCount: number) {
    if (!supabase) {
      return;
    }

    setInventorySavingId(productId);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          inventory_count: inventoryCount,
        })
        .eq("id", productId);

      if (error) {
        throw error;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? { ...product, inventoryCount } : product,
        ),
      );
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to update inventory.");
    } finally {
      setInventorySavingId(null);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-brand-cream px-4 py-10 dark:bg-stone-950">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-white/50 bg-white/85 p-8 shadow-soft dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-green">
            Admin Setup Needed
          </p>
          <h1 className="mt-4 font-heading text-4xl text-brand-ink dark:text-stone-100">
            Connect Supabase to unlock the admin workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-brand-ink/70 dark:text-stone-300/80">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
            create the SQL objects from <code>supabase/admin-setup.sql</code>, and create your
            admin user in Supabase Authentication. Once that is done, <code>/admin</code> becomes
            the management console for products, orders, media, customers, and visitors.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white"
            >
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream dark:bg-stone-950">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-brand-cream px-4 py-10 dark:bg-stone-950">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[2.5rem] border border-white/50 bg-white/85 p-8 shadow-soft dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-green">
              AahaFood Admin
            </p>
            <h1 className="mt-4 font-heading text-5xl leading-tight text-brand-ink dark:text-stone-100">
              Run the storefront from one clean dashboard.
            </h1>
            <p className="mt-5 text-base leading-8 text-brand-ink/70 dark:text-stone-300/80">
              Sign in with your Supabase Auth admin email to manage products, upload images or
              videos, track orders, monitor inventory, review customer data, and watch visitor
              activity.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatCard label="Modules" value="7" tone="text-brand-green" helper="Dashboard, products, orders, inventory, users, media, visitors" />
              <StatCard label="Storefront Source" value="Live" tone="text-brand-red" helper="Products can sync from Supabase instead of static JSON" />
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="rounded-[2.5rem] border border-white/50 bg-white/85 p-8 shadow-soft dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3 text-brand-green">
              <ShieldCheck className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.28em]">
                Secure Sign-In
              </span>
            </div>
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                  Admin email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                  placeholder="you@aahafood.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                  placeholder="Your Supabase Auth password"
                />
              </label>
            </div>
            {authError ? <p className="mt-4 text-sm text-red-600">{authError}</p> : null}
            <button
              type="submit"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white transition hover:bg-brand-green/90"
            >
              Sign in to admin
            </button>
            <p className="mt-4 text-xs leading-6 text-brand-ink/60 dark:text-stone-400">
              Create the admin user in Supabase Authentication first. There is no public default
              password baked into the site.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(201,226,26,0.16),transparent_24%),linear-gradient(180deg,#f5f6ee_0%,#eef2e3_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(201,226,26,0.14),transparent_24%),linear-gradient(180deg,#151915_0%,#101310_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 xl:flex-row">
        <aside className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[280px]">
          <div className="flex h-full flex-col rounded-[2.4rem] border border-white/50 bg-white/85 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="rounded-[1.8rem] bg-brand-green/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green">
                AahaFood Admin
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-ink dark:text-stone-100">
                {session.user.email}
              </p>
              <p className="mt-1 text-sm text-brand-ink/60 dark:text-stone-400">
                Store operations and growth console
              </p>
            </div>

            <nav className="mt-6 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left text-sm font-semibold transition",
                      activeSection === section.id
                        ? "bg-brand-green text-white shadow-soft"
                        : "text-brand-ink/70 hover:bg-white hover:text-brand-red dark:text-stone-300 dark:hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3">
              <button
                type="button"
                onClick={() => void loadAdminData()}
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-brand-green/20 text-sm font-semibold text-brand-green transition hover:bg-brand-green hover:text-white"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", dataLoading && "animate-spin")} />
                Refresh data
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red/90"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className="rounded-[2.4rem] border border-white/50 bg-white/85 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green">
                  {sections.find((section) => section.id === activeSection)?.label}
                </p>
                <h1 className="mt-2 font-heading text-4xl text-brand-ink dark:text-stone-100">
                  Control the catalog, orders, and storefront signals.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-ink/65 dark:text-stone-400">
                  The admin workspace is wired for Supabase-backed product management, media uploads,
                  inventory updates, order status changes, customer summaries, and visitor tracking.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-brand-green/15 bg-brand-green/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                  {products.length} products
                </span>
                <span className="rounded-full border border-brand-red/15 bg-brand-red/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-red">
                  {orders.length} orders
                </span>
                <span className="rounded-full border border-brand-ink/10 bg-brand-ink/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-ink/70 dark:text-stone-300">
                  {uniqueVisitorCount} visitors
                </span>
              </div>
            </div>
            {dataError ? (
              <div className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {dataError}
              </div>
            ) : null}
          </div>

          {activeSection === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Revenue" value={formatCurrency(revenue)} tone="text-brand-red" helper="All recorded orders" />
                <StatCard label="Orders" value={String(orders.length)} tone="text-brand-green" helper="Across WhatsApp and Razorpay flows" />
                <StatCard label="Unique Visitors" value={String(uniqueVisitorCount)} tone="text-brand-ink dark:text-stone-100" helper="Tracked page-view sessions" />
                <StatCard label="Low Stock" value={String(lowStockProducts.length)} tone="text-amber-600" helper="At or below threshold" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                        Revenue Trend
                      </p>
                      <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                        Daily order value
                      </h2>
                    </div>
                  </div>
                  <div className="mt-6">
                    <MiniBarChart points={dailyRevenue.length ? dailyRevenue : [{ label: "No data", value: 0 }]} colorClass="bg-brand-red" />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Visitor Hotspots
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                    Top viewed pages
                  </h2>
                  <div className="mt-6">
                    <MiniBarChart points={topPages.length ? topPages : [{ label: "No data", value: 0 }]} colorClass="bg-brand-green" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Recent Orders
                  </p>
                  <div className="mt-5 space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-[1.4rem] border border-brand-red/10 bg-white/70 px-4 py-3 dark:bg-white/5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-brand-ink dark:text-stone-100">
                              {order.orderNumber}
                            </p>
                            <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                              {order.name} • {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-brand-red">
                              {formatCurrency(order.totalPrice)}
                            </p>
                            <p className="text-xs uppercase tracking-[0.2em] text-brand-green">
                              {order.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 ? (
                      <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                        Orders will appear here once checkout starts saving into Supabase.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Inventory Alerts
                  </p>
                  <div className="mt-5 space-y-3">
                    {lowStockProducts.slice(0, 6).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-[1.4rem] border border-amber-400/20 bg-amber-50/70 px-4 py-3 dark:bg-amber-500/10"
                      >
                        <div>
                          <p className="font-semibold text-brand-ink dark:text-stone-100">
                            {product.name}
                          </p>
                          <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                            Threshold {product.inventoryThreshold ?? 5}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          {product.inventoryCount ?? 0} left
                        </span>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 ? (
                      <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                        Inventory levels look healthy right now.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "products" ? (
            <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                      Product Editor
                    </p>
                    <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                      {editingId ? "Edit product" : "Create product"}
                    </h2>
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="rounded-full border border-brand-red/10 px-4 py-2 text-sm font-semibold text-brand-red"
                    >
                      New
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Product name
                    </span>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                          id: editingId ? current.id : slugify(event.target.value),
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Slug
                    </span>
                    <input
                      value={form.id}
                      onChange={(event) => setForm((current) => ({ ...current, id: slugify(event.target.value) }))}
                      disabled={Boolean(editingId)}
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Price
                    </span>
                    <input
                      value={form.price}
                      onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Category
                    </span>
                    <select
                      value={form.categorySlug}
                      onChange={(event) => setForm((current) => ({ ...current, categorySlug: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    >
                      {categories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Diet
                    </span>
                    <select
                      value={form.diet}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, diet: event.target.value as Diet }))
                      }
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-vegetarian</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      SKU
                    </span>
                    <input
                      value={form.sku}
                      onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Description
                    </span>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="min-h-32 w-full rounded-2xl border border-brand-red/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Inventory count
                    </span>
                    <input
                      value={form.inventoryCount}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, inventoryCount: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-brand-ink dark:text-stone-200">
                      Low stock threshold
                    </span>
                    <input
                      value={form.inventoryThreshold}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, inventoryThreshold: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-brand-red/10 bg-white px-4 text-sm outline-none focus:border-brand-green dark:bg-white/5"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 rounded-full border border-brand-green/15 bg-brand-green/6 px-4 py-2 text-sm font-semibold text-brand-green">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                    />
                    Active
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-brand-red/15 bg-brand-red/6 px-4 py-2 text-sm font-semibold text-brand-red">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isFeatured: event.target.checked }))
                      }
                    />
                    Featured
                  </label>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-brand-red/10 bg-white/70 p-4 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-ink dark:text-stone-100">
                        Images
                      </p>
                      <label className="inline-flex cursor-pointer items-center rounded-full bg-brand-green px-3 py-2 text-xs font-semibold text-white">
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        Upload
                        <input type="file" accept="image/*" multiple hidden onChange={(event) => void handleUploadFiles(event, "images")} />
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={form.imageInput}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, imageInput: event.target.value }))
                        }
                        placeholder="Paste image URL"
                        className="h-11 flex-1 rounded-full border border-brand-red/10 bg-white px-4 text-sm outline-none dark:bg-white/5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!form.imageInput.trim()) return;
                          setForm((current) => ({
                            ...current,
                            images: [...current.images, current.imageInput.trim()],
                            imageInput: "",
                          }));
                        }}
                        className="rounded-full bg-brand-red px-4 text-sm font-semibold text-white"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {form.images.map((image) => (
                        <div key={image} className="overflow-hidden rounded-[1.2rem] border border-brand-red/10 bg-brand-cream/70 dark:bg-white/5">
                          <img src={image} alt="Product" className="aspect-[4/3] h-auto w-full object-cover" />
                          <div className="flex items-center justify-between gap-2 p-3">
                            <span className="truncate text-xs text-brand-ink/55 dark:text-stone-400">
                              {image.split("/").pop()}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  images: current.images.filter((item) => item !== image),
                                }))
                              }
                              className="text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-brand-red/10 bg-white/70 p-4 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-ink dark:text-stone-100">
                        Videos
                      </p>
                      <label className="inline-flex cursor-pointer items-center rounded-full bg-brand-green px-3 py-2 text-xs font-semibold text-white">
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        Upload
                        <input type="file" accept="video/*" multiple hidden onChange={(event) => void handleUploadFiles(event, "videos")} />
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={form.videoInput}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, videoInput: event.target.value }))
                        }
                        placeholder="Paste video URL"
                        className="h-11 flex-1 rounded-full border border-brand-red/10 bg-white px-4 text-sm outline-none dark:bg-white/5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!form.videoInput.trim()) return;
                          setForm((current) => ({
                            ...current,
                            videos: [...current.videos, current.videoInput.trim()],
                            videoInput: "",
                          }));
                        }}
                        className="rounded-full bg-brand-red px-4 text-sm font-semibold text-white"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {form.videos.map((video) => (
                        <div
                          key={video}
                          className="flex items-center justify-between rounded-[1.2rem] border border-brand-red/10 bg-brand-cream/70 px-3 py-3 text-sm dark:bg-white/5"
                        >
                          <span className="truncate text-brand-ink/60 dark:text-stone-400">
                            {video}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                videos: current.videos.filter((item) => item !== video),
                              }))
                            }
                            className="text-xs font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveProduct()}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-brand-green px-6 text-sm font-semibold text-white"
                  >
                    {saveLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save product
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSeedCatalog()}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-brand-red/10 px-6 text-sm font-semibold text-brand-red"
                  >
                    {seedLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Seed starter catalog
                  </button>
                  {uploading ? (
                    <span className="inline-flex h-12 items-center text-sm font-semibold text-brand-green">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Uploading files...
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                      Product Library
                    </p>
                    <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                      Manage the live catalog
                    </h2>
                  </div>
                  <label className="relative block min-w-[260px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40" />
                    <input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search by name, slug, SKU"
                      className="h-12 w-full rounded-full border border-brand-red/10 bg-white pl-11 pr-4 text-sm outline-none dark:bg-white/5"
                    />
                  </label>
                </div>

                <div className="mt-6 space-y-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-[1.5rem] border border-brand-red/10 bg-white/75 p-4 dark:bg-white/5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-20 w-20 rounded-[1.2rem] object-cover"
                          />
                          <div>
                            <p className="font-semibold text-brand-ink dark:text-stone-100">
                              {product.name}
                            </p>
                            <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                              {product.id} • {product.category}
                            </p>
                            <p className="mt-1 text-sm text-brand-red">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">
                            {product.inventoryCount ?? 0} in stock
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm(productToForm(product));
                              setEditingId(product.id);
                            }}
                            className="rounded-full border border-brand-green/20 px-4 py-2 text-sm font-semibold text-brand-green"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProduct(product.id)}
                            className="rounded-full border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-600"
                          >
                            <Trash2 className="mr-2 inline-flex h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                      No products found yet. Use “Seed starter catalog” or create the first one.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "orders" ? (
            <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Order Management
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                    Track and update every order
                  </h2>
                </div>
                <label className="relative block min-w-[260px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40" />
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="Search orders"
                    className="h-12 w-full rounded-full border border-brand-red/10 bg-white pl-11 pr-4 text-sm outline-none dark:bg-white/5"
                  />
                </label>
              </div>

              <div className="mt-6 space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[1.6rem] border border-brand-red/10 bg-white/75 p-5 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <p className="font-semibold text-brand-ink dark:text-stone-100">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                          {order.name} • {order.phone}
                        </p>
                        <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                          {order.address}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-green">
                          {formatDateTime(order.createdAt)} • {order.paymentMode}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-brand-red">
                          {formatCurrency(order.totalPrice)}
                        </p>
                        <select
                          value={order.status}
                          onChange={(event) =>
                            void handleOrderStatusChange(order.id, event.target.value as OrderStatus)
                          }
                          className="h-11 rounded-full border border-brand-red/10 bg-white px-4 text-sm outline-none dark:bg-white/5"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {orderSavingId === order.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin text-brand-green" />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.items.map((item, index) => (
                        <span
                          key={`${order.id}-${item.id}-${index}`}
                          className="rounded-full bg-brand-green/8 px-3 py-1 text-xs font-semibold text-brand-green"
                        >
                          {item.name} x{(item as { quantity?: number }).quantity ?? 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 ? (
                  <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                    No orders match your search yet.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeSection === "inventory" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Total SKUs" value={String(products.length)} tone="text-brand-green" />
                <StatCard label="Low Stock" value={String(lowStockProducts.length)} tone="text-amber-600" />
                <StatCard label="Out of Stock" value={String(products.filter((product) => (product.inventoryCount ?? 0) <= 0).length)} tone="text-red-600" />
              </div>

              <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                  Inventory Management
                </p>
                <div className="mt-6 space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col gap-4 rounded-[1.5rem] border border-brand-red/10 bg-white/75 p-4 dark:bg-white/5 xl:flex-row xl:items-center xl:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-brand-ink dark:text-stone-100">
                          {product.name}
                        </p>
                        <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                          SKU {product.sku || "—"} • Threshold {product.inventoryThreshold ?? 5}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={product.inventoryCount ?? 0}
                          onChange={(event) =>
                            setProducts((current) =>
                              current.map((item) =>
                                item.id === product.id
                                  ? { ...item, inventoryCount: Number(event.target.value) }
                                  : item,
                              ),
                            )
                          }
                          className="h-11 w-28 rounded-full border border-brand-red/10 bg-white px-4 text-sm outline-none dark:bg-white/5"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void handleInventoryChange(product.id, product.inventoryCount ?? 0)
                          }
                          className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save
                        </button>
                        {inventorySavingId === product.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin text-brand-green" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "customers" ? (
            <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    User Management
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                    Customer directory from live orders
                  </h2>
                </div>
                <label className="relative block min-w-[260px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40" />
                  <input
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Search customers"
                    className="h-12 w-full rounded-full border border-brand-red/10 bg-white pl-11 pr-4 text-sm outline-none dark:bg-white/5"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.key}
                    className="rounded-[1.5rem] border border-brand-red/10 bg-white/75 p-5 dark:bg-white/5"
                  >
                    <p className="font-semibold text-brand-ink dark:text-stone-100">
                      {customer.name}
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/60 dark:text-stone-400">
                      {customer.phone}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-brand-ink/60 dark:text-stone-400">
                      {customer.address}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="rounded-full bg-brand-green/8 px-3 py-1 text-xs font-semibold text-brand-green">
                        {customer.totalOrders} orders
                      </span>
                      <span className="rounded-full bg-brand-red/6 px-3 py-1 text-xs font-semibold text-brand-red">
                        {formatCurrency(customer.totalSpend)}
                      </span>
                      <span className="rounded-full bg-brand-ink/5 px-3 py-1 text-xs font-semibold text-brand-ink/70 dark:text-stone-300">
                        Last order {formatDateTime(customer.lastOrderAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredCustomers.length === 0 ? (
                  <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                    Customer records will populate as orders arrive.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeSection === "media" ? (
            <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Media Management
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                    Upload and reuse images or videos
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload image
                    <input type="file" accept="image/*" hidden onChange={(event) => void handleUploadFiles(event, "images")} />
                  </label>
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload video
                    <input type="file" accept="video/*" hidden onChange={(event) => void handleUploadFiles(event, "videos")} />
                  </label>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                  <div
                    key={asset.path}
                    className="overflow-hidden rounded-[1.5rem] border border-brand-red/10 bg-white/75 dark:bg-white/5"
                  >
                    {asset.type === "image" ? (
                      <img src={asset.url} alt={asset.name} className="aspect-[4/3] h-auto w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-brand-ink/5 text-sm font-semibold text-brand-ink/60 dark:bg-white/10 dark:text-stone-300">
                        {asset.type.toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-2 p-4">
                      <p className="truncate font-semibold text-brand-ink dark:text-stone-100">
                        {asset.name}
                      </p>
                      <p className="text-xs text-brand-ink/55 dark:text-stone-400">
                        {formatDateTime(asset.updatedAt)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (asset.type === "video") {
                            setForm((current) => ({
                              ...current,
                              videos: [...current.videos, asset.url],
                            }));
                          } else {
                            setForm((current) => ({
                              ...current,
                              images: [...current.images, asset.url],
                            }));
                          }

                          setActiveSection("products");
                        }}
                        className="rounded-full border border-brand-green/20 px-3 py-2 text-xs font-semibold text-brand-green"
                      >
                        Add to product form
                      </button>
                    </div>
                  </div>
                ))}
                {assets.length === 0 ? (
                  <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                    Upload your first asset and it will appear here.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {activeSection === "visitors" ? (
            <div className="rounded-[2rem] border border-white/50 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">
                    Visitor Management
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-brand-ink dark:text-stone-100">
                    Recent visitor events and path activity
                  </h2>
                </div>
                <label className="relative block min-w-[260px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40" />
                  <input
                    value={visitorSearch}
                    onChange={(event) => setVisitorSearch(event.target.value)}
                    placeholder="Search path or source"
                    className="h-12 w-full rounded-full border border-brand-red/10 bg-white pl-11 pr-4 text-sm outline-none dark:bg-white/5"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.5rem] border border-brand-red/10 bg-white/75 p-5 dark:bg-white/5">
                  <p className="text-sm font-semibold text-brand-ink dark:text-stone-100">
                    Device mix
                  </p>
                  <div className="mt-4">
                    <MiniBarChart
                      points={["mobile", "tablet", "desktop"].map((device) => ({
                        label: device,
                        value: visitors.filter((visitor) => visitor.device === device).length,
                      }))}
                      colorClass="bg-brand-green"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="rounded-[1.4rem] border border-brand-red/10 bg-white/75 p-4 dark:bg-white/5"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <p className="font-semibold text-brand-ink dark:text-stone-100">
                            {visitor.path}
                          </p>
                          <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                            {visitor.device || "unknown device"} • {visitor.referrer || "direct"}
                          </p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-green">
                          {formatDateTime(visitor.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredVisitors.length === 0 ? (
                    <p className="text-sm text-brand-ink/60 dark:text-stone-400">
                      Visitor events will show up here after public pages are visited.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
