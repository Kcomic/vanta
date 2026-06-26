import { describe, it, expect } from 'vitest';
import type { Repositories } from '@/lib/data/repositories';
import type { Cart, Order, User } from '@/lib/domain';

describe('repository interfaces', () => {
  it('a stub object satisfies the Repositories bundle shape', () => {
    const emptyCart: Cart = {
      items: [],
      itemCount: 0,
      subtotal: { amount: 0, currency: 'THB' },
      updatedAt: '2026-06-27T00:00:00.000Z',
    };

    const stub: Repositories = {
      products: {
        list: async () => [],
        getBySlug: async () => null,
        getById: async () => null,
        getVariantById: async () => null,
        getProductByVariantId: async () => null,
        listByCollection: async () => [],
        listByDrop: async () => [],
        decrementStock: async () => {
          throw new Error('stub');
        },
        search: async () => [],
      },
      collections: {
        list: async () => [],
        getBySlug: async () => null,
        getById: async () => null,
      },
      orders: {
        create: async (o: Order) => o,
        getById: async () => null,
        listByUser: async () => [],
      },
      users: {
        getById: async () => null,
        getByEmail: async () => null,
        verifyCredentials: async (): Promise<User | null> => null,
      },
      cart: {
        read: async () => emptyCart,
        write: async () => undefined,
        clear: async () => undefined,
      },
      drops: {
        list: async () => [],
        getById: async () => null,
        getActive: async () => null,
      },
    };

    expect(typeof stub.products.list).toBe('function');
    expect(typeof stub.cart.read).toBe('function');
    expect(typeof stub.drops.list).toBe('function');
    expect(typeof stub.products.getProductByVariantId).toBe('function');
  });
});
