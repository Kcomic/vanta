import { describe, it, expect } from 'vitest';
import { toCatalogCard } from '@/components/product/ProductCard';
import type { Product, Variant, Money } from '@/lib/domain';

const thb = (amount: number): Money => ({ amount, currency: 'THB' });
const variant = (over: Partial<Variant> & Pick<Variant, 'id'>): Variant => ({
  sku: `SKU-${over.id}`,
  optionValues: { size: 'M', color: 'Black' },
  price: thb(199000),
  stock: 10,
  availability: 'live',
  ...over,
});
const product = (over: Partial<Product> & Pick<Product, 'id' | 'slug'>): Product => ({
  title: { en: 'Tee', th: 'เสื้อ' },
  description: { en: '', th: '' },
  optionAxes: { size: ['M'], color: ['Black'] },
  variants: [variant({ id: `${over.id}-v1` })],
  imagesByColor: {
    Black: [
      {
        id: 'img1',
        url: '/img/black.webp',
        alt: { en: 'Black tee', th: 'เสื้อดำ' },
        width: 800,
        height: 1000,
      },
    ],
  },
  collectionIds: ['col_core'],
  ...over,
});

describe('toCatalogCard', () => {
  it('takes the lowest variant price as fromPrice and flags sale via compareAtPrice', () => {
    const p = product({
      id: 'p1',
      slug: 'tee',
      variants: [
        variant({ id: 'v1', price: thb(259000) }),
        variant({ id: 'v2', price: thb(199000), compareAtPrice: thb(259000) }),
      ],
    });
    const card = toCatalogCard(p, 'en');
    expect(card.fromPrice).toEqual(thb(199000));
    expect(card.compareAtFromPrice).toEqual(thb(259000));
    expect(card.productId).toBe('p1');
    expect(card.imageUrl).toBe('/img/black.webp');
  });

  it('rolls availability up to the MOST buyable (live beats early_access)', () => {
    const p = product({
      id: 'p2',
      slug: 'rollup',
      variants: [
        variant({ id: 'a', availability: 'early_access' }),
        variant({ id: 'b', availability: 'live' }),
      ],
    });
    expect(toCatalogCard(p, 'en').availability).toBe('live');
  });

  it('has no sale flag when no variant carries compareAtPrice', () => {
    expect(toCatalogCard(product({ id: 'p3', slug: 's' }), 'en').compareAtFromPrice).toBeNull();
  });
});
