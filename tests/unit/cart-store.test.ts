import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/lib/store/cart-store';
import type { Cart } from '@/lib/domain';

const empty: Cart = {
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: 'THB' },
  updatedAt: '1970-01-01T00:00:00.000Z',
};

const server: Cart = {
  items: [{ variantId: 'var_a', quantity: 2 }],
  itemCount: 2,
  subtotal: { amount: 398000, currency: 'THB' },
  updatedAt: '2026-06-27T00:00:00.000Z',
};

beforeEach(() => {
  useCartStore.setState({ cart: empty });
});

describe('useCartStore (disciplined mirror)', () => {
  it('starts from an empty THB cart', () => {
    expect(useCartStore.getState().cart).toEqual(empty);
  });

  it('hydrate seeds the mirror from the server cart', () => {
    useCartStore.getState().hydrate(server);
    expect(useCartStore.getState().cart).toEqual(server);
  });

  it('replaceFromServer wholesale-replaces the cart', () => {
    useCartStore.getState().hydrate(empty);
    useCartStore.getState().replaceFromServer(server);
    expect(useCartStore.getState().cart).toBe(server);
  });

  it('exposes ONLY hydrate + replaceFromServer mutators (no invented state)', () => {
    const state = useCartStore.getState();
    const fnKeys = Object.keys(state).filter(
      (k) => typeof (state as Record<string, unknown>)[k] === 'function',
    );
    expect(fnKeys.sort()).toEqual(['hydrate', 'replaceFromServer']);
  });
});
