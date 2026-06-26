/**
 * B2 — Optimistic cart reducer recomputes subtotal from line unit prices.
 *
 * CartDrawer and CartPageClient share the same reducer shape. We test the
 * pure reducer logic directly (without React / useOptimistic) by replicating
 * the exact reducer body used in both components.
 *
 * Key invariants:
 *   - Changing qty on a line updates subtotal correctly (no stale value).
 *   - Removing a line (qty → 0) drops it and subtracts its amount from subtotal.
 *   - itemCount tracks the total unit count across all lines.
 */
import { describe, it, expect } from 'vitest';
import type { Cart } from '@/lib/domain';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

/** Prices in integer satang (1 THB = 100 satang). ฿1,990 = 199_000. */
const PRICE_A = 199_000; // ฿1,990
const PRICE_B = 299_000; // ฿2,990

/** viewById map that both CartDrawer and CartPageClient build before useOptimistic. */
const viewById = new Map([
  ['var_a', { variantId: 'var_a', unitPrice: { amount: PRICE_A, currency: 'THB' } }],
  ['var_b', { variantId: 'var_b', unitPrice: { amount: PRICE_B, currency: 'THB' } }],
]);

/** Exact reducer body copied from CartDrawer / CartPageClient (B2 fix). */
function applyQuantityAction(
  state: Cart,
  action: { variantId: string; quantity: number },
): Cart {
  const items = state.items
    .map((i) => (i.variantId === action.variantId ? { ...i, quantity: action.quantity } : i))
    .filter((i) => i.quantity > 0);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotalAmount = items.reduce(
    (sum, i) => sum + (viewById.get(i.variantId)?.unitPrice.amount ?? 0) * i.quantity,
    0,
  );
  return { ...state, items, itemCount, subtotal: { amount: subtotalAmount, currency: 'THB' } };
}

// ---------------------------------------------------------------------------
// Initial cart state for tests
// ---------------------------------------------------------------------------

const initialCart: Cart = {
  items: [
    { variantId: 'var_a', quantity: 2 }, // 2 × ฿1,990 = ฿3,980
    { variantId: 'var_b', quantity: 1 }, // 1 × ฿2,990 = ฿2,990
  ],
  itemCount: 3,
  subtotal: { amount: PRICE_A * 2 + PRICE_B * 1, currency: 'THB' }, // ฿6,970
  updatedAt: '2026-06-27T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('optimistic cart reducer (B2 — subtotal recomputation)', () => {
  it('changing qty 2→3 on a ฿1,990 line updates subtotal to ฿7,960 + ฿2,990', () => {
    const next = applyQuantityAction(initialCart, { variantId: 'var_a', quantity: 3 });
    // 3 × 199_000 + 1 × 299_000 = 597_000 + 299_000 = 896_000 satang (฿8,960)
    expect(next.subtotal).toEqual({ amount: PRICE_A * 3 + PRICE_B * 1, currency: 'THB' });
    expect(next.itemCount).toBe(4);
    expect(next.items).toEqual([
      { variantId: 'var_a', quantity: 3 },
      { variantId: 'var_b', quantity: 1 },
    ]);
  });

  it('changing qty 2→3 on a single-item cart of ฿1,990 gives subtotal ฿5,970', () => {
    const singleItem: Cart = {
      items: [{ variantId: 'var_a', quantity: 2 }],
      itemCount: 2,
      subtotal: { amount: PRICE_A * 2, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    const next = applyQuantityAction(singleItem, { variantId: 'var_a', quantity: 3 });
    expect(next.subtotal).toEqual({ amount: PRICE_A * 3, currency: 'THB' }); // 597_000 satang
    expect(next.itemCount).toBe(3);
  });

  it('removing a line (qty → 0) drops the line and subtracts its amount from subtotal', () => {
    const next = applyQuantityAction(initialCart, { variantId: 'var_a', quantity: 0 });
    // only var_b remains: 1 × 299_000
    expect(next.items).toEqual([{ variantId: 'var_b', quantity: 1 }]);
    expect(next.subtotal).toEqual({ amount: PRICE_B, currency: 'THB' });
    expect(next.itemCount).toBe(1);
  });

  it('removing the only line yields an empty cart with zero subtotal', () => {
    const singleItem: Cart = {
      items: [{ variantId: 'var_a', quantity: 2 }],
      itemCount: 2,
      subtotal: { amount: PRICE_A * 2, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    const next = applyQuantityAction(singleItem, { variantId: 'var_a', quantity: 0 });
    expect(next.items).toEqual([]);
    expect(next.subtotal).toEqual({ amount: 0, currency: 'THB' });
    expect(next.itemCount).toBe(0);
  });

  it('unknown variantId in viewById falls back to 0 price (no NaN)', () => {
    const cartWithUnknown: Cart = {
      items: [{ variantId: 'var_unknown', quantity: 1 }],
      itemCount: 1,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };
    const next = applyQuantityAction(cartWithUnknown, { variantId: 'var_unknown', quantity: 2 });
    expect(next.subtotal.amount).toBe(0); // not NaN
    expect(typeof next.subtotal.amount).toBe('number');
  });

  it('non-targeted lines are left unchanged', () => {
    const next = applyQuantityAction(initialCart, { variantId: 'var_b', quantity: 3 });
    // var_a stays at qty 2; var_b goes to 3
    expect(next.items).toEqual([
      { variantId: 'var_a', quantity: 2 },
      { variantId: 'var_b', quantity: 3 },
    ]);
    expect(next.subtotal).toEqual({ amount: PRICE_A * 2 + PRICE_B * 3, currency: 'THB' });
  });
});
