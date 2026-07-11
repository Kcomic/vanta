'use client';

import { useEffect, useRef } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { useMotionCapability } from '@/lib/motion/capability';
import { buttonClass, MAGNET_STRENGTH, MAX_SHIFT } from './button-styles';

/**
 * A locale-aware link styled as the primary (magnetic) button. It renders a real <a>, so it is a
 * full-size, valid, fully-clickable tap target — unlike `<Button asChild><Link/></Button>`, which
 * can't clone a Server-Component-passed Link and degrades to an invalid <button><a> with a tiny
 * 20px tap target. The magnetic pull is gated on useMotionCapability (off under reduced motion).
 */
export function MagneticLink({
  href,
  children,
  extraClass,
}: {
  href: string;
  children: React.ReactNode;
  extraClass?: string;
}): React.JSX.Element {
  const motionEnabled = useMotionCapability();
  const ref = useRef<HTMLAnchorElement | null>(null);
  const frame = useRef<number | null>(null);

  // Clear any in-flight transform if motion is turned off mid-hover.
  useEffect(() => {
    if (motionEnabled) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = '';
  }, [motionEnabled]);

  const onMove = (e: React.PointerEvent) => {
    if (!motionEnabled || !ref.current) return;
    const node = ref.current;
    const px = e.clientX;
    const py = e.clientY;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = node.getBoundingClientRect();
      const dx = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, (px - (r.left + r.width / 2)) * MAGNET_STRENGTH));
      const dy = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, (py - (r.top + r.height / 2)) * MAGNET_STRENGTH));
      node.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
  };

  const onLeave = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={buttonClass('magnetic', extraClass)}
      style={motionEnabled ? { transition: 'transform 150ms ease-out' } : undefined}
      onPointerMove={motionEnabled ? onMove : undefined}
      onPointerLeave={motionEnabled ? onLeave : undefined}
    >
      {children}
    </Link>
  );
}
