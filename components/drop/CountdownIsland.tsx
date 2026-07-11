'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { computeCountdown, type CountdownParts } from '@/lib/motion/countdown';
import { useMotionCapability } from '@/lib/motion/capability';

export type CountdownIslandProps = {
  /** ISO-8601 UTC; the LIVE flip target (drop.releaseAt OR drop.earlyAccessAt). */
  deadlineIso: string;
  /** Optional override; defaults to t('countdownDone'). */
  onDoneLabel?: string;
  /**
   * Server-computed countdown parts for SSR/first-paint accuracy.
   * Eliminates the "LIVE" flash that occurs when seeding with deadlineMs→deadlineMs.
   * Passed from the Server Component; client ticks from this initial state.
   */
  serverParts?: CountdownParts;
};

function pad(n: number, isLargeUnit?: boolean): string {
  // >99-day support: don't truncate to 2 digits; pad only when value fits in 2 chars.
  if (isLargeUnit && n > 99) return n.toString();
  return n.toString().padStart(2, '0');
}

function Segment({ value, unit, isDays }: { value: number; unit: string; isDays?: boolean }): React.JSX.Element {
  return (
    <span className="inline-flex min-w-0 flex-col items-center">
      {/* tabular-nums: monospaced digits prevent layout jitter on each tick.
          min-w-[2ch] accommodates 2-digit values; auto-expands for >99 days. */}
      <span className="min-w-[2ch] text-center text-4xl leading-none tabular-nums">
        {pad(value, isDays)}
      </span>
      {/* max-w + break-words: prevents long Thai unit labels from overflowing. */}
      <span className="max-w-8 wrap-break-word text-center text-[0.625rem] uppercase tracking-[0.2em] text-smoke-300 leading-tight">
        {unit}
      </span>
    </span>
  );
}

/**
 * Client island: deadline comes from server as a prop; the per-second tick is
 * client-only (setInterval), never refetches. Flips to the done label at the deadline.
 * Reduced-motion = static display, no interval, no flashing.
 *
 * `serverParts` is computed by the Server Component from the same `now` used to build
 * the page — this eliminates the "LIVE" flash that the old deadlineMs→deadlineMs seed
 * caused (that always rendered done=true for SSR, corrected only after mount).
 */
export function CountdownIsland({ deadlineIso, onDoneLabel, serverParts }: CountdownIslandProps): React.JSX.Element {
  const t = useTranslations('drop');
  const units = useTranslations('drop.units');
  const motionEnabled = useMotionCapability();

  const deadlineMs = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);

  // When serverParts is provided, use it as the SSR seed so first paint is accurate.
  // Without serverParts, fall back to the old deadlineMs→deadlineMs seed (done state).
  // After mount the interval takes over for both paths.
  const [parts, setParts] = useState<CountdownParts>(
    () => serverParts ?? computeCountdown(deadlineMs, deadlineMs),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // First real frame immediately on mount.
    setParts(computeCountdown(deadlineMs, Date.now()));

    // Reduced-motion: render the static frame once, no interval.
    if (!motionEnabled) return;

    const id = window.setInterval(() => {
      setParts(computeCountdown(deadlineMs, Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs, motionEnabled]);

  const doneLabel = onDoneLabel ?? t('countdownDone');

  // Before mount: use serverParts when available (accurate SSR), otherwise fall back to
  // the zero-remaining seed (hydration-safe, avoids mismatch between server and client).
  const view: CountdownParts = mounted ? parts : (serverParts ?? computeCountdown(deadlineMs, deadlineMs));

  if (view.done) {
    return (
      <span
        data-testid="countdown-done"
        className="font-mono text-blaze tabular-nums tracking-tight"
      >
        {doneLabel}
      </span>
    );
  }

  const srText = t('srCountdown', {
    days: view.days,
    hours: view.hours,
    minutes: view.minutes,
    seconds: view.seconds,
  });

  return (
    <span data-testid="countdown" className="font-mono tabular-nums">
      {/* sr-only with aria-live="off": provides a readable summary without spamming
          screen readers every second. The visible digits are aria-hidden. */}
      <span className="sr-only" aria-live="off">
        {srText}
      </span>
      <span aria-hidden className="inline-flex items-baseline gap-3 text-paper">
        <Segment value={view.days} unit={units('days')} isDays />
        <Segment value={view.hours} unit={units('hours')} />
        <Segment value={view.minutes} unit={units('minutes')} />
        <Segment value={view.seconds} unit={units('seconds')} />
      </span>
    </span>
  );
}
