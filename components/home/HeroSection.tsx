import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { splitGraphemes } from '@/lib/motion/segment';
import type { Locale } from '@/lib/domain';

export async function HeroSection({ locale }: { locale: Locale }): Promise<React.JSX.Element> {
  const t = await getTranslations('home');
  const headline = t('heroHeadline');
  // Grapheme-safe split: keeps Thai combining marks intact for later per-char animation.
  const graphemes = splitGraphemes(headline, locale);

  return (
    <section
      data-testid="hero"
      className="relative flex min-h-[88vh] flex-col justify-end bg-ink px-6 pb-16 pt-32 text-paper"
    >
      <p className="font-body text-xs uppercase tracking-[0.3em] text-smoke-300">
        {t('heroKicker')}
      </p>
      {/*
        Giant split-text headline. splitGraphemes ensures grapheme-safe splitting so
        combining Thai characters stay intact for later per-char animation.
        aria-label provides the full string for screen readers; individual spans are aria-hidden.
        Per-locale display token: :lang(en) => Clash Display ALL-CAPS; :lang(th) => Kanit, no caps.
      */}
      <h1
        data-testid="hero-headline"
        className="display mt-4 text-[18vw] leading-[0.82] text-paper md:text-[14vw]"
        aria-label={headline}
        lang={locale}
      >
        {graphemes.map((g, i) => (
          <span key={i} aria-hidden="true">
            {g}
          </span>
        ))}
      </h1>
      <p data-testid="hero-sub" className="mt-6 max-w-xl text-lg text-smoke-300">
        {t('heroSub')}
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button asChild variant="magnetic">
          <Link href="/shop">{t('ctaShopDrop')}</Link>
        </Button>
        <Button asChild variant="ghost-dark">
          <Link href="/collections">{t('ctaExplore')}</Link>
        </Button>
      </div>
    </section>
  );
}
