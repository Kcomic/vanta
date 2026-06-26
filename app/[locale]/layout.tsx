import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { fontClassNames } from '@/lib/fonts';
import { CartDrawerProvider } from '@/components/cart/CartDrawerContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Common' });
  return {
    metadataBase: new URL('https://vanta.example.com'),
    title: t('brandName'),
    description: t('tagline'),
    alternates: {
      languages: {
        en: '/en',
        th: '/th',
      },
    },
  };
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // hasLocale narrows locale to the routing.locales union; anything else 404s.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    // lang + dir set server-side so SSR output carries the correct attributes
    // from the first byte — required for screen readers, SEO, and :lang() CSS selectors.
    // dir="ltr" is explicit; future RTL locale support changes this per-locale.
    <html lang={locale} dir="ltr" className={fontClassNames} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartDrawerProvider>
            <Header />
            <main id="main-content">{children}</main>
            <Footer />
          </CartDrawerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
