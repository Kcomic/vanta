import type { Drop, Product } from '@/lib/domain';
import { drops, products } from '@/lib/data';

export interface DropService {
  getActiveDrop(): Promise<Drop | null>;
  getDropById(dropId: string): Promise<Drop | null>;
  getDropProducts(dropId: string): Promise<Product[]>;
}

export const dropService: DropService = {
  async getActiveDrop(): Promise<Drop | null> {
    return drops.getActive(new Date());
  },
  async getDropById(dropId: string): Promise<Drop | null> {
    return drops.getById(dropId);
  },
  async getDropProducts(dropId: string): Promise<Product[]> {
    return products.listByDrop(dropId);
  },
};
