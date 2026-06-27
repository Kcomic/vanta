// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { createElement } from 'react';
import { resolveMotionEnabled, useMotionCapability, type MotionSignals } from '@/lib/motion/capability';

const ideal: MotionSignals = { prefersNoPreference: true, pointerFine: true, saveData: false };
const hostile: MotionSignals = { prefersNoPreference: false, pointerFine: false, saveData: true };

// ─── resolveMotionEnabled — pure function ─────────────────────────────────────

describe('resolveMotionEnabled', () => {
  it('enables motion when system signals are ideal and preference defers', () => {
    expect(resolveMotionEnabled('system', ideal)).toBe(true);
  });

  it('explicit "reduced" override always wins, even with ideal signals', () => {
    expect(resolveMotionEnabled('reduced', ideal)).toBe(false);
  });

  it('explicit "full" override forces motion on, even with hostile signals', () => {
    expect(resolveMotionEnabled('full', hostile)).toBe(true);
  });

  it('system: OS prefers reduced motion disables', () => {
    expect(resolveMotionEnabled('system', { ...ideal, prefersNoPreference: false })).toBe(false);
  });

  it('system: coarse pointer (touch) disables heavy wow', () => {
    expect(resolveMotionEnabled('system', { ...ideal, pointerFine: false })).toBe(false);
  });

  it('system: Save-Data disables', () => {
    expect(resolveMotionEnabled('system', { ...ideal, saveData: true })).toBe(false);
  });

  it('system requires ALL three signals (AND, not OR)', () => {
    expect(
      resolveMotionEnabled('system', {
        prefersNoPreference: true,
        pointerFine: false,
        saveData: false,
      }),
    ).toBe(false);
  });
});

// ─── useMotionCapability hook tests ──────────────────────────────────────────

const REDUCED_QUERY = '(prefers-reduced-motion: no-preference)';
const POINTER_QUERY = '(pointer: fine)';

/**
 * Mount a tiny wrapper component that calls useMotionCapability() and
 * stores the result in a box so tests can read it.
 */
function mountHook(box: { value: boolean }): { root: ReturnType<typeof createRoot>; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function Probe() {
    box.value = useMotionCapability();
    return null;
  }

  act(() => {
    root.render(createElement(Probe));
  });

  return { root, container };
}

/**
 * Build a minimal window.matchMedia mock.
 * Returns a factory function plus a `trigger` helper to fire all listeners.
 */
function buildMatchMediaMock(matchesMap: Record<string, boolean>) {
  const allListeners: Map<string, Set<() => void>> = new Map();

  const mock = vi.fn((query: string): MediaQueryList => {
    const listenerSet: Set<() => void> = allListeners.get(query) ?? new Set();
    allListeners.set(query, listenerSet);

    return {
      get matches() { return matchesMap[query] ?? false; },
      media: query,
      onchange: null,
      addEventListener: (_type: string, handler: EventListenerOrEventListenerObject) => {
        listenerSet.add(handler as () => void);
      },
      removeEventListener: (_type: string, handler: EventListenerOrEventListenerObject) => {
        listenerSet.delete(handler as () => void);
      },
      dispatchEvent: () => false,
      addListener: () => {},
      removeListener: () => {},
    } as unknown as MediaQueryList;
  });

  function triggerAll() {
    for (const listenerSet of allListeners.values()) {
      for (const handler of listenerSet) {
        handler();
      }
    }
  }

  return { mock, matchesMap, triggerAll };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  // Reset connection
  try {
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  } catch { /* ignore */ }
});

describe('useMotionCapability — hook (jsdom)', () => {
  it('returns false when all matchMedia signals are false (system preference)', () => {
    const { mock } = buildMatchMediaMock({
      [REDUCED_QUERY]: false,
      [POINTER_QUERY]: false,
    });
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mock });

    const box = { value: false };
    mountHook(box);
    expect(box.value).toBe(false);
  });

  it('returns true when all signals enable motion (system preference)', () => {
    const { mock } = buildMatchMediaMock({
      [REDUCED_QUERY]: true,
      [POINTER_QUERY]: true,
    });
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mock });
    // Ensure no Save-Data
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const box = { value: false };
    mountHook(box);
    expect(box.value).toBe(true);
  });

  it('returns false when only prefersNoPreference is true but pointer is coarse', () => {
    const { mock } = buildMatchMediaMock({
      [REDUCED_QUERY]: true,
      [POINTER_QUERY]: false,
    });
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mock });

    const box = { value: false };
    mountHook(box);
    expect(box.value).toBe(false);
  });

  it('returns false when Save-Data is set even if media queries match', () => {
    const { mock } = buildMatchMediaMock({
      [REDUCED_QUERY]: true,
      [POINTER_QUERY]: true,
    });
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mock });
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
      writable: true,
    });

    const box = { value: true };
    mountHook(box);
    expect(box.value).toBe(false);
  });

  it('updates when a media query fires a change event', () => {
    // Start with all-false so motion is disabled
    const matchesMap: Record<string, boolean> = {
      [REDUCED_QUERY]: false,
      [POINTER_QUERY]: false,
    };
    const { mock, triggerAll } = buildMatchMediaMock(matchesMap);
    Object.defineProperty(window, 'matchMedia', { writable: true, value: mock });
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const box = { value: false };
    const { root, container } = mountHook(box);
    expect(box.value).toBe(false);

    // Flip both queries to "all-true" and fire listeners
    act(() => {
      matchesMap[REDUCED_QUERY] = true;
      matchesMap[POINTER_QUERY] = true;
      triggerAll();
    });

    // Re-render probe to read updated value
    function Probe() {
      box.value = useMotionCapability();
      return null;
    }
    act(() => { root.render(createElement(Probe)); });

    expect(box.value).toBe(true);

    // Cleanup
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });
});
