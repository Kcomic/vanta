import { dropService } from '@/lib/services/drop-service';
import { products } from '@/lib/data';
import { deriveAvailability } from '@/lib/services/availability';
import type { Availability, Drop, Product, User, Variant } from '@/lib/domain';

export type HeroVariantView = {
  variantId: string;
  sku: string;
  availability: Availability;
  stock: number;
};

export type HeroProductView = {
  productId: string; // stable VT key source: `product-${productId}`
  slug: string;
  leadVariant: HeroVariantView;
};

export type HomeView = {
  drop: Drop | null;
  dropProducts: HeroProductView[];
  featured: Product[]; // up to 6, drop-independent
  anyEarlyAccessGated: boolean; // true if a drop variant derives to 'early_access'
};

function toLeadView(
  product: Product,
  drop: Drop | null,
  now: Date,
  user: User | null,
): HeroProductView | null {
  const variant: Variant | undefined = product.variants[0];
  if (!variant) return null;
  const availability = deriveAvailability(variant, drop, now, user);
  return {
    productId: product.id,
    slug: product.slug,
    leadVariant: {
      variantId: variant.id,
      sku: variant.sku,
      availability,
      stock: variant.stock,
    },
  };
}

export async function buildHomeView(now: Date, user: User | null): Promise<HomeView> {
  const drop = await dropService.getActiveDrop();
  const dropProductList = drop ? await dropService.getDropProducts(drop.id) : [];
  const dropProducts = dropProductList
    .map((p) => toLeadView(p, drop, now, user))
    .filter((v): v is HeroProductView => v !== null);

  const all = await products.list();
  const featured = all.slice(0, 6);

  const anyEarlyAccessGated = dropProducts.some(
    (p) => p.leadVariant.availability === 'early_access',
  );

  return { drop, dropProducts, featured, anyEarlyAccessGated };
}
