import type { Cart, CartItem, Variant } from '@/lib/domain';
import { cart as cartStore, products } from '@/lib/data';
import { reconcileCart } from './cart-reconcile';

export interface CartService {
  getCart(): Promise<Cart>;
  addItem(variantId: string, quantity: number): Promise<Cart>;
  updateQuantity(variantId: string, quantity: number): Promise<Cart>;
  removeItem(variantId: string): Promise<Cart>;
  clear(): Promise<Cart>;
}

async function loadVariants(
  items: CartItem[],
  productRepo: typeof products,
): Promise<Map<string, Variant>> {
  const map = new Map<string, Variant>();
  const ids = [...new Set(items.map((i) => i.variantId))];
  const found = await Promise.all(ids.map((id) => productRepo.getVariantById(id)));
  for (const variant of found) {
    if (variant) map.set(variant.id, variant);
  }
  return map;
}

/** Returns true when reconciled cart differs from what was read (items or quantities changed). */
function cartChanged(before: Cart, after: Cart): boolean {
  if (before.items.length !== after.items.length) return true;
  const afterMap = new Map(after.items.map((i) => [i.variantId, i.quantity]));
  return before.items.some((i) => afterMap.get(i.variantId) !== i.quantity);
}

async function reconcileAndPersist(
  items: CartItem[],
  store: typeof cartStore,
  productRepo: typeof products,
  original?: Cart,
): Promise<Cart> {
  const variantsById = await loadVariants(items, productRepo);
  const next = reconcileCart(items, variantsById, new Date().toISOString());
  // Only write back if the cart actually changed — avoids churning updatedAt on
  // every RSC read when nothing was reconciled away.
  if (!original || cartChanged(original, next)) {
    await store.write(next);
  }
  return next;
}

export const cartService: CartService = {
  async getCart() {
    const current = await cartStore.read();
    return reconcileAndPersist(current.items, cartStore, products, current);
  },

  async addItem(variantId, quantity) {
    if (quantity <= 0) return this.getCart();
    const variant = await products.getVariantById(variantId);
    if (!variant || variant.stock <= 0) return this.getCart();

    const current = await cartStore.read();
    const existing = current.items.find((i) => i.variantId === variantId);
    const alreadyInCart = existing?.quantity ?? 0;
    // `variant.stock` is the authoritative AVAILABLE count. The cart line is bounded by it
    // (cart can never exceed stock), but adding does NOT mutate shared stock. Decrementing
    // here double-counted the reservation against the already-decremented live stock
    // (capping incremental adds at ~half stock) and depleted the shared seed across
    // sessions/E2E runs. reconcileCart already clamps every line to live stock, so the
    // cart-vs-stock invariant is enforced consistently in one place.
    const grantable = Math.max(0, Math.min(quantity, variant.stock - alreadyInCart));
    if (grantable <= 0) return this.getCart();
    const nextItems: CartItem[] = existing
      ? current.items.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + grantable } : i,
        )
      : [...current.items, { variantId, quantity: grantable }];
    return reconcileAndPersist(nextItems, cartStore, products);
  },

  async updateQuantity(variantId, quantity) {
    const current = await cartStore.read();
    const nextItems =
      quantity <= 0
        ? current.items.filter((i) => i.variantId !== variantId)
        : current.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
    return reconcileAndPersist(nextItems, cartStore, products);
  },

  async removeItem(variantId) {
    const current = await cartStore.read();
    return reconcileAndPersist(
      current.items.filter((i) => i.variantId !== variantId),
      cartStore,
      products,
    );
  },

  async clear() {
    await cartStore.clear();
    return reconcileAndPersist([], cartStore, products);
  },
};
