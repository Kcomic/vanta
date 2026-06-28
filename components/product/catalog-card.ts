/**
 * Pure data utilities for CatalogCard — no React, no client APIs.
 * Exported from here so both Server Components and client components can import them.
 * ProductCard.tsx re-exports these for backward compat.
 */
import type { Product, Locale, Availability, Money, Drop, User } from '@/lib/domain';
import { CARD_ROLLUP_ORDER, deriveAvailability } from '@/lib/services/availability';

export type CatalogCard = {
  productId: string; // stable id (View Transition key origin)
  slug: string;
  fromPrice: Money; // lowest variant price among matching variants
  compareAtFromPrice: Money | null; // present => on sale
  availability: Availability; // most-buyable across matching variants (CARD_ROLLUP_ORDER)
  matchedColors: string[]; // colors that survived the filter (swatch dots)
  imageUrl: string; // first image for the first matchedColor
};

/**
 * PURE. Build a card from a product: lowest price, sale flag, most-buyable availability.
 *
 * Availability is derived LIVE via `deriveAvailability` (drop window + stock + user role) —
 * NOT the static `variant.availability` seed baseline — so catalog/search/collection cards
 * agree with the home hero and PDP once a countdown flips or early access unlocks. Mirrors
 * `deriveCatalogView`; the two are the single way a card's state is computed.
 */
export function toCatalogCard(
  product: Product,
  dropsById: Record<string, Drop>,
  now: Date,
  user: User | null,
  _locale: Locale,
): CatalogCard {
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

  // Most-buyable LIVE availability via CARD_ROLLUP_ORDER (lower index = more buyable).
  const drop = product.dropId != null ? (dropsById[product.dropId] ?? null) : null;
  let bestRollupIdx = Number.POSITIVE_INFINITY;
  let availability: Availability = 'sold_out';
  for (const v of variants) {
    const state = deriveAvailability(v, drop, now, user);
    const idx = CARD_ROLLUP_ORDER.indexOf(state);
    if (idx < bestRollupIdx) {
      bestRollupIdx = idx;
      availability = state;
    }
  }

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
