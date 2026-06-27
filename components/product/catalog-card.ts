/**
 * Pure data utilities for CatalogCard — no React, no client APIs.
 * Exported from here so both Server Components and client components can import them.
 * ProductCard.tsx re-exports these for backward compat.
 */
import type { Product, Locale, Availability, Money } from '@/lib/domain';
import { CARD_ROLLUP_ORDER } from '@/lib/services/availability';

export type CatalogCard = {
  productId: string; // stable id (View Transition key origin)
  slug: string;
  fromPrice: Money; // lowest variant price among matching variants
  compareAtFromPrice: Money | null; // present => on sale
  availability: Availability; // most-buyable across matching variants (CARD_ROLLUP_ORDER)
  matchedColors: string[]; // colors that survived the filter (swatch dots)
  imageUrl: string; // first image for the first matchedColor
};

/** PURE. Build a card from a product: lowest price, sale flag, most-buyable availability. */
export function toCatalogCard(product: Product, _locale: Locale): CatalogCard {
  const variants = product.variants;

  // Product must have at least one variant (domain invariant). Guard for strict TS.
  if (variants.length === 0) {
    throw new Error(`toCatalogCard: product "${product.id}" has no variants`);
  }

  // Lowest variant price
  const first = variants[0] as NonNullable<(typeof variants)[0]>;
  const cheapest = variants.reduce(
    (lo, v) => (v.price.amount < lo.price.amount ? v : lo),
    first,
  );

  // Sale flag: present when any variant has a compareAtPrice
  const onSaleVariant = variants.find((v) => v.compareAtPrice != null) ?? null;

  // Most-buyable availability via CARD_ROLLUP_ORDER (lower index = more buyable)
  const availability = variants.reduce<Availability>((best, v) => {
    return CARD_ROLLUP_ORDER.indexOf(v.availability) < CARD_ROLLUP_ORDER.indexOf(best)
      ? v.availability
      : best;
  }, first.availability);

  // Deduplicated color list preserving insertion order
  const matchedColors = [...new Set(variants.map((v) => v.optionValues.color))];
  const firstColor = matchedColors[0] ?? '';
  const imageUrl = product.imagesByColor[firstColor]?.[0]?.url ?? '';

  return {
    productId: product.id,
    slug: product.slug,
    fromPrice: cheapest.price,
    compareAtFromPrice: onSaleVariant?.compareAtPrice ?? null,
    availability,
    matchedColors,
    imageUrl,
  };
}
