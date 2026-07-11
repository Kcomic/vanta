'use client';

import React, { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { placeOrder } from '@/lib/actions/checkout-actions';
import {
  INITIAL_CHECKOUT_STATE,
  checkoutErrorMessageKey,
} from '@/lib/actions/checkout-schema';
import { PaymentMockForm } from './PaymentMockForm';

function SubmitButton() {
  const t = useTranslations('checkout');
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="checkout-pay"
      className="mt-8 w-full rounded-md bg-blaze py-4 text-center font-mono uppercase tracking-widest text-ink disabled:opacity-60"
    >
      {pending ? t('processing') : t('payButton')}
    </button>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = true,
  autoComplete,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-smoke-300">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`field-${name}`}
        className="w-full rounded-md border border-smoke-300 bg-paper px-3 py-2 text-ink focus-visible:border-ink focus-visible:outline-none"
      />
    </label>
  );
}

export function CheckoutForm() {
  const t = useTranslations('checkout');
  const [state, formAction] = useActionState(placeOrder, INITIAL_CHECKOUT_STATE);

  // On success, placeOrder redirects server-side to /checkout/[orderId] (atomic with the
  // cart-cleared revalidation), so the form only renders the failure branches below.
  // Every real failure (declined / out-of-stock / invalid-input / empty-cart) maps to a
  // visible message; the idle initial state shows nothing.
  const errorKey = checkoutErrorMessageKey(state);

  // Controlled fields so values survive a failed attempt (React 19 resets uncontrolled
  // <form action> inputs after a submit). Seed the country to TH.
  const [fields, setFields] = useState<Record<string, string>>({ country: 'TH' });
  const setField = (name: string) => (value: string) => setFields((f) => ({ ...f, [name]: value }));

  return (
    <form action={formAction} className="space-y-10">
      {errorKey && (
        <p
          role="alert"
          data-testid="checkout-error"
          className="rounded-md border border-blaze-on-light bg-blaze-on-light/10 px-4 py-3 text-sm text-blaze-on-light"
        >
          {t(errorKey)}
        </p>
      )}

      <section aria-labelledby="contact-heading" className="space-y-4">
        <h2 id="contact-heading" className="display text-xl text-paper">
          {t('contactSection')}
        </h2>
        <Field name="email" label={t('email')} type="email" autoComplete="email" value={fields.email ?? ''} onChange={setField('email')} />
        <Field name="fullName" label={t('fullName')} autoComplete="name" value={fields.fullName ?? ''} onChange={setField('fullName')} />
        <Field name="line1" label={t('line1')} autoComplete="address-line1" value={fields.line1 ?? ''} onChange={setField('line1')} />
        <Field name="line2" label={t('line2')} required={false} autoComplete="address-line2" value={fields.line2 ?? ''} onChange={setField('line2')} />
        <div className="grid grid-cols-2 gap-4">
          <Field name="city" label={t('city')} autoComplete="address-level2" value={fields.city ?? ''} onChange={setField('city')} />
          <Field name="postalCode" label={t('postalCode')} autoComplete="postal-code" value={fields.postalCode ?? ''} onChange={setField('postalCode')} />
        </div>
        <Field name="country" label={t('country')} autoComplete="country" value={fields.country ?? ''} onChange={setField('country')} />
        <Field name="phone" label={t('phone')} required={false} type="tel" autoComplete="tel" value={fields.phone ?? ''} onChange={setField('phone')} />
      </section>

      <section aria-labelledby="payment-heading" className="space-y-4">
        <h2 id="payment-heading" className="display text-xl text-paper">
          {t('paymentSection')}
        </h2>
        <PaymentMockForm />
      </section>

      <SubmitButton />
    </form>
  );
}
