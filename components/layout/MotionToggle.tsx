'use client';

import { useTranslations } from 'next-intl';
import { useMotionPreference, type MotionPreference } from '@/lib/motion/preference';

const OPTIONS: MotionPreference[] = ['system', 'full', 'reduced'];

export function MotionToggle(): React.JSX.Element {
  const t = useTranslations('motion');
  const preference = useMotionPreference((s) => s.preference);
  const setPreference = useMotionPreference((s) => s.setPreference);

  return (
    <fieldset className="flex items-center gap-1 font-mono text-xs" aria-label={t('label')}>
      <legend className="sr-only">{t('label')}</legend>
      {OPTIONS.map((option) => {
        const selected = preference === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => setPreference(option)}
            className={
              'rounded-full border px-2 py-1 uppercase tracking-wide transition-colors ' +
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
              (selected
                ? 'border-lime bg-lime text-ink'
                : 'border-smoke-500 text-smoke-300 hover:text-paper')
            }
          >
            {t(option)}
          </button>
        );
      })}
    </fieldset>
  );
}
