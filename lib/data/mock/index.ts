import type { Repositories } from '@/lib/data/repositories';
import { MockProductRepository } from './product-repository.mock';
import { MockCollectionRepository } from './collection-repository.mock';
import { MockOrderRepository } from './order-repository.mock';
import { MockUserRepository } from './user-repository.mock';
import { MockCartStore } from './cart-store.mock';
import { MockDropRepository } from './drop-repository.mock';

export const mockRepositories: Repositories = {
  products: new MockProductRepository(),
  collections: new MockCollectionRepository(),
  orders: new MockOrderRepository(),
  users: new MockUserRepository(),
  cart: new MockCartStore(),
  drops: new MockDropRepository(),
};
