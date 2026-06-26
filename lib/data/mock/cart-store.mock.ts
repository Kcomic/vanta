import type { Cart } from '@/lib/domain';
import type { CartStore } from '@/lib/data/repositories';

const clone = <T>(value: T): T => structuredClone(value);

function emptyCart(): Cart {
  return {
    items: [],
    itemCount: 0,
    subtotal: { amount: 0, currency: 'THB' },
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * In-memory CartStore for Phase 1 unit-testability. The cookie-backed signed
 * implementation is layered in during the cart phase behind this exact
 * interface — no consumer changes.
 */
export class MockCartStore implements CartStore {
  private cart: Cart = emptyCart();

  async read(): Promise<Cart> {
    return clone(this.cart);
  }

  async write(cart: Cart): Promise<void> {
    this.cart = clone(cart);
  }

  async clear(): Promise<void> {
    this.cart = emptyCart();
  }
}
