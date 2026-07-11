import { describe, it, expect } from 'vitest';
import { toCatalogCard } from '@/components/product/ProductCard';
import type { Product, Variant, Money, Drop, User } from '@/lib/domain';

const thb = (amount: number): Money => ({ amount, currency: 'THB' });
const NOW = new Date('2026-06-27T00:00:00.000Z');

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

const member: User = {
  id: 'usr_member',
  email: 'member@vanta.shop',
  name: 'Member',
  role: 'member',
  addresses: [],
};

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
    const card = toCatalogCard(p, {}, NOW, null, 'en');
    expect(card.fromPrice).toEqual(thb(199000));
    expect(card.compareAtFromPrice).toEqual(thb(259000));
    expect(card.productId).toBe('p1');
    expect(card.imageUrl).toBe('/img/black.webp');
  });

  it('rolls availability up to the MOST buyable (live beats sold_out)', () => {
    const p = product({
      id: 'p2',
      slug: 'rollup',
      variants: [variant({ id: 'a', stock: 0 }), variant({ id: 'b', stock: 10 })],
    });
    expect(toCatalogCard(p, {}, NOW, null, 'en').availability).toBe('live');
  });

  it('has no sale flag when no variant carries compareAtPrice', () => {
    expect(toCatalogCard(product({ id: 'p3', slug: 's' }), {}, NOW, null, 'en').compareAtFromPrice).toBeNull();
  });

  it('derives LIVE drop state per user (not the static baseline) — the card agrees with home/PDP', () => {
    // now is inside the early-access window (earlyAccessAt <= now < releaseAt)
    const drop: Drop = {
      id: 'drop1',
      name: { en: 'Drop', th: 'ดรอป' },
      earlyAccessAt: '2026-06-26T00:00:00.000Z',
      releaseAt: '2026-06-28T00:00:00.000Z',
      endAt: '2026-07-10T00:00:00.000Z',
    };
    const p = product({
      id: 'p4',
      slug: 'gated',
      dropId: 'drop1',
      variants: [variant({ id: 'v', stock: 10, availability: 'live' })],
    });
    // Guest is gated even though the static baseline says 'live'.
    expect(toCatalogCard(p, { drop1: drop }, NOW, null, 'en').availability).toBe('early_access');
    // Member unlocks early access → buyable.
    expect(toCatalogCard(p, { drop1: drop }, NOW, member, 'en').availability).toBe('live');
  });
});
