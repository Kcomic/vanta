// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { ProductImage } from '@/components/product/ProductImage';

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

describe('ProductImage — real URL', () => {
  it('renders an <img> element when a non-empty url is provided', () => {
    const container = render(
      <ProductImage
        url="/images/products/void-tee.jpg"
        colorway="Black"
        title="VOID TEE"
        locale="en"
      />,
    );
    const img = container.querySelector('img');
    expect(img, 'should render an img element').not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/images/products/void-tee.jpg');
    expect(img?.getAttribute('alt')).toBe('VOID TEE');
  });

  it('uses eager loading when priority is true', () => {
    const container = render(
      <ProductImage
        url="/images/products/void-tee.jpg"
        colorway="Black"
        title="VOID TEE"
        locale="en"
        priority
      />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('eager');
  });

  it('uses lazy loading by default', () => {
    const container = render(
      <ProductImage
        url="/images/products/void-tee.jpg"
        colorway="Black"
        title="VOID TEE"
        locale="en"
      />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });
});

describe('ProductImage — branded placeholder (no url)', () => {
  it('renders the branded placeholder when url is absent', () => {
    const container = render(
      <ProductImage colorway="Black" title="VOID TEE" locale="en" />,
    );
    // No broken img element
    const img = container.querySelector('img');
    expect(img, 'should NOT render a broken img').toBeNull();
    // Placeholder wrapper is present
    const placeholder = container.querySelector('[data-testid="product-image-placeholder"]');
    expect(placeholder, 'placeholder should be present').not.toBeNull();
  });

  it('renders the branded placeholder when url is an empty string', () => {
    const container = render(
      <ProductImage url="" colorway="Smoke" title="VOID CARGO" locale="en" />,
    );
    const img = container.querySelector('img');
    expect(img).toBeNull();
    const placeholder = container.querySelector('[data-testid="product-image-placeholder"]');
    expect(placeholder).not.toBeNull();
  });

  it('sets data-colorway to the normalised colorway on the placeholder', () => {
    const container = render(
      <ProductImage colorway="Paper" title="VOID TEE" locale="en" />,
    );
    const placeholder = container.querySelector('[data-testid="product-image-placeholder"]');
    expect(placeholder?.getAttribute('data-colorway')).toBe('paper');
  });

  it('includes an SVG with an aria-label matching the product title', () => {
    const container = render(
      <ProductImage colorway="Ink" title="VOID HOODIE" locale="en" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-label')).toBe('VOID HOODIE');
  });

  it('renders a placeholder for every supported colorway without throwing', () => {
    const colorways = ['Black', 'Ink', 'Smoke', 'Paper', 'Blaze', 'Unknown'];
    for (const colorway of colorways) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      act(() => {
        createRoot(container).render(
          <ProductImage colorway={colorway} title="TEST" locale="en" />,
        );
      });
      expect(
        container.querySelector('[data-testid="product-image-placeholder"]'),
        `${colorway} should render placeholder`,
      ).not.toBeNull();
    }
  });
});
