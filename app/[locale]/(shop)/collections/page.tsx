import React from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/domain';
import { collections } from '@/lib/data';
import { Link } from '@/lib/i18n/navigation';

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collections.index' });
  const all = await collections.list();

  return (
    <main className="mx-auto w-full max-w-[var(--max-w-shell)] bg-ink px-4 py-12 text-paper md:px-8">
      <header className="mb-10">
        <h1 className="display text-5xl">{t('title')}</h1>
        <p className="mt-2 text-sm text-smoke-300">{t('subtitle')}</p>
      </header>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {all.map((collection, index) => (
          <li
            key={collection.id}
            data-testid="collection-tile"
            className={index % 3 === 0 ? 'md:col-span-2' : ''}
          >
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block aspect-[16/9] overflow-hidden bg-smoke-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={collection.heroImageUrl}
                alt={collection.title[locale]}
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-cover opacity-80 transition-[transform,opacity] duration-700 ease-out group-hover:scale-105 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h2 className="display text-3xl text-paper">{collection.title[locale]}</h2>
                <p className="mt-1 max-w-md text-sm text-smoke-300">
                  {collection.description[locale]}
                </p>
                <span className="mt-3 inline-block text-xs text-blaze">{t('view')} →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
