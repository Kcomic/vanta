import type { Product, ProductImage } from '@/lib/domain';

const thb = (amount: number) => ({ amount, currency: 'THB' as const });

const img = (id: string, color: string): ProductImage => ({
  id,
  url: `/images/products/${id}.jpg`,
  alt: { en: `${color} colorway`, th: `สี${color}` },
  width: 1200,
  height: 1600,
});

export const seedProducts: Product[] = [
  // 1 — VOID TEE (active drop)
  {
    id: 'prd_void_tee',
    slug: 'void-tee',
    title: { en: 'VOID TEE', th: 'วอยด์ ที' },
    description: {
      en: 'Heavyweight black tee with reflective VANTA mark.',
      th: 'เสื้อยืดสีดำเนื้อหนา พิมพ์โลโก้ VANTA สะท้อนแสง',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Black', 'Paper'] },
    variants: [
      {
        id: 'var_void_tee_s_black',
        sku: 'VNT-TEE-S-BLK',
        optionValues: { size: 'S', color: 'Black' },
        price: thb(129000),
        stock: 22,
        availability: 'live',
      },
      {
        id: 'var_void_tee_m_black',
        sku: 'VNT-TEE-M-BLK',
        optionValues: { size: 'M', color: 'Black' },
        price: thb(129000),
        stock: 18,
        availability: 'live',
      },
      // SOLD OUT (1/3): one size dead, product still buyable in others.
      {
        id: 'var_void_tee_l_black',
        sku: 'VNT-TEE-L-BLK',
        optionValues: { size: 'L', color: 'Black' },
        price: thb(129000),
        stock: 0,
        availability: 'sold_out',
      },
      {
        id: 'var_void_tee_s_paper',
        sku: 'VNT-TEE-S-PPR',
        optionValues: { size: 'S', color: 'Paper' },
        price: thb(129000),
        stock: 30,
        availability: 'live',
      },
      {
        id: 'var_void_tee_m_paper',
        sku: 'VNT-TEE-M-PPR',
        optionValues: { size: 'M', color: 'Paper' },
        price: thb(129000),
        stock: 25,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Black: [img('void-tee-black', 'Black')],
      Paper: [img('void-tee-paper', 'Paper')],
    },
    collectionIds: ['col_void'],
    dropId: 'drp_void_genesis',
  },
  // 2 — VOID HOODIE
  {
    id: 'prd_void_hoodie',
    slug: 'void-hoodie',
    title: { en: 'VOID HOODIE', th: 'วอยด์ ฮู้ดดี้' },
    description: {
      en: 'Boxy hoodie, brushed-back fleece, tonal embroidery.',
      th: 'ฮู้ดดี้ทรงกล่อง ผ้าฟลีซขัดด้านใน ปักโทนเดียว',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Black'] },
    variants: [
      {
        id: 'var_void_hoodie_s_black',
        sku: 'VNT-HOD-S-BLK',
        optionValues: { size: 'S', color: 'Black' },
        price: thb(249000),
        compareAtPrice: thb(299000),
        stock: 14,
        availability: 'live',
      },
      // LOW STOCK (1/4): 3 left.
      {
        id: 'var_void_hoodie_m_black',
        sku: 'VNT-HOD-M-BLK',
        optionValues: { size: 'M', color: 'Black' },
        price: thb(249000),
        compareAtPrice: thb(299000),
        stock: 3,
        availability: 'low_stock',
      },
      {
        id: 'var_void_hoodie_l_black',
        sku: 'VNT-HOD-L-BLK',
        optionValues: { size: 'L', color: 'Black' },
        price: thb(249000),
        compareAtPrice: thb(299000),
        stock: 11,
        availability: 'live',
      },
    ],
    imagesByColor: { Black: [img('void-hoodie-black', 'Black')] },
    collectionIds: ['col_void'],
  },
  // 3 — VOID CARGO
  {
    id: 'prd_void_cargo',
    slug: 'void-cargo',
    title: { en: 'VOID CARGO', th: 'วอยด์ คาร์โก้' },
    description: {
      en: 'Tactical cargo pant, articulated knee, smoke colorway.',
      th: 'กางเกงคาร์โก้สายลุย เข่าตัดต่อ โทนสโมก',
    },
    optionAxes: { size: ['M', 'L', 'XL'], color: ['Smoke'] },
    variants: [
      {
        id: 'var_void_cargo_m_smoke',
        sku: 'VNT-CRG-M-SMK',
        optionValues: { size: 'M', color: 'Smoke' },
        price: thb(289000),
        stock: 9,
        availability: 'live',
      },
      // LOW STOCK (2/4): 2 left.
      {
        id: 'var_void_cargo_l_smoke',
        sku: 'VNT-CRG-L-SMK',
        optionValues: { size: 'L', color: 'Smoke' },
        price: thb(289000),
        stock: 2,
        availability: 'low_stock',
      },
      {
        id: 'var_void_cargo_xl_smoke',
        sku: 'VNT-CRG-XL-SMK',
        optionValues: { size: 'XL', color: 'Smoke' },
        price: thb(289000),
        stock: 7,
        availability: 'live',
      },
    ],
    imagesByColor: { Smoke: [img('void-cargo-smoke', 'Smoke')] },
    collectionIds: ['col_void'],
  },
  // 4 — VOID CAP
  {
    id: 'prd_void_cap',
    slug: 'void-cap',
    title: { en: 'VOID CAP', th: 'วอยด์ แคป' },
    description: {
      en: 'Unstructured 6-panel cap, rubber VANTA badge.',
      th: 'หมวกแก๊ป 6 แผง ทรงนิ่ม แปะป้ายยาง VANTA',
    },
    optionAxes: { size: ['OS'], color: ['Black', 'Blaze'] },
    variants: [
      {
        id: 'var_void_cap_os_black',
        sku: 'VNT-CAP-OS-BLK',
        optionValues: { size: 'OS', color: 'Black' },
        price: thb(89000),
        stock: 40,
        availability: 'live',
      },
      {
        id: 'var_void_cap_os_blaze',
        sku: 'VNT-CAP-OS-BLZ',
        optionValues: { size: 'OS', color: 'Blaze' },
        price: thb(89000),
        stock: 35,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Black: [img('void-cap-black', 'Black')],
      Blaze: [img('void-cap-blaze', 'Blaze')],
    },
    collectionIds: ['col_void'],
  },
  // 5 — BKK JACKET
  {
    id: 'prd_bkk_jacket',
    slug: 'bangkok-coach-jacket',
    title: { en: 'BANGKOK COACH JACKET', th: 'แจ็คเก็ตโค้ช กรุงเทพฯ' },
    description: {
      en: 'Water-repellent coach jacket, blaze lining.',
      th: 'แจ็คเก็ตโค้ชกันน้ำ ซับในสีเบลซ',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Blaze'] },
    variants: [
      {
        id: 'var_bkk_jacket_s_ink',
        sku: 'VNT-JKT-S-INK',
        optionValues: { size: 'S', color: 'Ink' },
        price: thb(359000),
        stock: 8,
        availability: 'live',
      },
      {
        id: 'var_bkk_jacket_m_ink',
        sku: 'VNT-JKT-M-INK',
        optionValues: { size: 'M', color: 'Ink' },
        price: thb(359000),
        stock: 12,
        availability: 'live',
      },
      {
        id: 'var_bkk_jacket_l_ink',
        sku: 'VNT-JKT-L-INK',
        optionValues: { size: 'L', color: 'Ink' },
        price: thb(359000),
        stock: 6,
        availability: 'live',
      },
      // SOLD OUT (2/3).
      {
        id: 'var_bkk_jacket_m_blaze',
        sku: 'VNT-JKT-M-BLZ',
        optionValues: { size: 'M', color: 'Blaze' },
        price: thb(359000),
        stock: 0,
        availability: 'sold_out',
      },
      {
        id: 'var_bkk_jacket_l_blaze',
        sku: 'VNT-JKT-L-BLZ',
        optionValues: { size: 'L', color: 'Blaze' },
        price: thb(359000),
        stock: 10,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Ink: [img('bkk-jacket-ink', 'Ink')],
      Blaze: [img('bkk-jacket-blaze', 'Blaze')],
    },
    collectionIds: ['col_bangkok'],
  },
  // 6 — BKK TEE
  {
    id: 'prd_bkk_tee',
    slug: 'bangkok-graphic-tee',
    title: { en: 'BANGKOK GRAPHIC TEE', th: 'เสื้อยืดกราฟิก กรุงเทพฯ' },
    description: {
      en: 'Bilingual city-grid graphic, oversized fit.',
      th: 'กราฟิกกริดเมืองสองภาษา ทรงโอเวอร์ไซส์',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Paper', 'Ink'] },
    variants: [
      // LOW STOCK (3/4): 5 left (boundary of LOW_STOCK_THRESHOLD).
      {
        id: 'var_bkk_tee_s_paper',
        sku: 'VNT-BTE-S-PPR',
        optionValues: { size: 'S', color: 'Paper' },
        price: thb(119000),
        stock: 5,
        availability: 'low_stock',
      },
      {
        id: 'var_bkk_tee_m_paper',
        sku: 'VNT-BTE-M-PPR',
        optionValues: { size: 'M', color: 'Paper' },
        price: thb(119000),
        stock: 20,
        availability: 'live',
      },
      {
        id: 'var_bkk_tee_l_paper',
        sku: 'VNT-BTE-L-PPR',
        optionValues: { size: 'L', color: 'Paper' },
        price: thb(119000),
        stock: 16,
        availability: 'live',
      },
      {
        id: 'var_bkk_tee_m_ink',
        sku: 'VNT-BTE-M-INK',
        optionValues: { size: 'M', color: 'Ink' },
        price: thb(119000),
        stock: 24,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Paper: [img('bkk-tee-paper', 'Paper')],
      Ink: [img('bkk-tee-ink', 'Ink')],
    },
    collectionIds: ['col_bangkok'],
  },
  // 7 — BKK SHORTS
  {
    id: 'prd_bkk_shorts',
    slug: 'bangkok-nylon-shorts',
    title: { en: 'BANGKOK NYLON SHORTS', th: 'กางเกงขาสั้นไนลอน กรุงเทพฯ' },
    description: {
      en: 'Lightweight nylon shorts, zip pockets.',
      th: 'กางเกงขาสั้นไนลอนน้ำหนักเบา กระเป๋าซิป',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Smoke'] },
    variants: [
      {
        id: 'var_bkk_shorts_s_smoke',
        sku: 'VNT-SHT-S-SMK',
        optionValues: { size: 'S', color: 'Smoke' },
        price: thb(149000),
        stock: 15,
        availability: 'live',
      },
      {
        id: 'var_bkk_shorts_m_smoke',
        sku: 'VNT-SHT-M-SMK',
        optionValues: { size: 'M', color: 'Smoke' },
        price: thb(149000),
        stock: 19,
        availability: 'live',
      },
      {
        id: 'var_bkk_shorts_l_smoke',
        sku: 'VNT-SHT-L-SMK',
        optionValues: { size: 'L', color: 'Smoke' },
        price: thb(149000),
        stock: 13,
        availability: 'live',
      },
    ],
    imagesByColor: { Smoke: [img('bkk-shorts-smoke', 'Smoke')] },
    collectionIds: ['col_bangkok'],
  },
  // 8 — BKK SOCKS
  {
    id: 'prd_bkk_socks',
    slug: 'bangkok-rib-socks',
    title: { en: 'BANGKOK RIB SOCKS', th: 'ถุงเท้าริบ กรุงเทพฯ' },
    description: {
      en: 'Ribbed crew socks, two-pack, lime cuff stripe.',
      th: 'ถุงเท้าริบทรงครู แพ็คคู่ ขอบลายสีไลม์',
    },
    optionAxes: { size: ['OS'], color: ['Ink'] },
    variants: [
      {
        id: 'var_bkk_socks_os_ink',
        sku: 'VNT-SOK-OS-INK',
        optionValues: { size: 'OS', color: 'Ink' },
        price: thb(49000),
        stock: 60,
        availability: 'live',
      },
    ],
    imagesByColor: { Ink: [img('bkk-socks-ink', 'Ink')] },
    collectionIds: ['col_bangkok'],
  },
  // 9 — MONO LONGSLEEVE
  {
    id: 'prd_mono_longsleeve',
    slug: 'mono-longsleeve',
    title: { en: 'MONO LONGSLEEVE', th: 'โมโน ลองสลีฟ' },
    description: {
      en: 'Ribbed longsleeve base layer, tonal cuffs.',
      th: 'เสื้อแขนยาวริบเลเยอร์ ปลายแขนโทนเดียว',
    },
    optionAxes: { size: ['S', 'M', 'L'], color: ['Ink', 'Paper'] },
    variants: [
      {
        id: 'var_mono_longsleeve_s_ink',
        sku: 'VNT-MLS-S-INK',
        optionValues: { size: 'S', color: 'Ink' },
        price: thb(159000),
        stock: 17,
        availability: 'live',
      },
      // LOW STOCK (4/4): 1 left.
      {
        id: 'var_mono_longsleeve_m_ink',
        sku: 'VNT-MLS-M-INK',
        optionValues: { size: 'M', color: 'Ink' },
        price: thb(159000),
        stock: 1,
        availability: 'low_stock',
      },
      {
        id: 'var_mono_longsleeve_l_ink',
        sku: 'VNT-MLS-L-INK',
        optionValues: { size: 'L', color: 'Ink' },
        price: thb(159000),
        stock: 12,
        availability: 'live',
      },
      {
        id: 'var_mono_longsleeve_m_paper',
        sku: 'VNT-MLS-M-PPR',
        optionValues: { size: 'M', color: 'Paper' },
        price: thb(159000),
        stock: 21,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Ink: [img('mono-longsleeve-ink', 'Ink')],
      Paper: [img('mono-longsleeve-paper', 'Paper')],
    },
    collectionIds: ['col_mono'],
  },
  // 10 — MONO PANTS
  {
    id: 'prd_mono_pants',
    slug: 'mono-pleated-pants',
    title: { en: 'MONO PLEATED PANTS', th: 'โมโน กางเกงจีบ' },
    description: {
      en: 'Pleated wide-leg trouser, smoke and ink.',
      th: 'กางเกงขากว้างจับจีบ โทนสโมกและอิงค์',
    },
    optionAxes: { size: ['30', '32', '34'], color: ['Smoke', 'Ink'] },
    variants: [
      {
        id: 'var_mono_pants_30_smoke',
        sku: 'VNT-MPT-30-SMK',
        optionValues: { size: '30', color: 'Smoke' },
        price: thb(269000),
        stock: 9,
        availability: 'live',
      },
      // SOLD OUT (3/3).
      {
        id: 'var_mono_pants_32_smoke',
        sku: 'VNT-MPT-32-SMK',
        optionValues: { size: '32', color: 'Smoke' },
        price: thb(269000),
        stock: 0,
        availability: 'sold_out',
      },
      {
        id: 'var_mono_pants_34_smoke',
        sku: 'VNT-MPT-34-SMK',
        optionValues: { size: '34', color: 'Smoke' },
        price: thb(269000),
        stock: 7,
        availability: 'live',
      },
      {
        id: 'var_mono_pants_32_ink',
        sku: 'VNT-MPT-32-INK',
        optionValues: { size: '32', color: 'Ink' },
        price: thb(269000),
        stock: 11,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Smoke: [img('mono-pants-smoke', 'Smoke')],
      Ink: [img('mono-pants-ink', 'Ink')],
    },
    collectionIds: ['col_mono'],
  },
  // 11 — MONO BEANIE
  {
    id: 'prd_mono_beanie',
    slug: 'mono-beanie',
    title: { en: 'MONO BEANIE', th: 'โมโน บีนนี่' },
    description: {
      en: 'Fine-gauge cuffed beanie, woven tab.',
      th: 'หมวกบีนนี่ถักละเอียด มีแท็บทอ',
    },
    optionAxes: { size: ['OS'], color: ['Ink', 'Smoke'] },
    variants: [
      {
        id: 'var_mono_beanie_os_ink',
        sku: 'VNT-BNE-OS-INK',
        optionValues: { size: 'OS', color: 'Ink' },
        price: thb(79000),
        stock: 28,
        availability: 'live',
      },
      {
        id: 'var_mono_beanie_os_smoke',
        sku: 'VNT-BNE-OS-SMK',
        optionValues: { size: 'OS', color: 'Smoke' },
        price: thb(79000),
        stock: 22,
        availability: 'live',
      },
    ],
    imagesByColor: {
      Ink: [img('mono-beanie-ink', 'Ink')],
      Smoke: [img('mono-beanie-smoke', 'Smoke')],
    },
    collectionIds: ['col_mono'],
  },
  // 12 — MONO TOTE
  {
    id: 'prd_mono_tote',
    slug: 'mono-canvas-tote',
    title: { en: 'MONO CANVAS TOTE', th: 'โมโน กระเป๋าผ้าแคนวาส' },
    description: {
      en: 'Heavy canvas tote, screen-printed VANTA wordmark.',
      th: 'กระเป๋าผ้าแคนวาสเนื้อหนา สกรีนโลโก้ VANTA',
    },
    optionAxes: { size: ['OS'], color: ['Paper'] },
    variants: [
      {
        id: 'var_mono_tote_os_paper',
        sku: 'VNT-TOT-OS-PPR',
        optionValues: { size: 'OS', color: 'Paper' },
        price: thb(99000),
        stock: 45,
        availability: 'live',
      },
    ],
    imagesByColor: { Paper: [img('mono-tote-paper', 'Paper')] },
    collectionIds: ['col_mono'],
  },
];
