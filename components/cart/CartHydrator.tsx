'use client';

import { useEffect } from 'react';
import type { Cart } from '@/lib/domain';
import { useCartStore } from '@/lib/store/cart-store';

/**
 * Seeds the Zustand mirror from the server-rendered cart exactly once on mount.
 * Rendered inside app/[locale]/layout.tsx with the RSC-read cart.
 *
 * React 19 concurrent mode may call render functions multiple times before
 * committing; a render-phase side-effect (even ref-guarded) risks running on
 * a render that is later discarded. useEffect fires only after commit, which
 * is the safe place for external store mutations.
 *
 * First-frame correctness: the Zustand store initialises to EMPTY_CART and
 * Header reads `itemCount` from it. After hydration the store updates and
 * React re-renders the Header with the real count — one extra paint, but
 * no stale/wrong count persists beyond that frame.
 */
export function CartHydrator({ serverCart }: { serverCart: Cart }): null {
  useEffect(() => {
    useCartStore.getState().hydrate(serverCart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
