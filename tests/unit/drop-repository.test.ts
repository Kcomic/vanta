import { describe, it, expect } from 'vitest';
import { MockDropRepository } from '@/lib/data/mock/drop-repository.mock';
import type { Drop } from '@/lib/domain';

function drop(id: string, early: string, release: string, end: string): Drop {
  return { id, name: { en: id, th: id }, earlyAccessAt: early, releaseAt: release, endAt: end };
}

describe('MockDropRepository.getActive', () => {
  const now = new Date('2026-06-27T12:00:00.000Z');

  it('prefers the drop whose window contains now (ending soonest) over a long-running earlier drop', async () => {
    // A: started earliest, ends far in the future — active but stale
    const A = drop('A', '2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z', '2026-12-31T00:00:00Z');
    // B: started later, also active now, ends soonest — the current, most-urgent drop
    const B = drop('B', '2026-06-25T00:00:00Z', '2026-06-26T00:00:00Z', '2026-06-28T00:00:00Z');
    const repo = new MockDropRepository([A, B]);
    expect((await repo.getActive(now))?.id).toBe('B');
  });

  it('ignores ended drops and returns the active one', async () => {
    const ended = drop('ended', '2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z', '2026-06-10T00:00:00Z');
    const active = drop('active', '2026-06-26T00:00:00Z', '2026-06-27T00:00:00Z', '2026-06-30T00:00:00Z');
    const repo = new MockDropRepository([ended, active]);
    expect((await repo.getActive(now))?.id).toBe('active');
  });

  it('falls back to the soonest upcoming drop when none contain now', async () => {
    const soon = drop('soon', '2026-06-28T00:00:00Z', '2026-06-29T00:00:00Z', '2026-07-05T00:00:00Z');
    const later = drop('later', '2026-07-10T00:00:00Z', '2026-07-11T00:00:00Z', '2026-07-20T00:00:00Z');
    const repo = new MockDropRepository([later, soon]);
    expect((await repo.getActive(now))?.id).toBe('soon');
  });

  it('returns null when every drop has already ended', async () => {
    const ended = drop('ended', '2026-06-01T00:00:00Z', '2026-06-02T00:00:00Z', '2026-06-10T00:00:00Z');
    expect(await new MockDropRepository([ended]).getActive(now)).toBeNull();
  });
});
