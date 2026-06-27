'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';

export function SearchForm({ defaultQuery }: { defaultQuery: string }): React.JSX.Element {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultQuery);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    router.push(`${pathname}${qs}`);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="flex w-full max-w-xl items-center gap-2">
      <input
        type="search"
        name="q"
        data-testid="search-input"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={t('placeholder')}
        aria-label={t('title')}
        className="flex-1 bg-smoke-700 px-3 py-2 text-paper placeholder:text-smoke-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      />
      <button
        type="submit"
        data-testid="search-submit"
        className="bg-blaze px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        {t('submit')}
      </button>
    </form>
  );
}
