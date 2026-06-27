import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, Drop } from '@/lib/domain';
import { products } from '@/lib/data';
import { dropService } from '@/lib/services/drop-service';
import { authService } from '@/lib/services/auth-service';
import { buildSearchResults, normalizeSearchQuery } from '@/lib/search/results';
import { CatalogGrid, type CatalogGridItem } from '@/components/product/CatalogGrid';
import { SearchForm } from '@/components/product/SearchForm';

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'search' });

  const { q } = await searchParams;
  const query = normalizeSearchQuery(q);

  let content: React.JSX.Element;

  if (query === '') {
    content = (
      <p data-testid="search-prompt" className="py-24 text-center text-smoke-300">
        {t('prompt')}
      </p>
    );
  } else {
    const [matches, user] = await Promise.all([
      products.search(query),
      authService.getCurrentUser(),
    ]);

    const dropIds = new Set<string>();
    for (const p of matches) if (p.dropId) dropIds.add(p.dropId);
    const dropList = await Promise.all([...dropIds].map((id) => dropService.getDropById(id)));
    const dropsById: Record<string, Drop> = {};
    for (const d of dropList) if (d) dropsById[d.id] = d;

    const now = new Date();
    const results = buildSearchResults(query, matches, dropsById, now, user);

    const productById = new Map(matches.map((p) => [p.id, p]));
    const items: CatalogGridItem[] = results.cards.map((card) => {
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

    content =
      results.count === 0 ? (
        <p data-testid="search-empty" className="py-24 text-center text-smoke-300">
          {t('empty', { query: results.query })}
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-smoke-300">{t('count', { count: results.count })}</p>
          <CatalogGrid items={items} locale={locale} />
        </>
      );
  }

  return (
    <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
      <h1 className="display text-4xl">{t('title')}</h1>
      <div className="mt-6">
        <SearchForm defaultQuery={query} />
      </div>
      {query !== '' ? (
        <h2 data-testid="search-results-heading" className="mt-10 text-lg text-paper">
          {t('resultsFor', { query })}
        </h2>
      ) : null}
      <div className="mt-6">{content}</div>
    </main>
  );
}
