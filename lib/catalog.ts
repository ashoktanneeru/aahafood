import { categories as fallbackCategories, products as fallbackProducts } from "@/data/products";
import { createSupabasePublicClient } from "@/lib/supabase";
import { Category, Product } from "@/lib/types";

type CategoryRecord = {
  slug: string;
  label: string;
  description: string;
  gradient: string;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
  diet: "veg" | "non-veg" | null;
  sku: string | null;
  inventory_count: number | null;
  inventory_threshold: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeCategory(record: CategoryRecord): Category {
  return {
    slug: record.slug,
    label: record.label,
    description: record.description,
    gradient: record.gradient,
    displayOrder: record.display_order ?? 0,
    isActive: record.is_active ?? true,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
  };
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
    sku: record.sku ?? undefined,
    inventoryCount: record.inventory_count ?? 0,
    inventoryThreshold: record.inventory_threshold ?? 5,
    isActive: record.is_active ?? true,
    isFeatured: record.is_featured ?? false,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
  };
}

export async function getStoreCategories() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return fallbackCategories;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("label", { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackCategories;
    }

    return (data as CategoryRecord[]).map(normalizeCategory);
  } catch {
    return fallbackCategories;
  }
}

export async function getStoreProducts() {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return fallbackProducts;
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackProducts;
    }

    return (data as ProductRecord[]).map(normalizeProduct);
  } catch {
    return fallbackProducts;
  }
}

export async function getFeaturedProducts(limit = 4) {
  const products = await getStoreProducts();
  const featured = products.filter((product) => product.isFeatured);

  if (featured.length >= limit) {
    return featured.slice(0, limit);
  }

  return products.slice(0, limit);
}

export async function getStoreProductById(id: string) {
  const products = await getStoreProducts();
  return products.find((product) => product.id === id) ?? null;
}
