import { describe, it, expect } from 'vitest';
import {
  EMPTY_CART,
  serializeCart,
  deserializeCart,
  signPayload,
  CART_COOKIE_NAME,
} from '@/lib/data/mock/cart-cookie';
import type { Cart } from '@/lib/domain';

const SECRET = 'test-secret-key';

const sampleCart: Cart = {
  items: [
    { variantId: 'var_tee_black_m', quantity: 2 },
    { variantId: 'var_tee_black_l', quantity: 1 },
  ],
  itemCount: 3,
  subtotal: { amount: 597000, currency: 'THB' },
  updatedAt: '2026-06-27T00:00:00.000Z',
};

describe('cart-cookie', () => {
  it('exposes a stable cookie name', () => {
    expect(CART_COOKIE_NAME).toBe('vanta_cart');
  });

  it('EMPTY_CART has zeroed THB subtotal and no items', () => {
    expect(EMPTY_CART.items).toEqual([]);
    expect(EMPTY_CART.itemCount).toBe(0);
    expect(EMPTY_CART.subtotal).toEqual({ amount: 0, currency: 'THB' });
  });

  it('round-trips a signed cart', () => {
    const value = serializeCart(sampleCart, SECRET);
    const back = deserializeCart(value, SECRET);
    expect(back.items).toEqual(sampleCart.items);
    expect(back.updatedAt).toBe(sampleCart.updatedAt);
  });

  it('returns EMPTY_CART for a missing cookie', () => {
    expect(deserializeCart(undefined, SECRET)).toEqual(EMPTY_CART);
  });

  it('returns EMPTY_CART when the signature is tampered', () => {
    const value = serializeCart(sampleCart, SECRET);
    const payload = value.split('.')[0]!;
    const forged = `${payload}.${signPayload(payload, 'wrong-secret')}`;
    expect(deserializeCart(forged, SECRET)).toEqual(EMPTY_CART);
  });

  it('returns EMPTY_CART when the payload is mutated but signature kept', () => {
    const value = serializeCart(sampleCart, SECRET);
    const sig = value.split('.')[1]!;
    const mutated = Buffer.from(JSON.stringify({ items: [], updatedAt: 'x' })).toString(
      'base64url',
    );
    expect(deserializeCart(`${mutated}.${sig}`, SECRET)).toEqual(EMPTY_CART);
  });

  it('only persists items + updatedAt in the payload (counts not trusted)', () => {
    const value = serializeCart(sampleCart, SECRET);
    const payload = value.split('.')[0]!;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    expect(Object.keys(decoded).sort()).toEqual(['items', 'updatedAt']);
  });
});
