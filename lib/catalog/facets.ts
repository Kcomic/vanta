import type { Product } from '@/lib/domain';

export type CatalogFacets = {
  sizes: string[];
  colors: string[];
  priceBounds: { min: number; max: number };
};

// Canonical apparel order; sizes not in this list fall after, sorted alpha.
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function buildFacets(products: Product[]): CatalogFacets {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const product of products) {
    for (const variant of product.variants) {
      sizes.add(variant.optionValues.size);
      colors.add(variant.optionValues.color);
      if (variant.price.amount < min) min = variant.price.amount;
      if (variant.price.amount > max) max = variant.price.amount;
    }
  }

  return {
    sizes: sortSizes([...sizes]),
    colors: [...colors].sort((a, b) => a.localeCompare(b)),
    // Exposed in BAHT (whole units) — the price filter UI + URL params are in baht so users
    // type the prices they see; variantMatches converts back to satang for comparison.
    priceBounds: {
      min: Number.isFinite(min) ? Math.floor(min / 100) : 0,
      max: Number.isFinite(max) ? Math.ceil(max / 100) : 0,
    },
  };
}
