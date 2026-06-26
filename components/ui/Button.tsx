'use client';

import React, { cloneElement, isValidElement, useRef } from 'react';
import { useMotionCapability } from '@/lib/motion/capability';

export type ButtonVariant = 'default' | 'ghost' | 'magnetic';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-none px-5 py-3 text-sm font-medium uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:opacity-50 disabled:pointer-events-none';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: 'bg-blaze text-paper hover:bg-blaze-on-light',
  ghost: 'bg-transparent text-ink hover:bg-smoke-300/30',
  magnetic: 'bg-blaze text-paper hover:bg-blaze-on-light will-change-transform',
};

const MAGNET_STRENGTH = 0.35; // fraction of cursor offset applied as translate

export function Button({
  variant = 'default',
  asChild = false,
  className,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  const motionEnabled = useMotionCapability();
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);

  const magneticActive = variant === 'magnetic' && motionEnabled;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!magneticActive || !ref.current) return;
    const node = ref.current;
    const px = e.clientX;
    const py = e.clientY;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const dx = (px - (rect.left + rect.width / 2)) * MAGNET_STRENGTH;
      const dy = (py - (rect.top + rect.height / 2)) * MAGNET_STRENGTH;
      node.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
  };

  const handlePointerLeave = () => {
    if (!ref.current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    ref.current.style.transform = 'translate(0px, 0px)';
  };

  const cls = [BASE, VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

  // Only attach pointer handlers when the magnetic effect is actually live.
  const motionProps = magneticActive
    ? {
        onPointerMove: handlePointerMove,
        onPointerLeave: handlePointerLeave,
        style: { transform: 'translate(0px, 0px)', transition: 'transform 150ms ease-out' },
      }
    : {};

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
      ...rest,
      ...motionProps,
      ref,
      className: [cls, child.props.className as string | undefined].filter(Boolean).join(' '),
    });
  }

  return (
    <button {...rest} {...motionProps} ref={ref as React.Ref<HTMLButtonElement>} className={cls}>
      {children}
    </button>
  );
}
