'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { type SizeRow, type Unit, formatMeasure } from '@/lib/pdp/measurements';

export function SizeFitDrawer({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: SizeRow[];
}) {
  const t = useTranslations('pdp.sizeFit');
  const [unit, setUnit] = useState<Unit>('cm');
  const unitGroupRef = useRef<HTMLDivElement>(null);

  // Roving-tabindex: Left/Right arrows move focus between cm / in.
  const handleUnitKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (!unitGroupRef.current) return;
    const radios = Array.from(
      unitGroupRef.current.querySelectorAll<HTMLElement>('[role="radio"]'),
    );
    const idx = radios.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = radios[(idx + dir + radios.length) % radios.length];
    next?.focus();
  }, []);

  const UNITS = ['cm', 'in'] as const;

  return (
    <Dialog open={open} onClose={onClose} labelledById="size-fit-title">
      <div className="flex flex-col gap-4 bg-ink p-6 text-paper">
        <div className="flex items-center justify-between">
          <h2 id="size-fit-title" className="display text-xl">
            {t('title')}
          </h2>
          <div
            ref={unitGroupRef}
            role="radiogroup"
            aria-label={t('unitLabel')}
            className="flex gap-1 font-mono text-sm"
            onKeyDown={handleUnitKeyDown}
          >
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                tabIndex={unit === u ? 0 : -1}
                onClick={() => setUnit(u)}
                className={
                  unit === u
                    ? 'bg-lime px-3 py-1 text-ink'
                    : 'border border-smoke-700 px-3 py-1 text-smoke-300'
                }
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="text-left text-smoke-500">
              <th className="py-2">{t('size')}</th>
              <th className="py-2">{t('chest')}</th>
              <th className="py-2">{t('length')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-t border-smoke-700">
                <td className="py-2">{r.size}</td>
                <td className="py-2">{formatMeasure(r.chestCm, unit)}</td>
                <td className="py-2">{formatMeasure(r.lengthCm, unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
}
