import { describe, it, expect } from 'vitest';
import { mockPaymentService, type ChargeResult } from '@/lib/services/payment-service';

describe('mockPaymentService.charge', () => {
  it('charges a valid token and returns an ok result with a chargeId', async () => {
    const result: ChargeResult = await mockPaymentService.charge({
      amountMinor: 199000,
      currency: 'THB',
      paymentToken: 'tok_ok',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.chargeId).toMatch(/^ch_/);
    }
  });

  it('declines the declining test token with card_declined', async () => {
    const result: ChargeResult = await mockPaymentService.charge({
      amountMinor: 199000,
      currency: 'THB',
      paymentToken: 'tok_decline',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.declineCode).toBe('card_declined');
    }
  });

  it('declines any unknown token (only tok_ok charges)', async () => {
    const result = await mockPaymentService.charge({
      amountMinor: 5000,
      currency: 'THB',
      paymentToken: 'tok_unknown',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-positive amount before charging', async () => {
    const result = await mockPaymentService.charge({
      amountMinor: 0,
      currency: 'THB',
      paymentToken: 'tok_ok',
    });
    expect(result.ok).toBe(false);
  });

  it('adds artificial latency (>= 200ms)', async () => {
    const start = Date.now();
    await mockPaymentService.charge({
      amountMinor: 199000,
      currency: 'THB',
      paymentToken: 'tok_ok',
    });
    expect(Date.now() - start).toBeGreaterThanOrEqual(200);
  });
});
