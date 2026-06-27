'use client';

import React, { useRef, useEffect, useCallback } from 'react';
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
  const groupRef = useRef<HTMLDivElement>(null);

  // Roving-tabindex: the focused (or selected, or first) radio holds tabIndex=0;
  // all others hold tabIndex=-1. Arrow keys move focus within the group.
  const selectableItems = view.sizes.filter((s) => s.selectable);

  function getTabIndex(size: string): number {
    // If something is selected — that one is in the tab order.
    if (selectedSize !== null) return size === selectedSize ? 0 : -1;
    // Nothing selected — first selectable item is in the tab order.
    const firstSelectable = selectableItems[0]?.size;
    return size === firstSelectable ? 0 : -1;
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!groupRef.current) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' &&
          e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      e.preventDefault();

      const radios = Array.from(
        groupRef.current.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])'),
      );
      const active = document.activeElement;
      const idx = radios.indexOf(active as HTMLElement);
      if (idx === -1) return;

      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const next = radios[(idx + dir + radios.length) % radios.length];
      next?.focus();
    },
    [],
  );

  // When selectedSize changes from outside, move focus to the selected button
  // IF focus is currently inside the radiogroup (keeps pointer & programmatic UX separate).
  useEffect(() => {
    if (!selectedSize || !groupRef.current) return;
    const group = groupRef.current;
    if (!group.contains(document.activeElement)) return;
    const btn = group.querySelector<HTMLElement>(`[data-testid="size-${selectedSize}"]`);
    btn?.focus();
  }, [selectedSize]);

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={t('selectSize')}
      className="grid grid-cols-4 gap-2 font-mono"
      onKeyDown={handleKeyDown}
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
            tabIndex={getTabIndex(s.size)}
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
