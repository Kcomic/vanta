'use client';

import { useTranslations } from 'next-intl';
import type { PdpView } from '@/lib/pdp/selection';

export function SizeGrid({
  view,
  selectedSize,
  onSelectSize,
}: {
  view: PdpView;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}) {
  const t = useTranslations('pdp');

  return (
    <div
      role="radiogroup"
      aria-label={t('selectSize')}
      className="grid grid-cols-4 gap-2 font-mono"
    >
      {view.sizes.map((s) => {
        const isSelected = s.size === selectedSize;
        const isSoldOut = s.availability === 'sold_out';
        return (
          <button
            key={s.size}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={!s.selectable}
            disabled={!s.selectable}
            data-testid={`size-${s.size}`}
            data-soldout={isSoldOut ? 'true' : 'false'}
            onClick={() => s.selectable && onSelectSize(s.size)}
            className={[
              'relative py-3 text-sm uppercase transition-colors',
              isSelected
                ? 'border border-paper bg-paper text-ink'
                : 'border border-smoke-700 text-paper',
              !s.selectable
                ? 'cursor-not-allowed text-smoke-500 line-through opacity-50'
                : 'hover:border-paper',
            ].join(' ')}
          >
            {s.size}
          </button>
        );
      })}
    </div>
  );
}
