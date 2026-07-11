'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

// ─── Scroll-lock counter ──────────────────────────────────────────────────────
// Module-level so stacked dialogs share one counter and one captured overflow.

let _lockCount = 0;
let _originalOverflow = '';

function acquireScrollLock() {
  if (_lockCount === 0) {
    _originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  _lockCount++;
}

function releaseScrollLock() {
  _lockCount = Math.max(0, _lockCount - 1);
  if (_lockCount === 0) {
    document.body.style.overflow = _originalOverflow;
    _originalOverflow = '';
  }
}

// ─── Background-inert counter ─────────────────────────────────────────────────
// When a dialog opens, all direct body children that are NOT the portal
// container receive `inert` so AT / pointer events cannot reach background
// content. Counter-based so stacked dialogs share the same inert state.

let _inertCount = 0;
let _inertedsnapshot: Array<{ el: Element; had: boolean }> = [];

function acquireInert(portalEl: Element) {
  if (_inertCount === 0) {
    // Snapshot and mark every direct body child EXCEPT the portal container.
    _inertedsnapshot = Array.from(document.body.children)
      .filter((el) => el !== portalEl)
      .map((el) => {
        const had = el.hasAttribute('inert');
        if (!had) el.setAttribute('inert', '');
        return { el, had };
      });
  }
  _inertCount++;
}

function releaseInert() {
  _inertCount = Math.max(0, _inertCount - 1);
  if (_inertCount === 0) {
    // Restore only elements we ourselves marked; respect pre-existing inert.
    for (const { el, had } of _inertedsnapshot) {
      if (!had) el.removeAttribute('inert');
    }
    _inertedsnapshot = [];
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Dialog({
  open,
  onClose,
  labelledById,
  ariaLabel,
  closeLabel = 'Close',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledById?: string;
  ariaLabel?: string;
  /** Accessible name for the backdrop close button — pass a localized string. */
  closeLabel?: string;
  children: React.ReactNode;
}): React.JSX.Element | null {
  // SSR-safety: only render the portal once mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Dedicated portal container — a direct child of document.body that we own,
  // so acquireInert can exclude it from the background-inert sweep.
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (typeof document !== 'undefined' && !portalRef.current) {
    const div = document.createElement('div');
    div.setAttribute('data-dialog-portal', '');
    portalRef.current = div;
  }

  // Mount / unmount the portal container alongside the component.
  useEffect(() => {
    const el = portalRef.current;
    if (!el) return;
    document.body.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Keep a stable ref to onClose so the keydown/effect closure never stales.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Resolve accessible name ─────────────────────────────────────────────────
  // Priority: labelledById > ariaLabel > fallback "Dialog" (with dev warning).
  const hasLabelledBy = Boolean(labelledById);
  const resolvedAriaLabel =
    !hasLabelledBy && !ariaLabel
      ? 'Dialog'
      : ariaLabel;

  if (!hasLabelledBy && !ariaLabel && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Dialog] No accessible name provided. ' +
        'Pass `labelledById` pointing to a heading inside the dialog, ' +
        'or `ariaLabel` for a short description. ' +
        'Falling back to aria-label="Dialog".',
    );
  }

  // Focus / scroll-lock / keydown effect ───────────────────────────────────
  // Runs when `open` OR `mounted` changes.
  // Guard: only activate when both `open` and `mounted` are true so that
  // panelRef.current is guaranteed to exist (portal has rendered).
  useEffect(() => {
    if (!open || !mounted) return;

    // Save previously focused element before moving focus.
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Scroll lock — counter-based so nested dialogs stay locked correctly.
    acquireScrollLock();

    // Background inert — counter-based; marks all body siblings except our
    // portal container as inert so AT and pointer events cannot reach them.
    const portalEl = portalRef.current;
    if (portalEl) acquireInert(portalEl);

    // Initial focus into the panel.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

      if (nodes.length === 0) {
        // No focusable children — keep focus on the panel itself.
        e.preventDefault();
        panel.focus();
        return;
      }

      const firstEl = nodes[0]!;
      const lastEl = nodes[nodes.length - 1]!;
      const active = document.activeElement;

      // If focus escaped the panel entirely, pull it back to the first element.
      const insidePanel = panel.contains(active);

      if (e.shiftKey) {
        if (!insidePanel || active === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (!insidePanel || active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      releaseScrollLock();
      releaseInert();
      // Return focus to whatever was focused before the dialog opened.
      previouslyFocused.current?.focus();
    };
  }, [open, mounted]); // onClose intentionally omitted — read via onCloseRef

  if (!open || !mounted || !portalRef.current) return null;

  const panel = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop: click closes. */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={() => onCloseRef.current()}
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        {...(hasLabelledBy
          ? { 'aria-labelledby': labelledById }
          : { 'aria-label': resolvedAriaLabel })}
        tabIndex={-1}
        className="relative h-full w-full max-w-md bg-paper text-ink shadow-2xl focus:outline-none"
      >
        {children}
      </div>
    </div>
  );

  return createPortal(panel, portalRef.current);
}
