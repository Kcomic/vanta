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
    // Return the drop whose window contains now, else the soonest upcoming drop
    // (not-yet-ended), else null — so demos always have a drop to count down to.
    const [first = null] = this.drops
      .filter((d) => nowMs < Date.parse(d.endAt))
      .sort((a, b) => Date.parse(a.earlyAccessAt) - Date.parse(b.earlyAccessAt));
    return first ? clone(first) : null;
  }
}
