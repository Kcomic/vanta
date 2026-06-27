'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/domain';
import type { CatalogCard } from '@/components/product/catalog-card';
import { ProductCard } from '@/components/product/ProductCard';
import { formatMoney } from '@/lib/format/money';

export type CatalogGridItem = {
  card: CatalogCard;
  title: string;
  imageUrl: string;
  imageAlt: string;
};

export function CatalogGrid({
  items,
  locale,
}: {
  items: CatalogGridItem[];
  locale: Locale;
}): React.JSX.Element {
  const t = useTranslations('catalog');

  if (items.length === 0) {
    return (
      <p data-testid="catalog-empty" className="col-span-full py-24 text-center text-smoke-300">
        {t('empty')}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.card.productId}
          data-testid="product-card"
          data-price={item.card.fromPrice.amount}
          aria-label={item.title}
        >
          {/* Expose price text for E2E price-order assertion */}
          <span data-testid="card-price" className="sr-only">
            {formatMoney(item.card.fromPrice, locale)}
          </span>
          <ProductCard
            card={item.card}
            title={item.title}
            imageUrl={item.imageUrl}
            imageAlt={item.imageAlt}
            colorway={item.card.matchedColors[0] ?? 'black'}
            locale={locale}
            priority={index < 4}
          />
        </div>
      ))}
    </ul>
  );
}
