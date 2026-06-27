import { ImageResponse } from 'next/og';
import type { Locale } from '@/lib/domain';
import { orders } from '@/lib/data';
import { formatMoney } from '@/lib/format/money';
import { getTranslations } from 'next-intl/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'VANTA® order confirmation';

export default async function OpengraphImage({
  params,
}: {
  params: { locale: Locale; orderId: string };
}) {
  const { locale, orderId } = params;
  const order = await orders.getById(orderId);
  const t = await getTranslations({ locale, namespace: 'confirmation' });

  const total = order ? formatMoney(order.totals.total, locale) : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A0A0A',
          color: '#F5F4EF',
          padding: 80,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{ color: '#D4FF2E', fontSize: 28, letterSpacing: 8, textTransform: 'uppercase' }}
        >
          VANTA®
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>{t('heading')}</div>
          <div style={{ marginTop: 24, fontSize: 36, color: '#B8B8B8' }}>{t('ogTagline')}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 36 }}>
          <span style={{ color: '#6B6B6B' }}>{orderId}</span>
          <span style={{ color: '#FF3B1F' }}>{total}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
