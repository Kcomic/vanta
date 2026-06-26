import type { Collection } from '@/lib/domain';

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  getBySlug(slug: string): Promise<Collection | null>;
  getById(id: string): Promise<Collection | null>;
}
