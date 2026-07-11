import React from 'react';
import { LOW_STOCK_THRESHOLD } from '@/lib/services/availability';

export type StockMeterProps = {
  stock: number;
  max?: number;
  /** Accessible name for the meter (a meter must have one). Pass a localized string. */
  label?: string;
};

export function StockMeter({ stock, max = 20, label = 'Stock level' }: StockMeterProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(stock, max));
  const pct = max === 0 ? 0 : Math.round((clamped / max) * 100);
  const isLow = clamped > 0 && clamped <= LOW_STOCK_THRESHOLD;

  return (
    <div
      data-testid="stock-meter"
      data-stock={clamped}
      className="h-1 w-full overflow-hidden rounded-full bg-smoke-700"
      role="meter"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={`${clamped} / ${max}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
          isLow ? 'bg-blaze' : 'bg-smoke-300'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
