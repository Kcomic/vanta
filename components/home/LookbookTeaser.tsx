import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export async function LookbookTeaser(): Promise<React.JSX.Element> {
  const t = await getTranslations('home');
  return (
    <section data-testid="lookbook-teaser" className="bg-paper px-6 py-24 text-ink">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6">
        {/*
          Light "paper" surface — lime is forbidden here (lime-on-dark only).
          Use blaze-on-light for AA-safe contrast on paper background.
        */}
        <h2 className="display text-6xl">{t('lookbookTeaserTitle')}</h2>
        <Link
          href="/collections"
          className="font-mono text-sm uppercase tracking-[0.2em] text-blaze-on-light underline-offset-4 hover:underline"
        >
          {t('lookbookTeaserCta')}
        </Link>
      </div>
    </section>
  );
}
