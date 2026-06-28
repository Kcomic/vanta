import { cookies } from 'next/headers';
import type { Cart } from '@/lib/domain';
import type { CartStore } from '@/lib/data/repositories/cart-store';
import { CART_COOKIE_NAME, EMPTY_CART, deserializeCart, serializeCart } from './cart-cookie';

// The cart cookie is HMAC-signed; the dev fallback secret is published in source, so a
// production deploy that forgets to set CART_COOKIE_SECRET would let anyone forge cart
// payloads. Fail CLOSED at runtime boot in production (mirrors lib/services/session.ts);
// the NEXT_PHASE guard skips this during `next build` so the build needs no secret.
const isProdRuntime =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build';
if (isProdRuntime && !process.env.CART_COOKIE_SECRET) {
  throw new Error(
    '[vanta] CART_COOKIE_SECRET is required in production. Set it to a long random string ' +
      'before deploying.',
  );
}
const SECRET = process.env.CART_COOKIE_SECRET ?? 'vanta-dev-cart-secret';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export class MockCartStore implements CartStore {
  async read(): Promise<Cart> {
    const store = await cookies();
    const raw = store.get(CART_COOKIE_NAME)?.value;
    return deserializeCart(raw, SECRET);
  }

  async write(cart: Cart): Promise<void> {
    const store = await cookies();
    store.set(CART_COOKIE_NAME, serializeCart(cart, SECRET), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE,
    });
  }

  async clear(): Promise<void> {
    const store = await cookies();
    store.set(CART_COOKIE_NAME, serializeCart(EMPTY_CART, SECRET), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
}
