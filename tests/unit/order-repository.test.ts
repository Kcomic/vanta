import { describe, it, expect } from 'vitest';
import { orders } from '@/lib/data';

describe('OrderRepository (mock) seed', () => {
  it('exposes the seeded confirmation order owned by the demo member', async () => {
    const list = await orders.listByUser('usr_member');
    expect(list.length).toBeGreaterThanOrEqual(1);
    const seeded = list.find((o) => o.id === 'ord_seed_demo');
    expect(seeded).toBeDefined();
    expect(seeded!.userId).toBe('usr_member');
  });

  it('line items are self-contained snapshots (title/price/image live on the item)', async () => {
    const order = await orders.getById('ord_seed_demo');
    expect(order).not.toBeNull();
    const li = order!.lineItems[0]!;
    expect(li.title).toHaveProperty('en');
    expect(li.title).toHaveProperty('th');
    expect(li.unitPrice.currency).toBe('THB');
    expect(Number.isInteger(li.unitPrice.amount)).toBe(true);
    expect(li.imageUrl.length).toBeGreaterThan(0);
    expect(li.optionValues).toHaveProperty('size');
    expect(li.optionValues).toHaveProperty('color');
  });

  it('listByUser isolates by user (a stranger sees nothing)', async () => {
    expect(await orders.listByUser('usr_nobody')).toEqual([]);
  });
});
