import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cart, CartItem } from '@/lib/domain';

export const CART_COOKIE_NAME = 'vanta_cart';

export const EMPTY_CART: Cart = {
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: 'THB' },
  updatedAt: '1970-01-01T00:00:00.000Z',
};

/** Only items + updatedAt are persisted; counts/subtotal are re-derived server-side. */
type CartCookiePayload = {
  items: CartItem[];
  updatedAt: string;
};

export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verify(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isCartItemArray(value: unknown): value is CartItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (it) =>
        typeof it === 'object' &&
        it !== null &&
        typeof (it as { variantId: unknown }).variantId === 'string' &&
        typeof (it as { quantity: unknown }).quantity === 'number' &&
        Number.isInteger((it as { quantity: number }).quantity) &&
        (it as { quantity: number }).quantity > 0,
    )
  );
}

export function serializeCart(cart: Cart, secret: string): string {
  const payload: CartCookiePayload = { items: cart.items, updatedAt: cart.updatedAt };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function deserializeCart(value: string | undefined, secret: string): Cart {
  if (!value) return EMPTY_CART;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return EMPTY_CART;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!verify(encoded, signature, secret)) return EMPTY_CART;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return EMPTY_CART;
  }
  if (typeof parsed !== 'object' || parsed === null) return EMPTY_CART;
  const candidate = parsed as { items?: unknown; updatedAt?: unknown };
  if (!isCartItemArray(candidate.items) || typeof candidate.updatedAt !== 'string') {
    return EMPTY_CART;
  }
  return {
    items: candidate.items,
    itemCount: 0,
    subtotal: { amount: 0, currency: 'THB' }, // service recomputes from live variant prices
    updatedAt: candidate.updatedAt,
  };
}
