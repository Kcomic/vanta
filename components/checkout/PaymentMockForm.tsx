'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/**
 * Native uncontrolled radios named `paymentToken` — the checked radio's value is what the
 * form submits. Using the DOM's native checked state (not a React-state-mirrored hidden
 * input) makes the submitted token race-free: a click updates `checked` synchronously, so a
 * submit fired immediately after selecting a card always sends the right token. Selected
 * styling is pure CSS via `has-[:checked]`.
 */
export function PaymentMockForm() {
  const t = useTranslations('checkout');

  return (
    <fieldset className="space-y-3">
      <legend className="display text-sm text-ink">{t('paymentMethod')}</legend>

      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-ink">
        <input
          type="radio"
          name="paymentToken"
          value="tok_ok"
          defaultChecked
          className="accent-ink"
          data-testid="pay-token-ok"
        />
        <span className="text-sm">{t('testCardSuccess')}</span>
        <span className="ml-auto font-mono text-xs text-smoke-500">4242 4242 4242 4242</span>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-smoke-300 p-4 has-[:checked]:border-blaze-on-light">
        <input
          type="radio"
          name="paymentToken"
          value="tok_decline"
          className="accent-blaze-on-light"
          data-testid="pay-token-decline"
        />
        <span className="text-sm">{t('testCardDecline')}</span>
        <span className="ml-auto font-mono text-xs text-smoke-500">4000 0000 0000 0002</span>
      </label>
    </fieldset>
  );
}
