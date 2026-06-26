import type { ReactNode } from 'react';
import './globals.css';

/**
 * Minimal root layout — html/body are rendered by app/[locale]/layout.tsx so
 * the lang attribute is set server-side per locale. This file exists only
 * because Next.js requires a root layout; it is a transparent passthrough.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
