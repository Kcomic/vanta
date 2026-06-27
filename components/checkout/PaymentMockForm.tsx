'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export function PaymentMockForm() {
  const t = useTranslations('checkout');
  const [token, setToken] = useState<'tok_ok' | 'tok_decline'>('tok_ok');

  return (
    <fieldset className="space-y-3">
      <legend className="display text-sm text-ink">{t('paymentMethod')}</legend>
      <input type="hidden" name="paymentToken" value={token} />

      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-ink">
        <input
          type="radio"
          name="paymentChoice"
          value="tok_ok"
          checked={token === 'tok_ok'}
          onChange={() => setToken('tok_ok')}
          className="accent-ink"
          data-testid="pay-token-ok"
        />
        <span className="text-sm">{t('testCardSuccess')}</span>
        <span className="ml-auto font-mono text-xs text-smoke-500">4242 4242 4242 4242</span>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-blaze-on-light">
        <input
          type="radio"
          name="paymentChoice"
          value="tok_decline"
          checked={token === 'tok_decline'}
          onChange={() => setToken('tok_decline')}
          className="accent-blaze-on-light"
          data-testid="pay-token-decline"
        />
        <span className="text-sm">{t('testCardDecline')}</span>
        <span className="ml-auto font-mono text-xs text-smoke-500">4000 0000 0000 0002</span>
      </label>
    </fieldset>
  );
}
