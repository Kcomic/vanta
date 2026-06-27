'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import type { CatalogSort } from '@/lib/catalog/query';

const OPTIONS: CatalogSort[] = ['featured', 'price_asc', 'price_desc', 'newest'];

export function SortSelect({ value }: { value: CatalogSort }): React.JSX.Element {
  const t = useTranslations('catalog.sort');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'featured') params.delete('sort');
    else params.set('sort', next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-paper">
      <span data-testid="sort-label">{t('label')}</span>
      <select
        data-testid="sort-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="bg-smoke-700 px-2 py-1 text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {t(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}
