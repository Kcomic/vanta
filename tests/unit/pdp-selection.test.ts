import { describe, it, expect } from 'vitest';
import { buildPdpView } from '@/lib/pdp/selection';
import type { Product, Variant } from '@/lib/domain';

const money = (amount: number) => ({ amount, currency: 'THB' as const });

function variant(id: string, size: string, color: string, stock: number): Variant {
  return {
    id,
    sku: `VANTA-${id}`,
    optionValues: { size, color },
    price: money(199000),
    stock,
    availability: 'live',
  };
}

function product(variants: Variant[]): Product {
  return {
    id: 'prd_void_tee',
    slug: 'void-tee',
    title: { en: 'Void Tee', th: 'วอยด์ ที' },
    description: { en: 'Tee', th: 'เสื้อ' },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Bone'] },
    variants,
    imagesByColor: {
      Ink: [
        {
          id: 'img_ink',
          url: '/ink.jpg',
          alt: { en: 'Ink', th: 'อิงค์' },
          width: 1200,
          height: 1500,
        },
      ],
      Bone: [
        {
          id: 'img_bone',
          url: '/bone.jpg',
          alt: { en: 'Bone', th: 'โบน' },
          width: 1200,
          height: 1500,
        },
      ],
    },
    collectionIds: ['col_drop_001'],
  };
}

const NOW = new Date('2026-06-27T12:00:00.000Z');

describe('buildPdpView', () => {
  it('lists colors and scopes sizes to the selected color', () => {
    const p = product([
      variant('v1', 'S', 'Ink', 10),
      variant('v2', 'M', 'Ink', 10),
      variant('v3', 'S', 'Bone', 10),
    ]);
    const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
    expect(view.colors).toEqual(['Ink', 'Bone']);
    expect(view.sizes.map((s) => s.size)).toEqual(['S', 'M', 'L']);
    // S and M exist for Ink and are selectable; L has no Ink variant.
    expect(view.sizes.find((s) => s.size === 'S')?.selectable).toBe(true);
    expect(view.sizes.find((s) => s.size === 'M')?.selectable).toBe(true);
    const lSize = view.sizes.find((s) => s.size === 'L')!;
    expect(lSize.variantId).toBeNull();
    expect(lSize.selectable).toBe(false);
  });

  it('marks a sold-out size (stock 0) as not selectable with sold_out availability', () => {
    const p = product([variant('v1', 'S', 'Ink', 0), variant('v2', 'M', 'Ink', 10)]);
    const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
    const s = view.sizes.find((x) => x.size === 'S')!;
    expect(s.availability).toBe('sold_out');
    expect(s.selectable).toBe(false);
  });

  it('resolves the selected variant and exposes low-stock remaining', () => {
    const p = product([
      variant('v1', 'S', 'Ink', 3), // 0 < 3 <= 5 => low_stock
      variant('v2', 'M', 'Ink', 10),
    ]);
    const view = buildPdpView(p, null, NOW, null, { size: 'S', color: 'Ink' });
    expect(view.selectedVariant?.id).toBe('v1');
    expect(view.selectedAvailability).toBe('low_stock');
    expect(view.lowStockRemaining).toBe(3);
  });

  it('returns null selection and null remaining when size not yet chosen', () => {
    const p = product([variant('v1', 'S', 'Ink', 10)]);
    const view = buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' });
    expect(view.selectedVariant).toBeNull();
    expect(view.selectedAvailability).toBeNull();
    expect(view.lowStockRemaining).toBeNull();
  });

  it('returns the gallery for the selected color (empty array when missing)', () => {
    const p = product([variant('v1', 'S', 'Ink', 10)]);
    expect(buildPdpView(p, null, NOW, null, { size: null, color: 'Ink' }).gallery).toHaveLength(
      1,
    );
    expect(buildPdpView(p, null, NOW, null, { size: null, color: 'Missing' }).gallery).toEqual(
      [],
    );
  });
});
