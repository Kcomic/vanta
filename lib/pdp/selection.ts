import type { Product, Variant, Availability, ProductImage, Drop, User } from '@/lib/domain';
import { deriveAvailability } from '@/lib/services/availability';

export type SizeOption = {
  size: string;
  variantId: string | null; // null => no SKU exists for (size, selectedColor)
  availability: Availability | null;
  selectable: boolean; // false when sold_out OR no variant exists
};

export type PdpView = {
  colors: string[]; // optionAxes.color order
  sizes: SizeOption[]; // optionAxes.size order, scoped to selectedColor
  selectedVariant: Variant | null; // resolved from { size, color }
  selectedAvailability: Availability | null; // deriveAvailability(selectedVariant, ...)
  gallery: ProductImage[]; // imagesByColor[selectedColor] ?? []
  lowStockRemaining: number | null; // selectedVariant.stock when selectedAvailability === 'low_stock', else null
};

function findVariant(product: Product, size: string, color: string): Variant | null {
  return (
    product.variants.find(
      (v) => v.optionValues.size === size && v.optionValues.color === color,
    ) ?? null
  );
}

export function buildPdpView(
  product: Product,
  drop: Drop | null,
  now: Date,
  user: User | null,
  selected: { size: string | null; color: string },
): PdpView {
  const colors = product.optionAxes.color;

  const sizes: SizeOption[] = product.optionAxes.size.map((size) => {
    const v = findVariant(product, size, selected.color);
    if (!v) {
      return { size, variantId: null, availability: null, selectable: false };
    }
    const availability = deriveAvailability(v, drop, now, user);
    return {
      size,
      variantId: v.id,
      availability,
      selectable: availability !== 'sold_out',
    };
  });

  const selectedVariant =
    selected.size !== null ? findVariant(product, selected.size, selected.color) : null;

  const selectedAvailability = selectedVariant
    ? deriveAvailability(selectedVariant, drop, now, user)
    : null;

  const lowStockRemaining =
    selectedVariant && selectedAvailability === 'low_stock' ? selectedVariant.stock : null;

  return {
    colors,
    sizes,
    selectedVariant,
    selectedAvailability,
    gallery: product.imagesByColor[selected.color] ?? [],
    lowStockRemaining,
  };
}
