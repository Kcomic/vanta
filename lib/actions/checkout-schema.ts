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

export type PlaceOrderActionState =
  | { ok: true; orderId: string }
  // `values` echoes the submitted fields so a failed attempt (e.g. a declined card)
  // re-populates the form — React 19 resets uncontrolled <form action> inputs after a submit.
  | {
      ok: false;
      error: 'payment_declined' | 'empty_cart' | 'out_of_stock';
      values?: Partial<Record<CheckoutFieldName, string>>;
    };

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
