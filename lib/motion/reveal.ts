'use client';

import { useCallback, useRef } from 'react';
import gsap from 'gsap';

export type RevealOptions = {
  /** Pass the useMotionCapability() result. false => hard no-op. */
  enabled: boolean;
  y?: number;
  duration?: number;
  stagger?: number;
};

/**
 * Animates targets IN from a translate/fade. When disabled this NEVER writes
 * opacity:0 — content stays visible-by-default (no blank-page failure).
 * Returns a cleanup that reverts the GSAP context.
 */
export function runReveal(targets: Element[], options: RevealOptions): () => void {
  const { enabled, y = 24, duration = 0.6, stagger = 0.04 } = options;
  if (!enabled || targets.length === 0) {
    return () => {};
  }
  const ctx = gsap.context(() => {
    gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: 'power3.out',
        clearProps: 'opacity,transform', // hand styling back to CSS when done
      },
    );
  });
  return () => ctx.revert();
}

/**
 * Ref-callback variant: reveals the node's direct children on mount.
 * Re-runs when `enabled` flips (e.g. user toggles motion).
 */
export function useReveal(options: RevealOptions): (node: HTMLElement | null) => void {
  const cleanupRef = useRef<() => void>(() => {});
  const { enabled, y, duration, stagger } = options;
  return useCallback(
    (node: HTMLElement | null) => {
      cleanupRef.current();
      if (node === null) {
        cleanupRef.current = () => {};
        return;
      }
      const children = Array.from(node.children);
      cleanupRef.current = runReveal(children, { enabled, y, duration, stagger });
    },
    [enabled, y, duration, stagger],
  );
}
