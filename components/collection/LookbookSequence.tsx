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
    // ProductCard renders the semantic <li>; the editorial span class is merged onto it via the
    // className prop so we keep a valid <ul><li> structure (no nested role=listitem wrapper).
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
      {items.map((item, index) => (
        <ProductCard
          key={item.card.productId}
          card={item.card}
          title={item.title}
          imageUrl={item.imageUrl}
          imageAlt={item.imageAlt}
          colorway={item.card.matchedColors[0] ?? ''}
          locale={locale}
          priority={index < 2}
          // Asymmetric editorial rhythm: every 3rd piece spans wider.
          className={index % 3 === 0 ? 'md:col-span-7' : 'md:col-span-5'}
        />
      ))}
    </ul>
  );
}
