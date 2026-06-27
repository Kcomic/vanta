import { describe, it, expect, beforeEach, vi } from 'vitest';

const placeOrderSvc = vi.fn();
vi.mock('@/lib/services/checkout-service', () => ({
  checkoutService: { placeOrder: (...a: unknown[]) => placeOrderSvc(...a) },
}));

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
  it('passes validated fields to the service and returns the order id on success', async () => {
    placeOrderSvc.mockResolvedValue({ ok: true, order: { id: 'ord_abc' } });
    const result = await placeOrder(PREV, form(VALID));
    expect(result).toEqual({ ok: true, orderId: 'ord_abc' });
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

  it('surfaces a payment decline as an error state', async () => {
    placeOrderSvc.mockResolvedValue({ ok: false, error: 'payment_declined' });
    const result = await placeOrder(PREV, form({ ...VALID, paymentToken: 'tok_decline' }));
    expect(result).toEqual({ ok: false, error: 'payment_declined' });
  });

  it('returns empty_cart when validation fails (missing required field)', async () => {
    const { email, ...missingEmail } = VALID;
    const result = await placeOrder(PREV, form(missingEmail));
    expect(result).toEqual({ ok: false, error: 'empty_cart' });
    expect(placeOrderSvc).not.toHaveBeenCalled();
  });
});
