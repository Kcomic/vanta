import type { Drop } from '@/lib/domain';
import type { DropRepository } from '@/lib/data/repositories';
import { seedDrops } from './seed';

const clone = <T>(value: T): T => structuredClone(value);

export class MockDropRepository implements DropRepository {
  private drops: Drop[];

  constructor(seed: Drop[] = seedDrops) {
    this.drops = clone(seed);
  }

  async list(): Promise<Drop[]> {
    return clone(this.drops);
  }

  async getById(dropId: string): Promise<Drop | null> {
    const found = this.drops.find((d) => d.id === dropId);
    return found ? clone(found) : null;
  }

  async getActive(now: Date): Promise<Drop | null> {
    const nowMs = now.getTime();
    // Prefer a drop whose window actually CONTAINS now (earlyAccessAt <= now < endAt); among
    // several overlapping ones, the one ending soonest (the most urgent / current drop). Only
    // when none contain now, fall back to the soonest UPCOMING drop so demos always have a drop
    // to count down to. Ended drops are excluded from both.
    const active = this.drops
      .filter((d) => Date.parse(d.earlyAccessAt) <= nowMs && nowMs < Date.parse(d.endAt))
      .sort((a, b) => Date.parse(a.endAt) - Date.parse(b.endAt));
    if (active[0]) return clone(active[0]);

    const [soonest = null] = this.drops
      .filter((d) => nowMs < Date.parse(d.earlyAccessAt))
      .sort((a, b) => Date.parse(a.earlyAccessAt) - Date.parse(b.earlyAccessAt));
    return soonest ? clone(soonest) : null;
  }
}
