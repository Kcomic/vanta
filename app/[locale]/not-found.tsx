import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

/**
 * Localized 404 for any `notFound()` thrown inside a matched locale (bad product/collection
 * slug, etc.). Renders INSIDE the [locale] layout, so it inherits the brand shell, fonts and
 * translations — unlike the bare root `app/not-found.tsx`, which only catches truly
 * locale-less paths.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[var(--max-w-shell)] flex-col items-center justify-center bg-ink px-6 py-24 text-center text-paper">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime">404</p>
      <h1 className="display mt-4 text-4xl">{t('heading')}</h1>
      <p className="mt-3 max-w-md text-smoke-300">{t('body')}</p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-md bg-blaze px-6 py-3 font-mono uppercase tracking-widest text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        {t('cta')}
      </Link>
    </main>
  );
}
