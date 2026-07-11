/**
 * login server action — cart handling.
 * The cart lives in a single (non-user-scoped) signed cookie, so the guest cart
 * already carries over after login. The old code replayed cartService.addItem for
 * each guest item against that same cookie, doubling quantities AND double-decrementing
 * stock. These tests pin that the merge replay is gone.
 *
 * `@/lib/i18n/navigation` is aliased to a stub whose `redirect` is a no-op, so login()
 * resolves without a real Next redirect throw.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { loginFn, getCartFn, addItemFn, getLocaleFn } = vi.hoisted(() => ({
  loginFn: vi.fn(),
  getCartFn: vi.fn(),
  addItemFn: vi.fn(),
  getLocaleFn: vi.fn(async () => 'en'),
}));

vi.mock('@/lib/services/auth-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/auth-service')>();
  return { ...actual, authService: { ...actual.authService, login: loginFn } };
});

vi.mock('@/lib/services/cart-service', () => ({
  cartService: {
    getCart: getCartFn,
    addItem: addItemFn,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('next-intl/server', () => ({ getLocale: getLocaleFn }));

import { login } from '@/lib/actions/auth-actions';

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  getLocaleFn.mockResolvedValue('en');
});

describe('login server action — cart handling', () => {
  it('does NOT replay addItem after login (shared cookie already carries the guest cart over)', async () => {
    loginFn.mockResolvedValue({
      id: 'usr_member',
      email: 'member@vanta.shop',
      name: 'Member',
      role: 'member',
      addresses: [],
    });
    getCartFn.mockResolvedValue({
      items: [{ variantId: 'var_a', quantity: 2 }],
      itemCount: 2,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    });

    await login({ ok: false, error: undefined } as never, formData({ email: 'member@vanta.shop', password: 'x' }));

    expect(addItemFn).not.toHaveBeenCalled();
  });

  it('returns a mapped error and never touches the cart when credentials are invalid', async () => {
    const { AuthError } = await import('@/lib/services/auth-service');
    loginFn.mockRejectedValue(new AuthError('invalid_credentials'));

    const result = await login(
      { ok: false, error: undefined } as never,
      formData({ email: 'x', password: 'y' }),
    );

    expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
    expect(addItemFn).not.toHaveBeenCalled();
  });
});
