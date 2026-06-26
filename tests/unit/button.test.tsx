// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// Without this, React emits a warning to stderr (tests still pass, but the
// output is noisy). This must be set before any React imports.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { Button } from '@/components/ui/Button';

// Stub useMotionCapability so tests control the gate deterministically.
// The module is a 'use client' directive file; we mock before any import resolves.
vi.mock('@/lib/motion/capability', () => ({
  useMotionCapability: vi.fn(() => false),
}));

import { useMotionCapability } from '@/lib/motion/capability';

const mockedUseMotionCapability = useMotionCapability as ReturnType<typeof vi.fn>;

// Helpers
function renderToDOM(ui: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(ui);
  });
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
  mockedUseMotionCapability.mockReturnValue(false);
});

// ─── Focus-visible token ──────────────────────────────────────────────────────

describe('Button — base classes', () => {
  it('always includes the focus-visible outline-lime token', () => {
    const container = renderToDOM(<Button>Test</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('focus-visible:outline-lime');
  });

  it('renders as a <button> by default', () => {
    const container = renderToDOM(<Button>Click</Button>);
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('passes through extra HTML attributes', () => {
    const container = renderToDOM(<Button aria-label="close" disabled>X</Button>);
    const btn = container.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe('close');
    expect(btn?.disabled).toBe(true);
  });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

describe('Button — variant classes', () => {
  it('default variant applies bg-blaze text-paper', () => {
    const container = renderToDOM(<Button variant="default">Buy</Button>);
    const cls = container.querySelector('button')?.className ?? '';
    expect(cls).toContain('bg-blaze');
    expect(cls).toContain('text-paper');
  });

  it('ghost variant applies bg-transparent text-ink', () => {
    const container = renderToDOM(<Button variant="ghost">Skip</Button>);
    const cls = container.querySelector('button')?.className ?? '';
    expect(cls).toContain('bg-transparent');
    expect(cls).toContain('text-ink');
  });

  it('magnetic variant (motion disabled) degrades to default styling — bg-blaze text-paper, NO transform style', () => {
    // motionEnabled is false (mock default), so magnetic should behave as default
    const container = renderToDOM(<Button variant="magnetic">Attract</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-blaze');
    expect(btn?.className).toContain('text-paper');
    // No transform style attached when motion gate is false
    expect(btn?.style.transform).toBeFalsy();
  });

  it('magnetic variant (motion enabled) attaches transform style', () => {
    mockedUseMotionCapability.mockReturnValue(true);
    const container = renderToDOM(<Button variant="magnetic">Attract</Button>);
    const btn = container.querySelector('button');
    expect(btn?.style.transform).toBe('translate(0px, 0px)');
    expect(btn?.style.transition).toContain('transform');
  });

  it('magnetic variant (motion enabled) includes will-change-transform', () => {
    mockedUseMotionCapability.mockReturnValue(true);
    const container = renderToDOM(<Button variant="magnetic">Attract</Button>);
    const cls = container.querySelector('button')?.className ?? '';
    expect(cls).toContain('will-change-transform');
  });
});

// ─── asChild ──────────────────────────────────────────────────────────────────

describe('Button — asChild', () => {
  it('clones a single child and merges className instead of rendering a <button>', () => {
    const container = renderToDOM(
      <Button asChild variant="default">
        <a href="/shop">Shop</a>
      </Button>,
    );
    // No <button> should appear
    expect(container.querySelector('button')).toBeNull();
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.className).toContain('bg-blaze');
    expect(link?.className).toContain('focus-visible:outline-lime');
    expect(link?.getAttribute('href')).toBe('/shop');
  });

  it('asChild preserves the child own className alongside Button classes', () => {
    const container = renderToDOM(
      <Button asChild variant="ghost">
        <a href="/" className="my-custom">Home</a>
      </Button>,
    );
    const link = container.querySelector('a');
    expect(link?.className).toContain('my-custom');
    expect(link?.className).toContain('bg-transparent');
  });

  it('falls back to rendering a <button> when asChild is false', () => {
    const container = renderToDOM(
      <Button asChild={false} variant="default">
        <span>Text</span>
      </Button>,
    );
    expect(container.querySelector('button')).not.toBeNull();
  });
});

// ─── className merge ──────────────────────────────────────────────────────────

describe('Button — className merge', () => {
  it('appends a custom className after the base + variant classes', () => {
    const container = renderToDOM(<Button className="custom-override">Ok</Button>);
    const cls = container.querySelector('button')?.className ?? '';
    expect(cls).toContain('custom-override');
    expect(cls).toContain('bg-blaze'); // variant still present
  });
});
