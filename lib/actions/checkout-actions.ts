'use server';

import { getLocale } from 'next-intl/server';
import type { Address } from '@/lib/domain';
import { checkoutService } from '@/lib/services/checkout-service';
import { redirect } from '@/lib/i18n/navigation';
import { checkoutFormSchema } from './checkout-schema';

// A "use server" file may only export async functions — re-export the type only
// (types are erased at runtime); the schema + type live in ./checkout-schema.
export type { PlaceOrderActionState } from './checkout-schema';
import type { PlaceOrderActionState } from './checkout-schema';

function normalizeOptional(value: FormDataEntryValue | null): string | undefined {
  if (value === null) return undefined;
  const s = String(value).trim();
  return s.length === 0 ? undefined : s;
}

export async function placeOrder(
  prevState: PlaceOrderActionState,
  formData: FormData,
): Promise<PlaceOrderActionState> {
  // Echo the typed fields back on any failure so the form re-populates on retry
  // (React 19 resets uncontrolled <form action> inputs after a submit).
  const submitted = {
    email: String(formData.get('email') ?? ''),
    fullName: String(formData.get('fullName') ?? ''),
    line1: String(formData.get('line1') ?? ''),
    line2: String(formData.get('line2') ?? ''),
    city: String(formData.get('city') ?? ''),
    postalCode: String(formData.get('postalCode') ?? ''),
    country: String(formData.get('country') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  };

  const parsed = checkoutFormSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    line1: formData.get('line1'),
    line2: normalizeOptional(formData.get('line2')),
    city: formData.get('city'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
    phone: normalizeOptional(formData.get('phone')),
    paymentToken: formData.get('paymentToken'),
  });

  if (!parsed.success) {
    // Client form guarantees field shape; a parse miss means nothing to charge.
    return { ok: false, error: 'empty_cart', values: submitted };
  }

  const data = parsed.data;
  const shippingAddress: Address = {
    id: '',
    fullName: data.fullName,
    line1: data.line1,
    line2: data.line2,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
    phone: data.phone,
  };

  const result = await checkoutService.placeOrder({
    email: data.email,
    shippingAddress,
    paymentToken: data.paymentToken,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, values: submitted };
  }

  // Redirect server-side so navigation is atomic with the cart-cleared revalidation
  // (a client useEffect push raced the revalidation and stranded the user on an empty checkout).
  const locale = await getLocale();
  return redirect({ href: `/checkout/${result.order.id}`, locale });
}
