import type { ReactNode } from 'react';
import { fontClassNames } from '@/lib/fonts';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={fontClassNames} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
