import { describe, it, expect } from 'vitest';
import { products, collections, orders, users } from '@/lib/data';

describe('repository queries through the swap point @/lib/data', () => {
  it('products.list returns the full seeded catalog', async () => {
    const all = await products.list();
    expect(all.length).toBeGreaterThanOrEqual(12);
  });

  it('products.getBySlug resolves a known product', async () => {
    const p = await products.getBySlug('void-tee');
    expect(p?.id).toBe('prd_void_tee');
  });

  it('products.getBySlug returns null for an unknown slug', async () => {
    expect(await products.getBySlug('does-not-exist')).toBeNull();
  });

  it('products.listByDrop returns only products in the active drop', async () => {
    const dropProducts = await products.listByDrop('drp_void_genesis');
    expect(dropProducts.length).toBeGreaterThan(0);
    expect(dropProducts.every((p) => p.dropId === 'drp_void_genesis')).toBe(true);
  });

  it('products.getVariantById finds a nested variant', async () => {
    const v = await products.getVariantById('var_void_tee_m_black');
    expect(v?.sku).toBe('VNT-TEE-M-BLK');
  });

  it('products.decrementStock reduces in-session stock and returns the updated variant', async () => {
    const before = await products.getVariantById('var_void_tee_s_black');
    const startStock = before!.stock;
    const updated = await products.decrementStock('var_void_tee_s_black', 2);
    expect(updated.stock).toBe(startStock - 2);
    const after = await products.getVariantById('var_void_tee_s_black');
    expect(after!.stock).toBe(startStock - 2);
  });

  it('products.decrementStock throws when reducing below zero', async () => {
    await expect(products.decrementStock('var_void_tee_l_black', 1)).rejects.toThrow();
  });

  it('products.search matches titles case-insensitively', async () => {
    const hits = await products.search('hoodie');
    expect(hits.some((p) => p.id === 'prd_void_hoodie')).toBe(true);
  });

  it('collections.getBySlug resolves a collection', async () => {
    const c = await collections.getBySlug('the-void');
    expect(c?.id).toBe('col_void');
  });

  it('users.verifyCredentials accepts the seed member and rejects bad passwords', async () => {
    const ok = await users.verifyCredentials('member@vanta.shop', 'vanta-demo');
    expect(ok?.id).toBe('usr_member');
    expect(ok && 'password' in ok).toBe(false); // password never leaks into domain User
    const bad = await users.verifyCredentials('member@vanta.shop', 'wrong');
    expect(bad).toBeNull();
  });

  it('orders.getById returns the seeded confirmation order', async () => {
    const order = await orders.getById('ord_seed_demo');
    expect(order?.totals.total.amount).toBe(378000);
  });
});
