import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildHomeView } from '@/lib/services/home-view';
import { HeroSection } from '@/components/home/HeroSection';
import { LiveDropSection } from '@/components/home/LiveDropSection';
import { LookbookTeaser } from '@/components/home/LookbookTeaser';
import { DropMarquee } from '@/components/drop/DropMarquee';
import { ProductCard } from '@/components/product/ProductCard';
import { toCatalogCard } from '@/components/product/catalog-card';
import { authService } from '@/lib/services/auth-service';
import { dropService } from '@/lib/services/drop-service';
import type { Locale, Drop } from '@/lib/domain';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const now = new Date();
  // Resolve the current user so the LIVE DROP reflects member early-access (deriveAvailability
  // gates early_access/low_stock/live by user role) — same as the shop and product pages.
  const user = await authService.getCurrentUser();
  const view = await buildHomeView(now, user);

  // Featured cards derive LIVE availability (deriveAvailability) — collect the drops their
  // variants reference so a gated/sold-out state matches the hero and PDP.
  const featuredDropIds = new Set<string>();
  for (const p of view.featured) if (p.dropId) featuredDropIds.add(p.dropId);
  const featuredDrops = await Promise.all(
    [...featuredDropIds].map((id) => dropService.getDropById(id)),
  );
  const dropsById: Record<string, Drop> = {};
  for (const d of featuredDrops) if (d) dropsById[d.id] = d;

  // Marquee shows SOLD OUT only when every drop lead variant is sold out.
  const allSoldOut =
    view.dropProducts.length > 0 &&
    view.dropProducts.every((p) => p.leadVariant.availability === 'sold_out');

  return (
    <>
      <HeroSection locale={locale} />
      <DropMarquee soldOut={allSoldOut} />
      <LiveDropSection view={view} locale={locale} now={now} />

      <section data-testid="featured" className="bg-ink px-6 py-20 text-paper">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="display mb-10 text-5xl">{t('featuredTitle')}</h2>
          <ul data-testid="featured-list" className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {view.featured.map((product, i) => {
              const card = toCatalogCard(product, dropsById, now, user, locale);
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
                  colorway={card.matchedColors[0] ?? ''}
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
