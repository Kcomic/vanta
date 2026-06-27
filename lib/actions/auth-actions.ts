'use server';

import type { User } from '@/lib/domain';
import { getLocale } from 'next-intl/server';
import { authService, AuthError } from '@/lib/services/auth-service';
import { cartService } from '@/lib/services/cart-service';
import { redirect } from '@/lib/i18n/navigation';

export type AuthActionState =
  | { ok: true; user: User }
  | { ok: false; error: 'invalid_credentials' | 'email_taken' };

/** PURE: normalize any thrown value into a safe failed state. */
export function mapAuthError(err: unknown): Extract<AuthActionState, { ok: false }> {
  if (err instanceof AuthError && err.code === 'email_taken') {
    return { ok: false, error: 'email_taken' };
  }
  // invalid_credentials, unauthorized, forbidden, and anything unexpected
  return { ok: false, error: 'invalid_credentials' };
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  // Snapshot the guest cart before we write the session cookie.
  const guestCart = await cartService.getCart();

  try {
    await authService.login(email, password);
  } catch (err) {
    return mapAuthError(err);
  }

  // Merge guest cart items into the member cart (plain merge-on-login).
  // The session cookie is now set, so subsequent cart reads are member-scoped.
  for (const item of guestCart.items) {
    await cartService.addItem(item.variantId, item.quantity);
  }

  const locale = await getLocale();
  return redirect({ href: '/account', locale });
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '');
  try {
    await authService.register(email, password, name);
  } catch (err) {
    return mapAuthError(err);
  }
  const locale = await getLocale();
  return redirect({ href: '/account', locale });
}

export async function logout(): Promise<void> {
  await authService.logout();
  const locale = await getLocale();
  redirect({ href: '/', locale });
}
