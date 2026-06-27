'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import type { CatalogFacets } from '@/lib/catalog/facets';
import type { CatalogQuery } from '@/lib/catalog/query';

export function FilterRail({
  facets,
  categories,
  query,
}: {
  facets: CatalogFacets;
  categories: { id: string; label: string }[];
  query: CatalogQuery;
}): React.JSX.Element {
  const t = useTranslations('catalog.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleMulti(key: 'size' | 'color' | 'category', value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const current = next.getAll(key);
    next.delete(key);
    const after = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    for (const v of after) next.append(key, v);
    commit(next);
  }

  function setPrice(key: 'minPrice' | 'maxPrice', raw: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    if (/^\d+$/.test(raw)) next.set(key, raw);
    commit(next);
  }

  function clearAll() {
    const next = new URLSearchParams();
    const sort = searchParams.get('sort');
    if (sort) next.set('sort', sort);
    commit(next);
  }

  return (
    <aside aria-label={t('heading')} className="flex flex-col gap-6 text-paper">
      <h2 className="display text-lg">{t('heading')}</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-smoke-300">{t('size')}</legend>
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => {
            const active = query.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                data-testid={`filter-size-${size}`}
                aria-pressed={active}
                onClick={() => toggleMulti('size', size)}
                className={[
                  'min-w-10 px-3 py-1 text-sm font-[family-name:var(--font-mono)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                  active ? 'bg-paper text-ink' : 'bg-smoke-700 text-paper',
                ].join(' ')}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-smoke-300">{t('color')}</legend>
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((color) => {
            const active = query.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                data-testid={`filter-color-${color}`}
                aria-pressed={active}
                onClick={() => toggleMulti('color', color)}
                className={[
                  'px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                  active ? 'bg-paper text-ink' : 'bg-smoke-700 text-paper',
                ].join(' ')}
              >
                {color}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-smoke-300">{t('category')}</legend>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const active = query.categories.includes(cat.id);
            return (
              <label key={cat.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  data-testid={`filter-category-${cat.id}`}
                  checked={active}
                  onChange={() => toggleMulti('category', cat.id)}
                  className="accent-blaze"
                />
                {cat.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-smoke-300">{t('price')}</legend>
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-sm">
          <input
            type="number"
            inputMode="numeric"
            min={facets.priceBounds.min}
            max={facets.priceBounds.max}
            placeholder={t('minPrice')}
            defaultValue={query.minPrice ?? ''}
            data-testid="filter-min-price"
            onBlur={(e) => setPrice('minPrice', e.currentTarget.value)}
            className="w-24 bg-smoke-700 px-2 py-1 text-paper"
          />
          <span aria-hidden="true">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={facets.priceBounds.min}
            max={facets.priceBounds.max}
            placeholder={t('maxPrice')}
            defaultValue={query.maxPrice ?? ''}
            data-testid="filter-max-price"
            onBlur={(e) => setPrice('maxPrice', e.currentTarget.value)}
            className="w-24 bg-smoke-700 px-2 py-1 text-paper"
          />
        </div>
      </fieldset>

      <button
        type="button"
        onClick={clearAll}
        data-testid="filter-clear"
        className="self-start text-sm text-blaze underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        {t('clear')}
      </button>
    </aside>
  );
}
