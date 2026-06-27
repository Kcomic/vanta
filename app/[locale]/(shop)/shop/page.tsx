import React from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/domain';
import type { Drop } from '@/lib/domain';
import { products, collections } from '@/lib/data';
import { dropService } from '@/lib/services/drop-service';
import { authService } from '@/lib/services/auth-service';
import { parseCatalogQuery, deriveCatalogView } from '@/lib/catalog/query';
import { buildFacets } from '@/lib/catalog/facets';
import { CatalogGrid, type CatalogGridItem } from '@/components/product/CatalogGrid';
import { FilterRail } from '@/components/product/FilterRail';
import { SortSelect } from '@/components/product/SortSelect';

type SearchParams = Record<string, string | string[] | undefined>;

function toURLSearchParams(input: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) for (const v of value) params.append(key, v);
    else if (typeof value === 'string') params.append(key, value);
  }
  return params;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'catalog' });

  const rawSearchParams = await searchParams;
  const query = parseCatalogQuery(toURLSearchParams(rawSearchParams));

  const now = new Date();

  const [allProducts, allCollections, user, activeDrop] = await Promise.all([
    products.list(),
    collections.list(),
    authService.getCurrentUser(),
    dropService.getActiveDrop(now),
  ]);

  // Build dropId -> Drop map for availability derivation.
  const dropIds = new Set<string>();
  for (const p of allProducts) if (p.dropId) dropIds.add(p.dropId);
  const drops = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
  const dropsById: Record<string, Drop> = {};
  for (const d of drops) if (d) dropsById[d.id] = d;
  if (activeDrop) dropsById[activeDrop.id] = activeDrop;

  const view = deriveCatalogView(allProducts, query, dropsById, now, user);
  const facets = buildFacets(allProducts);

  const productById = new Map(allProducts.map((p) => [p.id, p]));
  const items: CatalogGridItem[] = view.map((card) => {
    const product = productById.get(card.productId)!;
    const color = card.matchedColors[0] ?? product.optionAxes.color[0] ?? '';
    const image = (product.imagesByColor[color] ?? [])[0];
    return {
      card,
      title: product.title[locale],
      imageUrl: image?.url ?? '',
      imageAlt: image?.alt[locale] ?? product.title[locale],
    };
  });

  const categories = allCollections.map((c) => ({ id: c.id, label: c.title[locale] }));

  return (
    <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-smoke-300">
            {t('resultCount', { count: items.length })}
          </p>
        </div>
        <SortSelect />
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <FilterRail facets={facets} categories={categories} query={query} />
        <CatalogGrid items={items} locale={locale} />
      </div>
    </main>
  );
}
