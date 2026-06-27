'use server';

import { z } from 'zod';
import type { Address } from '@/lib/domain';
import { checkoutService } from '@/lib/services/checkout-service';

export type PlaceOrderActionState =
  | { ok: true; orderId: string }
  | { ok: false; error: 'payment_declined' | 'empty_cart' | 'out_of_stock' };

export const checkoutFormSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  phone: z.string().optional(),
  paymentToken: z.enum(['tok_ok', 'tok_decline']),
});

function normalizeOptional(value: FormDataEntryValue | null): string | undefined {
  if (value === null) return undefined;
  const s = String(value).trim();
  return s.length === 0 ? undefined : s;
}

export async function placeOrder(
  prevState: PlaceOrderActionState,
  formData: FormData,
): Promise<PlaceOrderActionState> {
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
    return { ok: false, error: 'empty_cart' };
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

  if (result.ok) {
    return { ok: true, orderId: result.order.id };
  }
  return { ok: false, error: result.error };
}
