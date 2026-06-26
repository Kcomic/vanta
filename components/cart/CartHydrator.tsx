'use client';

import { useRef } from 'react';
import type { Cart } from '@/lib/domain';
import { useCartStore } from '@/lib/store/cart-store';

/**
 * Seeds the Zustand mirror from the server-rendered cart exactly once on mount.
 * Rendered inside app/[locale]/layout.tsx with the RSC-read cart.
 */
export function CartHydrator({ serverCart }: { serverCart: Cart }): null {
  const hydrated = useRef(false);
  if (!hydrated.current) {
    // Hydrate during render (before paint) so the header badge is correct on first frame.
    useCartStore.getState().hydrate(serverCart);
    hydrated.current = true;
  }
  return null;
}
