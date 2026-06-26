import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Drop, Product, User } from '@/lib/domain';

// Drive the data layer through deterministic seed-shaped doubles.
const drop: Drop = {
  id: 'drop_void_01',
  name: { en: 'OUT OF THE VOID', th: 'ออกมาจากความว่างเปล่า' },
  earlyAccessAt: '2026-06-27T10:00:00.000Z',
  releaseAt: '2026-06-27T12:00:00.000Z',
  endAt: '2026-06-30T12:00:00.000Z',
};

const dropProduct: Product = {
  id: 'prod_001',
  slug: 'void-hoodie',
  title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
  description: { en: 'x', th: 'x' },
  optionAxes: { size: ['M'], color: ['black'] },
  variants: [
    {
      id: 'var_001',
      sku: 'VH-M-BLK',
      optionValues: { size: 'M', color: 'black' },
      price: { amount: 199000, currency: 'THB' },
      stock: 20,
      availability: 'live',
    },
  ],
  imagesByColor: { black: [] },
  collectionIds: [],
  dropId: 'drop_void_01',
};

const featured: Product = { ...dropProduct, id: 'prod_999', slug: 'feat', dropId: undefined };

vi.mock('@/lib/services/drop-service', () => ({
  dropService: {
    getActiveDrop: vi.fn(async () => drop),
    getDropById: vi.fn(async () => drop),
    getDropProducts: vi.fn(async () => [dropProduct]),
  },
}));
vi.mock('@/lib/data', () => ({
  products: { list: vi.fn(async () => [dropProduct, featured]) },
}));

import { buildHomeView } from '@/lib/services/home-view';

const member: User = {
  id: 'usr_member',
  email: 'member@vanta.shop',
  name: 'Member',
  role: 'member',
  addresses: [],
};

describe('buildHomeView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('derives early_access (gated) before releaseAt for a guest', async () => {
    const now = new Date('2026-06-27T11:00:00.000Z'); // between earlyAccess and release
    const view = await buildHomeView(now, null);
    expect(view.dropProducts[0]!.leadVariant.availability).toBe('early_access');
    expect(view.anyEarlyAccessGated).toBe(true);
  });

  it('unlocks to live for the seed member before releaseAt', async () => {
    const now = new Date('2026-06-27T11:00:00.000Z');
    const view = await buildHomeView(now, member);
    expect(view.dropProducts[0]!.leadVariant.availability).toBe('live');
    expect(view.anyEarlyAccessGated).toBe(false);
  });

  it('flips to live for everyone after releaseAt', async () => {
    const now = new Date('2026-06-27T12:30:00.000Z');
    const view = await buildHomeView(now, null);
    expect(view.dropProducts[0]!.leadVariant.availability).toBe('live');
  });

  it('returns featured products excluding nothing required and a stable VT key source', async () => {
    const now = new Date('2026-06-27T12:30:00.000Z');
    const view = await buildHomeView(now, null);
    expect(view.featured.length).toBeGreaterThan(0);
    expect(view.dropProducts[0]!.productId).toBe('prod_001');
  });
});
