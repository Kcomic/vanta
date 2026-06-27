export type ChargeInput = {
  amountMinor: number; // integer minor units
  currency: 'THB';
  paymentToken: string; // mock: 'tok_ok' charges, 'tok_decline' declines
};

export type ChargeResult =
  | { ok: true; chargeId: string }
  | { ok: false; declineCode: 'card_declined' };

/** Seam targeting Stripe/Omise. Mock adds latency + honors a declining test token. */
export interface PaymentService {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

/** Artificial network latency so the checkout spinner is observable. */
const LATENCY_MS = 700;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockPaymentService: PaymentService = {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    await delay(LATENCY_MS);

    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      return { ok: false, declineCode: 'card_declined' };
    }

    // Only the explicit success token charges; everything else declines.
    if (input.paymentToken !== 'tok_ok') {
      return { ok: false, declineCode: 'card_declined' };
    }

    const chargeId = `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    return { ok: true, chargeId };
  },
};
