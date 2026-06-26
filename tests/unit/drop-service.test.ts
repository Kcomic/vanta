import { describe, it, expect } from 'vitest';
import { MockDropRepository } from '@/lib/data/mock/drop-repository.mock';
import { seedDrops, ACTIVE_DROP_ID } from '@/lib/data/mock/seed';
import { dropService } from '@/lib/services/drop-service';

// Fixed "now" well inside the VOID GENESIS window (earlyAccessAt → endAt).
const NOW_IN_WINDOW = new Date('2026-07-05T12:00:00.000Z');

describe('MockDropRepository.getActive — stable clock injection', () => {
  const repo = new MockDropRepository();

  it('returns the expected upcoming drop when now is before its window', async () => {
    // now is before earlyAccessAt of VOID GENESIS — it's the soonest not-yet-ended drop.
    const before = new Date('2026-06-30T00:00:00.000Z');
    const drop = await repo.getActive(before);
    expect(drop?.id).toBe(ACTIVE_DROP_ID);
  });

  it('returns VOID GENESIS when now is inside the window', async () => {
    const drop = await repo.getActive(NOW_IN_WINDOW);
    expect(drop?.id).toBe(ACTIVE_DROP_ID);
    // Structural invariant: endAt must be after earlyAccessAt.
    expect(Date.parse(drop!.endAt)).toBeGreaterThan(Date.parse(drop!.earlyAccessAt));
  });

  it('returns null when all drops have ended', async () => {
    // A date after every seed drop's endAt.
    const past = new Date('2030-01-01T00:00:00.000Z');
    const drop = await repo.getActive(past);
    expect(drop).toBeNull();
  });
});

describe('dropService', () => {
  it('getDropById resolves the active drop by id', async () => {
    const drop = await dropService.getDropById('drp_void_genesis');
    expect(drop?.name.en).toBe('VOID GENESIS');
  });

  it('getDropById returns null for an unknown id', async () => {
    expect(await dropService.getDropById('drp_nope')).toBeNull();
  });

  it('getDropProducts returns only products belonging to the drop', async () => {
    const productsInDrop = await dropService.getDropProducts('drp_void_genesis');
    expect(productsInDrop.length).toBeGreaterThan(0);
    expect(productsInDrop.every((p) => p.dropId === 'drp_void_genesis')).toBe(true);
  });
});

describe('seed drop data — structural invariants', () => {
  it('every seed drop has earlyAccessAt < releaseAt < endAt', () => {
    for (const drop of seedDrops) {
      expect(Date.parse(drop.earlyAccessAt)).toBeLessThan(Date.parse(drop.releaseAt));
      expect(Date.parse(drop.releaseAt)).toBeLessThan(Date.parse(drop.endAt));
    }
  });
});
