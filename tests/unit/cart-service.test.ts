/**
 * cartService edge-case tests.
 * Mock @/lib/data to avoid next/headers (cookie store) in Node test env.
 * Focused on: empty cart, qty-0 removal, sold-out variant in cart.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cart, Variant } from '@/lib/domain';
import { EMPTY_CART } from '@/lib/data/mock/cart-cookie';

// vi.mock is hoisted to top of file; use vi.hoisted() for variables referenced inside factory.
const { mockCartStore, mockProducts, storedCartRef, variantA, variantSoldOut } = vi.hoisted(() => {
  const _variantA: Variant = {
    id: 'var_a',
    sku: 'VAR-A',
    optionValues: { size: 'M', color: 'Black' },
    price: { amount: 199000, currency: 'THB' },
    stock: 10,
    availability: 'live',
  };

  const _variantSoldOut: Variant = {
    id: 'var_sold_out',
    sku: 'VAR-SO',
    optionValues: { size: 'L', color: 'Black' },
    price: { amount: 99000, currency: 'THB' },
    stock: 0,
    availability: 'sold_out',
  };

  const _variantMap = new Map<string, Variant>([
    [_variantA.id, _variantA],
    [_variantSoldOut.id, _variantSoldOut],
  ]);

  // Mutable ref so tests can swap out the stored cart without re-assigning a const
  const _storedCartRef = { current: null as Cart | null };

  const _mockCartStore = {
    read: vi.fn(async () => structuredClone(_storedCartRef.current!)),
    write: vi.fn(async (cart: Cart) => {
      _storedCartRef.current = structuredClone(cart);
    }),
    clear: vi.fn(async () => {
      _storedCartRef.current = {
        items: [],
        itemCount: 0,
        subtotal: { amount: 0, currency: 'THB' },
        updatedAt: '1970-01-01T00:00:00.000Z',
      };
    }),
  };

  const _mockProducts = {
    getVariantById: vi.fn(async (id: string) => {
      const v = _variantMap.get(id);
      return v ? structuredClone(v) : null;
    }),
    decrementStock: vi.fn(async (id: string, qty: number) => {
      const v = _variantMap.get(id);
      if (!v) throw new Error(`Unknown variant ${id}`);
      v.stock -= qty;
      return structuredClone(v);
    }),
    list: vi.fn(async () => []),
    getBySlug: vi.fn(async () => null),
    getById: vi.fn(async () => null),
    getProductByVariantId: vi.fn(async () => null),
    listByCollection: vi.fn(async () => []),
    listByDrop: vi.fn(async () => []),
    search: vi.fn(async () => []),
  };

  return {
    mockCartStore: _mockCartStore,
    mockProducts: _mockProducts,
    storedCartRef: _storedCartRef,
    variantA: _variantA,
    variantSoldOut: _variantSoldOut,
  };
});

vi.mock('@/lib/data', () => ({
  cart: mockCartStore,
  products: mockProducts,
}));

// SUT imported AFTER mocks are registered
import { cartService } from '@/lib/services/cart-service';

beforeEach(() => {
  // Reset to empty cart
  storedCartRef.current = structuredClone(EMPTY_CART);
  // Reset variant stock to originals
  variantA.stock = 10;
  variantSoldOut.stock = 0;
});

describe('cartService — edge cases', () => {
  describe('empty cart', () => {
    it('getCart on an empty store returns zeroed THB cart', async () => {
      const cart = await cartService.getCart();
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toEqual({ amount: 0, currency: 'THB' });
    });

    it('clear returns a zeroed THB cart regardless of prior contents', async () => {
      storedCartRef.current = {
        items: [{ variantId: variantA.id, quantity: 2 }],
        itemCount: 2,
        subtotal: { amount: 398000, currency: 'THB' },
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const cart = await cartService.clear();
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal.amount).toBe(0);
    });
  });

  describe('qty-0 removal', () => {
    it('updateQuantity(id, 0) removes the line from the cart', async () => {
      storedCartRef.current = {
        items: [{ variantId: variantA.id, quantity: 3 }],
        itemCount: 3,
        subtotal: { amount: 597000, currency: 'THB' },
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const cart = await cartService.updateQuantity(variantA.id, 0);
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal.amount).toBe(0);
    });

    it('updateQuantity with negative qty also removes the line', async () => {
      storedCartRef.current = {
        items: [{ variantId: variantA.id, quantity: 1 }],
        itemCount: 1,
        subtotal: { amount: 199000, currency: 'THB' },
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const cart = await cartService.updateQuantity(variantA.id, -1);
      expect(cart.items).toEqual([]);
    });
  });

  describe('sold-out variant in cart', () => {
    it('getCart drops a sold-out variant that was persisted in the cookie', async () => {
      // Simulate a stale cookie: has a sold-out variant plus a live one
      storedCartRef.current = {
        items: [
          { variantId: variantSoldOut.id, quantity: 2 },
          { variantId: variantA.id, quantity: 1 },
        ],
        itemCount: 3,
        subtotal: { amount: 0, currency: 'THB' }, // raw cookie value before reconcile
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const cart = await cartService.getCart();
      // sold-out variant is reconciled away; only var_a remains
      expect(cart.items).toEqual([{ variantId: variantA.id, quantity: 1 }]);
      expect(cart.itemCount).toBe(1);
      expect(cart.subtotal.amount).toBe(199000);
    });

    it('addItem for a sold-out variant is a no-op (cart stays empty)', async () => {
      const cart = await cartService.addItem(variantSoldOut.id, 1);
      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });
  });

  describe('G2 — updateQuantity clamps to live stock at reconcile', () => {
    it('updateQuantity(id, 99) on a variant with stock 3 clamps to 3', async () => {
      // variantA has stock 10 by default; reset to 3 for this test
      variantA.stock = 3;
      storedCartRef.current = {
        items: [{ variantId: variantA.id, quantity: 1 }],
        itemCount: 1,
        subtotal: { amount: 199000, currency: 'THB' },
        updatedAt: '2026-06-27T00:00:00.000Z',
      };
      const cart = await cartService.updateQuantity(variantA.id, 99);
      expect(cart.items).toEqual([{ variantId: variantA.id, quantity: 3 }]);
      expect(cart.itemCount).toBe(3);
      // subtotal must reflect clamped quantity: 3 × 199_000 = 597_000 satang
      expect(cart.subtotal.amount).toBe(199000 * 3);
    });
  });
});
