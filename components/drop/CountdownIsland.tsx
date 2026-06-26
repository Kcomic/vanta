'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { computeCountdown, type CountdownParts } from '@/lib/motion/countdown';
import { useMotionCapability } from '@/lib/motion/capability';

export type CountdownIslandProps = {
  /** ISO-8601 UTC; the LIVE flip target (drop.releaseAt OR drop.earlyAccessAt). */
  deadlineIso: string;
  /** Optional override; defaults to t('countdownDone'). */
  onDoneLabel?: string;
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function Segment({ value, unit }: { value: number; unit: string }): React.JSX.Element {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="text-4xl leading-none">{pad(value)}</span>
      <span className="text-[0.625rem] uppercase tracking-[0.2em] text-smoke-300">{unit}</span>
    </span>
  );
}

/**
 * Client island: deadline comes from server as a prop; the per-second tick is
 * client-only (setInterval), never refetches. Flips to LIVE at the deadline.
 * Reduced-motion = static display, no interval, no flashing.
 */
export function CountdownIsland({ deadlineIso, onDoneLabel }: CountdownIslandProps): React.JSX.Element {
  const t = useTranslations('drop');
  const units = useTranslations('drop.units');
  const motionEnabled = useMotionCapability();

  const deadlineMs = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);

  // Server render + first client paint use a deterministic snapshot so hydration
  // matches: seed with deadlineMs => deadlineMs produces done:false total:0 => done.
  // We use the zero-remaining seed (done state) as the SSR snapshot, then immediately
  // correct it after mount. Content is never stranded at opacity:0.
  const [parts, setParts] = useState<CountdownParts>(() =>
    computeCountdown(deadlineMs, deadlineMs),
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

  // Before mount: render the deterministic seed frame (hydration-safe).
  const view: CountdownParts = mounted ? parts : computeCountdown(deadlineMs, deadlineMs);

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
        <Segment value={view.days} unit={units('days')} />
        <Segment value={view.hours} unit={units('hours')} />
        <Segment value={view.minutes} unit={units('minutes')} />
        <Segment value={view.seconds} unit={units('seconds')} />
      </span>
    </span>
  );
}
