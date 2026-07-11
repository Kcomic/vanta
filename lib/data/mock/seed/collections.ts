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
    heroImageUrl: '',
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
    heroImageUrl: '',
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
    heroImageUrl: '',
    productIds: ['prd_mono_longsleeve', 'prd_mono_pants', 'prd_mono_beanie', 'prd_mono_tote'],
  },
  {
    id: 'col_nightfall',
    slug: 'nightfall',
    title: { en: 'NIGHTFALL', th: 'ไนท์ฟอลล์' },
    description: {
      en: 'Pieces born after midnight — restless, dark, precise.',
      th: 'ชิ้นงานที่เกิดหลังเที่ยงคืน — คมชัด ดิบ และมืดสนิท',
    },
    heroImageUrl: '',
    productIds: ['prd_void_tee', 'prd_void_hoodie', 'prd_void_cargo', 'prd_void_cap'],
  },
];
