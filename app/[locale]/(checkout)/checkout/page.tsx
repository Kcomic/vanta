import { getTranslations } from 'next-intl/server';
import type { Locale, Money } from '@/lib/domain';
import { products } from '@/lib/data';
import { cartService } from '@/lib/services/cart-service';
import { Link } from '@/lib/i18n/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary, type OrderSummaryLine } from '@/components/checkout/OrderSummary';

const SHIPPING_FLAT: Money = { amount: 5000, currency: 'THB' };

export default async function CheckoutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations('checkout');
  // Use cartService (errata #18b) — reconciles + recomputes totals, never raw cookie read.
  const cart = await cartService.getCart();

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-shell px-6 py-24 text-center">
        <h1 className="display text-3xl text-ink">{t('emptyCartHeading')}</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-ink px-6 py-3 font-mono uppercase tracking-widest text-paper"
        >
          {t('emptyCartCta')}
        </Link>
      </main>
    );
  }

  // Resolve line snapshots via getProductByVariantId (errata #6 — no repeated list() scans).
  const lines: OrderSummaryLine[] = [];
  for (const item of cart.items) {
    const variant = await products.getVariantById(item.variantId);
    if (!variant) continue;
    const product = await products.getProductByVariantId(item.variantId, locale);
    lines.push({
      title: product ? product.title[locale] : variant.sku,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
    });
  }

  const subtotalAmount = lines.reduce((sum, l) => sum + l.unitPrice.amount * l.quantity, 0);
  const subtotal: Money = { amount: subtotalAmount, currency: 'THB' };
  const shipping = SHIPPING_FLAT;
  const total: Money = { amount: subtotal.amount + shipping.amount, currency: 'THB' };

  return (
    <main className="mx-auto grid max-w-shell gap-12 px-6 py-16 lg:grid-cols-[1fr_400px]">
      <div>
        <h1 className="display text-3xl text-ink">{t('title')}</h1>
        <div className="mt-10">
          <CheckoutForm />
        </div>
      </div>
      <OrderSummary
        items={lines}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        locale={locale}
      />
    </main>
  );
}
