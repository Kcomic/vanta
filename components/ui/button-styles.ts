// Plain (non-'use client') styling source so BOTH Server Components (e.g. HeroSection, which
// must render real <a> CTAs) and Client Components (Button, MagneticLink) can import these
// without crossing the RSC boundary.

export type ButtonVariant = 'default' | 'ghost' | 'ghost-dark' | 'magnetic';

export const BASE =
  'inline-flex items-center justify-center gap-2 rounded-none px-5 py-3 text-sm font-medium uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:opacity-50 disabled:pointer-events-none';

export const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: 'bg-blaze text-ink hover:bg-blaze-on-light',
  /** ghost — light surfaces (paper). text-ink reads at 18:1 on paper. */
  ghost: 'bg-transparent text-ink hover:bg-smoke-300/30',
  /** ghost-dark — dark surfaces (ink). text-paper reads at 18:1 on ink.
   *  Use this variant whenever the ghost button renders on bg-ink / bg-smoke-900. */
  'ghost-dark': 'bg-transparent text-paper hover:bg-smoke-700/60 border border-smoke-700',
  magnetic: 'bg-blaze text-ink hover:bg-blaze-on-light will-change-transform',
};

export const MAGNET_STRENGTH = 0.35; // fraction of cursor offset applied as translate
export const MAX_SHIFT = 16; // px clamp — CTA never detaches from its label

/**
 * The button class string for a variant — used by links-styled-as-buttons (the hero CTAs, which
 * must render a real `<a>` for a valid, full-size tap target) so they reuse the exact styling.
 *
 * NOTE on `Button asChild`: cloning works for a Client-Component child but NOT for an element
 * passed across the RSC boundary from a Server Component (the clone can't attach the ref and
 * React falls back to wrapping in a <button>, producing invalid <button><a> and a tiny tap
 * target). For server-rendered link CTAs, style the link with `buttonClass()` directly.
 */
export function buttonClass(variant: ButtonVariant = 'default', extra?: string): string {
  return [BASE, VARIANT_CLASS[variant], extra].filter(Boolean).join(' ');
}
