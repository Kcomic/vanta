import { describe, it, expect } from 'vitest';
import {
  checkoutErrorMessageKey,
  type PlaceOrderActionState,
} from '@/lib/actions/checkout-schema';

describe('checkoutErrorMessageKey', () => {
  it('returns null for the idle (pre-submit) state — no banner on first render', () => {
    expect(checkoutErrorMessageKey({ ok: false, error: 'idle' })).toBeNull();
  });

  it('returns null on success', () => {
    expect(checkoutErrorMessageKey({ ok: true, orderId: 'ord_x' })).toBeNull();
  });

  it('maps every real failure to a visible message key (none is silently swallowed)', () => {
    const cases: Array<[PlaceOrderActionState, string]> = [
      [{ ok: false, error: 'payment_declined' }, 'errorDeclined'],
      [{ ok: false, error: 'out_of_stock' }, 'errorOutOfStock'],
      [{ ok: false, error: 'invalid_input' }, 'errorInvalidInput'],
      [{ ok: false, error: 'empty_cart' }, 'errorEmptyCart'],
    ];
    for (const [state, key] of cases) {
      expect(checkoutErrorMessageKey(state)).toBe(key);
    }
  });
});
