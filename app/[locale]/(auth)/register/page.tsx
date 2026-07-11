import { getTranslations } from 'next-intl/server';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from '@/lib/i18n/navigation';

export default async function RegisterPage() {
  const t = await getTranslations('Auth');

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
      <h1 className="display font-display text-4xl text-paper">{t('registerTitle')}</h1>
      <AuthForm mode="register" />
      <Link href="/login" className="font-body text-sm text-smoke-300 underline">
        {t('toLogin')}
      </Link>
    </main>
  );
}
