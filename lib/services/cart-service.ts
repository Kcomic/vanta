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

async function reconcileAndPersist(
  items: CartItem[],
  store: typeof cartStore,
  productRepo: typeof products,
): Promise<Cart> {
  const variantsById = await loadVariants(items, productRepo);
  const next = reconcileCart(items, variantsById, new Date().toISOString());
  await store.write(next);
  return next;
}

export const cartService: CartService = {
  async getCart() {
    const current = await cartStore.read();
    return reconcileAndPersist(current.items, cartStore, products);
  },

  async addItem(variantId, quantity) {
    if (quantity <= 0) return this.getCart();
    const variant = await products.getVariantById(variantId);
    if (!variant || variant.stock <= 0) return this.getCart();

    const current = await cartStore.read();
    const existing = current.items.find((i) => i.variantId === variantId);
    const alreadyInCart = existing?.quantity ?? 0;
    // Only decrement stock by the amount we can actually add (clamped to remaining stock).
    const grantable = Math.max(0, Math.min(quantity, variant.stock - alreadyInCart));
    if (grantable > 0) {
      await products.decrementStock(variantId, grantable);
    }
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
