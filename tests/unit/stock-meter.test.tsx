// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { StockMeter } from '@/components/drop/StockMeter';
import { LOW_STOCK_THRESHOLD } from '@/lib/services/availability';

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

describe('StockMeter — ARIA attributes', () => {
  it('has role="meter" with aria-valuenow/min/max', () => {
    const container = render(<StockMeter stock={10} max={20} />);
    const el = container.querySelector('[data-testid="stock-meter"]');
    expect(el?.getAttribute('role')).toBe('meter');
    expect(el?.getAttribute('aria-valuenow')).toBe('10');
    expect(el?.getAttribute('aria-valuemin')).toBe('0');
    expect(el?.getAttribute('aria-valuemax')).toBe('20');
  });
});

describe('StockMeter — data-stock attribute', () => {
  it('reflects clamped stock in data-stock', () => {
    const container = render(<StockMeter stock={7} max={20} />);
    const el = container.querySelector('[data-testid="stock-meter"]');
    expect(el?.getAttribute('data-stock')).toBe('7');
  });

  it('clamps stock to 0 when negative', () => {
    const container = render(<StockMeter stock={-5} max={20} />);
    const el = container.querySelector('[data-testid="stock-meter"]');
    expect(el?.getAttribute('data-stock')).toBe('0');
  });

  it('clamps stock to max when above max', () => {
    const container = render(<StockMeter stock={100} max={20} />);
    const el = container.querySelector('[data-testid="stock-meter"]');
    expect(el?.getAttribute('data-stock')).toBe('20');
  });
});

describe('StockMeter — fill bar width', () => {
  function getFillStyle(container: HTMLElement): string {
    const fill = container.querySelector('[data-testid="stock-meter"] > div');
    return (fill as HTMLElement | null)?.style.width ?? '';
  }

  it('50% width when stock=10 of max=20', () => {
    const container = render(<StockMeter stock={10} max={20} />);
    expect(getFillStyle(container)).toBe('50%');
  });

  it('100% width when stock equals max', () => {
    const container = render(<StockMeter stock={20} max={20} />);
    expect(getFillStyle(container)).toBe('100%');
  });

  it('0% width when stock=0', () => {
    const container = render(<StockMeter stock={0} max={20} />);
    expect(getFillStyle(container)).toBe('0%');
  });

  it('0% width when max=0 (guard against division by zero)', () => {
    const container = render(<StockMeter stock={0} max={0} />);
    expect(getFillStyle(container)).toBe('0%');
  });
});

describe('StockMeter — low-stock color (blaze vs smoke-300)', () => {
  function getFillClass(container: HTMLElement): string {
    const fill = container.querySelector('[data-testid="stock-meter"] > div');
    return (fill as HTMLElement | null)?.className ?? '';
  }

  // Token contract: lime is lime-on-dark ONLY and must stay <5% coverage.
  // Normal stock uses bg-smoke-300 (neutral) to reserve lime as a true accent.
  // Low stock uses bg-blaze (urgency signal).

  it('uses bg-smoke-300 (not bg-lime) when stock > LOW_STOCK_THRESHOLD', () => {
    const stock = LOW_STOCK_THRESHOLD + 1; // 6
    const container = render(<StockMeter stock={stock} max={20} />);
    expect(getFillClass(container)).toContain('bg-smoke-300');
    expect(getFillClass(container)).not.toContain('bg-blaze');
    expect(getFillClass(container)).not.toContain('bg-lime');
  });

  it('uses bg-blaze when 0 < stock <= LOW_STOCK_THRESHOLD', () => {
    const container = render(<StockMeter stock={LOW_STOCK_THRESHOLD} max={20} />);
    expect(getFillClass(container)).toContain('bg-blaze');
    expect(getFillClass(container)).not.toContain('bg-lime');
    expect(getFillClass(container)).not.toContain('bg-smoke-300');
  });

  it('uses bg-blaze at stock=1 (minimum low-stock)', () => {
    const container = render(<StockMeter stock={1} max={20} />);
    expect(getFillClass(container)).toContain('bg-blaze');
  });

  it('uses bg-smoke-300 when stock=0 (sold out — neutral, no urgency color)', () => {
    // stock=0 => isLow is false (0 > 0 is false), so it falls back to neutral smoke-300.
    const container = render(<StockMeter stock={0} max={20} />);
    expect(getFillClass(container)).toContain('bg-smoke-300');
    expect(getFillClass(container)).not.toContain('bg-lime');
  });
});

describe('StockMeter — default max', () => {
  it('defaults max to 20 when not supplied', () => {
    const container = render(<StockMeter stock={10} />);
    const el = container.querySelector('[data-testid="stock-meter"]');
    expect(el?.getAttribute('aria-valuemax')).toBe('20');
    const fill = el?.querySelector('div') as HTMLElement | null;
    expect(fill?.style.width).toBe('50%');
  });
});
