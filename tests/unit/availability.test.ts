import { describe, it, expect } from 'vitest';
import { deriveAvailability, LOW_STOCK_THRESHOLD } from '@/lib/services/availability';
import type { Variant, Drop, User } from '@/lib/domain';

const variantWith = (stock: number): Variant => ({
  id: 'var_x',
  sku: 'SKU-X',
  optionValues: { size: 'M', color: 'Black' },
  price: { amount: 129000, currency: 'THB' },
  stock,
  availability: 'live', // baseline ignored; derive recomputes
});

const drop: Drop = {
  id: 'drp_void_genesis',
  name: { en: 'VOID GENESIS', th: 'วอยด์ เจเนซิส' },
  earlyAccessAt: '2026-07-01T10:00:00.000Z',
  releaseAt: '2026-07-01T13:00:00.000Z',
  endAt: '2026-07-15T17:00:00.000Z',
};

const member: User = {
  id: 'usr_member',
  email: 'member@vanta.shop',
  name: 'Member',
  role: 'member',
  addresses: [],
};
const admin: User = { ...member, id: 'usr_admin', role: 'admin' };
const guest: User = { ...member, id: 'usr_guest', role: 'guest' };

const BEFORE_EARLY = new Date('2026-07-01T09:00:00.000Z'); // < earlyAccessAt
const IN_EARLY = new Date('2026-07-01T11:00:00.000Z'); // earlyAccessAt <= now < releaseAt
const AFTER_RELEASE = new Date('2026-07-02T00:00:00.000Z'); // >= releaseAt

describe('LOW_STOCK_THRESHOLD', () => {
  it('is exactly 5', () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
  });
});

describe('deriveAvailability — sold_out wins above everything', () => {
  it('stock 0 with no drop => sold_out', () => {
    expect(deriveAvailability(variantWith(0), null, AFTER_RELEASE, null)).toBe('sold_out');
  });
  it('stock 0 even before early access and even for a member => sold_out', () => {
    expect(deriveAvailability(variantWith(0), drop, BEFORE_EARLY, member)).toBe('sold_out');
  });
  it('negative stock => sold_out', () => {
    expect(deriveAvailability(variantWith(-1), null, AFTER_RELEASE, null)).toBe('sold_out');
  });
});

describe('deriveAvailability — coming_soon before early access', () => {
  it('drop present, now < earlyAccessAt, guest => coming_soon', () => {
    expect(deriveAvailability(variantWith(10), drop, BEFORE_EARLY, guest)).toBe('coming_soon');
  });
  it('drop present, now < earlyAccessAt, member => coming_soon (early access not open yet)', () => {
    expect(deriveAvailability(variantWith(10), drop, BEFORE_EARLY, member)).toBe('coming_soon');
  });
});

describe('deriveAvailability — early_access gate by role', () => {
  it('in early window, guest (no user) => early_access (gated)', () => {
    expect(deriveAvailability(variantWith(10), drop, IN_EARLY, null)).toBe('early_access');
  });
  it('in early window, guest role => early_access (gated)', () => {
    expect(deriveAvailability(variantWith(10), drop, IN_EARLY, guest)).toBe('early_access');
  });
  it('in early window, member => live (unlocked)', () => {
    expect(deriveAvailability(variantWith(10), drop, IN_EARLY, member)).toBe('live');
  });
  it('in early window, admin => live (unlocked)', () => {
    expect(deriveAvailability(variantWith(10), drop, IN_EARLY, admin)).toBe('live');
  });
  it('in early window, member, low stock => still unlocked but low_stock takes the buyable state', () => {
    expect(deriveAvailability(variantWith(3), drop, IN_EARLY, member)).toBe('low_stock');
  });
});

describe('deriveAvailability — after public release', () => {
  it('now >= releaseAt, guest, healthy stock => live', () => {
    expect(deriveAvailability(variantWith(20), drop, AFTER_RELEASE, guest)).toBe('live');
  });
  it('now >= releaseAt, guest, low stock => low_stock', () => {
    expect(deriveAvailability(variantWith(4), drop, AFTER_RELEASE, guest)).toBe('low_stock');
  });
});

describe('deriveAvailability — no-drop products', () => {
  it('no drop, healthy stock => live', () => {
    expect(deriveAvailability(variantWith(50), null, AFTER_RELEASE, null)).toBe('live');
  });
  it('no drop, stock == threshold (5) => low_stock', () => {
    expect(deriveAvailability(variantWith(LOW_STOCK_THRESHOLD), null, AFTER_RELEASE, null)).toBe(
      'low_stock',
    );
  });
  it('no drop, stock == threshold + 1 (6) => live', () => {
    expect(
      deriveAvailability(variantWith(LOW_STOCK_THRESHOLD + 1), null, AFTER_RELEASE, null),
    ).toBe('live');
  });
  it('no drop, stock == 1 => low_stock', () => {
    expect(deriveAvailability(variantWith(1), null, AFTER_RELEASE, null)).toBe('low_stock');
  });
});

describe('deriveAvailability — purity', () => {
  it('does not mutate the variant it is given', () => {
    const v = variantWith(3);
    const snapshot = JSON.stringify(v);
    deriveAvailability(v, drop, IN_EARLY, member);
    expect(JSON.stringify(v)).toBe(snapshot);
  });
});
