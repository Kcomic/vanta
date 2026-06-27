'use client';

import React from 'react';
import type { Locale } from '@/lib/domain';
import type { CatalogCard } from '@/components/product/catalog-card';
import { ProductCard } from '@/components/product/ProductCard';

export type LookbookItem = {
  card: CatalogCard;
  title: string;
  imageUrl: string;
  imageAlt: string;
};

export function LookbookSequence({
  items,
  locale,
}: {
  items: LookbookItem[];
  locale: Locale;
}): React.JSX.Element {
  return (
    <div
      role="list"
      className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6"
    >
      {items.map((item, index) => {
        // Asymmetric editorial rhythm: every 3rd piece spans wider.
        const span = index % 3 === 0 ? 'md:col-span-7' : 'md:col-span-5';
        return (
          <div
            key={item.card.productId}
            role="listitem"
            aria-label={item.title}
            className={span}
          >
            <ul className="h-full">
              <ProductCard
                card={item.card}
                title={item.title}
                imageUrl={item.imageUrl}
                imageAlt={item.imageAlt}
                colorway={item.card.matchedColors[0] ?? ''}
                locale={locale}
                priority={index < 2}
              />
            </ul>
          </div>
        );
      })}
    </div>
  );
}
