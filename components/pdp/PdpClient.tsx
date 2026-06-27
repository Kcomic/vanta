'use client';

import { useMemo, useState } from 'react';
import type { Product, Drop, User, Locale, Money } from '@/lib/domain';
import type { SizeRow } from '@/lib/pdp/measurements';
import { buildPdpView } from '@/lib/pdp/selection';
import { SwatchGallery } from '@/components/pdp/SwatchGallery';
import { StickyBuyPanel } from '@/components/pdp/StickyBuyPanel';
import { SizeFitDrawer } from '@/components/pdp/SizeFitDrawer';

export function PdpClient({
  product,
  drop,
  user,
  nowIso,
  locale,
  sizeFitRows,
}: {
  product: Product;
  drop: Drop | null;
  user: User | null;
  nowIso: string;
  locale: Locale;
  sizeFitRows: SizeRow[];
}) {
  const [selectedColor, setSelectedColor] = useState(product.optionAxes.color[0] ?? '');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeFitOpen, setSizeFitOpen] = useState(false);

  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const view = useMemo(
    () =>
      buildPdpView(product, drop, now, user, {
        size: selectedSize,
        color: selectedColor,
      }),
    [product, drop, now, user, selectedSize, selectedColor],
  );

  // Representative price shown before a size is selected (first variant's price).
  const displayPrice: Money = product.variants[0]?.price ?? { amount: 0, currency: 'THB' };

  // Changing color resets the size only if the new color lacks that SKU combination.
  function handleSelectColor(color: string) {
    setSelectedColor(color);
    setSelectedSize((prev) =>
      prev !== null &&
      product.variants.some(
        (v) => v.optionValues.color === color && v.optionValues.size === prev,
      )
        ? prev
        : null,
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[var(--max-w-shell)] grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-2">
      <SwatchGallery
        productId={product.id}
        view={view}
        selectedColor={selectedColor}
        onSelectColor={handleSelectColor}
        locale={locale}
      />
      <StickyBuyPanel
        title={product.title[locale]}
        view={view}
        locale={locale}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        variant={view.selectedVariant}
        availability={view.selectedAvailability}
        displayPrice={displayPrice}
        onOpenSizeFit={() => setSizeFitOpen(true)}
      />
      <SizeFitDrawer
        open={sizeFitOpen}
        onClose={() => setSizeFitOpen(false)}
        rows={sizeFitRows}
      />
    </div>
  );
}
