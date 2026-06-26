'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Availability } from '@/lib/domain';

export type AvailabilityBadgeProps = {
  availability: Availability;
  stock: number;
};

export function AvailabilityBadge({ availability, stock }: AvailabilityBadgeProps): React.JSX.Element {
  const t = useTranslations('drop');

  const base =
    'inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.18em]';

  switch (availability) {
    case 'sold_out':
      return (
        <span data-testid="badge-sold-out" className={`${base} bg-smoke-700 text-smoke-300`}>
          {t('soldOut')}
        </span>
      );
    case 'coming_soon':
      return (
        <span
          data-testid="badge-coming-soon"
          className={`${base} border border-smoke-500 text-paper`}
        >
          {t('comingSoon')}
        </span>
      );
    case 'early_access':
      return (
        <span
          data-testid="badge-early-access"
          className={`${base} border border-blaze text-blaze`}
        >
          {t('earlyAccessLocked')}
        </span>
      );
    case 'low_stock':
      return (
        <span data-testid="badge-low-stock" className={`${base} bg-blaze text-ink`}>
          {t('lowStock', { count: stock })}
        </span>
      );
    case 'live':
    default:
      return (
        <span data-testid="badge-live" className={`${base} bg-paper text-ink`}>
          {t('live')}
        </span>
      );
  }
}
