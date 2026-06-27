import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export async function Footer(): Promise<React.JSX.Element> {
  const t = await getTranslations('Nav');
  return (
    <footer className="border-t border-smoke-700 bg-ink px-6 py-10 text-smoke-300">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2">
        <span className="display text-lg text-paper">VANTA</span>
        <nav aria-label={t('siteLinks')} className="flex gap-6 text-xs uppercase tracking-wide">
          <Link href="/shop" className="inline-block py-1.5 hover:text-paper">
            {t('shop')}
          </Link>
          <Link href="/collections" className="inline-block py-1.5 hover:text-paper">
            {t('collections')}
          </Link>
        </nav>
        <span className="text-xs">
          © {new Date().getFullYear()} VANTA — portfolio showcase.
        </span>
      </div>
    </footer>
  );
}
