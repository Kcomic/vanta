'use server';

import { getLocale } from 'next-intl/server';
import { authService } from '@/lib/services/auth-service';
import { redirect } from '@/lib/i18n/navigation';
import { mapAuthError, type AuthActionState } from './auth-errors';

export type { AuthActionState } from './auth-errors';

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    await authService.login(email, password);
  } catch (err) {
    return mapAuthError(err);
  }

  // No cart merge: the cart is a single signed cookie (not user-scoped), so the guest
  // cart already carries over after login. Replaying addItem here doubled every line
  // and double-decremented stock against that same cookie.
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
