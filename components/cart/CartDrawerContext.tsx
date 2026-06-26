'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CartDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  announcement: string;
  setAnnouncement: (msg: string) => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncementState] = useState('');

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const setAnnouncement = useCallback((msg: string) => setAnnouncementState(msg), []);

  const value = useMemo<CartDrawerContextValue>(
    () => ({ isOpen, open, close, announcement, setAnnouncement }),
    [isOpen, open, close, announcement, setAnnouncement],
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error('useCartDrawer must be used within <CartDrawerProvider>');
  return ctx;
}
