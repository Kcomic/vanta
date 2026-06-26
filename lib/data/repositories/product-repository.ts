import type { Product, Variant } from '@/lib/domain';
import type { Locale } from '@/lib/domain';

export interface ProductRepository {
  list(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  getVariantById(variantId: string): Promise<Variant | null>;
  /** Resolve the owning product of a variant in ONE place (kills repeated list() scans). */
  getProductByVariantId(variantId: string, locale: Locale): Promise<Product | null>;
  listByCollection(collectionId: string): Promise<Product[]>;
  listByDrop(dropId: string): Promise<Product[]>;
  /** In-session stock decrement on add-to-cart (mock mutates seed). */
  decrementStock(variantId: string, quantity: number): Promise<Variant>;
  search(query: string): Promise<Product[]>;
}
