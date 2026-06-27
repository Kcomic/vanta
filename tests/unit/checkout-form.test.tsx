// @vitest-environment jsdom
// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports that transitively need them
// ---------------------------------------------------------------------------

// next-intl: stub useTranslations so tests control copy.
vi.mock('next-intl', () => ({
  useTranslations: vi.fn((ns: string) => {
    const dict: Record<string, Record<string, string>> = {
      checkout: {
        title: 'Checkout',
        contactSection: 'Contact & shipping',
        paymentSection: 'Payment',
        email: 'Email',
        fullName: 'Full name',
        line1: 'Address',
        line2: 'Apartment, suite (optional)',
        city: 'City',
        postalCode: 'Postal code',
        country: 'Country',
        phone: 'Phone (optional)',
        summaryTitle: 'Order summary',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        total: 'Total',
        payButton: 'Pay',
        processing: 'Processing…',
        paymentMethod: 'Payment method',
        testCardSuccess: 'Test card — succeeds',
        testCardDecline: 'Test card — declines',
        errorDeclined: 'Your card was declined. Try the succeeding test card.',
        errorEmptyCart: 'Your cart is empty.',
        errorOutOfStock: 'An item went out of stock. Please review your cart.',
        emptyCartHeading: 'Nothing to check out',
        emptyCartCta: 'Continue shopping',
      },
    };
    return (key: string) => dict[ns]?.[key] ?? key;
  }),
}));

// Stub useRouter and useActionState plumbing so CheckoutForm can render.
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement('a', { href, className }, children),
}));

vi.mock('@/lib/actions/checkout-actions', () => ({
  placeOrder: vi.fn(),
}));

vi.mock('@/lib/store/cart-store', () => ({
  useCartStore: (selector: (s: { replaceFromServer: () => void }) => unknown) =>
    selector({ replaceFromServer: vi.fn() }),
}));

// useFormStatus — not available in test env; stub to not-pending.
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return { ...actual, useFormStatus: () => ({ pending: false }) };
});

// useActionState — provide a hook that returns [initial state, dispatch fn].
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: (
      _action: unknown,
      initialState: unknown,
    ): [unknown, () => void] => [initialState, vi.fn()],
  };
});

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PaymentMockForm } from '@/components/checkout/PaymentMockForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const roots: ReturnType<typeof createRoot>[] = [];

function render(element: React.ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => {
    root.render(element);
  });
  return container;
}

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots.length = 0;
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// PaymentMockForm
// ---------------------------------------------------------------------------

describe('PaymentMockForm', () => {
  it('renders a fieldset with two radio options', () => {
    const container = render(React.createElement(PaymentMockForm));
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(2);
  });

  it('has data-testid pay-token-ok and pay-token-decline', () => {
    const container = render(React.createElement(PaymentMockForm));
    expect(container.querySelector('[data-testid="pay-token-ok"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="pay-token-decline"]')).not.toBeNull();
  });

  it('submits paymentToken via native radios, defaulting to tok_ok', () => {
    const container = render(React.createElement(PaymentMockForm));
    const ok = container.querySelector<HTMLInputElement>('[data-testid="pay-token-ok"]')!;
    const decline = container.querySelector<HTMLInputElement>('[data-testid="pay-token-decline"]')!;
    // Both radios are the real submit field (name="paymentToken"); tok_ok is checked by default.
    expect(ok.name).toBe('paymentToken');
    expect(ok.value).toBe('tok_ok');
    expect(ok.defaultChecked).toBe(true);
    expect(decline.name).toBe('paymentToken');
    expect(decline.value).toBe('tok_decline');
  });

  it('shows the card numbers as hints', () => {
    const container = render(React.createElement(PaymentMockForm));
    expect(container.textContent).toContain('4242 4242 4242 4242');
    expect(container.textContent).toContain('4000 0000 0000 0002');
  });

  it('checking the decline radio makes it the selected paymentToken (native radio group)', () => {
    const container = render(React.createElement(PaymentMockForm));
    const ok = container.querySelector<HTMLInputElement>('[data-testid="pay-token-ok"]')!;
    const decline = container.querySelector<HTMLInputElement>('[data-testid="pay-token-decline"]')!;
    act(() => {
      decline.click();
    });
    // Native radio group: selecting decline unchecks ok; the submitted value is tok_decline.
    expect(decline.checked).toBe(true);
    expect(ok.checked).toBe(false);
  });

  it('renders the legend with paymentMethod copy', () => {
    const container = render(React.createElement(PaymentMockForm));
    const legend = container.querySelector('legend');
    expect(legend?.textContent).toBe('Payment method');
  });
});

// ---------------------------------------------------------------------------
// CheckoutForm
// ---------------------------------------------------------------------------

describe('CheckoutForm', () => {
  it('renders a <form> element', () => {
    const container = render(React.createElement(CheckoutForm));
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('renders contact section with aria-labelledby', () => {
    const container = render(React.createElement(CheckoutForm));
    const section = container.querySelector('section[aria-labelledby="contact-heading"]');
    expect(section).not.toBeNull();
  });

  it('renders payment section with aria-labelledby', () => {
    const container = render(React.createElement(CheckoutForm));
    const section = container.querySelector('section[aria-labelledby="payment-heading"]');
    expect(section).not.toBeNull();
  });

  it('renders email field with type=email', () => {
    const container = render(React.createElement(CheckoutForm));
    const emailInput = container.querySelector<HTMLInputElement>('input[name="email"]');
    expect(emailInput?.type).toBe('email');
  });

  it('renders all required address fields', () => {
    const container = render(React.createElement(CheckoutForm));
    const names = ['fullName', 'line1', 'city', 'postalCode', 'country'];
    for (const name of names) {
      expect(container.querySelector(`[name="${name}"]`), `field ${name} missing`).not.toBeNull();
    }
  });

  it('renders optional fields (line2, phone) without required attribute', () => {
    const container = render(React.createElement(CheckoutForm));
    const line2 = container.querySelector<HTMLInputElement>('input[name="line2"]');
    const phone = container.querySelector<HTMLInputElement>('input[name="phone"]');
    expect(line2?.required).toBe(false);
    expect(phone?.required).toBe(false);
  });

  it('defaults country field to TH', () => {
    const container = render(React.createElement(CheckoutForm));
    const country = container.querySelector<HTMLInputElement>('input[name="country"]');
    expect(country?.defaultValue).toBe('TH');
  });

  it('renders the submit button with data-testid checkout-pay', () => {
    const container = render(React.createElement(CheckoutForm));
    expect(container.querySelector('[data-testid="checkout-pay"]')).not.toBeNull();
  });

  it('submit button label is Pay (not Processing) when not pending', () => {
    const container = render(React.createElement(CheckoutForm));
    const btn = container.querySelector('[data-testid="checkout-pay"]');
    expect(btn?.textContent).toBe('Pay');
  });

  it('does NOT render the error banner when initial state is empty_cart (not a user-visible error)', () => {
    const container = render(React.createElement(CheckoutForm));
    // The initial state is { ok: false, error: 'empty_cart' } — only payment_declined
    // and out_of_stock map to visible error messages.
    expect(container.querySelector('[data-testid="checkout-error"]')).toBeNull();
  });

  it('each text field is wrapped in a <label> (a11y: label-input pairing)', () => {
    const container = render(React.createElement(CheckoutForm));
    // All <input> elements inside labels (not hidden inputs or radios in PaymentMockForm).
    const textInputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input[type="email"], input[type="tel"]',
    );
    for (const input of Array.from(textInputs)) {
      const insideLabel = input.closest('label');
      expect(insideLabel, `input[name="${input.name}"] not wrapped in <label>`).not.toBeNull();
    }
  });

  it('renders data-testid attributes for each field', () => {
    const container = render(React.createElement(CheckoutForm));
    const expectedTestIds = [
      'field-email', 'field-fullName', 'field-line1', 'field-line2',
      'field-city', 'field-postalCode', 'field-country', 'field-phone',
    ];
    for (const testId of expectedTestIds) {
      expect(
        container.querySelector(`[data-testid="${testId}"]`),
        `missing ${testId}`,
      ).not.toBeNull();
    }
  });
});
