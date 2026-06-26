import type { Collection } from '@/lib/domain';

export const seedCollections: Collection[] = [
  {
    id: 'col_void',
    slug: 'the-void',
    title: { en: 'THE VOID', th: 'เดอะ วอยด์' },
    description: {
      en: 'Pieces that materialize out of pure black.',
      th: 'ชิ้นงานที่ก่อตัวขึ้นจากความมืดสนิท',
    },
    heroImageUrl: '/images/collections/void-hero.jpg',
    productIds: ['prd_void_tee', 'prd_void_hoodie', 'prd_void_cargo', 'prd_void_cap'],
  },
  {
    id: 'col_bangkok',
    slug: 'bangkok-born',
    title: { en: 'BANGKOK BORN', th: 'เกิดในกรุงเทพฯ' },
    description: {
      en: 'Streetwear from the city that never cools down.',
      th: 'สตรีทแวร์จากเมืองที่ไม่เคยเย็นลง',
    },
    heroImageUrl: '/images/collections/bangkok-hero.jpg',
    productIds: ['prd_bkk_jacket', 'prd_bkk_tee', 'prd_bkk_shorts', 'prd_bkk_socks'],
  },
  {
    id: 'col_mono',
    slug: 'monochrome',
    title: { en: 'MONOCHROME', th: 'โมโนโครม' },
    description: {
      en: 'Tonal essentials, engineered to layer.',
      th: 'เบสิกโทนเดียว ออกแบบมาเพื่อการเลเยอร์',
    },
    heroImageUrl: '/images/collections/mono-hero.jpg',
    productIds: ['prd_mono_longsleeve', 'prd_mono_pants', 'prd_mono_beanie', 'prd_mono_tote'],
  },
];
