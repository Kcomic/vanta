import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Shell');

  return (
    <main
      style={{
        maxWidth: 'var(--max-w-shell)',
        margin: '0 auto',
        padding: 'calc(var(--spacing) * 6) calc(var(--spacing) * 3)',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'calc(var(--spacing) * 2)',
      }}
    >
      <h1
        className="display"
        data-testid="brand"
        style={{ fontSize: 'clamp(3rem, 12vw, 9rem)', margin: 0, lineHeight: 1 }}
      >
        {t('brand')}
      </h1>
      <p
        data-testid="tagline"
        style={{ color: 'var(--color-smoke-300)', fontSize: '1.125rem', margin: 0 }}
      >
        {t('tagline')}
      </p>
      <code
        data-testid="locale-stamp"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-lime)', fontSize: '0.875rem' }}
      >
        /{locale}
      </code>
    </main>
  );
}
