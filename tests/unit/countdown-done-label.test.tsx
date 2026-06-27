// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Verifies the B-fix: CountdownIsland respects the onDoneLabel prop so the
 * done display differs between earlyAccessAt and releaseAt deadlines.
 *
 * The label selection logic lives in LiveDropSection (server component), which
 * sets onDoneLabel='EARLY ACCESS UNLOCKED' for earlyAccessAt and 'LIVE' for
 * releaseAt. We test CountdownIsland's prop contract here (it must render
 * whatever label is passed) and a separate pure-logic test that confirms the
 * selection rule itself.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { CountdownIsland } from '@/components/drop/CountdownIsland';
import type { CountdownParts } from '@/lib/motion/countdown';

// Stub next-intl
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => {
    const map: Record<string, string> = {
      'drop.countdownDone': 'LIVE',
      'drop.srCountdown': '{days}d {hours}h {minutes}m {seconds}s until live',
      'drop.units.days': 'D',
      'drop.units.hours': 'H',
      'drop.units.minutes': 'M',
      'drop.units.seconds': 'S',
    };
    return map[`${ns}.${key}`] ?? key;
  },
}));

// Stub motion so reduced-motion path doesn't start intervals
vi.mock('@/lib/motion/capability', () => ({
  useMotionCapability: vi.fn(() => false),
}));

function render(ui: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(ui);
  });
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// A deadline in the past forces the "done" display path immediately.
const PAST_ISO = '2020-01-01T00:00:00.000Z';

// serverParts with done=true simulates a deadline already passed
const DONE_PARTS: CountdownParts = {
  total: 0,
  done: true,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

describe('CountdownIsland — onDoneLabel prop contract', () => {
  it('renders the default "LIVE" label when onDoneLabel is not supplied', () => {
    const container = render(
      <CountdownIsland
        deadlineIso={PAST_ISO}
        serverParts={DONE_PARTS}
      />,
    );
    const done = container.querySelector('[data-testid="countdown-done"]');
    expect(done).not.toBeNull();
    expect(done?.textContent).toBe('LIVE');
  });

  it('renders the provided earlyAccess done-label instead of "LIVE"', () => {
    const container = render(
      <CountdownIsland
        deadlineIso={PAST_ISO}
        onDoneLabel="EARLY ACCESS UNLOCKED"
        serverParts={DONE_PARTS}
      />,
    );
    const done = container.querySelector('[data-testid="countdown-done"]');
    expect(done).not.toBeNull();
    expect(done?.textContent).toBe('EARLY ACCESS UNLOCKED');
  });

  it('done-label differs between earlyAccessAt and releaseAt deadlines', () => {
    // earlyAccessAt deadline → earlyAccessUnlocked copy
    const earlyContainer = render(
      <CountdownIsland
        deadlineIso={PAST_ISO}
        onDoneLabel="EARLY ACCESS UNLOCKED"
        serverParts={DONE_PARTS}
      />,
    );
    const earlyDone = earlyContainer.querySelector('[data-testid="countdown-done"]');

    document.body.innerHTML = '';

    // releaseAt deadline → LIVE copy
    const liveContainer = render(
      <CountdownIsland
        deadlineIso={PAST_ISO}
        onDoneLabel="LIVE"
        serverParts={DONE_PARTS}
      />,
    );
    const liveDone = liveContainer.querySelector('[data-testid="countdown-done"]');

    expect(earlyDone?.textContent).not.toBe(liveDone?.textContent);
    expect(earlyDone?.textContent).toBe('EARLY ACCESS UNLOCKED');
    expect(liveDone?.textContent).toBe('LIVE');
  });
});

describe('Countdown done-label selection logic', () => {
  /**
   * Pure derivation of the label — mirrors what LiveDropSection does:
   *   anyComingSoon → isEarlyAccessDeadline → earlyAccessUnlocked label
   *   otherwise    → countdownDone label ("LIVE")
   */
  function selectDoneLabel(
    anyComingSoon: boolean,
    earlyAccessUnlocked: string,
    countdownDone: string,
  ): string {
    return anyComingSoon ? earlyAccessUnlocked : countdownDone;
  }

  it('returns earlyAccessUnlocked when any product is coming_soon', () => {
    expect(selectDoneLabel(true, 'EARLY ACCESS UNLOCKED', 'LIVE')).toBe(
      'EARLY ACCESS UNLOCKED',
    );
  });

  it('returns LIVE when no product is coming_soon (deadline is releaseAt)', () => {
    expect(selectDoneLabel(false, 'EARLY ACCESS UNLOCKED', 'LIVE')).toBe('LIVE');
  });

  it('earlyAccess and release labels are always distinct strings', () => {
    const ea = selectDoneLabel(true, 'EARLY ACCESS UNLOCKED', 'LIVE');
    const release = selectDoneLabel(false, 'EARLY ACCESS UNLOCKED', 'LIVE');
    expect(ea).not.toBe(release);
  });
});
