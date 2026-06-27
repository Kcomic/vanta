// @vitest-environment jsdom

// Tell React 19 that act() is supported in this test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { Dialog } from '@/components/ui/Dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Root = ReturnType<typeof createRoot>;

// Track all roots so we can unmount them in afterEach, which triggers React
// cleanup effects (scroll-lock release, focus return, event listener removal).
const roots: Root[] = [];
const containers: HTMLElement[] = [];

function renderDialog(
  ui: React.ReactElement,
): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  roots.push(root);
  containers.push(container);
  return { container, root };
}

// Because Dialog uses createPortal(…, document.body), the role="dialog" element
// lives in document.body, not in `container`. Helper to find it anywhere in body.
function queryDialog(): Element | null {
  return document.body.querySelector('[role="dialog"]');
}

function queryBackdrop(): HTMLButtonElement | null {
  return document.body.querySelector('button[aria-label="Close"]');
}

beforeEach(() => {
  document.body.style.overflow = '';
});

afterEach(() => {
  // Unmount all tracked roots — this triggers React cleanup effects (scroll-lock
  // release, keydown listener removal, focus return). Must happen BEFORE clearing
  // the DOM so that effect cleanups can still query the DOM.
  act(() => {
    for (const root of roots) {
      root.unmount();
    }
  });
  roots.length = 0;
  containers.length = 0;

  // Clear remaining DOM nodes appended directly to body (portals, temp elements).
  // We use removeChild rather than innerHTML to avoid the XSS risk of innerHTML
  // and to preserve nodes that React already cleaned up above.
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }

  document.body.style.overflow = '';
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Dialog — rendering', () => {
  it('renders nothing when open=false', () => {
    renderDialog(
      <Dialog open={false} onClose={() => {}}>
        <p>Hidden</p>
      </Dialog>,
    );
    expect(queryDialog()).toBeNull();
  });

  it('renders the panel when open=true', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(queryDialog()).not.toBeNull();
  });

  it('panel has aria-modal="true"', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    const panel = queryDialog();
    expect(panel?.getAttribute('aria-modal')).toBe('true');
  });

  it('panel has aria-labelledby when labelledById is provided', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}} labelledById="dialog-title">
        <h2 id="dialog-title">Cart</h2>
      </Dialog>,
    );
    const panel = queryDialog();
    expect(panel?.getAttribute('aria-labelledby')).toBe('dialog-title');
  });

  it('panel has fallback aria-label="Dialog" when no name prop is provided', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    const panel = queryDialog();
    // Must never be nameless — fallback label applied
    expect(panel?.getAttribute('aria-label')).toBe('Dialog');
    expect(panel?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('panel uses ariaLabel prop when labelledById is omitted', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}} ariaLabel="Size guide">
        <p>Content</p>
      </Dialog>,
    );
    const panel = queryDialog();
    expect(panel?.getAttribute('aria-label')).toBe('Size guide');
    expect(panel?.getAttribute('aria-labelledby')).toBeNull();
  });

  it('renders children inside the panel', () => {
    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <span data-testid="inner">Hello</span>
      </Dialog>,
    );
    expect(document.body.querySelector('[data-testid="inner"]')).not.toBeNull();
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

    const onClose = () => {};
    const { root } = renderDialog(
      <Dialog open={true} onClose={onClose}>
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

  it('two dialogs open then close in any order restores the original overflow exactly once', () => {
    const originalOverflow = 'scroll';
    document.body.style.overflow = originalOverflow;

    const container1 = document.createElement('div');
    document.body.appendChild(container1);
    const root1 = createRoot(container1);
    roots.push(root1);
    containers.push(container1);

    const container2 = document.createElement('div');
    document.body.appendChild(container2);
    const root2 = createRoot(container2);
    roots.push(root2);
    containers.push(container2);

    // Open both dialogs
    act(() => {
      root1.render(<Dialog open={true} onClose={() => {}}><button>A</button></Dialog>);
    });
    act(() => {
      root2.render(<Dialog open={true} onClose={() => {}}><button>B</button></Dialog>);
    });

    expect(document.body.style.overflow).toBe('hidden');

    // Close first dialog
    act(() => {
      root1.render(<Dialog open={false} onClose={() => {}}><button>A</button></Dialog>);
    });

    // Second is still open — overflow must stay hidden
    expect(document.body.style.overflow).toBe('hidden');

    // Close second dialog
    act(() => {
      root2.render(<Dialog open={false} onClose={() => {}}><button>B</button></Dialog>);
    });

    // Now both closed — overflow restored to original exactly
    expect(document.body.style.overflow).toBe(originalOverflow);
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
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
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
    roots.push(root);
    containers.push(container);

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
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
        <Dialog open={true} onClose={() => {}}>
          <p>No focusable elements here</p>
        </Dialog>,
      );
    });

    const panel = queryDialog();
    // The panel itself (tabIndex=-1) should be focused
    expect(document.activeElement).toBe(panel);
  });

  it('re-rendering with a new onClose reference does NOT move focus or unlock scroll', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    // Open with first onClose
    act(() => {
      root.render(
        <Dialog open={true} onClose={() => {}}>
          <button id="inner-btn">Close</button>
        </Dialog>,
      );
    });

    const innerBtn = document.getElementById('inner-btn') as HTMLElement;
    // Focus moves into dialog on open
    expect(document.activeElement).toBe(innerBtn);
    expect(document.body.style.overflow).toBe('hidden');

    // Move focus somewhere inside the dialog explicitly
    act(() => { innerBtn.focus(); });
    expect(document.activeElement).toBe(innerBtn);

    // Re-render with a NEW onClose reference (simulates parent re-render with inline fn)
    act(() => {
      root.render(
        <Dialog open={true} onClose={() => { /* new reference */ }}>
          <button id="inner-btn">Close</button>
        </Dialog>,
      );
    });

    // Focus must NOT have moved (no premature cleanup/restart)
    expect(document.activeElement).toBe(innerBtn);
    // Scroll lock must still be active
    expect(document.body.style.overflow).toBe('hidden');
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
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
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
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
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

  it('Tab while the panel itself is focused (with children present) moves to first child', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
        <Dialog open={true} onClose={() => {}}>
          <button id="btn-first">First</button>
          <button id="btn-second">Second</button>
        </Dialog>,
      );
    });

    const first = document.getElementById('btn-first') as HTMLElement;

    // Move focus outside the panel entirely and Tab → trap must redirect to first.
    const outsideBtn = document.createElement('button');
    outsideBtn.textContent = 'Outside';
    document.body.appendChild(outsideBtn);
    act(() => { outsideBtn.focus(); });
    expect(document.activeElement).toBe(outsideBtn);

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

    // Focus escaped → trap pulls to first focusable inside dialog
    expect(document.activeElement).toBe(first);
  });

  it('focus cannot escape: Tab from last wraps to first, Shift+Tab from first wraps to last', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push(root);
    containers.push(container);

    act(() => {
      root.render(
        <Dialog open={true} onClose={() => {}}>
          <button id="alpha">Alpha</button>
          <button id="beta">Beta</button>
        </Dialog>,
      );
    });

    const alpha = document.getElementById('alpha') as HTMLElement;
    const beta = document.getElementById('beta') as HTMLElement;

    // Tab from last → first
    act(() => { beta.focus(); });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(alpha);

    // Shift+Tab from first → last
    act(() => { alpha.focus(); });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(beta);
  });
});

// ─── Click-outside / backdrop ─────────────────────────────────────────────────

describe('Dialog — backdrop (click-outside)', () => {
  it('calls onClose when the backdrop button is clicked', () => {
    const onClose = vi.fn();
    renderDialog(
      <Dialog open={true} onClose={onClose}>
        <button>Close</button>
      </Dialog>,
    );

    const backdrop = queryBackdrop();
    expect(backdrop).not.toBeNull();

    act(() => {
      backdrop!.click();
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
    // Nothing meaningful rendered in container (portal not activated)
    expect(container.children.length).toBe(0);
    // Nothing in body either (beyond the container itself)
    expect(queryDialog()).toBeNull();
  });
});

// ─── Background-inert ─────────────────────────────────────────────────────────

describe('Dialog — background inert', () => {
  it('marks background body siblings as inert when open', () => {
    // Place a sibling in the body before the dialog
    const sibling = document.createElement('div');
    sibling.id = 'bg-content';
    document.body.appendChild(sibling);

    renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <button>Close</button>
      </Dialog>,
    );

    // The sibling should now carry the inert attribute.
    expect(sibling.hasAttribute('inert')).toBe(true);

    // Cleanup tracked in afterEach will call unmount → releaseInert removes it.
  });

  it('removes inert from background siblings when closed', () => {
    const sibling = document.createElement('div');
    sibling.id = 'bg-content-2';
    document.body.appendChild(sibling);

    const { root } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <button>Close</button>
      </Dialog>,
    );

    expect(sibling.hasAttribute('inert')).toBe(true);

    act(() => {
      root.render(
        <Dialog open={false} onClose={() => {}}>
          <button>Close</button>
        </Dialog>,
      );
    });

    // After close, inert should be removed (we added it, so we remove it).
    expect(sibling.hasAttribute('inert')).toBe(false);
  });

  it('does not remove pre-existing inert attribute on background sibling', () => {
    const sibling = document.createElement('div');
    sibling.setAttribute('inert', ''); // already inert before dialog opens
    document.body.appendChild(sibling);

    const { root } = renderDialog(
      <Dialog open={true} onClose={() => {}}>
        <button>Close</button>
      </Dialog>,
    );

    // Close dialog
    act(() => {
      root.render(
        <Dialog open={false} onClose={() => {}}>
          <button>Close</button>
        </Dialog>,
      );
    });

    // Pre-existing inert must be preserved — Dialog didn't add it, so it won't remove it.
    expect(sibling.hasAttribute('inert')).toBe(true);
  });
});
