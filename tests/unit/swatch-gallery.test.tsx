// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { SwatchGallery } from '@/components/pdp/SwatchGallery';
import type { PdpView } from '@/lib/pdp/selection';

vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string) => key,
}));
// Isolate the swatch radiogroup — the image is exercised by product-image.test.
vi.mock('@/components/product/ProductImage', () => ({ ProductImage: () => null }));

afterEach(() => {
  document.body.innerHTML = '';
});

function makeView(colors: string[]): PdpView {
  return {
    colors,
    sizes: [],
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

function swatches(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]'));
}

function swatch(container: HTMLElement, color: string): HTMLElement {
  return container.querySelector<HTMLElement>(`[data-testid="swatch-${color}"]`)!;
}

describe('SwatchGallery — roving tabindex + arrow keys', () => {
  it('only the selected swatch is in the tab order (tabIndex 0); the rest are -1', () => {
    const container = render(
      <SwatchGallery
        productId="p"
        view={makeView(['Ink', 'Bone', 'Blaze'])}
        selectedColor="Bone"
        onSelectColor={() => {}}
        locale="en"
      />,
    );
    expect(swatch(container, 'Bone').tabIndex).toBe(0);
    expect(swatch(container, 'Ink').tabIndex).toBe(-1);
    expect(swatch(container, 'Blaze').tabIndex).toBe(-1);
  });

  it('ArrowRight moves focus to the next swatch', () => {
    const container = render(
      <SwatchGallery
        productId="p"
        view={makeView(['Ink', 'Bone', 'Blaze'])}
        selectedColor="Ink"
        onSelectColor={() => {}}
        locale="en"
      />,
    );
    const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const [ink, bone] = swatches(container);
    act(() => ink?.focus());
    expect(document.activeElement).toBe(ink);
    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });
    expect(document.activeElement).toBe(bone);
  });

  it('ArrowLeft wraps from the first swatch to the last', () => {
    const container = render(
      <SwatchGallery
        productId="p"
        view={makeView(['Ink', 'Bone', 'Blaze'])}
        selectedColor="Ink"
        onSelectColor={() => {}}
        locale="en"
      />,
    );
    const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const radios = swatches(container);
    const ink = radios[0];
    const blaze = radios[2];
    act(() => ink?.focus());
    act(() => {
      group.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      );
    });
    expect(document.activeElement).toBe(blaze);
  });
});
