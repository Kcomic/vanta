import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/products/route';
import { products } from '@/lib/data';

describe('GET /api/products (the visible seam)', () => {
  it('returns the same product list the repository exposes', async () => {
    const expected = await products.list();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(expected.length);
  });

  it('serializes Money as integer minor units (no floats)', async () => {
    const res = await GET();
    const body = (await res.json()) as Array<{
      variants: Array<{ price: { amount: number; currency: string } }>;
    }>;
    // seed guarantees at least one product with at least one variant
    const firstPrice = body[0]!.variants[0]!.price;
    expect(Number.isInteger(firstPrice.amount)).toBe(true);
    expect(firstPrice.currency).toBe('THB');
  });
});
