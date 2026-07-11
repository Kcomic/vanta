// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { CartLineItem, type CartLineItemView } from '@/components/cart/CartLineItem';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports of the mocked modules
// ---------------------------------------------------------------------------

// next/image: strip it to a plain <img> so jsdom can render it without error.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) => React.createElement('img', { src, alt, className }),
}));

// next-intl: stub useLocale and useTranslations so tests control locale + copy.
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn((ns: string) => {
    const dict: Record<string, Record<string, string>> = {
      cart: {
        remove: 'Remove',
        decrease: 'Decrease quantity',
        increase: 'Increase quantity',
        quantityLabel: 'Quantity',
      },
    };
    return (key: string) => dict[ns]?.[key] ?? key;
  }),
}));

import { useLocale, useTranslations } from 'next-intl';

const mockedUseLocale = useLocale as ReturnType<typeof vi.fn>;
const mockedUseTranslations = useTranslations as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLine(overrides: Partial<CartLineItemView> = {}): CartLineItemView {
  return {
    variantId: 'var_test',
    title: { en: 'VOID HOODIE', th: 'เสื้อฮู้ด VOID' },
    size: 'M',
    color: 'Black',
    unitPrice: { amount: 199000, currency: 'THB' },
    quantity: 2,
    imageUrl: '/images/hoodie.jpg',
    maxStock: 10,
    ...overrides,
  };
}

const roots: ReturnType<typeof createRoot>[] = [];

function renderItem(
  line: CartLineItemView,
  onQuantityChange = vi.fn(),
  onRemove = vi.fn(),
  disabled = false,
): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(
      <ul>
        <CartLineItem
          line={line}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          disabled={disabled}
        />
      </ul>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
  mockedUseLocale.mockReturnValue('en');
  mockedUseTranslations.mockImplementation((ns: string) => {
    const dict: Record<string, Record<string, string>> = {
      cart: {
        remove: 'Remove',
        decrease: 'Decrease quantity',
        increase: 'Increase quantity',
        quantityLabel: 'Quantity',
      },
    };
    return (key: string) => dict[ns]?.[key] ?? key;
  });
});

// ---------------------------------------------------------------------------
// Module shape
// ---------------------------------------------------------------------------

describe('CartLineItem module exports', () => {
  it('exports CartLineItem as a function', () => {
    expect(typeof CartLineItem).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Rendering — locale en
// ---------------------------------------------------------------------------

describe('CartLineItem rendering (en locale)', () => {
  it('renders as an <li> element', () => {
    const container = renderItem(makeLine());
    expect(container.querySelector('li')).not.toBeNull();
  });

  it('sets data-variant-id on the <li>', () => {
    const container = renderItem(makeLine({ variantId: 'var_abc' }));
    expect(container.querySelector('li')?.getAttribute('data-variant-id')).toBe('var_abc');
  });

  it('renders the English product title', () => {
    const container = renderItem(makeLine());
    expect(container.textContent).toContain('VOID HOODIE');
  });

  it('renders size and color', () => {
    const container = renderItem(makeLine({ size: 'L', color: 'White' }));
    expect(container.textContent).toContain('L');
    expect(container.textContent).toContain('White');
  });

  it('renders the quantity', () => {
    const container = renderItem(makeLine({ quantity: 3 }));
    expect(container.textContent).toContain('3');
  });

  it('renders the product image with correct alt text (en locale)', () => {
    const container = renderItem(makeLine());
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('VOID HOODIE');
    expect(img?.getAttribute('src')).toBe('/images/hoodie.jpg');
  });

  it('renders the line total (unitPrice × quantity) via formatMoney', () => {
    // 199000 satang × 2 = 398000 satang = ฿3,980
    const container = renderItem(makeLine({ unitPrice: { amount: 199000, currency: 'THB' }, quantity: 2 }));
    // Normalise Unicode spaces and check for ฿ sign + 3,980 or 3 980 grouping
    const text = container.textContent?.replace(/[  ]/g, ' ') ?? '';
    expect(text).toMatch(/฿/);
    expect(text).toMatch(/3[,\s]?980/);
  });
});

// ---------------------------------------------------------------------------
// Rendering — locale th
// ---------------------------------------------------------------------------

describe('CartLineItem rendering (th locale)', () => {
  it('renders the Thai product title when locale is th', () => {
    mockedUseLocale.mockReturnValue('th');
    mockedUseTranslations.mockImplementation((ns: string) => {
      const dict: Record<string, Record<string, string>> = {
        cart: {
          remove: 'นำออก',
          decrease: 'ลดจำนวน',
          increase: 'เพิ่มจำนวน',
          quantityLabel: 'จำนวน',
        },
      };
      return (key: string) => dict[ns]?.[key] ?? key;
    });
    const container = renderItem(makeLine());
    expect(container.textContent).toContain('เสื้อฮู้ด VOID');
  });

  it('renders Thai alt text on the image for th locale', () => {
    mockedUseLocale.mockReturnValue('th');
    mockedUseTranslations.mockImplementation(() => (key: string) => key);
    const container = renderItem(makeLine());
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('เสื้อฮู้ด VOID');
  });
});

// ---------------------------------------------------------------------------
// Callbacks
// ---------------------------------------------------------------------------

describe('CartLineItem callbacks', () => {
  it('calls onRemove with variantId when the remove button is clicked', () => {
    const onRemove = vi.fn();
    const container = renderItem(makeLine({ variantId: 'var_rm' }), vi.fn(), onRemove);
    const removeBtn = container.querySelector('button[class*="underline"]') as HTMLButtonElement;
    act(() => { removeBtn.click(); });
    expect(onRemove).toHaveBeenCalledWith('var_rm');
  });

  it('calls onQuantityChange(variantId, qty - 1) when decrease is clicked', () => {
    const onQuantityChange = vi.fn();
    const container = renderItem(makeLine({ variantId: 'var_q', quantity: 3 }), onQuantityChange);
    const decreaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Decrease quantity"]')!;
    act(() => { decreaseBtn.click(); });
    expect(onQuantityChange).toHaveBeenCalledWith('var_q', 2);
  });

  it('calls onQuantityChange(variantId, qty + 1) when increase is clicked', () => {
    const onQuantityChange = vi.fn();
    const container = renderItem(makeLine({ variantId: 'var_q', quantity: 3 }), onQuantityChange);
    const increaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Increase quantity"]')!;
    act(() => { increaseBtn.click(); });
    expect(onQuantityChange).toHaveBeenCalledWith('var_q', 4);
  });
});

// ---------------------------------------------------------------------------
// disabled prop
// ---------------------------------------------------------------------------

describe('CartLineItem disabled prop', () => {
  it('disables the remove button when disabled=true', () => {
    const container = renderItem(makeLine(), vi.fn(), vi.fn(), true);
    const removeBtn = container.querySelector<HTMLButtonElement>('button[class*="underline"]')!;
    expect(removeBtn.disabled).toBe(true);
  });

  it('disables the decrease button when disabled=true', () => {
    const container = renderItem(makeLine(), vi.fn(), vi.fn(), true);
    const decreaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Decrease quantity"]')!;
    expect(decreaseBtn.disabled).toBe(true);
  });

  it('disables the increase button when disabled=true', () => {
    const container = renderItem(makeLine(), vi.fn(), vi.fn(), true);
    const increaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Increase quantity"]')!;
    expect(increaseBtn.disabled).toBe(true);
  });

  it('does NOT disable the buttons when disabled is omitted (defaults false)', () => {
    const container = renderItem(makeLine());
    const removeBtn = container.querySelector<HTMLButtonElement>('button[class*="underline"]')!;
    expect(removeBtn.disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// maxStock guard
// ---------------------------------------------------------------------------

describe('CartLineItem maxStock guard', () => {
  it('disables the increase button when quantity >= maxStock', () => {
    const container = renderItem(makeLine({ quantity: 5, maxStock: 5 }));
    const increaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Increase quantity"]')!;
    expect(increaseBtn.disabled).toBe(true);
  });

  it('enables the increase button when quantity < maxStock', () => {
    const container = renderItem(makeLine({ quantity: 4, maxStock: 5 }));
    const increaseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Increase quantity"]')!;
    expect(increaseBtn.disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('CartLineItem accessibility', () => {
  it('quantity control group has role="group" and aria-label', () => {
    const container = renderItem(makeLine());
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.getAttribute('aria-label')).toBe('Quantity');
  });

  it('decrease button has aria-label', () => {
    const container = renderItem(makeLine());
    const btn = container.querySelector('button[aria-label="Decrease quantity"]');
    expect(btn).not.toBeNull();
  });

  it('increase button has aria-label', () => {
    const container = renderItem(makeLine());
    const btn = container.querySelector('button[aria-label="Increase quantity"]');
    expect(btn).not.toBeNull();
  });
});
