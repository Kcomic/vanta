'use client';

import { useTranslations } from 'next-intl';
import type { PdpView } from '@/lib/pdp/selection';
import type { Locale } from '@/lib/domain';
import { ProductImage } from '@/components/product/ProductImage';

export function SwatchGallery({
  productId,
  view,
  selectedColor,
  onSelectColor,
  locale,
}: {
  productId: string;
  view: PdpView;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  locale: Locale;
}) {
  const t = useTranslations('pdp');
  const hero = view.gallery[0];
  const thumbs = view.gallery.slice(1);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero image — carries the view-transition-name so card→PDP shared-element pairs */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden bg-smoke-900"
        style={{ viewTransitionName: `product-${productId}` }}
      >
        <ProductImage
          key={hero?.id ?? selectedColor}
          url={hero?.url}
          colorway={selectedColor}
          title={hero?.alt[locale] ?? selectedColor}
          locale={locale}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      {/* Thumbnail strip */}
      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-3" aria-hidden="true">
          {thumbs.map((img) => (
            <div key={img.id} className="relative aspect-[4/5] overflow-hidden bg-smoke-900">
              <ProductImage
                url={img.url}
                colorway={selectedColor}
                title={img.alt[locale]}
                locale={locale}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Color swatch selector */}
      <div role="radiogroup" aria-label={t('colorLabel')} className="flex gap-2">
        {view.colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={color === selectedColor}
            aria-label={color}
            onClick={() => onSelectColor(color)}
            data-testid={`swatch-${color}`}
            className={
              color === selectedColor
                ? 'h-9 w-9 rounded-full border-2 border-lime'
                : 'h-9 w-9 rounded-full border-2 border-smoke-700 hover:border-smoke-300'
            }
            style={{ backgroundColor: swatchHex(color) }}
          />
        ))}
      </div>
    </div>
  );
}

/** Deterministic hex for each colorway name used in the demo catalog. */
function swatchHex(color: string): string {
  const map: Record<string, string> = {
    Ink: '#0A0A0A',
    Bone: '#F5F4EF',
    Blaze: '#FF3B1F',
    Lime: '#D4FF2E',
    Smoke: '#6B6B6B',
  };
  return map[color] ?? '#2A2A2A';
}
