import React from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, Drop, Availability } from '@/lib/domain';
import { collections, products } from '@/lib/data';
import { dropService } from '@/lib/services/drop-service';
import { authService } from '@/lib/services/auth-service';
import { deriveAvailability, CARD_ROLLUP_ORDER } from '@/lib/services/availability';
import type { CatalogCard } from '@/components/product/catalog-card';
import { LookbookHero } from '@/components/collection/LookbookHero';
import { LookbookSequence, type LookbookItem } from '@/components/collection/LookbookSequence';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import type { Product, Money } from '@/lib/domain';

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const all = await collections.list();
  return routing.locales.flatMap((locale) =>
    all.map((collection) => ({ locale, slug: collection.slug })),
  );
}

function toCard(
  product: Product,
  dropsById: Record<string, Drop>,
  now: Date,
  user: Parameters<typeof deriveAvailability>[3],
): CatalogCard {
  const drop = product.dropId ? (dropsById[product.dropId] ?? null) : null;
  const first = product.variants[0]!;
  let fromPrice: Money = first.price;
  let compareAtFromPrice: Money | null = null;
  let bestRollupIdx = Number.POSITIVE_INFINITY;
  let bestAvailability: Availability = 'sold_out';
  const matchedColors = new Set<string>();

  for (const variant of product.variants) {
    matchedColors.add(variant.optionValues.color);
    if (variant.price.amount < fromPrice.amount) fromPrice = variant.price;
    if (variant.compareAtPrice && compareAtFromPrice === null) {
      compareAtFromPrice = variant.compareAtPrice;
    }
    const availability = deriveAvailability(variant, drop, now, user);
    const rollupIdx = CARD_ROLLUP_ORDER.indexOf(availability);
    if (rollupIdx < bestRollupIdx) {
      bestRollupIdx = rollupIdx;
      bestAvailability = availability;
    }
  }

  const colorList = [...matchedColors];
  const firstColor = colorList[0] ?? '';
  const imageUrl = product.imagesByColor[firstColor]?.[0]?.url ?? '';

  return {
    productId: product.id,
    slug: product.slug,
    fromPrice,
    compareAtFromPrice,
    availability: bestAvailability,
    matchedColors: colorList,
    imageUrl,
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<React.JSX.Element> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collections.detail' });

  const collection = await collections.getBySlug(slug);
  if (!collection) notFound();

  const [collectionProducts, user] = await Promise.all([
    products.listByCollection(collection.id),
    authService.getCurrentUser(),
  ]);

  const dropIds = new Set<string>();
  for (const p of collectionProducts) if (p.dropId) dropIds.add(p.dropId);
  const drops = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
  const dropsById: Record<string, Drop> = {};
  for (const d of drops) if (d) dropsById[d.id] = d;

  const now = new Date();
  const items: LookbookItem[] = collectionProducts.map((product) => {
    const card = toCard(product, dropsById, now, user);
    const firstColor = card.matchedColors[0] ?? product.optionAxes.color[0] ?? '';
    const image = (product.imagesByColor[firstColor] ?? [])[0];
    return {
      card,
      title: product.title[locale],
      imageUrl: image?.url ?? '',
      imageAlt: image?.alt[locale] ?? product.title[locale],
    };
  });

  return (
    <main className="bg-ink text-paper">
      <LookbookHero
        imageUrl={collection.heroImageUrl}
        title={collection.title[locale]}
        subtitle={collection.description[locale]}
      />

      <div className="mx-auto w-full max-w-[var(--max-w-shell)] px-4 py-12 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="display text-2xl">{t('shopThe')}</h2>
          <Link
            href="/collections"
            className="text-sm text-blaze underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
          >
            ← {t('back')}
          </Link>
        </div>
        <LookbookSequence items={items} locale={locale} />
      </div>
    </main>
  );
}
