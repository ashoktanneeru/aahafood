import "server-only";

import { products as fallbackProducts } from "@/data/products";
import { getStoreProducts } from "@/lib/catalog";
import {
  normalizeCustomerInput as normalizeValidatedCustomerInput,
  validateCustomerInput,
} from "@/lib/customer-validation";
import type { CartItem, Product } from "@/lib/types";

export const DEFAULT_SHIPPING_FEE = 0;

export type CheckoutItemInput = {
  id: string;
  quantity: number;
};

export type CheckoutCustomerInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type CheckoutOrderInput = CheckoutCustomerInput & {
  items: CheckoutItemInput[];
};

export type PreparedCheckoutOrder = {
  customer: CheckoutCustomerInput;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

function getFallbackProductMap() {
  return new Map(fallbackProducts.map((product) => [product.id, product]));
}

async function getProductMap() {
  try {
    const products = await getStoreProducts();

    if (products.length > 0) {
      return new Map(products.map((product) => [product.id, product]));
    }
  } catch {
    // Fall back to bundled starter data if live catalog lookup fails.
  }

  return getFallbackProductMap();
}

function normalizeCheckoutCustomerInput(input: CheckoutCustomerInput): CheckoutCustomerInput {
  const customer = normalizeValidatedCustomerInput(input);
  const validation = validateCustomerInput(customer);

  if (!validation.valid) {
    throw new Error(
      validation.errors.name ??
        validation.errors.phone ??
        validation.errors.email ??
        validation.errors.address ??
        "Please provide valid customer details.",
    );
  }

  return validation.normalized;
}

function resolveCartItem(product: Product, quantity: number): CartItem {
  return {
    ...product,
    quantity,
  };
}

export async function prepareCheckoutOrder(input: CheckoutOrderInput): Promise<PreparedCheckoutOrder> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const customer = normalizeCheckoutCustomerInput(input);
  const productMap = await getProductMap();
  const resolvedItems: CartItem[] = [];

  for (const item of input.items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error("One or more cart items are invalid.");
    }

    const product = productMap.get(item.id);

    if (!product || product.isActive === false) {
      throw new Error("One or more products in your cart are no longer available.");
    }

    if (
      typeof product.inventoryCount === "number" &&
      item.quantity > Math.max(product.inventoryCount, 0)
    ) {
      throw new Error(
        product.inventoryCount <= 0
          ? `${product.name} is currently sold out.`
          : `Only ${product.inventoryCount} ${product.name} left in stock.`,
      );
    }

    resolvedItems.push(resolveCartItem(product, item.quantity));
  }

  const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = DEFAULT_SHIPPING_FEE;
  const total = subtotal + shipping;

  if (total <= 0) {
    throw new Error("Unable to create a payment for an empty total.");
  }

  return {
    customer,
    items: resolvedItems,
    subtotal,
    shipping,
    total,
  };
}
