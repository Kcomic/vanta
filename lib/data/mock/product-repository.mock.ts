import type { Product, Variant } from '@/lib/domain';
import type { Locale } from '@/lib/domain';
import type { ProductRepository } from '@/lib/data/repositories';
import { seedProducts } from './seed';

/** Structured clone so in-session mutation never poisons the seed module. */
const clone = <T>(value: T): T => structuredClone(value);

export class MockProductRepository implements ProductRepository {
  private products: Product[];

  constructor(seed: Product[] = seedProducts) {
    this.products = clone(seed);
  }

  async list(): Promise<Product[]> {
    return clone(this.products);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const found = this.products.find((p) => p.slug === slug);
    return found ? clone(found) : null;
  }

  async getById(id: string): Promise<Product | null> {
    const found = this.products.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async getVariantById(variantId: string): Promise<Variant | null> {
    for (const p of this.products) {
      const v = p.variants.find((variant) => variant.id === variantId);
      if (v) return clone(v);
    }
    return null;
  }

  async getProductByVariantId(variantId: string, _locale: Locale): Promise<Product | null> {
    return clone(this.products.find((p) => p.variants.some((v) => v.id === variantId)) ?? null);
  }

  async listByCollection(collectionId: string): Promise<Product[]> {
    return clone(this.products.filter((p) => p.collectionIds.includes(collectionId)));
  }

  async listByDrop(dropId: string): Promise<Product[]> {
    return clone(this.products.filter((p) => p.dropId === dropId));
  }

  async decrementStock(variantId: string, quantity: number): Promise<Variant> {
    for (const p of this.products) {
      const v = p.variants.find((variant) => variant.id === variantId);
      if (v) {
        if (quantity <= 0) throw new Error('Quantity must be positive');
        if (v.stock - quantity < 0) {
          throw new Error(`Insufficient stock for variant ${variantId}`);
        }
        v.stock -= quantity;
        return clone(v);
      }
    }
    throw new Error(`Variant not found: ${variantId}`);
  }

  async search(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return clone(
      this.products.filter(
        (p) =>
          p.title.en.toLowerCase().includes(q) ||
          p.title.th.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      ),
    );
  }
}
