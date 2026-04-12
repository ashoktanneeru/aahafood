export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  categorySlug: string;
};

export type CartItem = Product & {
  quantity: number;
};
