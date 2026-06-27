import { describe, it, expect } from 'vitest';
import { parseCatalogQuery, deriveCatalogView } from '@/lib/catalog/query';
import { buildFacets } from '@/lib/catalog/facets';
import type { Product, Variant, Drop, Money } from '@/lib/domain';

const thb = (amount: number): Money => ({ amount, currency: 'THB' });

function variant(over: Partial<Variant> & Pick<Variant, 'id'>): Variant {
  return {
    sku: `SKU-${over.id}`,
    optionValues: { size: 'M', color: 'Black' },
    price: thb(199000),
    stock: 10,
    availability: 'live',
    ...over,
  };
}

function product(over: Partial<Product> & Pick<Product, 'id' | 'slug'>): Product {
  return {
    title: { en: 'Tee', th: 'เสื้อ' },
    description: { en: '', th: '' },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Black'] },
    variants: [variant({ id: `${over.id}-v1` })],
    imagesByColor: { Black: [] },
    collectionIds: ['col_core'],
    ...over,
  };
}

describe('parseCatalogQuery', () => {
  it('reads multi-value axes, price window, and sort with defaults', () => {
    const q = parseCatalogQuery(
      new URLSearchParams(
        'size=S&size=L&color=Black&category=col_core&minPrice=100000&maxPrice=300000&sort=price_asc',
      ),
    );
    expect(q).toEqual({
      sizes: ['S', 'L'],
      colors: ['Black'],
      categories: ['col_core'],
      minPrice: 100000,
      maxPrice: 300000,
      sort: 'price_asc',
    });
  });

  it('defaults to empty filters and featured sort, and rejects unknown sort', () => {
    expect(parseCatalogQuery(new URLSearchParams(''))).toEqual({
      sizes: [],
      colors: [],
      categories: [],
      minPrice: null,
      maxPrice: null,
      sort: 'featured',
    });
    expect(parseCatalogQuery(new URLSearchParams('sort=bogus')).sort).toBe('featured');
  });

  it('ignores non-integer / negative price bounds', () => {
    const q = parseCatalogQuery(new URLSearchParams('minPrice=abc&maxPrice=-5'));
    expect(q.minPrice).toBeNull();
    expect(q.maxPrice).toBeNull();
  });
});

describe('deriveCatalogView', () => {
  const now = new Date('2026-06-27T00:00:00Z');

  it('returns one card per product with fromPrice = lowest matching variant price', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'p1-a', price: thb(199000) }),
        variant({ id: 'p1-b', price: thb(149000) }),
      ],
    });
    const view = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('')),
      {},
      now,
      null,
    );
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({ productId: 'p1', slug: 'tee', fromPrice: thb(149000) });
  });

  it('filters by size (variant axis) and drops products with no matching variant', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'p1-s', optionValues: { size: 'S', color: 'Black' } }),
        variant({ id: 'p1-l', optionValues: { size: 'L', color: 'Black' } }),
      ],
    });
    const onlyMissing = product({
      id: 'p2',
      slug: 'cap',
      variants: [variant({ id: 'p2-m', optionValues: { size: 'M', color: 'Black' } })],
    });
    const view = deriveCatalogView(
      [p, onlyMissing],
      parseCatalogQuery(new URLSearchParams('size=S')),
      {},
      now,
      null,
    );
    expect(view.map((c) => c.productId)).toEqual(['p1']);
  });

  it('filters by category (collectionIds) and color, and price window is inclusive', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      collectionIds: ['col_drop'],
      variants: [
        variant({ id: 'p1-w', optionValues: { size: 'M', color: 'White' }, price: thb(120000) }),
        variant({ id: 'p1-b', optionValues: { size: 'M', color: 'Black' }, price: thb(300000) }),
      ],
    });
    const byColor = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('color=White')),
      {},
      now,
      null,
    );
    expect(byColor[0]!.fromPrice).toEqual(thb(120000));
    expect(byColor[0]!.matchedColors).toEqual(['White']);

    const byCategory = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('category=col_drop')),
      {},
      now,
      null,
    );
    expect(byCategory).toHaveLength(1);

    const byPrice = deriveCatalogView(
      [p],
      // minPrice/maxPrice are in BAHT; ฿3000 matches the Black variant priced at 300000 satang.
      parseCatalogQuery(new URLSearchParams('minPrice=3000&maxPrice=3000')),
      {},
      now,
      null,
    );
    expect(byPrice[0]!.matchedColors).toEqual(['Black']);
  });

  it('sets compareAtFromPrice from the lowest matching variant that has compareAtPrice', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'p1-a', price: thb(149000), compareAtPrice: thb(199000) }),
        variant({ id: 'p1-b', price: thb(159000) }),
      ],
    });
    const view = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('')),
      {},
      now,
      null,
    );
    expect(view[0]!.compareAtFromPrice).toEqual(thb(199000));
  });

  it('rolls availability up to the most buyable matching variant', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'p1-out', stock: 0, availability: 'sold_out' }),
        variant({ id: 'p1-low', stock: 3, availability: 'low_stock' }),
      ],
    });
    const view = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('')),
      {},
      now,
      null,
    );
    expect(view[0]!.availability).toBe('low_stock'); // low_stock is more buyable than sold_out
  });

  it('sorts price_asc by fromPrice and newest by reverse input order', () => {
    const cheap = product({
      id: 'a',
      slug: 'a',
      variants: [variant({ id: 'a-v', price: thb(100000) })],
    });
    const dear = product({
      id: 'b',
      slug: 'b',
      variants: [variant({ id: 'b-v', price: thb(500000) })],
    });
    const asc = deriveCatalogView(
      [dear, cheap],
      parseCatalogQuery(new URLSearchParams('sort=price_asc')),
      {},
      now,
      null,
    );
    expect(asc.map((c) => c.productId)).toEqual(['a', 'b']);
    const newest = deriveCatalogView(
      [cheap, dear],
      parseCatalogQuery(new URLSearchParams('sort=newest')),
      {},
      now,
      null,
    );
    expect(newest.map((c) => c.productId)).toEqual(['b', 'a']);
  });

  it('derives availability via deriveAvailability against a drop (early_access gated for guest)', () => {
    const drop: Drop = {
      id: 'drop_1',
      name: { en: 'Drop', th: 'ดรอป' },
      earlyAccessAt: '2026-06-26T00:00:00Z',
      releaseAt: '2026-06-28T00:00:00Z',
      endAt: '2026-07-01T00:00:00Z',
    };
    const p = product({
      id: 'p1',
      slug: 'tee',
      dropId: 'drop_1',
      variants: [variant({ id: 'p1-v', stock: 10, availability: 'live' })],
    });
    const guestView = deriveCatalogView(
      [p],
      parseCatalogQuery(new URLSearchParams('')),
      { drop_1: drop },
      now,
      null,
    );
    expect(guestView[0]!.availability).toBe('early_access');
  });
});

describe('buildFacets', () => {
  it('returns distinct sizes in canonical apparel order, distinct colors, and price bounds', () => {
    const p1 = product({
      id: 'p1',
      slug: 'a',
      variants: [
        variant({ id: 'p1-l', optionValues: { size: 'L', color: 'Black' }, price: thb(120000) }),
        variant({ id: 'p1-s', optionValues: { size: 'S', color: 'White' }, price: thb(300000) }),
      ],
    });
    const p2 = product({
      id: 'p2',
      slug: 'b',
      variants: [
        variant({ id: 'p2-m', optionValues: { size: 'M', color: 'Black' }, price: thb(90000) }),
      ],
    });
    const facets = buildFacets([p1, p2]);
    expect(facets.sizes).toEqual(['S', 'M', 'L']);
    expect(facets.colors).toEqual(['Black', 'White']);
    // priceBounds are exposed in BAHT: 90000 satang → ฿900, 300000 satang → ฿3000.
    expect(facets.priceBounds).toEqual({ min: 900, max: 3000 });
  });
});
