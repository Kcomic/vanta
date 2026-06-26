import localFont from 'next/font/local';
import { Kanit, IBM_Plex_Sans_Thai } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

/** Latin display — Clash Display (self-hosted variable woff2). ALL-CAPS + tight tracking applied via :lang(en) .display in globals.css. */
const clashDisplay = localFont({
  src: '../public/fonts/ClashDisplay-Variable.woff2',
  variable: '--font-display-en',
  display: 'swap',
  weight: '200 700',
});

/** Thai display — Kanit (Black/SemiBold). No all-caps; looser tracking via :lang(th) .display. */
const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['600', '900'],
  variable: '--font-display-th',
  display: 'swap',
});

/** Thai body — IBM Plex Sans Thai. Folded into --font-body via the family list in globals.css. */
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-th',
  display: 'swap',
});

/**
 * Every font's generated `.variable` class, space-joined for <html className>.
 * GeistSans is bound to --font-geist-sans and GeistMono to --font-geist-mono by the geist package;
 * these are aliased to --font-body and --font-mono in globals.css.
 */
export const fontClassNames: string = [
  clashDisplay.variable, // --font-display-en
  kanit.variable, // --font-display-th
  GeistSans.variable, // --font-geist-sans -> aliased to --font-body in globals.css
  ibmPlexSansThai.variable, // --font-body-th
  GeistMono.variable, // --font-geist-mono -> aliased to --font-mono in globals.css
].join(' ');
