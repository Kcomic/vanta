/**
 * ProductImage — renders a real <img> when a URL is supplied; otherwise renders a
 * branded on-brand placeholder that is tinted by the product colorway.
 *
 * The placeholder is intentional art direction ("materializes out of black"),
 * not a missing-asset indicator. Aspect ratio is always 4:5 portrait.
 */
import React from 'react';
import type { Locale } from '@/lib/domain';

export type ProductImageProps = {
  /** Real asset path from the backend. When empty or absent the branded placeholder is shown. */
  url?: string;
  /** Product colorway (variant optionValues.color). Drives placeholder tint. */
  colorway: string;
  /** Already-localised product title — shown in the placeholder. */
  title: string;
  locale: Locale;
  /** True = eager loading (first row above the fold). */
  priority?: boolean;
  className?: string;
};

// ---------------------------------------------------------------------------
// Colorway → palette mapping
// ---------------------------------------------------------------------------

type ColorPalette = {
  /** Gradient stop 1 (darkest) */
  from: string;
  /** Gradient stop 2 (lighter accent) */
  to: string;
  /** Faint grid / grain overlay stroke */
  grid: string;
  /** "VANTA" monogram watermark fill */
  watermark: string;
  /** Product title text fill */
  text: string;
};

/** Lower-cased colorway key → deterministic palette. */
const PALETTES: Record<string, ColorPalette> = {
  // Black / deepest void — near-black with very slight warm tint
  black: {
    from: '#080808',
    to: '#161410',
    grid: '#1e1c18',
    watermark: '#1a1816',
    text: '#6b6b6b',
  },
  // Ink — blue-black
  ink: {
    from: '#080c14',
    to: '#10182a',
    grid: '#141e30',
    watermark: '#141e30',
    text: '#5c6880',
  },
  // Smoke — mid grey
  smoke: {
    from: '#111111',
    to: '#2a2a2a',
    grid: '#222222',
    watermark: '#222222',
    text: '#8a8a8a',
  },
  // Paper — off-white tint on near-black base (card on dark)
  paper: {
    from: '#0a0a0a',
    to: '#1e1c17',
    grid: '#1a1816',
    watermark: '#2a2820',
    text: '#a8a49a',
  },
  // Blaze — red-tinted
  blaze: {
    from: '#0e0604',
    to: '#1e0c08',
    grid: '#1e0e0a',
    watermark: '#240e0a',
    text: '#7a4030',
  },
};

/** Fallback palette for any unrecognised colorway (dark neutral). */
const FALLBACK: ColorPalette = {
  from: '#0a0a0a',
  to: '#141414',
  grid: '#181818',
  watermark: '#181818',
  text: '#6b6b6b',
};

function paletteFor(colorway: string): ColorPalette {
  return PALETTES[colorway.toLowerCase()] ?? FALLBACK;
}

// ---------------------------------------------------------------------------
// SVG placeholder
// ---------------------------------------------------------------------------

function BrandedPlaceholder({
  colorway,
  title,
}: {
  colorway: string;
  title: string;
}): React.JSX.Element {
  const p = paletteFor(colorway);
  // Stable IDs scoped to this placeholder instance
  const gradId = `vp-grad-${colorway.toLowerCase().replace(/\s+/g, '-')}`;
  const patId = `vp-grid-${colorway.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 500"
      role="img"
      aria-label={title}
      className="h-full w-full"
      // Inline preserves aspect ratio inside the container's overflow:hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Vertical duotone gradient */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
        {/* Subtle grid pattern */}
        <pattern id={patId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={p.grid} strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Base gradient fill */}
      <rect width="400" height="500" fill={`url(#${gradId})`} />
      {/* Grid overlay */}
      <rect width="400" height="500" fill={`url(#${patId})`} opacity="0.8" />

      {/* Large "VANTA" watermark — centred, very faint */}
      <text
        x="200"
        y="268"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Clash Display', system-ui, sans-serif"
        fontWeight="700"
        fontSize="88"
        letterSpacing="-2"
        fill={p.watermark}
        opacity="1"
      >
        VANTA
      </text>

      {/* Product title — bottom-left, small, in the display font */}
      <text
        x="24"
        y="462"
        fontFamily="'Clash Display', system-ui, sans-serif"
        fontWeight="500"
        fontSize="13"
        letterSpacing="3"
        fill={p.text}
        opacity="0.9"
      >
        {title.length > 28 ? `${title.slice(0, 28).trimEnd()}…` : title}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function ProductImage({
  url,
  colorway,
  title,
  priority = false,
  className,
}: ProductImageProps): React.JSX.Element {
  const hasRealUrl = typeof url === 'string' && url.trim() !== '';

  if (hasRealUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={
          className ??
          'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
        }
      />
    );
  }

  return (
    <span
      data-testid="product-image-placeholder"
      data-colorway={colorway.toLowerCase()}
      className={className ?? 'block h-full w-full'}
    >
      <BrandedPlaceholder colorway={colorway} title={title} />
    </span>
  );
}
