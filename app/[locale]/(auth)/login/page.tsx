import { getTranslations } from 'next-intl/server';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from '@/lib/i18n/navigation';

export default async function LoginPage() {
  const t = await getTranslations('Auth');

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
      <h1 className="display font-display text-4xl text-paper">{t('loginTitle')}</h1>

      <section
        aria-labelledby="demo-creds"
        className="border border-lime/40 bg-smoke-900 p-4 text-paper"
      >
        <h2 id="demo-creds" className="font-mono text-sm uppercase tracking-tight text-lime">
          {t('demoHeading')}
        </h2>
        <p className="mt-1 font-body text-sm text-smoke-300">{t('demoBody')}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm">
          <dt className="text-smoke-500">{t('email')}</dt>
          <dd className="text-paper" data-testid="demo-email">
            {t('demoEmail')}
          </dd>
          <dt className="text-smoke-500">{t('password')}</dt>
          <dd className="text-paper" data-testid="demo-password">
            {t('demoPassword')}
          </dd>
        </dl>
      </section>

      <AuthForm mode="login" />

      <Link href="/register" className="font-body text-sm text-smoke-300 underline">
        {t('toRegister')}
      </Link>
    </main>
  );
}
