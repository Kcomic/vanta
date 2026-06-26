// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { Dialog } from '@/components/ui/Dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Root = ReturnType<typeof createRoot>;

function renderDialog(
  ui: React.ReactElement,
): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

afterEach(() => {
  // Unmount all roots and clean body
  document.body.innerHTML = '';
  // Reset scroll lock
  document.body.style.overflow = '';
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Dialog — rendering', () => {
  it('renders nothing when open=false', () => {
    const { container } = renderDialog(
      <Dialog open={false} onClose={() => {}}>
        <p>Hidden</p>
      </Dialog>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the panel when open=true', () => {
    const { container } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('panel has aria-modal="true"', () => {
    const { container } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    const panel = container.querySelector('[role="dialog"]');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
  });

  it('panel has aria-labelledby when labelledById is provided', () => {
    const { container } = renderDialog(
      <Dialog open={true} onClose={() => {}} labelledById="dialog-title">
        <h2 id="dialog-title">Cart</h2>
      </Dialog>,
    );
    const panel = container.querySelector('[role="dialog"]');
    expect(panel?.getAttribute('aria-labelledby')).toBe('dialog-title');
  });

  it('panel has no aria-labelledby when labelledById is omitted', () => {
    const { container } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    const panel = container.querySelector('[role="dialog"]');
    expect(panel?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('renders children inside the panel', () => {
    const { container } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <span data-testid="inner">Hello</span>
      </Dialog>,
    );
    expect(container.querySelector('[data-testid="inner"]')).not.toBeNull();
  });
});

// ─── Scroll lock ──────────────────────────────────────────────────────────────

describe('Dialog — body scroll lock', () => {
  it('sets body overflow to hidden when open', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <button>X</button>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed (transition open→closed)', () => {
    const originalOverflow = 'auto';
    document.body.style.overflow = originalOverflow;

    let onClose = () => {};
    const { root } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <button>X</button>
      </Dialog>,
    );

    // Verify locked
    expect(document.body.style.overflow).toBe('hidden');

    // Close it
    act(() => {
      root.render(
        <Dialog open={false} onClose={onClose}>
          <button>X</button>
        </Dialog>,
      );
    });

    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it('does NOT lock body when closed', () => {
    renderDialog(
      <Dialog open={false} onClose={() => {}}>
        <button>X</button>
      </Dialog>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

// ─── Focus management ─────────────────────────────────────────────────────────

describe('Dialog — focus management', () => {
  it('moves focus into the panel when opened', () => {
    // Place a trigger in body before the dialog
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();

    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dialog open={true} onClose={() => {}}>
          <button id="first-focusable">Close</button>
        </Dialog>,
      );
    });

    const firstBtn = document.getElementById('first-focusable');
    expect(document.activeElement).toBe(firstBtn);
  });

  it('returns focus to previously focused element when closed', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    // Open
    act(() => {
      root.render(
        <Dialog open={true} onClose={() => {}}>
          <button>Close</button>
        </Dialog>,
      );
    });

    // Close
    act(() => {
      root.render(
        <Dialog open={false} onClose={() => {}}>
          <button>Close</button>
        </Dialog>,
      );
    });

    expect(document.activeElement).toBe(trigger);
  });

  it('falls back to focusing the panel itself when no focusable child exists', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dialog open={true} onClose={() => {}}>
          <p>No focusable elements here</p>
        </Dialog>,
      );
    });

    const panel = container.querySelector('[role="dialog"]');
    // The panel itself (tabIndex=-1) should be focused
    expect(document.activeElement).toBe(panel);
  });
});

// ─── Keyboard behaviour ───────────────────────────────────────────────────────

describe('Dialog — keyboard: Escape', () => {
  it('calls onClose when Escape is pressed while open', () => {
    const onClose = vi.fn();

    renderDialog(
      <Dialog open={true} onClose={onClose}>
        <button>Close</button>
      </Dialog>,
    );

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when Escape is pressed while closed', () => {
    const onClose = vi.fn();

    renderDialog(
      <Dialog open={false} onClose={onClose}>
        <button>Close</button>
      </Dialog>,
    );

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Dialog — keyboard: Tab focus trap', () => {
  it('wraps Tab forward from last focusable back to first', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dialog open={true} onClose={() => {}}>
          <button id="btn-a">A</button>
          <button id="btn-b">B</button>
          <button id="btn-c">C</button>
        </Dialog>,
      );
    });

    const last = document.getElementById('btn-c') as HTMLElement;
    const first = document.getElementById('btn-a') as HTMLElement;

    // Focus the last element
    act(() => { last.focus(); });
    expect(document.activeElement).toBe(last);

    // Tab forward from last → should wrap to first
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab backward from first focusable back to last', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(
        <Dialog open={true} onClose={() => {}}>
          <button id="btn-x">X</button>
          <button id="btn-y">Y</button>
          <button id="btn-z">Z</button>
        </Dialog>,
      );
    });

    const first = document.getElementById('btn-x') as HTMLElement;
    const last = document.getElementById('btn-z') as HTMLElement;

    // Focus the first element
    act(() => { first.focus(); });
    expect(document.activeElement).toBe(first);

    // Shift+Tab from first → should wrap to last
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(document.activeElement).toBe(last);
  });
});

// ─── Click-outside / backdrop ─────────────────────────────────────────────────

describe('Dialog — backdrop (click-outside)', () => {
  it('calls onClose when the backdrop button is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderDialog(
      <Dialog open={true} onClose={onClose}>
        <button>Close</button>
      </Dialog>,
    );

    const backdrop = container.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement;
    expect(backdrop).not.toBeNull();

    act(() => {
      backdrop.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Return type ─────────────────────────────────────────────────────────────

describe('Dialog — return type', () => {
  it('returns null when closed (React tree renders nothing)', () => {
    const { container } = renderDialog(
      <Dialog open={false} onClose={() => {}}>
        <p>Hidden</p>
      </Dialog>,
    );
    // Nothing meaningful rendered
    expect(container.children.length).toBe(0);
  });
});
