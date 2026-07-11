import type { Money } from './money';

/** Cart line references the variant (SKU), never the product. */
export type CartItem = {
  variantId: string;
  quantity: number;
};

/** Authoritative cart shape returned by every cart Server Action. */
export type Cart = {
  items: CartItem[];
  itemCount: number; // sum of quantities (derived, server-authoritative)
  subtotal: Money; // sum of unitPrice * qty
  updatedAt: string; // ISO-8601
};
