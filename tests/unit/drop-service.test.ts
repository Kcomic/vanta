import { describe, it, expect } from 'vitest';
import { dropService } from '@/lib/services/drop-service';

describe('dropService', () => {
  it('getActiveDrop returns a drop whose window has not closed', async () => {
    const drop = await dropService.getActiveDrop();
    expect(drop).not.toBeNull();
    expect(Date.parse(drop!.endAt)).toBeGreaterThan(Date.now());
  });

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
