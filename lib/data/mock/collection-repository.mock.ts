import type { Collection } from '@/lib/domain';
import type { CollectionRepository } from '@/lib/data/repositories';
import { seedCollections } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

export class MockCollectionRepository implements CollectionRepository {
  private collections: Collection[];

  constructor(seed: Collection[] = seedCollections) {
    this.collections = clone(seed);
  }

  async list(): Promise<Collection[]> {
    return clone(this.collections);
  }

  async getBySlug(slug: string): Promise<Collection | null> {
    const found = this.collections.find((c) => c.slug === slug);
    return found ? clone(found) : null;
  }

  async getById(id: string): Promise<Collection | null> {
    const found = this.collections.find((c) => c.id === id);
    return found ? clone(found) : null;
  }
}
