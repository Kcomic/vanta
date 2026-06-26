import type { Order } from '@/lib/domain';

const thb = (amount: number) => ({ amount, currency: 'THB' as const });

export const seedOrders: Order[] = [
  {
    id: 'ord_seed_demo',
    userId: 'usr_member',
    status: 'paid',
    lineItems: [
      {
        variantId: 'var_void_tee_m_black',
        sku: 'VNT-TEE-M-BLK',
        title: { en: 'VOID TEE', th: 'วอยด์ ที' },
        optionValues: { size: 'M', color: 'Black' },
        unitPrice: thb(129000),
        quantity: 1,
        imageUrl: '/images/products/void-tee-black.jpg',
      },
      {
        variantId: 'var_void_hoodie_l_black',
        sku: 'VNT-HOD-L-BLK',
        title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
        optionValues: { size: 'L', color: 'Black' },
        unitPrice: thb(249000),
        quantity: 1,
        imageUrl: '/images/products/void-hoodie-black.jpg',
      },
    ],
    totals: {
      subtotal: thb(378000),
      shipping: thb(0),
      total: thb(378000),
    },
    shippingAddress: {
      id: 'adr_member_1',
      fullName: 'Somchai Member',
      line1: '88 Sukhumvit Soi 11',
      line2: 'Unit 12A',
      city: 'Bangkok',
      postalCode: '10110',
      country: 'TH',
      phone: '+66 80 000 0000',
    },
    email: 'member@vanta.shop',
    placedAt: '2026-06-20T08:15:00.000Z',
  },
];
