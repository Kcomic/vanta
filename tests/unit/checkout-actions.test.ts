import { describe, it, expect, beforeEach, vi } from 'vitest';

const placeOrderSvc = vi.fn();
vi.mock('@/lib/services/checkout-service', () => ({
  checkoutService: { placeOrder: (...a: unknown[]) => placeOrderSvc(...a) },
}));

// placeOrder redirects server-side on success; mock the locale + redirect seam.
vi.mock('next-intl/server', () => ({ getLocale: () => Promise.resolve('en') }));
const redirectMock = vi.fn((arg: unknown) => {
  throw new Error(`NEXT_REDIRECT:${JSON.stringify(arg)}`);
});
vi.mock('@/lib/i18n/navigation', () => ({ redirect: (arg: unknown) => redirectMock(arg) }));

import { placeOrder, type PlaceOrderActionState } from '@/lib/actions/checkout-actions';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID = {
  email: 'a@b.co',
  fullName: 'Somchai Jaidee',
  line1: '99 Sukhumvit Rd',
  city: 'Bangkok',
  postalCode: '10110',
  country: 'TH',
  paymentToken: 'tok_ok',
};

const PREV: PlaceOrderActionState = { ok: false, error: 'empty_cart' };

beforeEach(() => vi.clearAllMocks());

describe('placeOrder action', () => {
  it('passes validated fields to the service and redirects to the confirmation on success', async () => {
    placeOrderSvc.mockResolvedValue({ ok: true, order: { id: 'ord_abc' } });
    // Success redirects server-side (throws NEXT_REDIRECT) rather than returning an ok state.
    await expect(placeOrder(PREV, form(VALID))).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith({ href: '/checkout/ord_abc', locale: 'en' });
    expect(placeOrderSvc).toHaveBeenCalledWith({
      email: 'a@b.co',
      shippingAddress: {
        id: '',
        fullName: 'Somchai Jaidee',
        line1: '99 Sukhumvit Rd',
        line2: undefined,
        city: 'Bangkok',
        postalCode: '10110',
        country: 'TH',
        phone: undefined,
      },
      paymentToken: 'tok_ok',
    });
  });

  it('surfaces a payment decline as an error state (no redirect) and echoes the fields back', async () => {
    placeOrderSvc.mockResolvedValue({ ok: false, error: 'payment_declined' });
    const result = await placeOrder(PREV, form({ ...VALID, paymentToken: 'tok_decline' }));
    expect(result).toMatchObject({ ok: false, error: 'payment_declined' });
    // Fields are echoed so the form re-populates on retry (React 19 resets <form action>).
    expect(result.ok === false && result.values).toMatchObject({
      email: 'a@b.co',
      fullName: 'Somchai Jaidee',
      city: 'Bangkok',
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('returns empty_cart when validation fails (missing required field)', async () => {
    const { email, ...missingEmail } = VALID;
    void email;
    const result = await placeOrder(PREV, form(missingEmail));
    expect(result).toMatchObject({ ok: false, error: 'empty_cart' });
    expect(placeOrderSvc).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
