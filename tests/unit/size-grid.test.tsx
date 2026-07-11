// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { SizeGrid } from '@/components/pdp/SizeGrid';
import type { PdpView } from '@/lib/pdp/selection';

// Stub next-intl
vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string) => key,
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// ─── Minimal PdpView factory ──────────────────────────────────────────────────

function makeView(sizes: string[], soldOut?: string[]): PdpView {
  return {
    colors: ['Ink'],
    sizes: sizes.map((s) => ({
      size: s,
      variantId: `v-${s}`,
      availability: soldOut?.includes(s) ? 'sold_out' : 'live',
      selectable: !soldOut?.includes(s),
    })),
    selectedVariant: null,
    selectedAvailability: null,
    gallery: [],
    lowStockRemaining: null,
  };
}

function render(ui: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(ui);
  });
  return container;
}

function radioButtons(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]'));
}

// ─── Roving tabindex ──────────────────────────────────────────────────────────

describe('SizeGrid — roving tabindex', () => {
  it('first selectable radio has tabIndex=0 when nothing is selected', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const [s, m, l] = radioButtons(container);
    expect(s?.tabIndex).toBe(0);
    expect(m?.tabIndex).toBe(-1);
    expect(l?.tabIndex).toBe(-1);
  });

  it('selected radio has tabIndex=0; all others -1', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize="M" onSelectSize={() => {}} />,
    );
    const [s, m, l] = radioButtons(container);
    expect(s?.tabIndex).toBe(-1);
    expect(m?.tabIndex).toBe(0);
    expect(l?.tabIndex).toBe(-1);
  });

  it('skips sold-out as first tabIndex=0; lands on first selectable', () => {
    const view = makeView(['XS', 'S', 'M'], ['XS']); // XS is sold-out / not selectable
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const buttons = radioButtons(container);
    // XS is unselectable — first selectable is S
    const xs = buttons.find((b) => b.dataset.testid === 'size-XS');
    const s = buttons.find((b) => b.dataset.testid === 'size-S');
    expect(xs?.tabIndex).toBe(-1);
    expect(s?.tabIndex).toBe(0);
  });

  it('ArrowRight moves focus to next radio', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const [s, m] = radioButtons(container);

    // Focus S, then fire ArrowRight on the group.
    act(() => { s?.focus(); });
    expect(document.activeElement).toBe(s);

    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });

    expect(document.activeElement).toBe(m);
  });

  it('ArrowLeft wraps from first to last', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const [s, , l] = radioButtons(container);

    act(() => { s?.focus(); });

    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      );
    });

    expect(document.activeElement).toBe(l);
  });

  it('ArrowRight wraps from last to first', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const [s, , l] = radioButtons(container);

    act(() => { l?.focus(); });

    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });

    expect(document.activeElement).toBe(s);
  });
});

// ─── ARIA ─────────────────────────────────────────────────────────────────────

describe('SizeGrid — ARIA', () => {
  it('has role="radiogroup" on the wrapper', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const group = container.querySelector('[role="radiogroup"]');
    expect(group).not.toBeNull();
  });

  it('each size button has role="radio"', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize={null} onSelectSize={() => {}} />,
    );
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios.length).toBe(3);
  });

  it('selected radio has aria-checked="true"', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize="L" onSelectSize={() => {}} />,
    );
    const l = container.querySelector<HTMLElement>('[data-testid="size-L"]');
    expect(l?.getAttribute('aria-checked')).toBe('true');
  });

  it('unselected radios have aria-checked="false"', () => {
    const view = makeView(['S', 'M', 'L']);
    const container = render(
      <SizeGrid view={view} selectedSize="L" onSelectSize={() => {}} />,
    );
    const s = container.querySelector<HTMLElement>('[data-testid="size-S"]');
    expect(s?.getAttribute('aria-checked')).toBe('false');
  });
});
