import type { ReactNode } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { requireMember, AuthError } from '@/lib/services/auth-service';
import { redirect, Link } from '@/lib/i18n/navigation';
import { logout } from '@/lib/actions/auth-actions';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  try {
    await requireMember();
  } catch (err) {
    if (err instanceof AuthError) redirect({ href: '/login', locale });
    throw err;
  }

  const t = await getTranslations('Account');

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[200px_1fr]">
      <aside className="flex flex-col gap-2 font-body text-sm">
        <Link href="/account" className="text-paper hover:text-blaze">
          {t('navDashboard')}
        </Link>
        <Link href="/account/orders" className="text-paper hover:text-blaze">
          {t('navOrders')}
        </Link>
        <Link href="/account/addresses" className="text-paper hover:text-blaze">
          {t('navAddresses')}
        </Link>
        <Link href="/account/settings" className="text-paper hover:text-blaze">
          {t('navSettings')}
        </Link>
        <form action={logout} className="mt-4">
          <button
            type="submit"
            className="font-mono text-xs uppercase tracking-tight text-smoke-300 hover:text-blaze"
          >
            {t('logout')}
          </button>
        </form>
      </aside>
      <section>{children}</section>
    </div>
  );
}
