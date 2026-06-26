'use client';

import { useSyncExternalStore } from 'react';

export type MotionSignals = {
  /** (prefers-reduced-motion: no-preference) matches. */
  prefersNoPreference: boolean;
  /** (pointer: fine) matches — a precise pointing device. */
  pointerFine: boolean;
  /** Save-Data / Network Information API requested data saving. */
  saveData: boolean;
};

/**
 * PURE. Heavy wow gated on no-preference AND pointer:fine AND not Save-Data.
 * NO deviceMemory / hardwareConcurrency arithmetic (coarse, Safari-absent).
 */
export function resolveMotionEnabled(signals: MotionSignals): boolean {
  return signals.prefersNoPreference && signals.pointerFine && !signals.saveData;
}

const REDUCED_QUERY = '(prefers-reduced-motion: no-preference)';
const POINTER_QUERY = '(pointer: fine)';

type Connection = { saveData?: boolean } | undefined;

function readSignals(): MotionSignals {
  if (typeof window === 'undefined') return SERVER_SIGNALS;
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  return {
    prefersNoPreference: window.matchMedia(REDUCED_QUERY).matches,
    pointerFine: window.matchMedia(POINTER_QUERY).matches,
    saveData: connection?.saveData === true,
  };
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const reduced = window.matchMedia(REDUCED_QUERY);
  const pointer = window.matchMedia(POINTER_QUERY);
  reduced.addEventListener('change', onChange);
  pointer.addEventListener('change', onChange);
  return () => {
    reduced.removeEventListener('change', onChange);
    pointer.removeEventListener('change', onChange);
  };
}

// Stable server snapshot => SSR + first client paint render the visible-by-default
// (static) path; content is NEVER stranded at opacity:0 before hydration.
const SERVER_SIGNALS: MotionSignals = {
  prefersNoPreference: false,
  pointerFine: false,
  saveData: true,
};

/** The single gate every heavy effect consults. Bare boolean. Re-renders on media change. */
export function useMotionCapability(): boolean {
  const signals = useSyncExternalStore(subscribe, readSignals, () => SERVER_SIGNALS);
  return resolveMotionEnabled(signals);
}
