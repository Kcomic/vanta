import { setRequestLocale, getTranslations } from 'next-intl/server';
import { products } from '@/lib/data';
import { getLocalizedText } from '@/lib/i18n/localized-text';
import { splitGraphemes } from '@/lib/motion/segment';
import type { Locale } from '@/lib/domain';
import { Link } from '@/lib/i18n/navigation';

type Props = { params: Promise<{ locale: Locale }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const tCommon = await getTranslations('Common');
  const featured = (await products.list()).slice(0, 3);

  // Per-grapheme spans use the grapheme-safe splitter (NEVER .split('')), so a
  // Thai headline keeps its combining marks welded for later per-char animation.
  const headline = t('heroHeadline');

  return (
    <main>
      <p data-testid="brand-tagline">
        {tCommon('brandName')} — {tCommon('tagline')}
      </p>

      <h1 className="display" data-testid="hero-headline" aria-label={headline}>
        {splitGraphemes(headline, locale).map((g, i) => (
          <span key={i} aria-hidden="true">
            {g}
          </span>
        ))}
      </h1>
      <p data-testid="hero-sub">{t('heroSub')}</p>

      <Link href="/shop" data-testid="shop-cta">
        {t('shopTheDrop')}
      </Link>

      <section>
        <h2 className="display" data-testid="featured-heading">
          {t('featuredHeading')}
        </h2>
        <ul data-testid="featured-list">
          {featured.map((product) => (
            <li key={product.id}>
              <Link href={`/product/${product.slug}`}>
                {getLocalizedText(product.title, locale)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
