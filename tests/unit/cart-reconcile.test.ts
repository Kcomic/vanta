import { describe, it, expect } from 'vitest';
import { reconcileCart } from '@/lib/services/cart-reconcile';
import type { Variant } from '@/lib/domain';

const NOW = '2026-06-27T12:00:00.000Z';

function variant(id: string, amount: number, stock: number): Variant {
  return {
    id,
    sku: id.toUpperCase(),
    optionValues: { size: 'M', color: 'black' },
    price: { amount, currency: 'THB' },
    stock,
    availability: 'live',
  };
}

const variants = new Map<string, Variant>([
  ['var_a', variant('var_a', 199000, 10)], // ฿1,990
  ['var_b', variant('var_b', 129000, 3)], // ฿1,290, only 3 left
  ['var_c', variant('var_c', 50000, 0)], // sold out
]);

describe('reconcileCart', () => {
  it('returns an empty THB cart for no items', () => {
    const cart = reconcileCart([], variants, NOW);
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotal).toEqual({ amount: 0, currency: 'THB' });
    expect(cart.updatedAt).toBe(NOW);
  });

  it('sums unitPrice * qty in integer satang', () => {
    const cart = reconcileCart(
      [
        { variantId: 'var_a', quantity: 2 },
        { variantId: 'var_b', quantity: 1 },
      ],
      variants,
      NOW,
    );
    // 199000*2 + 129000*1 = 527000  (฿5,270)
    expect(cart.subtotal).toEqual({ amount: 527000, currency: 'THB' });
    expect(cart.itemCount).toBe(3);
  });

  it('drops items whose variant no longer exists', () => {
    const cart = reconcileCart(
      [
        { variantId: 'var_a', quantity: 1 },
        { variantId: 'var_missing', quantity: 5 },
      ],
      variants,
      NOW,
    );
    expect(cart.items).toEqual([{ variantId: 'var_a', quantity: 1 }]);
    expect(cart.subtotal.amount).toBe(199000);
  });

  it('clamps quantity down to live stock', () => {
    const cart = reconcileCart([{ variantId: 'var_b', quantity: 9 }], variants, NOW);
    expect(cart.items).toEqual([{ variantId: 'var_b', quantity: 3 }]);
    expect(cart.subtotal.amount).toBe(387000); // 129000 * 3
  });

  it('drops sold-out variants entirely (clamp to 0 removes the line)', () => {
    const cart = reconcileCart([{ variantId: 'var_c', quantity: 2 }], variants, NOW);
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
  });

  it('merges duplicate variantIds into one line before clamping', () => {
    const cart = reconcileCart(
      [
        { variantId: 'var_b', quantity: 2 },
        { variantId: 'var_b', quantity: 2 },
      ],
      variants,
      NOW,
    );
    // 2+2=4 requested, clamp to stock 3
    expect(cart.items).toEqual([{ variantId: 'var_b', quantity: 3 }]);
  });
});
