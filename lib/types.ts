export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  diet?: "veg" | "non-veg";
  description: string;
  category: string;
  categorySlug: string;
};

export type CartItem = Product & {
  quantity: number;
};
