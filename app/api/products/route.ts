import { NextResponse } from 'next/server';
import { products } from '@/lib/data';
import type { Product } from '@/lib/domain';

/**
 * Documented, curl-able JSON seam — exists to make the repository layer VISIBLE
 * to reviewers (`curl http://localhost:3000/api/products`).
 *
 * IMPORTANT: the app NEVER client-fetches this route. Server Components read
 * through `@/lib/data` repositories directly; this handler only re-exposes the
 * SAME seam over HTTP so the "change one import to go live" story is checkable.
 */
export async function GET(): Promise<NextResponse<Product[]>> {
  const list = await products.list();
  return NextResponse.json(list, {
    headers: { 'cache-control': 'public, max-age=60' },
  });
}
