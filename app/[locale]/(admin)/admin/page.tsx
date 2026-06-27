import { getTranslations, getLocale } from 'next-intl/server';
import { requireAdmin, AuthError } from '@/lib/services/auth-service';
import { redirect } from '@/lib/i18n/navigation';

export default async function AdminPage() {
  const locale = await getLocale();
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) redirect({ href: '/login', locale });
    throw err;
  }

  const t = await getTranslations('Admin');

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="display font-display text-3xl text-paper">{t('title')}</h1>
      <p className="mt-4 font-body text-smoke-300">{t('reserved')}</p>
    </main>
  );
}
