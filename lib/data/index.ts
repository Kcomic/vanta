import type { Repositories } from './repositories';
import { mockRepositories } from './mock';

/** Change-one-import-to-go-live: swap mockRepositories for prismaRepositories / apiRepositories here. */
export const repositories: Repositories = mockRepositories;

// Convenience named exports (so callers can `import { products } from '@/lib/data'`):
export const { products, collections, orders, users, cart } = repositories;
