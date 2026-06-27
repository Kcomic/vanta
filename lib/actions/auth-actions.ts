'use server';

import { getLocale } from 'next-intl/server';
import { authService } from '@/lib/services/auth-service';
import { cartService } from '@/lib/services/cart-service';
import { redirect } from '@/lib/i18n/navigation';
import { mapAuthError, type AuthActionState } from './auth-errors';

export type { AuthActionState } from './auth-errors';

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
