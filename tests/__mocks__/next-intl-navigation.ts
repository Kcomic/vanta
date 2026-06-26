// Minimal stub for next-intl/navigation in Vitest (node env).
// next-intl's createNavigation ESM build imports next/navigation which fails
// in the node test environment. This stub provides the exports that
// @/lib/i18n/navigation.ts destructures.

import { createElement, type ComponentProps } from 'react';

export function createNavigation(_routing: unknown) {
  const Link = (props: ComponentProps<'a'>) => createElement('a', props);
  const redirect = (_path: string) => {};
  const usePathname = () => '/';
  const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {} });
  const getPathname = (_opts: unknown) => '/';
  return { Link, redirect, usePathname, useRouter, getPathname };
}
