// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
  },
  gsap: {
    fromTo: vi.fn(),
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
  },
}));

import gsap from 'gsap';
import { runReveal } from '@/lib/motion/reveal';

function makeEls(n: number): HTMLElement[] {
  return Array.from({ length: n }, () => document.createElement('div'));
}

describe('runReveal', () => {
  it('is a hard no-op when disabled and NEVER writes opacity:0', () => {
    const els = makeEls(3);
    const cleanup = runReveal(els, { enabled: false });
    expect(gsap.fromTo).not.toHaveBeenCalled();
    for (const el of els) {
      expect(el.style.opacity).toBe(''); // untouched — visible by default
    }
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('drives a fromTo animation when enabled', () => {
    const els = makeEls(2);
    runReveal(els, { enabled: true });
    expect(gsap.fromTo).toHaveBeenCalledTimes(1);
    const call = (gsap.fromTo as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    const [, fromVars, toVars] = call;
    expect(fromVars).toMatchObject({ opacity: 0, y: 24 });
    expect(toVars).toMatchObject({ opacity: 1, y: 0 });
  });
});
