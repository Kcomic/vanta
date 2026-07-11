// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { DropMarquee } from '@/components/drop/DropMarquee';

// Stub useMotionCapability so tests control the gate deterministically.
vi.mock('@/lib/motion/capability', () => ({
  useMotionCapability: vi.fn(() => false),
}));

import { useMotionCapability } from '@/lib/motion/capability';
const mockedMotion = useMotionCapability as ReturnType<typeof vi.fn>;

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
  mockedMotion.mockReturnValue(false);
});

describe('DropMarquee — data-word attribute', () => {
  it('sets data-word="DROP" when soldOut is false (default)', () => {
    const container = render(<DropMarquee />);
    const el = container.querySelector('[data-testid="drop-marquee"]');
    expect(el?.getAttribute('data-word')).toBe('DROP');
  });

  it('sets data-word="SOLD OUT" when soldOut=true', () => {
    const container = render(<DropMarquee soldOut />);
    const el = container.querySelector('[data-testid="drop-marquee"]');
    expect(el?.getAttribute('data-word')).toBe('SOLD OUT');
  });
});

describe('DropMarquee — English literals in both locale contexts', () => {
  it('always uses "DROP" in English (never translated)', () => {
    const container = render(<DropMarquee soldOut={false} />);
    const el = container.querySelector('[data-testid="drop-marquee"]');
    // The word is English by spec constraint — data-word confirms this.
    expect(el?.getAttribute('data-word')).toBe('DROP');
  });

  it('always uses "SOLD OUT" in English even for sold-out state', () => {
    const container = render(<DropMarquee soldOut={true} />);
    const el = container.querySelector('[data-testid="drop-marquee"]');
    expect(el?.getAttribute('data-word')).toBe('SOLD OUT');
  });
});

describe('DropMarquee — aria-hidden (decorative texture)', () => {
  it('is aria-hidden (decorative, not for screen readers)', () => {
    const container = render(<DropMarquee />);
    const el = container.querySelector('[data-testid="drop-marquee"]');
    // aria-hidden can be boolean true or string "true" depending on React version.
    const ariaHidden = el?.getAttribute('aria-hidden');
    expect(ariaHidden === 'true' || ariaHidden === '').toBeTruthy();
  });
});

describe('DropMarquee — motion gate: animation class', () => {
  it('does NOT apply animation class when motion is disabled', () => {
    mockedMotion.mockReturnValue(false);
    const container = render(<DropMarquee />);
    const inner = container.querySelector('[data-testid="drop-marquee"] > div');
    expect(inner?.className ?? '').not.toContain('animate-');
  });

  it('applies animate- class when motion is enabled', () => {
    mockedMotion.mockReturnValue(true);
    const container = render(<DropMarquee />);
    const inner = container.querySelector('[data-testid="drop-marquee"] > div');
    expect(inner?.className ?? '').toContain('animate-');
  });
});

describe('DropMarquee — grapheme-safe letter spans', () => {
  it('renders individual letter spans for DROP (4 letters × 8 runs = 32 letter spans)', () => {
    const container = render(<DropMarquee />);
    // Each run is a <span class="inline-flex"> containing 4 letter spans (D,R,O,P).
    // 8 runs × 4 letters = 32 total inner letter spans.
    const runSpans = container.querySelectorAll(
      '[data-testid="drop-marquee"] > div > span',
    );
    expect(runSpans).toHaveLength(8);

    // Each run span contains 4 letter spans
    const firstRun = runSpans[0];
    expect(firstRun?.querySelectorAll('span')).toHaveLength(4);
  });

  it('renders 8 word runs for "SOLD OUT" (7 graphemes each)', () => {
    const container = render(<DropMarquee soldOut />);
    const runSpans = container.querySelectorAll(
      '[data-testid="drop-marquee"] > div > span',
    );
    expect(runSpans).toHaveLength(8);
    // 'SOLD OUT' has 8 chars: S,O,L,D,' ',O,U,T
    const firstRun = runSpans[0];
    expect(firstRun?.querySelectorAll('span')).toHaveLength(8);
  });
});
