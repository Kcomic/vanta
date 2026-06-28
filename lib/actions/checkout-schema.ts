// Non-"use server" module: a 'use server' file may only export async functions,
// so the Zod schema + the action-state type live here and are imported by
// lib/actions/checkout-actions.ts (which re-exports the type).
import { z } from 'zod';

export type CheckoutFieldName =
  | 'email'
  | 'fullName'
  | 'line1'
  | 'line2'
  | 'city'
  | 'postalCode'
  | 'country'
  | 'phone';

/**
 * `idle` is the initial, pre-submit sentinel (no banner). `invalid_input` is a client-side
 * field-validation failure — kept DISTINCT from `empty_cart` so a bad field is never reported
 * as (or silently swallowed like) an empty cart.
 */
export type PlaceOrderActionError =
  | 'idle'
  | 'payment_declined'
  | 'empty_cart'
  | 'out_of_stock'
  | 'invalid_input';

export type PlaceOrderActionState =
  | { ok: true; orderId: string }
  // `values` echoes the submitted fields so a failed attempt (e.g. a declined card)
  // re-populates the form — React 19 resets uncontrolled <form action> inputs after a submit.
  | {
      ok: false;
      error: PlaceOrderActionError;
      values?: Partial<Record<CheckoutFieldName, string>>;
    };

/** Initial useActionState value — pre-submit, renders no error banner. */
export const INITIAL_CHECKOUT_STATE: PlaceOrderActionState = { ok: false, error: 'idle' };

const ERROR_MESSAGE_KEYS: Record<Exclude<PlaceOrderActionError, 'idle'>, string> = {
  payment_declined: 'errorDeclined',
  out_of_stock: 'errorOutOfStock',
  invalid_input: 'errorInvalidInput',
  empty_cart: 'errorEmptyCart',
};

/** PURE. Maps an action state to a `checkout` i18n message key, or null when nothing to show. */
export function checkoutErrorMessageKey(state: PlaceOrderActionState): string | null {
  if (state.ok || state.error === 'idle') return null;
  return ERROR_MESSAGE_KEYS[state.error];
}

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
