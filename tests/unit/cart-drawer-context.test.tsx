// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// Without this, React emits a warning to stderr. Must be set before React imports.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CartDrawerProvider, useCartDrawer } from '@/components/cart/CartDrawerContext';

// ---------------------------------------------------------------------------
// Minimal hook runner — renders a hook consumer inside (or outside) the
// provider, synchronously captures the result, then cleans up.
// ---------------------------------------------------------------------------

type DrawerAPI = ReturnType<typeof useCartDrawer>;

function makeRunner(withProvider: boolean) {
  let snapshot: DrawerAPI | undefined;
  let caughtError: Error | undefined;
  let root: Root;

  const container = document.createElement('div');
  document.body.appendChild(container);

  function HookConsumer() {
    try {
      snapshot = useCartDrawer();
    } catch (e) {
      caughtError = e as Error;
    }
    return null;
  }

  act(() => {
    root = createRoot(container);
    root.render(
      withProvider
        ? React.createElement(CartDrawerProvider, null, React.createElement(HookConsumer))
        : React.createElement(HookConsumer),
    );
  });

  return {
    get snap() {
      return snapshot;
    },
    get error() {
      return caughtError;
    },
    dispatch(fn: () => void) {
      act(fn);
    },
    cleanup() {
      act(() => root.unmount());
      document.body.removeChild(container);
    },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Module shape (these run in any environment — no rendering needed)
// ---------------------------------------------------------------------------

describe('CartDrawerContext module exports', () => {
  it('CartDrawerProvider is exported as a function', () => {
    expect(typeof CartDrawerProvider).toBe('function');
  });

  it('useCartDrawer is exported as a function', () => {
    expect(typeof useCartDrawer).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Error guard
// ---------------------------------------------------------------------------

describe('useCartDrawer outside <CartDrawerProvider>', () => {
  it('throws with the prescribed message', () => {
    const runner = makeRunner(false);
    try {
      expect(runner.error?.message).toBe(
        'useCartDrawer must be used within <CartDrawerProvider>',
      );
    } finally {
      runner.cleanup();
    }
  });
});

// ---------------------------------------------------------------------------
// Provider initial state + state transitions
// ---------------------------------------------------------------------------

describe('CartDrawerProvider state', () => {
  it('initialises isOpen = false', () => {
    const runner = makeRunner(true);
    try {
      expect(runner.snap?.isOpen).toBe(false);
    } finally {
      runner.cleanup();
    }
  });

  it('initialises announcement = ""', () => {
    const runner = makeRunner(true);
    try {
      expect(runner.snap?.announcement).toBe('');
    } finally {
      runner.cleanup();
    }
  });

  it('open() sets isOpen to true', () => {
    const runner = makeRunner(true);
    try {
      runner.dispatch(() => runner.snap!.open());
      expect(runner.snap?.isOpen).toBe(true);
    } finally {
      runner.cleanup();
    }
  });

  it('close() resets isOpen to false after open', () => {
    const runner = makeRunner(true);
    try {
      runner.dispatch(() => runner.snap!.open());
      runner.dispatch(() => runner.snap!.close());
      expect(runner.snap?.isOpen).toBe(false);
    } finally {
      runner.cleanup();
    }
  });

  it('setAnnouncement() updates the announcement string', () => {
    const runner = makeRunner(true);
    try {
      runner.dispatch(() => runner.snap!.setAnnouncement('Added to cart'));
      expect(runner.snap?.announcement).toBe('Added to cart');
    } finally {
      runner.cleanup();
    }
  });

  it('setAnnouncement("") clears the announcement', () => {
    const runner = makeRunner(true);
    try {
      runner.dispatch(() => runner.snap!.setAnnouncement('Something'));
      runner.dispatch(() => runner.snap!.setAnnouncement(''));
      expect(runner.snap?.announcement).toBe('');
    } finally {
      runner.cleanup();
    }
  });

  it('open/close/setAnnouncement refs are stable across re-renders (useCallback)', () => {
    const runner = makeRunner(true);
    try {
      const { open: open1, close: close1, setAnnouncement: set1 } = runner.snap!;
      // Trigger a state change → forces re-render
      runner.dispatch(() => runner.snap!.setAnnouncement('ping'));
      expect(runner.snap?.open).toBe(open1);
      expect(runner.snap?.close).toBe(close1);
      expect(runner.snap?.setAnnouncement).toBe(set1);
    } finally {
      runner.cleanup();
    }
  });
});
