'use client';

import React, { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { placeOrder, type PlaceOrderActionState } from '@/lib/actions/checkout-actions';
import { useCartStore } from '@/lib/store/cart-store';
import { PaymentMockForm } from './PaymentMockForm';

const INITIAL: PlaceOrderActionState = { ok: false, error: 'empty_cart' };

function SubmitButton() {
  const t = useTranslations('checkout');
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="checkout-pay"
      className="mt-8 w-full rounded-md bg-ink py-4 text-center font-mono uppercase tracking-widest text-paper disabled:opacity-60"
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
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-smoke-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        data-testid={`field-${name}`}
        className="w-full rounded-md border border-smoke-300 bg-paper px-3 py-2 text-ink focus-visible:border-ink focus-visible:outline-none"
      />
    </label>
  );
}

export function CheckoutForm() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const [state, formAction] = useActionState(placeOrder, INITIAL);

  useEffect(() => {
    if (state.ok) {
      // Cart cleared server-side; mirror the emptied cart, then go to confirmation.
      replaceFromServer({
        items: [],
        itemCount: 0,
        subtotal: { amount: 0, currency: 'THB' },
        updatedAt: new Date().toISOString(),
      });
      router.push(`/checkout/${state.orderId}`);
    }
  }, [state, router, replaceFromServer]);

  const errorKey =
    !state.ok && state.error === 'payment_declined'
      ? 'errorDeclined'
      : !state.ok && state.error === 'out_of_stock'
        ? 'errorOutOfStock'
        : null;

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
        <h2 id="contact-heading" className="display text-xl text-ink">
          {t('contactSection')}
        </h2>
        <Field name="email" label={t('email')} type="email" autoComplete="email" />
        <Field name="fullName" label={t('fullName')} autoComplete="name" />
        <Field name="line1" label={t('line1')} autoComplete="address-line1" />
        <Field name="line2" label={t('line2')} required={false} autoComplete="address-line2" />
        <div className="grid grid-cols-2 gap-4">
          <Field name="city" label={t('city')} autoComplete="address-level2" />
          <Field name="postalCode" label={t('postalCode')} autoComplete="postal-code" />
        </div>
        <Field name="country" label={t('country')} autoComplete="country" defaultValue="TH" />
        <Field name="phone" label={t('phone')} required={false} type="tel" autoComplete="tel" />
      </section>

      <section aria-labelledby="payment-heading" className="space-y-4">
        <h2 id="payment-heading" className="display text-xl text-ink">
          {t('paymentSection')}
        </h2>
        <PaymentMockForm />
      </section>

      <SubmitButton />
    </form>
  );
}
