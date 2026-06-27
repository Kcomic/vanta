import type { Drop, Product } from '@/lib/domain';
import { drops, products } from '@/lib/data';

export interface DropService {
  /** Pass the request's `now` so there is one clock read per request. */
  getActiveDrop(now: Date): Promise<Drop | null>;
  getDropById(dropId: string): Promise<Drop | null>;
  getDropProducts(dropId: string): Promise<Product[]>;
}

export const dropService: DropService = {
  async getActiveDrop(now: Date): Promise<Drop | null> {
    return drops.getActive(now);
  },
  async getDropById(dropId: string): Promise<Drop | null> {
    return drops.getById(dropId);
  },
  async getDropProducts(dropId: string): Promise<Product[]> {
    return products.listByDrop(dropId);
  },
};
