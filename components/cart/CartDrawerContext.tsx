'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { CartLineItemView } from './CartLineItem';

type CartDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  announcement: string;
  setAnnouncement: (msg: string) => void;
  lineViews: CartLineItemView[];
  setLineViews: (views: CartLineItemView[]) => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncementState] = useState('');
  const [lineViews, setLineViewsState] = useState<CartLineItemView[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const setAnnouncement = useCallback((msg: string) => setAnnouncementState(msg), []);
  const setLineViews = useCallback((views: CartLineItemView[]) => {
    setLineViewsState((prev) => {
      const byId = new Map(prev.map((v) => [v.variantId, v]));
      for (const v of views) byId.set(v.variantId, v);
      return [...byId.values()];
    });
  }, []);

  const value = useMemo<CartDrawerContextValue>(
    () => ({ isOpen, open, close, announcement, setAnnouncement, lineViews, setLineViews }),
    [isOpen, open, close, announcement, setAnnouncement, lineViews, setLineViews],
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error('useCartDrawer must be used within <CartDrawerProvider>');
  return ctx;
}
