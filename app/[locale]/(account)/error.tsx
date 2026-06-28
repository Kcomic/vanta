'use client';

import { useTranslations } from 'next-intl';

/** Error boundary for the (account) route group — localized, with a retry via `reset`. */
export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[var(--max-w-shell)] flex-col items-center justify-center bg-ink px-6 py-24 text-center text-paper">
      <h1 className="display text-3xl">{t('heading')}</h1>
      <p className="mt-3 max-w-md text-smoke-300">{t('body')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-blaze px-6 py-3 font-mono uppercase tracking-widest text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      >
        {t('retry')}
      </button>
    </main>
  );
}
