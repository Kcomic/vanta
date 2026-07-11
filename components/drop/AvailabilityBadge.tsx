'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Availability } from '@/lib/domain';
import type { Surface } from '@/lib/motion/token-guard';

export type AvailabilityBadgeProps = {
  availability: Availability;
  stock: number;
  /** Surface the badge renders on. Defaults to 'dark'.
   *  AA contract: low-stock urgency text uses text-blaze on dark,
   *  text-blaze-on-light (#C42A13, 4.7:1) on paper (raw blaze is only 3.23:1 on paper). */
  surface?: Surface;
};

export function AvailabilityBadge({
  availability,
  stock,
  surface = 'dark',
}: AvailabilityBadgeProps): React.JSX.Element {
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
      // On paper surfaces: text-blaze-on-light (#C42A13, 4.7:1 on paper, AA-safe).
      // On dark surfaces: filled blaze badge with ink text (high contrast on dark).
      return surface === 'paper' ? (
        <span data-testid="badge-low-stock" className={`${base} text-blaze-on-light`}>
          {t('lowStock', { count: stock })}
        </span>
      ) : (
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
