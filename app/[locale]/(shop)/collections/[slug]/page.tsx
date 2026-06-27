import React from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/domain';
import { collections, products } from '@/lib/data';
import { toCatalogCard } from '@/components/product/catalog-card';
import { LookbookHero } from '@/components/collection/LookbookHero';
import { LookbookSequence, type LookbookItem } from '@/components/collection/LookbookSequence';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const all = await collections.list();
  return routing.locales.flatMap((locale) =>
    all.map((collection) => ({ locale, slug: collection.slug })),
  );
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

  const collectionProducts = await products.listByCollection(collection.id);

  const items: LookbookItem[] = collectionProducts.map((product) => {
    const card = toCatalogCard(product, locale);
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
