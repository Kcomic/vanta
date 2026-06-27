import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { products } from '@/lib/data';
import { dropService } from '@/lib/services/drop-service';
import { authService } from '@/lib/services/auth-service';
import { routing } from '@/lib/i18n/routing';
import type { Locale, Drop } from '@/lib/domain';
import { PdpClient } from '@/components/pdp/PdpClient';
import type { SizeRow } from '@/lib/pdp/measurements';

// Static demo size chart shared by all products in this lean PDP.
const SIZE_FIT_ROWS: SizeRow[] = [
  { size: 'S', chestCm: 52, lengthCm: 68 },
  { size: 'M', chestCm: 56, lengthCm: 71 },
  { size: 'L', chestCm: 60, lengthCm: 74 },
  { size: 'XL', chestCm: 64, lengthCm: 77 },
];

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const all = await products.list();
  return routing.locales.flatMap((locale) =>
    all.map((product) => ({ locale, slug: product.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await products.getBySlug(slug);
  if (!product) return { title: 'VANTA®' };
  return {
    title: `${product.title[locale]} — VANTA®`,
    description: product.description[locale],
    alternates: {
      languages: {
        en: `/en/product/${slug}`,
        th: `/th/product/${slug}`,
      },
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Consume the translations so next-intl can validate the namespace at build time.
  await getTranslations({ locale, namespace: 'pdp' });

  const product = await products.getBySlug(slug);
  if (!product) notFound();

  const drop: Drop | null = product.dropId
    ? await dropService.getDropById(product.dropId)
    : null;
  const user = await authService.getCurrentUser();
  const nowIso = new Date().toISOString();

  return (
    <main className="bg-ink">
      <PdpClient
        product={product}
        drop={drop}
        user={user}
        nowIso={nowIso}
        locale={locale}
        sizeFitRows={SIZE_FIT_ROWS}
      />
    </main>
  );
}
