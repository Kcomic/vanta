import { Link } from '@/lib/i18n/navigation';

export function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-smoke-700 bg-ink px-6 py-10 text-smoke-300">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2">
        <span className="display text-lg text-paper">VANTA</span>
        <nav aria-label="Site links" className="flex gap-6 text-xs uppercase tracking-wide">
          <Link href="/shop" className="hover:text-paper">
            Shop
          </Link>
          <Link href="/collections" className="hover:text-paper">
            Collections
          </Link>
        </nav>
        <span className="text-xs">
          © {new Date().getFullYear()} VANTA — portfolio showcase.
        </span>
      </div>
    </footer>
  );
}
