import type { Drop } from '@/lib/domain';

export const ACTIVE_DROP_ID = 'drp_void_genesis';

export const seedDrops: Drop[] = [
  {
    id: ACTIVE_DROP_ID,
    name: { en: 'VOID GENESIS', th: 'วอยด์ เจเนซิส' },
    // Early access for members opens, then the public LIVE flip, then close.
    earlyAccessAt: '2026-07-01T10:00:00.000Z',
    releaseAt: '2026-07-01T13:00:00.000Z',
    endAt: '2026-07-15T17:00:00.000Z',
  },
  {
    id: 'drp_neon_dusk',
    name: { en: 'NEON DUSK', th: 'นีออน ดัสก์' },
    earlyAccessAt: '2026-05-01T10:00:00.000Z',
    releaseAt: '2026-05-01T13:00:00.000Z',
    endAt: '2026-05-20T17:00:00.000Z',
  },
];
