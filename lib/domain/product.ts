import type { Money } from './money';
import type { LocalizedText } from './i18n'; // ← REQUIRED: used by ProductImage.alt, Product.title/description

export type Availability = 'coming_soon' | 'early_access' | 'live' | 'low_stock' | 'sold_out';

export type ProductImage = {
  id: string;
  url: string;
  alt: LocalizedText;
  width: number;
  height: number;
};

/** Variant is the purchasable unit (SKU). Every wow feature renders variant state. */
export type Variant = {
  id: string;
  sku: string;
  optionValues: { size: string; color: string };
  price: Money;
  compareAtPrice?: Money; // present => sale UI
  stock: number; // current in-session stock
  availability: Availability; // baseline; UI re-derives via deriveAvailability
};

export type Product = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  optionAxes: { size: string[]; color: string[] };
  variants: Variant[];
  imagesByColor: Record<string, ProductImage[]>; // keyed by optionValues.color
  collectionIds: string[];
  dropId?: string;
};

// Re-export so importing from product.ts is allowed:
export type { LocalizedText } from './i18n';
