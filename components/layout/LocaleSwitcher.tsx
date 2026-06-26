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
 * Label convention: each button carries an aria-label stating the action
 * ("Switch to Thai" / "Switch to English"). Screen-reader users can tell
 * which locale is active via the sr-only "Current language:" text on the
 * active button (disabled, aria-current="true").
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Nav');

  // Human-readable action labels for aria-label (what will happen on click).
  const actionLabelKey = {
    en: 'switchToEnglish',
    th: 'switchToThai',
  } as const;

  return (
    <nav aria-label="Language">
      {routing.locales.map((target) => {
        const isCurrent = target === locale;
        return (
          <button
            key={target}
            type="button"
            aria-label={t(actionLabelKey[target])}
            aria-current={isCurrent ? 'true' : undefined}
            disabled={isCurrent}
            onClick={() => router.replace(pathname, { locale: target })}
          >
            {/* Screen-reader users hear "Current language: " before the visible label
                on whichever button represents the active locale. */}
            {isCurrent && (
              <span className="sr-only">{t('currentLanguage')}: </span>
            )}
            {t(actionLabelKey[target])}
          </button>
        );
      })}
    </nav>
  );
}
