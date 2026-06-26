import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/domain';
import type { CartLineItemView } from '@/components/cart/CartLineItem';
import { products } from '@/lib/data';
import { cartService } from '@/lib/services/cart-service';
import { CartPageClient } from '@/components/cart/CartPageClient';

type Props = { params: Promise<{ locale: Locale }> };

export default async function CartPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('cart');
  const cart = await cartService.getCart();

  // Resolve real snapshots for each line via the repository seam.
  // Uses getProductByVariantId (errata #6) to avoid repeated list() scans.
  const lineViews: CartLineItemView[] = [];
  for (const item of cart.items) {
    const variant = await products.getVariantById(item.variantId);
    if (!variant) continue;
    const product = await products.getProductByVariantId(item.variantId, locale);
    if (!product) continue;
    const images = product.imagesByColor[variant.optionValues.color] ?? [];
    lineViews.push({
      variantId: variant.id,
      title: product.title,
      size: variant.optionValues.size,
      color: variant.optionValues.color,
      unitPrice: variant.price,
      quantity: item.quantity,
      imageUrl: images[0]?.url ?? '/placeholder.svg',
      maxStock: variant.stock + item.quantity, // stock already decremented in-session
    });
  }

  return (
    <main className="mx-auto w-full max-w-[var(--max-w-shell)] px-6 py-12">
      <h1 className="display mb-8 text-3xl">{t('title')}</h1>
      <CartPageClient initialCart={cart} lineViews={lineViews} />
    </main>
  );
}
