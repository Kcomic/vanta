import { describe, it, expect } from 'vitest';
import {
  seedProducts,
  seedCollections,
  seedDrops,
  seedUsers,
  seedOrders,
  ACTIVE_DROP_ID,
} from '@/lib/data/mock/seed';
import type { Variant } from '@/lib/domain';

const allVariants: Variant[] = seedProducts.flatMap((p) => p.variants);

describe('seed catalog invariants', () => {
  it('ships at least 12 products', () => {
    expect(seedProducts.length).toBeGreaterThanOrEqual(12);
  });

  it('every product has size x color variants with a real option pair', () => {
    for (const p of seedProducts) {
      expect(p.variants.length).toBeGreaterThan(0);
      for (const v of p.variants) {
        expect(v.optionValues.size).toBeTruthy();
        expect(v.optionValues.color).toBeTruthy();
        expect(p.optionAxes.size).toContain(v.optionValues.size);
        expect(p.optionAxes.color).toContain(v.optionValues.color);
      }
    }
  });

  it('all variant prices are positive integer minor units in THB', () => {
    for (const v of allVariants) {
      expect(Number.isInteger(v.price.amount)).toBe(true);
      expect(v.price.amount).toBeGreaterThan(0);
      expect(v.price.currency).toBe('THB');
    }
  });

  it('seeds EXACTLY 3 sold-out variants (stock 0)', () => {
    const soldOut = allVariants.filter((v) => v.stock <= 0);
    expect(soldOut.length).toBe(3);
    for (const v of soldOut) expect(v.availability).toBe('sold_out');
  });

  it('seeds EXACTLY 4 low-stock variants (0 < stock <= 5)', () => {
    const low = allVariants.filter((v) => v.stock > 0 && v.stock <= 5);
    expect(low.length).toBe(4);
    for (const v of low) expect(v.availability).toBe('low_stock');
  });

  it('every variant id and sku is unique', () => {
    const ids = allVariants.map((v) => v.id);
    const skus = allVariants.map((v) => v.sku);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('imagesByColor covers every color axis value', () => {
    for (const p of seedProducts) {
      for (const color of p.optionAxes.color) {
        expect(p.imagesByColor[color]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('defines an active drop with earlyAccessAt < releaseAt < endAt', () => {
    const drop = seedDrops.find((d) => d.id === ACTIVE_DROP_ID);
    expect(drop).toBeDefined();
    const early = Date.parse(drop!.earlyAccessAt);
    const release = Date.parse(drop!.releaseAt);
    const end = Date.parse(drop!.endAt);
    expect(early).toBeLessThan(release);
    expect(release).toBeLessThan(end);
  });

  it('at least one product belongs to the active drop', () => {
    expect(seedProducts.some((p) => p.dropId === ACTIVE_DROP_ID)).toBe(true);
  });

  it('every product collectionId resolves to a seeded collection', () => {
    const ids = new Set(seedCollections.map((c) => c.id));
    for (const p of seedProducts) {
      for (const cid of p.collectionIds) expect(ids.has(cid)).toBe(true);
    }
  });

  it('seeds the demo member with the documented credentials', () => {
    const member = seedUsers.find((u) => u.id === 'usr_member');
    expect(member).toBeDefined();
    expect(member!.email).toBe('member@vanta.shop');
    expect(member!.password).toBe('vanta-demo');
    expect(member!.role).toBe('member');
  });

  it('seeds the confirmation order ord_seed_demo so /checkout/[orderId] renders instantly', () => {
    const order = seedOrders.find((o) => o.id === 'ord_seed_demo');
    expect(order).toBeDefined();
    expect(order!.lineItems.length).toBeGreaterThan(0);
    expect(order!.totals.total.currency).toBe('THB');
  });
});
