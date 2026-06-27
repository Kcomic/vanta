import { describe, it, expect } from 'vitest';
import { normalizeSearchQuery, buildSearchResults } from '@/lib/search/results';
import type { Product, Variant, Money } from '@/lib/domain';

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
    optionAxes: { size: ['M'], color: ['Black'] },
    variants: [variant({ id: `${over.id}-v` })],
    imagesByColor: { Black: [] },
    collectionIds: [],
    ...over,
  };
}

describe('normalizeSearchQuery', () => {
  it('trims, collapses internal whitespace, and handles null/undefined', () => {
    expect(normalizeSearchQuery('  hoodie   black  ')).toBe('hoodie black');
    expect(normalizeSearchQuery(null)).toBe('');
    expect(normalizeSearchQuery(undefined)).toBe('');
  });
});

describe('buildSearchResults', () => {
  const now = new Date('2026-06-27T00:00:00Z');

  it('echoes the normalized query and counts cards', () => {
    const p = product({ id: 'p1', slug: 'tee' });
    const res = buildSearchResults('  Tee ', [p], {}, now, null, 'en');
    expect(res.query).toBe('Tee');
    expect(res.count).toBe(1);
    expect(res.cards[0]).toMatchObject({ productId: 'p1', slug: 'tee', fromPrice: thb(199000) });
  });

  it('rolls availability up to the most buyable variant', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'a', stock: 0, availability: 'sold_out' }),
        variant({ id: 'b', stock: 2, availability: 'low_stock' }),
      ],
    });
    const res = buildSearchResults('tee', [p], {}, now, null, 'th');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(res.cards[0]!.availability).toBe('low_stock');
  });

  it('returns an empty result set for a blank query without touching matches', () => {
    const res = buildSearchResults('   ', [product({ id: 'p1', slug: 'tee' })], {}, now, null, 'en');
    expect(res).toEqual({ query: '', count: 0, cards: [] });
  });
});
