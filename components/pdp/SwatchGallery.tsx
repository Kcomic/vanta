'use client';

import React, { useCallback, useRef } from 'react';
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
  const groupRef = useRef<HTMLDivElement>(null);

  // Roving-tabindex (mirrors SizeGrid): only the selected swatch is a tab stop; arrow keys
  // move focus within the radiogroup. Without this every swatch was a tab stop, violating
  // the ARIA radiogroup pattern.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!groupRef.current) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')
      return;
    e.preventDefault();
    const radios = Array.from(groupRef.current.querySelectorAll<HTMLElement>('[role="radio"]'));
    const idx = radios.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    radios[(idx + dir + radios.length) % radios.length]?.focus();
  }, []);

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
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={t('colorLabel')}
        className="flex gap-2"
        onKeyDown={handleKeyDown}
      >
        {view.colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={color === selectedColor}
            aria-label={color}
            tabIndex={color === selectedColor ? 0 : -1}
            onClick={() => onSelectColor(color)}
            data-testid={`swatch-${color}`}
            className={[
              'h-9 w-9 rounded-full border-2 transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime',
              color === selectedColor ? 'border-lime' : 'border-smoke-700 hover:border-smoke-300',
            ].join(' ')}
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
