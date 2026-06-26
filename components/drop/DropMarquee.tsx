'use client';

import React, { useMemo } from 'react';
import { splitGraphemes } from '@/lib/motion/segment';
import { useMotionCapability } from '@/lib/motion/capability';

export type DropMarqueeProps = {
  soldOut?: boolean;
};

export function DropMarquee({ soldOut = false }: DropMarqueeProps): React.JSX.Element {
  const word = soldOut ? 'SOLD OUT' : 'DROP'; // English in both locales by constraint
  const motionEnabled = useMotionCapability();
  const letters = useMemo(() => splitGraphemes(word), [word]);

  // Build a long-enough strip; duplicate the word run so the loop is seamless.
  const run = Array.from({ length: 8 }, () => word);

  return (
    <div
      data-testid="drop-marquee"
      data-word={word}
      className="overflow-hidden border-y border-smoke-700 bg-ink py-3"
      aria-hidden
    >
      <div
        className={`flex w-max gap-8 whitespace-nowrap font-mono text-2xl tracking-[0.35em] text-smoke-500 ${
          motionEnabled ? 'animate-[marquee_18s_linear_infinite]' : ''
        }`}
      >
        {run.map((w, i) => (
          <span key={i} className="inline-flex">
            {letters.map((g, j) => (
              <span key={`${i}-${j}`}>{g}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
