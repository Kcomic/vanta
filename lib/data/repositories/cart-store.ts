import type { Cart } from '@/lib/domain';

// The ONLY request-context-aware repo: it reads/writes the signed cookie.
export interface CartStore {
  read(): Promise<Cart>; // empty cart if no cookie
  write(cart: Cart): Promise<void>; // signs + sets cookie
  clear(): Promise<void>;
}
