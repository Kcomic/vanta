import type { Product, Variant, Drop, User, Availability, Money } from '@/lib/domain';
import { deriveAvailability, CARD_ROLLUP_ORDER } from '@/lib/services/availability';
import type { CatalogCard } from '@/components/product/catalog-card';

export type { CatalogCard };

export type CatalogSort = 'featured' | 'price_asc' | 'price_desc' | 'newest';

export type CatalogQuery = {
  sizes: string[];
  colors: string[];
  categories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: CatalogSort;
};

const SORTS: readonly CatalogSort[] = ['featured', 'price_asc', 'price_desc', 'newest'];

/** Parse a non-negative integer param; returns null for missing, non-integer, or negative. */
function parseNonNegativeInt(raw: string | null): number | null {
  if (raw === null) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const sortRaw = params.get('sort');
  const sort: CatalogSort = SORTS.includes(sortRaw as CatalogSort)
    ? (sortRaw as CatalogSort)
    : 'featured';
  return {
    sizes: params.getAll('size'),
    colors: params.getAll('color'),
    categories: params.getAll('category'),
    minPrice: parseNonNegativeInt(params.get('minPrice')),
    maxPrice: parseNonNegativeInt(params.get('maxPrice')),
    sort,
  };
}

function variantMatches(variant: Variant, query: CatalogQuery): boolean {
  if (query.sizes.length > 0 && !query.sizes.includes(variant.optionValues.size)) return false;
  if (query.colors.length > 0 && !query.colors.includes(variant.optionValues.color)) return false;
  if (query.minPrice !== null && variant.price.amount < query.minPrice) return false;
  if (query.maxPrice !== null && variant.price.amount > query.maxPrice) return false;
  return true;
}

function productMatchesCategory(product: Product, query: CatalogQuery): boolean {
  if (query.categories.length === 0) return true;
  return product.collectionIds.some((id) => query.categories.includes(id));
}

export function deriveCatalogView(
  products: Product[],
  query: CatalogQuery,
  dropsById: Record<string, Drop>,
  now: Date,
  user: User | null,
): CatalogCard[] {
  // Track original index for 'featured' (preserve input order) and 'newest' (reverse).
  const withIndex = products.map((product, index) => ({ product, index }));

  // CatalogCard now includes imageUrl; deriveCatalogView doesn't know the asset —
  // set '' (branded-placeholder sentinel). The page/grid overrides it from the product catalog.
  const cards: Array<CatalogCard & { _index: number }> = [];

  for (const { product, index } of withIndex) {
    if (!productMatchesCategory(product, query)) continue;

    const matched = product.variants.filter((v) => variantMatches(v, query));
    if (matched.length === 0) continue;

    const drop = product.dropId != null ? (dropsById[product.dropId] ?? null) : null;

    // Lowest price among matched variants.
    let fromPrice: Money = matched[0]!.price;
    // compareAtFromPrice: the compareAtPrice of the cheapest matched variant that has one.
    let compareAtLowestPrice = Number.POSITIVE_INFINITY;
    let compareAtFromPrice: Money | null = null;
    // Most-buyable availability via CARD_ROLLUP_ORDER (lower index = more buyable).
    let bestRollupIdx = Number.POSITIVE_INFINITY;
    let bestAvailability: Availability = 'sold_out';
    const matchedColors = new Set<string>();

    for (const variant of matched) {
      matchedColors.add(variant.optionValues.color);

      if (variant.price.amount < fromPrice.amount) {
        fromPrice = variant.price;
      }

      if (variant.compareAtPrice != null && variant.price.amount < compareAtLowestPrice) {
        compareAtLowestPrice = variant.price.amount;
        compareAtFromPrice = variant.compareAtPrice;
      }

      const availability = deriveAvailability(variant, drop, now, user);
      const rollupIdx = CARD_ROLLUP_ORDER.indexOf(availability);
      if (rollupIdx < bestRollupIdx) {
        bestRollupIdx = rollupIdx;
        bestAvailability = availability;
      }
    }

    cards.push({
      _index: index,
      productId: product.id,
      slug: product.slug,
      fromPrice,
      compareAtFromPrice,
      availability: bestAvailability,
      matchedColors: [...matchedColors],
      imageUrl: '', // placeholder sentinel; page/grid overrides from product catalog
    });
  }

  // Sort the result set.
  const sorted = [...cards];
  switch (query.sort) {
    case 'price_asc':
      sorted.sort((a, b) => a.fromPrice.amount - b.fromPrice.amount);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.fromPrice.amount - a.fromPrice.amount);
      break;
    case 'newest':
      sorted.sort((a, b) => b._index - a._index);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => a._index - b._index);
      break;
  }

  // Strip the internal index before returning.
  return sorted.map(({ _index: _i, ...card }) => card);
}
