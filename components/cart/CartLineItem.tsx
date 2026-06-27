'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, LocalizedText, Money } from '@/lib/domain';
import { formatMoney } from '@/lib/format/money';

export type CartLineItemView = {
  variantId: string;
  title: LocalizedText;
  size: string;
  color: string;
  unitPrice: Money;
  quantity: number;
  imageUrl: string;
  maxStock: number;
};

export function CartLineItem({
  line,
  onQuantityChange,
  onRemove,
  disabled = false,
}: {
  line: CartLineItemView;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  disabled?: boolean;
}): React.JSX.Element {
  const locale = useLocale() as Locale;
  const t = useTranslations('cart');
  const lineTotal: Money = {
    amount: line.unitPrice.amount * line.quantity,
    currency: line.unitPrice.currency,
  };

  return (
    <li className="flex gap-4 py-4" data-variant-id={line.variantId}>
      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-smoke-900">
        <Image
          src={line.imageUrl}
          alt={line.title[locale]}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="display text-sm">{line.title[locale]}</p>
            <p className="font-mono text-xs text-smoke-300">
              {line.size} · {line.color}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(line.variantId)}
            disabled={disabled}
            className="text-xs text-smoke-300 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
          >
            {t('remove')}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div
            className="flex items-center border border-smoke-700"
            role="group"
            aria-label={t('quantityLabel')}
          >
            <button
              type="button"
              aria-label={t('decrease')}
              disabled={disabled}
              onClick={() => onQuantityChange(line.variantId, line.quantity - 1)}
              className="px-3 py-1 font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
            >
              −
            </button>
            <span className="min-w-8 text-center font-mono text-sm">{line.quantity}</span>
            <button
              type="button"
              aria-label={t('increase')}
              disabled={disabled || line.quantity >= line.maxStock}
              onClick={() => onQuantityChange(line.variantId, line.quantity + 1)}
              className="px-3 py-1 font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-blaze disabled:opacity-50"
            >
              +
            </button>
          </div>
          <span className="font-mono text-sm">{formatMoney(lineTotal, locale)}</span>
        </div>
      </div>
    </li>
  );
}
