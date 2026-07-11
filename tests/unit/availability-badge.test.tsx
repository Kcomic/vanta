// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { AvailabilityBadge } from '@/components/drop/AvailabilityBadge';
import type { Availability } from '@/lib/domain';

// Stub next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, args?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      soldOut: 'SOLD OUT',
      comingSoon: 'DROPS IN',
      earlyAccessLocked: 'MEMBER EARLY ACCESS',
      live: 'LIVE NOW',
      lowStock: `ONLY ${args?.count ?? '?'} LEFT`,
    };
    return map[key] ?? key;
  },
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

const cases: Array<{ availability: Availability; stock: number; testid: string; text: string }> = [
  { availability: 'sold_out', stock: 0, testid: 'badge-sold-out', text: 'SOLD OUT' },
  { availability: 'coming_soon', stock: 20, testid: 'badge-coming-soon', text: 'DROPS IN' },
  { availability: 'early_access', stock: 20, testid: 'badge-early-access', text: 'MEMBER EARLY ACCESS' },
  { availability: 'low_stock', stock: 3, testid: 'badge-low-stock', text: 'ONLY 3 LEFT' },
  { availability: 'live', stock: 20, testid: 'badge-live', text: 'LIVE NOW' },
];

describe('AvailabilityBadge — renders correct badge per availability state', () => {
  for (const { availability, stock, testid, text } of cases) {
    it(`${availability} renders [data-testid="${testid}"] with expected label`, () => {
      const container = render(
        <AvailabilityBadge availability={availability} stock={stock} />,
      );
      const el = container.querySelector(`[data-testid="${testid}"]`);
      expect(el, `badge for ${availability} should exist`).not.toBeNull();
      expect(el?.textContent).toContain(text);
    });
  }
});

describe('AvailabilityBadge — only one badge renders at a time', () => {
  it('renders exactly one element for any given availability', () => {
    const container = render(<AvailabilityBadge availability="low_stock" stock={2} />);
    const badges = container.querySelectorAll('[data-testid^="badge-"]');
    expect(badges).toHaveLength(1);
  });
});

describe('AvailabilityBadge — low_stock interpolates count', () => {
  it('shows the exact stock count in the label', () => {
    const container = render(<AvailabilityBadge availability="low_stock" stock={4} />);
    const el = container.querySelector('[data-testid="badge-low-stock"]');
    expect(el?.textContent).toContain('4');
  });
});
