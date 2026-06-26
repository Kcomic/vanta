import { create } from 'zustand';
import type { Cart } from '@/lib/domain';

const EMPTY_CART: Cart = {
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: 'THB' },
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export type CartMirrorState = {
  cart: Cart;
  hydrate: (serverCart: Cart) => void;
  replaceFromServer: (cart: Cart) => void;
};

// INVARIANT: no addItem/removeItem mutators — Zustand never invents cart state.
export const useCartStore = create<CartMirrorState>((set) => ({
  cart: EMPTY_CART,
  hydrate: (serverCart) => set({ cart: serverCart }),
  replaceFromServer: (cart) => set({ cart }),
}));

export function useCartCount(): number {
  return useCartStore((state) => state.cart.itemCount);
}
