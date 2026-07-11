/**
 * B1 — Header cart badge reads from the Zustand store via useCartCount.
 *
 * useCartCount() is a Zustand selector hook — it cannot be called outside a
 * React component in the Node test environment. We verify the underlying store
 * state that the selector reads, which is identical to what the hook returns.
 *
 * The end-to-end path is:
 *   CartHydrator calls hydrate → store.cart.itemCount updated
 *   → useCartCount() returns state.cart.itemCount
 *   → Header renders {count} in the badge span.
 *
 * cart-store.test.ts already covers hydrate/replaceFromServer correctness.
 * This file focuses on the selector projection (itemCount extraction) and the
 * badge-relevant invariant: the count tracks every hydrate and replaceFromServer.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/lib/store/cart-store';
import type { Cart } from '@/lib/domain';

const empty: Cart = {
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: 'THB' },
  updatedAt: '1970-01-01T00:00:00.000Z',
};

/** Read itemCount the same way useCartCount() does (state.cart.itemCount). */
function readCount(): number {
  return useCartStore.getState().cart.itemCount;
}

beforeEach(() => {
  useCartStore.setState({ cart: empty });
});

describe('cart badge count (B1 — store itemCount reflects server truth)', () => {
  it('starts at 0 before hydration', () => {
    expect(readCount()).toBe(0);
  });

  it('reflects itemCount after hydrate — badge shows server count', () => {
    const serverCart: Cart = {
      items: [
        { variantId: 'var_a', quantity: 2 },
        { variantId: 'var_b', quantity: 1 },
      ],
      itemCount: 3,
      subtotal: { amount: 527000, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    useCartStore.getState().hydrate(serverCart);
    expect(readCount()).toBe(3);
  });

  it('reflects itemCount after replaceFromServer — badge updates on mutation', () => {
    const after: Cart = {
      items: [{ variantId: 'var_a', quantity: 5 }],
      itemCount: 5,
      subtotal: { amount: 995000, currency: 'THB' },
      updatedAt: '2026-06-27T01:00:00.000Z',
    };
    useCartStore.getState().replaceFromServer(after);
    expect(readCount()).toBe(5);
  });

  it('returns 0 after replaceFromServer resets to empty cart', () => {
    useCartStore.getState().hydrate({
      items: [{ variantId: 'var_a', quantity: 2 }],
      itemCount: 2,
      subtotal: { amount: 398000, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    });
    useCartStore.getState().replaceFromServer(empty);
    expect(readCount()).toBe(0);
  });

  it('itemCount equals the sum of all item quantities', () => {
    const multi: Cart = {
      items: [
        { variantId: 'var_a', quantity: 3 },
        { variantId: 'var_b', quantity: 4 },
        { variantId: 'var_c', quantity: 1 },
      ],
      itemCount: 8,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    useCartStore.getState().hydrate(multi);
    expect(readCount()).toBe(multi.items.reduce((n, i) => n + i.quantity, 0));
  });
});
