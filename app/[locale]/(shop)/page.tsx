import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildHomeView } from '@/lib/services/home-view';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveDropSection } from '@/components/home/LiveDropSection';
import { LookbookTeaser } from '@/components/home/LookbookTeaser';
import { DropMarquee } from '@/components/drop/DropMarquee';
import { ProductCard } from '@/components/product/ProductCard';
import { toCatalogCard } from '@/components/product/catalog-card';
import type { Locale } from '@/lib/domain';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const now = new Date();
  // authService is not yet available in this phase; pass null for the guest path.
  const user = null;
  const view = await buildHomeView(now, user);

  // Marquee shows SOLD OUT only when every drop lead variant is sold out.
  const allSoldOut =
    view.dropProducts.length > 0 &&
    view.dropProducts.every((p) => p.leadVariant.availability === 'sold_out');

  return (
    <>
      <HeroSection locale={locale} />
      <DropMarquee soldOut={allSoldOut} />
      <LiveDropSection view={view} locale={locale} />

      <section data-testid="featured" className="bg-ink px-6 py-20 text-paper">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="display mb-10 text-5xl">{t('featuredTitle')}</h2>
          <ul data-testid="featured-list" className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {view.featured.map((product, i) => {
              const card = toCatalogCard(product, locale);
              return (
                <ProductCard
                  key={product.id}
                  card={card}
                  title={product.title[locale]}
                  imageUrl={card.imageUrl}
                  imageAlt={
                    product.imagesByColor[card.matchedColors[0] ?? '']?.[0]?.alt[locale] ??
                    product.title[locale]
                  }
                  locale={locale}
                  priority={i < 3}
                />
              );
            })}
          </ul>
        </div>
      </section>

      <LookbookTeaser />
    </>
  );
}
