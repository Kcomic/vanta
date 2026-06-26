import type { ProductRepository } from './product-repository';
import type { CollectionRepository } from './collection-repository';
import type { OrderRepository } from './order-repository';
import type { UserRepository } from './user-repository';
import type { CartStore } from './cart-store';
import type { DropRepository } from './drop-repository';

export type { ProductRepository } from './product-repository';
export type { CollectionRepository } from './collection-repository';
export type { OrderRepository } from './order-repository';
export type { UserRepository } from './user-repository';
export type { CartStore } from './cart-store';
export type { DropRepository } from './drop-repository';

export interface Repositories {
  products: ProductRepository;
  collections: CollectionRepository;
  orders: OrderRepository;
  users: UserRepository;
  cart: CartStore;
  drops: DropRepository;
}
