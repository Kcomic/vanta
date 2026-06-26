'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

/**
 * In-UI locale switcher.
 *
 * Uses the next-intl-localized usePathname (returns path WITHOUT locale prefix)
 * and router.replace(pathname, { locale }) which re-prefixes for the target locale —
 * so switching from /en/shop → /th/shop preserves the current route.
 *
 * Label convention: while on EN the button shows "ไทย" (switch TO Thai);
 * while on TH the button shows "EN" (switch TO English).
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Nav');

  // Map each locale to its in-UI label key (EN shows "ไทย" to switch TO Thai, etc.).
  const labelKey = { en: 'switchToThai', th: 'switchToEnglish' } as const;

  return (
    <nav aria-label="Language">
      {routing.locales.map((target) => (
        <button
          key={target}
          type="button"
          aria-current={target === locale ? 'true' : undefined}
          disabled={target === locale}
          onClick={() => router.replace(pathname, { locale: target })}
        >
          {t(labelKey[target])}
        </button>
      ))}
    </nav>
  );
}
